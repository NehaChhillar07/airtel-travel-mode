import clsx from 'clsx'
import { useEffect, useRef } from 'react'
import s from './SplitFlap.module.css'

/** Same stylesheet; aliased so the effect body reads clearly. */
const s2 = s

/** The drum. Every card carries this sequence, so a tumble is always in-set. */
const ALPHABET = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·'?"

export interface SplitFlapProps {
  /** What the board should read. Compared against `from` to build the tumble. */
  value: string
  /** What it read before. Cells whose character is unchanged never move. */
  from?: string
  /** Runs the tumble. Going false snaps to `value`. */
  playing: boolean
  /** Per-cell start offset. The left-to-right ripple. */
  stagger?: number
  /** How many glyphs a card turns through before it lands. */
  cycles?: number
  /** Milliseconds each intermediate glyph is held. */
  frame?: number
  dim?: boolean
  /** Tumble to blank instead of to `value` — the board clearing on exit. */
  clearing?: boolean
  className?: string
  /** Fires once, when the last card has landed. */
  onLanded?: () => void
}

/**
 * A split-flap display.
 *
 * Every cell is driven from one requestAnimationFrame loop, and each cell's
 * glyph and rotation are a pure function of elapsed time. That is the whole
 * trick: thirty cells with thirty timers drift apart within a second and the
 * ripple stops being a ripple, whereas one clock cannot.
 *
 * Nothing here re-renders. React owns the cards; the loop writes textContent
 * and a transform straight to the DOM, so a 30-character line costs one
 * component and no reconciliation.
 */
export function SplitFlap({
  value,
  from = '',
  playing,
  stagger = 26,
  cycles = 7,
  frame = 42,
  dim,
  clearing,
  className,
  onLanded,
}: SplitFlapProps) {
  const cellsRef = useRef<(HTMLSpanElement | null)[]>([])
  const glyphsRef = useRef<(HTMLSpanElement | null)[]>([])
  const rowRef = useRef<HTMLSpanElement>(null)
  const rafRef = useRef(0)
  const landedRef = useRef(false)
  /*
    A board that has not turned yet is blank, not pre-filled.

    React renders each cell's character as static content, so before the first
    tumble the answer was already legible — the flip then scrambled a line the
    viewer had read a second earlier, which is backwards. Until the first play,
    every cell stays empty.
  */
  const everPlayed = useRef(false)
  /*
    Held in a ref, not read from the closure.

    `onLanded` was in the effect's dependency array, and the parent re-creates
    it on every stage change — so the effect tore down and restarted mid-tumble,
    and the board scrambled a line it had already landed. The callback identity
    must not be able to restart the clock.
  */
  const onLandedRef = useRef(onLanded)
  onLandedRef.current = onLanded

  const target = value.toUpperCase()
  const previous = from.toUpperCase()

  useEffect(() => {
    const cells = cellsRef.current
    const glyphs = glyphsRef.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const settle = () => {
      target.split('').forEach((ch, i) => {
        const g = glyphs[i]
        const c = cells[i]
        const final = clearing ? ' ' : ch
        if (g) g.textContent = final === ' ' ? '' : final
        if (c) c.style.transform = ''
      })
    }

    if (!playing && !everPlayed.current) {
      cancelAnimationFrame(rafRef.current)
      glyphs.forEach((g) => {
        if (g) g.textContent = ''
      })
      return
    }

    if (!playing || reduced) {
      cancelAnimationFrame(rafRef.current)
      settle()
      if (playing && reduced && !landedRef.current) {
        landedRef.current = true
        onLandedRef.current?.()
      }
      return
    }

    landedRef.current = false
    everPlayed.current = true
    const startedAt = performance.now()

    // A card that is already showing the right character stays still. On this
    // board the two lines share their first word, so this is what keeps the
    // ripple from reading as a full reset.
    /*
      A real board clatters — the cards do not land on a metronome. Offsetting
      each one by up to ±6ms is invisible card by card and completely changes
      the character of the row: perfectly even spacing reads as digital.
      Deterministic, so a replay clatters the same way twice.
    */
    const jitter = (i: number) => ((i * 37) % 13) - 6

    const landOn = (i: number) => (clearing ? ' ' : target[i])
    const moves = target
      .split('')
      .map((ch, i) => (clearing ? ch !== ' ' : ch !== (previous[i] ?? ' ')))
    const lastMoving = moves.lastIndexOf(true)
    const duration =
      (lastMoving < 0 ? 0 : lastMoving) * stagger + 6 + cycles * frame

    const tick = (now: number) => {
      const t = now - startedAt

      for (let i = 0; i < target.length; i++) {
        const cell = cells[i]
        const glyph = glyphs[i]
        if (!cell || !glyph) continue

        const final = landOn(i)

        if (!moves[i]) {
          glyph.textContent = final === ' ' ? '' : final
          continue
        }

        const begin = i * stagger + jitter(i)
        const local = t - begin

        if (local < 0) {
          const held = from ? (previous[i] ?? ' ') : ' '
          glyph.textContent = held === ' ' ? '' : held
          cell.style.transform = ''
          continue
        }

        const step = local / frame

        if (step >= cycles) {
          glyph.textContent = final === ' ' ? '' : final
          cell.style.transform = ''
          continue
        }

        // Where we are inside the current card's fall, 0..1.
        const phase = step - Math.floor(step)
        const index = Math.floor(step)

        /*
          The leaf falls to edge-on, the glyph is swapped while it cannot be
          seen, and the next leaf rises into place. Easing the first half in and
          the second half out is what gives the card its weight — a linear
          rotation reads as a spinner.
        */
        const rot =
          phase < 0.5
            ? -90 * Math.pow(phase * 2, 1.7)
            : 90 * (1 - Math.pow((phase - 0.5) * 2, 0.55))
        cell.style.transform = `rotateX(${rot}deg)`

        // Deterministic, so a card never re-rolls the same instant twice, and
        // the last glyph before landing is a near-miss rather than noise.
        let ch: string
        if (index === cycles - 1) {
          const at = ALPHABET.indexOf(final)
          ch = ALPHABET[(at - 1 + ALPHABET.length) % ALPHABET.length]
        } else {
          ch = ALPHABET[(i * 7 + index * 11 + 3) % ALPHABET.length]
        }
        glyph.textContent = ch === ' ' ? '' : ch
      }

      if (t < duration) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        settle()
        if (!landedRef.current) {
          landedRef.current = true
          /*
            The mechanism coming to rest. Two pixels, 160ms — nobody sees it
            and everybody feels it. Without the shudder the row simply stops,
            which is the moment a board stops being a board.
          */
          const row = rowRef.current
          if (row && !clearing) {
            row.classList.add(s2.clatter)
            window.setTimeout(() => row.classList.remove(s2.clatter), 220)
          }
          onLandedRef.current?.()
        }
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, target, previous, from, stagger, cycles, frame, clearing])

  return (
    <span
      ref={rowRef}
      className={clsx(s.row, dim && s.dim, className)}
      aria-label={clearing ? '' : value}
      role="text"
    >
      {target.split('').map((ch, i) =>
        ch === ' ' ? (
          <span className={s.gap} key={i} aria-hidden="true" />
        ) : (
          <span
            className={s.cell}
            key={i}
            aria-hidden="true"
            ref={(el) => {
              cellsRef.current[i] = el
            }}
          >
            {/*
              Deliberately empty.

              The effect writes every character, so JSX must not. Rendering
              `{ch}` here meant that changing `value` painted the new line as
              static content for one frame before the tumble began — the answer
              flashed legible, then scrambled, which is backwards. Twice now
              that has been the bug; leaving the cell empty makes it impossible.
            */}
            <span
              className={s.glyph}
              ref={(el) => {
                glyphsRef.current[i] = el
              }}
            />
          </span>
        ),
      )}
    </span>
  )
}
