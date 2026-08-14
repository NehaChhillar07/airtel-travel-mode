import clsx from 'clsx'
import { Plane } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import type { Country } from '../../lib/types'
import { ease, spring } from '../../motion/presets'
import { Flag } from '../../ui/Flag/Flag'
import s from './RouteLeg.module.css'

/**
 * The arc, in the frame's own 393x126 coordinates.
 *
 * One string, used twice: the SVG draws it and the badge travels it through
 * `offset-path`. Keeping the line and the thing moving along it on the same
 * numbers is the whole reason the badge can no longer drift off the curve —
 * before this it was a separately-positioned disc that happened to land near
 * the end of a separately-positioned SVG.
 */
const ARC = 'M68 69 C 136 36, 242 36, 310 62'

/** Where the question mark gives up. Just past the top of the curve. */
const STALL = 48

interface RouteLegProps {
  country: Country | null
  /**
   * Registered on a network there. Connected flies the plane the length of the
   * arc and lands it; not connected stalls a question mark partway and leaves
   * it waiting — the arrival has happened, the connection has not.
   */
  connected: boolean
}

/** `Frame 1321322873` — Delhi to the destination, on 05.2 and 05.3 alike. */
export function RouteLeg({ country, connected }: RouteLegProps) {
  const reduced = useReducedMotion()

  /*
    Reduced motion draws the finished picture: everything at its resting
    position, no travel and no loop. `false` as an initial tells motion to
    start from whatever the styles already say.
  */
  const still = Boolean(reduced)

  return (
    <div className={s.route} aria-hidden="true">
      {/*
        A clip wipe rather than an animated `pathLength`. The stroke is already
        spending its `stroke-dasharray` on being dashed, and animating
        pathLength would take that over and march the dashes instead of
        extending the line. X rises monotonically along this curve, so a
        left-to-right wipe reads exactly as the line drawing itself.
      */}
      <motion.svg
        className={s.arc}
        viewBox="0 0 393 126"
        fill="none"
        initial={still ? false : { clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 -2% 0 0)' }}
        transition={still ? { duration: 0 } : { duration: 0.5, delay: 0.12, ease: ease.out }}
      >
        <path className={s.arcPath} d={ARC} />
      </motion.svg>

      <motion.span
        className={clsx(s.from, 't-body-14')}
        initial={still ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={still ? { duration: 0 } : { duration: 0.3, ease: ease.out }}
      >
        delhi
      </motion.span>

      <motion.span
        className={clsx(s.to, 't-body-14-med')}
        initial={still ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          still ? { duration: 0 } : { duration: 0.3, delay: connected ? 0.7 : 0.3, ease: ease.out }
        }
      >
        {country?.name ?? 'Singapore'}
      </motion.span>

      <motion.span
        className={clsx(s.home, !connected && s.homeOff)}
        initial={still ? false : { scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={still ? { duration: 0 } : spring.bouncy}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3.2 3.4 10.1V21h6v-6.4h5.2V21h6V10.1z" />
        </svg>
      </motion.span>

      {country && (
        /* The flag pops as the plane reaches it, and does not pop at all when
           nothing arrives. */
        <motion.span
          className={s.flagWrap}
          initial={still || !connected ? false : { scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={still || !connected ? { duration: 0 } : { ...spring.bouncy, delay: 1 }}
        >
          <Flag
            className={clsx(s.flag, !connected && s.flagOff)}
            country={country}
            size={connected ? 60 : 52}
          />
        </motion.span>
      )}

      {/*
        The badge rides the arc. `offsetDistance` is the only thing animating —
        the disc itself stays upright (`offset-rotate: 0deg` in the CSS), so it
        is the glyph inside that gets to tilt.
      */}
      <motion.span
        className={clsx(s.badge, !connected && s.badgeStalled)}
        style={{ offsetPath: `path("${ARC}")` }}
        initial={still ? false : { offsetDistance: '0%' }}
        animate={{ offsetDistance: connected ? '100%' : `${STALL}%` }}
        transition={
          still
            ? { duration: 0 }
            : connected
              ? { duration: 0.9, delay: 0.2, ease: ease.out }
              : /* Overshoots and settles back: it tried to go further. */
                { duration: 0.7, delay: 0.2, type: 'spring', stiffness: 90, damping: 11 }
        }
      >
        {connected ? (
          /* Nose down through the descent, level on the ground. */
          <motion.span
            className={s.badgeGlyph}
            initial={still ? false : { rotate: 12 }}
            animate={{ rotate: 0 }}
            transition={still ? { duration: 0 } : { duration: 0.9, delay: 0.2, ease: ease.out }}
          >
            <Plane size={13} strokeWidth={2.2} />
          </motion.span>
        ) : (
          /*
            And then it keeps trying. This loop is the difference between the
            two screens: connected arrives and goes still, not-connected never
            resolves. `t-inverse` on the mark because the type class carries
            its own colour, which would otherwise print it near-black on a
            near-black disc.
          */
          <motion.span
            className={clsx(s.badgeGlyph, 't-bodystrong-14', 't-inverse')}
            animate={still ? {} : { scale: [1, 1.09, 1], y: [0, -1, 0] }}
            transition={
              still
                ? { duration: 0 }
                : { duration: 2, delay: 1, repeat: Infinity, ease: ease.inOut }
            }
          >
            ?
          </motion.span>
        )}
      </motion.span>
    </div>
  )
}
