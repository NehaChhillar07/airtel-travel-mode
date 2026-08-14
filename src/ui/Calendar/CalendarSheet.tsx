import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { DayPicker, type DateRange as RdpRange } from 'react-day-picker'
import { SETTINGS } from '../../data'
import { formatRangeLong, fromISO, toISO, today, tripLengthDays } from '../../lib/dates'
import { pluralise } from '../../lib/format'
import type { DateRange } from '../../lib/types'
import { Button } from '../Button/Button'
import { Sheet } from '../Sheet/Sheet'
import s from './Calendar.module.css'

interface CalendarSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  range: DateRange
  onChange: (range: DateRange) => void
  /** Which field opened the sheet — decides which end gets picked first. */
  field: 'from' | 'to'
}

function toRdp(range: DateRange): RdpRange | undefined {
  if (!range.from) return undefined
  return {
    from: fromISO(range.from),
    to: range.to ? fromISO(range.to) : undefined,
  }
}

/**
 * The range picker.
 *
 * react-day-picker rather than hand-rolled, for the parts that are easy to get
 * subtly wrong and impossible to notice: arrow-key and Home/End navigation
 * across a grid, correct ARIA on the table, disabled-day handling, and the
 * month rollover. Every visual is overridden through `classNames` and
 * `components`, so the library brings behaviour and the tokens bring looks.
 */
export function CalendarSheet({ open, onOpenChange, range, onChange, field }: CalendarSheetProps) {
  // Local until confirmed, so cancelling leaves the trip untouched.
  const [draft, setDraft] = useState<DateRange>(range)
  const [month, setMonth] = useState(() => fromISO(range.from ?? toISO(today())))

  // Re-seed whenever the sheet opens.
  const [wasOpen, setWasOpen] = useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setDraft(range)
      setMonth(fromISO(range.from ?? toISO(today())))
    }
  }

  const days = tripLengthDays(draft)
  const complete = Boolean(draft.from && draft.to)

  const hint = !draft.from
    ? 'Pick the day you leave'
    : !draft.to
      ? 'Now pick the day you come back'
      : formatRangeLong(draft)

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={field === 'from' ? 'When do you leave?' : 'When do you come back?'}
      description="Pick a departure date, then a return date."
      footer={
        <div className={s.footer} style={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }}>
          <span className={s.summary}>
            <span className="t-value-16-med">
              {complete ? `${days} ${pluralise(days, 'Day', 'Days')}` : 'Select dates'}
            </span>
            <span className="t-caption-12 t-secondary">{hint}</span>
          </span>
          <Button
            disabled={!complete}
            onClick={() => {
              onChange(draft)
              onOpenChange(false)
            }}
          >
            Done
          </Button>
        </div>
      }
    >
      <div className={s.wrap}>
        <DayPicker
          className={s.rdp}
          mode="range"
          selected={toRdp(draft)}
          month={month}
          onMonthChange={setMonth}
          // Without this the library marks the real system date as "today"
          // while everything else in the app works off the pinned date in
          // settings.json — so the dot lands on a day that is also disabled.
          today={today()}
          startMonth={today()}
          // Ninety days is the longest pack sold, so it is also the longest
          // trip the catalogue can answer.
          endMonth={new Date(today().getFullYear() + 2, 11)}
          disabled={{ before: today() }}
          max={SETTINGS.maxTripDays}
          weekStartsOn={0}
          onSelect={(next) => {
            setDraft({
              from: next?.from ? toISO(next.from) : null,
              to: next?.to ? toISO(next.to) : null,
            })
          }}
          components={{
            Chevron: ({ orientation }) =>
              orientation === 'left' ? (
                <ChevronLeft size={20} strokeWidth={2.2} />
              ) : (
                <ChevronRight size={20} strokeWidth={2.2} />
              ),
          }}
          classNames={{
            months: s.months,
            nav: s.nav,
            button_previous: s.navBtn,
            button_next: s.navBtn,
            month_caption: s.monthCaption,
            caption_label: `${s.captionLabel} t-value-16-med`,
            month_grid: s.monthGrid,
            weekdays: s.weekdays,
            weekday: s.weekday,
            week: s.week,
            day: s.day,
            day_button: s.dayButton,
            outside: s.outside,
            disabled: s.disabled,
            today: s.today,
            selected: s.selected,
            range_start: s.rangeStart,
            range_middle: s.rangeMiddle,
            range_end: s.rangeEnd,
          }}
        />
      </div>
    </Sheet>
  )
}
