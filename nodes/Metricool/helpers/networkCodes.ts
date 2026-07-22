/**
 * Map UI / brand network codes to Metricool REST API tokens.
 * Keep UI values stable (e.g. googleBusinessProfile); translate at request time.
 */

/** Analytics aggregation/timeline/distribution `network` query values. */
export function toAnalyticsNetwork(network: string): string {
	if (network === 'googleBusinessProfile') {
		return 'gmb';
	}
	return network;
}

/**
 * Inbox / reviews APIs expect uppercase provider codes
 * (FACEBOOK, INSTAGRAM, GMB, …) rather than brand picker values.
 */
const INBOX_PROVIDER_MAP: Record<string, string> = {
	facebook: 'FACEBOOK',
	instagram: 'INSTAGRAM',
	googleBusinessProfile: 'GMB',
	gmb: 'GMB',
	twitter: 'TWITTER',
	linkedin: 'LINKEDIN',
	youtube: 'YOUTUBE',
	tiktok: 'TIKTOKBUSINESS',
	instagramBusiness: 'INSTAGRAMBUSINESS',
	instagram_business: 'INSTAGRAMBUSINESS',
};

/** Map brand-picker network codes to `/v2/inbox/*` provider tokens. */
export function toInboxProvider(network: string): string {
	if (!network) {
		return network;
	}
	const mapped = INBOX_PROVIDER_MAP[network];
	if (mapped) {
		return mapped;
	}
	// Already uppercase API token (e.g. from expression)
	if (network === network.toUpperCase()) {
		return network;
	}
	return network.toUpperCase();
}

/** Alias used by the review resource (same inbox provider tokens). */
export const toReviewProvider = toInboxProvider;
