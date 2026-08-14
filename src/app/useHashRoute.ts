import { useEffect } from 'react'
import { parseHash, serialiseHash } from './hash'
import { useUiStore } from '../state/uiStore'

/**
 * Keeps `location.hash` in step with the route.
 *
 * The old shell held the current screen in a `useState<string>` with no URL at
 * all, so nothing could be linked, refresh lost your place, and the browser
 * back button did nothing. This adds all three without taking on a router that
 * would also want to own the transition direction `src/motion/nav.ts` needs.
 *
 * The initial read happens in the store, not here — see `initialFromHash`.
 */
export function useHashRoute() {
  const route = useUiStore((s) => s.route)
  const sheet = useUiStore((s) => s.sheet)

  // Store -> URL. `replaceState` rather than assigning to `hash`, so
  // programmatic navigation does not stack entries the user must click back
  // through one at a time.
  useEffect(() => {
    const next = serialiseHash(route, sheet)
    if (window.location.hash !== next) {
      window.history.replaceState(null, '', next)
    }
  }, [route, sheet])

  // URL -> store, for the back button and for links pasted into a live tab.
  useEffect(() => {
    const apply = () => {
      const { route: parsed, sheet: parsedSheet } = parseHash(window.location.hash)
      const ui = useUiStore.getState()
      if (parsed && parsed !== ui.route) ui.jump(parsed)
      if (JSON.stringify(parsedSheet) !== JSON.stringify(ui.sheet)) {
        if (parsedSheet) ui.openSheet(parsedSheet)
        else ui.closeSheet()
      }
    }
    window.addEventListener('hashchange', apply)
    window.addEventListener('popstate', apply)
    return () => {
      window.removeEventListener('hashchange', apply)
      window.removeEventListener('popstate', apply)
    }
  }, [])
}
