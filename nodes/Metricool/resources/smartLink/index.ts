import type { INodeProperties } from 'n8n-workflow';
import { blogIdProperty, dateRangeProperties } from '../../descriptions/shared';

export const smartLinkOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['smartLink'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create smart link',
				description: 'Create a new smart link page',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete smart link',
				description: 'Delete a smart link permanently',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get smart link',
				description: 'Retrieve a smart link by ID',
			},
			{
				name: 'Get Analytics',
				value: 'getAnalytics',
				action: 'Get smart link analytics',
				description: 'Retrieve analytics for a smart link',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many smart links',
				description: 'Retrieve a list of smart links',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update smart link',
				description: 'Update an existing smart link',
			},
		],
		default: 'getAll',
	},
];

export const smartLinkFields: INodeProperties[] = [
	blogIdProperty({ show: { resource: ['smartLink'] } }),
	{
		displayName: 'Smart Link ID',
		name: 'smartLinkId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['smartLink'], operation: ['get', 'update', 'delete', 'getAnalytics'] },
		},
	},
	{
		displayName: 'Slug',
		name: 'slug',
		type: 'string',
		default: '',
		displayOptions: {
			show: { resource: ['smartLink'], operation: ['getAll', 'create', 'update'] },
		},
	},
	{
		displayName: 'Item ID',
		name: 'itemId',
		type: 'string',
		default: '',
		description: 'Optional smart-link item ID filter for timeline analytics (query itemId)',
		displayOptions: {
			show: {
				resource: ['smartLink'],
				operation: ['getAnalytics'],
				analyticsType: ['timeline'],
			},
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: { show: { resource: ['smartLink'], operation: ['create', 'update'] } },
	},
	{
		displayName: 'Content JSON',
		name: 'contentJson',
		type: 'json',
		default: '{}',
		displayOptions: { show: { resource: ['smartLink'], operation: ['create', 'update'] } },
	},
	{
		displayName: 'Appearance JSON',
		name: 'appearanceJson',
		type: 'json',
		default: '{}',
		displayOptions: { show: { resource: ['smartLink'], operation: ['create', 'update'] } },
	},
	{
		displayName: 'Analytics Type',
		name: 'analyticsType',
		type: 'options',
		options: [
			{ name: 'Timeline', value: 'timeline' },
			{ name: 'Buttons', value: 'buttons' },
			{ name: 'Images', value: 'images' },
		],
		default: 'timeline',
		displayOptions: { show: { resource: ['smartLink'], operation: ['getAnalytics'] } },
	},
	{
		displayName: 'Metric',
		name: 'metric',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. clicks',
		description: 'Required for timeline analytics',
		displayOptions: {
			show: {
				resource: ['smartLink'],
				operation: ['getAnalytics'],
				analyticsType: ['timeline'],
			},
		},
	},
	...dateRangeProperties({ resource: ['smartLink'], operation: ['getAnalytics'] }),
];
