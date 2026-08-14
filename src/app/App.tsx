import { useEffect } from 'react'
import { MotionConfig } from 'motion/react'
import { DeviceFrame } from './DeviceFrame'
import { IndexRail } from './IndexRail'
import { ScreenHost } from './ScreenHost'
import { ROUTES, motionNoteFor } from './routes'
import { useHashRoute } from './useHashRoute'
import { useIndexSync } from './useIndexSync'
import { useViewport } from './useViewport'
import { useUiStore } from '../state/uiStore'
import '../styles/app.css'

export function App() {
  useHashRoute()
  useIndexSync()

  const route = useUiStore((s) => s.route)
  const figmaEntry = useUiStore((s) => s.figmaEntry)
  const history = useUiStore((s) => s.history)
  const back = useUiStore((s) => s.back)
  const railOpen = useUiStore((s) => s.railOpen)
  const setRailOpen = useUiStore((s) => s.setRailOpen)
  const replayMotion = useUiStore((s) => s.replayMotion)

  /* Only screens with a set piece get the Replay button — on the rest there
     would be nothing to watch happen. */
  const motionNote = motionNoteFor(route, figmaEntry)

  const { mode, compact } = useViewport()
  const bleed = mode === 'bleed'

  /*
    The rail's resting state follows the layout — and only when the layout
    itself changes, so hiding the index on a desktop makes it stay hidden.

    A column wants to be open; a drawer sitting on top of the product wants to
    be shut. The store defaults to open, which is right for the desktop case it
    was written for and meant that anyone opening the link on a phone was met
    by a screen index covering 78% of the app.
  */
  useEffect(() => {
    setRailOpen(!compact)
  }, [compact, setRailOpen])

  // Choosing a screen from the drawer should reveal it, not sit on top of it.
  useEffect(() => {
    if (compact) setRailOpen(false)
  }, [route, figmaEntry, compact, setRailOpen])

  if (mode === 'rotate') {
    return (
      <div className="rotate">
        <span className="rotate__icon" aria-hidden="true" />
        <h1>Turn your phone upright</h1>
        <p>Travel Mode is a portrait design — there is not enough height here to show a screen honestly.</p>
      </div>
    )
  }

  return (
    /*
      `reducedMotion="user"` handles transform and opacity animations globally
      in one line. The choreographed sequences (confirmation, live activity,
      calendar stagger) still check useReducedMotion themselves, because what
      they need is not a shorter animation but a different one.
    */
    <MotionConfig reducedMotion="user">
      <div className={`app${compact ? ' app--compact' : ''}`} data-mode={mode}>
        {compact && railOpen && (
          <button
            className="rail__backdrop"
            aria-label="Close index"
            onClick={() => setRailOpen(false)}
          />
        )}

        <aside className={`rail${railOpen ? ' rail--open' : ''}`}>
          <IndexRail compact={compact} />
        </aside>

        {/* In bleed there is no toolbar to hang the index toggle off, so it
            gets its own affordance over the screen. */}
        {bleed && !railOpen && (
          <button className="bleedOpener" onClick={() => setRailOpen(true)}>
            <span className="bleedOpener__bars" aria-hidden="true">
              <i /><i /><i />
            </span>
            <span className="bleedOpener__label">Screens</span>
          </button>
        )}

        <DeviceFrame
          mode={mode}
          toolbar={
            <div className="stage__bar">
              <button className="stage__btn" onClick={back} disabled={!history.length}>
                ← Back
              </button>
              <span className="stage__name">{figmaEntry ?? ROUTES[route].title}</span>

              {/* Remounts the screen, so every mount animation runs again from
                  zero. The note is what you are about to watch. */}
              {motionNote && (
                <button
                  className="stage__btn stage__btn--replay"
                  onClick={replayMotion}
                  title={motionNote}
                >
                  <span className="stage__replayIcon" aria-hidden="true" />
                  Replay
                </button>
              )}

              <button className="stage__btn" onClick={() => setRailOpen(!railOpen)}>
                {railOpen && !compact ? 'Hide index' : 'Screens'}
              </button>
            </div>
          }
          caption={
            <p className="stage__hint">
              Real components on the Foundations tokens · 393×852
            </p>
          }
        >
          <ScreenHost />
        </DeviceFrame>
      </div>
    </MotionConfig>
  )
}
