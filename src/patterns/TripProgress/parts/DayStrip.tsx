import clsx from 'clsx'
import { motion } from 'motion/react'
import { spring } from '../../../motion/presets'
import s from './DayStrip.module.css'

interface DayStripProps {
  tripDays: number
  /** The real day of the trip. The marker never leaves this cell. */
  today: number
  selectedDay: number | null
  onSelect: (day: number | null) => void
  /** 05.5 — turns the marker red. */
  low: boolean
  dayLabel: (n: number) => string
}

/**
 * One 29px cell per day: spent behind you, a tall marker for today, empty
 * ahead. Every spent cell is a button — the strip is the control that rewinds
 * the block, and today's cell is how you come back.
 *
 * The green is simply there on arrival. It used to sweep the length of the
 * strip, which was a nice piece of motion and the wrong one to have: it is the
 * first thing on the screen and it moved, so it took the eye before any of the
 * figures had been read, and the meters underneath were competing with it.
 * Days already gone are a fact about the past, not an event — the screen has
 * nothing to announce by drawing them in.
 */
export function DayStrip({
  tripDays,
  today,
  selectedDay,
  onSelect,
  low,
  dayLabel,
}: DayStripProps) {
  return (
    <div className={s.strip} role="group" aria-label={`Day ${today} of ${tripDays}`}>
      {Array.from({ length: tripDays }, (_, i) => {
        const n = i + 1
        const label = `Day ${n}${dayLabel(n) ? `, ${dayLabel(n)}` : ''}`

        if (n === today) {
          return (
            <motion.button
              key={n}
              type="button"
              className={clsx(s.cell, s.cellToday, low && s.cellTodayLow)}
              layoutId="trip-today"
              transition={spring.gentle}
              aria-pressed={selectedDay === null}
              aria-label={`${label} — today`}
              onClick={() => onSelect(null)}
            >
              <span className={clsx(s.cellTodayLabel, 't-caption-12', 't-inverse')}>Today</span>
            </motion.button>
          )
        }

        if (n > today) return <span key={n} className={s.cell} />

        return (
          <button
            key={n}
            type="button"
            className={clsx(s.cell, s.cellDone, selectedDay === n && s.cellSelected)}
            aria-pressed={selectedDay === n}
            aria-label={`${label} — show this day`}
            onClick={() => onSelect(selectedDay === n ? null : n)}
          >
            <span className={s.cellFill} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
