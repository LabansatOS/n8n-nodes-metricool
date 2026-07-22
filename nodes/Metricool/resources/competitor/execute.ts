import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { resolveBrandTimezone, toMetricoolQueryDateTime } from '../../helpers/dates';
import { getBlogId, metricoolApiRequest, returnJsonArray, throwUnknownOperation } from '../../GenericFunctions';

export async function executeCompetitor(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const blogId = getBlogId.call(this, itemIndex);
	const network = this.getNodeParameter('network', itemIndex) as string;

	if (operation === 'getAll') {
		const timezone = await resolveBrandTimezone.call(this, itemIndex, blogId);
		const from = toMetricoolQueryDateTime(this.getNodeParameter('from', itemIndex) as string, timezone);
		const to = toMetricoolQueryDateTime(this.getNodeParameter('to', itemIndex) as string, timezone);
		const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/analytics/competitors/${network}`,
			blogId,
			qs: { from, to, timezone, limit },
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'add') {
		const id = this.getNodeParameter('competitorId', itemIndex) as string;
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'POST',
			endpoint: `/v2/analytics/competitors/${network}`,
			blogId,
			qs: { id },
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'remove') {
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'DELETE',
			endpoint: `/v2/analytics/competitors/${network}`,
			blogId,
			qs: { competitorId: this.getNodeParameter('competitorId', itemIndex) },
		});
		return returnJsonArray({ deleted: true }, itemIndex);
	}

	if (operation === 'setFavorite') {
		const competitorId = this.getNodeParameter('competitorId', itemIndex) as string;
		const favorite = this.getNodeParameter('favorite', itemIndex) as boolean;
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PATCH',
			endpoint: `/v2/analytics/competitors/${network}/${competitorId}`,
			blogId,
			qs: { fields: ['favorite'] },
			body: { favorite },
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'getPosts') {
		const competitorId = this.getNodeParameter('competitorId', itemIndex) as string;
		const contentType = this.getNodeParameter('contentType', itemIndex) as string;
		const timezone = await resolveBrandTimezone.call(this, itemIndex, blogId);
		const from = toMetricoolQueryDateTime(this.getNodeParameter('from', itemIndex) as string, timezone);
		const to = toMetricoolQueryDateTime(this.getNodeParameter('to', itemIndex) as string, timezone);
		const limit = this.getNodeParameter('limit', itemIndex, 50) as number;

		// Per-id …/{competitorId}/posts is CSV for IG/Twitter/YouTube/Twitch; use brand-level JSON paths.
		let endpoint = `/v2/analytics/competitors/${network}/${competitorId}/posts`;
		const qs: Record<string, unknown> = { from, to, timezone, limit };
		const csvPostsNetworks = new Set(['instagram', 'twitter', 'youtube', 'twitch']);

		if (contentType === 'publications') {
			if (network !== 'instagram') {
				throw new NodeOperationError(
					this.getNode(),
					'Publications content type is only supported for Instagram',
					{ itemIndex },
				);
			}
			endpoint = `/v2/analytics/competitors/instagram/publications`;
			qs['competitors[]'] = [competitorId];
		} else if (contentType === 'reels') {
			if (network !== 'instagram') {
				throw new NodeOperationError(
					this.getNode(),
					'Reels content type is only supported for Instagram',
					{ itemIndex },
				);
			}
			endpoint = `/v2/analytics/competitors/instagram/${competitorId}/reels`;
		} else if (contentType === 'clips') {
			if (network !== 'twitch') {
				throw new NodeOperationError(
					this.getNode(),
					'Clips content type is only supported for Twitch',
					{ itemIndex },
				);
			}
			endpoint = `/v2/analytics/competitors/twitch/${competitorId}/clips`;
		} else if (contentType === 'posts' && csvPostsNetworks.has(network)) {
			if (network === 'instagram') {
				endpoint = `/v2/analytics/competitors/instagram/publications`;
			} else {
				endpoint = `/v2/analytics/competitors/${network}/posts`;
			}
			qs['competitors[]'] = [competitorId];
		}

		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint,
			blogId,
			qs,
		});
		return returnJsonArray(data, itemIndex);
	}

	return throwUnknownOperation.call(this, 'competitor', operation, itemIndex);
}
