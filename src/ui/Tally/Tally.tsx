import clsx from 'clsx'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect } from 'react'

interface TallyProps {
  value: number
  /**
   * Where the count starts on first render. A meter that drains counts DOWN
   * from its full allowance, so the number and the bar beside it are telling
   * the same story — starting at zero and climbing to "45 left" would say the
   * opposite of what the bar is doing.
   */
  from?: number
  /** Decimal places. 1 for GB, 0 for minutes and texts. */
  places?: number
  delay?: number
  className?: string
  'aria-live'?: 'off' | 'polite' | 'assertive'
}

/**
 * A plain figure that counts to its value.
 *
 * [Money](../Money/Money.tsx) does this for rupees; this is the same fifteen
 * lines for the counts that are not money. Kept separate rather than
 * generalised behind a formatter prop, because Money owns one more thing than
 * formatting — it always starts from the previous value, so a new charge reads
 * as an increment. A meter needs to start from full instead.
 *
 * On any change after the first, both count from wherever the number already
 * was, so rewinding to an earlier day moves the figure rather than resetting.
 */
export function Tally({
  value,
  from,
  places = 0,
  delay = 0,
  className,
  'aria-live': ariaLive,
}: TallyProps) {
  const reduced = useReducedMotion()
  const mv = useMotionValue(reduced ? value : (from ?? value))
  const text = useTransform(mv, (v) => v.toFixed(places))

  useEffect(() => {
    if (reduced) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, {
      duration: 0.7,
      delay,
      ease: [0.2, 0, 0, 1],
    })
    return () => controls.stop()
  }, [value, reduced, delay, mv])

  return (
    <>
      <motion.span className={clsx('t-nums', className)} aria-hidden="true">
        {text}
      </motion.span>
      {/* The animated span reads as a stream of changing numbers to a screen
          reader, so the real value is announced separately. */}
      <span className="sr-only" aria-live={ariaLive}>
        {value.toFixed(places)}
      </span>
    </>
  )
}
