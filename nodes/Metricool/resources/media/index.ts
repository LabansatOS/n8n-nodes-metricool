import type { INodeProperties } from 'n8n-workflow';
import { blogIdProperty } from '../../descriptions/shared';

export const mediaOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['media'] } },
		options: [
			{
				name: 'Upload',
				value: 'upload',
				action: 'Upload media',
				description: 'Upload a binary file to Metricool media storage and return its URL',
			},
		],
		default: 'upload',
	},
];

export const mediaFields: INodeProperties[] = [
	{
		...blogIdProperty({ show: { resource: ['media'], operation: ['upload'] } }),
	},
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		required: true,
		description: 'Name of the binary property containing the file to upload',
		displayOptions: { show: { resource: ['media'], operation: ['upload'] } },
	},
];
