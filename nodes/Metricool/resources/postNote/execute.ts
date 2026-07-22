import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { getBlogId, metricoolApiRequest, returnJsonArray, throwUnknownOperation } from '../../GenericFunctions';

function parseJson(value: unknown): IDataObject {
	if (typeof value === 'object' && value !== null) return value as IDataObject;
	return JSON.parse((value as string) || '{}') as IDataObject;
}

export async function executePostNote(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const blogId = getBlogId.call(this, itemIndex);

	if (operation === 'getEvents') {
		const uuid = this.getNodeParameter('postUuid', itemIndex) as string;
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/scheduler/posts/${uuid}/events`,
			blogId,
		});
		return returnJsonArray(data, itemIndex);
	}

	const postId = this.getNodeParameter('postId', itemIndex) as string;

	if (operation === 'getAll') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/scheduler/posts/${postId}/notes`,
			blogId,
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'create') {
		const content = this.getNodeParameter('content', itemIndex, '') as string;
		const extra = parseJson(this.getNodeParameter('jsonBody', itemIndex, '{}'));
		const sourcePostId = (this.getNodeParameter('sourcePostId', itemIndex, '') as string).trim();
		const qs: IDataObject = {};
		if (sourcePostId) {
			qs.sourcePostId = Number(sourcePostId) || sourcePostId;
		}
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'POST',
			endpoint: `/v2/scheduler/posts/${postId}/notes`,
			blogId,
			qs,
			body: { content, ...extra },
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'setStatus') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PUT',
			endpoint: `/v2/scheduler/posts/${postId}/notes/status`,
			blogId,
		});
		return returnJsonArray(data, itemIndex);
	}

	const noteId = this.getNodeParameter('noteId', itemIndex) as string;

	if (operation === 'update') {
		const content = this.getNodeParameter('content', itemIndex, '') as string;
		const extra = parseJson(this.getNodeParameter('jsonBody', itemIndex, '{}'));
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PUT',
			endpoint: `/v2/scheduler/posts/${postId}/notes/${noteId}`,
			blogId,
			body: { content, ...extra },
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'delete') {
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'DELETE',
			endpoint: `/v2/scheduler/posts/${postId}/notes/${noteId}`,
			blogId,
		});
		return returnJsonArray({ deleted: true }, itemIndex);
	}

	return throwUnknownOperation.call(this, 'postNote', operation, itemIndex);
}
