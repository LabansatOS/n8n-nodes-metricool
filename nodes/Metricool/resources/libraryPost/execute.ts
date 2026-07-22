import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { getBlogId, metricoolApiRequest, returnJsonArray, throwUnknownOperation } from '../../GenericFunctions';

function parseJson(value: unknown): IDataObject {
	if (typeof value === 'object' && value !== null) return value as IDataObject;
	return JSON.parse((value as string) || '{}') as IDataObject;
}

export async function executeLibraryPost(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const blogId = getBlogId.call(this, itemIndex);

	if (operation === 'getAll') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/scheduler/library/posts',
			blogId,
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'create') {
		const body = parseJson(this.getNodeParameter('jsonBody', itemIndex));
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'POST',
			endpoint: '/v2/scheduler/library/posts',
			blogId,
			body,
		});
		return returnJsonArray(data, itemIndex);
	}

	const id = this.getNodeParameter('libraryPostId', itemIndex) as string;

	if (operation === 'get') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/scheduler/library/posts/${id}`,
			blogId,
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'update') {
		const body = parseJson(this.getNodeParameter('jsonBody', itemIndex));
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PUT',
			endpoint: `/v2/scheduler/library/posts/${id}`,
			blogId,
			body,
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'delete') {
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'DELETE',
			endpoint: `/v2/scheduler/library/posts/${id}`,
			blogId,
		});
		return returnJsonArray({ deleted: true }, itemIndex);
	}

	if (operation === 'getEvents') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/scheduler/library/posts/${id}/events`,
			blogId,
		});
		return returnJsonArray(data, itemIndex);
	}

	return throwUnknownOperation.call(this, 'libraryPost', operation, itemIndex);
}
