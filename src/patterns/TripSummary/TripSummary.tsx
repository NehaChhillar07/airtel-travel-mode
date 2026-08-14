import clsx from 'clsx'
import { CalendarDays, Smartphone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { COPY, SETTINGS } from '../../data'
import { formatRangeLong } from '../../lib/dates'
import { pluralise } from '../../lib/format'
import { useDestinations, useTripDays } from '../../state/selectors'
import { useTripStore } from '../../state/tripStore'
import { Flag } from '../../ui/Flag/Flag'
import s from './TripSummary.module.css'

/**
 * Frame 36 — the trip, restated at the top of the pack screens.
 *
 * Every value reads from the store. The file has "9 Days", the date range and
 * three country chips typed onto the frame, so they described exactly one
 * trip; change a date here and this changes with it.
 *
 * "Change" edits the number in place rather than sending you somewhere: the
 * row already looks like a field, and the only screen it could send you to —
 * trip creation — has no number on it. The button becomes "Save" while you
 * are editing, and stays disabled until the number is the right length.
 */
export function TripSummary() {
  const days = useTripDays()
  const range = useTripStore((x) => x.range)
  const msisdn = useTripStore((x) => x.msisdn)
  const setMsisdn = useTripStore((x) => x.setMsisdn)
  const destinations = useDestinations()

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(msisdn)
  const inputRef = useRef<HTMLInputElement>(null)

  const complete = draft.length === SETTINGS.msisdn.length

  // Focus and select on entry, so the whole number is one keystroke from gone.
  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function save() {
    if (!complete) return
    setMsisdn(draft)
    setEditing(false)
  }

  return (
    <div className={s.wrap}>
      <div className={s.head}>
        <div className={s.top}>
          <span className="t-title-24">
            {days} {pluralise(days, 'Day', 'Days')}
          </span>
          <span className={clsx(s.range, 't-caption-12')}>
            <CalendarDays size={16} strokeWidth={1.4} aria-hidden="true" />
            {formatRangeLong(range)}
          </span>
        </div>

        <div className={s.chips}>
          {destinations.map((c) => (
            <span className={s.chip} key={c.iso2}>
              <Flag country={c} size={23} />
              <span className={clsx(s.chipLabel, 't-caption-12-semi')}>{c.name}</span>
            </span>
          ))}
        </div>
      </div>

      <div className={s.numberRow}>
        <span className={s.number}>
          <span className={s.iconWrap}>
            <Smartphone size={24} strokeWidth={2} aria-hidden="true" />
          </span>
          <span className={s.numberText}>
            <span className="t-label-12">{COPY.packs.numberLabel}</span>
            {editing ? (
              <input
                ref={inputRef}
                className={clsx(s.numberInput, 't-value-16-bold')}
                value={draft}
                inputMode="numeric"
                autoComplete="tel"
                aria-label={COPY.packs.numberLabel}
                aria-invalid={!complete}
                onChange={(e) =>
                  setDraft(e.target.value.replace(/\D/g, '').slice(0, SETTINGS.msisdn.length))
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save()
                  if (e.key === 'Escape') setEditing(false)
                }}
              />
            ) : (
              <span className="t-value-16-bold">{msisdn}</span>
            )}
          </span>
        </span>
        <button
          className={clsx(s.change, 't-caption-12-semi')}
          disabled={editing && !complete}
          onClick={() => {
            if (editing) save()
            else {
              setDraft(msisdn)
              setEditing(true)
            }
          }}
        >
          {editing ? COPY.packs.saveLabel : COPY.packs.changeLabel}
        </button>
      </div>

      <span className={clsx(s.note, 't-caption-12')}>{COPY.packs.noBorderCharge}</span>
    </div>
  )
}
