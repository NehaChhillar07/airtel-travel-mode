import { useEffect, useMemo, useRef } from 'react'
import { NodeView } from './NodeView'
import type { Screen } from './types'
import './ScreenView.css'

const VIEWPORT_H = 852

interface ScreenViewProps {
  screen: Screen
  onNavigate: (name: string) => void
  debug?: boolean
}

/**
 * Hosts one screen inside the 393x852 device viewport.
 *
 * Screens taller than the viewport scroll. The chrome that Figma marked
 * `scrollBehavior: "FIXED"` is lifted out of the scrolling content and pinned
 * to the edge its constraint names, which is how the design behaves in Figma's
 * own prototype.
 */
export function ScreenView({ screen, onNavigate, debug }: ScreenViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const fixed = screen.scroll.fixed
  const skip = useMemo(() => new Set(fixed.map((f) => f.id)), [fixed])

  // Every navigation starts at the top of the new screen.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [screen.id])

  const fixedNodes = useMemo(
    () =>
      fixed
        .map((region) => ({
          region,
          node: screen.tree.children?.find((c) => c.id === region.id),
        }))
        .filter((x) => x.node),
    [fixed, screen],
  )

  // Content keeps its original coordinates and scrolls beneath the opaque
  // chrome. Only the bottom bar needs extra room, so the last of the content
  // can clear it.
  const padBottom = fixed
    .filter((f) => f.pin === 'bottom')
    .reduce((n, f) => Math.max(n, f.height), 0)

  return (
    <div className="screenview" style={{ width: screen.width, height: VIEWPORT_H }}>
      <div className="screenview__scroll" ref={scrollRef}>
        <div
          className="screenview__content"
          style={{ width: screen.width, height: screen.height }}
        >
          <NodeView
            node={{ ...screen.tree, style: { ...screen.tree.style, position: 'relative' } }}
            onNavigate={onNavigate}
            skip={skip}
            debug={debug}
          />
        </div>
        {/* Room to scroll past content that the pinned bar would cover. */}
        {padBottom > 0 && <div style={{ height: padBottom }} />}
      </div>

      {fixedNodes.map(({ region, node }) => (
        <div
          key={region.id}
          className="screenview__chrome"
          style={
            region.pin === 'top'
              ? { top: region.top, height: region.height }
              : { bottom: 0, height: region.height }
          }
        >
          <NodeView
            node={{
              ...node!,
              style: { ...node!.style, position: 'absolute', top: '0px', left: '0px' },
            }}
            onNavigate={onNavigate}
            debug={debug}
          />
        </div>
      ))}
    </div>
  )
}
