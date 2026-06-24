import styles from './LadderRow.module.css'

interface Props {
  length: number
  value: string
  locked?: boolean
  onChange?: (val: string) => void
  status?: 'correct' | 'error' | 'neutral'
  errorText?: string
  autoFocus?: boolean
}

export function LadderRow({ length, value, locked, onChange, status, errorText, autoFocus }: Props) {
  const boxes = locked
    ? value.padEnd(length, ' ').split('')
    : Array(length).fill('')

  return (
    <div className={styles.row}>
      <div className={styles.lengthBadge}>{length}</div>
      {locked ? (
        <div className={styles.lockedWord}>
          {boxes.map((c, i) => (
            <div key={i} className={styles.box}>{c}</div>
          ))}
        </div>
      ) : (
        <div className={`${styles.inputWrapper} ${status ? styles[status] : ''}`}>
          <input
            className={styles.input}
            type="text"
            value={value}
            maxLength={length + 2}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            autoFocus={autoFocus}
            onChange={e => onChange?.(e.target.value)}
            placeholder={'_'.repeat(length)}
            aria-label={`Paraula de ${length} lletres`}
          />
        </div>
      )}
      {errorText && <p className={styles.errorText}>{errorText}</p>}
    </div>
  )
}
