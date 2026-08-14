import clsx from 'clsx'
import { addDays } from 'date-fns'
import { useEffect, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import { COPY, HOME, SETTINGS } from '../../data'
import { formatLongDate, formatOrdinalShort, fromISO, toISO } from '../../lib/dates'
import { fill, inr } from '../../lib/format'
import { TripBand } from '../../patterns/TripBand/TripBand'
import { useLiveStore } from '../../state/liveStore'
import { useDestinations, useSelectedPack, useTripDays } from '../../state/selectors'
import { useTripStore } from '../../state/tripStore'
import { useQuickActionNav, useUiStore } from '../../state/uiStore'
import { AppHeader, StatusBar, TileRow } from '../../ui/Chrome/Chrome'
import { Money } from '../../ui/Money/Money'
import { Screen } from '../../ui/Screen/Screen'
import s from './PackEnded.module.css'

/**
 * Paise accrued since the screen opened, at the real per-day rate.
 *
 * This is what makes "counting up" something you watch rather than something
 * the screen claims. ₹450 a day is 0.52 paise a second, so ticking once a
 * second moves the last digit every couple of seconds — fast enough to read as
 * live, and not a number the screen is inventing. Accelerating it to make the
 * rupees move would be showing money that is not being spent.
 */
function useAccruedPaise(perDay: number, active: boolean): number {
  const reduced = useReducedMotion()
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!active || reduced) return
    const id = setInterval(() => setSeconds((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [active, reduced])

  return Math.floor((seconds * perDay * 100) / 86400)
}

/**
 * 05.6 Pack ended.
 *
 * The order of the screen is the argument it is making, and it is the frame's
 * order rather than mine: the pack ended, nothing was cut off, here are the
 * nine days you spent, here is what it is costing you now, and here are the
 * two things you can do. Bad news, then reassurance, then evidence, then the
 * exits — never the cost first.
 *
 * The band still reads "Connected" on a green dot, which looks wrong for a
 * second and is not: the phone is connected, at standard rates. That dot is
 * doing the same job as the second sentence in the headline.
 */
export function PackEnded() {
  const pack = useSelectedPack()
  const tripDays = useTripDays()
  const destinations = useDestinations()
  const live = useLiveStore()
  const msisdn = useTripStore((x) => x.msisdn)
  const range = useTripStore((x) => x.range)
  const navigate = useUiStore((x) => x.navigate)
  const toast = useUiStore((x) => x.toast)
  const quickAction = useQuickActionNav()

  /*
    What the overrun has cost so far. Days past the pack's validity at the
    standard roaming rate — derived, so advancing a day moves it, rather than
    a figure typed onto a card the way the frame has it.
  */
  const daysOver = pack ? Math.max(0, live.dayOfPack - pack.validityDays) : 0
  const charged = daysOver * SETTINGS.standardRoamingPerDay
  const paise = useAccruedPaise(SETTINGS.standardRoamingPerDay, daysOver > 0)

  /*
    What the figure is made of. One row per day past the pack, each at the
    standard rate — the same arithmetic the total comes from, so the rows
    cannot fail to add up to it, and a day advanced adds a row rather than
    silently growing the number.
  */
  const overrunDays =
    pack && range.from
      ? Array.from({ length: daysOver }, (_, i) => {
          const dayOfPack = pack.validityDays + i + 1
          const iso = toISO(addDays(fromISO(range.from!), live.dayOfTrip - daysOver + i - 1))
          return { dayOfPack, iso, amount: SETTINGS.standardRoamingPerDay }
        })
      : []

  const endedDate = range.to ? formatLongDate(range.to) : ''

  return (
    <Screen
      scrollKey="pack-ended"
      top={
        <>
          <StatusBar />
          <AppHeader />
          <TileRow items={HOME.quickActions} activeId="travel" onSelect={quickAction} />
        </>
      }
    >
      <TripBand
        variant="exhausted"
        tripDays={tripDays}
        msisdn={msisdn}
        startIso={range.from}
        destinations={destinations}
      />

      <div className={s.progress}>
        <div className={s.header}>
          {/* `Frame 1321322910` */}
          <div className={s.head}>
            <span className={clsx(s.headDay, 't-label-12')}>
              {fill(COPY.dashboard.dayLine, {
                dayOfTrip: Math.min(live.dayOfTrip, tripDays),
                tripDays,
              })}
            </span>
            <span className={clsx(s.headEnded, 't-caption-12')}>
              {fill(COPY.packEnded.endedLine, { endDate: endedDate })}
            </span>
          </div>

          {/*
            `Frame 1321322911`, without its day strip.

            The frame draws one here, every cell green and the last one dark.
            But a strip is a progress bar, and there is no progress left to
            report: the days are spent, nothing will fill, and the one thing
            still moving on this screen is the charge counting up below. Left
            in, it invited a tap that opens nothing and drew the eye to the
            part of the screen that has already finished happening.
          */}
          <div className={s.title}>
            <h1 className="t-title-24">{COPY.packEnded.title}</h1>
            <p className={clsx(s.titleBody, 't-body-14')}>{COPY.packEnded.body}</p>
          </div>
        </div>

        {/* --------------------------------------------------- what it costs */}
        <div className={s.charged}>
          <div className={s.chargedHead}>
            <span className="t-label-12">{COPY.packEnded.chargedTitle}</span>
          </div>
          <div className={s.chargedValue}>
            {/* Counts up to the settled figure on arrival, then keeps going in
                paise, which is the rate it is actually accruing at. */}
            <span className={clsx(s.chargedAmount, 't-title-24')}>
              <Money value={charged} delay={0.2} aria-live="polite" />
            </span>
            <span className={clsx(s.chargedPaise, 't-body-14-med')} aria-hidden="true">
              .{String(paise % 100).padStart(2, '0')}
            </span>
            <span className={clsx(s.chargedNote, 't-body-14')}>
              {COPY.packEnded.chargedNote}
            </span>
          </div>

          {/* --------------------------------------- what the figure is made of */}
          {overrunDays.length > 0 && (
            <div className={s.chargedRows}>
              {overrunDays.map((d) => (
                <div className={s.chargedRow} key={d.dayOfPack}>
                  <span className={clsx(s.chargedRowLabel, 't-caption-12')}>
                    {formatOrdinalShort(d.iso)} · Day {d.dayOfPack} of the pack
                  </span>
                  <span className="t-caption-12-semi t-nums">{inr(d.amount)}</span>
                </div>
              ))}
              <span className={clsx(s.chargedFoot, 't-caption-12')}>
                {fill(COPY.packEnded.chargedRate, {
                  rate: inr(SETTINGS.standardRoamingPerDay),
                })}
              </span>
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------- exits */}
        <button className={s.addBtn} onClick={() => navigate('packs')}>
          <span className={clsx(s.addTitle, 't-value-16-med')}>{COPY.packEnded.cta}</span>
          <span className={clsx(s.addSub, 't-caption-12')}>{COPY.packEnded.ctaSub}</span>
          <span className={clsx(s.addFrom, 't-caption-12')}>
            {fill(COPY.packEnded.ctaFrom, { price: pack ? inr(pack.priceExGst) : '—' })}
          </span>
        </button>

        <button
          className={clsx(s.stopBtn, 't-value-16-med')}
          onClick={() =>
            toast({
              tone: 'success',
              title: 'Roaming off',
              body: 'Calls, texts and data outside India stop now.',
              ttlMs: 3200,
            })
          }
        >
          {COPY.packEnded.stopCta}
        </button>
      </div>
    </Screen>
  )
}
