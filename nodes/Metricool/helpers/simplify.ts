import type { IDataObject } from 'n8n-workflow';

function asObject(value: unknown): IDataObject | undefined {
	if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
		return value as IDataObject;
	}
	return undefined;
}

function mapItems(data: unknown, mapOne: (item: IDataObject) => IDataObject): unknown {
	if (Array.isArray(data)) {
		return data.map((entry) => {
			const obj = asObject(entry);
			return obj ? mapOne(obj) : entry;
		});
	}
	const obj = asObject(data);
	return obj ? mapOne(obj) : data;
}

/** Keep the most useful Brand fields (max 10) and flatten network keys */
export function simplifyBrand(data: unknown): unknown {
	return mapItems(data, (item) => {
		const networksData = asObject(item.networksData);
		const simplified: IDataObject = {
			id: item.id,
			label: item.label,
			title: item.title,
			description: item.description,
			timezone: item.timezone,
			image: item.image,
			ownerUsername: item.ownerUsername,
			isShared: item.isShared,
			brandRole: item.brandRole,
			networks: networksData ? Object.keys(networksData) : item.networksData,
		};
		return simplified;
	});
}

/** Keep the most useful Scheduled Post fields (max 10) and flatten nested dates/media */
export function simplifyScheduledPost(data: unknown): unknown {
	return mapItems(data, (item) => {
		const publication = asObject(item.publicationDate);
		const media = item.media;
		const providers = item.providers;

		let networks: IDataObject['networks'] = providers;
		const providersObj = asObject(providers);
		if (providersObj) {
			networks = Object.keys(providersObj).filter((key) => Boolean(providersObj[key]));
		} else if (Array.isArray(providers)) {
			networks = providers;
		}

		let mediaUrls: IDataObject['mediaUrls'] = media;
		if (Array.isArray(media)) {
			mediaUrls = media.map((entry) => {
				if (typeof entry === 'string') return entry;
				const mediaObj = asObject(entry);
				return mediaObj?.url ?? mediaObj?.mediaUrl ?? entry;
			}) as IDataObject['mediaUrls'];
		}

		const simplified: IDataObject = {
			id: item.id,
			text: item.text,
			publicationDate: publication
				? (publication.dateTime ?? publication.date ?? item.publicationDate)
				: item.publicationDate,
			publicationTimezone: publication?.timezone,
			networks,
			mediaUrls,
			autoPublish: item.autoPublish,
			draft: item.draft,
			shortener: item.shortener,
			firstCommentText: item.firstCommentText,
		};
		return simplified;
	});
}
