import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { listAnalyticsCatalog } from '../../helpers/analyticsMetricsCatalog';
import { resolveBrandTimezone, toMetricoolQueryDateTime } from '../../helpers/dates';
import { toAnalyticsNetwork } from '../../helpers/networkCodes';
import { getBlogId, metricoolApiRequest, returnJsonArray, throwUnknownOperation } from '../../GenericFunctions';

async function buildDateQuery(
	this: IExecuteFunctions,
	itemIndex: number,
	blogId: string,
): Promise<{ from: string; to: string; timezone: string }> {
	const timezone = await resolveBrandTimezone.call(this, itemIndex, blogId);
	// Web app shape: from=2026-03-01T00:00:00-06:00&timezone=America/Mexico_City
	const from = toMetricoolQueryDateTime(this.getNodeParameter('from', itemIndex) as string, timezone);
	const to = toMetricoolQueryDateTime(this.getNodeParameter('to', itemIndex) as string, timezone);
	return { from, to, timezone };
}

async function buildMetricQuery(
	this: IExecuteFunctions,
	itemIndex: number,
	blogId: string,
): Promise<Record<string, string>> {
	const network = toAnalyticsNetwork(this.getNodeParameter('network', itemIndex) as string);
	const metric = this.getNodeParameter('metric', itemIndex) as string;
	const subject = this.getNodeParameter('subject', itemIndex) as string;
	const scope = (this.getNodeParameter('scope', itemIndex, '') as string).trim();
	const { from, to, timezone } = await buildDateQuery.call(this, itemIndex, blogId);
	const qs: Record<string, string> = { network, metric, subject, from, to, timezone };
	if (scope) {
		qs.scope = scope;
	}
	return qs;
}

export async function executeAnalytics(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;

	if (operation === 'getAvailableMetrics') {
		const network = this.getNodeParameter('network', itemIndex) as string;
		const rows = listAnalyticsCatalog(network);
		return returnJsonArray(
			{
				network,
				subjects: rows.map((row) => ({
					subject: row.subject,
					metrics: row.metrics,
				})),
				note: 'These codes match /v2/analytics aggregation, timeline, and distribution when sent with the subject query parameter.',
			},
			itemIndex,
		);
	}

	const blogId = getBlogId.call(this, itemIndex);

	if (operation === 'getAggregation') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/analytics/aggregation',
			blogId,
			qs: await buildMetricQuery.call(this, itemIndex, blogId),
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'getTimeline') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/analytics/timelines',
			blogId,
			qs: await buildMetricQuery.call(this, itemIndex, blogId),
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'getDistribution') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/analytics/distribution',
			blogId,
			qs: await buildMetricQuery.call(this, itemIndex, blogId),
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'getBrandSummaryPosts') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/analytics/brand-summary/posts',
			blogId,
			qs: await buildDateQuery.call(this, itemIndex, blogId),
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'getNetworkPosts') {
		const network = this.getNodeParameter('network', itemIndex) as string;
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/analytics/posts/${network}`,
			blogId,
			qs: await buildDateQuery.call(this, itemIndex, blogId),
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'getReels') {
		const network = this.getNodeParameter('network', itemIndex) as string;
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/analytics/reels/${network}`,
			blogId,
			qs: await buildDateQuery.call(this, itemIndex, blogId),
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'getStories') {
		const network = this.getNodeParameter('network', itemIndex) as string;
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/analytics/stories/${network}`,
			blogId,
			qs: await buildDateQuery.call(this, itemIndex, blogId),
		});
		return returnJsonArray(data, itemIndex);
	}

	return throwUnknownOperation.call(this, 'analytics', operation, itemIndex);
}
