import clsx from 'clsx'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { spring } from '../../motion/presets'
import { useUiStore } from '../../state/uiStore'
import { AirtelAppIcon } from '../icons/AirtelAppIcon'
import s from './Notification.module.css'

export type NotificationTone = 'neutral' | 'success' | 'alert'

interface NotificationProps {
  app?: string
  at?: string
  title: string
  body?: string
  tone?: NotificationTone
  /** Lock-screen styling: dark, translucent, on a wallpaper. */
  onDark?: boolean
  onPress?: () => void
  onDismiss?: () => void
}

const TONE: Record<NotificationTone, string> = {
  neutral: s.toneNeutral,
  success: s.toneSuccess,
  alert: s.toneAlert,
}

/** One banner. Draggable upward to dismiss, the way iOS does it. */
export function Notification({
  app = 'Airtel',
  at = 'now',
  title,
  body,
  tone = 'neutral',
  onDark,
  onPress,
  onDismiss,
}: NotificationProps) {
  return (
    <motion.div
      layout
      className={clsx(s.banner, TONE[tone], onDark && [s.onDark, 'ios-glass'])}
      initial={{ opacity: 0, y: -70, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.96 }}
      transition={spring.bouncy}
      drag="y"
      dragConstraints={{ top: -200, bottom: 0 }}
      dragElastic={{ top: 0.6, bottom: 0 }}
      onDragEnd={(_, info) => {
        // Distance or flick — either should dismiss.
        if (info.offset.y < -40 || info.velocity.y < -400) onDismiss?.()
      }}
      onClick={onPress}
      role={onPress ? 'button' : undefined}
      tabIndex={onPress ? 0 : undefined}
      onKeyDown={
        onPress
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onPress()
              }
            }
          : undefined
      }
    >
      {/* The mark is how iOS says which app posted this, so it is the real app
          icon rather than a letter in a red box. */}
      <span className={s.icon}>
        <AirtelAppIcon size={onDark ? 53 : 38} />
      </span>
      <span className={s.body}>
        <span className={s.head}>
          <span className={clsx(s.title, 'ios-title')}>{title}</span>
          <span className={clsx(s.at, onDark ? 'ios-body' : 'ios-caption')}>{at}</span>
        </span>
        <span className={clsx(s.app, 'ios-caption')}>{app}</span>
        {body && <span className={clsx(s.text, 'ios-body')}>{body}</span>}
      </span>
    </motion.div>
  )
}

/**
 * In-app toasts, rendered into the device portal so they stay inside the phone.
 */
export function Toaster() {
  const toasts = useUiStore((x) => x.toasts)
  const dismissToast = useUiStore((x) => x.dismissToast)

  // One timer per toast, cleared on unmount so a dismissed toast does not
  // fire a second dismiss for whatever took its place.
  useEffect(() => {
    const timers = toasts.map((t) => setTimeout(() => dismissToast(t.id), t.ttlMs))
    return () => timers.forEach(clearTimeout)
  }, [toasts, dismissToast])

  return (
    <div className={s.stack}>
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <Notification
            key={t.id}
            title={t.title}
            body={t.body}
            tone={t.tone}
            at="now"
            onDismiss={() => dismissToast(t.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
