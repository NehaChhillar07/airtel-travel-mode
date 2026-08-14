import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { DeviceFrameContext } from './DeviceFrameContext'
import type { ViewportMode } from './useViewport'

/** Device frame size including the bezel, at 1:1. */
const FRAME_W = 411
const FRAME_H = 870

/** The design's logical width. Every fixed measurement in the app assumes it. */
const CANVAS_W = 393

interface DeviceFrameProps {
  children: ReactNode
  mode: ViewportMode
  /** Rendered above the phone: back button, screen name, rail toggle. */
  toolbar?: ReactNode
  /** Rendered below the phone. */
  caption?: ReactNode
}

/**
 * The phone. Owns scaling, the bezel, and the portal container.
 *
 * TWO SCALING MODES, and they scale different elements on purpose.
 *
 * `framed` scales the BEZEL: a 411x870 device shrunk to fit whatever room the
 * stage has, so the whole phone stays visible on a laptop.
 *
 * `bleed` scales the SCREEN STACK: the 393-wide canvas is blown up to the
 * device's real width and the logical height is derived from what is left. The
 * alternative — making forty components responsive — would have meant
 * relitigating every measurement taken off the Figma file, and a 343px card in
 * a 375px viewport leaves an 16px gutter where the design says 20. Scaling
 * keeps every proportion the designer drew and costs one transform: on a 375pt
 * SE the whole design is 0.954x, on a 430pt Pro Max 1.094x. It reads as a
 * bigger or smaller phone, which is what it is.
 *
 * Consequently a screen's logical HEIGHT is not 852 in bleed — it is whatever
 * the viewport divides down to (roughly 745 in Safari with its chrome showing,
 * 810 in Chrome on a Pixel). Screens are flex columns with a scrolling body, so
 * they already absorb that; nothing may assume 852.
 */
export function DeviceFrame({ children, mode, toolbar, caption }: DeviceFrameProps) {
  const stageRef = useRef<HTMLElement>(null)
  const stackRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)

  // The context value must be state, not a ref: a ref does not re-render, so
  // overlays mounted on first paint would receive null and fall back to body.
  useEffect(() => {
    setPortalEl(portalRef.current)
  }, [])

  const bleed = mode === 'bleed'

  useLayoutEffect(() => {
    const stack = stackRef.current

    /*
      Written straight to the element rather than held in state.
      `resize` fires on every scroll that moves a mobile address bar, and a
      re-render there would restart layout animations mid-flight.
    */
    const measureBleed = () => {
      if (!stack) return
      const w = window.innerWidth
      /*
        `innerHeight`, not `clientHeight`.

        On iOS Safari the layout viewport — which is what `clientHeight` and
        `100vh` report — is the height the page WOULD have with the address bar
        collapsed. Sizing the canvas to it while the bar is showing puts the
        bottom of every screen, which is where this design keeps its primary
        action, underneath the browser. `innerHeight` is the height actually on
        display and it updates as the bar collapses.
      */
      const h = window.innerHeight || document.documentElement.clientHeight
      const s = w / CANVAS_W
      stack.style.setProperty('--bleed-scale', String(s))
      stack.style.setProperty('--bleed-h', `${h / s}px`)
    }

    const measureFramed = () => {
      const el = stageRef.current
      if (!el) return
      const pad = window.innerWidth < 1000 ? 16 : 48
      const chrome = window.innerWidth < 1000 ? 96 : 116 // toolbar + caption
      const availW = el.clientWidth - pad
      const availH = el.clientHeight - chrome
      setScale(Math.min(1, availW / FRAME_W, availH / FRAME_H))
    }

    if (bleed) {
      setScale(1)
      measureBleed()
    } else {
      // Leave nothing behind for the framed branch to inherit.
      stack?.style.removeProperty('--bleed-scale')
      stack?.style.removeProperty('--bleed-h')
      measureFramed()
    }

    const measure = bleed ? measureBleed : measureFramed
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [bleed])

  return (
    <main className="stage" ref={stageRef}>
      {!bleed && toolbar}

      {/* In bleed the sizing and the transform both come off this pair: the
          screen stack is the viewport, and it does its own scaling. */}
      <div
        className="phone"
        style={bleed ? undefined : { width: FRAME_W * scale, height: FRAME_H * scale }}
      >
        <div
          className="phone__bezel"
          style={bleed ? undefined : { transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <div className="screenstack" ref={stackRef}>
            <DeviceFrameContext.Provider value={portalEl}>
              {children}
              {/*
                Overlay root. Last child so it stacks above the screen, inside
                the frame so `position: fixed` resolves against the bezel's
                transform rather than the viewport.
              */}
              <div ref={portalRef} id="device-portal" className="screenstack__portal" />
            </DeviceFrameContext.Provider>
          </div>
        </div>
      </div>

      {!bleed && caption}
    </main>
  )
}
