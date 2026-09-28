import clsx from 'clsx'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { usePortalContainer } from '../../app/DeviceFrameContext'
import { COPY } from '../../data'
import { AirtelMark } from '../../ui/icons/AirtelMark'
import { SplitFlap } from '../../ui/SplitFlap/SplitFlap'
import s from './DepartureCurtain.module.css'

export interface CurtainOrigin {
  /** The tapped element's box, in the phone's own logical coordinates. */
  top: number
  left: number
  width: number
  height: number
}

/** Where the sequence has got to. The curtain renders a stage; it owns no clock. */
export type CurtainStage =
  /** Ground growing, the word flying to the middle. */
  | 'opening'
  /** The word has become the label; the caption is up. */
  | 'stating'
  /** The board has flapped the problem up out of blank. */
  | 'problem'
  /** The board has turned the problem into the answer. */
  | 'answer'
  /** Teal sweeping across. */
  | 'clearing'

interface DepartureCurtainProps {
  origin: CurtainOrigin | null
  stage: CurtainStage
  onProblemLanded: () => void
  onAnswerLanded: () => void
  onSkip: () => void
}

/**
 * How much bigger the word is as the hero than in the lockup: 17px to a little
 * over 52px.
 *
 * The word is drawn at the hero size and scaled DOWN into the lockup, never up.
 * It used to be laid out at 17px and scaled up 3.1x under `will-change:
 * transform`, which makes the browser rasterise the text once at 17px and
 * stretch that bitmap, so the hero word was soft and then snapped sharp. Text
 * scaled down from its largest size stays crisp the whole way.
 */
const HERO_SCALE = 3.1

/**
 * Where the word comes to rest, measured from the top of the frame: 132px of
 * content padding, a 26px mark, its 10px margin, then half a 19px line. Fixed,
 * because it is set by what is above it rather than by the frame.
 */
const LOCKUP_CENTER_Y = 179

/**
 * The frame, measured rather than assumed.
 *
 * This was a hardcoded 393x852. In full bleed the canvas keeps its 393 logical
 * width but the height is whatever the device divides down to — 745 in Safari
 * with its chrome showing, 858 on a Pixel — and every number the sequence
 * derives from the frame's centre was silently wrong there: the ground stopped
 * short of the bottom edge on a tall phone, and the word flew past the middle
 * on a short one.
 */
function useFrameSize(el: HTMLElement | null) {
  const [size, setSize] = useState({ w: 393, h: 852 })

  useLayoutEffect(() => {
    if (!el) return
    const measure = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      setSize((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])

  return size
}

export function DepartureCurtain({
  origin,
  stage,
  onProblemLanded,
  onAnswerLanded,
  onSkip,
}: DepartureCurtainProps) {
  const container = usePortalContainer()
  const reduced = useReducedMotion()
  const { w: FRAME_W, h: FRAME_H } = useFrameSize(container)

  /*
    The width of " Mode" at hero size, read off the invisible lockup copy.

    " Mode" is laid out from the first frame and only fades in, so nothing ever
    changes size mid-animation. That puts "Travel" left of centre by half of
    " Mode", so the flight carries that half as an x offset and the settle
    removes it: "Travel" is centred as the hero and lands exactly where the
    finished phrase needs it. The moving word waits for this measurement so its
    first frame is already right; the layout effect runs before paint.
  */
  const ghostModeRef = useRef<HTMLSpanElement>(null)
  const [modeW, setModeW] = useState<number | null>(null)
  const [settled, setSettled] = useState(false)
  useLayoutEffect(() => {
    if (!origin) {
      setModeW(null)
      setSettled(false)
      return
    }
    if (ghostModeRef.current) setModeW(ghostModeRef.current.offsetWidth * HERO_SCALE)
  }, [origin])

  if (!container) return null

  /* How far below the lockup the frame's middle is — 247 on an 852 canvas. */
  const heroLift = FRAME_H / 2 - LOCKUP_CENTER_Y

  /* The exit circle grows from nothing at the centre, so its diameter has to
     reach the frame's full diagonal — 938px at 393x852, less on a shorter one
     — plus a little, so the ring is off-screen before it stops. */
  const popSize = Math.hypot(FRAME_W, FRAME_H) + 24

  /*
    One copy set, deliberately.

    This branched on `status === 'confirmed'` so a bought trip would get a
    different line — but six of the rail scenarios set that status, so visiting
    04.7 or any 05.x screen and coming back changed what the animation said.
    Stale scenario state was picking the words. The set piece states the problem
    the project solves; that argument does not depend on what the store holds.
  */
  const c = COPY.departure

  /*
    The board carries both states.

    A split-flap exists to make one thing become another; flapping in from
    blank to a single line is a fancy fade. Here the caption is a constant stem
    and the board completes the sentence — "Roaming, sorted after you land" is
    the problem, and the same sentence reversed is the product. Both lines are
    fourteen characters, so the cell count is stable and the DOM survives the
    turn.
  */
  const turned = stage === 'answer' || stage === 'clearing'
  const line = turned ? c.answer : c.problem
  const previousLine = turned ? c.problem : ''

  // How far the word has to come, measured from the thing that was tapped.
  const fromY = origin ? origin.top + origin.height / 2 - FRAME_H / 2 : 0
  const fromX = origin ? origin.left + origin.width / 2 - FRAME_W / 2 : 0

  /*
    How far the ground has to grow.

    It scales about its own centre, so the scale needed is set by the distance
    to the *furthest* frame edge, not by the frame's size. Using 852/height was
    a bug: growing from the Travel tile — 56px tall, 150px down — it covered
    253px above the frame and stopped 240px short of the bottom.
  */
  const cx = origin ? origin.left + origin.width / 2 : 0
  const cy = origin ? origin.top + origin.height / 2 : 0
  const coverX = origin ? (2 * Math.max(cx, FRAME_W - cx)) / origin.width : 1
  const coverY = origin ? (2 * Math.max(cy, FRAME_H - cy)) / origin.height : 1

  const ORDER: CurtainStage[] = ['opening', 'stating', 'problem', 'answer', 'clearing']
  const past = (from: CurtainStage) => ORDER.indexOf(stage) >= ORDER.indexOf(from)

  const d = (ms: number) => (reduced ? 0 : ms / 1000)
  const stated = past('stating')

  return createPortal(
    <AnimatePresence>
      {origin && (
        <motion.div
          className={s.curtain}
          onClick={onSkip}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.24 } }}
          transition={{ duration: 0.12 }}
        >
          {/* The ground, and only the ground, scales. It is empty so that it can. */}
          <motion.span
            className={s.ground}
            style={{
              top: origin.top,
              left: origin.left,
              width: origin.width,
              height: origin.height,
            }}
            initial={{ scaleX: 1, scaleY: 1, borderRadius: 28 }}
            animate={{ scaleX: coverX * 1.04, scaleY: coverY * 1.04, borderRadius: 0 }}
            transition={
              reduced
                ? { duration: 0.14 }
                : { type: 'spring', stiffness: 200, damping: 27, mass: 0.95 }
            }
          />



          <div className={s.content}>
            <motion.span
              className={s.mark}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: d(160), duration: 0.36, ease: [0.2, 0, 0, 1] }}
            >
              <AirtelMark size={26} />
            </motion.span>

            {/*
              The word, once.

              It is rendered at lockup size and scaled up to be the hero, so the
              same element does the whole journey: off the tile, to the middle of
              the frame at HERO_SCALE, then down into the lockup under the mark.
              The ghost copy reserves the row's height while the real one is out
              of flow, so nothing below it moves.
            */}
            <div className={s.lockup}>
              <span className={clsx(s.lockupGhost, s.word)} aria-hidden="true">
                {c.word}
                <span ref={ghostModeRef} className={s.mode}> Mode</span>
              </span>

              {modeW !== null && (
              <motion.span
                className={s.lockupWord}
                /*
                  Only transform and opacity move, so every frame is composited
                  rather than laid out. `will-change` is held while the word is
                  travelling and dropped once it has settled, so the browser
                  re-rasterises the resting text at its real size.
                */
                style={
                  {
                    '--hero-scale': HERO_SCALE,
                    willChange: settled ? 'auto' : 'transform',
                  } as CSSProperties
                }
                onAnimationComplete={() => {
                  if (stated) setSettled(true)
                }}
                initial={
                  reduced
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        scale: 0.24,
                        x: fromX + (modeW / 2) * 0.24,
                        y: fromY + heroLift,
                      }
                }
                animate={
                  stated
                    ? { opacity: 1, scale: 1 / HERO_SCALE, x: 0, y: 0 }
                    : { opacity: 1, scale: 1, x: modeW / 2, y: heroLift }
                }
                /*
                  Eased, not sprung.

                  The arrival used `spring.stamp`, which is deliberately
                  underdamped — the overshoot is the point of a stamp. Here it
                  read as a bounce on a word that should simply arrive. An
                  ease-out cubic settles once and stops.
                */
                transition={
                  reduced
                    ? { duration: 0.16 }
                    : stated
                      ? { duration: 0.56, ease: [0.33, 1, 0.68, 1] }
                      : { delay: d(200), duration: 0.62, ease: [0.33, 1, 0.68, 1] }
                }
              >
                <span className={s.heroText}>
                  <span className={s.word}>{c.word}</span>
                  {/*
                    Completes the phrase as the word lands. It already has its
                    space, so it fades and eases in by a few pixels and nothing
                    else moves. This used to animate `width` from 0 to auto: a
                    layout change every frame that slid "Travel" sideways while
                    the phrase grew.
                  */}
                  <motion.span
                    className={s.mode}
                    initial={{ opacity: 0, x: -12 }}
                    animate={stated ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
                    transition={{ delay: stated ? 0.4 : 0, duration: 0.32, ease: [0.2, 0, 0, 1] }}
                  >
                    {' Mode'}
                  </motion.span>
                </span>
              </motion.span>
              )}

              {/* One breath of red behind the word as it stamps down. */}
              {!stated && (
                <motion.span
                  className={s.bloom}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 0], scale: 1.5 }}
                  transition={{ delay: d(560), duration: 0.8, ease: [0.2, 0, 0, 1] }}
                  aria-hidden="true"
                />
              )}
            </div>

            {/*
              The stem the board completes.

              It waits for the word to clear it. The word rises from the middle
              of the frame into the lockup above this line and passes it about
              0.27s into its 0.56s settle; fading in at 0.04s put the caption
              under the moving word, and the two collided on the way up.
            */}
            <motion.p
              className={s.caption}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: stated ? 1 : 0, y: stated ? 0 : 10 }}
              transition={{ delay: stated ? 0.24 : 0, duration: 0.36, ease: [0.2, 0, 0, 1] }}
            >
              {c.caption}
            </motion.p>

            <motion.span
              className={s.rule}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: stated ? 1 : 0 }}
              transition={{ delay: stated ? 0.3 : 0, duration: 0.32, ease: [0.2, 0, 0, 1] }}
            />

            {/* And the answer to it. */}
            <motion.div
              className={s.board}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: stated ? 1 : 0, y: stated ? 0 : 12 }}
              transition={{ delay: stated ? 0.28 : 0, duration: 0.3, ease: [0.2, 0, 0, 1] }}
            >
              {/*
                One board, two lines. `from` is what it read a moment ago, so a
                card already showing the right character stays still.
              */}
              <SplitFlap
                className={s.flap}
                value={line}
                from={previousLine}
                playing={past('problem')}
                stagger={22}
                cycles={5}
                frame={40}
                onLanded={turned ? onAnswerLanded : onProblemLanded}
              />
            </motion.div>

            <AnimatePresence>
              {stage !== 'clearing' && (
                <motion.span
                  className={clsx(s.skip, 't-caption-12')}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: d(1200), duration: 0.3 }}
                >
                  Tap to skip
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/*
            Last child, and deliberately so. The circle was rendered before the
            content, which meant it grew *behind* the words — the teal arrived
            but the answer stayed legible on top of it, and then ghosted across
            the trip screen as the curtain faded. On top, growing it is what
            takes the content away.
          */}
          <motion.span
            className={s.pop}
            initial={{ width: 0, height: 0 }}
            animate={
              stage === 'clearing'
                ? { width: popSize, height: popSize }
                : { width: 0, height: 0 }
            }
            /*
              0.40. It was 0.52, then 0.30 while chasing a dead-white gap — but
              300ms was tuned for a wash nobody could see, and now that there is
              a ring to follow, the sweep needs long enough to be followed. The
              gap it was shortened for is fixed properly in the hand-off timing
              instead (see TIMING.wipe).
            */
            transition={{ duration: reduced ? 0.1 : 0.4, ease: [0.32, 0, 0.24, 1] }}
            aria-hidden="true"
          />
        </motion.div>
      )}
    </AnimatePresence>,
    container,
  )
}
