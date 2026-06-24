import { forwardRef, useRef, useImperativeHandle } from 'react'
import { normalizeWord } from '../utils/normalize'
import styles from './WordBoxRow.module.css'

interface Props {
  length: number
  value: string
  baseCounts: Record<string, number>
  onChange: (val: string) => void
  onBackspaceAtStart?: () => void
  status?: 'neutral' | 'correct' | 'error'
  errorText?: string
  autoFocus?: boolean
  disabled?: boolean
}

export interface WordBoxRowHandle {
  focus(): void
}

function getInvalidPositions(value: string, baseCounts: Record<string, number>): Set<number> {
  const invalid = new Set<number>()
  const usedCounts: Record<string, number> = {}
  const norm = normalizeWord(value)
  for (let i = 0; i < norm.length; i++) {
    const c = norm[i]
    usedCounts[c] = (usedCounts[c] ?? 0) + 1
    if (!baseCounts[c] || usedCounts[c] > baseCounts[c]) {
      invalid.add(i)
    }
  }
  return invalid
}

export const WordBoxRow = forwardRef<WordBoxRowHandle, Props>(function WordBoxRow(
  { length, value, baseCounts, onChange, onBackspaceAtStart, status = 'neutral', errorText, autoFocus, disabled },
  ref
) {
  const inputRef = useRef<HTMLInputElement>(null)

  useImperativeHandle(ref, () => ({
    focus() { inputRef.current?.focus() },
  }))

  const chars = value.toUpperCase().split('').slice(0, length)
  const invalidPos = status === 'neutral' ? getInvalidPositions(value, baseCounts) : new Set<number>()

  function handleContainerClick() {
    if (!disabled) inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && value === '' && onBackspaceAtStart) {
      e.preventDefault()
      onBackspaceAtStart()
    }
  }

  return (
    <div className={styles.row}>
      <span className={[
        styles.badge,
        status === 'correct' ? styles.badgeCorrect : '',
        status === 'error' ? styles.badgeError : '',
      ].filter(Boolean).join(' ')}>
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
          const isInvalid = status === 'neutral' && invalidPos.has(i)
          return (
            <div
              key={i}
              className={[
                styles.box,
                char ? styles.boxFilled : styles.boxEmpty,
                isInvalid ? styles.boxInvalid : '',
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
          onKeyDown={handleKeyDown}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>
      {errorText && <p className={styles.errorText}>{errorText}</p>}
    </div>
  )
})
