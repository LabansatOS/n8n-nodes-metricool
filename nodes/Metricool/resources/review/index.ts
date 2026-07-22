import type { INodeProperties } from 'n8n-workflow';
import { blogIdProperty, dateRangeProperties, networkProperty } from '../../descriptions/shared';

export const reviewOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['review'] } },
		options: [
			{
				name: 'Delete Reply',
				value: 'deleteReply',
				action: 'Delete review reply',
				description: 'Delete a reply to a review permanently',
			},
			{
				name: 'Get GBP Reviews',
				value: 'getGbp',
				action: 'Get google business profile reviews',
				description: 'Retrieve Google Business Profile reviews for a date range',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many reviews',
				description: 'Retrieve a list of reviews for the brand',
			},
			{
				name: 'Reply',
				value: 'reply',
				action: 'Reply to review',
				description: 'Post a reply to a review',
			},
		],
		default: 'getAll',
	},
];

export const reviewFields: INodeProperties[] = [
	blogIdProperty({ show: { resource: ['review'] } }),
	{
		...networkProperty('provider'),
		displayName: 'Provider Name or ID',
		displayOptions: { show: { resource: ['review'], operation: ['getAll'] } },
	},
	...dateRangeProperties({ resource: ['review'], operation: ['getGbp'] }),
	{
		displayName: 'Reply Body',
		name: 'replyBody',
		type: 'json',
		default: '{}',
		description:
			'JSON body for reply / delete reply (provider + reviewId required; optional text/attachment). UI codes like googleBusinessProfile are mapped to API tokens (e.g. GMB).',
		displayOptions: { show: { resource: ['review'], operation: ['reply', 'deleteReply'] } },
	},
	{
		displayName: 'Additional Query',
		name: 'additionalQuery',
		type: 'json',
		default: '{}',
		description: 'Optional extra query parameters merged with provider',
		displayOptions: { show: { resource: ['review'], operation: ['getAll'] } },
	},
];
