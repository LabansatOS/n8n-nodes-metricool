import type { INodeProperties } from 'n8n-workflow';

export const collaboratorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['collaborator'] } },
		options: [
			{
				name: 'Create Role',
				value: 'createRole',
				action: 'Create brand role',
				description: 'Create a new brand role with permissions',
			},
			{
				name: 'Delete Assignment',
				value: 'deleteAssignment',
				action: 'Delete brand role assignment',
				description: 'Remove a role assignment from a brand',
			},
			{
				name: 'Delete Collaborator',
				value: 'deleteCollaborator',
				action: 'Delete collaborator',
				description: 'Delete a collaborator permanently',
			},
			{
				name: 'Delete Role',
				value: 'deleteRole',
				action: 'Delete brand role',
				description: 'Delete a brand role permanently',
			},
			{
				name: 'Get Collaborators',
				value: 'getCollaborators',
				action: 'Get collaborators',
				description: 'Retrieve collaborators for the user',
			},
			{
				name: 'Get Roles',
				value: 'getRoles',
				action: 'Get brand roles',
				description: 'Retrieve available brand roles',
			},
			{
				name: 'Insert Collaborator',
				value: 'insertCollaborator',
				action: 'Invite collaborator by email',
				description: 'Invite a collaborator using their email address',
			},
			{
				name: 'Resend Activation Link',
				value: 'resendActivation',
				action: 'Resend activation link',
				description: 'Resend the activation link to a collaborator',
			},
			{
				name: 'Update Collaborator',
				value: 'updateCollaborator',
				action: 'Update collaborator assignments',
				description: 'Update brand assignments for a collaborator',
			},
			{
				name: 'Update Role',
				value: 'updateRole',
				action: 'Update brand role',
				description: 'Update an existing brand role',
			},
		],
		default: 'getCollaborators',
	},
];

export const collaboratorFields: INodeProperties[] = [
	{
		displayName: 'User ID',
		name: 'targetUserId',
		type: 'string',
		default: '',
		description: 'Defaults to credential userId when empty',
		displayOptions: { show: { resource: ['collaborator'] } },
	},
	{
		displayName: 'Collaborator ID',
		name: 'collaboratorId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: {
				resource: ['collaborator'],
				operation: ['deleteCollaborator', 'updateCollaborator', 'resendActivation'],
			},
		},
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		placeholder: 'e.g. name@email.com',
		default: '',
		description: 'Email address used to invite the collaborator',
		displayOptions: {
			show: { resource: ['collaborator'], operation: ['insertCollaborator'] },
		},
	},
	{
		displayName: 'Brand ID',
		name: 'assignmentBrandId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 123456',
		description: 'Brand ID whose role assignment should be deleted (query brandId)',
		displayOptions: {
			show: { resource: ['collaborator'], operation: ['deleteAssignment'] },
		},
	},
	{
		displayName: 'Whether to Use Default Activation Email',
		name: 'isDefaultEmail',
		type: 'boolean',
		default: true,
		description: 'Whether to send the default activation email template',
		displayOptions: {
			show: { resource: ['collaborator'], operation: ['resendActivation'] },
		},
	},
	{
		displayName: 'Invitation Custom Message',
		name: 'invitationCustomMessage',
		type: 'string',
		default: '',
		displayOptions: {
			show: { resource: ['collaborator'], operation: ['resendActivation'] },
		},
	},
	{
		displayName: 'Whether to Use New Activation Link',
		name: 'useNewActivationLink',
		type: 'boolean',
		default: false,
		description: 'Whether to generate a new activation link (EmailActivationInfo.useNewActivationLink)',
		displayOptions: {
			show: { resource: ['collaborator'], operation: ['resendActivation'] },
		},
	},
	{
		displayName: 'Role ID',
		name: 'roleId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: { resource: ['collaborator'], operation: ['deleteRole', 'updateRole'] },
		},
	},
	{
		displayName: 'JSON Body',
		name: 'jsonBody',
		type: 'json',
		default: '{}',
		description:
			'Request body for write ops. For update role, body keys are also sent as the required `fields` query. For update collaborator, must be a JSON array of BrandRoleAssignment objects (e.g. [{"blogId":1,"roleId":2}]).',
		displayOptions: {
			show: {
				resource: ['collaborator'],
				operation: ['createRole', 'updateRole', 'updateCollaborator', 'insertCollaborator'],
			},
		},
	},
];
