import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { resolveBrandTimezone, toMetricoolQueryDateTime } from '../../helpers/dates';
import { getBlogId, metricoolApiRequest, returnJsonArray, throwUnknownOperation } from '../../GenericFunctions';

function parseJson(value: unknown): IDataObject {
	if (typeof value === 'object' && value !== null) return value as IDataObject;
	return JSON.parse((value as string) || '{}') as IDataObject;
}

async function buildDateQuery(
	this: IExecuteFunctions,
	itemIndex: number,
	blogId: string,
): Promise<{ from: string; to: string; timezone: string }> {
	const timezone = await resolveBrandTimezone.call(this, itemIndex, blogId);
	const from = toMetricoolQueryDateTime(this.getNodeParameter('from', itemIndex) as string, timezone);
	const to = toMetricoolQueryDateTime(this.getNodeParameter('to', itemIndex) as string, timezone);
	return { from, to, timezone };
}

export async function executeAds(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const blogId = getBlogId.call(this, itemIndex);

	const listGets: Record<string, string> = {
		getAds: '/v2/advertising/ads',
		getCampaigns: '/v2/advertising/campaigns',
		getAdgroups: '/v2/advertising/adgroups',
		getKeywords: '/v2/advertising/keywords',
	};

	if (listGets[operation]) {
		const { from, to, timezone } = await buildDateQuery.call(this, itemIndex, blogId);
		const extra = parseJson(this.getNodeParameter('additionalQuery', itemIndex, '{}'));
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'GET',
				endpoint: listGets[operation],
				blogId,
				qs: { from, to, timezone, ...extra },
			}),
			itemIndex,
		);
	}

	if (operation === 'getGoogleAdsCampaigns') {
		const { from, to, timezone } = await buildDateQuery.call(this, itemIndex, blogId);
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'GET',
				endpoint: '/v2/analytics/campaigns/googleads',
				blogId,
				qs: { from, to, timezone },
			}),
			itemIndex,
		);
	}

	if (operation === 'getFacebookAdsCampaigns') {
		const { from, to, timezone } = await buildDateQuery.call(this, itemIndex, blogId);
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'GET',
				endpoint: '/v2/analytics/campaigns/facebookads',
				blogId,
				qs: { from, to, timezone },
			}),
			itemIndex,
		);
	}

	if (operation === 'getTiktokAdsCampaigns') {
		const { from, to, timezone } = await buildDateQuery.call(this, itemIndex, blogId);
		const metricsRaw = (this.getNodeParameter('metrics', itemIndex) as string).trim();
		const metrics = metricsRaw
			.split(',')
			.map((m) => m.trim())
			.filter(Boolean);
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'GET',
				endpoint: '/v2/analytics/campaigns/tiktokads',
				blogId,
				qs: { from, to, timezone, 'metrics[]': metrics },
			}),
			itemIndex,
		);
	}

	const campaignId = this.getNodeParameter('campaignId', itemIndex) as string;
	const metric = this.getNodeParameter('metric', itemIndex) as string;
	const network = this.getNodeParameter('network', itemIndex) as string;
	const { from, to, timezone } = await buildDateQuery.call(this, itemIndex, blogId);

	if (operation === 'getCampaignAggregation') {
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'GET',
				endpoint: `/v2/analytics/campaigns/${campaignId}/aggregation`,
				blogId,
				qs: { from, to, timezone, metric, network },
			}),
			itemIndex,
		);
	}

	if (operation === 'getCampaignTimeline') {
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'GET',
				endpoint: `/v2/analytics/campaigns/${campaignId}/timelines`,
				blogId,
				qs: { from, to, timezone, metric, network },
			}),
			itemIndex,
		);
	}

	return throwUnknownOperation.call(this, 'ads', operation, itemIndex);
}
