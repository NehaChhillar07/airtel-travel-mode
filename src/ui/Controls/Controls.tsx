import clsx from 'clsx'
import { motion } from 'motion/react'
import { Checkbox as RxCheckbox, Switch as RxSwitch } from 'radix-ui'
import { useId, type ReactNode } from 'react'
import { drawPath, spring } from '../../motion/presets'
import s from './Controls.module.css'

/* -------------------------------------------------------------- Checkbox */

interface CheckboxProps {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  children?: ReactNode
  disabled?: boolean
  invalid?: boolean
  className?: string
}

export function Checkbox({
  checked,
  onCheckedChange,
  children,
  disabled,
  invalid,
  className,
}: CheckboxProps) {
  const id = useId()
  return (
    <div className={clsx(s.checkRow, className)} data-disabled={disabled}>
      <RxCheckbox.Root
        id={id}
        className={s.check}
        data-invalid={invalid}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      >
        <RxCheckbox.Indicator asChild forceMount>
          {/* The tick draws itself on rather than fading in, so accepting the
              terms reads as an action completing. */}
          <motion.svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            initial={false}
            animate={checked ? 'show' : 'hidden'}
            aria-hidden="true"
          >
            <motion.path
              d="M1.5 6.2 L4.5 9 L10.5 2.8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              variants={drawPath}
            />
          </motion.svg>
        </RxCheckbox.Indicator>
      </RxCheckbox.Root>

      {/* Geist, not Poppins — see the `t-text-sm-med` note in type.css. */}
      {children && (
        <label htmlFor={id} className={clsx(s.checkLabel, 't-text-sm-med')}>
          {children}
        </label>
      )}
    </div>
  )
}

/* ---------------------------------------------------------------- Switch */

interface SwitchProps {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
  label: string
  className?: string
}

export function Switch({ checked, onCheckedChange, disabled, label, className }: SwitchProps) {
  return (
    <RxSwitch.Root
      className={clsx(s.switch, className)}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onCheckedChange}
      aria-label={label}
    >
      <RxSwitch.Thumb asChild>
        <motion.span
          className={s.thumb}
          animate={{ x: checked ? 22 : 2 }}
          transition={spring.snappy}
        />
      </RxSwitch.Thumb>
    </RxSwitch.Root>
  )
}

export function SwitchRow({ children }: { children: ReactNode }) {
  return <div className={s.switchRow}>{children}</div>
}
