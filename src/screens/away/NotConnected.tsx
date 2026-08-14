import clsx from 'clsx'
import { Check } from 'lucide-react'
import { CHECKLIST, COPY, HOME } from '../../data'
import { RouteLeg } from '../../patterns/RouteLeg/RouteLeg'
import { TripBand } from '../../patterns/TripBand/TripBand'
import {
  useCurrentCountry,
  useDestinations,
  useSelectedPack,
  useTripDays,
} from '../../state/selectors'
import { useTripStore } from '../../state/tripStore'
import { useQuickActionNav } from '../../state/uiStore'
import { AppHeader, StatusBar, TileRow } from '../../ui/Chrome/Chrome'
import { WhatsAppGlyph } from '../../ui/Glyph/WhatsApp'
import { Screen } from '../../ui/Screen/Screen'
import s from './NotConnected.module.css'

/**
 * 05.3 Not connected troubleshooting.
 *
 * The band and the leg you flew, then what has and has not happened, then the
 * three fixes in the order they work — the same three `checklist.json` drives
 * on 05.1, so the two screens cannot drift apart.
 *
 * The pack days in the headline are read off the pack rather than typed, which
 * is why the sentence says "10 days" without anyone maintaining it.
 */
export function NotConnected() {
  const pack = useSelectedPack()
  const tripDays = useTripDays()
  const country = useCurrentCountry()
  const destinations = useDestinations()
  const msisdn = useTripStore((x) => x.msisdn)
  const range = useTripStore((x) => x.range)
  const quickAction = useQuickActionNav()

  const name = country?.name ?? 'Singapore'

  return (
    <Screen
      scrollKey="not-connected"
      top={
        <>
          <StatusBar />
          <AppHeader />
          <TileRow items={HOME.quickActions} activeId="travel" onSelect={quickAction} />
        </>
      }
      bottom={
        <div className={s.foot}>
          <div className={s.footBtns}>
            {/*
              The number goes under the label. A button that only says "Call,
              Free" does not say what it is about to dial, which matters most
              on the one screen the user reaches with no working connection.
            */}
            <button
              className={clsx(s.footBtn, s.footBtnCall)}
              aria-label={`${COPY.setup.callFree} — calls ${COPY.dashboard.helpNumber}`}
            >
              {/* `t-inverse` because the type classes each carry their own
                  colour, which would otherwise win over the button's. */}
              <span className="t-value-16-med t-inverse">{COPY.setup.callFree}</span>
              <span
                className={clsx(s.footNumber, 't-caption-12', 't-inverse')}
                aria-hidden="true"
              >
                {COPY.dashboard.helpNumber}
              </span>
            </button>
            <button className={clsx(s.footBtn, s.footBtnGhost, 't-value-16-med')}>
              <WhatsAppGlyph size={20} />
              {COPY.setup.whatsapp}
            </button>

          </div>
          <p className={clsx(s.footNote, 't-caption-12')}>
            WhatsApp works on airport or hotel WiFi even while your SIM does not.
          </p>
        </div>
      }
    >
      <TripBand
        variant="no-connection"
        tripDays={tripDays}
        msisdn={msisdn}
        startIso={range.from}
        destinations={destinations}
      />

      <div className={s.progress}>
        <RouteLeg country={country} connected={false} />

        <div className={s.headWrap}>
          <div className={s.head}>
            <h1 className={clsx(s.headTitle, 't-title-24')}>{COPY.notConnected.title}</h1>
            <p className={clsx(s.headBody, 't-body-14')}>
              Your {pack?.validityDays ?? 10} days haven’t started yet. Nothing counts down
              until the phone connects
            </p>
          </div>
        </div>
      </div>

      <p className={clsx(s.lead, 't-caption-12-semi')}>
        Three things fix this almost every time, try them in order.
      </p>

      <div className={s.steps}>
        {CHECKLIST.map((step) => (
          <div className={s.step} key={step.n}>
            <div className={s.stepHead}>
              <span className="t-value-16-bold">{step.title}</span>
              <span className={clsx(s.stepWhy, 't-caption-12')}>{step.why}</span>
            </div>

            {step.settingsPath && (
              <span className={clsx(s.path, 't-label-12')}>{step.settingsPath}</span>
            )}

            {step.picks.length > 0 && (
              <div className={s.picks}>
                {step.picks.map((pick) => (
                  <span
                    className={clsx(s.pick, pick.good && s.pickGood)}
                    key={pick.label}
                  >
                    <span className={clsx(s.pickLabel, 't-caption-12')}>{pick.label}</span>
                    <span className={clsx(s.pickHint, 't-caption-12')}>
                      {pick.good && <Check size={16} strokeWidth={1.5} aria-hidden="true" />}
                      {pick.hint}
                    </span>
                  </span>
                ))}
              </div>
            )}

            {step.note && (
              <ol className={s.notes}>
                {step.note.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ol>
            )}

            {step.cta && (
              <button className={clsx(s.stepCta, 't-value-16-med')}>{step.cta}</button>
            )}

            {step.after && (
              <span className={clsx(s.stepAfter, 't-caption-12')}>
                {step.after.replace('Singapore', name)}
              </span>
            )}
          </div>
        ))}
      </div>
    </Screen>
  )
}
