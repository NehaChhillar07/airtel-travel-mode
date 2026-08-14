import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { COPY } from '../../data'
import { pluralise } from '../../lib/format'
import { dur, ease, listItem, spring, staggerList } from '../../motion/presets'
import { WhatsAppGlyph } from '../Glyph/WhatsApp'
import { TripRail } from './parts/TripRail'
import { UsageChips } from './parts/UsageChips'
import s from './LiveActivity.module.css'

const PLANE = '/assets/3e8278c3fbfc59526de63bff0bbddf3ead6744b5.png'

export interface LiveActivityProps {
  country: string
  dayOfTrip: number
  tripDays: number
  /** Days including today, which is what both states count down. */
  daysToGo: number
  /** Which of TripRail's four moments you are at. */
  stepIndex: number
  /** Fraction of the trip behind you, 0..1 — the collapsed bar. */
  progress: number
  minsLeft: number | null
  smsLeft: number | null
  /** Roaming charges the pack did not cover. Chip appears only above zero. */
  extraSpend: number
  expanded: boolean
  onToggle: () => void
  /** Tapping a Live Activity opens the app, so the title band does. */
  onOpen: () => void
  onBuyPack: () => void
}

const body = staggerList(0.06, 0.12)

/**
 * 05.12 — the trip as a Live Activity.
 *
 * Two states of one surface, not two components: the collapsed pill and the
 * expanded card share a `layoutId`, so width, height and radius animate as a
 * single element morphing rather than two things crossfading in place. That is
 * what the Dynamic Island does, and it is the set piece this screen exists to
 * show.
 *
 * Collapsed is iOS's material — glass over the wallpaper, Inter, the system's
 * type. Expanded is Airtel's surface, because a Live Activity is drawn by the
 * app that owns it. The two are meant to look like different things.
 */
export function LiveActivity({
  country,
  dayOfTrip,
  tripDays,
  daysToGo,
  stepIndex,
  progress,
  minsLeft,
  smsLeft,
  extraSpend,
  expanded,
  onToggle,
  onOpen,
  onBuyPack,
}: LiveActivityProps) {
  return (
    <motion.div
      layoutId="live-activity"
      className={clsx(s.island, expanded ? s.expanded : [s.collapsed, 'ios-glass'])}
      transition={spring.gentle}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      aria-label="Trip Live Activity"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {expanded ? (
          <motion.div
            key="expanded"
            className={s.card}
            variants={body}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, transition: { duration: dur.fast } }}
          >
            <button className={s.head} onClick={onOpen}>
              <span className={s.headLeft}>
                {/* The one thing on the widget that says the trip is running
                    now rather than being reported afterwards. */}
                <motion.span
                  className={s.liveDot}
                  aria-hidden="true"
                  animate={{ opacity: [1, 0.35, 1], scale: [1, 0.86, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: ease.inOut }}
                />
                <img className={s.headEmoji} src="/assets/emoji/airplane.png" alt="" />
                <span className="t-bodystrong-14 t-inverse">Live in {country}</span>
              </span>
              <span className={clsx('ios-title', 't-inverse', 't-nums')}>
                Day {dayOfTrip} of {tripDays}
              </span>
            </button>

            <div className={s.body}>
              <motion.h3 className={clsx(s.title, 't-title-24')} variants={listItem}>
                {daysToGo} {pluralise(daysToGo, 'day', 'days')} to go
              </motion.h3>

              <motion.div variants={listItem}>
                <TripRail stepIndex={stepIndex} />
              </motion.div>

              <UsageChips
                minsLeft={minsLeft}
                smsLeft={smsLeft}
                extraSpend={extraSpend}
              />

              <motion.div className={s.actions} variants={listItem}>
                <button
                  className={clsx(s.action, s.actionPrimary, 't-value-16-med')}
                  onClick={(e) => {
                    e.stopPropagation()
                    onBuyPack()
                  }}
                >
                  Buy this pack
                </button>
                <a
                  className={clsx(s.action, s.actionSecondary, 't-value-16-med')}
                  href={`https://wa.me/${COPY.dashboard.helpNumber.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <WhatsAppGlyph size={20} />
                  Whatsapp
                </a>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            className={s.pill}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur.fast }}
          >
            {/* Mirrored, as the frame draws it — nose out of the pill, into
                the trip rather than along the bar beside it. */}
            <img className={s.pillPlane} src={PLANE} alt="" />
            <span className={s.bar} aria-hidden="true">
              <motion.span
                className={s.barFill}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(progress * 100)}%` }}
                transition={{ duration: 0.7, ease: ease.out, delay: 0.1 }}
              />
            </span>
            <span className={clsx('ios-title', 't-inverse', 't-nums')}>
              {daysToGo} {pluralise(daysToGo, 'day', 'days')} left
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
