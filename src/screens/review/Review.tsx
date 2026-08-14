import clsx from 'clsx'
import { Check, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { COPY } from '../../data'
import { dueDate, formatBillDate, nextBillDate, toISO, today } from '../../lib/dates'
import { contentsLine, fill, inr, maskMsisdn, pluralise, validityLabel } from '../../lib/format'
import {
  useDestinations,
  useRecommendation,
  useSelectedPack,
  useTotals,
  useTripDays,
} from '../../state/selectors'
import { useTripStore } from '../../state/tripStore'
import { useUiStore } from '../../state/uiStore'
import { Button } from '../../ui/Button/Button'
import { NavBar, StatusBar } from '../../ui/Chrome/Chrome'
import { Flag } from '../../ui/Flag/Flag'
import { Money } from '../../ui/Money/Money'
import { Screen } from '../../ui/Screen/Screen'
import s from './Review.module.css'

/**
 * 04.6 Review and billing.
 *
 * Every figure is computed rather than typed, but the rate is set to match the
 * screen as drawn: ₹2,999 + ₹520 = ₹3,519. The line is labelled "GST" with no
 * percentage, exactly as the source does — see src/lib/pricing.ts for the note
 * on the statutory rate.
 *
 * The pack block is laid out here rather than through `PackCard`. The frame
 * draws `Frame 64` as its own thing — price and validity on one line, contents
 * under them, a rule, then the reason — and it is not the card that appears on
 * 04.4. Reusing the card meant carrying its chrome onto a screen that does not
 * draw it.
 */
export function Review() {
  const pack = useSelectedPack()
  const totals = useTotals()
  const days = useTripDays()
  const destinations = useDestinations()
  const msisdn = useTripStore((x) => x.msisdn)
  const confirm = useTripStore((x) => x.confirm)

  const navigate = useUiStore((x) => x.navigate)
  const back = useUiStore((x) => x.back)

  const [committing, setCommitting] = useState(false)

  const recommendation = useRecommendation()
  const reason = recommendation?.pack.id === pack?.id ? recommendation?.reason : undefined

  const billIso = nextBillDate(toISO(today()))
  const billLabel = formatBillDate(billIso)
  const dueLabel = formatBillDate(dueDate(billIso))

  if (!pack) {
    return (
      <Screen top={<><StatusBar /><NavBar title={COPY.review.navTitle} onBack={back} /></>}>
        <div className={s.body}>
          <p className="t-body-14 t-secondary">No pack selected yet.</p>
          <Button onClick={() => navigate('packs', 'pop')}>Choose a pack</Button>
        </div>
      </Screen>
    )
  }

  /** Simulated latency, so committing money reads as something that happened. */
  function commit() {
    setCommitting(true)
    setTimeout(() => {
      confirm()
      setCommitting(false)
      navigate('confirmation')
    }, 900)
  }

  return (
    <Screen
      scrollKey="review"
      top={
        <>
          <StatusBar />
          <NavBar
            title={COPY.review.navTitle}
            onBack={back}
            trailing={
              /* `Destination` — three flags and the day count as one line. */
              <span className={s.headerChip}>
                <span className={s.flags}>
                  {destinations.slice(0, 3).map((c) => (
                    <Flag key={c.iso2} country={c} size={20} />
                  ))}
                </span>
                <span className="t-heading-18">
                  {days} {pluralise(days, 'Day', 'Days')}
                </span>
              </span>
            }
          />
        </>
      }
      bottom={
        <div className={s.bottom}>
          {/* Blue, not the house black. It is the one CTA in the file drawn in
              `text/link` — noted in DIVERGENCES because the Foundations board
              says that token is "text actions only, never used as a fill". */}
          <Button full variant="commit" loading={committing} onClick={commit}>
            {fill(COPY.review.cta, { total: inr(totals.total), billDate: billLabel })}
          </Button>
          <span className={clsx(s.caption, 't-body-14')}>
            {fill(COPY.review.caption, { msisdn })}
          </span>
        </div>
      }
    >
      <div className={s.body}>
        {/* ------------------------------------------------------ your pack */}
        <section className={s.panel}>
          <h2 className="t-label-12">{COPY.review.yourPack}</h2>
          <button
            className={clsx(s.panelChange, 't-caption-12-semi')}
            onClick={() => navigate('packs', 'pop')}
          >
            {COPY.common.change}
          </button>

          <div className={s.pack}>
            <div className={s.packLead}>
              <div className={s.packPrice}>
                <span className="t-title-24">{inr(pack.priceExGst)}</span>
                <span className="t-value-16-med">{validityLabel(pack)}</span>
              </div>
              <span className={clsx(s.packContents, 't-body-14-med')}>
                {contentsLine(pack)}
              </span>
            </div>

            {reason && (
              <>
                <hr className={s.rule} />
                <div className={s.packReason}>
                  <Check className={s.packTick} size={16} strokeWidth={1.33} aria-hidden="true" />
                  <span className="t-caption-12">{reason}</span>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ----------------------------------------------------- charged to */}
        <section className={clsx(s.panel, s.panelAccent)}>
          <h2 className="t-label-12">{COPY.review.chargedTo}</h2>
          <button
            className={clsx(s.panelChange, 't-caption-12-semi')}
            onClick={() => navigate('packs', 'pop')}
          >
            {COPY.common.change}
          </button>

          <div className={s.charged}>
            <span className={s.chargedIcon}>
              <Smartphone size={24} strokeWidth={2} aria-hidden="true" />
            </span>
            <span className={s.chargedText}>
              <span className="t-body-14-med">{COPY.review.postpaidBill}</span>
              <span className="t-bodystrong-14">{maskMsisdn(msisdn)}</span>
            </span>
          </div>
        </section>

        {/* ----------------------------------------------------------- bill */}
        <section className={s.bill}>
          <div className={s.billLines}>
            <div className={s.billRow}>
              <span className={clsx(s.billLabel, 't-body-14-med')}>{COPY.review.packLine}</span>
              <span className="t-bodystrong-14 t-nums">{inr(totals.subtotal)}</span>
            </div>
            <div className={s.billRow}>
              <span className={clsx(s.billLabel, 't-body-14-med')}>{COPY.review.gstLine}</span>
              <span className="t-bodystrong-14 t-nums">{inr(totals.gst)}</span>
            </div>
          </div>

          <hr className={s.rule} />

          <div className={s.billRow}>
            <span className={clsx(s.billTotalLabel, 't-label-12')}>{COPY.review.totalLine}</span>
            <span className="t-bodystrong-14">
              <Money value={totals.total} delay={0.16} aria-live="polite" />
            </span>
          </div>

          <span className={clsx(s.billNote, 't-caption-12')}>
            <span className={clsx(s.billNoteLead, 't-caption-12-semi')}>
              {fill(COPY.review.explainLead, { billDate: billLabel, dueDate: dueLabel })}
            </span>{' '}
            {COPY.review.explainRest}
          </span>
        </section>
      </div>
    </Screen>
  )
}
