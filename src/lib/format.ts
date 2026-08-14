/**
 * String formatting, and the template filler.
 *
 * Copy lives in data/copy.json with `{tokens}` in it, so a sentence like
 * "Covers Singapore, UAE and Malaysia and outlasts your 9 days by one" is
 * assembled from the trip the user actually built rather than typed onto a
 * card in Figma.
 */

import { SETTINGS } from '../data'
import type { Country, Pack } from './types'

const inrFormatter = new Intl.NumberFormat(SETTINGS.locale, {
  style: 'currency',
  currency: SETTINGS.currency,
  maximumFractionDigits: 0,
})

/** "₹2,999" — en-IN grouping, so six figures render as ₹1,20,000. */
export function inr(n: number): string {
  return inrFormatter.format(Math.round(n))
}

/** "999****9991" — the masked form used on the review and dashboard screens. */
export function maskMsisdn(msisdn: string): string {
  if (msisdn.length < 7) return msisdn
  return `${msisdn.slice(0, 3)}****${msisdn.slice(-4)}`
}

/** ["Singapore","UAE","Malaysia"] -> "Singapore, UAE and Malaysia" */
export function joinWithAnd(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export function pluralise(n: number, one: string, many: string): string {
  return n === 1 ? one : many
}

/** 1 -> "one" … 10 -> "ten", then digits. Reads better in a sentence. */
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
export function numberWord(n: number): string {
  return n >= 0 && n <= 10 ? WORDS[n] : String(n)
}

/**
 * The pack contents line: "Unlimited data · 100 mins · 100 SMS".
 *
 * The Figma had this typed onto the card while the detail sheet described a
 * different allowance for the same pack (SOURCE_ISSUES §1.4). Deriving both
 * from one record makes them incapable of disagreeing.
 */
export function contentsLine(pack: Pack): string {
  const parts: string[] = []
  parts.push(pack.data.kind === 'unlimited' ? 'Unlimited data' : `${pack.data.gb} GB data`)
  parts.push(pack.voiceMins > 0 ? `${pack.voiceMins} mins` : 'no calls')
  parts.push(pack.sms > 0 ? `${pack.sms} SMS` : 'no SMS')
  return parts.join(' · ')
}

/** "10 days" */
export function validityLabel(pack: Pack): string {
  return `${pack.validityDays} ${pluralise(pack.validityDays, 'day', 'days')}`
}

/** "₹2,999 excl GST" */
export function priceLabel(pack: Pack): string {
  return `${inr(pack.priceExGst)} excl GST`
}

/** The full-speed allowance, or null for a metered pack. */
export function fupGb(pack: Pack): number | null {
  return pack.data.kind === 'unlimited' ? pack.data.fupGb : null
}

/** Total data the pack can deliver at full speed, either way. */
export function fullSpeedGb(pack: Pack): number {
  return pack.data.kind === 'unlimited' ? pack.data.fupGb : pack.data.gb
}

export function flagOf(country: Country): string {
  return country.flagAsset ?? country.flagEmoji
}

/**
 * Replace `{token}` occurrences. Unknown tokens are left in place rather than
 * silently blanked, so a missing value shows up during review instead of
 * shipping as "Your  day trip starts".
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in values ? String(values[key]) : whole,
  )
}
