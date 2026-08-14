import clsx from 'clsx'
import { Check, ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { contentsLine, inr, validityLabel } from '../../lib/format'
import type { Pack } from '../../lib/types'
import { collapse, dur, ease, spring } from '../../motion/presets'
import { Badge } from '../primitives'
import s from './PackCard.module.css'

interface PackCardProps {
  pack: Pack
  selected?: boolean
  recommended?: boolean
  expanded?: boolean
  reason?: string
  onSelect?: (id: string) => void
  onToggleExpand?: (id: string) => void
  /** Read-only summary, e.g. on the review screen. */
  static_?: boolean
  /** Drops the card's own fill and ring, for nesting inside another panel. */
  bare?: boolean
}

export function PackCard({
  pack,
  selected,
  recommended,
  expanded,
  reason,
  onSelect,
  onToggleExpand,
  static_,
  bare,
}: PackCardProps) {
  return (
    <div
      className={clsx(s.card, bare && s.bare)}
      data-state={selected ? 'selected' : 'default'}
      data-pack={pack.id}
    >
      {recommended && !static_ && <span className={s.sheen} aria-hidden="true" />}

      {recommended && (
        <span className={s.badge}>
          <Badge tone="brand">Recommended</Badge>
        </span>
      )}

      {/*
        The whole card is the select target. The chevron is a separate button
        inside it, so expanding to read the detail does not also commit you to
        buying — two intents that the source screen collapsed into one tap.
      */}
      <motion.button
        type="button"
        className={s.inner}
        style={{ width: '100%' }}
        disabled={static_}
        aria-pressed={static_ ? undefined : selected}
        onClick={() => !static_ && onSelect?.(pack.id)}
        whileTap={static_ ? undefined : { scale: 0.985 }}
        transition={spring.snappy}
      >
        <div className={s.head}>
          <div>
            <div className={s.priceRow}>
              <span className="t-title-24">{inr(pack.priceExGst)}</span>
              <span className={clsx(s.excl, 't-caption-12', 't-secondary')}>excl GST</span>
              <span className="t-value-16-med">{validityLabel(pack)}</span>
            </div>
            <span className={clsx(s.contents, 't-body-14', 't-secondary')}>
              {contentsLine(pack)}
            </span>
          </div>

          {onToggleExpand && (
            <motion.span
              className={s.chevron}
              role="button"
              tabIndex={0}
              aria-label={expanded ? 'Hide details' : 'Show details'}
              aria-expanded={expanded}
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: dur.base, ease: ease.out }}
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand(pack.id)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  e.stopPropagation()
                  onToggleExpand(pack.id)
                }
              }}
            >
              <ChevronDown size={20} strokeWidth={2} aria-hidden="true" />
            </motion.span>
          )}
        </div>

        {reason && (
          <div className={s.reason}>
            <Check className={s.reasonIcon} size={16} strokeWidth={2.5} aria-hidden="true" />
            <span className="t-body-14 t-secondary">{reason}</span>
          </div>
        )}
      </motion.button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className={s.details}
            variants={collapse}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className={s.detailsInner}>
              {pack.perks.map((perk) => (
                <span className={s.perk} key={perk}>
                  <Check className={s.perkIcon} size={14} strokeWidth={2.5} aria-hidden="true" />
                  <span className="t-body-14">{perk}</span>
                </span>
              ))}
              <span className={clsx(s.missing, 't-caption-12', 't-secondary')}>
                {pack.fairUse}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
