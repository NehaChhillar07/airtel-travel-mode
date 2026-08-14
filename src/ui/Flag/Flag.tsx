import clsx from 'clsx'
import type { Country } from '../../lib/types'
import s from './Flag.module.css'

interface FlagProps {
  country: Country
  /** Box size in px. Figma draws these at 23. */
  size?: number
  className?: string
}

/**
 * A country flag.
 *
 * Four flags were baked to PNG from Apple's glyphs (SG, MY, AE, TH) because
 * the Figma export renders emoji as images. Everything else falls back to the
 * unicode regional-indicator pair, which the system font draws. The fallback
 * is not a compromise — it is what makes adding a 27th country a one-line
 * change to countries.json instead of a trip through tools/bake_emoji.mjs.
 */
export function Flag({ country, size = 23, className }: FlagProps) {
  if (country.flagAsset) {
    return (
      <img
        className={clsx(s.png, className)}
        src={country.flagAsset}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        draggable={false}
      />
    )
  }
  return (
    <span
      className={clsx(s.emoji, className)}
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size * 1.22 }}
    >
      {country.flagEmoji}
    </span>
  )
}
