import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { formatOrdinal } from '../../lib/dates'
import { dur, ease } from '../../motion/presets'
import s from './DateField.module.css'

interface DateFieldProps {
  label: string
  /** ISO date, or null for the empty state. */
  value: string | null
  placeholder: string
  open?: boolean
  invalid?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function DateField({
  label,
  value,
  placeholder,
  open,
  invalid,
  disabled,
  onClick,
}: DateFieldProps) {
  // Flash the field when its value changes, but not on first render.
  const [flash, setFlash] = useState(false)
  const previous = useRef(value)
  useEffect(() => {
    if (previous.current !== value && value) {
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 620)
      return () => clearTimeout(t)
    }
    previous.current = value
  }, [value])

  return (
    <button
      type="button"
      className={clsx(s.field, flash && s.flash, 'pressable')}
      data-open={open}
      data-invalid={invalid}
      disabled={disabled}
      onClick={onClick}
      aria-label={value ? `${label}: ${formatOrdinal(value)}. Change.` : `${label}: not set. Pick a date.`}
    >
      <span className={clsx(s.label, 't-caption-12', 't-secondary')}>{label}</span>

      {/*
        `mode="wait"` so "Select" leaves before the date arrives — a crossfade
        of two different strings in the same slot reads as a smudge.
      */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={value ?? 'empty'}
          className={clsx(s.value, 't-value-16-med', !value && s.placeholder)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: dur.fast, ease: ease.out }}
        >
          {value ? formatOrdinal(value) : placeholder}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

export function DateFieldRow({ children }: { children: ReactNode }) {
  return <div className={s.row}>{children}</div>
}
