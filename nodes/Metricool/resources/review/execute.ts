import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { resolveBrandTimezone, toMetricoolQueryDateTime } from '../../helpers/dates';
import { toReviewProvider } from '../../helpers/networkCodes';
import { getBlogId, metricoolApiRequest, returnJsonArray, throwUnknownOperation } from '../../GenericFunctions';

function parseJson(value: unknown): IDataObject {
	if (!value || value === '{}') return {};
	if (typeof value === 'object') return value as IDataObject;
	return JSON.parse(value as string) as IDataObject;
}

function parseReplyBody(context: IExecuteFunctions, itemIndex: number): IDataObject {
	const body = parseJson(context.getNodeParameter('replyBody', itemIndex, '{}'));
	const provider = body.provider;
	const reviewId = body.reviewId;
	if (provider === undefined || provider === null || provider === '') {
		throw new NodeOperationError(context.getNode(), 'Reply Body requires provider', {
			itemIndex,
			description: 'Use an API token (GMB) or UI code (googleBusinessProfile)',
		});
	}
	if (reviewId === undefined || reviewId === null || reviewId === '') {
		throw new NodeOperationError(context.getNode(), 'Reply Body requires reviewId', { itemIndex });
	}
	return {
		...body,
		provider: toReviewProvider(String(provider)),
	};
}

export async function executeReview(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const blogId = getBlogId.call(this, itemIndex);

	if (operation === 'getAll') {
		const provider = toReviewProvider(this.getNodeParameter('provider', itemIndex) as string);
		const additional = parseJson(this.getNodeParameter('additionalQuery', itemIndex, '{}'));
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/inbox/reviews',
			blogId,
			qs: { provider, ...additional },
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'reply') {
		const body = parseReplyBody(this, itemIndex);
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'POST',
			endpoint: '/v2/inbox/reviews/replies',
			blogId,
			body,
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'deleteReply') {
		const body = parseReplyBody(this, itemIndex);
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'DELETE',
			endpoint: '/v2/inbox/reviews/replies',
			blogId,
			body,
		});
		return returnJsonArray({ deleted: true }, itemIndex);
	}

	if (operation === 'getGbp') {
		const timezone = await resolveBrandTimezone.call(this, itemIndex, blogId);
		const from = toMetricoolQueryDateTime(this.getNodeParameter('from', itemIndex) as string, timezone);
		const to = toMetricoolQueryDateTime(this.getNodeParameter('to', itemIndex) as string, timezone);
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/analytics/reviews/gbp',
			blogId,
			qs: { from, to, timezone },
		});
		return returnJsonArray(data, itemIndex);
	}

	return throwUnknownOperation.call(this, 'review', operation, itemIndex);
}
