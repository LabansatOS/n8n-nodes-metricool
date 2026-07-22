import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import {
	assertPatchFields,
	metricoolApiRequest,
	parseJsonValue,
	returnJsonArray,
	throwUnknownOperation,
} from '../../GenericFunctions';

function parseJsonObject(value: unknown): IDataObject {
	const parsed = parseJsonValue(value, '{}');
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
		throw new Error('Expected a JSON object');
	}
	return parsed as IDataObject;
}

export async function executeAgency(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const agencyId = this.getNodeParameter('agencyId', itemIndex) as string;
	const base = `/v2/agency-CK/${agencyId}`;

	const map: Record<string, () => Promise<unknown>> = {
		getTeamMembers: () =>
			metricoolApiRequest.call(this, {
				itemIndex,
				method: 'GET',
				endpoint: `${base}/team-members`,
				includeBlogId: false,
			}),
		getTeamRoles: () =>
			metricoolApiRequest.call(this, {
				itemIndex,
				method: 'GET',
				endpoint: `${base}/team-members/roles`,
				includeBlogId: false,
			}),
		addTeamMember: () =>
			metricoolApiRequest.call(this, {
				itemIndex,
				method: 'POST',
				endpoint: `${base}/team-members`,
				includeBlogId: false,
				body: parseJsonObject(this.getNodeParameter('jsonBody', itemIndex)),
			}),
		removeTeamMember: () =>
			metricoolApiRequest.call(this, {
				itemIndex,
				method: 'DELETE',
				endpoint: `${base}/team-members/${this.getNodeParameter('teamMemberUserId', itemIndex)}`,
				includeBlogId: false,
			}),
		updateTeamMember: () => {
			const body = parseJsonObject(this.getNodeParameter('jsonBody', itemIndex));
			const fields = assertPatchFields.call(
				this,
				body,
				itemIndex,
				'JSON Body must include at least one field to update (keys become the required fields query)',
			);
			return metricoolApiRequest.call(this, {
				itemIndex,
				method: 'PATCH',
				endpoint: `${base}/team-members/${this.getNodeParameter('teamMemberUserId', itemIndex)}`,
				includeBlogId: false,
				qs: { fields },
				body,
			});
		},
		resendTeamInvite: () =>
			metricoolApiRequest.call(this, {
				itemIndex,
				method: 'POST',
				endpoint: `${base}/team-members/${this.getNodeParameter('teamMemberUserId', itemIndex)}/invitation-email`,
				includeBlogId: false,
			}),
		getEndClients: () => {
			const filter = (this.getNodeParameter('filter', itemIndex, '') as string).trim();
			return metricoolApiRequest.call(this, {
				itemIndex,
				method: 'GET',
				endpoint: `${base}/end-clients`,
				includeBlogId: false,
				qs: filter ? { filter } : {},
			});
		},
		addEndClient: () =>
			metricoolApiRequest.call(this, {
				itemIndex,
				method: 'POST',
				endpoint: `${base}/end-clients`,
				includeBlogId: false,
				body: parseJsonObject(this.getNodeParameter('jsonBody', itemIndex)),
			}),
		deleteEndClient: () =>
			metricoolApiRequest.call(this, {
				itemIndex,
				method: 'DELETE',
				endpoint: `${base}/end-clients/${this.getNodeParameter('endClientId', itemIndex)}`,
				includeBlogId: false,
			}),
		resendEndClientInvite: () =>
			metricoolApiRequest.call(this, {
				itemIndex,
				method: 'POST',
				endpoint: `${base}/end-clients/${this.getNodeParameter('endClientId', itemIndex)}/activation-link`,
				includeBlogId: false,
				body: parseJsonObject(this.getNodeParameter('jsonBody', itemIndex, '{}')),
			}),
		assignEndClient: () => {
			const body = parseJsonValue(this.getNodeParameter('jsonBody', itemIndex), '[]');
			if (!Array.isArray(body)) {
				throw new NodeOperationError(
					this.getNode(),
					'Assign End Client JSON Body must be a JSON array of brand assignments',
					{
						itemIndex,
						description:
							'Example: [{"brandId":1,"enabled":true,"roleId":2}]',
					},
				);
			}
			return metricoolApiRequest.call(this, {
				itemIndex,
				method: 'PUT',
				endpoint: `${base}/end-clients/${this.getNodeParameter('endClientId', itemIndex)}/assignments`,
				includeBlogId: false,
				body,
			});
		},
	};

	const fn = map[operation];
	if (!fn) return throwUnknownOperation.call(this, 'agency', operation, itemIndex);
	const data = await fn();
	if (operation === 'deleteEndClient' || operation === 'removeTeamMember') {
		return returnJsonArray({ deleted: true }, itemIndex);
	}
	return returnJsonArray(data, itemIndex);
}
