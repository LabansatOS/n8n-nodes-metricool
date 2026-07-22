import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import {
	assertPatchFields,
	getBlogId,
	metricoolApiRequest,
	returnJsonArray,
	throwUnknownOperation,
} from '../../GenericFunctions';
import { simplifyBrand } from '../../helpers/simplify';

export async function executeBrand(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;

	if (operation === 'getAll') {
		const simplify = this.getNodeParameter('simplify', itemIndex, true) as boolean;
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/settings/brands',
			includeBlogId: false,
		});
		return returnJsonArray(simplify ? simplifyBrand(data) : data, itemIndex);
	}

	const blogId = getBlogId.call(this, itemIndex);

	if (operation === 'get') {
		const simplify = this.getNodeParameter('simplify', itemIndex, true) as boolean;
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/settings/brands/${blogId}`,
			blogId,
		});
		return returnJsonArray(simplify ? simplifyBrand(data) : data, itemIndex);
	}

	if (operation === 'update') {
		const updateFields = this.getNodeParameter('updateFields', itemIndex, {}) as IDataObject;
		const body: Record<string, unknown> = {};
		for (const key of ['label', 'timezone', 'description'] as const) {
			if (Object.prototype.hasOwnProperty.call(updateFields, key)) {
				body[key] = updateFields[key] ?? '';
			}
		}
		const fields = assertPatchFields.call(
			this,
			body,
			itemIndex,
			'Add at least one field under Update Fields',
		);
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PATCH',
			endpoint: `/v2/settings/brands/${blogId}`,
			blogId,
			qs: { fields },
			body,
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'delete') {
		const maxRecoveryDays = Math.min(
			45,
			Math.max(0, this.getNodeParameter('maxRecoveryDays', itemIndex, 30) as number),
		);
		const agencyId = (this.getNodeParameter('agencyId', itemIndex, '') as string).trim();
		const body: Record<string, unknown> = { maxRecoveryDays };
		if (agencyId) {
			body.agencyId = Number(agencyId) || agencyId;
		}
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'DELETE',
			endpoint: `/v2/settings/brands/${blogId}`,
			blogId,
			body,
		});
		return returnJsonArray({ deleted: true }, itemIndex);
	}

	return throwUnknownOperation.call(this, 'brand', operation, itemIndex);
}
