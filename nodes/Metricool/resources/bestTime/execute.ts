import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { normalizeDateTime, resolveBrandTimezone } from '../../helpers/dates';
import { getBlogId, metricoolApiRequest, returnJsonArray, throwUnknownOperation } from '../../GenericFunctions';

type BestHour = { hourOfDay?: number; value?: number };
type BestDay = { dayOfWeek?: number; bestTimesByHour?: BestHour[] };

function asBestDays(data: unknown): BestDay[] {
	if (!Array.isArray(data)) {
		return [];
	}
	return data as BestDay[];
}

/** Highest-scoring hour across all returned days (Metricool dayOfWeek: 1=Mon … 7=Sun). */
function pickBestSlot(days: BestDay[]): IDataObject | undefined {
	let best: { dayOfWeek: number; hourOfDay: number; value: number } | undefined;

	for (const day of days) {
		const dayOfWeek = Number(day.dayOfWeek);
		if (!Number.isFinite(dayOfWeek)) {
			continue;
		}
		for (const hour of day.bestTimesByHour ?? []) {
			const hourOfDay = Number(hour.hourOfDay);
			const value = Number(hour.value);
			if (!Number.isFinite(hourOfDay) || !Number.isFinite(value)) {
				continue;
			}
			if (!best || value > best.value) {
				best = { dayOfWeek, hourOfDay, value };
			}
		}
	}

	return best;
}

export async function executeBestTime(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<INodeExecutionData[]> {
	const operation = this.getNodeParameter('operation', itemIndex) as string;

	if (operation === 'get') {
		const blogId = getBlogId.call(this, itemIndex);
		const provider = this.getNodeParameter('provider', itemIndex) as string;
		const startRaw = this.getNodeParameter('start', itemIndex, '') as string;
		const endRaw = this.getNodeParameter('end', itemIndex, '') as string;
		const timezone = await resolveBrandTimezone.call(this, itemIndex, blogId);

		const qs: Record<string, string> = { timezone };
		if (startRaw) {
			qs.start = normalizeDateTime(startRaw);
		}
		if (endRaw) {
			qs.end = normalizeDateTime(endRaw);
		}

		const data = await metricoolApiRequest.call(this, {
			itemIndex,
			method: 'GET',
			endpoint: `/v2/scheduler/besttimes/${provider}`,
			blogId,
			qs,
		});

		// Metricool returns one entry per weekday. returnJsonArray would emit N items
		// and any downstream Create Scheduled Post would run N times — wrap as one item.
		const days = asBestDays(data);
		if (days.length > 0) {
			return returnJsonArray(
				{
					provider,
					timezone,
					days,
					bestSlot: pickBestSlot(days),
				},
				itemIndex,
			);
		}

		return returnJsonArray(
			{
				provider,
				timezone,
				days: [],
				bestSlot: undefined,
				raw: data,
			},
			itemIndex,
		);
	}

	return throwUnknownOperation.call(this, 'bestTime', operation, itemIndex);
}
