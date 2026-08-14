import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useLayoutEffect, useRef } from 'react'
import {
  REVEAL_MS,
  instantTransition,
  jumpTransition,
  navSpring,
  revealTransition,
  screenVariants,
  swapTransition,
} from '../motion/nav'
import { useUiStore } from '../state/uiStore'
import { SCREENS } from '../screens'
import { GhostOverlay } from './GhostOverlay'
import { Toaster } from '../ui/Notification/Notification'

/**
 * Swaps one screen for another.
 *
 * The transition model is unchanged from the original shell — forward pushes,
 * back pops, and picking a screen from the index cross-fades because there is
 * no spatial relationship to travel along. That file (src/motion/nav.ts) is
 * the best-designed thing in the repo and none of it needed rewriting.
 */
export function ScreenHost() {
  const route = useUiStore((s) => s.route)
  const direction = useUiStore((s) => s.direction)
  const motionRun = useUiStore((s) => s.motionRun)
  const revealFrom = useUiStore((s) => s.revealFrom)
  const reduced = useReducedMotion()
  const Screen = SCREENS[route]

  /*
    THE CIRCULAR REVEAL.

    One radius drives everything: the clip-path that uncovers the incoming
    screen, and the glowing ring that rides its edge. They are derived from a
    single motion value rather than animated separately, because the version
    this replaces failed precisely by letting three clocks disagree — a pane
    expanding, a cross-fade underneath it and an uncover on top, each arriving
    at its own moment. What you saw was both screens double-exposed at 50%,
    then a white hole punched in a finished screen. Two things that must stay
    in lockstep cannot be two animations.

    The incoming screen is opaque and in place from the first frame; only the
    clip moves. So there is never a moment where two screens are both partly
    visible in the same pixel, which is what makes a double exposure
    structurally impossible rather than merely tuned away.
  */
  const stageRef = useRef<HTMLDivElement>(null)
  const radius = useMotionValue(0)

  useLayoutEffect(() => {
    if (!revealFrom) return
    const el = stageRef.current
    if (!el) return
    const w = el.clientWidth
    const h = el.clientHeight
    // Far enough to clear the furthest corner from wherever it started.
    const far = Math.max(
      Math.hypot(revealFrom.x, revealFrom.y),
      Math.hypot(w - revealFrom.x, revealFrom.y),
      Math.hypot(revealFrom.x, h - revealFrom.y),
      Math.hypot(w - revealFrom.x, h - revealFrom.y),
    )
    radius.set(0)
    const controls = animate(radius, far, {
      duration: reduced ? 0.001 : REVEAL_MS / 1000,
      ease: [0.32, 0, 0.24, 1],
    })
    return () => controls.stop()
    // `route` is in the deps because the same origin can be reused: tapping
    // Travel twice must replay the sweep, not sit at its finished radius.
  }, [revealFrom, route, radius, reduced])

  const revealing = !!revealFrom
  const clipPath = useTransform(radius, (r) =>
    revealFrom ? `circle(${r}px at ${revealFrom.x}px ${revealFrom.y}px)` : 'none',
  )
  const ringSize = useTransform(radius, (r) => r * 2)
  const ringOffsetX = useTransform(radius, (r) => (revealFrom?.x ?? 0) - r)
  const ringOffsetY = useTransform(radius, (r) => (revealFrom?.y ?? 0) - r)

  /*
    The first layer must not slide in — a page load should present its screen,
    not animate one on. It suppresses its OWN entrance by starting at `center`.

    What it must not do is say `initial={false}` on the AnimatePresence, which
    is how this was written before. That flag is not local: AnimatePresence
    publishes it on PresenceContext and every descendant motion component reads
    it, so a prop meant to stop one wrapper sliding was silently cancelling the
    mount animation of everything inside it. The result was that a set piece
    like 04.7 played when you navigated to it and never played on a reload —
    exactly when a reviewer is most likely to be looking.
  */
  const first = useRef(true)
  useEffect(() => {
    first.current = false
  }, [])

  return (
    <div className="screenstack__stage" ref={stageRef}>
      <AnimatePresence custom={direction} mode="sync">
        <motion.div
          key={route}
          className="screenstack__layer"
          custom={direction}
          variants={screenVariants}
          initial={first.current ? 'center' : 'enter'}
          animate="center"
          exit="exit"
          style={direction === 'reveal' && revealing ? { clipPath } : undefined}
          transition={
            direction === 'instant'
              ? instantTransition
              : direction === 'reveal'
                ? revealTransition
                : direction === 'swap'
                  ? swapTransition
                  : direction === 'jump'
                    ? jumpTransition
                    : navSpring
          }
        >
          {/* Remounting on `motionRun` is what the Replay button drives: every
              sequence in the screen is a mount animation, so a fresh mount is
              a faithful replay rather than a re-triggered approximation. */}
          <Screen key={motionRun} />
        </motion.div>
      </AnimatePresence>

      {/*
        The edge of the reveal, and the same glowing hairline the full
        departure sequence ends on — that is what makes the short version read
        as the long one's little brother rather than a different animation.
        Above both layers, and inert.
      */}
      {direction === 'reveal' && revealing && !reduced && (
        <motion.span
          className="screenstack__revealRing"
          style={{ width: ringSize, height: ringSize, left: ringOffsetX, top: ringOffsetY }}
          aria-hidden="true"
        />
      )}

      <GhostOverlay />
      <Toaster />
    </div>
  )
}
