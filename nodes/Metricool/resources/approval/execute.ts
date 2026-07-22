import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { getBlogId, metricoolApiRequest, returnJsonArray, throwUnknownOperation } from '../../GenericFunctions';

function parseJson(value: unknown): IDataObject | unknown[] {
	if (typeof value === 'object' && value !== null) return value as IDataObject;
	return JSON.parse((value as string) || '{}') as IDataObject;
}

export async function executeApproval(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;

	if (operation === 'sendToReview') {
		const blogId = getBlogId.call(this, itemIndex);
		const body = parseJson(this.getNodeParameter('jsonBody', itemIndex));
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PUT',
			endpoint: '/v2/scheduler/posts',
			blogId,
			body,
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'approveReject') {
		const blogId = getBlogId.call(this, itemIndex);
		const postId = this.getNodeParameter('postId', itemIndex) as string;
		const body = parseJson(this.getNodeParameter('jsonBody', itemIndex));
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PUT',
			endpoint: `/v2/scheduler/posts/${postId}/approvals`,
			blogId,
			body,
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'getConfig') {
		const blogId = getBlogId.call(this, itemIndex);
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/scheduler/posts/approvals-config',
			blogId,
		});
		return returnJsonArray(data, itemIndex);
	}

	const credentials = await this.getCredentials('metricoolApi');
	const targetUserId =
		(this.getNodeParameter('targetUserId', itemIndex, '') as string) ||
		(credentials.userId as string);

	if (operation === 'getTasks') {
		const splitStatuses = (raw: string): string[] =>
			raw
				.split(/[\n,]/)
				.map((s) => s.trim())
				.filter(Boolean);
		const editorStatuses = splitStatuses(
			this.getNodeParameter('editorStatuses', itemIndex, '') as string,
		);
		const reviewerStatuses = splitStatuses(
			this.getNodeParameter('reviewerStatuses', itemIndex, '') as string,
		);
		const qs: Record<string, unknown> = {};
		if (editorStatuses.length) {
			qs['editorStatus[]'] = editorStatuses;
		}
		if (reviewerStatuses.length) {
			qs['reviewerStatus[]'] = reviewerStatuses;
		}
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/scheduler/tasks/${targetUserId}`,
			includeBlogId: false,
			qs,
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'getCounters') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/scheduler/tasks/${targetUserId}/counters`,
			includeBlogId: false,
		});
		return returnJsonArray(data, itemIndex);
	}

	return throwUnknownOperation.call(this, 'approval', operation, itemIndex);
}
