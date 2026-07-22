import type { INodeProperties } from 'n8n-workflow';
import { blogIdProperty } from '../../descriptions/shared';

export const linkInBioOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['linkInBio'] } },
		options: [
			{
				name: 'Add Button',
				value: 'addButton',
				action: 'Add instagram bio button',
				description: 'Add a button to the Instagram link in bio',
			},
			{
				name: 'Add Catalog Items',
				value: 'addCatalogItems',
				action: 'Add catalog pictures',
				description: 'Add pictures to the Instagram bio catalog',
			},
			{
				name: 'Delete Button',
				value: 'deleteCatalogItem',
				action: 'Delete instagram bio button',
				description:
					'Delete an Instagram link-in-bio button (link-tree row). Use Delete Catalog Image for catalog pictures.',
			},
			{
				name: 'Delete Catalog Image',
				value: 'deleteCatalogImage',
				action: 'Delete catalog image',
				description: 'Delete an image from the Instagram bio catalog permanently',
			},
			{
				name: 'Edit Button',
				value: 'editButton',
				action: 'Edit instagram bio button',
				description: 'Update an existing Instagram bio button',
			},
			{
				name: 'Edit Catalog Item',
				value: 'editCatalogItem',
				action: 'Edit catalog item',
				description: 'Update an item in the Instagram bio catalog',
			},
			{
				name: 'Get Buttons',
				value: 'getButtons',
				action: 'Get instagram bio buttons',
				description: 'Retrieve buttons from the Instagram link in bio',
			},
			{
				name: 'Get Catalog',
				value: 'getCatalog',
				action: 'Get instagram bio catalog',
				description: 'Retrieve the Instagram bio product catalog',
			},
			{
				name: 'Update Button Position',
				value: 'updateButtonPosition',
				action: 'Update button position',
				description: 'Change the order of an Instagram bio button',
			},
		],
		default: 'getButtons',
	},
];

export const linkInBioFields: INodeProperties[] = [
	blogIdProperty({ show: { resource: ['linkInBio'] } }),
	{
		displayName: 'Editable',
		name: 'editable',
		type: 'boolean',
		default: false,
		description: 'Whether to request the editable catalog view (query param editable)',
		displayOptions: {
			show: { resource: ['linkInBio'], operation: ['getCatalog'] },
		},
	},
	{
		displayName: 'Additional Query',
		name: 'additionalQuery',
		type: 'json',
		default: '{}',
		description:
			'Query params for mutating ops (e.g. textbutton, linkbutton, positionbutton, colorbutton, itemid, link, text, color, itemposition). Brand is sent as blogid automatically.',
		displayOptions: {
			show: {
				resource: ['linkInBio'],
				operation: [
					'addButton',
					'editButton',
					'editCatalogItem',
					'deleteCatalogItem',
					'deleteCatalogImage',
					'updateButtonPosition',
				],
			},
		},
	},
	{
		displayName: 'JSON Body',
		name: 'jsonBody',
		type: 'json',
		default: '{}',
		displayOptions: {
			show: { resource: ['linkInBio'], operation: ['addCatalogItems'] },
		},
	},
];
