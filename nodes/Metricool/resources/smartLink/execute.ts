import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { resolveBrandTimezone, toMetricoolQueryDateTime } from '../../helpers/dates';
import { getBlogId, metricoolApiRequest, returnJsonArray, throwUnknownOperation } from '../../GenericFunctions';

function parseJson(value: unknown): IDataObject {
	if (typeof value === 'object' && value !== null) return value as IDataObject;
	return JSON.parse((value as string) || '{}') as IDataObject;
}

export async function executeSmartLink(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const blogId = getBlogId.call(this, itemIndex);

	if (operation === 'getAll') {
		const slug = this.getNodeParameter('slug', itemIndex, '') as string;
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/smart-links/links',
			blogId,
			qs: slug ? { slug } : {},
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'create' || operation === 'update') {
		const name = this.getNodeParameter('name', itemIndex, '') as string;
		const contentRaw = this.getNodeParameter('contentJson', itemIndex, '{}');
		const appearanceRaw = this.getNodeParameter('appearanceJson', itemIndex, '{}');
		const content = parseJson(contentRaw);
		const appearance = parseJson(appearanceRaw);
		const contentIsEmpty =
			(typeof contentRaw === 'string' && contentRaw.trim() === '{}') ||
			(typeof content === 'object' && content !== null && Object.keys(content).length === 0);
		const appearanceIsEmpty =
			(typeof appearanceRaw === 'string' && appearanceRaw.trim() === '{}') ||
			(typeof appearance === 'object' &&
				appearance !== null &&
				Object.keys(appearance).length === 0);

		if (operation === 'create') {
			const body: IDataObject = {
				name,
				content,
				appearance,
				slug: this.getNodeParameter('slug', itemIndex, ''),
			};
			const data = await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'POST',
				endpoint: '/v2/smart-links/links',
				blogId,
				body,
			});
			return returnJsonArray(data, itemIndex);
		}

		const body: IDataObject = {};
		if (name.trim()) {
			body.name = name;
		}
		const slug = (this.getNodeParameter('slug', itemIndex, '') as string).trim();
		if (slug) {
			body.slug = slug;
		}
		if (!contentIsEmpty) {
			body.content = content;
		}
		if (!appearanceIsEmpty) {
			body.appearance = appearance;
		}
		const id = this.getNodeParameter('smartLinkId', itemIndex) as string;
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PUT',
			endpoint: `/v2/smart-links/links/${id}`,
			blogId,
			body,
		});
		return returnJsonArray(data, itemIndex);
	}

	const id = this.getNodeParameter('smartLinkId', itemIndex) as string;

	if (operation === 'get') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/smart-links/links/${id}`,
			blogId,
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'delete') {
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'DELETE',
			endpoint: `/v2/smart-links/links/${id}`,
			blogId,
		});
		return returnJsonArray({ deleted: true }, itemIndex);
	}

	if (operation === 'getAnalytics') {
		const analyticsType = this.getNodeParameter('analyticsType', itemIndex) as string;
		const timezone = await resolveBrandTimezone.call(this, itemIndex, blogId);
		const from = toMetricoolQueryDateTime(this.getNodeParameter('from', itemIndex) as string, timezone);
		const to = toMetricoolQueryDateTime(this.getNodeParameter('to', itemIndex) as string, timezone);
		const qs: IDataObject = { from, to };
		if (analyticsType === 'timeline') {
			const metric = (this.getNodeParameter('metric', itemIndex, '') as string).trim();
			if (!metric) {
				throw new NodeOperationError(
					this.getNode(),
					'Metric is required when Analytics Type is Timeline',
					{ itemIndex },
				);
			}
			qs.metric = metric;
			const itemId = (this.getNodeParameter('itemId', itemIndex, '') as string).trim();
			if (itemId) {
				qs.itemId = Number(itemId) || itemId;
			}
		}
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/smart-links/links/${id}/analytics/${analyticsType}`,
			blogId,
			qs,
		});
		return returnJsonArray(data, itemIndex);
	}

	return throwUnknownOperation.call(this, 'smartLink', operation, itemIndex);
}
