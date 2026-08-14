/**
 * The domain model.
 *
 * None of this existed before: "₹2,999", "Day 3 of 9" and "9990009991" were
 * text runs baked into a Figma scene graph, so changing a price meant
 * regenerating from Figma. Everything below is now data.
 *
 * Dates are ISO `yyyy-MM-dd` strings rather than `Date` objects so the stores
 * stay JSON-serialisable and survive `persist` and scenario snapshots.
 */

export type Region =
  | 'Southeast Asia'
  | 'Middle East'
  | 'East Asia'
  | 'South Asia'
  | 'Europe'
  | 'North America'
  | 'Oceania'

export interface Country {
  /** ISO 3166-1 alpha-2, and the identity used everywhere. */
  iso2: string
  name: string
  region: Region
  /** Unicode regional-indicator pair, the fallback render. */
  flagEmoji: string
  /**
   * A baked Apple glyph PNG, when one exists. Only four were baked
   * (SG, MY, AE, TH) — tools/bake_emoji.mjs can produce more.
   */
  flagAsset: string | null
  /** What someone might type instead of the name: "Dubai" -> UAE. */
  aliases: string[]
  /** Renders as a suggestion chip on the trip screen. */
  popular: boolean
  callingCode: string
  /** Shown on the pack detail sheet when this country is in the trip. */
  networkNote: string | null
  /** Indicative entry price, for the "from ₹649" line on a result row. */
  fromPrice: number
}

export type PackTier = 'data-only' | 'talk-and-data' | 'unlimited'

export type PackData =
  | { kind: 'unlimited'; fupGb: number; postFupKbps: number }
  | { kind: 'metered'; gb: number }

export interface InFlightBenefit {
  dataMb: number
  mins: number
  sms: number
  validityHrs: number
}

/**
 * Reason copy, templated.
 *
 * The Figma froze the sentence "Covers all three countries and outlasts your
 * 9 days by one" onto a card. Here it is generated from the trip the user
 * actually built, so changing the dates changes the sentence.
 */
export interface ReasonTemplates {
  /** Pack validity comfortably covers the trip. */
  fits: string
  /** Cheap, data-only — honest about what it does not do. */
  thin: string
  /** Longer than needed, but worth it under some conditions. */
  upsell: string
  /** Validity ends before the trip does. */
  short: string
}

export interface Pack {
  id: string
  name: string
  /** Rupees, excluding GST. GST is computed, never stored. */
  priceExGst: number
  validityDays: number
  data: PackData
  voiceMins: number
  sms: number
  /** ISO2 codes this pack covers. Coverage is a hard filter, not a score. */
  countries: string[]
  regions: Region[]
  tier: PackTier
  inFlight: InFlightBenefit | null
  /** Benefit blocks on the pack detail sheet. */
  perks: string[]
  /** Fine print under the benefit blocks. */
  fairUse: string
  reasonTemplates: ReasonTemplates
  tags: PackTag[]
}

export type PackTag = 'popular' | 'cheapest' | 'best-value' | 'longest'

/** Inclusive range. `to` may lag `from` while the user is mid-selection. */
export interface DateRange {
  from: string | null
  to: string | null
}

export interface Billing {
  kind: 'postpaid'
  /** Day of month the bill is raised. 2 -> "bill dated 2 Sep". */
  cycleDay: number
}

export type TripStatus = 'draft' | 'confirmed'

export interface TripDraft {
  /** Ordered ISO2, in the order the user added them. */
  destinations: string[]
  range: DateRange
  selectedPackId: string | null
  expandedPackId: string | null
  tcAccepted: boolean
  msisdn: string
  billing: Billing
  /** The 04.7 "Add another pack if this one runs out" switch. */
  autoTopUp: boolean
  status: TripStatus
  confirmedAt: string | null
}

/* ---------------------------------------------------------------- live trip */

export type ConnectionState =
  | 'pre-departure'
  | 'landed-not-connected'
  | 'connected'
  | 'pack-ended'

/**
 * Mirrors the `Trip progress` COMPONENT_SET variants in Figma exactly. The
 * designer already drew the state machine; this is it in code.
 */
export type TripProgressVariant =
  | 'connected'
  | 'midway'
  | 'exhausted'
  | 'no-connection'

export type LedgerKind =
  | 'pack'
  | 'voicemail-divert'
  | 'declined-call'
  | 'incoming-call'
  | 'sms'
  | 'data-overage'

export interface LedgerEntry {
  id: string
  kind: LedgerKind
  /** Rupees. */
  amount: number
  /** The row label: "Voicemail divert · 3 calls forwarded". */
  label: string
  /** Body copy for the "Why" sheet. */
  detail: string
  /** Relative to landing, so the ledger replays at any date. */
  atHoursAfterLanding: number
  action: LedgerAction | null
  stopped?: boolean
}

export interface LedgerAction {
  label: 'Stop' | 'Why'
  kind: 'stop-divert' | 'explain'
}

export interface Usage {
  dataMb: number
  voiceMinsUsed: number
  smsUsed: number
}

export interface LiveTrip {
  connection: ConnectionState
  /** ISO2 of where the phone currently is. */
  currentCountry: string
  /** ISO datetime, or null before departure. */
  landedAt: string | null
  /**
   * 1-based day of the *trip*. Distinct from `dayOfPack` — the trip is 9 days
   * and the pack is 10, which is why SOURCE_ISSUES §1.3 found three screens
   * disagreeing. Keeping them as separate fields is the fix.
   */
  dayOfTrip: number
  dayOfPack: number
  usage: Usage
  ledger: LedgerEntry[]
  divertActive: boolean
}

/* ----------------------------------------------------------------- content */

export interface TimelineStep {
  id: string
  /** May contain {tokens} resolved against the trip. */
  when: string
  title: string
  body: string | null
  tone: 'done' | 'upcoming'
}

export interface ChecklistPick {
  label: string
  hint: string
  good: boolean
}

export interface ChecklistStep {
  n: number
  title: string
  why: string
  /** The lavender settings-path chip. Null on the step that has no path. */
  settingsPath: string | null
  /**
   * Blue numbered instructions, in place of a settings path. The frame draws
   * them as an ordered list, so they are a list rather than one sentence with
   * four full stops in it.
   */
  note: string[] | null
  /** Grey line after the instruction. */
  after: string | null
  cta: string | null
  picks: ChecklistPick[]
}

export type NotificationTone = 'neutral' | 'success' | 'alert'

export interface NotificationRecord {
  id: string
  /** The Figma screen this came from, for the index rail. */
  screen: string
  app: string
  at: string
  title: string
  body: string
  /** Route id this notification opens. */
  opens: string
  tone: NotificationTone
}

export interface Explainer {
  id: string
  /** `actions` sit in the main list; `drain` sit in the red "stop the drain" card. */
  group: 'actions' | 'drain'
  title: string
  body: string
  trailing: 'chevron' | 'switch' | 'none'
  icon: string
}

export interface FaqEntry {
  id: string
  question: string
  answer: string
}

export interface HomeTile {
  id: string
  label: string
  image: string
}

export interface QuickAction {
  id: string
  label: string
  icon: string
}

export interface Settings {
  /** Pinned so "9 Days" and "bill dated 2 Sep" do not drift as real time passes. */
  today: string
  msisdn: string
  billingCycleDay: number
  billDueOffsetDays: number
  gstRate: number
  currency: string
  locale: string
  /**
   * What a day costs once the pack has run out. 05.6 is the only screen that
   * reads it, and it is what makes "charged since it ended" a figure that
   * grows with the days rather than one typed onto a card.
   */
  standardRoamingPerDay: number
  maxTripDays: number
  defaultDepartOffsetDays: number
  defaultTripDays: number
}

/* -------------------------------------------------------------- validation */

export interface ValidationError {
  field: 'destinations' | 'range' | 'pack' | 'terms'
  message: string
}

export interface TripValidation {
  canViewPacks: boolean
  canContinue: boolean
  errors: ValidationError[]
}

/* ------------------------------------------------------------ derived views */

export interface Totals {
  subtotal: number
  gst: number
  total: number
}

export interface PackRecommendation {
  pack: Pack
  reason: string
  /** Which template produced `reason`, for styling the row. */
  reasonKey: keyof ReasonTemplates
}

export interface PackScore {
  pack: Pack
  score: number
  reasonKey: keyof ReasonTemplates
}
