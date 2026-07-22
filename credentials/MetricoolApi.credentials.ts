import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MetricoolApi implements ICredentialType {
	name = 'metricoolApi';

	displayName = 'Metricool API';

	icon = { light: 'file:metricool.svg', dark: 'file:metricool.dark.svg' } as const;

	documentationUrl = 'https://app.metricool.com/resources/apidocs/index.html';

	properties: INodeProperties[] = [
		{
			displayName: 'User Token',
			name: 'userToken',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Unique authorization code for your Metricool account (Account Settings). Sent as the X-Mc-Auth header.',
		},
		{
			displayName: 'User ID',
			name: 'userId',
			type: 'string',
			required: true,
			default: '',
			description: 'Numeric user identifier of your Metricool account. Sent as the userId query parameter.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-Mc-Auth': '={{ String($credentials.userToken).trim() }}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://app.metricool.com/api',
			url: '/v2/settings/brands',
			method: 'GET',
			qs: {
				userId: '={{ String($credentials.userId).trim() }}',
			},
		},
	};
}
