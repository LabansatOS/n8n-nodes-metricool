import { createHash } from 'crypto';
import type { IDataObject, IExecuteFunctions, JsonObject } from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import { metricoolApiRequest } from '../GenericFunctions';

const PART_SIZE = 5 * 1024 * 1024;

function extensionFromMime(mime: string, fileName?: string): string {
	if (fileName?.includes('.')) {
		return fileName.split('.').pop()!.toLowerCase();
	}
	const map: Record<string, string> = {
		'image/jpeg': 'jpg',
		'image/png': 'png',
		'image/gif': 'gif',
		'image/webp': 'webp',
		'video/mp4': 'mp4',
		'video/quicktime': 'mov',
		'video/webm': 'webm',
	};
	return map[mime] || 'bin';
}

function mediaKindFromMime(mime: string): 'image' | 'video' {
	return mime.startsWith('video/') ? 'video' : 'image';
}

type UploadPart = {
	size: number;
	startByte: number;
	endByte: number;
	hash: string;
};

type MetricoolPartUrl = {
	partNumber?: number;
	presignedUrl?: string;
	url?: string;
	uploadUrl?: string;
	startByte?: number;
	endByte?: number;
};

function buildParts(buffer: Buffer): UploadPart[] {
	const parts: UploadPart[] = [];
	if (buffer.length <= PART_SIZE) {
		parts.push({
			size: buffer.length,
			startByte: 0,
			endByte: buffer.length,
			hash: createHash('sha256').update(buffer).digest('base64'),
		});
		return parts;
	}
	for (let start = 0; start < buffer.length; start += PART_SIZE) {
		const end = Math.min(start + PART_SIZE, buffer.length);
		const chunk = buffer.subarray(start, end);
		parts.push({
			size: chunk.length,
			startByte: start,
			endByte: end,
			hash: createHash('sha256').update(chunk).digest('base64'),
		});
	}
	return parts;
}

function asObject(value: unknown): IDataObject | undefined {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		return undefined;
	}
	return value as IDataObject;
}

/** Metricool may wrap payloads in `{ data: ... }` depending on client unwrap timing. */
function resolveUploadTransaction(raw: unknown): IDataObject {
	const obj = asObject(raw) ?? {};
	const nested = asObject(obj.data);
	return nested ?? obj;
}

function pickString(...values: unknown[]): string | undefined {
	for (const value of values) {
		if (typeof value === 'string' && value.trim() !== '') {
			return value;
		}
	}
	return undefined;
}

async function putToPresignedUrl(
	this: IExecuteFunctions,
	url: string,
	body: Buffer,
	contentType: string,
	checksumSha256Base64: string,
): Promise<string | undefined> {
	const response = await this.helpers.httpRequest({
		method: 'PUT',
		url,
		body,
		headers: {
			'Content-Type': contentType,
			'Content-Length': String(body.length),
			// Presigned URLs from Metricool sign this header for Object Lock / integrity.
			'x-amz-checksum-sha256': checksumSha256Base64,
		},
		encoding: 'arraybuffer',
		json: false,
		returnFullResponse: true,
	});

	const headers = asObject((response as IDataObject).headers) ?? {};
	const etag = pickString(headers.etag, headers.ETag);
	return etag;
}

export async function uploadBinaryToMetricool(
	this: IExecuteFunctions,
	itemIndex: number,
	blogId: string,
): Promise<IDataObject> {
	const rawBinaryPropertyName = this.getNodeParameter('binaryPropertyName', itemIndex) as string;
	// Guard against values saved as expressions like "=data"
	const binaryPropertyName =
		String(rawBinaryPropertyName ?? 'data')
			.replace(/^=+/, '')
			.trim() || 'data';
	const binaryData = this.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	const buffer = await this.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	const contentType = binaryData.mimeType || 'application/octet-stream';
	const fileExtension = extensionFromMime(contentType, binaryData.fileName);
	// Metricool S3 upload enum is storage strategy, not MIME kind: planner | studio-logo
	const resourceType = 'planner';
	const mediaKind = mediaKindFromMime(contentType);
	const parts = buildParts(buffer);

	const createResponse = resolveUploadTransaction(
		await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'PUT',
			endpoint: '/v2/media/s3/upload-transactions',
			blogId,
			body: {
				resourceType,
				contentType,
				fileExtension,
				parts,
			},
		}),
	);

	try {
		const uploadType = String(createResponse.uploadType ?? '').toUpperCase();
		const fileUrl = pickString(createResponse.fileUrl, createResponse.publicUrl);
		const key = pickString(createResponse.key);
		const uploadId = pickString(createResponse.uploadId);
		const multipartParts = Array.isArray(createResponse.parts)
			? (createResponse.parts as MetricoolPartUrl[])
			: [];

		const simplePresignedUrl = pickString(
			createResponse.presignedUrl,
			createResponse.uploadUrl,
			createResponse.url,
		);

		const isSimple =
			uploadType === 'SIMPLE' ||
			(!uploadId && Boolean(simplePresignedUrl)) ||
			(parts.length === 1 && Boolean(simplePresignedUrl));

		if (isSimple) {
			if (!simplePresignedUrl) {
				throw new NodeOperationError(
					this.getNode(),
					'Metricool returned a SIMPLE upload transaction without presignedUrl',
					{
						itemIndex,
						description: `Response keys: ${Object.keys(createResponse).join(', ')}`,
					},
				);
			}

			await putToPresignedUrl.call(
				this,
				simplePresignedUrl,
				buffer,
				contentType,
				parts[0].hash,
			);

			const completeResponse = resolveUploadTransaction(
				await metricoolApiRequest.call(this, {
					itemIndex,
					method: 'PATCH',
					endpoint: '/v2/media/s3/upload-transactions',
					blogId,
					body: {
						simple: {
							fileUrl: fileUrl || simplePresignedUrl.split('?')[0],
						},
					},
				}),
			);

			const mediaUrl = pickString(
				completeResponse.convertedFileUrl,
				completeResponse.fileUrl,
				completeResponse.url,
				completeResponse.publicUrl,
				completeResponse.mediaUrl,
				fileUrl,
			);

			return {
				...completeResponse,
				mediaUrl,
				key,
				bucket: createResponse.bucket,
				contentType,
				fileName: binaryData.fileName,
				resourceType,
				mediaKind,
				uploadType: 'SIMPLE',
			};
		}

		if (!uploadId || !key || multipartParts.length === 0) {
			throw new NodeOperationError(
				this.getNode(),
				'Unexpected Metricool multipart upload transaction response',
				{
					itemIndex,
					description: `Expected uploadId, key, and parts[].presignedUrl. Got keys: ${Object.keys(createResponse).join(', ')}`,
				},
			);
		}

		const completedParts: Array<{ partNumber: number; etag: string }> = [];
		for (let i = 0; i < multipartParts.length; i++) {
			const partMeta = multipartParts[i];
			const partUrl = pickString(partMeta.presignedUrl, partMeta.uploadUrl, partMeta.url);
			if (!partUrl) {
				throw new NodeOperationError(
					this.getNode(),
					`Missing presignedUrl for multipart part ${i + 1}`,
					{ itemIndex },
				);
			}

			const start = partMeta.startByte ?? parts[i]?.startByte ?? 0;
			const end = partMeta.endByte ?? parts[i]?.endByte ?? buffer.length;
			const chunk = buffer.subarray(start, end);
			const checksum = parts[i]?.hash ?? createHash('sha256').update(chunk).digest('base64');
			const etag = await putToPresignedUrl.call(this, partUrl, chunk, contentType, checksum);
			if (!etag) {
				throw new NodeOperationError(
					this.getNode(),
					`S3 upload for part ${i + 1} did not return an ETag`,
					{
						itemIndex,
						description:
							'Multipart complete requires a non-empty etag per part. Retry the upload or use a smaller file.',
					},
				);
			}
			completedParts.push({
				partNumber: partMeta.partNumber ?? i + 1,
				etag,
			});
		}

		const completeResponse = resolveUploadTransaction(
			await metricoolApiRequest.call(this, {
				itemIndex,
				method: 'PATCH',
				endpoint: '/v2/media/s3/upload-transactions',
				blogId,
				body: {
					multipart: {
						uploadId,
						key,
						parts: completedParts,
					},
				},
			}),
		);

		const mediaUrl = pickString(
			completeResponse.convertedFileUrl,
			completeResponse.fileUrl,
			completeResponse.url,
			completeResponse.publicUrl,
			completeResponse.mediaUrl,
			fileUrl,
		);

		return {
			...completeResponse,
			mediaUrl,
			key,
			bucket: createResponse.bucket,
			contentType,
			fileName: binaryData.fileName,
			resourceType,
			mediaKind,
			uploadType: 'MULTIPART',
		};
	} catch (error) {
		try {
			const abortUploadId = pickString(createResponse.uploadId);
			const abortKey = pickString(createResponse.key);
			const abortBucket = pickString(createResponse.bucket);
			if (abortUploadId && abortKey && abortBucket) {
				await metricoolApiRequest.call(this, {
					itemIndex,
					method: 'DELETE',
					endpoint: '/v2/media/s3/upload-transactions',
					blogId,
					qs: {
						uploadId: abortUploadId,
						key: abortKey,
						bucket: abortBucket,
					},
				});
			}
		} catch {
			// ignore abort errors
		}
		if (error instanceof NodeOperationError) {
			throw new NodeOperationError(this.getNode(), error.message, {
				itemIndex,
				description: error.description ?? undefined,
			});
		}
		if (error instanceof NodeApiError) {
			throw new NodeApiError(this.getNode(), error as unknown as JsonObject, {
				itemIndex,
				message: error.message,
				description: error.description ?? undefined,
			});
		}
		throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
	}
}
