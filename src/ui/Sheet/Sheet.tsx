import clsx from 'clsx'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { Drawer } from 'vaul'
import { scrim } from '../../motion/presets'
import { usePortalContainer } from '../../app/DeviceFrameContext'
import s from './Sheet.module.css'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Rich rather than plain, because 04.5 sets "excl GST" smaller than the price. */
  title: ReactNode
  /** Hides the visible title but keeps it for screen readers. */
  hideTitle?: boolean
  description?: string
  children: ReactNode
  /**
   * Sits where the close button would. 04.5 draws the validity chip there and
   * no X at all, leaving the grabber, the scrim and Esc to dismiss the sheet.
   */
  trailing?: ReactNode
  footer?: ReactNode
  /** For a footer whose padding is drawn on the screen rather than the sheet. */
  footerClassName?: string
  /** Fractions of the screen the sheet rests at. */
  snapPoints?: (number | string)[]
  dismissible?: boolean
}

/**
 * The one place vaul is configured.
 *
 * Screens never touch `Drawer.Portal` directly, because getting `container`
 * wrong is invisible until it isn't: the default portals to `document.body`,
 * which escapes the phone entirely and slides a sheet up from the bottom of
 * the browser window. See DeviceFrameContext for the full explanation.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  hideTitle,
  description,
  children,
  trailing,
  footer,
  footerClassName,
  snapPoints,
  dismissible = true,
}: SheetProps) {
  const container = usePortalContainer()

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      dismissible={dismissible}
      snapPoints={snapPoints}
      // The scroll lock is scoped to the device, not the page — the presenter
      // shell around the phone must stay usable while a sheet is open.
      modal={false}
    >
      <Drawer.Portal container={container ?? undefined}>
        <motion.div
          className={s.scrim}
          variants={scrim}
          initial="hidden"
          animate="show"
          exit="exit"
          onClick={() => dismissible && onOpenChange(false)}
        />
        <Drawer.Content className={s.content} aria-describedby={description ? undefined : ''}>
          <div className={s.handleWrap}>
            <div className={s.handle} />
          </div>

          <div className={s.head}>
            <Drawer.Title className={clsx('t-title-24', hideTitle && 'sr-only')}>
              {title}
            </Drawer.Title>
            {description && (
              <Drawer.Description className="sr-only">{description}</Drawer.Description>
            )}
            {trailing ??
              (dismissible && (
                <button className={s.close} onClick={() => onOpenChange(false)} aria-label="Close">
                  <X size={18} strokeWidth={2.2} aria-hidden="true" />
                </button>
              ))}
          </div>

          <div className={s.body}>{children}</div>

          {footer && <div className={clsx(s.foot, footerClassName)}>{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
