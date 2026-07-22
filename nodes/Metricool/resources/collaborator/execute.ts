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

export async function executeCollaborator(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const credentials = await this.getCredentials('metricoolApi');
	const userId =
		(this.getNodeParameter('targetUserId', itemIndex, '') as string) ||
		(credentials.userId as string);
	const base = `/v2/authorization/${userId}`;

	if (operation === 'getCollaborators') {
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'GET',
				endpoint: `${base}/collaborators`,
				includeBlogId: false,
			}),
			itemIndex,
		);
	}

	if (operation === 'insertCollaborator') {
		const email = this.getNodeParameter('email', itemIndex) as string;
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'POST',
				endpoint: `${base}/collaborators/${encodeURIComponent(email)}`,
				includeBlogId: false,
				body: parseJsonObject(this.getNodeParameter('jsonBody', itemIndex, '{}')),
			}),
			itemIndex,
		);
	}

	if (operation === 'updateCollaborator') {
		const collaboratorId = this.getNodeParameter('collaboratorId', itemIndex) as string;
		const body = parseJsonValue(this.getNodeParameter('jsonBody', itemIndex), '[]');
		if (!Array.isArray(body)) {
			throw new NodeOperationError(
				this.getNode(),
				'Update Collaborator JSON Body must be a JSON array of brand role assignments',
				{
					itemIndex,
					description: 'Example: [{"blogId":1,"roleId":2}]',
				},
			);
		}
		for (const [index, item] of body.entries()) {
			if (typeof item !== 'object' || item === null || Array.isArray(item)) {
				continue;
			}
			const assignment = item as IDataObject;
			if (assignment.brandId !== undefined && assignment.blogId === undefined) {
				throw new NodeOperationError(
					this.getNode(),
					`Update Collaborator assignment[${index}] uses brandId; BrandRoleAssignment requires blogId`,
					{
						itemIndex,
						description: 'Use [{"blogId":1,"roleId":2}]. Query param brandId is only for Delete Assignment.',
					},
				);
			}
		}
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'PUT',
				endpoint: `${base}/collaborators/${collaboratorId}`,
				includeBlogId: false,
				body,
			}),
			itemIndex,
		);
	}

	if (operation === 'deleteCollaborator') {
		const collaboratorId = this.getNodeParameter('collaboratorId', itemIndex) as string;
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'DELETE',
			endpoint: `${base}/collaborators/${collaboratorId}`,
			includeBlogId: false,
		});
		return returnJsonArray({ deleted: true }, itemIndex);
	}

	if (operation === 'resendActivation') {
		const collaboratorId = this.getNodeParameter('collaboratorId', itemIndex) as string;
		const isDefaultEmail = this.getNodeParameter('isDefaultEmail', itemIndex, true) as boolean;
		const invitationCustomMessage = (
			this.getNodeParameter('invitationCustomMessage', itemIndex, '') as string
		).trim();
		const useNewActivationLink = this.getNodeParameter(
			'useNewActivationLink',
			itemIndex,
			false,
		) as boolean;
		const body: IDataObject = { isDefaultEmail };
		if (invitationCustomMessage) {
			body.invitationCustomMessage = invitationCustomMessage;
		}
		if (useNewActivationLink) {
			body.useNewActivationLink = true;
		}
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'POST',
				endpoint: `${base}/collaborators/${collaboratorId}/activation-link`,
				includeBlogId: false,
				body,
			}),
			itemIndex,
		);
	}

	if (operation === 'deleteAssignment') {
		const brandId = this.getNodeParameter('assignmentBrandId', itemIndex) as string;
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'DELETE',
			endpoint: `${base}/assignment`,
			includeBlogId: false,
			qs: { brandId: Number(brandId) || brandId },
		});
		return returnJsonArray({ deleted: true }, itemIndex);
	}

	if (operation === 'getRoles') {
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'GET',
				endpoint: `${base}/roles`,
				includeBlogId: false,
			}),
			itemIndex,
		);
	}

	if (operation === 'createRole') {
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'POST',
				endpoint: `${base}/roles`,
				includeBlogId: false,
				body: parseJsonObject(this.getNodeParameter('jsonBody', itemIndex)),
			}),
			itemIndex,
		);
	}

	if (operation === 'updateRole') {
		const roleId = this.getNodeParameter('roleId', itemIndex) as string;
		const body = parseJsonObject(this.getNodeParameter('jsonBody', itemIndex));
		const fields = assertPatchFields.call(
			this,
			body,
			itemIndex,
			'JSON Body must include at least one field to update (keys become the required fields query)',
		);
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'PATCH',
				endpoint: `${base}/roles/${roleId}`,
				includeBlogId: false,
				qs: { fields },
				body,
			}),
			itemIndex,
		);
	}

	if (operation === 'deleteRole') {
		const roleId = this.getNodeParameter('roleId', itemIndex) as string;
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'DELETE',
			endpoint: `${base}/roles/${roleId}`,
			includeBlogId: false,
		});
		return returnJsonArray({ deleted: true }, itemIndex);
	}

	return throwUnknownOperation.call(this, 'collaborator', operation, itemIndex);
}
