import { applyEntry } from './applyEntry'
import { FIGMA_INDEX, GROUP_ORDER, type FigmaEntry } from './routes'
import { useUiStore } from '../state/uiStore'

/**
 * The designer's screen index.
 *
 * Every entry still corresponds to a screen in the Figma file, but clicking
 * one no longer swaps a picture. It applies that screen's scenario to the
 * stores and then navigates — so "04.3 Trip details filled" lands you on the
 * real form with three chips genuinely selected and a CTA that is enabled
 * because the validation rule says so.
 */
export function IndexRail({ compact }: { compact: boolean }) {
  const figmaEntry = useUiStore((s) => s.figmaEntry)
  const ghostOverlay = useUiStore((s) => s.ghostOverlay)
  const toggleGhostOverlay = useUiStore((s) => s.toggleGhostOverlay)
  const setRailOpen = useUiStore((s) => s.setRailOpen)

  function open(entry: FigmaEntry) {
    applyEntry(entry)

    const ui = useUiStore.getState()
    ui.jump(entry.route, entry.figma)
    if (entry.sheet) ui.openSheet(entry.sheet)
    if (compact) setRailOpen(false)
  }

  return (
    <>
      <header className="rail__head">
        <h1>Travel Mode</h1>
        <p>Airtel · Design Assignment 1</p>
      </header>

      {GROUP_ORDER.map((group) => {
        const items = FIGMA_INDEX.filter((e) => e.group === group)
        if (!items.length) return null
        return (
          <section key={group} className="rail__group">
            <h2>{group}</h2>
            {items.map((entry, i) => {
              const [num, ...rest] = entry.figma.split(' ')
              const on = entry.figma === figmaEntry
              const title = [entry.motion && `Motion — ${entry.motion}`, entry.note]
                .filter(Boolean)
                .join('\n')
              return (
                <button
                  key={entry.figma}
                  className={`rail__item${on ? ' rail__item--on' : ''}${
                    entry.motion ? ' rail__item--motion' : ''
                  }`}
                  onClick={() => open(entry)}
                  title={title || undefined}
                  /* Staggered so the chips breathe as a wave down the list
                     instead of pulsing in lockstep. */
                  style={
                    entry.motion
                      ? ({ '--chip-delay': `${(i % 5) * 0.34}s` } as React.CSSProperties)
                      : undefined
                  }
                >
                  <span className="rail__num">{num}</span>
                  {/* The chip rides inside the label rather than beside it, so
                      it flows after the last word instead of squeezing the
                      name into two lines to make room for itself. */}
                  <span className="rail__label">
                    {rest.join(' ')}
                    {entry.note && <span className="rail__flag" aria-hidden="true" />}
                    {entry.motion && (
                      <span className="rail__motion" aria-label="Has motion">
                        Motion
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </section>
        )
      })}

      <section className="rail__group">
        <h2>Design system</h2>
        <button
          className={`rail__item${figmaEntry === 'gallery' ? ' rail__item--on' : ''}`}
          onClick={() => {
            useUiStore.getState().jump('gallery', 'gallery')
            if (compact) setRailOpen(false)
          }}
        >
          <span className="rail__num">—</span>
          <span className="rail__label">Component gallery</span>
        </button>
      </section>

      <footer className="rail__foot">
        <label className="rail__toggle">
          <input type="checkbox" checked={ghostOverlay} onChange={toggleGhostOverlay} />
          Ghost the Figma render
        </label>
        <p className="rail__note">
          Screens are real components on the Foundations tokens. The overlay
          drops the exported Figma PNG over the top so you can check the fit.
        </p>
      </footer>
    </>
  )
}
