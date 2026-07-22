import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { buildScheduledPostBody } from '../../helpers/scheduledPostBody';
import { normalizeDateTime, resolveBrandTimezone, toDateTimeInfo } from '../../helpers/dates';
import { simplifyScheduledPost } from '../../helpers/simplify';
import { getBlogId, metricoolApiRequest, returnJsonArray, throwUnknownOperation } from '../../GenericFunctions';

export async function executeScheduledPost(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const blogId = getBlogId.call(this, itemIndex);

	if (operation === 'getAll') {
		const simplify = this.getNodeParameter('simplify', itemIndex, true) as boolean;
		const filter = (this.getNodeParameter('filter', itemIndex, '') as string).trim();

		// When filter is set, swagger ignores all other query params.
		const qs: Record<string, unknown> = {};
		if (filter) {
			qs.filter = filter;
		} else {
			const startRaw = (this.getNodeParameter('start', itemIndex, '') as string).trim();
			const endRaw = (this.getNodeParameter('end', itemIndex, '') as string).trim();
			if (!startRaw || !endRaw) {
				throw new NodeOperationError(
					this.getNode(),
					'Start and End are required unless Filter is set',
					{ itemIndex },
				);
			}
			const timezone = await resolveBrandTimezone.call(this, itemIndex, blogId);
			const extendedRange = this.getNodeParameter('extendedRange', itemIndex, false) as boolean;
			qs.start = normalizeDateTime(startRaw);
			qs.end = normalizeDateTime(endRaw);
			qs.timezone = timezone;
			qs.extendedRange = extendedRange;
		}

		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/scheduler/posts',
			blogId,
			qs,
		});
		return returnJsonArray(simplify ? simplifyScheduledPost(data) : data, itemIndex);
	}

	if (operation === 'getDeleted') {
		const orderBy = this.getNodeParameter('orderBy', itemIndex) as string;
		const orderDirection = this.getNodeParameter('orderDirection', itemIndex) as string;
		const page = this.getNodeParameter('page', itemIndex, 0) as number;
		const pageSize = this.getNodeParameter('pageSize', itemIndex, 50) as number;
		const timezone = await resolveBrandTimezone.call(this, itemIndex, blogId);
		const qs: Record<string, unknown> = {
			orderBy,
			orderDirection,
			page,
			pageSize,
			timezone,
		};
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/scheduler/posts/deleted',
			blogId,
			qs,
		});
		return returnJsonArray(data, itemIndex);
	}

	// Create has no postId — read it only for ops that target an existing post
	if (operation === 'create') {
		const body = await buildScheduledPostBody.call(this, itemIndex);
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'POST',
			endpoint: '/v2/scheduler/posts',
			blogId,
			body,
		});
		return returnJsonArray(data, itemIndex);
	}

	const postId = this.getNodeParameter('postId', itemIndex) as string;

	if (operation === 'get') {
		const simplify = this.getNodeParameter('simplify', itemIndex, true) as boolean;
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/scheduler/posts/${postId}`,
			blogId,
		});
		return returnJsonArray(simplify ? simplifyScheduledPost(data) : data, itemIndex);
	}

	if (operation === 'update') {
		const body = await buildScheduledPostBody.call(this, itemIndex);
		const numericId = Number(postId);
		body.id = Number.isFinite(numericId) ? numericId : postId;

		const uuid = this.getNodeParameter('uuid', itemIndex, '') as string;
		if (uuid) {
			body.uuid = uuid;
		}

		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PUT',
			endpoint: `/v2/scheduler/posts/${postId}`,
			blogId,
			body,
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'updatePartial') {
		const publicationDateRaw = this.getNodeParameter('publicationDate', itemIndex) as string;
		const timezone = await resolveBrandTimezone.call(this, itemIndex, blogId);

		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PATCH',
			endpoint: `/v2/scheduler/posts/${postId}`,
			blogId,
			qs: { fields: ['publicationDate'] },
			body: {
				publicationDate: toDateTimeInfo(normalizeDateTime(publicationDateRaw), timezone),
			},
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'delete') {
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'DELETE',
			endpoint: `/v2/scheduler/posts/${postId}`,
			blogId,
		});
		return returnJsonArray({ deleted: true }, itemIndex);
	}

	if (operation === 'restore') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PUT',
			endpoint: `/v2/scheduler/posts/deleted/${postId}`,
			blogId,
		});
		return returnJsonArray(data ?? { success: true, id: postId }, itemIndex);
	}

	return throwUnknownOperation.call(this, 'scheduledPost', operation, itemIndex);
}
