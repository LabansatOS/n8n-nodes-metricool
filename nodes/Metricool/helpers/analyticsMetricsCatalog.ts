/**
 * Metricool `/v2/analytics/{aggregation,timelines,distribution}` metrics by network + subject.
 * Synced from swagger.json `GET /v2/analytics/timelines` metric/subject/scope docs (case-insensitive codes).
 * There is no public REST "list metrics" endpoint for these codes.
 *
 * Network list for those ops (swagger): tiktok, tiktokads, pinterest, youtube, facebook, gmb,
 * instagram, linkedin — plus Threads/Bluesky metrics documented in the same metric parameter.
 * Twitter/Twitch and LinkedIn stories are omitted (not in swagger timeline metric docs).
 * tiktokads campaign metrics live under the Ads resource.
 */

export const ANALYTICS_NETWORK_SUBJECT_METRICS: Record<string, Record<string, string[]>> = {
	tiktok: {
		videos: [
			'videos',
			'views',
			'comments',
			'shares',
			'interactions',
			'likes',
			'reach',
			'engagement',
			'impressionSources',
			'averageVideoViews',
		],
		account: [
			'video_views',
			'profile_views',
			'followers_count',
			'followers_delta_count',
			'likes',
			'comments',
			'shares',
		],
	},
	pinterest: {
		pins: [
			'impression',
			'save',
			'pin_click',
			'outbound_click',
			'video_mrc_view',
			'video_avg_watch_time',
			'video_v50_watch_time',
			'quartile_95_percent_view',
			'pins',
		],
		account: ['followers', 'following', 'delta followers'],
	},
	youtube: {
		videos: ['views', 'interactions', 'likes', 'dislikes', 'comments', 'shares'],
	},
	facebook: {
		stories: ['storiesCount'],
		posts: [
			'count',
			'interactions',
			'engagement',
			'impressionsunique',
			'impressions',
			'clicks',
			'comments',
			'shares',
			'reactions',
		],
		reels: [
			'blue_reels_play_count',
			'post_impressions_unique',
			'post_video_likes_by_reaction_type',
			'post_video_social_actions',
			'engagement',
			'count',
		],
		account: [
			'page_posts_impressions',
			'page_actions_post_reactions_total',
			'postsCount',
			'postsInteractions',
			'likes',
			'pageFollows',
			'pageImpressions',
			'pageImpressions.M',
			'pageImpressions.F',
			'pageImpressions.U',
			'pageImpressions.13-17',
			'pageImpressions.18-24',
			'pageImpressions.25-34',
			'pageImpressions.35-44',
			'pageImpressions.45-54',
			'pageImpressions.55-64',
			'pageImpressions.65+',
			'pageViews',
			'page_daily_follows_unique',
			'page_daily_unfollows_unique',
		],
	},
	googleBusinessProfile: {
		business: [
			'business_impressions_maps',
			'business_impressions_search',
			'business_impressions_total',
			'business_direction_requests',
			'call_clicks',
			'website_clicks',
			'clicks_total',
			'business_conversations',
			'business_bookings',
			'business_food_orders',
			'business_actions_total',
		],
	},
	instagram: {
		account: [
			'email_contacts',
			'get_directions_clicks',
			'phone_call_clicks',
			'text_message_clicks',
			'clicks_total',
			'postsCount',
			'postsInteractions',
		],
		posts: [
			'count',
			'interactions',
			'engagement',
			'reach',
			'impressions',
			'likes',
			'comments',
			'saves',
			'shares',
		],
		reels: [
			'count',
			'comments',
			'likes',
			'saved',
			'shares',
			'engagement',
			'impressions',
			'reach',
			'interactions',
			'videoviews',
		],
		// Breakdown subjects require a matching `scope` (see swagger scope enum)
		media_product_type: [
			'comments',
			'likes',
			'profile_links_taps',
			'reach',
			'saved',
			'saves',
			'shares',
			'total_interactions',
			'views',
		],
		follow_type: [
			'comments',
			'likes',
			'profile_links_taps',
			'reach',
			'saved',
			'saves',
			'shares',
			'total_interactions',
			'views',
		],
		contact_button_type: [
			'comments',
			'likes',
			'profile_links_taps',
			'reach',
			'saved',
			'saves',
			'shares',
			'total_interactions',
			'views',
		],
	},
	linkedin: {
		// Company + personal account metrics from swagger (connected account type selects which apply)
		account: [
			'followers',
			'paidFollowers',
			'companyImpressions',
			'deltaFollowers',
			'impressionCount',
			'shareCount',
			'clickCount',
			'likeCount',
			'commentCount',
			'postsCount',
			'reaction',
			'comment',
			'reshare',
			'impression',
		],
		posts: [
			'posts',
			'clicks',
			'likes',
			'comments',
			'shares',
			'engagement',
			'impressions',
			'interactions',
			'count',
			'comment',
			'reshare',
			'impression',
			'reaction',
		],
		newsletters: [
			'posts',
			'clicks',
			'likes',
			'comments',
			'shares',
			'engagement',
			'impressions',
			'interactions',
		],
	},
	threads: {
		posts: [
			'count',
			'views',
			'likes',
			'replies',
			'reposts',
			'engagement',
			'quotes',
			'interactions',
			'shares',
		],
	},
	bluesky: {
		posts: ['posts_count', 'interactions', 'likes', 'replies', 'reposts', 'quotes'],
	},
};

const SUBJECT_LABELS: Record<string, string> = {
	account: 'Account',
	posts: 'Posts',
	reels: 'Reels',
	stories: 'Stories',
	videos: 'Videos',
	pins: 'Pins',
	business: 'Business',
	newsletters: 'Newsletters',
	media_product_type: 'Media Product Type (breakdown)',
	follow_type: 'Follow Type (breakdown)',
	contact_button_type: 'Contact Button Type (breakdown)',
};

/** Resolve catalog key; UI uses googleBusinessProfile while REST analytics uses gmb. */
function resolveCatalogNetwork(network: string): string {
	if (network === 'gmb') {
		return 'googleBusinessProfile';
	}
	return network;
}

/** Static network options for Get Available Metrics (no brand required). */
export function listAnalyticsCatalogNetworkOptions(): Array<{ name: string; value: string }> {
	return Object.keys(ANALYTICS_NETWORK_SUBJECT_METRICS)
		.sort()
		.map((value) => ({
			name:
				value === 'googleBusinessProfile'
					? 'Google Business Profile'
					: value.charAt(0).toUpperCase() + value.slice(1),
			value,
		}));
}

export function getAnalyticsSubjectsForNetwork(network: string): string[] {
	return Object.keys(ANALYTICS_NETWORK_SUBJECT_METRICS[resolveCatalogNetwork(network)] ?? {});
}

export function getAnalyticsMetricsForSubject(network: string, subject: string): string[] {
	return ANALYTICS_NETWORK_SUBJECT_METRICS[resolveCatalogNetwork(network)]?.[subject] ?? [];
}

export function formatAnalyticsSubjectLabel(subject: string): string {
	return SUBJECT_LABELS[subject] ?? subject;
}

export function listAnalyticsCatalog(network?: string): Array<{
	network: string;
	subject: string;
	metrics: string[];
}> {
	const networks = network
		? [resolveCatalogNetwork(network)]
		: Object.keys(ANALYTICS_NETWORK_SUBJECT_METRICS).sort();

	const rows: Array<{ network: string; subject: string; metrics: string[] }> = [];
	for (const net of networks) {
		const subjects = ANALYTICS_NETWORK_SUBJECT_METRICS[net];
		if (!subjects) {
			continue;
		}
		for (const [subject, metrics] of Object.entries(subjects)) {
			rows.push({ network: net, subject, metrics: [...metrics] });
		}
	}
	return rows;
}
