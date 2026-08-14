import clsx from 'clsx'
import { motion } from 'motion/react'
import { Check } from 'lucide-react'
import { Flag } from '../Flag/Flag'
import { inr } from '../../lib/format'
import { press, spring } from '../../motion/presets'
import type { Country } from '../../lib/types'
import s from './DestinationChip.module.css'

export type ChipState = 'default' | 'active'
export type ChipProperty = 'chip' | 'row' | 'block'
export type ChipDensity = 'default' | 'compact'

interface DestinationChipProps {
  country: Country
  state?: ChipState
  property?: ChipProperty
  /**
   * `compact` is the 37px chip the trip band carries: the same two-ring Active
   * treatment, drawn tight enough that three of them fit across the glass.
   */
  density?: ChipDensity
  onToggle?: (iso2: string) => void
  disabled?: boolean
  /** Row only: the alias that matched, shown as "· via Dubai". */
  via?: string | null
  /** Row only: hides the "from ₹649" line. */
  hidePrice?: boolean
  className?: string
}

/**
 * The `Destination` component set.
 *
 * `layout` is doing real work here rather than being decoration: Active is
 * genuinely 6px larger than Default, so selecting a chip reflows its whole
 * row. Animating that reflow is the difference between a state change you
 * notice and one you miss.
 */
export function DestinationChip({
  country,
  state = 'default',
  property = 'chip',
  density = 'default',
  onToggle,
  disabled,
  via,
  hidePrice,
  className,
}: DestinationChipProps) {
  const active = state === 'active'
  const interactive = Boolean(onToggle) && !disabled
  const compact = density === 'compact'

  const label =
    property === 'row'
      ? active
        ? `Remove ${country.name} from your trip`
        : `Add ${country.name} to your trip`
      : `${country.name}${active ? ', selected' : ''}`

  return (
    <motion.button
      type="button"
      layout
      transition={spring.snappy}
      className={clsx(s.chip, className)}
      data-state={state}
      data-property={property}
      data-density={density}
      data-iso={country.iso2}
      aria-pressed={interactive ? active : undefined}
      aria-label={label}
      disabled={disabled}
      onClick={interactive ? () => onToggle?.(country.iso2) : undefined}
      {...(interactive ? press : {})}
    >
      <span className={s.bg} aria-hidden="true" />

      <Flag country={country} size={property === 'block' ? 28 : 23} />

      {property === 'row' ? (
        <>
          <span className={s.rowText}>
            <span className={clsx(s.rowName, 't-value-16-med')}>{country.name}</span>
            {!hidePrice && (
              <span className={clsx(s.rowPrice, 't-body-14', 't-secondary')}>
                from {inr(country.fromPrice)}
              </span>
            )}
            {via && (
              <span className={clsx(s.rowVia, 't-caption-12', 't-secondary')}>· {via}</span>
            )}
          </span>
          <span className={clsx(s.rowAction, 't-body-14-med')}>
            {active ? 'Added' : 'Add'}
          </span>
        </>
      ) : property === 'block' ? (
        <span className={clsx(s.blockLabel, 't-body-14-med')}>{country.name}</span>
      ) : (
        <span className={clsx(s.label, compact ? 't-caption-12-semi' : 't-body-14-med')}>
          {country.name}
        </span>
      )}

      {property === 'block' && active && (
        <motion.span
          className={s.tick}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={spring.bouncy}
        >
          <Check size={11} strokeWidth={3} aria-hidden="true" />
        </motion.span>
      )}
    </motion.button>
  )
}
