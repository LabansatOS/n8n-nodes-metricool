import type { INodeProperties } from 'n8n-workflow';
import { blogIdProperty } from '../../descriptions/shared';

export const approvalOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['approval'] } },
		options: [
			{
				name: 'Approve or Reject',
				value: 'approveReject',
				action: 'Approve or reject post',
				description: 'Approve or reject a post in the approval workflow',
			},
			{
				name: 'Get Approvals Config',
				value: 'getConfig',
				action: 'Get approvals config',
				description: 'Retrieve the approvals configuration for the brand',
			},
			{
				name: 'Get Task Counters',
				value: 'getCounters',
				action: 'Get approval task counters',
				description: 'Retrieve counts of pending approval tasks',
			},
			{
				name: 'Get Tasks',
				value: 'getTasks',
				action: 'Get approval tasks',
				description: 'Retrieve approval tasks for the user',
			},
			{
				name: 'Send to Review',
				value: 'sendToReview',
				action: 'Send posts to review',
				description: 'Submit scheduled posts for approval review',
			},
		],
		default: 'getTasks',
	},
];

export const approvalFields: INodeProperties[] = [
	blogIdProperty({
		show: { resource: ['approval'], operation: ['sendToReview', 'approveReject', 'getConfig'] },
	}),
	{
		displayName: 'Post ID',
		name: 'postId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['approval'], operation: ['approveReject'] } },
	},
	{
		displayName: 'JSON Body',
		name: 'jsonBody',
		type: 'json',
		default: '{}',
		description:
			'Send to review: ScheduledPostApprovalDataInBulk (`approvalData`, `posts`). Approve/reject: ScheduledPostApprovalEventRequest (`postUuid`, `reviewerId`, `status`).',
		displayOptions: {
			show: { resource: ['approval'], operation: ['sendToReview', 'approveReject'] },
		},
	},
	{
		displayName: 'User ID',
		name: 'targetUserId',
		type: 'string',
		default: '',
		description: 'Defaults to credential userId when empty',
		displayOptions: {
			show: { resource: ['approval'], operation: ['getTasks', 'getCounters'] },
		},
	},
	{
		displayName: 'Editor Statuses',
		name: 'editorStatuses',
		type: 'string',
		default: '',
		placeholder: 'e.g. PENDING,APPROVED',
		description:
			'Optional comma-separated editorStatus[] filter values for Get Tasks',
		displayOptions: { show: { resource: ['approval'], operation: ['getTasks'] } },
	},
	{
		displayName: 'Reviewer Statuses',
		name: 'reviewerStatuses',
		type: 'string',
		default: '',
		placeholder: 'e.g. PENDING,REJECTED',
		description:
			'Optional comma-separated reviewerStatus[] filter values for Get Tasks',
		displayOptions: { show: { resource: ['approval'], operation: ['getTasks'] } },
	},
];
