export type MetricoolDateTimeInfo = {
	dateTime: string;
	timezone?: string;
};

export type MetricoolApiRequestOptions = {
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
	endpoint: string;
	qs?: Record<string, unknown>;
	body?: unknown;
	/** When false, blogId is not added to the query string */
	includeBlogId?: boolean;
	blogId?: string | number;
	headers?: Record<string, string>;
	encoding?: 'arraybuffer' | undefined;
	json?: boolean;
	/** Item index for pairing API errors in multi-item executions */
	itemIndex?: number;
};

export const METRICOOL_BASE_URL = 'https://app.metricool.com/api';

export const NETWORK_OPTIONS = [
	{ name: 'Bluesky', value: 'bluesky' },
	{ name: 'Facebook', value: 'facebook' },
	{ name: 'Google Business Profile', value: 'googleBusinessProfile' },
	{ name: 'Instagram', value: 'instagram' },
	{ name: 'LinkedIn', value: 'linkedin' },
	{ name: 'Pinterest', value: 'pinterest' },
	{ name: 'Threads', value: 'threads' },
	{ name: 'TikTok', value: 'tiktok' },
	{ name: 'Twitch', value: 'twitch' },
	{ name: 'X (Twitter)', value: 'twitter' },
	{ name: 'YouTube', value: 'youtube' },
] as const;
