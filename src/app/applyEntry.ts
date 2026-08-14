import { SCENARIOS } from '../state/scenarios'
import { useLiveStore } from '../state/liveStore'
import { useTripStore } from '../state/tripStore'
import { useUiStore } from '../state/uiStore'
import type { FigmaEntry } from './routes'

/**
 * Put the stores into the state a screen is meant to be seen in.
 *
 * This used to live inside IndexRail.open(), which meant a scenario was only
 * ever applied by clicking the rail. Load `#/away/connected` directly — or just
 * reload the page you are already on — and 05.2 rendered against `emptyTrip`:
 * no destinations, no dates, "0 Days". The screens are a demonstration, so an
 * empty one is a broken one.
 *
 * Both entry points now go through here, so there is one definition of what
 * "being on 05.2" means.
 */
export function applyEntry(entry: FigmaEntry) {
  const scenario = SCENARIOS[entry.scenario]
  if (scenario.trip) useTripStore.getState().hydrate(scenario.trip)
  if (scenario.live) useLiveStore.getState().hydrate(scenario.live)

  const ui = useUiStore.getState()
  ui.setNotification(entry.notificationId ?? null)
  ui.setLiveActivityExpanded(Boolean(entry.liveActivity))
}
