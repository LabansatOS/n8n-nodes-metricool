import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { metricoolApiRequest } from '../GenericFunctions';
import {
	ANALYTICS_NETWORK_SUBJECT_METRICS,
	formatAnalyticsSubjectLabel,
	getAnalyticsMetricsForSubject,
	getAnalyticsSubjectsForNetwork,
} from '../helpers/analyticsMetricsCatalog';
import {
	connectedNetworksFromBrand,
	toNetworkOptions,
} from '../helpers/brandNetworks';

/** JSON post list endpoints only (Facebook/TikTok posts are CSV downloads — omitted). */
const ANALYTICS_POST_NETWORKS = [
	'bluesky',
	'instagram',
	'linkedin',
	'pinterest',
	'threads',
	'twitter',
] as const;

const ANALYTICS_REELS_NETWORKS = ['facebook', 'instagram'] as const;

/** Instagram only — Facebook stories are CSV downloads. */
const ANALYTICS_STORIES_NETWORKS = ['instagram'] as const;

const BEST_TIME_NETWORKS = [
	'facebook',
	'instagram',
	'linkedin',
	'tiktok',
	'youtube',
] as const;

const SCHEDULED_POST_NETWORKS = [
	'twitter',
	'facebook',
	'instagram',
	'linkedin',
	'youtube',
	'tiktok',
	'pinterest',
	'threads',
	'bluesky',
	'googleBusinessProfile',
] as const;

const COMPETITOR_NETWORKS = [
	'bluesky',
	'facebook',
	'instagram',
	'twitch',
	'twitter',
	'youtube',
] as const;

function resolveBlogId(ctx: ILoadOptionsFunctions): string {
	const raw = ctx.getCurrentNodeParameter('blogId') as { value?: string } | string | undefined;
	if (typeof raw === 'object' && raw !== null) {
		return String(raw.value ?? '').trim();
	}
	return String(raw ?? '').trim();
}

async function loadConnectedNetworks(
	this: ILoadOptionsFunctions,
	allowlist?: readonly string[],
): Promise<INodePropertyOptions[]> {
	const blogId = resolveBlogId(this);
	if (!blogId) {
		return [];
	}

	const brand = await metricoolApiRequest.call(this, {
		method: 'GET',
		endpoint: `/v2/settings/brands/${blogId}`,
		blogId,
	});

	return toNetworkOptions(connectedNetworksFromBrand(brand), allowlist);
}

export async function getTimezones(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const response = await metricoolApiRequest.call(this, {
		method: 'GET',
		endpoint: '/v2/settings/catalogs/timezones',
		includeBlogId: false,
	});

	const list = Array.isArray(response) ? response : [];
	return list.map((tz) => {
		if (typeof tz === 'string') {
			return { name: tz, value: tz };
		}
		const obj = tz as { id?: string; name?: string; timezone?: string };
		const value = obj.timezone || obj.id || obj.name || String(tz);
		return { name: obj.name || value, value };
	});
}

export async function getPinterestBoards(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const blogId = resolveBlogId(this);
	const brandId = Number(blogId) || blogId;

	// Swagger documents `brandId` (not `blogId`) for Pinterest boards.
	const response = await metricoolApiRequest.call(this, {
		method: 'GET',
		endpoint: '/v2/scheduler/boards/pinterest',
		includeBlogId: false,
		qs: blogId ? { brandId } : {},
	});

	const list = Array.isArray(response) ? response : [];
	return list.map((board) => {
		const obj = board as { id?: string | number; name?: string; title?: string };
		return {
			name: obj.name || obj.title || String(obj.id),
			value: String(obj.id),
		};
	});
}

export async function getAnalyticsSubjects(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const network = this.getCurrentNodeParameter('network') as string;
	return getAnalyticsSubjectsForNetwork(network).map((subject) => ({
		name: formatAnalyticsSubjectLabel(subject),
		value: subject,
	}));
}

export async function getAnalyticsMetrics(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const network = this.getCurrentNodeParameter('network') as string;
	const subject = this.getCurrentNodeParameter('subject') as string;
	return getAnalyticsMetricsForSubject(network, subject).map((metric) => ({
		name: metric,
		value: metric,
	}));
}

/** All organic networks connected to the selected brand. */
export async function getBrandNetworks(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return loadConnectedNetworks.call(this);
}

/** Connected networks that have aggregation/timeline/distribution catalog entries. */
export async function getBrandNetworksForAnalyticsMetrics(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const catalogNetworks = new Set(Object.keys(ANALYTICS_NETWORK_SUBJECT_METRICS));
	return loadConnectedNetworks.call(this, [...catalogNetworks]);
}

export async function getBrandNetworksForAnalyticsPosts(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return loadConnectedNetworks.call(this, ANALYTICS_POST_NETWORKS);
}

export async function getBrandNetworksForReels(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return loadConnectedNetworks.call(this, ANALYTICS_REELS_NETWORKS);
}

export async function getBrandNetworksForStories(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return loadConnectedNetworks.call(this, ANALYTICS_STORIES_NETWORKS);
}

export async function getBrandNetworksForBestTime(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return loadConnectedNetworks.call(this, BEST_TIME_NETWORKS);
}

export async function getBrandNetworksForScheduledPost(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return loadConnectedNetworks.call(this, SCHEDULED_POST_NETWORKS);
}

export async function getBrandNetworksForCompetitors(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	return loadConnectedNetworks.call(this, COMPETITOR_NETWORKS);
}
