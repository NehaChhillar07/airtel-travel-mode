import clsx from 'clsx'
import { useEffect, useRef, type ReactNode } from 'react'
import s from './Screen.module.css'

interface ScreenProps {
  children: ReactNode
  /** Sticky chrome: status bar, nav bar, header. */
  top?: ReactNode
  /** Sticky action bar. */
  bottom?: ReactNode
  background?: 'page' | 'card' | 'raised' | 'ink'
  /** Blur the top chrome so content shows through as it scrolls under. */
  glassTop?: boolean
  transparentBottom?: boolean
  /** Reset scroll when this changes. Defaults to on-mount only. */
  scrollKey?: string
  className?: string
}

export function Screen({
  children,
  top,
  bottom,
  background = 'page',
  glassTop,
  transparentBottom,
  scrollKey,
  className,
}: ScreenProps) {
  const bodyRef = useRef<HTMLDivElement>(null)

  // Every navigation starts at the top of the new screen.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 })
  }, [scrollKey])

  return (
    <div className={clsx(s.screen, s[background], className)}>
      {/* `data-chrome` so motion can measure where the sticky chrome ends
          without reaching for a CSS-module hash — the short home -> travel
          transition needs to know where the body starts. */}
      {top && (
        <div className={clsx(s.top, glassTop && s.topGlass)} data-chrome="top">
          {top}
        </div>
      )}
      <div className={s.body} ref={bodyRef}>
        {children}
      </div>
      {bottom && (
        <div className={clsx(s.bottom, transparentBottom && s.bottomTransparent)}>{bottom}</div>
      )}
    </div>
  )
}

/** The 353px content column the whole design is built on. */
export function Gutter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx(s.gutter, className)}>{children}</div>
}
