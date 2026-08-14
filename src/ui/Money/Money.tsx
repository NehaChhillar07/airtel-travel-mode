import clsx from 'clsx'
import { animate, useMotionValue, useReducedMotion, useTransform, motion } from 'motion/react'
import { useEffect } from 'react'
import { inr } from '../../lib/format'

interface MoneyProps {
  value: number
  /** Count up from the previous value when it changes. */
  animateChange?: boolean
  delay?: number
  className?: string
  'aria-live'?: 'off' | 'polite' | 'assertive'
}

/**
 * A rupee figure that counts to its value.
 *
 * Fifteen lines rather than a dependency. Two details that matter: the spring
 * starts from the *previous* value, not from zero, so adding a charge to the
 * dashboard ledger reads as an increment rather than a reset; and the digits
 * are tabular, so the number does not jitter horizontally while it runs.
 */
export function Money({
  value,
  animateChange = true,
  delay = 0,
  className,
  'aria-live': ariaLive,
}: MoneyProps) {
  const reduced = useReducedMotion()
  const mv = useMotionValue(animateChange && !reduced ? 0 : value)
  const text = useTransform(mv, (v) => inr(v))

  useEffect(() => {
    if (!animateChange || reduced) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, {
      duration: 0.7,
      delay,
      ease: [0.2, 0, 0, 1],
    })
    return () => controls.stop()
  }, [value, animateChange, reduced, delay, mv])

  return (
    <>
      <motion.span className={clsx('t-nums', className)} aria-hidden="true">
        {text}
      </motion.span>
      {/* The animated span reads as a stream of changing numbers to a screen
          reader, so the real value is announced separately. */}
      <span className="sr-only" aria-live={ariaLive}>
        {inr(value)}
      </span>
    </>
  )
}
