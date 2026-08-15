import type { Transition, Variants } from 'motion/react'

/**
 * Navigation motion.
 *
 * This is the app-feel layer — how screens replace each other and how a tap
 * answers back. It is deliberately separate from the four hero set pieces
 * (Travel Mode activation, usage progress, purchase confirmation, arrival),
 * which come later and have their own spec.
 *
 * The model is iOS navigation: forward is a push, back is a pop, and picking a
 * screen from the index is neither, so it cross-fades rather than pretending
 * there is a spatial relationship to travel along.
 */

export type NavDirection = 'push' | 'pop' | 'jump' | 'swap' | 'reveal' | 'instant'

/**
 * The incoming screen travels the full width; the outgoing one moves a third
 * as far and dims. That parallax is what reads as one surface sitting on top
 * of another, rather than two screens sliding past like a carousel.
 */
const PARALLAX = '-32%'

/** Whichever screen is on top during the transition. */
const ABOVE = 2
const BELOW = 1

export const navSpring: Transition = {
  type: 'spring',
  stiffness: 280,
  damping: 32,
  mass: 0.9,
  // Opacity has no momentum, so it gets a plain curve rather than a spring.
  opacity: { duration: 0.2, ease: [0.2, 0, 0, 1] },
}

export const jumpTransition: Transition = {
  duration: 0.24,
  ease: [0.2, 0, 0, 1],
}

/**
 * `swap` — a cross-fade with no scale at all.
 *
 * For the case where the two screens share their chrome. Home and the trip
 * screen have byte-identical status bars, headers and tile rows, so a `jump`'s
 * 0.985 -> 1 scale takes two identical headers and slides one through the
 * other: on video the tile row visibly bobs a few pixels mid-transition, which
 * is the sort of thing nobody can name and everybody feels.
 *
 * Shorter than a jump, not longer. It is always run underneath something that
 * is covering the seam, and whatever is covering cannot lift until the fade is
 * finished — so every millisecond here is a millisecond of the transition spent
 * looking at an opaque rectangle.
 */
export const swapTransition: Transition = {
  duration: 0.2,
  ease: [0.2, 0, 0, 1],
}

/**
 * How long a circular reveal takes, and the one clock everything in it obeys.
 *
 * The radius, the ring that rides its edge and the moment the outgoing screen
 * is allowed to unmount are all driven from this, because the failure mode of
 * the thing it replaces was three overlapping clocks disagreeing.
 *
 * 340 rather than 420: the reveal now opens from the middle of the screen
 * rather than from the Travel tile, so it only has to cover the half-diagonal
 * — about 420px on a 393x745 canvas instead of 575 from the tile — and the same
 * apparent speed takes less time.
 */
export const REVEAL_MS = 340

/** No animation at all — a tab switch simply shows the other tab. */
export const instantTransition: Transition = { duration: 0 }

export const revealTransition: Transition = {
  duration: REVEAL_MS / 1000,
  ease: [0.32, 0, 0.24, 1],
}

export const screenVariants: Variants = {
  enter: (dir: NavDirection) => {
    if (dir === 'push') return { x: '100%', opacity: 1, scale: 1, zIndex: ABOVE }
    if (dir === 'pop') return { x: PARALLAX, opacity: 0.55, scale: 1, zIndex: BELOW }
    if (dir === 'swap') return { x: 0, opacity: 0, scale: 1, zIndex: BELOW }
    /*
      A reveal animates NOTHING here. The incoming screen is fully opaque and
      in place from the first frame — what changes is the clip-path the screen
      host puts on it, so the screen is uncovered rather than faded in. A
      transition that also cross-faded would put both screens on top of each
      other at partial opacity, which is exactly the double-exposure this
      replaces.
    */
    if (dir === 'reveal') return { x: 0, opacity: 1, scale: 1, zIndex: ABOVE }
    /*
      The tile row is a tab bar, not a navigation stack.

      Switching tiles used to route through push/pop like everything else, and
      because the trip screen sits deeper than home, going back to All inferred
      a `pop` and slid the screen in from the left. Tabs have no spatial
      relationship to travel along — the row does not move, so nothing should.
    */
    if (dir === 'instant') return { x: 0, opacity: 1, scale: 1, zIndex: ABOVE }
    /*
      `jump` — opaque, on top, from the first frame.

      This used to be a true cross-fade: the incoming screen faded up from 0
      while the outgoing faded down. One click read fine. Clicking down the
      index did not, because `mode="sync"` starts a new fade without waiting
      for the last, and the fades are independent — five layers were live at
      once, an old screen sitting at 0.8 over the new one at 0.2. What you saw
      was the previous screen ghosted over the incoming until the pile drained.

      Tuning the durations would only have made the pile shallower. So the jump
      now works the way the reveal does, and for the same reason: the arriving
      screen is opaque and covers the stage from frame one, which makes a
      double exposure structurally impossible rather than merely brief. Stale
      layers can stack up all they like underneath — nothing can be seen
      through an opaque screen.

      The life comes from scale, and it scales DOWN from slightly over 100%.
      Coming up from 0.985 would have left a 3px rim of the old screen showing
      around the new one for the length of the transition; starting over-size
      means the incoming layer never uncovers an edge at any point.
    */
    return { x: 0, opacity: 1, scale: 1.006, zIndex: ABOVE }
  },
  center: (dir: NavDirection) => ({
    x: 0,
    opacity: 1,
    scale: 1,
    zIndex: dir === 'pop' ? BELOW : ABOVE,
  }),
  exit: (dir: NavDirection) => {
    if (dir === 'push') return { x: PARALLAX, opacity: 0.55, scale: 1, zIndex: BELOW }
    if (dir === 'pop') return { x: '100%', opacity: 1, scale: 1, zIndex: ABOVE }
    if (dir === 'swap') return { x: 0, opacity: 0, scale: 1, zIndex: ABOVE }
    /* The outgoing screen holds perfectly still underneath and is simply
       uncovered. Fading it would show the incoming screen through it. */
    if (dir === 'reveal') return { x: 0, opacity: 1, scale: 1, zIndex: BELOW }
    /*
      Opacity 0 rather than 1, even though the duration is zero and nobody can
      see either value. An exit variant identical to `center` gives motion
      nothing to animate, so AnimatePresence never receives a completion and
      falls back to a timeout — the outgoing screen stayed mounted underneath
      for half a second after the tab had changed. One real property change,
      instantly applied, lets it unmount on the next frame.
    */
    if (dir === 'instant')
      /*
        The transition lives on the VARIANT, not on the element.

        AnimatePresence keeps the outgoing layer as it was, so it exits with
        whatever `transition` prop it was created with — the departure
        sequence's, or a push's spring — regardless of how it is leaving now.
        The result was a stale screen fading underneath the new one for half a
        second after an instant tab switch. A variant carries its own
        transition, and that one wins.
      */
      return { x: 0, opacity: 0, scale: 1, zIndex: BELOW, transition: { duration: 0 } }
    /*
      `jump` — gone on the next frame, for the same reasons as `instant`.

      Nothing here is watchable: the incoming screen is opaque and above this
      one, so whatever this layer does it does out of sight. What matters is
      that it stops existing promptly. It used to fade over 240ms and inherit
      its transition from whatever the layer was created with — a spring, if it
      had arrived by a push — so a stale screen could sit mounted for half a
      second past the point anyone could see it, and eight of them could be
      mounted at once. The transition is declared on the variant so it cannot
      be inherited, and the opacity change is what tells AnimatePresence it is
      finished.
    */
    return { x: 0, opacity: 0, scale: 1, zIndex: BELOW, transition: { duration: 0 } }
  },
}
