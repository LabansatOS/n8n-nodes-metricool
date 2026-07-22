import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { getBlogId, metricoolApiRequest, returnJsonArray, throwUnknownOperation } from '../../GenericFunctions';

function parseJson(value: unknown): IDataObject {
	if (typeof value === 'object' && value !== null) return value as IDataObject;
	return JSON.parse((value as string) || '{}') as IDataObject;
}

export async function executeLinkInBio(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;
	const blogId = getBlogId.call(this, itemIndex);
	// Legacy Linkin Bio routes document lowercase `blogid` (not camelCase blogId).
	const qsBase = { blogid: blogId };

	const getMap: Record<string, string> = {
		getButtons: '/linkinbio/instagram/getbioButtons',
		getCatalog: '/linkinbio/instagram/getbiocatalog',
		addButton: '/linkinbio/instagram/addcatalogButton',
		editButton: '/linkinbio/instagram/editcatalogbutton',
		editCatalogItem: '/linkinbio/instagram/editcatalogitem',
		deleteCatalogItem: '/linkinbio/instagram/deletecatalogitem',
		deleteCatalogImage: '/linkinbio/instagram/deletecatalogimage',
		updateButtonPosition: '/linkinbio/instagram/updateButtonPosition',
	};

	if (operation === 'addCatalogItems') {
		return returnJsonArray(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'POST',
				endpoint: '/linkinbio/instagram/addcatalogitems',
				includeBlogId: false,
				qs: qsBase,
				body: parseJson(this.getNodeParameter('jsonBody', itemIndex)),
			}),
			itemIndex,
		);
	}

	if (operation === 'deleteCatalogItem' || operation === 'deleteCatalogImage') {
		const additional = parseJson(this.getNodeParameter('additionalQuery', itemIndex, '{}'));
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'DELETE',
			endpoint: getMap[operation],
			includeBlogId: false,
			qs: { ...qsBase, ...additional },
		});
		return returnJsonArray({ deleted: true }, itemIndex);
	}

	const endpoint = getMap[operation];
	if (!endpoint) return throwUnknownOperation.call(this, 'linkInBio', operation, itemIndex);

	const qs: IDataObject = { ...qsBase };
	if (operation === 'getCatalog') {
		const editable = this.getNodeParameter('editable', itemIndex, false) as boolean;
		if (editable) {
			// Swagger types query param `editable` as string
			qs.editable = 'true';
		}
	} else if (operation !== 'getButtons') {
		Object.assign(qs, parseJson(this.getNodeParameter('additionalQuery', itemIndex, '{}')));
	}

	return returnJsonArray(
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint,
			includeBlogId: false,
			qs,
		}),
		itemIndex,
	);
}
