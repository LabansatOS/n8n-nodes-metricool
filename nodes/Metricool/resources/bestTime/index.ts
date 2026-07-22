import type { INodeProperties } from 'n8n-workflow';
import { blogIdProperty, timezoneProperty } from '../../descriptions/shared';

export const bestTimeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['bestTime'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get best time to post',
				description: 'Retrieve recommended posting times for a social network',
			},
		],
		default: 'get',
	},
];

export const bestTimeFields: INodeProperties[] = [
	{
		...blogIdProperty({ show: { resource: ['bestTime'], operation: ['get'] } }),
	},
	{
		displayName: 'Provider Name or ID',
		name: 'provider',
		type: 'options',
		required: true,
		default: '',
		description:
			'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
		typeOptions: {
			loadOptionsMethod: 'getBrandNetworksForBestTime',
			loadOptionsDependsOn: ['blogId'],
		},
		displayOptions: { show: { resource: ['bestTime'], operation: ['get'] } },
	},
	{
		displayName: 'Start',
		name: 'start',
		type: 'dateTime',
		default: '',
		description: 'Start of the period (sent as YYYY-MM-DDTHH:mm:ss)',
		displayOptions: { show: { resource: ['bestTime'], operation: ['get'] } },
	},
	{
		displayName: 'End',
		name: 'end',
		type: 'dateTime',
		default: '',
		description: 'End of the period (sent as YYYY-MM-DDTHH:mm:ss)',
		displayOptions: { show: { resource: ['bestTime'], operation: ['get'] } },
	},
	{
		...timezoneProperty(),
		displayOptions: { show: { resource: ['bestTime'], operation: ['get'] } },
	},
];
