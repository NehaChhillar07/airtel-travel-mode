import clsx from 'clsx'
import { Fragment } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { COPY, EXPLAINERS, HOME } from '../../data'
import { fill, fullSpeedGb, inr } from '../../lib/format'
import { collapse } from '../../motion/presets'
import { ActionRows, DrainCard, HelpCard } from '../../patterns/TripActions/TripActions'
import { TripProgress } from '../../patterns/TripProgress/TripProgress'
import { useLiveStore } from '../../state/liveStore'
import {
  useCurrentCountry,
  useDestinations,
  useSelectedPack,
  useTripDays,
  useTripProgressVariant,
  useTripSpend,
} from '../../state/selectors'
import { useTripStore } from '../../state/tripStore'
import { useQuickActionNav, useUiStore } from '../../state/uiStore'
import { AppHeader, StatusBar, TileRow } from '../../ui/Chrome/Chrome'
import { Money } from '../../ui/Money/Money'
import { Screen } from '../../ui/Screen/Screen'
import { Sheet } from '../../ui/Sheet/Sheet'
import s from './Dashboard.module.css'

/**
 * 05.4 Trip dashboard and 05.5 Trip dashboard low balance.
 *
 * One screen. "Low balance" is `isLowBalance()` returning true, not a second
 * frame — which is also why the day counts here cannot drift from the ones on
 * the confirmation screen the way SOURCE_ISSUES §1.3 found them drifting.
 */
export function Dashboard() {
  const pack = useSelectedPack()
  const tripDays = useTripDays()
  const variant = useTripProgressVariant()
  const spend = useTripSpend()
  const destinations = useDestinations()
  const country = useCurrentCountry()

  const msisdn = useTripStore((x) => x.msisdn)
  const range = useTripStore((x) => x.range)
  const autoTopUp = useTripStore((x) => x.autoTopUp)
  const setAutoTopUp = useTripStore((x) => x.setAutoTopUp)

  const live = useLiveStore()
  const ledger = useLiveStore((x) => x.ledger)
  const stopDivert = useLiveStore((x) => x.stopDivert)
  const advanceDay = useLiveStore((x) => x.advanceDay)

  const sheet = useUiStore((x) => x.sheet)
  const openSheet = useUiStore((x) => x.openSheet)
  const closeSheet = useUiStore((x) => x.closeSheet)
  const navigate = useUiStore((x) => x.navigate)
  const toast = useUiStore((x) => x.toast)
  const quickAction = useQuickActionNav()

  const whyEntry =
    sheet?.kind === 'why' ? (ledger.find((e) => e.id === sheet.entryId) ?? null) : null

  const tokens = {
    fup: pack ? fullSpeedGb(pack) : 0,
    validity: pack?.validityDays ?? 0,
    price: pack ? inr(pack.priceExGst) : '—',
  }

  const actions = EXPLAINERS.filter((e) => e.group === 'actions')
  const drains = EXPLAINERS.filter((e) => e.group === 'drain')
  const charges = ledger.filter((e) => e.kind !== 'pack')

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

  return (
    <Screen
      scrollKey="dashboard"
      top={
        <>
          <StatusBar />
          <AppHeader />
          <TileRow items={HOME.quickActions} activeId="travel" onSelect={quickAction} />
        </>
      }
    >
      <TripProgress
        variant={variant}
        live={live}
        pack={pack}
        tripDays={tripDays}
        msisdn={msisdn}
        startIso={range.from}
        destinations={destinations}
      />

      <div className={s.body}>
        {/* ---------------------------------------------------- spend card */}
        <div className={s.spendWrap}>
          <div className={s.spend}>
            <div className={s.spendHead}>
              <span className="t-label-12">{COPY.dashboard.spendTitle}</span>
              <div className={s.spendFigures}>
                {/* `title/24` — the card's size, at the card's weight. It is
                    the figure the whole card exists to report. */}
                <span className="t-title-24">
                  <Money value={spend.total} aria-live="polite" />
                </span>
                <span className={clsx(s.spendCaption, 't-caption-12')}>
                  {fill(COPY.dashboard.spendCaption, { extra: inr(spend.unexpected) })}
                </span>
                <span className="t-body-14-med">
                  {fill(COPY.dashboard.spendBreakdown, {
                    packPrice: pack ? inr(pack.priceExGst) : '—',
                    extra: inr(spend.unexpected),
                  })}
                </span>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {charges.map((entry) => (
                <Fragment key={entry.id}>
                  <hr className={s.ledgerRule} />
                  <motion.div
                    layout
                    className={s.ledgerRow}
                    variants={collapse}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                  >
                    <span className={clsx(s.ledgerText, 't-bodystrong-14')}>
                      {inr(entry.amount)} · {entry.label}
                    </span>
                    {entry.stopped ? (
                      <span className={clsx(s.stopped, 't-body-14-med')}>Stopped</span>
                    ) : entry.action ? (
                      <button
                        className={clsx(s.ledgerAction, 't-body-14-med')}
                        onClick={() => {
                          if (entry.action?.kind === 'stop-divert') onDrain('drain-voicemail')
                          else openSheet({ kind: 'why', entryId: entry.id })
                        }}
                      >
                        {entry.action.label}
                      </button>
                    ) : null}
                  </motion.div>
                </Fragment>
              ))}
            </AnimatePresence>
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

        {/* A prototype control, labelled as one. */}
        <div className={s.sim}>
          <span className={clsx(s.simLabel, 't-caption-12', 't-secondary')}>
            Prototype controls — the trip is {live.dayOfPack} days in
          </span>
          <button className={clsx(s.ledgerAction, 't-body-14-med')} onClick={() => advanceDay(1)}>
            Advance a day
          </button>
          <button className={clsx(s.ledgerAction, 't-body-14-med')} onClick={() => advanceDay(3)}>
            Advance 3 days
          </button>
          <button
            className={clsx(s.ledgerAction, 't-body-14-med')}
            onClick={() => navigate('lock', 'jump')}
          >
            Lock screen
          </button>
        </div>
      </div>

      <Sheet
        open={Boolean(whyEntry)}
        onOpenChange={(v) => (v ? undefined : closeSheet())}
        title={whyEntry ? `${inr(whyEntry.amount)} · ${whyEntry.label}` : ''}
      >
        <div className={s.whyBody}>
          <p className="t-body-14">{whyEntry?.detail}</p>
          <p className="t-caption-12 t-secondary">
            Charges reach Airtel late, so this figure can still grow after you land in{' '}
            {country?.name ?? 'your destination'}.
          </p>
        </div>
      </Sheet>
    </Screen>
  )
}
