import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { getBlogId } from '../GenericFunctions';
import { normalizeDateTime, resolveBrandTimezone, toDateTimeInfo } from './dates';

function parseJsonParam(value: unknown, fieldName: string, context: IExecuteFunctions, itemIndex: number): IDataObject | unknown[] | undefined {
	if (value === undefined || value === null || value === '') {
		return undefined;
	}
	if (typeof value === 'object') {
		return value as IDataObject | unknown[];
	}
	try {
		return JSON.parse(value as string) as IDataObject | unknown[];
	} catch {
		throw new NodeOperationError(context.getNode(), `Invalid JSON in ${fieldName}`, { itemIndex });
	}
}

function splitLines(value: string): string[] {
	return value
		.split(/[\n,]/)
		.map((s) => s.trim())
		.filter(Boolean);
}

export async function buildScheduledPostBody(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<IDataObject> {
	const bodyMode = this.getNodeParameter('bodyMode', itemIndex, 'fields') as string;

	if (bodyMode === 'json') {
		const raw = this.getNodeParameter('jsonBody', itemIndex) as string | IDataObject;
		const parsed = parseJsonParam(raw, 'jsonBody', this, itemIndex);
		if (!parsed || Array.isArray(parsed)) {
			throw new NodeOperationError(this.getNode(), 'JSON Body must be an object', { itemIndex });
		}
		return parsed as IDataObject;
	}

	const text = this.getNodeParameter('text', itemIndex) as string;
	const blogId = getBlogId.call(this, itemIndex);
	const timezone = await resolveBrandTimezone.call(this, itemIndex, blogId);
	const publicationDateRaw = this.getNodeParameter('publicationDate', itemIndex) as string;
	const networks = this.getNodeParameter('networks', itemIndex) as string[];
	const mediaUrls = this.getNodeParameter('mediaUrls', itemIndex, '') as string;
	const mediaAltText = this.getNodeParameter('mediaAltText', itemIndex, '') as string;
	const firstCommentText = this.getNodeParameter('firstCommentText', itemIndex, '') as string;
	const autoPublish = this.getNodeParameter('autoPublish', itemIndex, true) as boolean;
	const draft = this.getNodeParameter('draft', itemIndex, false) as boolean;
	const shortener = this.getNodeParameter('shortener', itemIndex, false) as boolean;
	const descendantsRaw = this.getNodeParameter('descendantsJson', itemIndex, '') as string;
	const extraJson = this.getNodeParameter('extraJson', itemIndex, '') as string;

	if (!networks?.length) {
		throw new NodeOperationError(this.getNode(), 'Select at least one network', { itemIndex });
	}

	const media = mediaUrls ? splitLines(mediaUrls) : [];
	const body: IDataObject = {
		text,
		providers: networks.map((network) => ({ network })),
		publicationDate: toDateTimeInfo(normalizeDateTime(publicationDateRaw), timezone),
		autoPublish,
		draft,
		shortener,
		media,
	};

	if (mediaAltText) {
		body.mediaAltText = splitLines(mediaAltText);
	}
	if (firstCommentText) {
		body.firstCommentText = firstCommentText;
	}

	const descendants = parseJsonParam(descendantsRaw, 'descendantsJson', this, itemIndex);
	if (descendants) {
		body.descendants = descendants;
	}

	if (networks.includes('instagram')) {
		body.instagramData = {
			type: this.getNodeParameter('instagramType', itemIndex, 'POST'),
			showReelOnFeed: this.getNodeParameter('instagramShowReelOnFeed', itemIndex, true),
			collaborators: parseJsonParam(
				this.getNodeParameter('instagramCollaborators', itemIndex, ''),
				'instagramCollaborators',
				this,
				itemIndex,
			) ?? [],
		};
	}

	if (networks.includes('facebook')) {
		body.facebookData = {
			type: this.getNodeParameter('facebookType', itemIndex, 'POST'),
			title: this.getNodeParameter('facebookTitle', itemIndex, ''),
		};
	}

	if (networks.includes('tiktok')) {
		body.tiktokData = {
			privacyOption: this.getNodeParameter('tiktokPrivacy', itemIndex, 'PUBLIC_TO_EVERYONE'),
			disableComment: this.getNodeParameter('tiktokDisableComment', itemIndex, false),
			disableDuet: this.getNodeParameter('tiktokDisableDuet', itemIndex, false),
			disableStitch: this.getNodeParameter('tiktokDisableStitch', itemIndex, false),
			title: this.getNodeParameter('tiktokTitle', itemIndex, ''),
			commercialContentThirdParty: this.getNodeParameter('tiktokCommercialThirdParty', itemIndex, false),
			commercialContentOwnBrand: this.getNodeParameter('tiktokCommercialOwnBrand', itemIndex, false),
			autoAddMusic: this.getNodeParameter('tiktokAutoAddMusic', itemIndex, false),
		};
	}

	if (networks.includes('youtube')) {
		body.youtubeData = {
			title: this.getNodeParameter('youtubeTitle', itemIndex, ''),
			type: this.getNodeParameter('youtubeType', itemIndex, 'video'),
			privacy: this.getNodeParameter('youtubePrivacy', itemIndex, 'public'),
			madeForKids: this.getNodeParameter('youtubeMadeForKids', itemIndex, false),
			tags: splitLines(this.getNodeParameter('youtubeTags', itemIndex, '') as string),
			category: this.getNodeParameter('youtubeCategory', itemIndex, ''),
			playlistId: this.getNodeParameter('youtubePlaylistId', itemIndex, ''),
		};
	}

	if (networks.includes('pinterest')) {
		body.pinterestData = {
			boardId: this.getNodeParameter('pinterestBoardId', itemIndex, ''),
			pinTitle: this.getNodeParameter('pinterestPinTitle', itemIndex, ''),
			pinLink: this.getNodeParameter('pinterestPinLink', itemIndex, ''),
			pinNewFormat: this.getNodeParameter('pinterestNewFormat', itemIndex, false),
		};
	}

	if (networks.includes('linkedin')) {
		const linkedinType = this.getNodeParameter('linkedinType', itemIndex, 'post') as string;
		const linkedinData: IDataObject = {
			type: linkedinType,
			documentTitle: this.getNodeParameter('linkedinDocumentTitle', itemIndex, ''),
			publishImagesAsPDF: this.getNodeParameter('linkedinPublishImagesAsPDF', itemIndex, false),
			previewIncluded: this.getNodeParameter('linkedinPreviewIncluded', itemIndex, true),
		};
		if (linkedinType === 'poll') {
			const poll = parseJsonParam(
				this.getNodeParameter('linkedinPoll', itemIndex, '{}'),
				'linkedinPoll',
				this,
				itemIndex,
			);
			if (!poll || Array.isArray(poll) || Object.keys(poll).length === 0) {
				throw new NodeOperationError(
					this.getNode(),
					'LinkedIn Poll JSON is required when LinkedIn Type is Poll',
					{
						itemIndex,
						description: 'Provide ScheduledPostLinkedinPoll: question, options, settings',
					},
				);
			}
			linkedinData.poll = poll;
		}
		body.linkedinData = linkedinData;
	}

	if (networks.includes('twitter')) {
		const twitterType = (this.getNodeParameter('twitterType', itemIndex, '') as string).trim();
		const twitterData: IDataObject = {
			tags: [],
			replySettings: this.getNodeParameter('twitterReplySettings', itemIndex, ''),
			type: twitterType,
		};
		if (twitterType.toLowerCase() === 'poll') {
			const poll = parseJsonParam(
				this.getNodeParameter('twitterPoll', itemIndex, '{}'),
				'twitterPoll',
				this,
				itemIndex,
			);
			if (!poll || Array.isArray(poll) || Object.keys(poll).length === 0) {
				throw new NodeOperationError(
					this.getNode(),
					'X Poll JSON is required when Post Type is poll',
					{
						itemIndex,
						description:
							'Provide ScheduledPostTwitterPoll: options[{text}], settings (e.g. durationMinutes)',
					},
				);
			}
			twitterData.poll = poll;
		}
		body.twitterData = twitterData;
	}

	if (networks.includes('bluesky')) {
		const langs = splitLines(this.getNodeParameter('blueskyLanguages', itemIndex, '') as string);
		body.blueskyData = { postLanguages: langs };
	}

	if (networks.includes('threads')) {
		const codes = splitLines(this.getNodeParameter('threadsCountryCodes', itemIndex, '') as string);
		body.threadsData = { allowedCountryCodes: codes };
	}

	if (networks.includes('googleBusinessProfile')) {
		body.gmbData = {
			type: this.getNodeParameter('gmbType', itemIndex, ''),
		};
	}

	validateScheduledPost(this, itemIndex, body, networks, media, text);

	const mergeExtra = parseJsonParam(extraJson, 'extraJson', this, itemIndex);
	if (mergeExtra && !Array.isArray(mergeExtra)) {
		return { ...body, ...(mergeExtra as IDataObject) };
	}

	return body;
}

function validateScheduledPost(
	context: IExecuteFunctions,
	itemIndex: number,
	body: IDataObject,
	networks: string[],
	media: string[],
	text: string,
): void {
	if (networks.includes('twitter') && text.length > 280) {
		throw new NodeOperationError(
			context.getNode(),
			'The text exceeds the 280-character limit allowed on X.',
			{ itemIndex },
		);
	}
	if (networks.includes('bluesky') && text.length > 300) {
		throw new NodeOperationError(
			context.getNode(),
			'The text exceeds the 300-character limit allowed on Bluesky.',
			{ itemIndex },
		);
	}

	const ig = body.instagramData as IDataObject | undefined;
	if (networks.includes('instagram')) {
		const type = (ig?.type as string) || 'POST';
		if (['REEL', 'TRIAL_REEL'].includes(type) && media.length === 0) {
			throw new NodeOperationError(context.getNode(), 'Instagram Reels require a video URL in Media URLs', {
				itemIndex,
			});
		}
		if (type === 'POST' && media.length === 0) {
			throw new NodeOperationError(context.getNode(), 'Instagram posts require at least one image or video URL', {
				itemIndex,
			});
		}
	}

	const yt = body.youtubeData as IDataObject | undefined;
	if (networks.includes('youtube')) {
		if (!yt?.title) {
			throw new NodeOperationError(context.getNode(), 'YouTube posts require a title', { itemIndex });
		}
		if (media.length === 0) {
			throw new NodeOperationError(context.getNode(), 'YouTube posts require a video URL in Media URLs', {
				itemIndex,
			});
		}
	}

	const pin = body.pinterestData as IDataObject | undefined;
	if (networks.includes('pinterest')) {
		if (!pin?.boardId) {
			throw new NodeOperationError(context.getNode(), 'Pinterest posts require a Board ID', { itemIndex });
		}
		if (media.length === 0) {
			throw new NodeOperationError(context.getNode(), 'Pinterest posts require an image URL in Media URLs', {
				itemIndex,
			});
		}
	}
}
