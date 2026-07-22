import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { METRICOOL_BASE_URL, type MetricoolApiRequestOptions } from './types';

type MetricoolContext = IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions;

function unwrapResponse(data: unknown): unknown {
	if (data === null || data === undefined) {
		return data;
	}
	if (typeof data !== 'object') {
		return data;
	}
	const obj = data as IDataObject;
	if ('data' in obj) {
		return obj.data;
	}
	return data;
}

function getHttpCode(error: unknown): string | undefined {
	if (!error || typeof error !== 'object') {
		return undefined;
	}
	const err = error as {
		httpCode?: string | number;
		statusCode?: string | number;
		status?: string | number;
		response?: { status?: number; statusCode?: number };
	};
	const code =
		err.httpCode ?? err.statusCode ?? err.status ?? err.response?.status ?? err.response?.statusCode;
	return code !== undefined ? String(code) : undefined;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return undefined;
	}
	return value as Record<string, unknown>;
}

/** Pull Metricool / axios / n8n nested error payloads without secrets. */
function extractApiErrorBody(error: unknown): unknown {
	const err = asRecord(error);
	if (!err) {
		return undefined;
	}

	const candidates: unknown[] = [
		err.errorResponse,
		err.response,
		asRecord(err.response)?.body,
		asRecord(err.response)?.data,
		err.data,
		err.body,
		err.cause,
		asRecord(err.cause)?.message,
		asRecord(err.cause)?.response,
		asRecord(asRecord(err.cause)?.response)?.data,
		err.description,
		err.message,
	];

	for (const candidate of candidates) {
		if (candidate === undefined || candidate === null || candidate === '') {
			continue;
		}
		if (typeof candidate === 'string') {
			const trimmed = candidate.trim();
			if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
				try {
					return JSON.parse(trimmed);
				} catch {
					return trimmed;
				}
			}
			// Prefer structured bodies over generic axios strings when possible
			if (!/^Request failed with status code \d+$/i.test(trimmed)) {
				// keep scanning for structured body; remember as fallback below
			}
		} else if (typeof candidate === 'object') {
			const rec = asRecord(candidate);
			if (rec && ('detail' in rec || 'title' in rec || 'status' in rec || 'message' in rec || 'error' in rec)) {
				return candidate;
			}
			if (rec && ('body' in rec || 'data' in rec)) {
				const nested = rec.body ?? rec.data;
				if (nested !== undefined && nested !== null && nested !== '') {
					return nested;
				}
			}
		}
	}

	for (const candidate of candidates) {
		if (typeof candidate === 'string' && candidate.trim()) {
			return candidate.trim();
		}
	}

	return undefined;
}

function summarizeApiBody(body: unknown): string {
	if (body === undefined || body === null) {
		return '';
	}
	if (typeof body === 'string') {
		return body.length > 800 ? `${body.slice(0, 800)}…` : body;
	}
	const rec = asRecord(body);
	if (rec) {
		const parts: string[] = [];
		for (const key of ['status', 'code', 'title', 'detail', 'message', 'error', 'path']) {
			if (rec[key] !== undefined && rec[key] !== null && String(rec[key]).trim() !== '') {
				parts.push(`${key}=${String(rec[key])}`);
			}
		}
		if (parts.length) {
			return parts.join(' | ');
		}
	}
	try {
		const raw = JSON.stringify(body);
		return raw.length > 800 ? `${raw.slice(0, 800)}…` : raw;
	} catch {
		return String(body);
	}
}

function formatQueryForDebug(qs: IDataObject): string {
	const parts: string[] = [];
	for (const [key, value] of Object.entries(qs)) {
		if (value === undefined || value === null || value === '') {
			continue;
		}
		parts.push(`${key}=${String(value)}`);
	}
	return parts.length ? parts.join('&') : '(none)';
}

/** Encode like the Metricool web app (`+` → %2B, `/` → %2F). */
export function encodeMetricoolQuery(qs: IDataObject): string {
	const parts: string[] = [];
	for (const [key, value] of Object.entries(qs)) {
		if (value === undefined || value === null || value === '') {
			continue;
		}
		if (Array.isArray(value)) {
			for (const item of value) {
				if (item === undefined || item === null || item === '') {
					continue;
				}
				parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
			}
			continue;
		}
		parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
	}
	return parts.join('&');
}

function appendEncodedQuery(endpoint: string, qs: IDataObject): string {
	const encoded = encodeMetricoolQuery(qs);
	if (!encoded) {
		return endpoint;
	}
	return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${encoded}`;
}

function hintForStatus(httpCode: string | undefined, qs: IDataObject): string {
	if (httpCode === '400') {
		return 'Invalid request parameters. For media upload, Metricool expects resourceType planner (not image/video) and valid part hashes.';
	}
	if (httpCode === '401') {
		return 'Check User Token (X-Mc-Auth) and User ID in credentials.';
	}
	if (httpCode === '403') {
		const network = qs.network ? String(qs.network) : undefined;
		const subject = qs.subject ? String(qs.subject) : undefined;
		const metric = qs.metric ? String(qs.metric) : undefined;
		if (network || subject || metric) {
			return [
				'Credentials were accepted, but Metricool denied this call.',
				'Typical causes: brand has no connection for this network, invalid subject/metric pair, or insufficient plan permissions.',
				'Try Analytics → Get Available Metrics, or another network/subject/metric combination.',
			].join(' ');
		}
		return 'Credentials were accepted, but Metricool denied this call. Check Brand (blogId) access and connected networks.';
	}
	if (httpCode === '404') {
		return 'Check Brand (blogId) and other resource IDs.';
	}
	if (httpCode === '429') {
		return 'Wait and retry; Metricool rate-limited this request.';
	}
	if (httpCode === '500' || httpCode === '502' || httpCode === '503') {
		return 'Metricool server error — often an unsupported metric/subject/network combo or temporary outage. Retry with a different metric or a wider date range.';
	}
	return '';
}

function buildErrorDescription(options: {
	httpCode?: string;
	method: string;
	endpoint: string;
	qs: IDataObject;
	apiBody: unknown;
	originalMessage?: string;
}): string {
	const lines: string[] = [];
	lines.push(`HTTP ${options.httpCode ?? 'unknown'} ${options.method} ${options.endpoint}`);
	lines.push(`Query: ${formatQueryForDebug(options.qs)}`);

	const summary = summarizeApiBody(options.apiBody);
	if (summary) {
		lines.push(`Response: ${summary}`);
	} else if (options.originalMessage) {
		lines.push(`Upstream: ${options.originalMessage}`);
	}

	const hint = hintForStatus(options.httpCode, options.qs);
	if (hint) {
		lines.push(`Hint: ${hint}`);
	}

	return lines.join('\n');
}

function messageForStatus(httpCode: string | undefined): string | undefined {
	switch (httpCode) {
		case '400':
			return 'Bad request';
		case '401':
			return 'Authentication failed';
		case '403':
			return 'Access forbidden';
		case '404':
			return 'Resource not found';
		case '429':
			return 'Rate limit exceeded';
		case '500':
		case '502':
		case '503':
			return `Metricool server error (${httpCode})`;
		default:
			return undefined;
	}
}

function getLogger(ctx: MetricoolContext): { error: (msg: string, meta?: IDataObject) => void } | undefined {
	const maybe = ctx as MetricoolContext & {
		logger?: { error?: (msg: string, meta?: IDataObject) => void };
	};
	if (maybe.logger && typeof maybe.logger.error === 'function') {
		return { error: maybe.logger.error.bind(maybe.logger) };
	}
	return undefined;
}

export async function metricoolApiRequest(
	this: MetricoolContext,
	options: MetricoolApiRequestOptions,
): Promise<unknown> {
	const credentials = await this.getCredentials('metricoolApi');
	const userId = String(credentials.userId ?? '').trim();

	const qs: IDataObject = {
		userId,
		...(options.qs ?? {}),
	};

	if (options.includeBlogId !== false && options.blogId !== undefined && options.blogId !== '') {
		qs.blogId = options.blogId;
	}

	const requestOptions: IHttpRequestOptions = {
		method: options.method as IHttpRequestMethods,
		baseURL: METRICOOL_BASE_URL,
		// Build the query ourselves so `+` in offsets becomes `%2B` (web-app parity).
		// Passing `qs` through some serializers can turn `+00:00` into a space.
		url: appendEncodedQuery(options.endpoint, qs),
		body: options.body as IHttpRequestOptions['body'],
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(options.headers ?? {}),
		},
		json: options.json !== false,
		encoding: options.encoding,
	};

	try {
		const response = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'metricoolApi',
			requestOptions,
		);
		return unwrapResponse(response);
	} catch (error) {
		const httpCode = getHttpCode(error);
		const apiBody = extractApiErrorBody(error);
		const originalMessage =
			error instanceof Error
				? error.message
				: typeof asRecord(error)?.message === 'string'
					? String(asRecord(error)?.message)
					: undefined;

		const description = buildErrorDescription({
			httpCode,
			method: options.method,
			endpoint: options.endpoint,
			qs,
			apiBody,
			originalMessage,
		});

		getLogger(this)?.error('Metricool API request failed', {
			httpCode,
			method: options.method,
			endpoint: options.endpoint,
			query: formatQueryForDebug(qs),
			response: summarizeApiBody(apiBody) || originalMessage || '',
		});

		const errorOptions: {
			itemIndex?: number;
			message?: string;
			description?: string;
			httpCode?: string;
		} = {
			description,
		};

		if (options.itemIndex !== undefined) {
			errorOptions.itemIndex = options.itemIndex;
		}
		if (httpCode) {
			errorOptions.httpCode = httpCode;
		}

		const friendly = messageForStatus(httpCode);
		if (friendly) {
			errorOptions.message = friendly;
		}

		// Never pass the raw HTTP error into NodeApiError — it often contains circular
		// socket/response refs and breaks n8n's JSON serialization.
		const safeError: JsonObject = {
			message: friendly || originalMessage || 'Metricool API request failed',
			httpCode: httpCode ?? '',
			description,
			response: summarizeApiBody(apiBody) || '',
		};

		throw new NodeApiError(this.getNode(), safeError, errorOptions);
	}
}

/** Build swagger-style PATCH `fields` query from body object keys. */
export function fieldsFromBody(body: Record<string, unknown>): string[] {
	return Object.keys(body);
}

/**
 * Ensure a PATCH body has at least one key so required swagger `fields` query is non-empty.
 */
export function assertPatchFields(
	this: IExecuteFunctions,
	body: Record<string, unknown>,
	itemIndex: number,
	message = 'Provide at least one field to update in JSON Body',
): string[] {
	const fields = fieldsFromBody(body);
	if (fields.length === 0) {
		throw new NodeOperationError(this.getNode(), message, { itemIndex });
	}
	return fields;
}

/**
 * Parse a JSON parameter that may be an object or array (swagger array bodies).
 * Already-parsed objects/arrays are returned as-is.
 */
export function parseJsonValue(value: unknown, fallback: string = '{}'): unknown {
	if (typeof value === 'object' && value !== null) {
		return value;
	}
	const raw = typeof value === 'string' ? value : String(value ?? '');
	const trimmed = raw.trim() || fallback;
	return JSON.parse(trimmed) as unknown;
}

/** Throw a NodeOperationError for an unsupported resource operation */
export function throwUnknownOperation(
	this: IExecuteFunctions,
	resource: string,
	operation: string,
	itemIndex: number,
): never {
	throw new NodeOperationError(
		this.getNode(),
		`The operation "${operation}" is not supported for resource "${resource}"`,
		{
			itemIndex,
			description: 'Check the Resource and Operation parameters on the node.',
		},
	);
}

/** Resolve blogId from a resourceLocator or string parameter */
export function getBlogId(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	itemIndex = 0,
	parameterName = 'blogId',
): string {
	const raw = this.getNodeParameter(parameterName, itemIndex) as
		| string
		| number
		| { value: string | number };
	if (typeof raw === 'object' && raw !== null && 'value' in raw) {
		return String(raw.value);
	}
	return String(raw);
}

export function returnJsonArray(
	data: unknown,
	itemIndex: number,
): Array<{ json: IDataObject; pairedItem: { item: number } }> {
	if (Array.isArray(data)) {
		if (data.length === 0) {
			return [{ json: {}, pairedItem: { item: itemIndex } }];
		}
		return data.map((entry) => ({
			json: (typeof entry === 'object' && entry !== null ? entry : { value: entry }) as IDataObject,
			pairedItem: { item: itemIndex },
		}));
	}
	if (data === undefined || data === null) {
		return [{ json: { value: null }, pairedItem: { item: itemIndex } }];
	}
	if (typeof data === 'object') {
		return [{ json: data as IDataObject, pairedItem: { item: itemIndex } }];
	}
	return [{ json: { value: data }, pairedItem: { item: itemIndex } }];
}
