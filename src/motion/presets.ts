import type { Transition, Variants } from 'motion/react'

/**
 * Shared motion vocabulary.
 *
 * `nav.ts` owns how screens replace each other. This owns how things behave
 * inside a screen, so a chip, a sheet and a pack card all answer with the same
 * physics rather than each picking its own numbers.
 */

export const spring = {
  /** Direct manipulation: chips, taps, toggles. Arrives fast, no wobble. */
  snappy: { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 },
  /** The house default. Same curve as navSpring, so nothing feels foreign. */
  gentle: { type: 'spring', stiffness: 280, damping: 32, mass: 0.9 },
  /** Celebration only — the confirmation tick, the timeline dots. */
  bouncy: { type: 'spring', stiffness: 420, damping: 22, mass: 0.8 },
  /**
   * A stamp coming down onto a surface. Deliberately underdamped: driven from
   * a large scale down to 1, the undershoot past the target IS the press, so
   * the landing needs no separate squash keyframe.
   */
  stamp: { type: 'spring', stiffness: 380, damping: 17, mass: 0.9 },
} satisfies Record<string, Transition>

export const ease = {
  out: [0.2, 0, 0, 1],
  inOut: [0.4, 0, 0.2, 1],
} as const

export const dur = { fast: 0.14, base: 0.22, slow: 0.38 } as const

/** Press feedback for anything built on motion rather than the .pressable class. */
export const press = {
  whileTap: { scale: 0.972 },
  transition: { duration: dur.fast, ease: ease.out },
} as const

/**
 * A list whose children arrive one after another.
 * `stagger` is per-child delay in seconds.
 */
export function staggerList(stagger = 0.028, delay = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  }
}

export const listItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: spring.gentle },
}

/** Enter/exit for a row that can be added and removed from a list. */
export const popItem: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: spring.snappy },
  exit: { opacity: 0, scale: 0.8, transition: { duration: dur.fast } },
}

/** Collapsible body: height auto is animatable in motion v13. */
export const collapse: Variants = {
  hidden: { height: 0, opacity: 0 },
  show: {
    height: 'auto',
    opacity: 1,
    transition: { height: spring.gentle, opacity: { duration: dur.base, delay: 0.04 } },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { height: { duration: dur.base, ease: ease.out }, opacity: { duration: 0.1 } },
  },
}

/** An SVG path that draws itself on. Pair with `pathLength` on the path. */
export const drawPath: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 0.44, ease: ease.out }, opacity: { duration: 0.05 } },
  },
}

/** Backdrop behind a sheet or modal. */
export const scrim: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: dur.base } },
  exit: { opacity: 0, transition: { duration: dur.fast } },
}
