import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { getBlogId, metricoolApiRequest, returnJsonArray, throwUnknownOperation } from '../../GenericFunctions';
import { toInboxProvider } from '../../helpers/networkCodes';

function parseJson(value: unknown): IDataObject {
	if (!value || value === '{}') return {};
	if (typeof value === 'object') return value as IDataObject;
	try {
		return JSON.parse(value as string) as IDataObject;
	} catch {
		return {};
	}
}

export async function executeInbox(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const blogId = getBlogId.call(this, itemIndex);

	if (operation === 'getConversations') {
		const provider = toInboxProvider(this.getNodeParameter('provider', itemIndex) as string);
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/inbox/conversations',
			blogId,
			qs: { provider },
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'sendMessage') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'POST',
			endpoint: '/v2/inbox/conversations',
			blogId,
			body: {
				provider: toInboxProvider(this.getNodeParameter('provider', itemIndex) as string),
				conversationId: this.getNodeParameter('conversationId', itemIndex),
				recipient: this.getNodeParameter('recipient', itemIndex),
				text: this.getNodeParameter('text', itemIndex, ''),
				attachment: this.getNodeParameter('attachment', itemIndex, ''),
			},
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'getComments') {
		const provider = toInboxProvider(this.getNodeParameter('provider', itemIndex) as string);
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/inbox/post-comments',
			blogId,
			qs: { provider },
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'createComment') {
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'POST',
			endpoint: '/v2/inbox/post-comments',
			blogId,
			body: {
				provider: toInboxProvider(this.getNodeParameter('provider', itemIndex) as string),
				objectId: this.getNodeParameter('objectId', itemIndex),
				text: this.getNodeParameter('text', itemIndex, ''),
				attachment: this.getNodeParameter('attachment', itemIndex, ''),
			},
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'deleteComment') {
		const additional = parseJson(this.getNodeParameter('additionalFields', itemIndex, '{}'));
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'DELETE',
			endpoint: '/v2/inbox/post-comments',
			blogId,
			qs: {
				provider: toInboxProvider(this.getNodeParameter('provider', itemIndex) as string),
				commentId: this.getNodeParameter('commentId', itemIndex),
				...additional,
			},
		});
		return returnJsonArray({ deleted: true }, itemIndex);
	}

	if (operation === 'changeStatus') {
		const additional = parseJson(this.getNodeParameter('additionalFields', itemIndex, '{}'));
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PUT',
			endpoint: '/v2/inbox/status',
			blogId,
			body: {
				provider: toInboxProvider(this.getNodeParameter('provider', itemIndex) as string),
				status: this.getNodeParameter('status', itemIndex),
				conversationId: this.getNodeParameter('conversationId', itemIndex),
				conversationType: this.getNodeParameter('conversationType', itemIndex),
				...additional,
			},
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'getNotes') {
		const provider = toInboxProvider(this.getNodeParameter('provider', itemIndex) as string);
		const additional = parseJson(this.getNodeParameter('additionalFields', itemIndex, '{}'));
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: '/v2/inbox/notes',
			blogId,
			qs: { provider, ...additional },
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'createNote' || operation === 'updateNote') {
		const body: IDataObject = {
			content: this.getNodeParameter('content', itemIndex, ''),
			provider: toInboxProvider(this.getNodeParameter('provider', itemIndex) as string),
		};
		const participantScreenName = (
			this.getNodeParameter('participantScreenName', itemIndex, '') as string
		).trim();
		const participantAccountId = (
			this.getNodeParameter('participantAccountId', itemIndex, '') as string
		).trim();
		if (participantScreenName) {
			body.participantScreenName = participantScreenName;
		}
		if (participantAccountId) {
			body.participantAccountId = participantAccountId;
		}
		if (operation === 'createNote') {
			const data = await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'POST',
				endpoint: '/v2/inbox/notes',
				blogId,
				body,
			});
			return returnJsonArray(data, itemIndex);
		}
		const noteId = this.getNodeParameter('noteId', itemIndex) as string;
		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PUT',
			endpoint: `/v2/inbox/notes/${noteId}`,
			blogId,
			body,
		});
		return returnJsonArray(data, itemIndex);
	}

	if (operation === 'deleteNote') {
		const noteId = this.getNodeParameter('noteId', itemIndex) as string;
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'DELETE',
			endpoint: `/v2/inbox/notes/${noteId}`,
			blogId,
		});
		return returnJsonArray({ deleted: true }, itemIndex);
	}

	return throwUnknownOperation.call(this, 'inbox', operation, itemIndex);
}
