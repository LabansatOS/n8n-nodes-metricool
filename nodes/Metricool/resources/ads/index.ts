import type { INodeProperties } from 'n8n-workflow';
import { blogIdProperty, dateRangeProperties } from '../../descriptions/shared';

export const adsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['ads'] } },
		options: [
			{
				name: 'Get Ad Groups',
				value: 'getAdgroups',
				action: 'Get ad groups',
				description: 'Retrieve ad groups for advertising campaigns',
			},
			{
				name: 'Get Ads',
				value: 'getAds',
				action: 'Get ads',
				description: 'Retrieve ads for advertising campaigns',
			},
			{
				name: 'Get Campaign Aggregation',
				value: 'getCampaignAggregation',
				action: 'Get campaign aggregation',
				description: 'Retrieve aggregated metrics for a campaign',
			},
			{
				name: 'Get Campaign Timeline',
				value: 'getCampaignTimeline',
				action: 'Get campaign timeline',
				description: 'Retrieve a time series of campaign metrics',
			},
			{
				name: 'Get Campaigns',
				value: 'getCampaigns',
				action: 'Get advertising campaigns',
				description: 'Retrieve advertising campaigns for the brand',
			},
			{
				name: 'Get Google Ads Campaigns',
				value: 'getGoogleAdsCampaigns',
				action: 'Get google ads campaigns',
				description: 'Retrieve Google Ads campaigns',
			},
			{
				name: 'Get Keywords',
				value: 'getKeywords',
				action: 'Get keywords',
				description: 'Retrieve advertising keywords',
			},
			{
				name: 'Get Meta Ads Campaigns',
				value: 'getFacebookAdsCampaigns',
				action: 'Get meta ads campaigns',
				description: 'Retrieve Meta (Facebook) ads campaigns for a date range',
			},
			{
				name: 'Get TikTok Ads Campaigns',
				value: 'getTiktokAdsCampaigns',
				action: 'Get tik tok ads campaigns',
				description: 'Retrieve TikTok ads campaigns',
			},
		],
		default: 'getCampaigns',
	},
];

export const adsFields: INodeProperties[] = [
	blogIdProperty({ show: { resource: ['ads'] } }),
	...dateRangeProperties({
		resource: ['ads'],
		operation: [
			'getAds',
			'getCampaigns',
			'getAdgroups',
			'getKeywords',
			'getGoogleAdsCampaigns',
			'getFacebookAdsCampaigns',
			'getTiktokAdsCampaigns',
			'getCampaignAggregation',
			'getCampaignTimeline',
		],
	}),
	{
		displayName: 'Network',
		name: 'network',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. facebook_ads',
		description:
			'Ads network for campaign aggregation/timeline (swagger examples: adwords, facebook_ads, tiktok_ads)',
		displayOptions: {
			show: {
				resource: ['ads'],
				operation: ['getCampaignAggregation', 'getCampaignTimeline'],
			},
		},
	},
	{
		displayName: 'Campaign ID',
		name: 'campaignId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['ads'],
				operation: ['getCampaignAggregation', 'getCampaignTimeline'],
			},
		},
	},
	{
		displayName: 'Metric',
		name: 'metric',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['ads'],
				operation: ['getCampaignAggregation', 'getCampaignTimeline'],
			},
		},
	},
	{
		displayName: 'Metrics',
		name: 'metrics',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. spend,impressions,clicks',
		description: 'Comma-separated TikTok ads metrics (sent as metrics[])',
		displayOptions: {
			show: {
				resource: ['ads'],
				operation: ['getTiktokAdsCampaigns'],
			},
		},
	},
	{
		displayName: 'Additional Query',
		name: 'additionalQuery',
		type: 'json',
		default: '{}',
		description: 'Optional extra query parameters merged into the request',
		displayOptions: {
			show: {
				resource: ['ads'],
				operation: ['getAds', 'getCampaigns', 'getAdgroups', 'getKeywords'],
			},
		},
	},
];
