import type { INodeProperties } from 'n8n-workflow';
import { blogIdProperty, networkProperty } from '../../descriptions/shared';

export const inboxOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['inbox'] } },
		options: [
			{
				name: 'Change Status',
				value: 'changeStatus',
				action: 'Change inbox status',
				description: 'Update the status of an inbox item',
			},
			{
				name: 'Create Comment',
				value: 'createComment',
				action: 'Create post comment',
				description: 'Add a comment on a social post',
			},
			{
				name: 'Create Note',
				value: 'createNote',
				action: 'Create inbox note',
				description: 'Add an internal note in the inbox',
			},
			{
				name: 'Delete Comment',
				value: 'deleteComment',
				action: 'Delete post comment',
				description: 'Delete a comment on a social post permanently',
			},
			{
				name: 'Delete Note',
				value: 'deleteNote',
				action: 'Delete inbox note',
				description: 'Delete an inbox note permanently',
			},
			{
				name: 'Get Comments',
				value: 'getComments',
				action: 'Get post comments',
				description: 'Retrieve comments for a social post',
			},
			{
				name: 'Get Conversations',
				value: 'getConversations',
				action: 'Get inbox conversations',
				description: 'Retrieve inbox conversations for the brand',
			},
			{
				name: 'Get Notes',
				value: 'getNotes',
				action: 'Get inbox notes',
				description: 'Retrieve internal notes from the inbox',
			},
			{
				name: 'Send Message',
				value: 'sendMessage',
				action: 'Send inbox message',
				description: 'Send a reply in an inbox conversation',
			},
			{
				name: 'Update Note',
				value: 'updateNote',
				action: 'Update inbox note',
				description: 'Update an existing inbox note',
			},
		],
		default: 'getConversations',
	},
];

export const inboxFields: INodeProperties[] = [
	blogIdProperty({ show: { resource: ['inbox'] } }),
	{
		...networkProperty('provider'),
		displayName: 'Provider Name or ID',
		displayOptions: {
			show: {
				resource: ['inbox'],
				operation: [
					'getConversations',
					'getComments',
					'sendMessage',
					'createComment',
					'deleteComment',
					'changeStatus',
					'getNotes',
					'createNote',
					'updateNote',
				],
			},
		},
	},
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['inbox'], operation: ['sendMessage', 'changeStatus'] },
		},
	},
	{
		displayName: 'Conversation Type',
		name: 'conversationType',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. DM',
		description: 'Conversation type required by Change Status',
		displayOptions: { show: { resource: ['inbox'], operation: ['changeStatus'] } },
	},
	{
		displayName: 'Recipient',
		name: 'recipient',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['inbox'], operation: ['sendMessage'] } },
	},
	{
		displayName: 'Object ID',
		name: 'objectId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['inbox'], operation: ['createComment'] },
		},
	},
	{
		displayName: 'Comment ID',
		name: 'commentId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. 17841400000000000',
		description: 'ID of the comment to delete',
		displayOptions: {
			show: { resource: ['inbox'], operation: ['deleteComment'] },
		},
	},
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		default: '',
		typeOptions: { rows: 3 },
		displayOptions: {
			show: {
				resource: ['inbox'],
				operation: ['sendMessage', 'createComment'],
			},
		},
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		default: '',
		required: true,
		typeOptions: { rows: 3 },
		description: 'Note content (Metricool InboxNoteRequest.content)',
		displayOptions: {
			show: {
				resource: ['inbox'],
				operation: ['createNote', 'updateNote'],
			},
		},
	},
	{
		displayName: 'Participant Screen Name',
		name: 'participantScreenName',
		type: 'string',
		default: '',
		description: 'Optional InboxNoteRequest.participantScreenName',
		displayOptions: {
			show: { resource: ['inbox'], operation: ['createNote', 'updateNote'] },
		},
	},
	{
		displayName: 'Participant Account ID',
		name: 'participantAccountId',
		type: 'string',
		default: '',
		description: 'Optional InboxNoteRequest.participantAccountId',
		displayOptions: {
			show: { resource: ['inbox'], operation: ['createNote', 'updateNote'] },
		},
	},
	{
		displayName: 'Attachment URL',
		name: 'attachment',
		type: 'string',
		default: '',
		displayOptions: {
			show: { resource: ['inbox'], operation: ['sendMessage', 'createComment'] },
		},
	},
	{
		displayName: 'Note ID',
		name: 'noteId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['inbox'], operation: ['updateNote', 'deleteNote'] },
		},
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['inbox'], operation: ['changeStatus'] } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'json',
		default: '{}',
		description: 'Extra JSON merged into the request body or query',
		displayOptions: {
			show: { resource: ['inbox'], operation: ['changeStatus', 'deleteComment', 'getNotes'] },
		},
	},
];
