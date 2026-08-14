import clsx from 'clsx'
import { MessageSquare, PhoneCall } from 'lucide-react'
import { motion } from 'motion/react'
import { inr } from '../../../lib/format'
import { listItem, staggerList } from '../../../motion/presets'
import s from './UsageChips.module.css'

interface UsageChipsProps {
  /** Null where the pack has no such allowance, not zero. */
  minsLeft: number | null
  smsLeft: number | null
  /** Roaming the pack did not cover. */
  extraSpend: number
}

const chips = staggerList(0.06)

/**
 * `Frame 1321322868` — what is left, as chips.
 *
 * Wraps where it wraps. The numbers are derived, so how many fit on a row
 * changes with the trip; pinning a row count would only ever be right for one
 * of them.
 */
export function UsageChips({ minsLeft, smsLeft, extraSpend }: UsageChipsProps) {
  return (
    <motion.div className={s.chips} variants={chips}>
      {minsLeft !== null && (
        <motion.span className={clsx(s.chip, 't-caption-12-semi')} variants={listItem}>
          <PhoneCall size={16} strokeWidth={1.5} aria-hidden="true" />
          {/* The frame writes "(resets midnight)" here, but the pack's minutes
              are for the whole trip — see the note on the dashboard's minutes
              meter. A widget that contradicts the screen it links to is worse
              than one that does not match the frame. */}
          {minsLeft}m left
        </motion.span>
      )}
      {smsLeft !== null && (
        <motion.span className={clsx(s.chip, 't-caption-12-semi')} variants={listItem}>
          <MessageSquare size={16} strokeWidth={1.5} aria-hidden="true" />
          {smsLeft} SMS left
        </motion.span>
      )}
      {/* Only when there is something to confess. */}
      {extraSpend > 0 && (
        <motion.span
          className={clsx(s.chip, s.chipAlert, 't-caption-12-semi')}
          variants={listItem}
        >
          <img className={s.emoji} src="/assets/emoji/money-wings.png" alt="" />
          {inr(extraSpend)} extra spent
        </motion.span>
      )}
    </motion.div>
  )
}
