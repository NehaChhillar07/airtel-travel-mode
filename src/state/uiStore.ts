/**
 * Navigation, overlays and presenter chrome.
 *
 * The route lives here rather than in a router library because the screen
 * transitions need an explicit push / pop / jump intent — `src/motion/nav.ts`
 * is built around it — and no router hands you that. What the old router
 * lacked was a URL; that is added here in ~30 lines rather than as a
 * dependency.
 */

import { create } from 'zustand'
import type { NavDirection } from '../motion/nav'
import type { RouteId, SheetState } from '../app/routes'
import { ROUTES } from '../app/routes'
import { initialFromHash } from '../app/hash'

export interface ToastRecord {
  id: string
  tone: 'neutral' | 'success' | 'alert'
  title: string
  body?: string
  ttlMs: number
}

interface UiState {
  route: RouteId
  history: RouteId[]
  direction: NavDirection
  sheet: SheetState
  toasts: ToastRecord[]
  /** Which FIGMA_INDEX entry the rail is highlighting, if any. */
  figmaEntry: string | null
  /** Lock screen: which notification is showing. */
  notificationId: string | null
  liveActivityExpanded: boolean
  /** One-shot gate so choreographed reveals do not replay on every visit. */
  playedSequences: string[]
  /**
   * Where a `reveal` transition opens from, in the phone's own coordinates.
   *
   * The circular reveal has to know which element was tapped, and the screen
   * host is the only thing that can clip the incoming layer — so the point has
   * to travel through the store rather than through props.
   */
  revealFrom: { x: number; y: number } | null
  /**
   * Bumped to replay a screen's set piece. ScreenHost keys the screen on it,
   * so incrementing remounts and every mount animation runs again from zero.
   */
  motionRun: number
  /** Presenter chrome. */
  railOpen: boolean
  ghostOverlay: boolean
}

interface UiActions {
  navigate: (route: RouteId, direction?: NavDirection) => void
  back: () => void
  jump: (route: RouteId, figmaEntry?: string) => void
  openSheet: (sheet: NonNullable<SheetState>) => void
  closeSheet: () => void
  toast: (t: Omit<ToastRecord, 'id'> & { id?: string }) => void
  dismissToast: (id: string) => void
  setNotification: (id: string | null) => void
  setLiveActivityExpanded: (v: boolean) => void
  /** Opens the next navigation as a circle growing out of this point. */
  setRevealFrom: (p: { x: number; y: number } | null) => void
  markPlayed: (key: string) => void
  hasPlayed: (key: string) => boolean
  setRailOpen: (v: boolean) => void
  toggleGhostOverlay: () => void
  replayMotion: () => void
  setFigmaEntry: (v: string | null) => void
}

export type UiStore = UiState & UiActions

let toastSeq = 0

/** Deeper is a push, shallower is a pop, equal is a jump. */
function inferDirection(from: RouteId, to: RouteId): NavDirection {
  const a = ROUTES[from].depth
  const b = ROUTES[to].depth
  if (b > a) return 'push'
  if (b < a) return 'pop'
  return 'jump'
}

const initial = initialFromHash()

export const useUiStore = create<UiStore>()((set, get) => ({
  route: initial.route,
  history: [],
  direction: 'jump',
  sheet: initial.sheet,
  toasts: [],
  figmaEntry: null,
  notificationId: null,
  liveActivityExpanded: false,
  playedSequences: [],
  revealFrom: null,
  motionRun: 0,
  railOpen: true,
  ghostOverlay: false,

  navigate: (route, direction) =>
    set((s) => {
      if (route === s.route) return s
      return {
        route,
        direction: direction ?? inferDirection(s.route, route),
        history: [...s.history, s.route],
        sheet: null,
      }
    }),

  back: () =>
    set((s) => {
      if (!s.history.length) return s
      const prev = s.history[s.history.length - 1]
      return {
        route: prev,
        direction: 'pop',
        history: s.history.slice(0, -1),
        sheet: null,
      }
    }),

  /** Index-rail navigation: no spatial relationship, so it cross-fades. */
  /*
    Jumping is how the index rail works, and it also resets what has been seen.

    A reviewer selecting "01 Home" and tapping Travel should get the full
    departure sequence, not the short hop it degrades to on repeat taps — the
    long one is the thing they opened that entry to look at. Landing on a screen
    from the index is a fresh start by definition, so this is the right place
    for it rather than a special case in the rail.
  */
  jump: (route, figmaEntry) =>
    set({
      route,
      direction: 'jump',
      history: [],
      sheet: null,
      figmaEntry: figmaEntry ?? null,
      playedSequences: [],
    }),

  openSheet: (sheet) => set({ sheet }),
  closeSheet: () => set({ sheet: null }),

  toast: (t) =>
    set((s) => ({
      toasts: [...s.toasts, { ...t, id: t.id ?? `toast-${++toastSeq}` }],
    })),

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setNotification: (notificationId) => set({ notificationId }),
  setLiveActivityExpanded: (liveActivityExpanded) => set({ liveActivityExpanded }),

  setRevealFrom: (revealFrom) => set({ revealFrom }),

  markPlayed: (key) =>
    set((s) => (s.playedSequences.includes(key) ? s : { playedSequences: [...s.playedSequences, key] })),

  hasPlayed: (key) => get().playedSequences.includes(key),

  setRailOpen: (railOpen) => set({ railOpen }),
  /*
    Replay means "from zero", so the record of what has already been seen is
    cleared with it. Without that, the home screen's departure sequence would
    replay as the short hop it falls back to after its first run — which is the
    one thing a Replay button must not do.
  */
  replayMotion: () => set((s) => ({ motionRun: s.motionRun + 1, playedSequences: [] })),
  toggleGhostOverlay: () => set((s) => ({ ghostOverlay: !s.ghostOverlay })),
  setFigmaEntry: (figmaEntry) => set({ figmaEntry }),
}))

/**
 * The quick-action tiles.
 *
 * The row is the same row on all six product screens, so where a tile goes is
 * data — `opens` in `home.json` — and the handler lives here rather than as
 * six identical lambdas that can drift apart.
 *
 * Only "All" and "Travel" open anything today. Wi-Fi, Postpaid and Bank are
 * the rest of the Airtel app, which this prototype does not contain.
 */
export function useQuickActionNav() {
  const navigate = useUiStore((x) => x.navigate)
  /*
    `instant`, not the inferred direction.

    These are the tile-row tabs. Left to infer, the trip screen's greater depth
    made a return to All a `pop`, which slid the screen in from the left — a
    spatial claim a tab bar never makes. The row itself does not move between
    tabs, so neither should what is under it.
  */
  return (item: { opens?: string }) => {
    if (item.opens) navigate(item.opens as RouteId, 'instant')
  }
}
