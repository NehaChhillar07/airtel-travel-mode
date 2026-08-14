/**
 * Pack recommendation.
 *
 * This is the piece that decides whether the prototype feels real. In the
 * Figma, "Covers all three countries and outlasts your 9 days by one" is a
 * text node on a card — true only for the one trip that was drawn. Here the
 * sentence is generated from the trip the user built, so picking a fourth
 * country or a longer stay changes both the winner and its reason.
 *
 * Every pack covers every destination. The packs are sold as "valid across 180+
 * countries" (04.5 says so on the card), and 04.4 draws every plan selectable
 * with no exclusion note on any of them — so coverage ranks nothing and
 * disqualifies nothing. Ranking is about length, price and what is in the pack.
 */

import { COUNTRY_BY_ISO } from '../data'
import { fill, joinWithAnd, numberWord, pluralise } from './format'
import type { Pack, PackRecommendation, PackScore, ReasonTemplates } from './types'

export interface TripShape {
  destinations: string[]
  days: number
}

function reasonKeyFor(pack: Pack, trip: TripShape): keyof ReasonTemplates {
  if (pack.validityDays < trip.days) return 'short'
  if (pack.voiceMins === 0) return 'thin'
  // Meaningfully longer than the trip — sold on the "you might fly again" angle.
  if (pack.validityDays >= trip.days * 2) return 'upsell'
  return 'fits'
}

/** Score a pack against a trip. Higher is better. */
export function scorePack(pack: Pack, trip: TripShape): PackScore {
  const surplus = pack.validityDays - trip.days

  let score = 0
  if (surplus >= 0) score += 40
  else score -= 25

  // Every unused day is waste the customer paid for.
  score -= 1.5 * Math.max(0, surplus)

  // Value, normalised per day so a 90-day pack is not punished for its price.
  score -= 0.004 * (pack.priceExGst / Math.max(pack.validityDays, 1))

  // On a trip of any length, being able to make a call matters.
  if (pack.voiceMins > 0 && trip.days >= 5) score += 15
  // Multi-country trips are the case the in-flight and cross-border story sells.
  if (pack.inFlight && trip.destinations.length > 1) score += 10
  if (pack.tags.includes('best-value')) score += 5

  return { pack, score, reasonKey: reasonKeyFor(pack, trip) }
}

/** Every pack, best first. */
export function rankPacks(packs: Pack[], trip: TripShape): PackScore[] {
  return packs.map((p) => scorePack(p, trip)).sort((a, b) => b.score - a.score)
}

/**
 * Build the reason sentence for a pack against a trip.
 *
 * Tokens: {countryList} {countryCount} {days} {slack} {shortBy}
 */
export function reasonFor(pack: Pack, trip: TripShape, key: keyof ReasonTemplates): string {
  const names = trip.destinations.map((iso) => COUNTRY_BY_ISO[iso]?.name).filter(Boolean)
  const surplus = pack.validityDays - trip.days

  const countryList =
    names.length === 0
      ? 'your trip'
      : names.length > 3
        ? `all ${numberWord(names.length)} countries`
        : joinWithAnd(names)

  return fill(pack.reasonTemplates[key], {
    countryList,
    countryCount: numberWord(names.length),
    days: trip.days,
    // Reads as "outlasts your 9 days by one", the way the card is written.
    slack: surplus <= 0 ? 'nothing' : numberWord(surplus),
    shortBy: `${numberWord(Math.abs(surplus))} ${pluralise(Math.abs(surplus), 'day', 'days')}`,
  })
}

/**
 * The recommended pack.
 *
 * There is always one, whatever the trip. 04.4 draws a Recommended card above
 * an "Other Plans" list and has no other state, so which pack wins can change
 * with the trip but the card itself never goes away. Null only if the
 * catalogue is empty, which it never is.
 */
export function recommendPack(packs: Pack[], trip: TripShape): PackRecommendation | null {
  const best = rankPacks(packs, trip)[0]
  if (!best) return null

  return {
    pack: best.pack,
    reason: reasonFor(best.pack, trip, best.reasonKey),
    reasonKey: best.reasonKey,
  }
}
