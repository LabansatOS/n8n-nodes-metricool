import type { IExecuteFunctions } from 'n8n-workflow';
import { metricoolApiRequest } from '../GenericFunctions';
import type { MetricoolDateTimeInfo } from '../types';

export function toDateTimeInfo(dateTime: string, timezone: string): MetricoolDateTimeInfo {
	return {
		dateTime,
		timezone,
	};
}

function extractBrandTimezone(brand: unknown): string | undefined {
	if (!brand || typeof brand !== 'object') {
		return undefined;
	}
	const tz = (brand as { timezone?: unknown }).timezone;
	return typeof tz === 'string' && tz.trim() ? tz.trim() : undefined;
}

/**
 * Metricool web app uses the brand IANA timezone for date ranges.
 * Empty / UTC in the node means "use brand timezone".
 */
export async function resolveBrandTimezone(
	this: IExecuteFunctions,
	itemIndex: number,
	blogId: string,
	parameterName = 'timezone',
): Promise<string> {
	const selected = (this.getNodeParameter(parameterName, itemIndex, '') as string).trim();
	if (selected && selected.toUpperCase() !== 'UTC') {
		return selected;
	}

	const brand = await metricoolApiRequest.call(this, {
		itemIndex,
		method: 'GET',
		endpoint: `/v2/settings/brands/${blogId}`,
		blogId,
	});
	const brandTimezone = extractBrandTimezone(brand);
	if (brandTimezone) {
		return brandTimezone;
	}

	return selected || 'UTC';
}

/**
 * Normalize a datetime for Metricool body fields that pair a naive local
 * `dateTime` with a separate `timezone` property (e.g. publicationDate).
 */
export function normalizeDateTime(value: string): string {
	if (!value) {
		return value;
	}
	if (value.endsWith('Z')) {
		return value.slice(0, -1);
	}
	// Strip timezone offset like +02:00 for the dateTime field (timezone sent separately)
	const offsetMatch = value.match(/^(.+?)([+-]\d{2}:\d{2})$/);
	if (offsetMatch) {
		return offsetMatch[1];
	}
	return value;
}

function pad2(n: number): string {
	return String(n).padStart(2, '0');
}

function formatOffsetMinutes(offsetMinutes: number): string {
	const sign = offsetMinutes >= 0 ? '+' : '-';
	const abs = Math.abs(offsetMinutes);
	return `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

/**
 * Offset of `timeZone` at the given UTC instant, in minutes east of UTC
 * (e.g. America/Mexico_City in CST → -360).
 */
function getTimeZoneOffsetMinutes(timeZone: string, utcDate: Date): number {
	const dtf = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hour12: false,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
	const parts = Object.fromEntries(
		dtf
			.formatToParts(utcDate)
			.filter((p) => p.type !== 'literal')
			.map((p) => [p.type, p.value]),
	) as Record<string, string>;

	const hour = parts.hour === '24' ? 0 : Number(parts.hour);
	const asUtcMs = Date.UTC(
		Number(parts.year),
		Number(parts.month) - 1,
		Number(parts.day),
		hour,
		Number(parts.minute),
		Number(parts.second),
	);
	return (asUtcMs - utcDate.getTime()) / 60_000;
}

function parseDateTimeParts(value: string): {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
} {
	const cleaned = value.trim().replace(' ', 'T').replace(/[+-]\d{2}:\d{2}$/, '').replace(/Z$/i, '');
	const match = cleaned.match(
		/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?)?/,
	);
	if (!match) {
		throw new Error(`Invalid datetime value: ${value}`);
	}
	return {
		year: Number(match[1]),
		month: Number(match[2]),
		day: Number(match[3]),
		hour: Number(match[4] ?? 0),
		minute: Number(match[5] ?? 0),
		second: Number(match[6] ?? 0),
	};
}

/**
 * Format a wall-clock datetime in `timeZone` as Metricool query ISO-8601
 * with numeric offset — matching the web app, e.g.
 * `2026-03-01T00:00:00-06:00` with `timezone=America/Mexico_City`.
 */
export function formatDateTimeInTimeZone(
	year: number,
	month: number,
	day: number,
	hour: number,
	minute: number,
	second: number,
	timeZone: string,
): string {
	// Resolve DST-safe offset for this wall clock in the IANA zone.
	let guessUtc = Date.UTC(year, month - 1, day, hour, minute, second);
	let offsetMinutes = getTimeZoneOffsetMinutes(timeZone, new Date(guessUtc));
	guessUtc = Date.UTC(year, month - 1, day, hour, minute, second) - offsetMinutes * 60_000;
	offsetMinutes = getTimeZoneOffsetMinutes(timeZone, new Date(guessUtc));

	return `${year}-${pad2(month)}-${pad2(day)}T${pad2(hour)}:${pad2(minute)}:${pad2(second)}${formatOffsetMinutes(offsetMinutes)}`;
}

/**
 * Dates for Metricool *query* params (`from`/`to` on analytics, etc.).
 *
 * Matches the Metricool web app:
 * `from=2026-03-01T00:00:00-06:00&timezone=America/Mexico_City`
 *
 * Wall-clock Y-M-D H:M:S from the input are kept; the numeric offset is
 * always taken from `timezone` (existing ±HH:MM / Z on the input are ignored
 * for the wall clock — Z is converted to local wall time in `timezone` first).
 */
export function toMetricoolQueryDateTime(value: string, timezone: string): string {
	if (!value) {
		return value;
	}

	const tz = timezone?.trim() || 'UTC';
	const trimmed = value.trim().replace(' ', 'T');

	// Absolute UTC instant → convert to wall clock in the target timezone
	if (/Z$/i.test(trimmed)) {
		const utcDate = new Date(trimmed);
		if (Number.isNaN(utcDate.getTime())) {
			throw new Error(`Invalid datetime value: ${value}`);
		}
		const dtf = new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			hour12: false,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
		const parts = Object.fromEntries(
			dtf
				.formatToParts(utcDate)
				.filter((p) => p.type !== 'literal')
				.map((p) => [p.type, p.value]),
		) as Record<string, string>;
		const hour = parts.hour === '24' ? 0 : Number(parts.hour);
		return formatDateTimeInTimeZone(
			Number(parts.year),
			Number(parts.month),
			Number(parts.day),
			hour,
			Number(parts.minute),
			Number(parts.second),
			tz,
		);
	}

	// Naive or ±offset input: keep Y-M-D H:M:S wall clock, attach offset for `tz`
	// (Metricool UI date pickers — do not keep a mismatched UTC/+00:00 offset).
	const parts = parseDateTimeParts(trimmed);
	return formatDateTimeInTimeZone(
		parts.year,
		parts.month,
		parts.day,
		parts.hour,
		parts.minute,
		parts.second,
		tz,
	);
}
