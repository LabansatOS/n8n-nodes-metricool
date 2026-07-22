import type { INodeProperties } from 'n8n-workflow';
import { blogIdProperty, simplifyProperty } from '../../descriptions/shared';

export const brandOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['brand'] } },
		options: [
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete brand',
				description: 'Delete a brand permanently after the recovery window',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get brand',
				description: 'Retrieve a brand by ID',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many brands',
				description: 'Retrieve a list of brands for the authenticated user',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update brand',
				description: 'Update one or more brand fields',
			},
		],
		default: 'getAll',
	},
];

export const brandFields: INodeProperties[] = [
	{
		...blogIdProperty({ show: { resource: ['brand'], operation: ['get', 'update', 'delete'] } }),
	},
	simplifyProperty({ show: { resource: ['brand'], operation: ['get', 'getAll'] } }),
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		description:
			'Fields to patch. Only included keys are sent (empty string clears the value). At least one field is required.',
		displayOptions: { show: { resource: ['brand'], operation: ['update'] } },
		options: [
			{
				displayName: 'Label',
				name: 'label',
				type: 'string',
				default: '',
				placeholder: 'e.g. Acme Marketing',
				description: 'Display name of the brand',
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: '',
				placeholder: 'e.g. Europe/Madrid',
				description: 'IANA timezone for the brand',
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				placeholder: 'e.g. Main brand account',
				description: 'Short description of the brand',
			},
		],
	},
	{
		displayName: 'Max Recovery Days',
		name: 'maxRecoveryDays',
		type: 'number',
		typeOptions: { minValue: 0, maxValue: 45 },
		default: 30,
		description: 'Days the brand can be restored after deletion (max 45)',
		displayOptions: { show: { resource: ['brand'], operation: ['delete'] } },
	},
	{
		displayName: 'Agency ID',
		name: 'agencyId',
		type: 'string',
		default: '',
		placeholder: 'e.g. 12345',
		description: 'Optional agency ID when deleting an agency-owned brand',
		displayOptions: { show: { resource: ['brand'], operation: ['delete'] } },
	},
];
