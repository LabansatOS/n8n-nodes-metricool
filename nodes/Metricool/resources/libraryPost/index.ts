import type { INodeProperties } from 'n8n-workflow';
import { blogIdProperty } from '../../descriptions/shared';

export const libraryPostOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['libraryPost'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create library post',
				description: 'Create a new post in the content library',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete library post',
				description: 'Delete a library post permanently',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get library post',
				description: 'Retrieve a library post by ID',
			},
			{
				name: 'Get Events',
				value: 'getEvents',
				action: 'Get library post events',
				description: 'List events for a library post',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many library posts',
				description: 'Retrieve a list of library posts',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update library post',
				description: 'Update an existing library post',
			},
		],
		default: 'getAll',
	},
];

export const libraryPostFields: INodeProperties[] = [
	blogIdProperty({ show: { resource: ['libraryPost'] } }),
	{
		displayName: 'Library Post ID',
		name: 'libraryPostId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['libraryPost'], operation: ['get', 'update', 'delete', 'getEvents'] },
		},
	},
	{
		displayName: 'JSON Body',
		name: 'jsonBody',
		type: 'json',
		default: '{}',
		description: 'LibraryPostDto JSON for create/update (commonData, network *Data fields, etc.)',
		displayOptions: { show: { resource: ['libraryPost'], operation: ['create', 'update'] } },
	},
];
