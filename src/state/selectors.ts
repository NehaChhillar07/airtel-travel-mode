/**
 * Derived reads.
 *
 * Screens never do arithmetic. They call one of these, which calls a pure
 * function in src/lib. That is what keeps "9 Days" on five screens from
 * drifting apart the way it did in the source file.
 */

import { useMemo } from 'react'
import { COUNTRY_BY_ISO, PACKS, PACK_BY_ID, countriesOf } from '../data'
import { tripLengthDays } from '../lib/dates'
import { totalsFor, tripSpend, unexpectedSpend } from '../lib/pricing'
import { rankPacks, recommendPack } from '../lib/recommend'
import { tripProgressVariant } from '../lib/usage'
import { validateTrip } from '../lib/validate'
import type { Country, Pack, PackScore, TripDraft } from '../lib/types'
import { useLiveStore } from './liveStore'
import { useTripStore } from './tripStore'

/** The trip length, in days. 0 until both dates are set. */
export function useTripDays(): number {
  const range = useTripStore((s) => s.range)
  return useMemo(() => tripLengthDays(range), [range])
}

/** Selected destinations as full records, in the order they were added. */
export function useDestinations(): Country[] {
  const iso2s = useTripStore((s) => s.destinations)
  return useMemo(() => countriesOf(iso2s), [iso2s])
}

export function useIsSelected(iso2: string): boolean {
  return useTripStore((s) => s.destinations.includes(iso2))
}

export function useSelectedPack(): Pack | null {
  const id = useTripStore((s) => s.selectedPackId)
  return id ? (PACK_BY_ID[id] ?? null) : null
}

/** Every pack scored against the current trip, best first. */
export function useRankedPacks(): PackScore[] {
  const destinations = useTripStore((s) => s.destinations)
  const days = useTripDays()
  return useMemo(() => rankPacks(PACKS, { destinations, days }), [destinations, days])
}

export function useRecommendation() {
  const destinations = useTripStore((s) => s.destinations)
  const days = useTripDays()
  return useMemo(() => recommendPack(PACKS, { destinations, days }), [destinations, days])
}

export function useTotals() {
  const pack = useSelectedPack()
  return useMemo(() => totalsFor(pack), [pack])
}

/**
 * The whole draft, for validation.
 *
 * Assembled field by field rather than with one object-returning selector.
 * Zustand v5 compares snapshots by identity, so a selector that builds a fresh
 * object on every notify never settles — it re-renders, re-selects, and
 * re-renders again until React gives up with "Maximum update depth exceeded".
 * Each field below is a stable reference, and the object is built once in a
 * `useMemo` outside the subscription.
 */
function useDraft(): TripDraft {
  const destinations = useTripStore((s) => s.destinations)
  const range = useTripStore((s) => s.range)
  const selectedPackId = useTripStore((s) => s.selectedPackId)
  const expandedPackId = useTripStore((s) => s.expandedPackId)
  const tcAccepted = useTripStore((s) => s.tcAccepted)
  const msisdn = useTripStore((s) => s.msisdn)
  const billing = useTripStore((s) => s.billing)
  const autoTopUp = useTripStore((s) => s.autoTopUp)
  const status = useTripStore((s) => s.status)
  const confirmedAt = useTripStore((s) => s.confirmedAt)

  return useMemo(
    () => ({
      destinations,
      range,
      selectedPackId,
      expandedPackId,
      tcAccepted,
      msisdn,
      billing,
      autoTopUp,
      status,
      confirmedAt,
    }),
    [
      destinations,
      range,
      selectedPackId,
      expandedPackId,
      tcAccepted,
      msisdn,
      billing,
      autoTopUp,
      status,
      confirmedAt,
    ],
  )
}

export function useValidation() {
  const draft = useDraft()
  return useMemo(() => validateTrip(draft), [draft])
}

export function useCanViewPacks(): boolean {
  return useValidation().canViewPacks
}

export function useCanContinue(): boolean {
  return useValidation().canContinue
}

/* -------------------------------------------------------------- live trip */

export function useTripProgressVariant() {
  const pack = useSelectedPack()
  const connection = useLiveStore((s) => s.connection)
  const dayOfPack = useLiveStore((s) => s.dayOfPack)
  const usage = useLiveStore((s) => s.usage)
  return useMemo(
    () =>
      tripProgressVariant(
        {
          connection,
          currentCountry: '',
          landedAt: null,
          dayOfTrip: 0,
          dayOfPack,
          usage,
          ledger: [],
          divertActive: false,
        },
        pack,
      ),
    [connection, dayOfPack, usage, pack],
  )
}

export function useTripSpend() {
  const ledger = useLiveStore((s) => s.ledger)
  return useMemo(
    () => ({ total: tripSpend(ledger), unexpected: unexpectedSpend(ledger) }),
    [ledger],
  )
}

export function useCurrentCountry(): Country | null {
  const iso = useLiveStore((s) => s.currentCountry)
  return COUNTRY_BY_ISO[iso] ?? null
}
