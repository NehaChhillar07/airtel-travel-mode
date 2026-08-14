import { useEffect, useState } from 'react'

/**
 * How the prototype presents itself.
 *
 * `framed` — the presenter. A 393x852 canvas scaled into a bezel on a dark
 * stage, with an index rail beside it. This is the desktop review experience
 * and it is what the whole thing was built for.
 *
 * `bleed` — the product. On a real phone the bezel is not just redundant, it
 * costs a third of the screen: a 393x852 canvas scaled to fit inside a 393x852
 * device renders at 87%, and at 66% on an SE. So below the breakpoint the
 * presenter is dropped entirely and the screens fill the viewport, which is
 * both more usable and a better demo — the prototype stops being a picture of
 * an app and becomes one.
 *
 * `rotate` — landscape on a short viewport. A portrait design at 852x393 has
 * nowhere to go, and shrinking it to fit is worse than asking.
 */
export type ViewportMode = 'framed' | 'bleed' | 'rotate'

/** Below this the presenter shell is dropped. */
export const BLEED_MAX = 600

/** Below this the index is an overlay drawer rather than a column. */
export const COMPACT = 1000

/** Under this height there is no useful room for a portrait phone screen. */
const MIN_USABLE_HEIGHT = 520

export interface Viewport {
  mode: ViewportMode
  /** The index is a drawer, not a column. True for both bleed and small desktop. */
  compact: boolean
}

function read(): Viewport {
  if (typeof window === 'undefined') return { mode: 'framed', compact: false }
  const w = window.innerWidth
  const h = window.innerHeight
  const landscape = w > h

  if (landscape && h < MIN_USABLE_HEIGHT) return { mode: 'rotate', compact: true }
  if (w < BLEED_MAX) return { mode: 'bleed', compact: true }
  return { mode: 'framed', compact: w < COMPACT }
}

export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>(read)

  useEffect(() => {
    const measure = () => {
      const next = read()
      // Only re-render when something actually changed — resize fires
      // continuously on a drag and on every mobile scroll that moves the
      // address bar.
      setVp((prev) =>
        prev.mode === next.mode && prev.compact === next.compact ? prev : next,
      )
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [])

  return vp
}
