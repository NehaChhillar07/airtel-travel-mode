/** Shapes emitted by tools/figma_codegen.py. */

export interface TextRun {
  text?: string
  /** Public URL of a baked Apple emoji glyph. */
  emoji?: string
  style?: Record<string, string | number> | null
}

export interface VectorPath {
  d: string
  fill: string
  rule: 'evenodd' | 'nonzero'
}

export interface VectorGradient {
  id: string
  kind: 'linear' | 'radial'
  x1: number
  y1: number
  x2: number
  y2: number
  stops: { offset: number; color: string }[]
}

export interface SceneNode {
  id: string
  name: string
  type: string
  style: Record<string, string | number>
  runs?: TextRun[]
  svg?: {
    w: number
    h: number
    /** Offset of the viewBox origin from the node's own box. */
    x: number
    y: number
    viewBox: string
    paths: VectorPath[]
    gradients?: VectorGradient[]
  }
  image?: { src: string; fit: 'cover' | 'contain' | 'fill' }
  children?: SceneNode[]
  /** Effects with no CSS equivalent that were approximated. */
  approx?: string[]
}

export interface FixedRegion {
  id: string
  name: string
  top: number
  height: number
  bottom: number
  pin: 'top' | 'bottom'
}

export interface Screen {
  id: string
  name: string
  width: number
  height: number
  scroll: {
    overflow: string | null
    fixed: FixedRegion[]
  }
  tree: SceneNode
}
