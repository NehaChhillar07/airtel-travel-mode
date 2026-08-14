import clsx from 'clsx'
import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { press, spring } from '../../motion/presets'
import s from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'commit'
export type ButtonSize = 'lg' | 'md' | 'sm'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant
  size?: ButtonSize
  full?: boolean
  loading?: boolean
  /** Shows a tick instead of the label. Used after a commit lands. */
  succeeded?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  children?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'lg',
  full,
  loading,
  succeeded,
  iconLeft,
  iconRight,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const busy = loading || succeeded
  const labelClass = size === 'sm' ? 't-body-14-med' : 't-value-16-med'

  return (
    <motion.button
      type="button"
      className={clsx(
        s.btn,
        s[size],
        succeeded ? s.success : s[variant],
        full && s.full,
        busy && s.busy,
        labelClass,
        className,
      )}
      disabled={disabled || busy}
      aria-busy={loading || undefined}
      {...(disabled || busy ? {} : press)}
      {...(rest as object)}
    >
      {loading && <span className={s.spinner} aria-hidden="true" />}
      {succeeded && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={spring.bouncy}
          aria-hidden="true"
          style={{ display: 'grid', placeItems: 'center' }}
        >
          <Check size={20} strokeWidth={3} />
        </motion.span>
      )}
      {!busy && (
        <>
          {iconLeft}
          {children}
          {iconRight}
        </>
      )}
      {loading && <span className="sr-only">Working</span>}
    </motion.button>
  )
}
