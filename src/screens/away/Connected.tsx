import clsx from 'clsx'
import { CalendarDays, Check, Wifi } from 'lucide-react'
import { COPY, EXPLAINERS, HOME } from '../../data'
import { contentsLine, fill, fullSpeedGb, inr } from '../../lib/format'
import { RouteLeg } from '../../patterns/RouteLeg/RouteLeg'
import { ActionRows, DrainCard, HelpCard } from '../../patterns/TripActions/TripActions'
import { TripBand } from '../../patterns/TripBand/TripBand'
import { useLiveStore } from '../../state/liveStore'
import {
  useCurrentCountry,
  useDestinations,
  useSelectedPack,
  useTripDays,
  useTripProgressVariant,
} from '../../state/selectors'
import { useTripStore } from '../../state/tripStore'
import { useQuickActionNav, useUiStore } from '../../state/uiStore'
import { AppHeader, StatusBar, TileRow } from '../../ui/Chrome/Chrome'
import { Screen } from '../../ui/Screen/Screen'
import s from './Connected.module.css'

/**
 * 05.2 Connected confirmation.
 *
 * The band, the leg you flew, what is now true in three lines, then the four
 * things you can do about it and the help card. Every figure on it is derived
 * from the pack and the trip, so the screen cannot disagree with the dashboard
 * you reach from it.
 */
export function Connected() {
  const pack = useSelectedPack()
  const tripDays = useTripDays()
  const variant = useTripProgressVariant()
  const country = useCurrentCountry()
  const destinations = useDestinations()
  const live = useLiveStore()

  const msisdn = useTripStore((x) => x.msisdn)
  const range = useTripStore((x) => x.range)
  const autoTopUp = useTripStore((x) => x.autoTopUp)
  const setAutoTopUp = useTripStore((x) => x.setAutoTopUp)

  const stopDivert = useLiveStore((x) => x.stopDivert)
  const toast = useUiStore((x) => x.toast)
  const quickAction = useQuickActionNav()

  const name = country?.name ?? 'Singapore'
  const tokens = {
    fup: pack ? fullSpeedGb(pack) : 0,
    validity: pack?.validityDays ?? 0,
    price: pack ? inr(pack.priceExGst) : '—',
  }

  const actions = EXPLAINERS.filter((e) => e.group === 'actions')
  /*
    One drain row here, not the dashboard's two: nothing has diverted yet on
    day one, so the roaming switch has nothing to stop.
  */
  const drains = EXPLAINERS.filter((e) => e.id === 'drain-voicemail')

  function onDrain(id: string) {
    if (id !== 'drain-voicemail') return
    stopDivert()
    toast({
      tone: 'success',
      title: 'Voicemail divert off',
      body: 'Forwarded calls stop costing you.',
      ttlMs: 3200,
    })
  }

  /*
    The headline is one sentence with two coloured words in it, so it is built
    from the country rather than pasted — "You're in {country} and you're
    connected", with {country} and "connected" carrying the tint.
  */
  return (
    <Screen
      scrollKey="connected"
      top={
        <>
          <StatusBar />
          <AppHeader />
          <TileRow items={HOME.quickActions} activeId="travel" onSelect={quickAction} />
        </>
      }
      bottom={
        <p className={clsx(s.foot, 't-caption-12')}>
          Make a call or send a text and this card starts counting.
        </p>
      }
    >
      <div className={s.body}>
        <div className={s.arrival}>
          <TripBand
            variant={variant}
            tripDays={tripDays}
            msisdn={msisdn}
            startIso={range.from}
            destinations={destinations}
          />

          <div className={s.progress}>
            <RouteLeg country={country} connected />

            <div className={s.summaryWrap}>
            <div className={s.summary}>
              <h1 className={clsx(s.summaryTitle, 't-title-24')}>
                You’re in <span className={s.summaryCountry}>{name}</span> and you’re{' '}
                <span className={s.summaryVerb}>connected</span>
              </h1>

              <div className={s.summaryRows}>
                <div className={s.summaryRow}>
                  <span className={s.summaryIcon}>
                    <Check size={16} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span className={s.summaryText}>
                    <span className="t-bodystrong-14">Your number is working</span>
                    <span className="t-caption-12">Bank OTPs and UPI will reach you here</span>
                  </span>
                </div>

                {pack && (
                  <div className={s.summaryRow}>
                    <span className={s.summaryIcon}>
                      <Wifi size={16} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className={s.summaryText}>
                      <span className="t-bodystrong-14">
                        Your {inr(pack.priceExGst)} pack just started
                      </span>
                      <span className="t-caption-12">{contentsLine(pack)}</span>
                    </span>
                  </div>
                )}

                {pack && (
                  <div className={s.summaryRow}>
                    <span className={s.summaryIcon}>
                      <CalendarDays size={16} strokeWidth={1.5} aria-hidden="true" />
                    </span>
                    <span className={s.summaryText}>
                      <span className="t-bodystrong-14">
                        {fill(COPY.connected.dayLine, {
                          dayOfPack: live.dayOfPack,
                          packDays: pack.validityDays,
                        })}
                      </span>
                      <span className="t-caption-12">Each day ends 11:59 pm India time</span>
                    </span>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ActionRows
          explainers={actions}
          tokens={tokens}
          autoTopUp={autoTopUp}
          onAutoTopUp={setAutoTopUp}
        />

        <DrainCard explainers={drains} tokens={tokens} onSelect={onDrain} />

        <HelpCard />
      </div>
    </Screen>
  )
}
