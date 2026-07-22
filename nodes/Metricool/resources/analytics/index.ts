import type { INodeProperties } from 'n8n-workflow';
import { listAnalyticsCatalogNetworkOptions } from '../../helpers/analyticsMetricsCatalog';
import { blogIdProperty, dateRangeProperties } from '../../descriptions/shared';

const analyticsResource = ['analytics'] as const;

const metricOperations = ['getAggregation', 'getTimeline', 'getDistribution'] as const;

const brandRequiredOperations = [
	...metricOperations,
	'getBrandSummaryPosts',
	'getNetworkPosts',
	'getReels',
	'getStories',
] as const;

const catalogNetworkOptions = listAnalyticsCatalogNetworkOptions();

const postNetworkOperations = ['getNetworkPosts', 'getReels', 'getStories'] as const;

export const analyticsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: [...analyticsResource] } },
		options: [
			{
				name: 'Get Aggregation',
				value: 'getAggregation',
				action: 'Get analytics aggregation',
				description: 'Retrieve an aggregated value for a metric over a date range',
			},
			{
				name: 'Get Available Metrics',
				value: 'getAvailableMetrics',
				action: 'Get available analytics metrics',
				description:
					'List Metricool analytics metric codes for a network (and optional subject)',
			},
			{
				name: 'Get Brand Summary Posts',
				value: 'getBrandSummaryPosts',
				action: 'Get brand summary posts',
				description: 'Retrieve brand summary posts for a date range',
			},
			{
				name: 'Get Distribution',
				value: 'getDistribution',
				action: 'Get analytics distribution',
				description: 'Retrieve metric distribution over a date range',
			},
			{
				name: 'Get Network Posts',
				value: 'getNetworkPosts',
				action: 'Get network posts analytics',
				description: 'Retrieve post analytics for a social network',
			},
			{
				name: 'Get Reels',
				value: 'getReels',
				action: 'Get reels analytics',
				description: 'Retrieve reels analytics for Instagram or Facebook',
			},
			{
				name: 'Get Stories',
				value: 'getStories',
				action: 'Get stories analytics',
				description: 'Retrieve Instagram stories analytics',
			},
			{
				name: 'Get Timeline',
				value: 'getTimeline',
				action: 'Get analytics timeline',
				description: 'Retrieve a time series for a metric over a date range',
			},
		],
		default: 'getAggregation',
	},
];

export const analyticsFields: INodeProperties[] = [
	{
		...blogIdProperty({
			show: { resource: [...analyticsResource], operation: [...brandRequiredOperations] },
		}),
	},
	{
		displayName: 'Network Name or ID',
		name: 'network',
		type: 'options',
		required: true,
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getBrandNetworksForAnalyticsMetrics',
			loadOptionsDependsOn: ['blogId'],
		},
		displayOptions: {
			show: {
				resource: [...analyticsResource],
				operation: [...metricOperations],
			},
		},
	},
	{
		displayName: 'Network',
		name: 'network',
		type: 'options',
		required: true,
		default: 'instagram',
		description: 'Network whose published Metricool analytics metric codes to list',
		options: catalogNetworkOptions,
		displayOptions: {
			show: {
				resource: [...analyticsResource],
				operation: ['getAvailableMetrics'],
			},
		},
	},
	{
		displayName: 'Subject Name or ID',
		name: 'subject',
		type: 'options',
		required: true,
		default: 'account',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getAnalyticsSubjects',
			loadOptionsDependsOn: ['network'],
		},
		displayOptions: {
			show: {
				resource: [...analyticsResource],
				operation: [...metricOperations],
			},
		},
	},
	{
		displayName: 'Metric Name or ID',
		name: 'metric',
		type: 'options',
		required: true,
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getAnalyticsMetrics',
			loadOptionsDependsOn: ['network', 'subject'],
		},
		displayOptions: {
			show: {
				resource: [...analyticsResource],
				operation: [...metricOperations],
			},
		},
	},
	{
		displayName: 'Scope',
		name: 'scope',
		type: 'string',
		default: '',
		placeholder: 'e.g. leave empty unless using breakdown metrics',
		description:
			'Optional analytics scope. Needed for some Instagram breakdown metrics; leave empty for account/posts/reels totals.',
		displayOptions: {
			show: {
				resource: [...analyticsResource],
				operation: [...metricOperations],
			},
		},
	},
	...dateRangeProperties({
		resource: [...analyticsResource],
		operation: [...metricOperations, 'getBrandSummaryPosts', ...postNetworkOperations],
	}),
	{
		displayName: 'Network Name or ID',
		name: 'network',
		type: 'options',
		required: true,
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getBrandNetworksForAnalyticsPosts',
			loadOptionsDependsOn: ['blogId'],
		},
		displayOptions: {
			show: {
				resource: [...analyticsResource],
				operation: ['getNetworkPosts'],
			},
		},
	},
	{
		displayName: 'Network Name or ID',
		name: 'network',
		type: 'options',
		required: true,
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getBrandNetworksForReels',
			loadOptionsDependsOn: ['blogId'],
		},
		displayOptions: {
			show: {
				resource: [...analyticsResource],
				operation: ['getReels'],
			},
		},
	},
	{
		displayName: 'Network Name or ID',
		name: 'network',
		type: 'options',
		required: true,
		default: 'instagram',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getBrandNetworksForStories',
			loadOptionsDependsOn: ['blogId'],
		},
		displayOptions: {
			show: {
				resource: [...analyticsResource],
				operation: ['getStories'],
			},
		},
	},
];
