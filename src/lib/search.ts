/**
 * Destination search.
 *
 * Ranking lives here rather than inside a combobox library because alias
 * matching is a product decision: someone typing "Dubai" means UAE, and
 * someone typing "KL" means Malaysia. A generic filter would return nothing
 * for both.
 */

import type { Country } from './types'

/** Strip diacritics so "Türkiye" matches "turkiye". */
function normalise(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

const SCORE = {
  isoExact: 100,
  namePrefix: 80,
  aliasPrefix: 65,
  wordStart: 50,
  substring: 30,
  aliasSubstring: 20,
} as const

export interface CountryMatch {
  country: Country
  score: number
  /** Which alias produced the hit, when it was not the name. Shown as a hint. */
  via: string | null
}

function scoreCountry(q: string, c: Country): CountryMatch | null {
  const name = normalise(c.name)
  const iso = c.iso2.toLowerCase()

  if (iso === q) return { country: c, score: SCORE.isoExact, via: null }
  if (name.startsWith(q)) return { country: c, score: SCORE.namePrefix, via: null }

  for (const alias of c.aliases) {
    const a = normalise(alias)
    if (a.startsWith(q)) return { country: c, score: SCORE.aliasPrefix, via: alias }
  }

  // "zealand" should find New Zealand.
  if (name.split(/\s+/).some((w) => w.startsWith(q))) {
    return { country: c, score: SCORE.wordStart, via: null }
  }
  if (name.includes(q)) return { country: c, score: SCORE.substring, via: null }

  for (const alias of c.aliases) {
    if (normalise(alias).includes(q)) {
      return { country: c, score: SCORE.aliasSubstring, via: alias }
    }
  }
  return null
}

/**
 * Rank countries against a query.
 *
 * An empty query returns the popular set, which is what the resting state of
 * the trip screen shows as suggestion chips.
 */
export function rankCountries(query: string, countries: Country[], limit = 6): CountryMatch[] {
  const q = normalise(query)
  if (!q) {
    return countries
      .filter((c) => c.popular)
      .slice(0, limit)
      .map((c) => ({ country: c, score: 0, via: null }))
  }

  const hits: CountryMatch[] = []
  for (const c of countries) {
    const hit = scoreCountry(q, c)
    if (hit) hits.push(hit)
  }

  hits.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    // Popular destinations break ties, then alphabetical for stability.
    if (a.country.popular !== b.country.popular) return a.country.popular ? -1 : 1
    return a.country.name.localeCompare(b.country.name)
  })

  return hits.slice(0, limit)
}
