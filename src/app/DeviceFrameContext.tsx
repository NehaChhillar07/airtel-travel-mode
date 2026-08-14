import { createContext, useContext } from 'react'

/**
 * The element every overlay must portal into.
 *
 * This exists because of a trap that would otherwise break every sheet, modal
 * and toast in the app:
 *
 *   `.phone__bezel` carries an inline `transform: scale(...)` so the device
 *   fits whatever window it is in. A transformed ancestor becomes the
 *   containing block for `position: fixed` descendants — but Radix and vaul
 *   portal to `document.body` by default, which escapes the phone entirely.
 *   A bottom sheet would slide up from the bottom of the browser window, at
 *   browser scale, across the whole page.
 *
 * So: a `#device-portal` node lives inside `.screenstack`, and every overlay
 * primitive in src/ui passes it as `container`. Screens never touch Portal
 * directly — `Sheet` and `Modal` do it once, correctly.
 */
export const DeviceFrameContext = createContext<HTMLElement | null>(null)

export function usePortalContainer(): HTMLElement | null {
  return useContext(DeviceFrameContext)
}
