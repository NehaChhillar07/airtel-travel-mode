import clsx from 'clsx'
import { animate as motionAnimate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useEffect, useRef, type ReactNode } from 'react'
import { spring } from '../../motion/presets'
import s from './primitives.module.css'

/* ------------------------------------------------------------------- Card */

export type CardTone =
  | 'plain'
  | 'surface'
  | 'raised'
  | 'info'
  | 'alert'
  | 'success'
  | 'outlined'
  | 'glass'

const CARD_TONE: Record<CardTone, string> = {
  plain: s.cardPlain,
  surface: s.cardSurface,
  raised: s.cardRaised,
  info: s.cardInfo,
  alert: s.cardAlert,
  success: s.cardSuccess,
  outlined: s.cardOutlined,
  glass: s.cardGlass,
}

export function Card({
  tone = 'surface',
  padding = 'md',
  children,
  className,
  ...rest
}: {
  tone?: CardTone
  padding?: 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        s.card,
        CARD_TONE[tone],
        padding === 'sm' && s.padSm,
        padding === 'lg' && s.padLg,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ Badge */

export type BadgeTone = 'neutral' | 'alert' | 'brand' | 'success'

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: s.badgeNeutral,
  alert: s.badgeAlert,
  brand: s.badgeBrand,
  success: s.badgeSuccess,
}

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone
  children: ReactNode
  className?: string
}) {
  return (
    <span className={clsx(s.badge, BADGE_TONE[tone], 't-caption-12-semi', className)}>
      {children}
    </span>
  )
}

/* ---------------------------------------------------------------- Divider */

export function Divider({ inset, className }: { inset?: boolean; className?: string }) {
  return <hr className={clsx(s.divider, inset && s.dividerInset, className)} />
}

/* ---------------------------------------------------------------- Section */

export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={clsx(s.section, className)}>
      {(title || action) && (
        <header className={s.sectionHead}>
          {title && <h2 className="t-label-12">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

/* ------------------------------------------------------------- EmptyState */

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode
  title: string
  body?: string
  action?: ReactNode
}) {
  return (
    <div className={s.empty}>
      {icon && <span className={s.emptyIcon}>{icon}</span>}
      <p className="t-value-16-med">{title}</p>
      {body && <p className="t-body-14 t-secondary">{body}</p>}
      {action}
    </div>
  )
}

/* --------------------------------------------------------------- Skeleton */

export function Skeleton({
  variant = 'text',
  width,
  className,
}: {
  variant?: 'text' | 'block'
  width?: number | string
  className?: string
}) {
  return (
    <div
      className={clsx(s.skeleton, variant === 'text' ? s.skeletonText : s.skeletonBlock, className)}
      style={{ width }}
      aria-hidden="true"
    />
  )
}

/* ------------------------------------------------------------ ProgressBar */

export function ProgressBar({
  value,
  tone = 'neutral',
  label,
  animate = true,
  animateOnMount = true,
  drain = false,
  className,
}: {
  /** 0..1. Always how much of the bar is painted, whatever it represents. */
  value: number
  tone?: 'neutral' | 'alert' | 'success'
  label?: string
  animate?: boolean
  /**
   * Start full and empty down to `value` instead of filling up to it.
   *
   * For a meter reporting what is LEFT, the direction is the message: a bar
   * that grows says "you have got this far", and an allowance does the
   * opposite. Only the origin of the animation changes — where it lands, and
   * everything about the resting state, is `value` either way.
   */
  /**
   * Off where the bar is a fact the screen arrives already knowing — the trip
   * dashboard, where three bars draining on entry moved the whole screen
   * before any of it could be read. The bar is simply at its figure, and later
   * changes still animate, because those are answers to something you did.
   */
  animateOnMount?: boolean
  drain?: boolean
  /** For callers that set their own height — 05.5 draws its bars at 4px. */
  className?: string
}) {
  const reduced = useReducedMotion()
  const clamped = Math.max(0, Math.min(1, value))

  /*
    One move, not three.

    The bar used to be a plain `animate={{ scaleX }}`, which re-aimed the
    spring every time `value` changed — and on the dashboard it changes twice
    before the screen has settled: the first paint reports 81 minutes left, the
    scenario lands, and the real 45 arrives while the spring is already in
    flight. What you saw was a drain that set off, stalled halfway, and set off
    again. Read as a bug, because it looks exactly like one.

    So the first move waits out a settle window. Re-targets inside it only
    change where the bar is going, and nothing has visibly moved yet, so the
    screen makes a single clean pass from full to its figure. Every change
    after that animates immediately — rewinding to an earlier day should move
    the bar the moment you tap, and it should move *up*, because you had more
    left then. Direction is data, never a setting.
  */
  const SETTLE = 0.34
  const still = !animate || reduced || !animateOnMount
  const scaleX = useMotionValue(still ? clamped : drain ? 1 : 0)
  const firstRun = useRef(true)

  useEffect(() => {
    if (!animate || reduced || (firstRun.current && !animateOnMount)) {
      scaleX.set(clamped)
      firstRun.current = false
      return
    }
    const controls = motionAnimate(scaleX, clamped, {
      ...spring.gentle,
      delay: firstRun.current ? SETTLE : 0,
    })
    firstRun.current = false
    return () => controls.stop()
  }, [clamped, animate, animateOnMount, reduced, scaleX])

  return (
    <motion.div
      className={clsx(
        s.progress,
        tone === 'alert' && s.progressAlert,
        tone === 'success' && s.progressSuccess,
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      /*
        Two breaths, then still. A bar that has run down should catch the eye
        once; one that keeps pulsing becomes wallpaper, and this screen has
        three of them. Drawn as a box-shadow on the track, which — unlike
        anything inside it — is not clipped by the track's own overflow.
      */
      animate={
        drain && tone === 'alert' && !reduced
          ? { boxShadow: ['0 0 0 0 rgba(178, 32, 32, 0)', '0 0 0 4px rgba(178, 32, 32, 0.22)', '0 0 0 0 rgba(178, 32, 32, 0)'] }
          : undefined
      }
      transition={{ duration: 1.6, times: [0, 0.4, 1], repeat: 1, delay: 0.9 }}
    >
      <motion.div className={s.progressFill} style={{ width: '100%', scaleX }} />
    </motion.div>
  )
}
