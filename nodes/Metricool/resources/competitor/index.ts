import type { INodeProperties } from 'n8n-workflow';
import { blogIdProperty, dateRangeProperties } from '../../descriptions/shared';

export const competitorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['competitor'] } },
		options: [
			{
				name: 'Add',
				value: 'add',
				action: 'Add competitor',
				description: 'Start tracking a competitor on a network',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many competitors',
				description: 'Retrieve a list of tracked competitors',
			},
			{
				name: 'Get Posts',
				value: 'getPosts',
				action: 'Get competitor posts',
				description: 'Retrieve posts published by a competitor',
			},
			{
				name: 'Remove',
				value: 'remove',
				action: 'Remove competitor',
				description: 'Stop tracking a competitor',
			},
			{
				name: 'Set Favorite',
				value: 'setFavorite',
				action: 'Set competitor favorite flag',
				description: 'Mark or unmark a competitor as favorite',
			},
		],
		default: 'getAll',
	},
];

export const competitorFields: INodeProperties[] = [
	blogIdProperty({ show: { resource: ['competitor'] } }),
	{
		displayName: 'Network Name or ID',
		name: 'network',
		type: 'options',
		required: true,
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getBrandNetworksForCompetitors',
			loadOptionsDependsOn: ['blogId'],
		},
		displayOptions: { show: { resource: ['competitor'] } },
	},
	...dateRangeProperties({ resource: ['competitor'], operation: ['getAll', 'getPosts'] }),
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		required: true,
		description: 'Max number of results to return',
		default: 50,
		displayOptions: { show: { resource: ['competitor'], operation: ['getAll', 'getPosts'] } },
	},
	{
		displayName: 'Competitor ID',
		name: 'competitorId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. n8n',
		description:
			'For Add/Remove/Get Posts: network account ID or username. For Set Favorite: numeric Metricool competitor ID from Get Many (not username).',
		displayOptions: {
			show: { resource: ['competitor'], operation: ['add', 'remove', 'setFavorite', 'getPosts'] },
		},
	},
	{
		displayName: 'Favorite',
		name: 'favorite',
		type: 'boolean',
		default: true,
		description: 'Whether to mark the competitor as favorite',
		displayOptions: { show: { resource: ['competitor'], operation: ['setFavorite'] } },
	},
	{
		displayName: 'Content Type',
		name: 'contentType',
		type: 'options',
		options: [
			{
				name: 'Posts',
				value: 'posts',
				description:
					'JSON posts. Instagram uses publications; Twitter/YouTube/Twitch use brand-level posts (not CSV download paths). Facebook/Bluesky use per-competitor posts.',
			},
			{
				name: 'Publications',
				value: 'publications',
				description: 'Instagram only — posts + reels as JSON via competitors[]',
			},
			{
				name: 'Reels',
				value: 'reels',
				description: 'Instagram only — competitor reels',
			},
			{
				name: 'Clips',
				value: 'clips',
				description: 'Twitch only — competitor clips',
			},
		],
		default: 'posts',
		displayOptions: { show: { resource: ['competitor'], operation: ['getPosts'] } },
	},
];
