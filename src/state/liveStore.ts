/**
 * The away state — everything the 05.x screens read.
 *
 * Separate from the trip draft because the two have disjoint lifecycles: the
 * dashboard should not re-render when someone types in a search field on a
 * screen they left ten minutes ago.
 */

import { create } from 'zustand'
import { LEDGER_SEED } from '../data'
import type { ConnectionState, LedgerEntry, LiveTrip } from '../lib/types'
import { minutesLeftAtEndOf } from '../lib/usage'

export const emptyLive: LiveTrip = {
  connection: 'pre-departure',
  currentCountry: 'SG',
  landedAt: null,
  dayOfTrip: 0,
  dayOfPack: 0,
  usage: { dataMb: 0, voiceMinsUsed: 0, smsUsed: 0 },
  ledger: [],
  divertActive: true,
}

interface LiveActions {
  land: (country?: string) => void
  setConnection: (c: ConnectionState) => void
  /** `voiceMins` is the pack's daily allowance, so the new day starts its own. */
  advanceDay: (n?: number, voiceMins?: number) => void
  addLedgerEntry: (entry: LedgerEntry) => void
  stopDivert: () => void
  addUsage: (patch: Partial<LiveTrip['usage']>) => void
  reset: () => void
  hydrate: (patch: Partial<LiveTrip>) => void
}

export type LiveStore = LiveTrip & LiveActions

/** The seed ledger minus the pack line, which is added on purchase. */
function seedLedger(): LedgerEntry[] {
  return LEDGER_SEED.map((e) => ({ ...e }))
}

export const useLiveStore = create<LiveStore>()((set) => ({
  ...emptyLive,

  land: (country = 'SG') =>
    set({
      connection: 'connected',
      currentCountry: country,
      landedAt: new Date(0).toISOString(),
      dayOfTrip: 1,
      dayOfPack: 1,
      ledger: seedLedger().filter((e) => e.atHoursAfterLanding === 0),
    }),

  setConnection: (connection) => set({ connection }),

  advanceDay: (n = 1, voiceMins = 0) =>
    set((s) => {
      const dayOfTrip = s.dayOfTrip + n
      return {
        dayOfTrip,
        dayOfPack: s.dayOfPack + n,
        // A day of travel burns roughly 2 GB and a couple of texts, and both are
        // sold for the whole pack, so they keep adding up. Minutes are per day:
        // the new day starts from its own allowance, not yesterday's leftovers.
        usage: {
          dataMb: s.usage.dataMb + n * 2048,
          voiceMinsUsed:
            voiceMins > 0
              ? voiceMins - minutesLeftAtEndOf(dayOfTrip, voiceMins)
              : s.usage.voiceMinsUsed,
          smsUsed: s.usage.smsUsed + n * 2,
        },
      }
    }),

  addLedgerEntry: (entry) => set((s) => ({ ledger: [entry, ...s.ledger] })),

  stopDivert: () =>
    set((s) => ({
      divertActive: false,
      ledger: s.ledger.map((e) =>
        e.kind === 'voicemail-divert' ? { ...e, stopped: true, action: null } : e,
      ),
    })),

  addUsage: (patch) => set((s) => ({ usage: { ...s.usage, ...patch } })),

  reset: () => set({ ...emptyLive }),

  hydrate: (patch) => set(patch),
}))
