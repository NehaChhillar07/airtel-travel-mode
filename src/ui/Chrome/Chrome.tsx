import clsx from 'clsx'
import { motion } from 'motion/react'
import {
  ChevronLeft,
  Landmark,
  Plane,
  Router,
  QrCode,
  Search,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { spring } from '../../motion/presets'
import s from './Chrome.module.css'

/* --------------------------------------------------------------- StatusBar */

interface StatusBarProps {
  time?: string
  battery?: number
  /** White glyphs, for the lock screen over a photo. */
  dark?: boolean
  /** The lock screen shows the carrier here instead of the clock. */
  carrier?: string
}

/**
 * iOS status bar.
 *
 * The battery is a solid dark pill with the percentage inside it, which is how
 * the file draws it — not the usual outlined cell.
 *
 * SOURCE_ISSUES §1.5 found 05.13 missing its status bar entirely ("its top 54px
 * is bare wallpaper"). Making it a component means a screen cannot forget it.
 */
export function StatusBar({ time = '6:20', battery = 90, dark, carrier }: StatusBarProps) {
  return (
    /* `data-chrome` is how the full-bleed shell finds this when the prototype
       is installed to a home screen and the device draws its own status bar —
       see the standalone block in app.css. */
    <div className={clsx(s.status, dark && s.statusDark)} data-chrome="status">
      <span className={clsx('t-bodystrong-14', 't-nums', !dark && 't-heading')}>
        {carrier ?? time}
      </span>
      <div className={s.statusIcons} aria-hidden="true">
        <SignalGlyph />
        <WifiGlyph />
        <span className={clsx(s.batteryPill, 't-caption-12', 't-inverse')}>{battery}</span>
      </div>
    </div>
  )
}

function SignalGlyph() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden="true">
      <rect x="0" y="8.5" width="3" height="3.5" rx="1" />
      <rect x="4.6" y="6" width="3" height="6" rx="1" />
      <rect x="9.2" y="3.2" width="3" height="8.8" rx="1" />
      <rect x="13.8" y="0" width="3" height="12" rx="1" fill="var(--border-subtle)" />
    </svg>
  )
}

function WifiGlyph() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
      <path
        d="M1 4.2a10.5 10.5 0 0 1 14 0M3.6 7a6.8 6.8 0 0 1 8.8 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="8" cy="10.2" r="1.4" fill="currentColor" />
    </svg>
  )
}

/* ------------------------------------------------------------------ NavBar */

interface NavBarProps {
  title: string
  onBack?: () => void
  trailing?: ReactNode
}

/** The in-flow screen title. `label/12`, uppercase — as the file draws it. */
export function NavBar({ title, onBack, trailing }: NavBarProps) {
  return (
    <div className={s.nav}>
      {onBack && (
        <button className={s.navBack} onClick={onBack} aria-label="Back">
          <ChevronLeft size={20} strokeWidth={1.67} aria-hidden="true" />
        </button>
      )}
      <span className={clsx(s.navTitle, 't-label-12')}>{title}</span>
      {trailing && <span className={s.navTrailing}>{trailing}</span>}
    </div>
  )
}

/* --------------------------------------------------------------- AppHeader */

/**
 * The app bar: hamburger on the left, search and the Scan QR pill on the right.
 * There is no wordmark here — the file does not put one on these screens.
 */
export function AppHeader({ onScan }: { onScan?: () => void }) {
  return (
    <div className={s.header}>
      <button className={s.menuBtn} aria-label="Menu">
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden="true">
          <path
            d="M1 1.5h20M1 7h14M1 12.5h9"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <div className={s.headerActions}>
        <button className={s.iconBtn} aria-label="Search">
          <Search size={24} strokeWidth={2} aria-hidden="true" />
        </button>
        <button className={clsx(s.scanQr, 't-caption-12-semi', 't-heading', 'pressable')} onClick={onScan}>
          Scan QR
          <QrCode size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- TileRow */

/**
 * A house. The file's glyph is a solid silhouette with a door cut out of it,
 * which a stroked lucide `House` does not read as and a filled one turns into
 * a blob — the door disappears. Hand-drawn so the cutout survives.
 */
function HomeGlyph({ size = 28, ...rest }: { size?: number } & Record<string, unknown>) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...rest}>
      <path
        // `evenodd` is what punches the door out of the silhouette.
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11.24 2.4a1.2 1.2 0 0 1 1.52 0l8.4 6.9c.3.25.42.66.3 1.02a.95.95 0 0 1-.9.65H20v9.28c0 .8-.62 1.45-1.4 1.45h-4.05v-5.4c0-1.1-.87-2-1.95-2h-1.2c-1.08 0-1.95.9-1.95 2v5.4H5.4c-.78 0-1.4-.65-1.4-1.45V10.97h-.56a.95.95 0 0 1-.9-.65.99.99 0 0 1 .3-1.02l8.4-6.9Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * A SIM card. lucide has no SIM glyph and `CreditCard` reads as a payment card,
 * which is the wrong service entirely on a row that also contains Bank.
 */
function SimCard({ size = 28, ...rest }: { size?: number } & Record<string, unknown>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      <path d="M5 4.5h8.2L19 10.3V19a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 19V6a1.5 1.5 0 0 1 1-1.5Z" />
      <rect x="8" y="12" width="8" height="6" rx="1.2" />
      <path d="M11.4 12v6M8 15h8" />
    </svg>
  )
}

const TILE_ICONS: Record<string, typeof Plane> = {
  grid: HomeGlyph as unknown as typeof Plane,
  plane: Plane,
  wifi: Router,
  sim: SimCard as unknown as typeof Plane,
  bank: Landmark,
}

export interface TileItem {
  id: string
  label: string
  icon: string
  /** Route this tile opens, if it opens one. See `useQuickActionNav`. */
  opens?: string
}

interface TileRowProps {
  items: TileItem[]
  activeId?: string
  /**
   * Left off in the gallery, where the row is a specimen rather than a
   * navigation control and a click must not take you off the page.
   */
  onSelect?: (item: TileItem, el: HTMLElement) => void
  /**
   * The id of a tile whose glyph is currently in flight.
   *
   * The everyday Home -> Travel transition flies the plane out of this tile to
   * the middle of the screen and then off the right edge. The glyph itself is
   * inside sticky chrome and cannot go anywhere, so a copy does the travelling
   * and this hides for the duration — see patterns/TravelHop.
   */
  launchingId?: string | null
}

/**
 * The home quick-action tiles — the `Tile` COMPONENT_SET.
 *
 * The label was "Wi-Fi" on some screens and "Wifi" on others in the source file
 * (SOURCE_ISSUES §4). Having one component makes that impossible.
 */
export function TileRow({ items, activeId, onSelect, launchingId }: TileRowProps) {
  return (
    <div className={s.tiles} role="tablist" aria-label="Services">
      {/*
        The glyphs in the file are raster fills painted with
        `linear-gradient(180.37deg, #7E8897 -97.38%, #000000 99.68%)`. Those
        images were not part of the asset export, so these are lucide stand-ins
        carrying the same gradient.

        `gradientUnits="userSpaceOnUse"` is required, not decoration: the
        default resolves against each path's own bounding box, and a hairline
        column or contact strip has a zero-width box — those sub-paths vanish.
      */}
      <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient
            id="tile-glyph"
            gradientUnits="userSpaceOnUse"
            x1="0"
            y1="0"
            x2="0.18"
            y2="28"
          >
            <stop offset="0%" stopColor="#7E8897" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
        </defs>
      </svg>
      {items.map((item) => {
        const Icon = TILE_ICONS[item.icon] ?? HomeGlyph
        const active = item.id === activeId
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            className={clsx(s.tile, 'pressable')}
            data-state={active ? 'active' : 'default'}
            /* The tile you are already on is inert — Travel opens trip
               creation from Home, but must not restart it from the trip
               screens, where Travel is the active tile. */
            onClick={(e) => !active && onSelect?.(item, e.currentTarget)}
          >
            {/*
              Hidden outright while the glyph is in flight, not moved.

              The glyph cannot leave the sticky chrome it lives in, so the
              transition flies a copy instead and this one disappears in the
              same frame, in the same place. Instant, because a fade would show
              two planes at once — which is the one thing that would give the
              hand-off away.
            */}
            <span
              className={s.tileIcon}
              style={item.id === launchingId ? { opacity: 0 } : undefined}
            >
              <Icon
                size={28}
                strokeWidth={1.9}
                stroke="url(#tile-glyph)"
                color="url(#tile-glyph)"
                aria-hidden="true"
              />
            </span>
            <span className={s.tileLabelWrap}>
              <span
                className={clsx(
                  s.tileLabel,
                  active ? 't-caption-12-semi' : 't-caption-12',
                )}
              >
                {item.label}
              </span>
              {active && (
                <motion.span
                  className={s.tileRule}
                  layoutId="tile-rule"
                  transition={spring.snappy}
                />
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
