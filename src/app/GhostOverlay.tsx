import { useUiStore } from '../state/uiStore'
import { FIGMA_INDEX } from './routes'

/**
 * Fidelity check.
 *
 * Drops the exported Figma PNG for the current index entry over the rebuilt
 * screen in `difference` blend mode, so anything that has moved lights up and
 * anything that matches goes black. This replaces the old scene-graph replay
 * as the way to compare against the source — it is a better check and it costs
 * one <img> rather than a 1.1 MB JSON payload and a recursive renderer.
 */
export function GhostOverlay() {
  const on = useUiStore((s) => s.ghostOverlay)
  const figmaEntry = useUiStore((s) => s.figmaEntry)
  if (!on || !figmaEntry) return null

  const entry = FIGMA_INDEX.find((e) => e.figma === figmaEntry)
  if (!entry) return null

  // figma-export/screens-flat/04.3-Trip-details-filled.png
  const file = `${entry.png ?? entry.figma.replace(/[^\w.]+/g, '-')}.png`

  return (
    <div className="ghost" aria-hidden="true">
      <img className="ghost__img" src={`/figma/${file}`} alt="" />
    </div>
  )
}
