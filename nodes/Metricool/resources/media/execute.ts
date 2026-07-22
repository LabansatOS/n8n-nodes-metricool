import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { uploadBinaryToMetricool } from '../../helpers/mediaUpload';
import { getBlogId, returnJsonArray, throwUnknownOperation } from '../../GenericFunctions';

export async function executeMedia(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;

	if (operation === 'upload') {
		const blogId = getBlogId.call(this, itemIndex);
		const data = await uploadBinaryToMetricool.call(this, itemIndex, blogId);
		return returnJsonArray(data, itemIndex);
	}

	return throwUnknownOperation.call(this, 'media', operation, itemIndex);
}
