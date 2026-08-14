import { useCallback, useRef, useState } from 'react'
import { useUiStore } from '../../state/uiStore'
import type { CurtainOrigin, CurtainStage } from '../../patterns/DepartureCurtain/DepartureCurtain'

/**
 * The curtain's timeline, in one place, so it can be argued with.
 *
 * Total is about 3.8s, and roughly 1.6s of that is the two holds. The entrance
 * has been cut back three times: it is the part nobody reads, so it is the part
 * that pays for the parts they do.
 *
 * Two numbers matter more than the rest, and they are the two this design got
 * wrong twice. `holdProblem` is how long the problem sits there before the
 * board turns — too short and the turn happens before anyone has read what is
 * turning. `holdAnswer` is how long the answer sits before the wipe — too short
 * and the conclusion is retracted mid-sentence.
 *
 * Everything else is entrance, and entrance should be brisk.
 */
const TIMING = {
  /** Anticipation: the tapped tile compresses before anything opens. */
  press: 90,
  /**
   * The word has arrived in the middle AND rested there before it moves up.
   *
   * This was 520ms, while the word did not finish arriving until ~820 — so it
   * was told to leave the centre before it had got there, and never appeared to
   * stop. 200ms of the delay plus 620ms of travel plus a beat of stillness.
   */
  state: 1060,
  /** The board flaps the problem up, once the lockup has settled. */
  problem: 1280,
  /** Backstop, if the problem's cards never report landing. */
  problemBy: 2200,
  /** How long the problem stays legible before the board turns. */
  holdProblem: 700,
  /** Backstop, if the answer's cards never report landing. */
  answerBy: 1000,
  /** How long the finished answer sits there, doing nothing. */
  holdAnswer: 850,
  /**
   * The iris washes it out, and the ring has to be gone before we hand over.
   *
   * This was 210, tuned when the wash was invisible and the only thing that
   * mattered was covering the frame as early as possible. With a red edge on
   * it there is now something to watch, and handing over early meant the last
   * of the sweep dissolved into the cross-fade instead of leaving the screen —
   * the ring faded out in the corners rather than exiting through them.
   *
   * Traced: the ring passes the left and right edges around 180ms and clears
   * the corners at about 340. So 340 is when there is nothing left to see and
   * the trip screen should start arriving. The white-only gap after it is
   * ~50ms.
   */
  wipe: 340,
} as const

/**
 * The key the full sequence is remembered under.
 *
 * `replayMotion` clears it, and so does selecting the Home entry in the index —
 * a reviewer opening "01 Home" should always get the long version, because
 * that is the thing they came to look at.
 */
export const DEPARTURE_KEY = 'departure'

/**
 * A tapped element's box in the phone's own coordinates.
 *
 * The frame is scaled — to fit the window when it is framed, and to the device
 * width in full bleed — so the on-screen rectangle has to be divided back out
 * before it means anything to a 393-wide design.
 */
function boxIn(rect: DOMRect, frame: DOMRect): CurtainOrigin {
  const scale = frame.width / 393
  return {
    top: (rect.top - frame.top) / scale,
    left: (rect.left - frame.left) / scale,
    width: rect.width / scale,
    height: rect.height / scale,
  }
}

export interface DepartureSequence {
  origin: CurtainOrigin | null
  stage: CurtainStage
  /** The element that was tapped, so it can be compressed. */
  pressing: boolean
  start: (el: HTMLElement | null) => void
  onProblemLanded: () => void
  onAnswerLanded: () => void
  skip: () => void
}

/**
 * Owns the Travel Mode curtain.
 *
 * Open out of whatever was tapped, bring the word to the middle, hand the
 * middle to the caption, flap the problem up, hold it, turn it into the answer,
 * hold that, sweep teal across, swap the screen underneath, lift.
 *
 * The navigation is not chained to the animation completing. It fires off the
 * wipe, and a backstop fires it regardless — so an interrupted, skipped or
 * reduced-motion run still lands on the trip screen. The set piece can fail;
 * the flow cannot.
 */
export function useDepartureSequence(): DepartureSequence {
  const navigate = useUiStore((x) => x.navigate)

  const markPlayed = useUiStore((x) => x.markPlayed)
  const hasPlayed = useUiStore((x) => x.hasPlayed)

  const [origin, setOrigin] = useState<CurtainOrigin | null>(null)
  const [stage, setStage] = useState<CurtainStage>('opening')
  const [pressing, setPressing] = useState(false)

  const timers = useRef<number[]>([])
  const armed = useRef(false)
  const problemDone = useRef(false)
  const answerDone = useRef(false)

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const after = useCallback((ms: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  /** Sweep teal across, swap the screen behind it, lift. */
  const finish = useCallback(() => {
    clearTimers()
    setStage('clearing')
    after(TIMING.wipe, () => {
      /*
        `jump`, not the default push. A push slides the trip screen in over
        ~400ms; under an opaque curtain that is wasted at best and caught at
        worst. The curtain is the transition — the swap beneath it should have
        no motion of its own.
      */
      navigate('trip', 'jump')
      /*
        40, not 200.

        The curtain fades out over 240ms and the trip screen is already painted
        underneath it, so this delay is pure blank screen — and it used to be
        invisible only because the blank was teal and the band it handed to was
        teal too. On white it reads as a loading state: 300ms of nothing between
        the sequence ending and the product appearing. The iris covers, and the
        screen starts coming through it almost at once.
      */
      after(40, () => {
        setOrigin(null)
        setStage('opening')
        armed.current = false
        problemDone.current = false
        answerDone.current = false
      })
    })
  }, [after, clearTimers, navigate])

  /** Turn the board over from the problem to the answer. */
  const turn = useCallback(() => {
    setStage('answer')
    after(TIMING.answerBy, () => {
      if (!answerDone.current) {
        answerDone.current = true
        after(TIMING.holdAnswer, finish)
      }
    })
  }, [after, finish])

  const start = useCallback(
    (el: HTMLElement | null) => {
      if (armed.current) return
      const frame = el?.closest('.screenstack')
      if (!el || !frame) {
        navigate('trip')
        return
      }

      armed.current = true
      problemDone.current = false
      answerDone.current = false

      // Anticipation. Ninety milliseconds, and it is the difference between the
      // animation happening to you and because of you.
      setPressing(true)

      const r = el.getBoundingClientRect()
      const f = frame.getBoundingClientRect()
      setOrigin(boxIn(r, f))

      /*
        Once a load, and then not again.

        There used to be a second, shorter animation here for every tap after
        the first — a plane carrying the moment to the middle. It is gone. What
        is left is the one set piece and, after it has been seen, a plain
        navigation: no half-version, no shorthand, nothing to get wrong.

        `playedSequences` lives in memory, so a reload is what brings it back —
        which is the whole rule. Replay and the index's Home entry also clear
        it, so a reviewer can re-watch without reloading.
      */
      if (hasPlayed(DEPARTURE_KEY)) {
        setPressing(false)
        setOrigin(null)
        armed.current = false
        navigate('trip')
        return
      }

      /*
        One timing, every time.

        The full version used to run long on the first play and short after, and
        the copy used to branch on whether a trip had been bought — so the set
        piece could never be watched twice the same way. Variance inside a
        showpiece reads as a fault. Which of the TWO pieces you get is a
        different question, and it is decided above.
      */
      markPlayed(DEPARTURE_KEY)
      setStage('opening')

      after(TIMING.press, () => setPressing(false))
      after(TIMING.state, () => setStage('stating'))
      after(TIMING.problem, () => setStage('problem'))
      after(TIMING.problemBy, () => {
        if (!problemDone.current) {
          problemDone.current = true
          after(TIMING.holdProblem, turn)
        }
      })
    },
    [after, hasPlayed, markPlayed, navigate, turn],
  )

  /** The problem is legible. Hold it, then turn it over. */
  const onProblemLanded = useCallback(() => {
    if (problemDone.current) return
    problemDone.current = true
    clearTimers()
    after(TIMING.holdProblem, turn)
  }, [after, clearTimers, turn])

  /** The answer is legible. Hold it, then wipe. */
  const onAnswerLanded = useCallback(() => {
    if (answerDone.current) return
    answerDone.current = true
    clearTimers()
    after(TIMING.holdAnswer, finish)
  }, [after, clearTimers, finish])

  /** A tap anywhere on the curtain. Nobody should sit through it twice. */
  const skip = useCallback(() => {
    if (!armed.current || stage === 'clearing') return
    problemDone.current = true
    answerDone.current = true
    finish()
  }, [finish, stage])

  return {
    origin,
    stage,
    pressing,
    start,
    onProblemLanded,
    onAnswerLanded,
    skip,
  }
}
