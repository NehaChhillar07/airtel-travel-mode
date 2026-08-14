/**
 * The animated hero fill, in one place.
 *
 * The Figma hero is an animated GIF, and Figma's REST API serves only a still
 * poster frame for animated fills — so the export freezes it and the original
 * file is copied verbatim into public/assets. Verbatim also meant 1.66 MB, on
 * the screen the departure sequence lands on: over mobile data the curtain
 * would finish and the hero would still be arriving.
 *
 * The same 65 frames as an animated WebP are 338 kB — a fifth of the size, and
 * the `<picture>` means a browser downloads one or the other, never both. The
 * GIF stays as the fallback because it is the source of record.
 */
interface HeroArtProps {
  className?: string
  /**
   * Whether this instance is the first thing on the screen. The hero on the
   * trip screen is; the band behind an already-planned trip is further down.
   */
  eager?: boolean
}

const BASE = '/assets/51541206a421a5cfc0537e0eb2d76dd5c2ba0cae'

export function HeroArt({ className, eager }: HeroArtProps) {
  return (
    <picture>
      <source srcSet={`${BASE}.webp`} type="image/webp" />
      <img
        className={className}
        src={`${BASE}.gif`}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
    </picture>
  )
}
