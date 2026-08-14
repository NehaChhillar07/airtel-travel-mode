/**
 * Routes, and the bridge back to the Figma screen index.
 *
 * The Figma document has 22 screens; the product has 13 routes. Most "screens"
 * in the file are *states* of one screen — 04.1, 04.2 and 04.3 are the same
 * form empty, being searched, and filled. Collapsing them is what makes the
 * thing functional; keeping FIGMA_INDEX is what keeps it reviewable.
 *
 * A rail click therefore does two things: apply a scenario snapshot to the
 * stores, then navigate. That is why "04.3 Trip details filled" can land you on
 * a real screen with three chips genuinely active and a CTA that is live
 * because `validateTrip` says so.
 *
 * The index is not a mirror of the file. A frame that only draws a state the
 * working screen already reaches by being used does not get an entry — see
 * 04.2 below.
 */

import type { ScenarioId } from '../state/scenarios'

export type RouteId =
  | 'home'
  | 'trip'
  | 'packs'
  | 'review'
  | 'confirmation'
  | 'setup'
  | 'connected'
  | 'not-connected'
  | 'dashboard'
  | 'pack-ended'
  | 'lock'
  | 'gallery'

export interface RouteMeta {
  path: string
  /** Shown in the presenter toolbar. */
  title: string
  /**
   * Position in the journey. When a navigation does not declare its direction,
   * depth decides: deeper is a push, shallower is a pop, equal is a jump.
   */
  depth: number
}

export const ROUTES: Record<RouteId, RouteMeta> = {
  home: { path: '/', title: 'Home', depth: 0 },
  trip: { path: '/trip', title: 'Tell us about your trip', depth: 1 },
  packs: { path: '/trip/packs', title: 'Packs for your trip', depth: 2 },
  review: { path: '/trip/review', title: 'Review', depth: 3 },
  confirmation: { path: '/trip/confirmed', title: 'Confirmation', depth: 4 },
  setup: { path: '/away/setup', title: 'Three quick checks', depth: 6 },
  connected: { path: '/away/connected', title: "You're connected", depth: 5 },
  'not-connected': { path: '/away/no-signal', title: 'Not connected', depth: 5 },
  dashboard: { path: '/away/trip', title: 'Trip dashboard', depth: 5 },
  'pack-ended': { path: '/away/ended', title: 'Pack ended', depth: 5 },
  lock: { path: '/lock', title: 'Lock screen', depth: 0 },
  gallery: { path: '/dev/gallery', title: 'Component gallery', depth: 0 },
}

export type SheetState =
  | null
  | { kind: 'pack-detail'; packId: string }
  | { kind: 'calendar'; field: 'from' | 'to' }
  | { kind: 'change-number' }
  | { kind: 'why'; entryId: string }
  | { kind: 'faq' }

export interface FigmaEntry {
  /** The name as it appears in the Figma file and in SCREENS.md. */
  figma: string
  group: string
  route: RouteId
  scenario: ScenarioId
  sheet?: SheetState
  /** For the seven notification screens. */
  notificationId?: string
  liveActivity?: boolean
  /** Export filename, when it differs from `figma`. Used by the ghost overlay. */
  png?: string
  /** Where a deliberate departure from the static screen is expected. */
  note?: string
  /**
   * One line naming this screen's choreographed set piece, if it has one.
   * Presence of the field is what puts the animated trace on the rail entry and
   * the Replay button in the toolbar, so it is the single source of truth for
   * "this screen is worth watching, not just looking at".
   */
  motion?: string
}

/**
 * All 22 exported screens, grouped exactly as the old rail grouped them.
 * (The previous build shipped 21 — `01.1 Home screen today` never made it in.)
 */
export const FIGMA_INDEX: FigmaEntry[] = [
  // --------------------------------------------------------------- 01 Home
  /*
    One entry, not two. The Figma calls this board "01 The problem" and crops a
    second frame out of it as "01.1 Home screen today", but there is only one
    screen: the Airtel home, with the Travel tile on it. `png` keeps the ghost
    overlay pointed at the export, whose filename still carries the old name.
  */
  {
    figma: '01 Home',
    group: 'Home',
    route: 'home',
    scenario: 'noTrip',
    png: '01-The-problem',
    motion: 'Tap Travel — a split-flap board takes the screen. Tap it again for the short version',
  },

  // --------------------------------------------------- 04 Before you fly
  /*
    04.2 "Destination and dates" is a frame in the file but not an entry here.
    It draws the search mid-query and the date field being filled — which is
    what 04.1 already does when you use it: type a country, watch the results
    stagger in, add the chips, set the dates, and the CTA goes live. A rail
    entry for it would be a third door onto the same screen, seeded to look
    like someone had been typing, when the real one is one keystroke away.
  */
  { figma: '04.1 Trip creation', group: 'Before you fly', route: 'trip', scenario: 'emptyDraft' },
  { figma: '04.3 Trip details filled', group: 'Before you fly', route: 'trip', scenario: 'threeSelected' },
  {
    figma: '04.4 Pack selection',
    group: 'Before you fly',
    route: 'packs',
    scenario: 'packsReady',
    motion: 'Pack cards deal in one after another',
  },
  {
    figma: '04.5 Pack detail',
    group: 'Before you fly',
    route: 'packs',
    scenario: 'packsReady',
    sheet: { kind: 'pack-detail', packId: 'ir-asia-10d-2999' },
  },
  {
    figma: '04.6 Review and billing',
    group: 'Before you fly',
    route: 'review',
    scenario: 'packChosen',
    motion: 'The bill total counts up to its figure',
  },
  {
    figma: '04.7 Confirmation',
    group: 'Before you fly',
    route: 'confirmation',
    scenario: 'confirmed',
    motion: 'The stamp lands, then the timeline draws down',
  },

  // ------------------------------------------------ 05 While you're away
  { figma: '05.1 Setup checklist', group: 'While you are away', route: 'setup', scenario: 'landedNotConnected' },
  {
    figma: '05.2 Connected confirmation',
    group: 'While you are away',
    route: 'connected',
    scenario: 'landedConnected',
    motion: 'The arc draws and the plane flies it, then the flag lands',
  },
  {
    figma: '05.3 Not connected troubleshooting',
    group: 'While you are away',
    route: 'not-connected',
    scenario: 'landedNotConnected',
    note: 'banner reads "Not connected yet" — SOURCE_ISSUES §1.2',
    motion: 'The same arc, but the question mark stalls halfway and keeps trying',
  },
  {
    figma: '05.4 Trip dashboard',
    group: 'While you are away',
    route: 'dashboard',
    scenario: 'midway',
    motion: 'Tap a spent day and the whole block rewinds to it; the unlimited dots march',
  },
  {
    figma: '05.5 Trip dashboard low balance',
    group: 'While you are away',
    route: 'dashboard',
    scenario: 'lowBalance',
    motion: 'The same rewind, on a trip that has nearly run out',
  },
  {
    figma: '05.6 Pack ended',
    group: 'While you are away',
    route: 'pack-ended',
    scenario: 'exhausted',
    motion: 'What it has cost counts up, then keeps ticking in paise',
  },

  // ----------------------------------------------------- 05 Notifications
  { figma: '05.7 Notification pack ended', group: 'Notifications', route: 'lock', scenario: 'exhausted', notificationId: 'pack-ended' },
  { figma: '05.8 Notification pack ending soon', group: 'Notifications', route: 'lock', scenario: 'lowBalance', notificationId: 'pack-ending' },
  { figma: '05.9 Notification usage warnings', group: 'Notifications', route: 'lock', scenario: 'lowBalance', notificationId: 'usage-warning' },
  { figma: '05.10 Notification missed call charges', group: 'Notifications', route: 'lock', scenario: 'midway', notificationId: 'missed-call' },
  { figma: '05.11 Notification not connected', group: 'Notifications', route: 'lock', scenario: 'landedNotConnected', notificationId: 'not-connected' },
  {
    figma: '05.12 Notification live activity widget',
    group: 'Notifications',
    route: 'lock',
    scenario: 'midway',
    liveActivity: true,
    motion: 'The live activity expands on the lock screen',
  },
  { figma: '05.13 Notification connected', group: 'Notifications', route: 'lock', scenario: 'landedConnected', notificationId: 'connected' },
]

export const GROUP_ORDER = [
  'Home',
  'Before you fly',
  'While you are away',
  'Notifications',
] as const

/**
 * What is choreographed on the screen currently on stage, if anything.
 *
 * Prefers the index entry you arrived by, because one route can be several
 * entries with different set pieces — every notification is `lock`, but only
 * 05.12 has one. Falls back to the route so a deep link still finds it.
 */
export function motionNoteFor(route: RouteId, figmaEntry: string | null): string | null {
  if (figmaEntry) {
    const entry = FIGMA_INDEX.find((e) => e.figma === figmaEntry)
    if (entry) return entry.motion ?? null
  }
  return FIGMA_INDEX.find((e) => e.route === route && e.motion)?.motion ?? null
}

/** Reverse lookup for hash routing. */
export const ROUTE_BY_PATH = Object.fromEntries(
  (Object.keys(ROUTES) as RouteId[]).map((id) => [ROUTES[id].path, id]),
) as Record<string, RouteId>
