import type { INodeProperties } from 'n8n-workflow';
import { blogIdProperty } from '../../descriptions/shared';

export const postNoteOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['postNote'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create scheduled post note',
				description: 'Add a note to a scheduled post',
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete scheduled post note',
				description: 'Delete a scheduled post note permanently',
			},
			{
				name: 'Get Events',
				value: 'getEvents',
				action: 'Get scheduled post events',
				description: 'List events for a scheduled post',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get scheduled post notes',
				description: 'Retrieve notes for a scheduled post',
			},
			{
				name: 'Set Status',
				value: 'setStatus',
				action: 'Set notes status',
				description: 'Update the status of scheduled post notes',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update scheduled post note',
				description: 'Update an existing scheduled post note',
			},
		],
		default: 'getAll',
	},
];

export const postNoteFields: INodeProperties[] = [
	blogIdProperty({ show: { resource: ['postNote'] } }),
	{
		displayName: 'Post ID',
		name: 'postId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['postNote'],
				operation: ['getAll', 'create', 'update', 'delete', 'setStatus'],
			},
		},
	},
	{
		displayName: 'Post UUID',
		name: 'postUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['postNote'], operation: ['getEvents'] } },
	},
	{
		displayName: 'Note ID',
		name: 'noteId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['postNote'], operation: ['update', 'delete'] },
		},
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		default: '',
		required: true,
		typeOptions: { rows: 3 },
		description: 'Note content (ScheduledPostNoteRequest.content)',
		displayOptions: {
			show: { resource: ['postNote'], operation: ['create', 'update'] },
		},
	},
	{
		displayName: 'Source Post ID',
		name: 'sourcePostId',
		type: 'string',
		default: '',
		description: 'Optional source post ID query parameter when creating a note',
		displayOptions: {
			show: { resource: ['postNote'], operation: ['create'] },
		},
	},
	{
		displayName: 'JSON Body',
		name: 'jsonBody',
		type: 'json',
		default: '{}',
		description: 'Optional extra fields merged into the note body',
		displayOptions: {
			show: { resource: ['postNote'], operation: ['create', 'update'] },
		},
	},
];
