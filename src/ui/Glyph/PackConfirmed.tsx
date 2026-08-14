import { motion, useReducedMotion } from 'motion/react'
import { useId } from 'react'
import { ease } from '../../motion/presets'

/**
 * `Layer_1` on 04.7 — the pack-confirmed mark.
 *
 * Three beats, in this order, because the order is the message:
 *
 *   1. the soft lozenge settles      "you have a place on the network"
 *   2. the card outline arrives      "this is your pack"
 *   3. the tick draws itself on      "it is confirmed"
 *
 * It deliberately does NOT stamp, bounce or pulse. A tick that lands with
 * overshoot and a ring behind it is the vocabulary every payment-success screen
 * uses, and this is a postpaid flow where nothing has been charged yet — see
 * the note at the top of Confirmation.tsx.
 *
 * The tick is a filled path, not a stroke, so it cannot be drawn with
 * `pathLength` directly. It is masked by a stroked polyline that traces the
 * same route, and that is what animates.
 */
/** When the tick has finished drawing. The screen's sequence builds on this. */
export const MARK_DONE = 0.74

export function PackConfirmedMark({ size = 54 }: { size?: number }) {
  const reduced = useReducedMotion()
  const uid = useId().replace(/:/g, '')
  const clipId = `pc-clip-${uid}`
  const maskId = `pc-mask-${uid}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 54 54"
      fill="none"
      role="img"
      aria-label="Pack confirmed"
    >
      <defs>
        <clipPath id={clipId}>
          <rect width="54" height="54" fill="white" />
        </clipPath>
        <mask id={maskId}>
          <motion.path
            d="M21.3 31.7 L24.85 35.9 L32.7 27.2"
            stroke="white"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            pathLength={1}
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.34, delay: 0.4, ease: ease.out }}
          />
        </mask>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        {/* The lozenge. Settles rather than pops — no overshoot. */}
        <motion.path
          d="M42.539 38.2253L15.7078 42.4508C8.30303 43.6118 1.34378 38.5898 0.169282 31.2255C-1.00522 23.8613 4.05728 16.9425 11.462 15.7748L38.2933 11.5493C45.7048 10.3815 52.6573 15.4103 53.8318 22.7745C55.0063 30.1388 49.9438 37.0575 42.539 38.2253Z"
          fill="#79D099"
          fillOpacity="0.25"
          initial={reduced ? false : { scale: 0.86, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.34, ease: ease.out }}
          style={{ transformOrigin: '27px 27px' }}
        />

        {/* The card outline. Two exported paths, one gesture. */}
        <motion.g
          initial={reduced ? false : { scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.14, ease: ease.out }}
          style={{ transformOrigin: '27px 27px' }}
        >
          <path
            d="M47.3985 28.5255C46.5548 28.5255 45.8663 27.837 45.8663 26.9933C45.8663 17.8132 45.8663 13.203 43.3283 10.6583C41.2358 8.56575 37.854 8.18775 31.0635 8.127C30.2198 8.12025 29.538 7.43175 29.5448 6.58125C29.5515 5.73075 30.24 5.05575 31.0905 5.0625C34.6073 5.09625 37.4153 5.20425 39.7035 5.64975C42.2145 6.1425 44.0573 7.047 45.495 8.48475C47.169 10.1588 48.1073 12.3458 48.546 15.5858C48.9308 18.4613 48.9308 22.0387 48.9308 26.9865C48.9308 27.8437 48.249 28.5255 47.3985 28.5255ZM6.59475 28.5255C5.751 28.5255 5.0625 27.8438 5.0625 27C5.0625 22.0523 5.0625 18.4815 5.44725 15.5993C5.87925 12.3593 6.82425 10.1723 8.49825 8.49825C9.94275 7.05375 11.7788 6.156 14.2898 5.66325C16.578 5.21775 19.386 5.103 22.9027 5.076C23.7465 5.06925 24.4418 5.751 24.4485 6.59475C24.4553 7.4385 23.7735 8.13375 22.9298 8.1405C16.1393 8.1945 12.7575 8.5725 10.665 10.6718C8.13375 13.203 8.13375 17.82 8.13375 27.0068C8.12025 27.8438 7.4385 28.5255 6.59475 28.5255Z"
            fill="#2D8261"
          />
          <path
            d="M31.077 48.9308C30.2333 48.9308 29.5448 48.2423 29.5448 47.3985C29.5448 46.5548 30.2333 45.8663 31.077 45.8663C36.5378 45.8663 39.2783 45.8663 41.1345 44.9213C42.7748 44.0843 44.0843 42.7748 44.9213 41.1345C45.8663 39.2783 45.8663 36.5378 45.8663 31.077C45.8663 25.6163 45.8663 22.8758 44.9213 21.0195C44.0843 19.3793 42.7748 18.0698 41.1345 17.2328C39.2783 16.281 36.5378 16.281 31.077 16.281H22.9095C17.4487 16.281 14.7082 16.281 12.852 17.226C11.2117 18.063 9.90225 19.3725 9.06525 21.0128C8.12025 22.869 8.12025 25.6095 8.12025 31.0703C8.12025 36.531 8.12025 39.2715 9.06525 41.1278C9.90225 42.768 11.2117 44.0775 12.852 44.9145C14.7082 45.8595 17.4487 45.8595 22.9095 45.8595C23.7533 45.8595 24.4418 46.548 24.4418 47.3918C24.4418 48.2355 23.7533 48.924 22.9095 48.924C16.956 48.924 13.9725 48.924 11.4615 47.6415C9.24075 46.521 7.47225 44.7525 6.345 42.525C5.0625 40.014 5.0625 37.0305 5.0625 31.077C5.0625 25.1235 5.0625 22.14 6.345 19.6358C7.479 17.415 9.25425 15.6398 11.475 14.5058C13.986 13.2233 16.9695 13.2233 22.923 13.2233H31.0838C37.0373 13.2233 40.0207 13.2233 42.5317 14.5058C44.7525 15.6398 46.5278 17.415 47.6618 19.6358C48.9443 22.1468 48.9443 25.1303 48.9443 31.0838C48.9443 37.0373 48.9443 40.0208 47.6618 42.5318C46.5278 44.7525 44.7525 46.5278 42.5317 47.6618C40.0207 48.9308 37.0305 48.9308 31.077 48.9308Z"
            fill="#2D8261"
          />
        </motion.g>

        <path
          d="M24.814 36.6862C24.382 36.6862 23.9635 36.504 23.6732 36.18L20.7505 32.9198C20.1902 32.292 20.2442 31.32 20.872 30.7598C21.4997 30.1995 22.4717 30.2535 23.032 30.8813L24.8072 32.8657L30.9565 25.9875C31.5167 25.3597 32.4887 25.299 33.1165 25.866C33.7442 26.4263 33.805 27.3983 33.238 28.026L25.948 36.18C25.6645 36.504 25.246 36.6862 24.814 36.6862Z"
          fill="#2D8261"
          mask={`url(#${maskId})`}
        />
      </g>
    </svg>
  )
}
