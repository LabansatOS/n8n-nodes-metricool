import type { ILoadOptionsFunctions, INodeListSearchResult } from 'n8n-workflow';
import { metricoolApiRequest } from '../GenericFunctions';

export async function searchBrands(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<INodeListSearchResult> {
	let brands: Array<{ id?: number; label?: string; title?: string }> = [];

	try {
		const response = await metricoolApiRequest.call(this, {
			method: 'GET',
			endpoint: '/v2/settings/brands',
			includeBlogId: false,
		});
		brands = Array.isArray(response) ? response : [];
	} catch {
		const fallback = await metricoolApiRequest.call(this, {
			method: 'GET',
			endpoint: '/admin/simpleProfiles',
			includeBlogId: false,
		});
		brands = Array.isArray(fallback) ? fallback : [];
	}

	const filtered = brands.filter((brand) => {
		if (!filter) {
			return true;
		}
		const haystack = `${brand.label ?? ''} ${brand.title ?? ''} ${brand.id ?? ''}`.toLowerCase();
		return haystack.includes(filter.toLowerCase());
	});

	return {
		results: filtered.map((brand) => ({
			name: brand.label || brand.title || String(brand.id),
			value: String(brand.id),
			description: brand.title && brand.label !== brand.title ? brand.title : undefined,
		})),
	};
}
