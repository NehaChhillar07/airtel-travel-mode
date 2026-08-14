import type { ComponentType } from 'react'
import type { RouteId } from '../app/routes'
import { Gallery } from './gallery/Gallery'
import { TripCreate } from './trip/TripCreate'
import { PackSelect } from './packs/PackSelect'
import { Review } from './review/Review'
import { Confirmation } from './confirmation/Confirmation'
import { SetupChecklist } from './away/Arrival'
import { Connected } from './away/Connected'
import { NotConnected } from './away/NotConnected'
import { PackEnded } from './away/PackEnded'
import { Dashboard } from './dashboard/Dashboard'
import { LockScreen } from './lock/LockScreen'
import { Home } from './home/Home'

/**
 * Route -> screen component.
 *
 * Twenty-two Figma screens resolve to thirteen entries here, because most of
 * the file's "screens" are states of one screen. See src/app/routes.ts.
 */
export const SCREENS: Record<RouteId, ComponentType> = {
  home: Home,
  trip: TripCreate,
  packs: PackSelect,
  review: Review,
  confirmation: Confirmation,
  setup: SetupChecklist,
  connected: Connected,
  'not-connected': NotConnected,
  dashboard: Dashboard,
  'pack-ended': PackEnded,
  lock: LockScreen,
  gallery: Gallery,
}
