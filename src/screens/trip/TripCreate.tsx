import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { COPY, HOME } from '../../data'
import { formatRangeChip } from '../../lib/dates'
import { pluralise } from '../../lib/format'
import { errorFor } from '../../lib/validate'
import { dur, ease } from '../../motion/presets'
import { DestinationPicker } from '../../patterns/DestinationPicker/DestinationPicker'
import { useTripDays, useValidation } from '../../state/selectors'
import { useTripStore } from '../../state/tripStore'
import { useQuickActionNav, useUiStore } from '../../state/uiStore'
import { HeroArt } from '../../ui/Artwork/HeroArt'
import { Button } from '../../ui/Button/Button'
import { CalendarSheet } from '../../ui/Calendar/CalendarSheet'
import { AppHeader, StatusBar, TileRow } from '../../ui/Chrome/Chrome'
import { DateField, DateFieldRow } from '../../ui/DateField/DateField'
import { Screen } from '../../ui/Screen/Screen'
import { Badge } from '../../ui/primitives'
import s from './TripCreate.module.css'

/**
 * 04.1, 04.2 and 04.3 — one screen.
 *
 * The source file draws these as three separate frames: the form empty, the
 * form mid-search with "UAE |" typed, and the form filled with three chips
 * active and an enabled CTA. They are not three screens. They are one screen
 * with a `destinations` array of length 0, a `query` of "UAE", and a complete
 * `range` — and the CTA is enabled because `validateTrip` says it should be,
 * not because a different picture was drawn.
 */
export function TripCreate() {
  const range = useTripStore((x) => x.range)
  const setRange = useTripStore((x) => x.setRange)
  const sheet = useUiStore((x) => x.sheet)
  const openSheet = useUiStore((x) => x.openSheet)
  const closeSheet = useUiStore((x) => x.closeSheet)
  const navigate = useUiStore((x) => x.navigate)
  const quickAction = useQuickActionNav()

  const touched = useTripStore((x) => x.touched)
  const touch = useTripStore((x) => x.touch)

  const days = useTripDays()
  const validation = useValidation()

  // An untouched field has no error to report yet.
  const rangeError = touched.includes('range') ? errorFor(validation, 'range') : null
  const destinationError = touched.includes('destinations')
    ? errorFor(validation, 'destinations')
    : null

  const calendarOpen = sheet?.kind === 'calendar'
  const calendarField = calendarOpen ? sheet.field : 'from'

  return (
    <Screen
      top={
        <>
          <StatusBar />
          <AppHeader />
          <TileRow items={HOME.quickActions} activeId="travel" onSelect={quickAction} />
        </>
      }
      bottom={
        <div className={s.bottom}>
          {/*
            Never disabled. Browsing what is on sale is not a commitment, and
            gating it behind a filled form makes the customer earn the right to
            look at the prices. `rankPacks` returns every pack whatever the
            trip says, so an empty draft lists the lot in default order; the
            trip only decides which one is recommended and why.

            `canViewPacks` still guards the step that matters — the packs
            screen's own CTA, where a pack is actually chosen.
          */}
          <Button full onClick={() => navigate('packs')}>
            {COPY.trip.cta}
          </Button>
        </div>
      }
    >
      <header className={s.hero}>
        <HeroArt className={s.heroBg} eager />
        <h1 className={clsx(s.heroTitle, 't-display-32')}>{COPY.trip.title}</h1>
      </header>

      <div className={s.body}>
        <section className={s.field}>
          <h2 className="t-label-12">{COPY.trip.destinationLabel}</h2>
          <DestinationPicker />
          {destinationError && (
            <span className={clsx(s.error, 't-caption-12', 't-alert')}>{destinationError}</span>
          )}
        </section>

        <section className={s.field}>
          <div className={s.summary} style={{ justifyContent: 'space-between' }}>
            <h2 className="t-label-12">{COPY.trip.datesLabel}</h2>
            {/*
              The trip length is derived, so it can appear the moment both
              dates exist. In the Figma "9 Days" is typed onto the next screen.
            */}
            <AnimatePresence>
              {days > 0 && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: dur.base, ease: ease.out }}
                >
                  <Badge tone="neutral">
                    {days} {pluralise(days, 'Day', 'Days')} · {formatRangeChip(range)}
                  </Badge>
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <DateFieldRow>
            <DateField
              label={COPY.trip.leaving}
              value={range.from}
              placeholder={COPY.trip.selectPlaceholder}
              open={calendarOpen && calendarField === 'from'}
              invalid={Boolean(rangeError)}
              onClick={() => {
                touch('range')
                openSheet({ kind: 'calendar', field: 'from' })
              }}
            />
            <DateField
              label={COPY.trip.comingBack}
              value={range.to}
              placeholder={COPY.trip.selectPlaceholder}
              open={calendarOpen && calendarField === 'to'}
              invalid={Boolean(rangeError)}
              onClick={() => {
                touch('range')
                openSheet({ kind: 'calendar', field: 'to' })
              }}
            />
          </DateFieldRow>

          {rangeError && (
            <span className={clsx(s.error, 't-caption-12', 't-alert')}>{rangeError}</span>
          )}
        </section>
      </div>

      <CalendarSheet
        open={calendarOpen}
        onOpenChange={(v) => (v ? undefined : closeSheet())}
        range={range}
        field={calendarField}
        onChange={setRange}
      />
    </Screen>
  )
}
