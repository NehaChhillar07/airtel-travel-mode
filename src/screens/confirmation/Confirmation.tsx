import clsx from 'clsx'
import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Accordion } from 'radix-ui'
import { COPY, FAQ, HOME, TIMELINE } from '../../data'
import { formatOrdinalShort, nextBillDate, toISO, today } from '../../lib/dates'
import { fill, inr } from '../../lib/format'
import { ease, spring } from '../../motion/presets'
import { useCurrentCountry, useDestinations, useSelectedPack, useTripDays } from '../../state/selectors'
import { useTripStore } from '../../state/tripStore'
import { useQuickActionNav, useUiStore } from '../../state/uiStore'
import { AppHeader, StatusBar, TileRow } from '../../ui/Chrome/Chrome'
import { Switch } from '../../ui/Controls/Controls'
import { MARK_DONE, PackConfirmedMark } from '../../ui/Glyph/PackConfirmed'
import { WhatsAppGlyph } from '../../ui/Glyph/WhatsApp'
import { Screen } from '../../ui/Screen/Screen'
import { ConfirmedStamp } from './ConfirmedStamp'
import s from './Confirmation.module.css'

/**
 * The whole arrival sequence in one place, in seconds, so it can be re-timed
 * without hunting through the tree. Everything after `stamp` is derived from
 * it, so moving the landing moves the rest with it.
 *
 * The mark's own three beats (lozenge, outline, tick) live inside
 * PackConfirmedMark and end at MARK_DONE.
 */
const STAMP = MARK_DONE + 0.04
const BEAT = {
  stamp: STAMP,
  /** The mark answers the hit. Slightly after contact, not on it. */
  recoil: STAMP + 0.04,
  title: STAMP + 0.14,
  timeline: STAMP + 0.28,
  sheen: STAMP + 0.52,
  setup: STAMP + 0.77,
  rows: STAMP + 0.88,
}

/** The 24px green tick the card rows lead with. */
function Tick() {
  return (
    <span className={s.tick}>
      <Check size={14} strokeWidth={2.6} aria-hidden="true" />
    </span>
  )
}

/**
 * 04.7 Confirmation — and the "purchase confirmation" hero set piece.
 *
 * src/motion/nav.ts names four set pieces as deliberately unbuilt: "Travel
 * Mode activation, usage progress, purchase confirmation, arrival… which come
 * later and have their own spec." This is that one.
 *
 * The spec here is a subtraction. This is a POSTPAID flow: nothing has been
 * charged, the ₹2,999 lands on a bill on the 2nd of next month, and the pack
 * does not even start until the phone registers abroad. So the screen must not
 * borrow the vocabulary of a payment receipt — an overshooting tick, a ring
 * blooming out behind it, everything landing at once on a completed beat. Read
 * that way, users believe money has moved, and this screen's whole job is to
 * say the opposite.
 *
 * What it does instead: the mark assembles (card, then tick — "this is your
 * pack, and it is confirmed"), the CONFIRMED stamp lands on it and the mark
 * recoils from the hit, then the timeline draws DOWNWARD into the future, dot
 * by dot, with the two later dots left hollow. The rail extending is the "on
 * its way" gesture; the hollow dots are the "not yet" one. The "Nothing has
 * been paid yet" line arrives on its own late beat so the eye lands on it
 * rather than skimming past.
 *
 * The stamp is the one loud beat and it is allowed to be, because it carries a
 * word — see the note in ConfirmedStamp.tsx for why CONFIRMED can stamp when a
 * bare tick cannot. Nothing loops, nothing pulses, and the whole sequence is
 * over inside 1.9s.
 */
export function Confirmation() {
  const reduced = useReducedMotion()
  const pack = useSelectedPack()
  const days = useTripDays()
  const destinations = useDestinations()
  const currentCountry = useCurrentCountry()
  const range = useTripStore((x) => x.range)
  const autoTopUp = useTripStore((x) => x.autoTopUp)
  const setAutoTopUp = useTripStore((x) => x.setAutoTopUp)
  const navigate = useUiStore((x) => x.navigate)
  const quickAction = useQuickActionNav()

  const country = destinations[0]?.name ?? currentCountry?.name ?? 'Singapore'
  const billIso = nextBillDate(toISO(today()))

  const tokens = {
    departShort: range.from ? formatOrdinalShort(range.from) : '—',
    billShort: formatOrdinalShort(billIso),
    tripDays: days,
    price: pack ? inr(pack.priceExGst) : '—',
    validity: pack?.validityDays ?? 0,
  }

  const stagger = reduced ? 0 : 0.09

  return (
    <Screen
      scrollKey="confirmation"
      top={
        <>
          <StatusBar />
          <AppHeader />
          <TileRow items={HOME.quickActions} activeId="travel" onSelect={quickAction} />
        </>
      }
    >
      <div className={s.hero}>
        <header className={s.heroHead}>
          <div className={s.markRow}>
            {/* The recoil. Without it the stamp and the mark are two animations
                happening near each other; with it they are one impact. */}
            <motion.div
              initial={false}
              animate={reduced ? {} : { scale: [1, 0.955, 1] }}
              transition={{ duration: 0.3, delay: BEAT.recoil, ease: ease.out }}
            >
              <PackConfirmedMark />
            </motion.div>

            <span className={s.stampSlot}>
              <ConfirmedStamp
                label={COPY.confirmation.stamp}
                at={BEAT.stamp}
                sheenAt={BEAT.sheen}
              />
            </span>
          </div>

          <motion.h1
            className={clsx(s.heroTitle, 't-title-24')}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: BEAT.title, duration: 0.32, ease: ease.out }}
          >
            {fill(COPY.confirmation.hero, { country })}
          </motion.h1>
        </header>

        <div className={s.timeline}>
          {TIMELINE.map((step, i) => {
            const at = BEAT.timeline + i * stagger
            return (
              <motion.div
                className={s.tlRow}
                key={step.id}
                initial={reduced ? false : { opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: at, duration: 0.3, ease: ease.out }}
              >
                <span className={clsx(s.tlWhen, 't-body-14-med')}>{fill(step.when, tokens)}</span>

                <span className={s.tlMark} aria-hidden="true">
                  {/* The rail draws downward out of each dot and into the next
                      row — the screen's "and then this happens" gesture. */}
                  {i < TIMELINE.length - 1 && (
                    <motion.span
                      className={s.tlLine}
                      initial={reduced ? false : { scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: at + 0.08, duration: 0.28, ease: ease.out }}
                    />
                  )}
                  {/* `gentle`, not `bouncy`. Overshoot on a tick is what makes
                      this read as a payment landing. */}
                  <motion.span
                    className={s.tlDot}
                    data-tone={step.tone}
                    initial={reduced ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ ...spring.gentle, delay: at }}
                  />
                </span>

                <span className={s.tlText}>
                  <span className="t-bodystrong-14">{fill(step.title, tokens)}</span>
                  {step.body && (
                    <motion.span
                      className={clsx(s.tlBody, 't-caption-12')}
                      initial={reduced ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: at + 0.14, duration: 0.26, ease: ease.out }}
                    >
                      {fill(step.body, tokens)}
                    </motion.span>
                  )}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>

      <motion.div
        className={s.setupSection}
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: BEAT.setup, duration: 0.34, ease: ease.out }}
      >
        <div className={s.setupCard}>
          <div className={s.checkedRow}>
            <Tick />
            <span className={s.rowText}>
              <span className="t-value-16-bold">{COPY.confirmation.setupTitle}</span>
              <span className={clsx(s.rowBody, 't-caption-12')}>
                {COPY.confirmation.setupBody}
              </span>
            </span>
          </div>

          <div className={s.cardLower}>
            <div className={s.helpRow}>
              <Tick />
              <span className={s.rowText}>
                <span className="t-value-16-bold">{COPY.confirmation.helpCardTitle}</span>
                <span className={clsx(s.rowBody, 't-caption-12')}>
                  {fill(COPY.confirmation.helpCardBody, { country })}
                </span>
              </span>
            </div>

            <div className={s.helpCard}>
              <span className={clsx(s.helpLabel, 't-label-12')}>{COPY.dashboard.helpTitle}</span>

              {/* The one route into 05.1 from this screen. */}
              <button className={s.trouble} onClick={() => navigate('setup')}>
                <span className="t-bodystrong-14 t-inverse">
                  {COPY.confirmation.troubleTitle}
                </span>
                <span className="t-caption-12 t-inverse">{COPY.confirmation.helpTitle}</span>
                <ChevronRight
                  className={s.troubleChevron}
                  size={24}
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>

              <hr className={s.helpRule} />

              <div className={s.helpNumberBlock}>
                <span className={clsx(s.helpNumber, 't-title-24')}>
                  {COPY.dashboard.helpNumber}
                </span>
                <span className={clsx(s.helpSub, 't-caption-12')}>{COPY.dashboard.helpSub}</span>
              </div>

              <div className={s.helpBtns}>
                {/* No icon on this one — the frame gives it a bare label, and
                    the number it dials is set in 24px directly above it. */}
                <button
                  className={clsx(s.helpBtn, 't-value-16-med')}
                  aria-label={`${COPY.setup.callFree} — calls ${COPY.dashboard.helpNumber}`}
                >
                  {COPY.setup.callFree}
                </button>
                <button className={clsx(s.helpBtn, s.helpBtnGhost, 't-value-16-med')}>
                  <WhatsAppGlyph size={20} />
                  {COPY.setup.whatsapp}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className={s.rows}
        initial={reduced ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: BEAT.rows, duration: 0.34, ease: ease.out }}
      >
        <section className={s.row}>
          <div className={s.rowHead}>
            <span className={clsx(s.rowTitle, 't-value-16-bold')}>
              {COPY.confirmation.autoTopUpTitle}
            </span>
            <Switch
              checked={autoTopUp}
              onCheckedChange={setAutoTopUp}
              label={COPY.confirmation.autoTopUpTitle}
            />
          </div>
          <span className={clsx(s.rowNote, 't-caption-12')}>
            {fill(COPY.confirmation.autoTopUpBody, {
              validity: pack?.validityDays ?? 0,
              price: pack ? inr(pack.priceExGst) : '—',
            })}
          </span>
        </section>

        <section className={s.row}>
          <div className={s.rowHead}>
            <span className={clsx(s.rowTitle, 't-value-16-bold')}>
              {COPY.confirmation.cancelTitle}
            </span>
          </div>
          <span className={clsx(s.rowNote, 't-caption-12')}>{COPY.confirmation.cancelBody}</span>
          <button
            className={clsx(s.linkRow, 't-body-14-med')}
            onClick={() => navigate('packs', 'pop')}
          >
            {COPY.confirmation.cancelAction}
            <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </section>

        {/*
          The file draws these last two as bare rows that go nowhere. Real
          answers, in an accordion, cost nothing and make the screen useful.
        */}
        <Accordion.Root type="single" collapsible className={s.rowGroup}>
          <Accordion.Item className={s.row} value="pack">
            <Accordion.Header>
              <Accordion.Trigger className={s.rowHead}>
                <span className={clsx(s.rowTitle, 't-value-16-bold')}>
                  {COPY.confirmation.whatsInPack}
                </span>
                <ChevronDown className={s.disclosure} size={20} aria-hidden="true" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className={s.answers}>
              {(pack?.perks ?? []).map((perk) => (
                <span className="t-caption-12 t-secondary" key={perk}>
                  {perk}
                </span>
              ))}
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item className={clsx(s.row, s.rowLast)} value="faq">
            <Accordion.Header>
              <Accordion.Trigger className={s.rowHead}>
                <span className={clsx(s.rowTitle, 't-value-16-bold')}>
                  {COPY.confirmation.faqTitle}
                </span>
                <ChevronDown className={s.disclosure} size={20} aria-hidden="true" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className={s.answers}>
              {FAQ.slice(0, 5).map((entry) => (
                <span key={entry.id}>
                  <span className={clsx(s.answerQ, 't-body-14-med')}>{entry.question}</span>
                  <br />
                  <span className="t-caption-12 t-secondary">{entry.answer}</span>
                </span>
              ))}
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>

        {/* A prototype affordance, not part of the frame. */}
        <button className={clsx(s.skip, 't-body-14-med')} onClick={() => navigate('connected')}>
          Skip ahead: you have landed in {country}
          <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </motion.div>
    </Screen>
  )
}
