/**
 * The purchase funnel: one trip, flowing across the 04.x screens.
 *
 * Zustand rather than Context + useReducer, for one reason that matters more
 * than the usual arguments: a single Context re-renders every consumer on
 * every dispatch, and `motion`'s `layout` prop re-measures on every commit. A
 * keystroke in the destination field would remeasure the whole screen and the
 * chip-grow animation would visibly stutter. Selector subscriptions mean a
 * chip re-renders only when its own membership flips.
 */

import { create } from 'zustand'
import { SETTINGS } from '../data'
import { toISO, today } from '../lib/dates'
import type { DateRange, TripDraft } from '../lib/types'

export const emptyTrip: TripDraft = {
  destinations: [],
  range: { from: null, to: null },
  selectedPackId: null,
  expandedPackId: null,
  tcAccepted: false,
  msisdn: SETTINGS.msisdn,
  billing: { kind: 'postpaid', cycleDay: SETTINGS.billingCycleDay },
  autoTopUp: true,
  status: 'draft',
  confirmedAt: null,
}

/**
 * Screen-local UI that a scenario still needs to seed.
 *
 * `query` is not part of the trip — it is what is currently typed into the
 * search field. It lives here rather than in component state so that the index
 * rail can open "04.2 Destination and dates" with "UAE" genuinely typed into a
 * real input, instead of drawn as a text node the way the Figma does it.
 */
export interface TripUi {
  query: string
  searchOpen: boolean
  /**
   * Fields the user has actually interacted with.
   *
   * An untouched form is not a form with errors. Without this, the trip screen
   * greets you with "Add at least one destination" before you have had a
   * chance to do anything wrong.
   */
  touched: string[]
}

export const emptyTripUi: TripUi = { query: '', searchOpen: false, touched: [] }

interface TripActions {
  setQuery: (q: string) => void
  setSearchOpen: (v: boolean) => void
  touch: (field: string) => void
  toggleDestination: (iso2: string) => void
  addDestination: (iso2: string) => void
  removeDestination: (iso2: string) => void
  setRange: (range: DateRange) => void
  setRangeField: (field: 'from' | 'to', iso: string) => void
  clearRange: () => void
  selectPack: (id: string | null) => void
  toggleExpandPack: (id: string) => void
  setTcAccepted: (v: boolean) => void
  setMsisdn: (v: string) => void
  setAutoTopUp: (v: boolean) => void
  confirm: () => void
  reset: () => void
  hydrate: (patch: Partial<TripDraft & TripUi>) => void
}

export type TripStore = TripDraft & TripUi & TripActions

export const useTripStore = create<TripStore>()((set) => ({
  ...emptyTrip,
  ...emptyTripUi,

  setQuery: (query) => set({ query }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),

  touch: (field) =>
    set((s) => (s.touched.includes(field) ? s : { touched: [...s.touched, field] })),

  toggleDestination: (iso2) =>
    set((s) => ({
      destinations: s.destinations.includes(iso2)
        ? s.destinations.filter((c) => c !== iso2)
        : [...s.destinations, iso2],
      // Changing where you are going invalidates which pack was chosen for it.
      selectedPackId: null,
    })),

  addDestination: (iso2) =>
    set((s) =>
      s.destinations.includes(iso2)
        ? s
        : { destinations: [...s.destinations, iso2], selectedPackId: null },
    ),

  removeDestination: (iso2) =>
    set((s) => ({
      destinations: s.destinations.filter((c) => c !== iso2),
      selectedPackId: null,
    })),

  setRange: (range) => set({ range, selectedPackId: null }),

  /**
   * Setting one end of the range. Picking a departure after the existing
   * return clears the return rather than leaving an impossible pair on screen.
   */
  setRangeField: (field, iso) =>
    set((s) => {
      const next: DateRange = { ...s.range, [field]: iso }
      if (field === 'from' && next.to && next.to < iso) next.to = null
      if (field === 'to' && next.from && iso < next.from) next.from = iso
      return { range: next, selectedPackId: null }
    }),

  clearRange: () => set({ range: { from: null, to: null }, selectedPackId: null }),

  selectPack: (id) => set({ selectedPackId: id }),

  toggleExpandPack: (id) =>
    set((s) => ({ expandedPackId: s.expandedPackId === id ? null : id })),

  setTcAccepted: (tcAccepted) => set({ tcAccepted }),
  setMsisdn: (msisdn) => set({ msisdn }),
  setAutoTopUp: (autoTopUp) => set({ autoTopUp }),

  confirm: () => set({ status: 'confirmed', confirmedAt: toISO(today()) }),

  reset: () => set({ ...emptyTrip, ...emptyTripUi }),

  hydrate: (patch) => set(patch),
}))
