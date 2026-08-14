import type { CSSProperties } from 'react'
import { HOTSPOTS } from '../flow/hotspots'
import type { SceneNode, TextRun } from './types'

interface NodeViewProps {
  node: SceneNode
  onNavigate: (screen: string) => void
  /** Node ids to skip — the sticky chrome is rendered by <Screen> instead. */
  skip?: Set<string>
  debug?: boolean
}

/**
 * Renders one node of the generated scene graph.
 *
 * Everything here is driven by data produced from the Figma document. There is
 * no per-screen special-casing and no hand-authored layout — if something looks
 * wrong, the fix belongs in tools/figma_codegen.py so it applies everywhere and
 * survives regeneration.
 */
export function NodeView({ node, onNavigate, skip, debug }: NodeViewProps) {
  if (skip?.has(node.id)) return null

  const hotspot = HOTSPOTS[node.id]
  const interactive = hotspot && hotspot.to

  const style: CSSProperties = { ...(node.style as CSSProperties) }

  // Only hotspots take pointer events. Several screens stack full-bleed blur
  // and texture layers over their content — on 05.12 those sit directly on top
  // of the Live Activity pill — and any of them would otherwise swallow the
  // tap meant for the element beneath. Making decoration transparent to the
  // pointer fixes that everywhere rather than screen by screen.
  style.pointerEvents = interactive ? 'auto' : 'none'
  if (interactive) style.cursor = 'pointer'
  if (debug && interactive) {
    style.outline = '1.5px solid rgba(215,55,55,0.9)'
    style.outlineOffset = '-1px'
  }

  const handleClick = interactive
    ? (e: React.MouseEvent) => {
        e.stopPropagation()
        onNavigate(hotspot.to!)
      }
    : undefined

  return (
    <div
      className={interactive ? 'hotspot' : undefined}
      style={style}
      data-figma-id={node.id}
      data-figma-name={node.name}
      onClick={handleClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onNavigate(hotspot.to!)
              }
            }
          : undefined
      }
    >
      {node.svg && <VectorGlyph svg={node.svg} />}
      {node.image && (
        <img
          src={node.image.src}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: node.image.fit,
            borderRadius: 'inherit',
          }}
        />
      )}
      {node.runs && <TextContent runs={node.runs} />}
      {node.children?.map((child) => (
        <NodeView
          key={child.id}
          node={child}
          onNavigate={onNavigate}
          skip={skip}
          debug={debug}
        />
      ))}
    </div>
  )
}

function VectorGlyph({ svg }: { svg: NonNullable<SceneNode['svg']> }) {
  return (
    <svg
      width={svg.w}
      height={svg.h}
      viewBox={svg.viewBox}
      fill="none"
      style={{
        position: 'absolute',
        left: svg.x,
        top: svg.y,
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      {svg.gradients && (
        <defs>
          {svg.gradients.map((g) =>
            g.kind === 'radial' ? (
              <radialGradient key={g.id} id={g.id}>
                {g.stops.map((s, i) => (
                  <stop key={i} offset={s.offset} stopColor={s.color} />
                ))}
              </radialGradient>
            ) : (
              <linearGradient
                key={g.id}
                id={g.id}
                x1={g.x1}
                y1={g.y1}
                x2={g.x2}
                y2={g.y2}
              >
                {g.stops.map((s, i) => (
                  <stop key={i} offset={s.offset} stopColor={s.color} />
                ))}
              </linearGradient>
            ),
          )}
        </defs>
      )}
      {svg.paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill} fillRule={p.rule} clipRule={p.rule} />
      ))}
    </svg>
  )
}

function TextContent({ runs }: { runs: TextRun[] }) {
  return (
    <span style={{ width: '100%' }}>
      {runs.map((run, i) => {
        if (run.emoji) {
          return (
            <img
              key={i}
              src={run.emoji}
              alt=""
              style={{
                height: '1em',
                width: 'auto',
                verticalAlign: '-0.16em',
                display: 'inline-block',
              }}
            />
          )
        }
        return (
          <span key={i} style={run.style as CSSProperties}>
            {run.text}
          </span>
        )
      })}
    </span>
  )
}
