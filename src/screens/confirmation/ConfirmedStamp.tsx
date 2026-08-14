import clsx from 'clsx'
import { motion, useReducedMotion } from 'motion/react'
import { ease, spring } from '../../motion/presets'
import s from './Confirmation.module.css'

/**
 * The CONFIRMED stamp on 04.7.
 *
 * A stamp is the right metaphor here and a tick alone is not. Stamps mean
 * *recorded* — a visa in a passport, a boarding pass, a booking reference. The
 * thing that made this screen read as a payment receipt was never the stamping,
 * it was the ring blooming out of a bare green tick. So the rules this obeys:
 *
 *   - the word is CONFIRMED. Never PAID, SUCCESS or DONE.
 *   - no ring, no ripple, no pulse, and nothing loops.
 *   - no tick inside the pill. There is already one in the mark beside it, and
 *     two ticks is receipt language again.
 *
 * The landing is real stamp physics: it arrives large, from above the surface,
 * and `spring.stamp` is underdamped enough that the settle undershoots past 1
 * on its way to rest — that undershoot is the press. It rotates as it lands
 * too, -16° to -7°, because a pill that is already at its final angle and only
 * scales down reads as a badge fading in, not as something making contact.
 *
 * Uphill (-7°) rather than downhill: a clockwise tilt reads as deflating.
 */
export function ConfirmedStamp({
  label,
  at,
  sheenAt,
}: {
  label: string
  /** When it lands, in seconds from screen mount. */
  at: number
  /** When the single light pass crosses it. */
  sheenAt: number
}) {
  const reduced = useReducedMotion()

  return (
    <motion.span
      className={s.stamp}
      initial={reduced ? false : { scale: 1.55, rotate: -16, opacity: 0 }}
      animate={{ scale: 1, rotate: -7, opacity: 1 }}
      transition={{
        ...spring.stamp,
        delay: at,
        opacity: { duration: 0.12, delay: at },
      }}
    >
      <span className={clsx(s.stampLabel, 't-label-12')}>{label}</span>

      {/* One diagonal pass, once, after it has settled. A loop would turn a
          moment of arrival into an ambient shimmer. */}
      {!reduced && (
        <motion.span
          className={s.stampSheen}
          initial={{ x: '-130%' }}
          animate={{ x: '230%' }}
          transition={{ duration: 0.62, delay: sheenAt, ease: ease.inOut }}
          aria-hidden="true"
        />
      )}
    </motion.span>
  )
}
