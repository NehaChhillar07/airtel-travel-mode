import { useEffect, useLayoutEffect, useRef } from 'react'
import { applyEntry } from './applyEntry'
import { FIGMA_INDEX, type FigmaEntry } from './routes'
import { useUiStore } from '../state/uiStore'

/**
 * Ties the index rail and the store state to whatever screen is on stage.
 *
 * Two jobs, and they are deliberately split by when they run.
 *
 * ON BOOT it applies the scenario for the route the hash asked for. Without
 * that, a reload or a shared link rendered the screen against `emptyTrip` — 05.2
 * with no destinations, no dates and "0 Days" on the band. Only a rail click
 * ever hydrated the stores, so the screens looked correct exactly once and
 * broke the moment anyone refreshed.
 *
 * ON NAVIGATION it moves the rail highlight only. It must NOT re-apply the
 * scenario: walking Review → Confirmation with a trip you built yourself would
 * have it silently replaced by the canned one.
 */

/** Same-route entries are told apart by the state that produced them. */
function score(entry: FigmaEntry, state: ReturnType<typeof useUiStore.getState>) {
  let n = 0
  if ((entry.notificationId ?? null) === state.notificationId) n += 2
  if (Boolean(entry.liveActivity) === state.liveActivityExpanded) n += 2
  if ((entry.sheet?.kind ?? null) === (state.sheet?.kind ?? null)) n += 1
  return n
}

function resolve(route: string) {
  const state = useUiStore.getState()
  const candidates = FIGMA_INDEX.filter((e) => e.route === route)
  if (!candidates.length) return null
  // Stable: equal scores keep index order, so the base state of a screen (04.1
  // of the three trip states) is the fallback rather than a coin toss.
  return candidates.reduce((a, b) => (score(b, state) > score(a, state) ? b : a))
}

/** Module-level, so React 19's double-invoked effects boot exactly once. */
let booted = false

export function useIndexSync() {
  const route = useUiStore((s) => s.route)
  const prevRoute = useRef<string | null>(null)

  /*
    Layout effect, not effect: this runs after the first render commits but
    before the browser paints, so the empty first pass is never shown. A plain
    useEffect would flash "0 Days" for a frame before the real trip arrived.
  */
  useLayoutEffect(() => {
    if (booted) return
    booted = true
    const entry = resolve(useUiStore.getState().route)
    if (!entry) return
    applyEntry(entry)
    useUiStore.getState().setFigmaEntry(entry.figma)
    prevRoute.current = entry.route
  }, [])

  useEffect(() => {
    if (prevRoute.current === route) return
    prevRoute.current = route

    /*
      If the current entry already belongs to this route, leave it: the rail
      set it, and it knows which of the route's several entries you asked for.
      Three entries share `trip` and nothing in the state distinguishes them,
      so re-resolving would instantly demote a 04.2 click to 04.1.
    */
    const state = useUiStore.getState()
    const current = FIGMA_INDEX.find((e) => e.figma === state.figmaEntry)
    if (current?.route === route) return

    const entry = resolve(route)
    if (entry) state.setFigmaEntry(entry.figma)
  }, [route])
}
