import { DateTime } from 'luxon'

/**
 * Client-side date utilities for handling UTC timestamps from API
 * and converting them to user's local timezone for display.
 */

/**
 * Convert UTC ISO string from API to user's local timezone DateTime
 */
export function fromUtcIso(date: string): DateTime {
  return DateTime.fromISO(date, { zone: 'utc' }).toLocal()
}

/**
 * Convert UTC ISO string to local timezone formatted string
 */
export function formatLocal(
  date: string,
  format = DateTime.DATETIME_SHORT,
): string {
  return fromUtcIso(date).toLocaleString(format)
}

/**
 * Convert UTC ISO string to relative time (e.g., "2 hours ago")
 */
export function formatRelative(date: string): string {
  return fromUtcIso(date).toRelative() ?? 'Unknown'
}

/**
 * Convert UTC ISO string to specific format in user's timezone
 */
export function formatLocalCustom(date: string, formatString: string): string {
  return fromUtcIso(date).toFormat(formatString)
}

/**
 * Convert UTC ISO string to local date only
 */
export function formatLocalDate(date: string): string {
  return fromUtcIso(date).toLocaleString(DateTime.DATE_SHORT)
}

/**
 * Convert UTC ISO string to local time only
 */
export function formatLocalTime(date: string): string {
  return fromUtcIso(date).toLocaleString(DateTime.TIME_SIMPLE)
}

/**
 * Check if a UTC timestamp is in the past (compared to local now)
 */
export function isPastLocal(date: string): boolean {
  return fromUtcIso(date) < DateTime.local()
}

/**
 * Get difference between UTC timestamp and now in specified unit
 */
export function diffFromNow(
  date: string,
  unit: 'seconds' | 'minutes' | 'hours' | 'days' = 'minutes',
): number {
  return DateTime.local().diff(fromUtcIso(date), unit).get(unit)
}

/**
 * Convert local datetime to UTC ISO string for sending to API
 */
export function localToUtcIso(localDateTime: DateTime): string {
  const iso = localDateTime.toUTC().toISO()
  if (!iso) throw new Error('Failed to convert local datetime to UTC ISO')
  return iso
}

/**
 * Get current local time as UTC ISO string for API
 */
export function nowAsUtcIso(): string {
  const iso = DateTime.local().toUTC().toISO()
  if (!iso) throw new Error('Failed to get current time as UTC ISO')
  return iso
}

/**
 * Format with timezone display for debugging/admin interfaces
 */
export function formatWithTimezone(date: string): string {
  const local = fromUtcIso(date)
  const formatted = local.toLocaleString(DateTime.DATETIME_FULL)
  return `${formatted} (${local.zoneName})`
}
