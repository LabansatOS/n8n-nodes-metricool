import type { INodePropertyOptions } from 'n8n-workflow';
import { NETWORK_OPTIONS } from '../types';

/**
 * Metricool brand `networksData` keys → node network / provider codes.
 * Ads keys (facebookAdsData, etc.) are ignored for organic network pickers.
 */
const NETWORKS_DATA_KEY_TO_NETWORK: Record<string, string> = {
	facebookData: 'facebook',
	instagramData: 'instagram',
	twitterData: 'twitter',
	tiktokData: 'tiktok',
	youtubeData: 'youtube',
	pinterestData: 'pinterest',
	linkedinData: 'linkedin',
	blueskyData: 'bluesky',
	threadsData: 'threads',
	twitchData: 'twitch',
	gbpData: 'googleBusinessProfile',
	googleBusinessProfileData: 'googleBusinessProfile',
};

const NETWORK_LABELS = Object.fromEntries(
	NETWORK_OPTIONS.map((option) => [option.value, option.name]),
) as Record<string, string>;

export function networkLabel(network: string): string {
	return NETWORK_LABELS[network] ?? network;
}

/** Connected organic networks from a brand payload (`networksData`). */
export function connectedNetworksFromBrand(brand: unknown): string[] {
	if (!brand || typeof brand !== 'object') {
		return [];
	}
	const networksData = (brand as { networksData?: unknown }).networksData;
	if (!networksData || typeof networksData !== 'object' || Array.isArray(networksData)) {
		return [];
	}

	const connected = new Set<string>();
	for (const key of Object.keys(networksData as Record<string, unknown>)) {
		const network = NETWORKS_DATA_KEY_TO_NETWORK[key];
		if (network) {
			connected.add(network);
		}
	}
	return [...connected].sort((a, b) => networkLabel(a).localeCompare(networkLabel(b)));
}

export function toNetworkOptions(
	networks: string[],
	allowlist?: readonly string[],
): INodePropertyOptions[] {
	const allowed = allowlist ? new Set(allowlist) : undefined;
	return networks
		.filter((network) => (allowed ? allowed.has(network) : true))
		.map((network) => ({
			name: networkLabel(network),
			value: network,
		}));
}
