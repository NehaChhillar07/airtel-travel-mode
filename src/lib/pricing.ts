/**
 * Money.
 *
 * The rate is 0.1734, set in data/settings.json, because that is what 04.6
 * draws: ₹2,999 + ₹520 = ₹3,519. Statutory GST on Indian telecom is 18%, which
 * would give ₹540 and ₹3,539 — so if this prototype ever needs to be right
 * rather than faithful, that one value is the whole change.
 *
 * The review screen deliberately labels the line "GST" with no percentage, the
 * way the source screen does. Printing "17%" next to it would read as a bug.
 */

import { SETTINGS } from '../data'
import type { LedgerEntry, Pack, Totals } from './types'

export const GST_RATE = SETTINGS.gstRate

export function gstOn(subtotal: number, rate = GST_RATE): number {
  return Math.round(subtotal * rate)
}

export function totalsFor(pack: Pack | null, rate = GST_RATE): Totals {
  const subtotal = pack?.priceExGst ?? 0
  const gst = gstOn(subtotal, rate)
  return { subtotal, gst, total: subtotal + gst }
}

/** Everything charged so far this trip, pack included. */
export function tripSpend(ledger: LedgerEntry[]): number {
  return ledger.reduce((sum, e) => sum + e.amount, 0)
}

/** Charges that are not the pack — the part that surprises people. */
export function unexpectedSpend(ledger: LedgerEntry[]): number {
  return ledger.filter((e) => e.kind !== 'pack').reduce((sum, e) => sum + e.amount, 0)
}

/** Per-day cost of a pack, for comparing two packs of different lengths. */
export function pricePerDay(pack: Pack): number {
  return pack.priceExGst / pack.validityDays
}
