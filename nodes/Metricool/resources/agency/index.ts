import type { INodeProperties } from 'n8n-workflow';

export const agencyOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['agency'] } },
		options: [
			{
				name: 'Add End Client',
				value: 'addEndClient',
				action: 'Add end client',
				description: 'Invite a new end client to the agency',
			},
			{
				name: 'Add Team Member',
				value: 'addTeamMember',
				action: 'Add team member',
				description: 'Invite a new team member to the agency',
			},
			{
				name: 'Assign End Client Brands',
				value: 'assignEndClient',
				action: 'Assign brands to end client',
				description: 'Assign brand access for an end client',
			},
			{
				name: 'Delete End Client',
				value: 'deleteEndClient',
				action: 'Delete end client',
				description: 'Delete an end client permanently',
			},
			{
				name: 'Get End Clients',
				value: 'getEndClients',
				action: 'Get agency end clients',
				description: 'Retrieve end clients for the agency',
			},
			{
				name: 'Get Team Members',
				value: 'getTeamMembers',
				action: 'Get agency team members',
				description: 'Retrieve team members for the agency',
			},
			{
				name: 'Get Team Roles',
				value: 'getTeamRoles',
				action: 'Get available team roles',
				description: 'Retrieve available roles for agency team members',
			},
			{
				name: 'Remove Team Member',
				value: 'removeTeamMember',
				action: 'Remove team member',
				description: 'Remove a team member from the agency',
			},
			{
				name: 'Resend End Client Invite',
				value: 'resendEndClientInvite',
				action: 'Resend end client invite',
				description: 'Resend the activation invite to an end client',
			},
			{
				name: 'Resend Team Invite',
				value: 'resendTeamInvite',
				action: 'Resend team member invite',
				description: 'Resend the invitation email to a team member',
			},
			{
				name: 'Update Team Member Role',
				value: 'updateTeamMember',
				action: 'Update team member role',
				description: 'Change the role assigned to a team member',
			},
		],
		default: 'getTeamMembers',
	},
];

export const agencyFields: INodeProperties[] = [
	{
		displayName: 'Agency ID',
		name: 'agencyId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 123456',
		description: 'Agency Customization Kit ID (Agency plans)',
		displayOptions: { show: { resource: ['agency'] } },
	},
	{
		displayName: 'Team Member User ID',
		name: 'teamMemberUserId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 987654',
		description: 'User ID of the agency team member',
		displayOptions: {
			show: {
				resource: ['agency'],
				operation: ['removeTeamMember', 'updateTeamMember', 'resendTeamInvite'],
			},
		},
	},
	{
		displayName: 'End Client ID',
		name: 'endClientId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 456789',
		description: 'ID of the end client',
		displayOptions: {
			show: {
				resource: ['agency'],
				operation: ['deleteEndClient', 'assignEndClient', 'resendEndClientInvite'],
			},
		},
	},
	{
		displayName: 'Filter',
		name: 'filter',
		type: 'string',
		default: '',
		description:
			'Optional JSON filter for Get End Clients (must include a username per swagger)',
		displayOptions: {
			show: { resource: ['agency'], operation: ['getEndClients'] },
		},
	},
	{
		displayName: 'JSON Body',
		name: 'jsonBody',
		type: 'json',
		default: '{}',
		description:
			'Request body for write ops. For update team member, body keys are also sent as the required `fields` query. For resend end-client invite, optional AgencyEndClientActivationLinkRequest (e.g. invitationCustomMessage). For assign end client, must be a JSON array: [{"brandId":1,"enabled":true,"roleId":2}].',
		displayOptions: {
			show: {
				resource: ['agency'],
				operation: [
					'addTeamMember',
					'updateTeamMember',
					'addEndClient',
					'assignEndClient',
					'resendEndClientInvite',
				],
			},
		},
	},
];
