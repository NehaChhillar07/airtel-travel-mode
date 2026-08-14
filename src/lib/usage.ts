/**
 * Live-trip derivations.
 *
 * `tripProgressVariant` maps onto the Figma `Trip progress` COMPONENT_SET
 * variants exactly — Connected / Trip midway / Exhausted / No connection. The
 * designer already drew the state machine; this returns which state you are in
 * rather than making the reviewer pick a screen from a list.
 */

import { fullSpeedGb } from './format'
import type { LiveTrip, Pack, TripProgressVariant } from './types'

/** Fraction of the pack's full-speed allowance consumed, 0..1. */
export function dataFraction(live: LiveTrip, pack: Pack | null): number {
  if (!pack) return 0
  const capMb = fullSpeedGb(pack) * 1024
  if (capMb <= 0) return 0
  return Math.min(1, live.usage.dataMb / capMb)
}

export function dataLeftGb(live: LiveTrip, pack: Pack | null): number {
  if (!pack) return 0
  return Math.max(0, fullSpeedGb(pack) - live.usage.dataMb / 1024)
}

export function minsLeft(live: LiveTrip, pack: Pack | null): number {
  if (!pack) return 0
  return Math.max(0, pack.voiceMins - live.usage.voiceMinsUsed)
}

export function smsLeft(live: LiveTrip, pack: Pack | null): number {
  if (!pack) return 0
  return Math.max(0, pack.sms - live.usage.smsUsed)
}

export function packDaysLeft(live: LiveTrip, pack: Pack | null): number {
  if (!pack) return 0
  return Math.max(0, pack.validityDays - live.dayOfPack + 1)
}

/** Fraction of the pack's days consumed, 0..1. */
export function dayFraction(live: LiveTrip, pack: Pack | null): number {
  if (!pack || pack.validityDays <= 0) return 0
  return Math.min(1, live.dayOfPack / pack.validityDays)
}

/**
 * Low balance is a derived state, not a separate screen. It is what turns
 * 05.4 into 05.5.
 */
export function isLowBalance(live: LiveTrip, pack: Pack | null): boolean {
  if (!pack) return false
  return packDaysLeft(live, pack) <= 2 || dataFraction(live, pack) >= 0.85
}

/* ------------------------------------------------------------- day history */

export interface DayUsage {
  day: number
  dataMb: number
  voiceMins: number
  sms: number
}

/**
 * A fixed repeating weight, so no two consecutive days look alike. Not random:
 * `Math.random()` would hand back a different history on every render, and the
 * day you tapped would change while you were reading it.
 */
const DAY_WEIGHTS = [1.15, 0.8, 1.3, 0.9, 1.05, 0.75, 1.2]

/**
 * Split a total across the days by weight, keeping whole units.
 *
 * Largest-remainder rather than plain rounding, because the parts have to add
 * back up to the whole: nine days of 0.93 GB rounded independently is not
 * 8.4 GB, and the day panel would then contradict the meter above it.
 */
function splitByWeight(amount: number, weights: number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0)
  if (total <= 0) return weights.map(() => 0)

  const exact = weights.map((w) => (amount * w) / total)
  const parts = exact.map(Math.floor)
  let rest = Math.round(amount) - parts.reduce((a, b) => a + b, 0)

  const byRemainder = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)

  for (const { i } of byRemainder) {
    if (rest <= 0) break
    parts[i] += 1
    rest -= 1
  }
  return parts
}

/**
 * Per-day usage, back-derived from the running totals.
 *
 * The store keeps one total rather than a log, and the scenarios hydrate that
 * total directly, so there is no history to read — this reconstructs one that
 * sums to exactly what the meters show. If the store ever grows a real daily
 * log, this is the function to delete.
 */
export function dayHistory(live: LiveTrip): DayUsage[] {
  const days = Math.max(0, live.dayOfTrip)
  if (days === 0) return []

  const weights = Array.from({ length: days }, (_, i) => DAY_WEIGHTS[i % DAY_WEIGHTS.length])
  const data = splitByWeight(live.usage.dataMb, weights)
  const voice = splitByWeight(live.usage.voiceMinsUsed, weights)
  const sms = splitByWeight(live.usage.smsUsed, weights)

  return Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    dataMb: data[i],
    voiceMins: voice[i],
    sms: sms[i],
  }))
}

/* ------------------------------------------------------------ daily minutes */

/**
 * A deterministic 0..1 from a day number.
 *
 * Same reasoning as `DAY_WEIGHTS`: a real `Math.random()` would hand back a
 * different history on every render, so the day you tapped would change while
 * you were reading it. This is a cheap integer hash — arbitrary, but fixed.
 */
function jitter(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Minutes are the one allowance that starts again every midnight. */
const MINS_LEFT_MIN = 0.12
const MINS_LEFT_MAX = 0.58

/**
 * How many minutes were left at the end of a past day.
 *
 * Minutes reset at midnight, so a past day is not a slice of a trip total the
 * way texts and data are — it is its own 100, spent down and gone. And they do
 * get spent: someone abroad makes calls, so what is left lands low, somewhere
 * between a tenth and a bit over half. The spread is what makes a run of days
 * read as days rather than as a gradient.
 *
 * Today is not generated. It comes off `live.usage`, because that is the day
 * being measured rather than reconstructed.
 */
export function dayMinutesLeft(live: LiveTrip, pack: Pack | null, day: number): number {
  if (!pack || pack.voiceMins <= 0) return 0
  if (day >= live.dayOfTrip) return Math.max(0, pack.voiceMins - live.usage.voiceMinsUsed)

  const fraction = MINS_LEFT_MIN + jitter(day) * (MINS_LEFT_MAX - MINS_LEFT_MIN)
  return Math.round(pack.voiceMins * fraction)
}

/**
 * The three meters as they stood at the end of a given day.
 *
 * Tapping a spent cell rewinds the whole block rather than opening a panel
 * under it, so every figure on the screen has to be answerable for any day —
 * not just today.
 *
 * Texts and data are running totals up to and including `day`: both are sold
 * for the whole pack, so a past day is a smaller slice of the same figure.
 * `dayHistory` splits by largest remainder, so the parts sum to the whole and
 * the rewound view cannot contradict the un-rewound one.
 *
 * Minutes are not, because minutes reset at midnight. A past day is its own
 * 100 rather than a point on a curve, so `dayMinutesLeft` answers for it — see
 * there. This is why rewinding no longer walks the minutes smoothly upward:
 * they were never one falling total to walk back along.
 */
export interface DaySnapshot {
  day: number
  minsLeft: number
  smsLeft: number
  dataUsedGb: number
}

export function daySnapshot(live: LiveTrip, pack: Pack | null, day: number): DaySnapshot {
  const upTo = dayHistory(live).slice(0, day)

  const smsUsed = upTo.reduce((n, d) => n + d.sms, 0)
  const dataMb = upTo.reduce((n, d) => n + d.dataMb, 0)

  return {
    day,
    minsLeft: dayMinutesLeft(live, pack, day),
    smsLeft: pack ? Math.max(0, pack.sms - smsUsed) : 0,
    dataUsedGb: dataMb / 1024,
  }
}

/** Average full-speed data burned per elapsed day, in GB. */
export function dailyBurnGb(live: LiveTrip): number {
  const days = Math.max(1, live.dayOfPack)
  return live.usage.dataMb / 1024 / days
}

/**
 * The day the allowance is projected to run out, or null if it lasts.
 * Straight-line projection — honest enough for a prototype, and it is what
 * makes the "you'll run out on day 7" warning possible at all.
 */
export function projectedRunOutDay(live: LiveTrip, pack: Pack | null): number | null {
  if (!pack) return null
  const burn = dailyBurnGb(live)
  if (burn <= 0) return null
  const day = Math.ceil(fullSpeedGb(pack) / burn)
  return day <= pack.validityDays ? day : null
}

export function tripProgressVariant(live: LiveTrip, pack: Pack | null): TripProgressVariant {
  if (live.connection === 'landed-not-connected') return 'no-connection'
  if (live.connection === 'pack-ended') return 'exhausted'
  if (pack && live.dayOfPack > pack.validityDays) return 'exhausted'
  if (isLowBalance(live, pack)) return 'midway'
  return 'connected'
}
