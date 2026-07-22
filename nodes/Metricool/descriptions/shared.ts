import type { INodeProperties } from 'n8n-workflow';

export const blogIdProperty = (extraDisplayOptions?: {
	show?: Record<string, string[] | boolean[]>;
}): INodeProperties => ({
	displayName: 'Brand',
	name: 'blogId',
	type: 'resourceLocator',
	default: { mode: 'list', value: '' },
	required: true,
	description: 'Metricool brand (blogId). Found in the browser URL when viewing a brand.',
	modes: [
		{
			displayName: 'From List',
			name: 'list',
			type: 'list',
			typeOptions: {
				searchListMethod: 'searchBrands',
				searchable: true,
			},
		},
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			placeholder: 'e.g. 123456',
		},
	],
	displayOptions: extraDisplayOptions,
});

export const timezoneProperty = (name = 'timezone', required = false): INodeProperties => ({
	displayName: 'Timezone',
	name,
	type: 'string',
	default: '',
	required,
	description:
		'IANA timezone (e.g. America/Mexico_City). Leave empty to use the brand timezone (same as the Metricool web app).',
	placeholder: 'e.g. America/Mexico_City',
});

export const simplifyProperty = (displayOptions: {
	show?: Record<string, string[] | boolean[]>;
}): INodeProperties => ({
	displayName: 'Simplify',
	name: 'simplify',
	type: 'boolean',
	default: true,
	description: 'Whether to return a simplified version of the response instead of the raw data',
	displayOptions,
});

export const networkProperty = (name = 'network', required = true): INodeProperties => ({
	displayName: 'Network Name or ID',
	name,
	type: 'options',
	typeOptions: {
		loadOptionsMethod: 'getBrandNetworks',
		loadOptionsDependsOn: ['blogId'],
	},
	default: '',
	required,
	description:
		'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
});

export const dateRangeProperties = (resourceOps: {
	resource: string[];
	operation: string[];
}): INodeProperties[] => [
	{
		displayName: 'From',
		name: 'from',
		type: 'dateTime',
		required: true,
		default: '',
		description:
			'Start of the period. Sent as ISO-8601 with offset for the Timezone below (e.g. 2026-03-01T00:00:00-06:00).',
		displayOptions: { show: resourceOps },
	},
	{
		displayName: 'To',
		name: 'to',
		type: 'dateTime',
		required: true,
		default: '',
		description:
			'End of the period. Sent as ISO-8601 with offset for the Timezone below (e.g. 2026-03-31T23:59:59-06:00).',
		displayOptions: { show: resourceOps },
	},
	{
		...timezoneProperty(),
		description:
			'IANA timezone for from/to offsets. Leave empty (or UTC) to use the brand timezone — Metricool aggregation expects the same shape as the web app (e.g. America/Mexico_City with -06:00).',
		displayOptions: { show: resourceOps },
	},
];
