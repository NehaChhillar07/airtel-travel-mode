import clsx from 'clsx'
import { motion, useReducedMotion } from 'motion/react'
import { ease, spring } from '../../../motion/presets'
import s from './TripRail.module.css'

/**
 * The four moments the expanded Live Activity plots you against.
 *
 * Not one cell per day, the way the dashboard's strip does it: a widget is read
 * at a glance off a locked phone, and "where am I in this trip" is the only
 * question it has to answer.
 */
export const RAIL_STEPS = ['Landed', 'Today', 'Last day', 'Home'] as const

/*
  Geometry in px, not percentages.

  The frame is a fixed 393, so the rail inside the card is a known 323 wide —
  the number the Figma frame itself carries. The plane and the green fill have
  to stop dead on a dot centre, and a percentage of a box that also contains a
  15px dot does not land there. Figma draws the travelled segment at 109px for
  a trip on step 1; `stopX(1)` comes out at 110.2, which is the same line.
*/
const RAIL_W = 323
const DOT = 15
const SPAN = RAIL_W - DOT
const LAST = RAIL_STEPS.length - 1

function stopX(i: number) {
  return DOT / 2 + (i * SPAN) / LAST
}

/**
 * The trip as a route with stops on it.
 *
 * The pattern is the delivery-tracker every Indian app has taught people to
 * read — Swiggy's rider crawling along the route, Blinkit's order moving from
 * packed to arrived. The plane is that rider: the line behind it is done, the
 * line ahead is not, and it drives to where you are when the widget opens.
 */
export function TripRail({ stepIndex }: { stepIndex: number }) {
  const still = useReducedMotion()
  const x = stopX(stepIndex)

  /* One tap of the widget should not replay a 0.8s crawl, so the travel is
     tied to the mount and the arrival is what everything else waits for. */
  const travel = still
    ? { duration: 0 }
    : { duration: 0.8, ease: ease.out, delay: 0.18 }

  return (
    <div className={s.rail}>
      <div className={s.track} aria-hidden="true">
        <span className={s.line} />
        <motion.span
          className={s.lineDone}
          initial={{ width: DOT / 2 }}
          animate={{ width: x }}
          transition={travel}
        />

        {RAIL_STEPS.map((label, i) => (
          <motion.span
            key={label}
            className={s.dot}
            data-state={i < stepIndex ? 'done' : i === stepIndex ? 'now' : 'ahead'}
            style={{ left: stopX(i) - DOT / 2 }}
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ ...spring.bouncy, delay: still ? 0 : 0.18 + i * 0.09 }}
          />
        ))}

        {/* The dot you are on keeps breathing. It is the only thing on the
            widget that says the trip is still running rather than recorded. */}
        {!still && (
          <motion.span
            className={s.pulse}
            style={{ left: x - DOT / 2 }}
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: [1, 2.1], opacity: [0.55, 0] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: ease.out, delay: 1 }}
          />
        )}

        {/* The mirror lives on the img and the travel on the wrapper: motion
            owns `transform` on whatever it animates, so a CSS scaleX on the
            same element would be overwritten by the translate. */}
        <motion.span
          className={s.planeWrap}
          initial={{ x: stopX(0), opacity: 0 }}
          animate={{ x, opacity: 1 }}
          transition={{ ...travel, opacity: { duration: 0.2 } }}
        >
          <img
            className={s.plane}
            src="/assets/3e8278c3fbfc59526de63bff0bbddf3ead6744b5.png"
            alt=""
          />
        </motion.span>
      </div>

      <ol className={s.labels}>
        {RAIL_STEPS.map((label, i) => (
          <li
            key={label}
            className={clsx(
              s.label,
              i === stepIndex ? 't-caption-12-semi' : 't-caption-12',
              i > stepIndex && s.labelAhead,
            )}
            /* Pinned to its dot rather than spaced evenly: the first and last
               align to the ends of the line, the middle two to their centres. */
            style={
              i === 0
                ? { left: 0 }
                : i === LAST
                  ? { right: 0 }
                  : { left: stopX(i), transform: 'translateX(-50%)' }
            }
            aria-current={i === stepIndex ? 'step' : undefined}
          >
            {label}
          </li>
        ))}
      </ol>
    </div>
  )
}
