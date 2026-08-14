/**
 * Scenario snapshots.
 *
 * This is the hinge between the designer's 22-screen index and a product with
 * 13 routes. Clicking "04.3 Trip details filled" in the rail applies
 * `threeSelected` and navigates to `/trip` — so you land on the real form with
 * three chips genuinely active, real dates in the fields, and a CTA that is
 * enabled because `validateTrip` says so, not because a different picture was
 * drawn with an enabled button on it.
 *
 * Every value here is data a user could have produced by using the app.
 */

import { toISO, today } from '../lib/dates'
import { addDays } from 'date-fns'
import type { LiveTrip, TripDraft } from '../lib/types'
import type { TripUi } from './tripStore'
import { emptyTrip, emptyTripUi } from './tripStore'
import { emptyLive } from './liveStore'
import { LEDGER_SEED } from '../data'

export type ScenarioId =
  | 'noTrip'
  | 'emptyDraft'
  | 'threeSelected'
  | 'packsReady'
  | 'packChosen'
  | 'confirmed'
  | 'landedConnected'
  | 'landedNotConnected'
  | 'midway'
  | 'lowBalance'
  | 'exhausted'

export interface Scenario {
  trip?: Partial<TripDraft & TripUi>
  live?: Partial<LiveTrip>
}

/** The trip the Figma draws: 25 Aug – 2 Sep 2026, nine days. */
const DEPART = toISO(addDays(today(), 5))
const RETURN = toISO(addDays(today(), 13))
const RANGE = { from: DEPART, to: RETURN }

const THREE = ['SG', 'MY', 'AE']
const RECOMMENDED = 'ir-asia-10d-2999'

/** A filled trip, ready to shop for packs. */
const filledTrip: Partial<TripDraft> = {
  destinations: THREE,
  range: RANGE,
  tcAccepted: false,
  selectedPackId: null,
  status: 'draft',
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  /** Nothing bought, nothing planned — the home screen before the feature. */
  noTrip: {
    trip: { ...emptyTrip, ...emptyTripUi },
    live: { ...emptyLive },
  },

  /** 04.1 — the form as it first opens. */
  emptyDraft: {
    trip: { ...emptyTrip, ...emptyTripUi },
    live: { ...emptyLive },
  },

  /** 04.3 — three destinations committed, dates set, CTA live. */
  threeSelected: {
    trip: { ...emptyTrip, ...filledTrip, ...emptyTripUi },
    live: { ...emptyLive },
  },

  /** 04.4 / 04.5 — shopping, nothing chosen yet. */
  packsReady: {
    trip: { ...emptyTrip, ...filledTrip, ...emptyTripUi },
    live: { ...emptyLive },
  },

  /** 04.6 — a pack picked and terms accepted, ready to commit. */
  packChosen: {
    trip: {
      ...emptyTrip,
      ...filledTrip,
      ...emptyTripUi,
      selectedPackId: RECOMMENDED,
      tcAccepted: true,
    },
    live: { ...emptyLive },
  },

  /** 04.7 — bought. */
  confirmed: {
    trip: {
      ...emptyTrip,
      ...filledTrip,
      ...emptyTripUi,
      selectedPackId: RECOMMENDED,
      tcAccepted: true,
      status: 'confirmed',
      confirmedAt: toISO(today()),
    },
    live: { ...emptyLive },
  },

  /** 05.2 / 05.13 — landed, registered, day one. */
  landedConnected: {
    trip: {
      ...emptyTrip,
      ...filledTrip,
      ...emptyTripUi,
      selectedPackId: RECOMMENDED,
      tcAccepted: true,
      status: 'confirmed',
      confirmedAt: toISO(today()),
    },
    live: {
      ...emptyLive,
      connection: 'connected',
      currentCountry: 'SG',
      landedAt: `${DEPART}T06:20:00.000Z`,
      dayOfTrip: 1,
      dayOfPack: 1,
      usage: { dataMb: 320, voiceMinsUsed: 2, smsUsed: 0 },
      ledger: LEDGER_SEED.filter((e) => e.kind === 'pack').map((e) => ({ ...e })),
    },
  },

  /**
   * 05.1 / 05.3 / 05.11 — landed but not registered.
   * Note the banner reads "Not connected yet"; the Figma drew
   * "Connected 999****991" on this screen, which SOURCE_ISSUES §1.2 flags as
   * contradicting its own headline.
   */
  landedNotConnected: {
    trip: {
      ...emptyTrip,
      ...filledTrip,
      ...emptyTripUi,
      selectedPackId: RECOMMENDED,
      tcAccepted: true,
      status: 'confirmed',
      confirmedAt: toISO(today()),
    },
    live: {
      ...emptyLive,
      connection: 'landed-not-connected',
      currentCountry: 'SG',
      landedAt: `${DEPART}T06:20:00.000Z`,
      dayOfTrip: 1,
      dayOfPack: 1,
      usage: { dataMb: 0, voiceMinsUsed: 0, smsUsed: 0 },
      ledger: LEDGER_SEED.filter((e) => e.kind === 'pack').map((e) => ({ ...e })),
    },
  },

  /** 05.4 / 05.10 / 05.12 — day 3 of 9, everything working. */
  midway: {
    trip: {
      ...emptyTrip,
      ...filledTrip,
      ...emptyTripUi,
      selectedPackId: RECOMMENDED,
      tcAccepted: true,
      status: 'confirmed',
      confirmedAt: toISO(today()),
    },
    live: {
      ...emptyLive,
      connection: 'connected',
      currentCountry: 'SG',
      landedAt: `${DEPART}T06:20:00.000Z`,
      dayOfTrip: 3,
      dayOfPack: 3,
      // 45 of 100 minutes and 83 of 100 texts left, 8.4 GB used — as drawn.
      usage: { dataMb: Math.round(8.4 * 1024), voiceMinsUsed: 55, smsUsed: 17 },
      ledger: LEDGER_SEED.map((e) => ({ ...e })),
      divertActive: true,
    },
  },

  /** 05.5 / 05.8 / 05.9 — day 8 of 9, allowance nearly gone. */
  lowBalance: {
    trip: {
      ...emptyTrip,
      ...filledTrip,
      ...emptyTripUi,
      selectedPackId: RECOMMENDED,
      tcAccepted: true,
      status: 'confirmed',
      confirmedAt: toISO(today()),
    },
    live: {
      ...emptyLive,
      connection: 'connected',
      currentCountry: 'MY',
      landedAt: `${DEPART}T06:20:00.000Z`,
      dayOfTrip: 8,
      dayOfPack: 8,
      /*
        Texts run down like the data and the minutes do. The pack's 100 are for
        the WHOLE trip, not per day, so eight days in they are nearly gone —
        seeded at 11 they read as untouched, and a screen whose whole subject
        is a low balance was quietly reporting 89 texts left.
      */
      usage: { dataMb: 36 * 1024, voiceMinsUsed: 82, smsUsed: 87 },
      ledger: LEDGER_SEED.map((e) => ({ ...e })),
      divertActive: true,
    },
  },

  /** 05.6 / 05.7 — the pack has run out and standard rates apply. */
  exhausted: {
    trip: {
      ...emptyTrip,
      ...filledTrip,
      ...emptyTripUi,
      selectedPackId: RECOMMENDED,
      tcAccepted: true,
      status: 'confirmed',
      confirmedAt: toISO(today()),
    },
    live: {
      ...emptyLive,
      connection: 'pack-ended',
      currentCountry: 'AE',
      landedAt: `${DEPART}T06:20:00.000Z`,
      dayOfTrip: 11,
      dayOfPack: 11,
      usage: { dataMb: 41 * 1024, voiceMinsUsed: 100, smsUsed: 22 },
      ledger: LEDGER_SEED.map((e) => ({ ...e })),
      divertActive: false,
    },
  },
}
