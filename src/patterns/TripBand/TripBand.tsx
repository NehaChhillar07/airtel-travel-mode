import clsx from 'clsx'
import { addDays } from 'date-fns'
import { formatRangeLong, fromISO, toISO } from '../../lib/dates'
import { maskMsisdn, pluralise } from '../../lib/format'
import type { Country, TripProgressVariant } from '../../lib/types'
import { HeroArt } from '../../ui/Artwork/HeroArt'
import { DestinationChip } from '../../ui/DestinationChip/DestinationChip'
import s from './TripBand.module.css'

interface TripBandProps {
  variant: TripProgressVariant
  tripDays: number
  msisdn: string
  startIso: string | null
  destinations: Country[]
  className?: string
}

/**
 * The trip band — `Frame 1321322918`.
 *
 * Every screen in the "While you're away" group opens with it: 05.2, 05.3,
 * 05.4, 05.5 and 05.6 all draw the same three chips, the same day count and
 * the same connection line. It was five copies in the file and is one
 * component here, so the five can no longer disagree about the trip they are
 * all describing.
 *
 * The chips are `DestinationChip` at compact density — the real component,
 * with its own two-ring Active treatment — rather than a flag and a label in a
 * box that happens to look like one.
 */
export function TripBand({
  variant,
  tripDays,
  msisdn,
  startIso,
  destinations,
  className,
}: TripBandProps) {
  const range = {
    from: startIso,
    to: startIso ? toISO(addDays(fromISO(startIso), tripDays - 1)) : null,
  }

  return (
    <div className={clsx(s.band, className)}>
      <HeroArt className={s.bandBg} />
      <div className={s.bandInner}>
        <div className={s.chips}>
          {destinations.map((c) => (
            <DestinationChip key={c.iso2} country={c} state="active" density="compact" />
          ))}
        </div>

        <div className={s.daysRow}>
          <span className="t-title-24">
            {tripDays} {pluralise(tripDays, 'Day', 'Days')}
          </span>
          <span className="t-caption-12-semi">{formatRangeLong(range)}</span>
        </div>

        {/*
          The file draws "Connected 999****991" on the screen headlined "You've
          landed, but your phone hasn't connected" — SOURCE_ISSUES §1.2. The
          05.3 export corrects it to "No connection" on a red dot, so the
          status is derived from `variant` and cannot contradict the headline
          above it either way.
        */}
        {/*
          Exhausted keeps the green dot, which the 05.6 export is right about:
          the pack has ended but the phone has not been cut off, and this line
          is the first place that gets said. The alert red is spent on the
          figure that is actually still running.
        */}
        <span className={clsx(s.status, 't-body-14-med')}>
          <span className={clsx(s.dot, variant === 'no-connection' && s.dotOff)} />
          {variant === 'no-connection' ? 'No connection' : 'Connected'} {maskMsisdn(msisdn)}
        </span>
      </div>
    </div>
  )
}
