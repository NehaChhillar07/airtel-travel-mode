/**
 * Date maths.
 *
 * `tripLengthDays` is the origin of "9 Days" on the pack screens, the header
 * chip on review, the timeline on confirmation, and "Day 3 of 9" on the
 * dashboard. In the Figma each of those was typed by hand, which is how
 * SOURCE_ISSUES §1.3 ended up with three screens disagreeing.
 *
 * Dates cross the app as ISO `yyyy-MM-dd` strings. They become `Date` objects
 * only inside this file.
 */

import {
  addDays,
  differenceInCalendarDays,
  format,
  isBefore,
  isValid,
  parseISO,
  setDate,
  startOfDay,
} from 'date-fns'
import { SETTINGS } from '../data'
import type { DateRange } from './types'

/**
 * "Today" is pinned in settings.json rather than read from the clock.
 *
 * A prototype that reads the real clock drifts: the trip silently becomes 8
 * days, the bill date moves, and the screenshots stop matching the Figma. Pin
 * it, and the demo is the same on any machine on any day.
 */
export function today(): Date {
  return startOfDay(parseISO(SETTINGS.today))
}

export function toISO(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function fromISO(iso: string): Date {
  return startOfDay(parseISO(iso))
}

/** Guards a string that came from a store or a URL. */
export function isValidISO(iso: string | null): iso is string {
  if (!iso) return false
  const d = parseISO(iso)
  return isValid(d)
}

/**
 * Inclusive length: 25 Aug -> 2 Sep is 9 days, not 8.
 *
 * Returns 0 for an incomplete range so callers can treat "no length yet" and
 * "zero length" the same way.
 */
export function tripLengthDays(range: DateRange): number {
  if (!isValidISO(range.from) || !isValidISO(range.to)) return 0
  const n = differenceInCalendarDays(fromISO(range.to), fromISO(range.from)) + 1
  return n > 0 ? n : 0
}

export function isCompleteRange(range: DateRange): boolean {
  return isValidISO(range.from) && isValidISO(range.to)
}

export function isBackwardsRange(range: DateRange): boolean {
  if (!isValidISO(range.from) || !isValidISO(range.to)) return false
  return isBefore(fromISO(range.to), fromISO(range.from))
}

export function isPastDeparture(range: DateRange): boolean {
  if (!isValidISO(range.from)) return false
  return isBefore(fromISO(range.from), today())
}

/* ------------------------------------------------------------ formatting */

/** "25th Aug, 2026" — the exact string the Figma draws. */
export function formatOrdinal(iso: string): string {
  return format(fromISO(iso), 'do MMM, yyyy')
}

/** "25th Aug" */
export function formatOrdinalShort(iso: string): string {
  return format(fromISO(iso), 'do MMM')
}

/** "25 Aug" */
export function formatShort(iso: string): string {
  return format(fromISO(iso), 'd MMM')
}

/** "Thu 13 Aug" — the lock screen's date line. */
export function formatLockDate(iso: string): string {
  return format(fromISO(iso), 'EEE d MMM')
}

/** "2 September" — the dashboard spells the month out. */
export function formatLongDate(iso: string): string {
  return format(fromISO(iso), 'd MMMM')
}

/** "2 Sep" — used for the bill date in the review CTA. */
export function formatBillDate(iso: string): string {
  return format(fromISO(iso), 'd MMM')
}

/** "25 Aug - 2 Sep 2026" */
export function formatRangeLong(range: DateRange): string {
  if (!isCompleteRange(range)) return ''
  const from = fromISO(range.from!)
  const to = fromISO(range.to!)
  return `${format(from, 'd MMM')} - ${format(to, 'd MMM yyyy')}`
}

/** "25 Aug – 2 Sep" — the compact header chip. */
export function formatRangeChip(range: DateRange): string {
  if (!isCompleteRange(range)) return ''
  return `${format(fromISO(range.from!), 'd MMM')} – ${format(fromISO(range.to!), 'd MMM')}`
}

/* ---------------------------------------------------------------- billing */

/**
 * The next occurrence of the billing cycle day, on or after `from`.
 * With a 2nd-of-month cycle and a 25 Aug purchase, that is 2 Sep.
 */
export function nextBillDate(fromIso: string, cycleDay = SETTINGS.billingCycleDay): string {
  const start = fromISO(fromIso)
  const thisMonth = setDate(start, cycleDay)
  if (!isBefore(thisMonth, start)) return toISO(thisMonth)
  // Roll to next month without tripping over month lengths.
  const nextMonth = setDate(addDays(setDate(start, 1), 32), cycleDay)
  return toISO(nextMonth)
}

export function dueDate(billIso: string, offset = SETTINGS.billDueOffsetDays): string {
  return toISO(addDays(fromISO(billIso), offset))
}

/* ----------------------------------------------------------- trip progress */

/** 1-based day of the trip, clamped to the trip's own length. */
export function dayOfTrip(now: Date, range: DateRange): number {
  if (!isValidISO(range.from)) return 0
  const n = differenceInCalendarDays(startOfDay(now), fromISO(range.from)) + 1
  const len = tripLengthDays(range)
  return Math.min(Math.max(n, 1), len || n)
}

/** Days remaining including today. */
export function daysLeft(now: Date, range: DateRange): number {
  if (!isValidISO(range.to)) return 0
  const n = differenceInCalendarDays(fromISO(range.to), startOfDay(now)) + 1
  return Math.max(n, 0)
}

/** The last day covered by a pack that started on `startIso`. */
export function packEndDate(startIso: string, validityDays: number): string {
  return toISO(addDays(fromISO(startIso), validityDays - 1))
}

/**
 * A default range for the empty state: departs in `defaultDepartOffsetDays`,
 * lasts `defaultTripDays`. Used by the calendar's initial month, never applied
 * silently to the form.
 */
export function suggestedRange(): DateRange {
  const from = addDays(today(), SETTINGS.defaultDepartOffsetDays)
  const to = addDays(from, SETTINGS.defaultTripDays - 1)
  return { from: toISO(from), to: toISO(to) }
}
