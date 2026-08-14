import clsx from 'clsx'
import { useState } from 'react'
import { addDays } from 'date-fns'
import { AlertTriangle, WifiOff } from 'lucide-react'
import { COPY } from '../../data'
import { formatLongDate, formatOrdinalShort, fromISO, toISO } from '../../lib/dates'
import { fill, fullSpeedGb } from '../../lib/format'
import type { Country, LiveTrip, Pack, TripProgressVariant } from '../../lib/types'
import { daySnapshot } from '../../lib/usage'
import { ProgressBar } from '../../ui/primitives'
import { DayStrip } from './parts/DayStrip'
import { Tally } from '../../ui/Tally/Tally'
import { TripBand } from '../TripBand/TripBand'
import s from './TripProgress.module.css'

interface TripProgressProps {
  variant: TripProgressVariant
  live: LiveTrip
  pack: Pack | null
  tripDays: number
  msisdn: string
  startIso: string | null
  destinations: Country[]
  /** Off only where a screen mounts `TripBand` itself, above other content. */
  showBand?: boolean
}

/**
 * The unlimited-data readout.
 *
 * It does not wipe in — nothing on this block does any more. It marches, and
 * only marches, because that is not an arrival: it is the readout saying there
 * is no limit to fill towards, which a still bar cannot say.
 */
function DataDots({ low }: { low?: boolean }) {
  return (
    <div className={clsx(s.dots, low && s.dotsLow)} aria-hidden="true">
      <span className={s.dotsFill} />
    </div>
  )
}



/**
 * The red zone: a fifth of the allowance or less.
 *
 * One number, used by every meter, so "is this bad" is answered the same way
 * for minutes, texts and days. It was 25% and read as alarmed far too often —
 * 25 of 100 left with a week to go is a normal Tuesday. A fifth is the point
 * where the figure is worth a colour.
 */
const RED_ZONE = 0.2

function inRedZone(left: number, total: number): boolean {
  return total > 0 && left / total <= RED_ZONE
}

/** Ordinal suffix for the day line: "Day 3rd". */
function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

export function TripProgress({
  variant,
  live,
  pack,
  tripDays,
  msisdn,
  startIso,
  destinations,
  showBand = true,
}: TripProgressProps) {
  const range = {
    from: startIso,
    to: startIso ? toISO(addDays(fromISO(startIso), tripDays - 1)) : null,
  }
  const fup = pack ? fullSpeedGb(pack) : 0

  /*
    05.5 is 05.4 in trouble — `tripProgressVariant` returns `midway` when
    `isLowBalance` does, so there is no second screen to keep in step.

    Which meters are alarmed is derived per meter rather than switched on the
    screen state, so the red lands on whatever has actually run down. The pale
    wash goes to the FIRST alarmed one only: the wash says "this is the one",
    and two of them would say nothing.
  */
  const low = variant === 'midway'

  /*
    Which day the block is showing. Local state rather than the ui store: it is
    a view of one component, nothing else can set it, and it should not survive
    leaving the screen.

    `null` means today. Tapping a spent cell rewinds the whole block — header,
    headline and all three meters — rather than opening a panel underneath it.
    A panel meant the screen reported two different days at once and left the
    reader to work out which figures belonged to which.
  */
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  /*
    NOTHING PLAYS ON ARRIVAL.

    There used to be a replay here: the block walked day 1 to today while green
    swept the strip. Two set pieces on one screen, and the screen's job is to
    be read — every figure on it had something moving over or under it before
    you got to it. The strip shows the days already spent, the meters show what
    is left, and both are simply true when you arrive.

    The rewind survives, because that one is asked for. Tapping a spent cell
    still takes the header, the headline and all three meters back to that day,
    and that IS worth animating: it is the answer to something you did.
  */

  const viewDay = selectedDay ?? live.dayOfTrip
  const rewound = selectedDay !== null && selectedDay !== live.dayOfTrip
  const snap = daySnapshot(live, pack, viewDay)

  /*
    THE METERS SIT OUT THE PLAYBACK.

    They used to walk it with everything else, and the screen ended up with two
    set pieces running at once: green sweeping across the strip, and three bars
    sliding underneath it. Neither could be watched, because each was pulling
    the eye off the other. The strip is the one that is *about* the days, so it
    keeps the arrival to itself.

    So the meters hold at today for the length of the sweep — figures, bars,
    alarm wash and all. Holding the wash was always the rule here: one that
    switched on and off nine times in a second and a half would take the
    divider, the radius and the late-usage note in and out with it, and the
    block would jump. Now the figures hold with it, which is what makes the
    block genuinely still rather than merely un-alarmed.

    Rewinding by tapping a cell is a different thing entirely, and everything
    still follows it — there is no sweep running to compete with.
  */

  const minsAlarm = Boolean(pack && inRedZone(snap.minsLeft, pack.voiceMins))
  const smsAlarm = Boolean(pack && inRedZone(snap.smsLeft, pack.sms))
  const dataAlarm = Boolean(pack && fup > 0 && snap.dataUsedGb / fup >= 0.85)
  const washed = minsAlarm ? 'mins' : smsAlarm ? 'sms' : dataAlarm ? 'data' : null

  /** "26th Aug" for a day number, or "" before the trip has a start date. */
  const dayLabel = (n: number) =>
    startIso ? formatOrdinalShort(toISO(addDays(fromISO(startIso), n - 1))) : ''

  const viewIso = startIso
    ? toISO(addDays(fromISO(startIso), Math.max(0, viewDay - 1)))
    : null

  return (
    <>
      {showBand && (
        <TripBand
          variant={variant}
          tripDays={tripDays}
          msisdn={msisdn}
          startIso={startIso}
          destinations={destinations}
        />
      )}

      {variant === 'exhausted' ? (
        <div className={s.notice}>
          <AlertTriangle className={clsx(s.noticeIcon, 't-alert')} size={18} aria-hidden="true" />
          <div className={s.stack}>
            <p className="t-value-16-bold t-alert">{COPY.packEnded.title}</p>
            <p className="t-body-14 t-alert">{COPY.packEnded.body}</p>
          </div>
        </div>
      ) : variant === 'no-connection' ? (
        <div className={clsx(s.notice, s.noticeNeutral)}>
          <WifiOff className={s.noticeIcon} size={18} aria-hidden="true" />
          <div className={s.stack}>
            <p className="t-value-16-bold">{COPY.notConnected.title}</p>
            <p className="t-body-14 t-secondary">{COPY.notConnected.body}</p>
          </div>
        </div>
      ) : (
        <div className={s.progress}>
          <div className={s.header}>
            {/* `Frame 1321322910` */}
            <div className={s.head}>
              <span className={clsx(s.headDay, 't-label-12')}>
                {fill(COPY.dashboard.dayLine, { dayOfTrip: viewDay, tripDays })}
              </span>
              <span className={clsx(s.headEnd, 't-caption-12')}>
                <span>{range.to ? `Ends ${formatLongDate(range.to)}` : ''}</span>
                <span>{Math.max(0, tripDays - viewDay + 1)} days left</span>
              </span>
            </div>

            {/* `Frame 1321322911` */}
            <div className={s.days}>
              {viewIso && (
                <div className={s.dayHead}>
                  <h2 className="t-title-24">
                    {formatOrdinalShort(viewIso)} | Day {ordinal(viewDay)}
                  </h2>
                  {/* The way out. Tapping the same cell again also works, but
                      only if you remember which one you tapped. */}
                  {rewound && (
                    <button
                      type="button"
                      className={clsx(s.backToday, 't-body-14-med')}
                      onClick={() => setSelectedDay(null)}
                    >
                      Back to today
                    </button>
                  )}
                </div>
              )}

              <DayStrip
                tripDays={tripDays}
                today={live.dayOfTrip}
                selectedDay={selectedDay}
                onSelect={setSelectedDay}
                low={low}
                dayLabel={dayLabel}
              />
            </div>
          </div>

          {/* `Frame 1321322913` */}
          <div className={s.meters}>
            {pack && pack.voiceMins > 0 && (
              <div
                className={clsx(
                  s.meter,
                  washed === 'mins' ? s.meterAlarm : s.meterDivided,
                )}
              >
                {/*
                  "Resets midnight", and the label says "today" — because that
                  is now true of the data as well as the copy. Minutes are the
                  one allowance that starts again each night, so `daySnapshot`
                  answers for a past day with that day's own 100 rather than a
                  point on a falling trip total. The label and the model agree.
                */}
                <div className={s.meterOverline}>
                  <span className="t-label-12">Minutes left today</span>
                  <span className="t-caption-12-semi">Resets midnight</span>
                </div>
                <div className={s.meterBody}>
                  <div className={s.meterValue}>
                    {/* Counts down from the full allowance, alongside a bar
                        draining from full. The figure and the bar are the same
                        fact, so they move as one. */}
                    <span className="t-title-24">
                      <Tally value={snap.minsLeft} from={pack.voiceMins} aria-live="polite" />
                    </span>
                    <span className="t-body-14-med">of {pack.voiceMins}</span>
                  </div>
                  <ProgressBar
                    className={s.meterBar}
                    value={snap.minsLeft / Math.max(1, pack.voiceMins)}
                    drain
                    animateOnMount={false}
                    tone={minsAlarm ? 'alert' : 'neutral'}
                    label="Minutes left"
                  />
                </div>
                <span className={clsx(s.meterNote, 't-caption-12', 't-secondary')}>
                  Incoming and outgoing together.
                </span>
                {washed === 'mins' && (
                  <span className={clsx(s.meterLate, 't-caption-12-semi')}>
                    {COPY.dashboard.usageLate}
                  </span>
                )}
              </div>
            )}

            {pack && pack.sms > 0 && (
              <div
                className={clsx(s.meter, washed === 'sms' ? s.meterAlarm : s.meterDivided)}
              >
                <div className={s.meterBody}>
                  <div className={s.meterRow}>
                    <span className={s.meterValue}>
                      <span className="t-title-24">
                        <Tally value={snap.smsLeft} from={pack.sms} aria-live="polite" />
                      </span>
                      <span className="t-body-14-med">of {pack.sms} texts left</span>
                    </span>
                    {/* Turns critical rather than grey once the pack is the
                        constraint — "for the whole pack" stops being a note
                        and becomes the reason the number is small. */}
                    <span className={clsx('t-caption-12-semi', smsAlarm && 't-critical')}>
                      For whole pack
                    </span>
                  </div>
                  <ProgressBar
                    className={s.meterBar}
                    value={snap.smsLeft / Math.max(1, pack.sms)}
                    drain
                    animateOnMount={false}
                    tone={smsAlarm ? 'alert' : 'neutral'}
                    label="Texts left"
                  />
                </div>
                <span className={clsx(s.meterNote, 't-caption-12', 't-secondary')}>
                  Incoming and outgoing together.
                </span>
                {washed === 'sms' && (
                  <span className={clsx(s.meterLate, 't-caption-12-semi')}>
                    {COPY.dashboard.usageLate}
                  </span>
                )}
              </div>
            )}

            {pack && (
              <div className={clsx(s.meter, washed === 'data' && s.meterAlarm)}>
                <div className={s.meterBody}>
                  <div className={s.meterRow}>
                    <span className={s.meterValue}>
                      <span className="t-title-24">
                        Data · {pack.data.kind === 'unlimited' ? 'unlimited' : `${pack.data.gb} GB`}
                      </span>
                    </span>
                    <span className="t-body-14-med">
                      <Tally value={snap.dataUsedGb} from={0} places={1} /> GB used
                    </span>
                  </div>
                  {pack.data.kind === 'unlimited' ? (
                    <DataDots low={dataAlarm} />
                  ) : (
                    /* The one bar that reports what is left of an allowance
                       whose figure beside it is what has gone — the caption
                       says "used", the bar says "left", and they are the two
                       halves of the same GB. */
                    <ProgressBar
                      className={s.meterBar}
                      value={1 - snap.dataUsedGb / Math.max(1, fup)}
                      drain
                      animateOnMount={false}
                      tone={dataAlarm ? 'alert' : 'neutral'}
                      label="Data left"
                    />
                  )}
                </div>
                <span className={clsx(s.meterNote, 't-caption-12', 't-secondary')}>
                  {pack.data.kind === 'unlimited'
                    ? `Slows a little after ${fup} GB across the trip. It never stops.`
                    : `Stops at ${fup} GB.`}
                </span>
                {washed === 'data' && (
                  <span className={clsx(s.meterLate, 't-caption-12-semi')}>
                    {COPY.dashboard.usageLate}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Not a button. The screen below already carries a real "Add
              high-speed data" row, and two live routes to the same place is
              one more than the frame has — this is the frame's CTA, present
              and styled, but it does not take you anywhere. */}
          {low && (
            <div className={clsx(s.lowCta, 't-value-16-med')} aria-hidden="true">
              {COPY.dashboard.lowBalanceCta}
            </div>
          )}
        </div>
      )}
    </>
  )
}
