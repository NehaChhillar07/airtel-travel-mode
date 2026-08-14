/**
 * The one place JSON becomes typed.
 *
 * Every import elsewhere in the app goes through here, so a malformed record
 * is a type error at build time rather than an `undefined` on a screen.
 */

import type {
  ChecklistStep,
  Country,
  Explainer,
  FaqEntry,
  LedgerEntry,
  NotificationRecord,
  Pack,
  Settings,
  TimelineStep,
} from '../lib/types'

import countriesJson from './countries.json'
import packsJson from './packs.json'
import settingsJson from './settings.json'
import copyJson from './copy.json'
import timelineJson from './timeline.json'
import checklistJson from './checklist.json'
import notificationsJson from './notifications.json'
import ledgerJson from './ledger.json'
import explainersJson from './explainers.json'
import faqJson from './faq.json'
import homeJson from './home.json'

export const SETTINGS = settingsJson as Settings
export const COUNTRIES = countriesJson as Country[]
export const PACKS = packsJson as Pack[]
export const TIMELINE = timelineJson as TimelineStep[]
export const CHECKLIST = checklistJson as ChecklistStep[]
export const NOTIFICATIONS = notificationsJson as NotificationRecord[]
export const LEDGER_SEED = ledgerJson as LedgerEntry[]
export const EXPLAINERS = explainersJson as Explainer[]
export const FAQ = faqJson as FaqEntry[]
export const HOME = homeJson
export const COPY = copyJson

/* ------------------------------------------------------------- lookups */

export const COUNTRY_BY_ISO: Record<string, Country> = Object.fromEntries(
  COUNTRIES.map((c) => [c.iso2, c]),
)

export const PACK_BY_ID: Record<string, Pack> = Object.fromEntries(
  PACKS.map((p) => [p.id, p]),
)

export const POPULAR_COUNTRIES = COUNTRIES.filter((c) => c.popular)

export const NOTIFICATION_BY_ID: Record<string, NotificationRecord> =
  Object.fromEntries(NOTIFICATIONS.map((n) => [n.id, n]))

/** Resolve ISO2 codes to records, dropping anything unknown. */
export function countriesOf(iso2s: string[]): Country[] {
  return iso2s.map((c) => COUNTRY_BY_ISO[c]).filter(Boolean)
}
