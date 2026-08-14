import clsx from 'clsx'
import { Search, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useId, useState, type InputHTMLAttributes, type Ref } from 'react'
import { spring } from '../../motion/presets'
import s from './SearchField.module.css'

interface SearchFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onValueChange: (v: string) => void
  onClear?: () => void
  invalid?: boolean
  inputRef?: Ref<HTMLInputElement>
}

export function SearchField({
  value,
  onValueChange,
  onClear,
  invalid,
  inputRef,
  className,
  placeholder,
  onFocus,
  onBlur,
  ...rest
}: SearchFieldProps) {
  const [focused, setFocused] = useState(false)
  const id = useId()

  return (
    <div
      className={clsx(s.field, className)}
      data-focused={focused}
      data-invalid={invalid}
    >
      <Search className={s.icon} size={20} aria-hidden="true" />

      <input
        {...rest}
        ref={inputRef}
        id={id}
        className={clsx(s.input, 't-value-16-med-med')}
        type="text"
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => onValueChange(e.target.value)}
        onFocus={(e) => {
          setFocused(true)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
      />

      <AnimatePresence>
        {value.length > 0 && (
          <motion.button
            type="button"
            className={s.clear}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={spring.snappy}
            aria-label="Clear search"
            // Fires before blur, so clearing does not also close the results.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onValueChange('')
              onClear?.()
            }}
          >
            <X size={14} strokeWidth={2.5} aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
