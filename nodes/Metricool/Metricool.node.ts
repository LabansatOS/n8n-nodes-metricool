import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeConnectionTypes, NodeApiError, NodeOperationError } from 'n8n-workflow';

import { searchBrands } from './methods/listSearch';
import {
	getAnalyticsMetrics,
	getAnalyticsSubjects,
	getBrandNetworks,
	getBrandNetworksForAnalyticsMetrics,
	getBrandNetworksForAnalyticsPosts,
	getBrandNetworksForBestTime,
	getBrandNetworksForCompetitors,
	getBrandNetworksForReels,
	getBrandNetworksForScheduledPost,
	getBrandNetworksForStories,
	getPinterestBoards,
	getTimezones,
} from './methods/loadOptions';

import { brandFields, brandOperations } from './resources/brand';
import { executeBrand } from './resources/brand/execute';
import { scheduledPostFields, scheduledPostOperations } from './resources/scheduledPost';
import { executeScheduledPost } from './resources/scheduledPost/execute';
import { analyticsFields, analyticsOperations } from './resources/analytics';
import { executeAnalytics } from './resources/analytics/execute';
import { bestTimeFields, bestTimeOperations } from './resources/bestTime';
import { executeBestTime } from './resources/bestTime/execute';
import { mediaFields, mediaOperations } from './resources/media';
import { executeMedia } from './resources/media/execute';
import { inboxFields, inboxOperations } from './resources/inbox';
import { executeInbox } from './resources/inbox/execute';
import { reviewFields, reviewOperations } from './resources/review';
import { executeReview } from './resources/review/execute';
import { competitorFields, competitorOperations } from './resources/competitor';
import { executeCompetitor } from './resources/competitor/execute';
import { libraryPostFields, libraryPostOperations } from './resources/libraryPost';
import { executeLibraryPost } from './resources/libraryPost/execute';
import { smartLinkFields, smartLinkOperations } from './resources/smartLink';
import { executeSmartLink } from './resources/smartLink/execute';
import { approvalFields, approvalOperations } from './resources/approval';
import { executeApproval } from './resources/approval/execute';
import { postNoteFields, postNoteOperations } from './resources/postNote';
import { executePostNote } from './resources/postNote/execute';
import { agencyFields, agencyOperations } from './resources/agency';
import { executeAgency } from './resources/agency/execute';
import { collaboratorFields, collaboratorOperations } from './resources/collaborator';
import { executeCollaborator } from './resources/collaborator/execute';
import { adsFields, adsOperations } from './resources/ads';
import { executeAds } from './resources/ads/execute';
import { linkInBioFields, linkInBioOperations } from './resources/linkInBio';
import { executeLinkInBio } from './resources/linkInBio/execute';

export class Metricool implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Metricool',
		name: 'metricool',
		icon: { light: 'file:metricool.svg', dark: 'file:metricool.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the Metricool API for social scheduling, analytics, and inbox',
		defaults: {
			name: 'Metricool',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'metricoolApi', required: true }],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Ad', value: 'ads' },
					{ name: 'Agency', value: 'agency' },
					{ name: 'Analytics', value: 'analytics' },
					{ name: 'Approval', value: 'approval' },
					{ name: 'Best Time', value: 'bestTime' },
					{ name: 'Brand', value: 'brand' },
					{ name: 'Collaborator', value: 'collaborator' },
					{ name: 'Competitor', value: 'competitor' },
					{ name: 'Inbox', value: 'inbox' },
					{ name: 'Library Post', value: 'libraryPost' },
					{ name: 'Link in Bio', value: 'linkInBio' },
					{ name: 'Media', value: 'media' },
					{ name: 'Post Note', value: 'postNote' },
					{ name: 'Review', value: 'review' },
					{ name: 'Scheduled Post', value: 'scheduledPost' },
					{ name: 'Smart Link', value: 'smartLink' },
				],
				default: 'brand',
			},
			...brandOperations,
			...brandFields,
			...scheduledPostOperations,
			...scheduledPostFields,
			...analyticsOperations,
			...analyticsFields,
			...bestTimeOperations,
			...bestTimeFields,
			...mediaOperations,
			...mediaFields,
			...inboxOperations,
			...inboxFields,
			...reviewOperations,
			...reviewFields,
			...competitorOperations,
			...competitorFields,
			...libraryPostOperations,
			...libraryPostFields,
			...smartLinkOperations,
			...smartLinkFields,
			...approvalOperations,
			...approvalFields,
			...postNoteOperations,
			...postNoteFields,
			...agencyOperations,
			...agencyFields,
			...collaboratorOperations,
			...collaboratorFields,
			...adsOperations,
			...adsFields,
			...linkInBioOperations,
			...linkInBioFields,
		],
	};

	methods = {
		listSearch: {
			searchBrands,
		},
		loadOptions: {
			getTimezones,
			getPinterestBoards,
			getAnalyticsSubjects,
			getAnalyticsMetrics,
			getBrandNetworks,
			getBrandNetworksForAnalyticsMetrics,
			getBrandNetworksForAnalyticsPosts,
			getBrandNetworksForReels,
			getBrandNetworksForStories,
			getBrandNetworksForBestTime,
			getBrandNetworksForScheduledPost,
			getBrandNetworksForCompetitors,
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', itemIndex) as string;
				let results: INodeExecutionData[] = [];

				switch (resource) {
					case 'brand':
						results = await executeBrand.call(this, itemIndex);
						break;
					case 'scheduledPost':
						results = await executeScheduledPost.call(this, itemIndex);
						break;
					case 'analytics':
						results = await executeAnalytics.call(this, itemIndex);
						break;
					case 'bestTime':
						results = await executeBestTime.call(this, itemIndex);
						break;
					case 'media':
						results = await executeMedia.call(this, itemIndex);
						break;
					case 'inbox':
						results = await executeInbox.call(this, itemIndex);
						break;
					case 'review':
						results = await executeReview.call(this, itemIndex);
						break;
					case 'competitor':
						results = await executeCompetitor.call(this, itemIndex);
						break;
					case 'libraryPost':
						results = await executeLibraryPost.call(this, itemIndex);
						break;
					case 'smartLink':
						results = await executeSmartLink.call(this, itemIndex);
						break;
					case 'approval':
						results = await executeApproval.call(this, itemIndex);
						break;
					case 'postNote':
						results = await executePostNote.call(this, itemIndex);
						break;
					case 'agency':
						results = await executeAgency.call(this, itemIndex);
						break;
					case 'collaborator':
						results = await executeCollaborator.call(this, itemIndex);
						break;
					case 'ads':
						results = await executeAds.call(this, itemIndex);
						break;
					case 'linkInBio':
						results = await executeLinkInBio.call(this, itemIndex);
						break;
					default:
						throw new NodeOperationError(this.getNode(), `Unknown resource: ${resource}`, {
							itemIndex,
						});
				}

				returnData.push(...results);
			} catch (error) {
				if (this.continueOnFail()) {
					const err = error as Error & { description?: string };
					returnData.push({
						json: {
							error: err.message,
							description: err.description,
						},
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				// Preserve specialized errors; only wrap unexpected failures
				if (error instanceof NodeApiError) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject, {
						itemIndex,
						message: error.message,
						description: error.description ?? undefined,
					});
				}

				if (error instanceof NodeOperationError) {
					throw new NodeOperationError(this.getNode(), error.message, {
						itemIndex,
						description: error.description ?? undefined,
					});
				}

				throw new NodeOperationError(this.getNode(), error as Error, {
					itemIndex,
				});
			}
		}

		return [returnData];
	}
}
