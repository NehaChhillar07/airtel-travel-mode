import { ROUTES, ROUTE_BY_PATH, type RouteId, type SheetState } from './routes'

/**
 * The URL is `#/trip/packs?sheet=pack-detail&pack=ir-asia-10d-2999`.
 *
 * Routes are the path. Sheets ride in the query rather than being routes of
 * their own, because opening a sheet must not push history — the in-app back
 * chevron should leave the screen, not close the drawer.
 */

export function serialiseHash(route: RouteId, sheet: SheetState): string {
  const path = ROUTES[route].path
  if (!sheet) return `#${path}`
  const params = new URLSearchParams({ sheet: sheet.kind })
  if (sheet.kind === 'pack-detail') params.set('pack', sheet.packId)
  if (sheet.kind === 'calendar') params.set('field', sheet.field)
  if (sheet.kind === 'why') params.set('entry', sheet.entryId)
  return `#${path}?${params.toString()}`
}

export function parseHash(hash: string): { route: RouteId | null; sheet: SheetState } {
  const raw = hash.replace(/^#/, '') || '/'
  const [path, query] = raw.split('?')
  const route = ROUTE_BY_PATH[path] ?? null
  if (!query) return { route, sheet: null }

  const params = new URLSearchParams(query)
  const kind = params.get('sheet')
  switch (kind) {
    case 'pack-detail': {
      const packId = params.get('pack')
      return { route, sheet: packId ? { kind, packId } : null }
    }
    case 'calendar': {
      const field = params.get('field')
      return { route, sheet: field === 'from' || field === 'to' ? { kind, field } : null }
    }
    case 'why': {
      const entryId = params.get('entry')
      return { route, sheet: entryId ? { kind, entryId } : null }
    }
    case 'change-number':
    case 'faq':
      return { route, sheet: { kind } }
    default:
      return { route, sheet: null }
  }
}

/**
 * Read once, at store creation.
 *
 * Doing this as an effect instead created a race that StrictMode's double
 * invoke made permanent: the store->URL effect stamped the default route over
 * the hash the page was opened with, and the URL->store effect then read back
 * the value that had just been written. Seeding the initial state means there
 * is nothing to catch up on.
 */
export function initialFromHash(): { route: RouteId; sheet: SheetState } {
  if (typeof window === 'undefined') return { route: 'home', sheet: null }
  const { route, sheet } = parseHash(window.location.hash)
  return { route: route ?? 'home', sheet }
}
