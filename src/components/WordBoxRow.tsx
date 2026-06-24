import { forwardRef, useRef, useImperativeHandle } from 'react'
import styles from './WordBoxRow.module.css'

interface Props {
  length: number
  value: string
  onChange: (val: string) => void
  status?: 'neutral' | 'correct' | 'error'
  errorText?: string
  autoFocus?: boolean
  disabled?: boolean
}

export interface WordBoxRowHandle {
  focus(): void
}

export const WordBoxRow = forwardRef<WordBoxRowHandle, Props>(function WordBoxRow(
  { length, value, onChange, status = 'neutral', errorText, autoFocus, disabled },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus() { inputRef.current?.focus() },
  }))

  const chars = value.toUpperCase().split('').slice(0, length)
  const cursorIdx = Math.min(chars.length, length - 1)

  function handleContainerClick() {
    if (!disabled) inputRef.current?.focus()
  }

  return (
    <div className={styles.row}>
      <span className={`${styles.badge} ${status === 'correct' ? styles.badgeCorrect : ''} ${status === 'error' ? styles.badgeError : ''}`}>
        {length}
      </span>
      <div
        className={styles.boxesContainer}
        onClick={handleContainerClick}
        role="button"
        tabIndex={-1}
        aria-label={`Paraula de ${length} lletres`}
      >
        {Array.from({ length }, (_, i) => {
          const char = chars[i] ?? ''
          const isCursor = !disabled && status === 'neutral' && i === cursorIdx && chars.length < length
          return (
            <div
              key={i}
              className={[
                styles.box,
                char ? styles.boxFilled : styles.boxEmpty,
                isCursor ? styles.boxCursor : '',
                status === 'correct' ? styles.boxCorrect : '',
                status === 'error' ? styles.boxError : '',
              ].filter(Boolean).join(' ')}
            >
              {char}
            </div>
          )
        })}
        <input
          ref={inputRef}
          className={styles.hiddenInput}
          type="text"
          inputMode="text"
          value={value}
          maxLength={length}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          disabled={disabled}
          onChange={e => onChange(e.target.value)}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
      {errorText && (
        <p className={styles.errorText}>{errorText}</p>
      )}
    </div>
  )
})
