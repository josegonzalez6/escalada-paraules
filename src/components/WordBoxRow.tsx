import { normalizeForLookup } from '../utils/normalize'
import styles from './WordBoxRow.module.css'

interface Props {
  length: number
  value: string
  baseCounts: Record<string, number>
  status?: 'neutral' | 'correct' | 'error'
  errorText?: string
  isActive?: boolean
  onRowClick?: () => void
}

function getInvalidPositions(value: string, baseCounts: Record<string, number>): Set<number> {
  const invalid = new Set<number>()
  const usedCounts: Record<string, number> = {}
  const norm = normalizeForLookup(value)
  for (let i = 0; i < norm.length; i++) {
    const c = norm[i]
    usedCounts[c] = (usedCounts[c] ?? 0) + 1
    if (!baseCounts[c] || usedCounts[c] > baseCounts[c]) {
      invalid.add(i)
    }
  }
  return invalid
}

export function WordBoxRow({ length, value, baseCounts, status = 'neutral', errorText, isActive, onRowClick }: Props) {
  const chars = value.toUpperCase().split('').slice(0, length)
  const invalidPos = status === 'neutral' ? getInvalidPositions(value, baseCounts) : new Set<number>()
  const cursorCol = isActive ? Math.min(value.length, length - 1) : -1

  return (
    <div className={styles.row} onClick={onRowClick}>
      <span className={[
        styles.badge,
        status === 'correct' ? styles.badgeCorrect : '',
        status === 'error' ? styles.badgeError : '',
      ].filter(Boolean).join(' ')}>
        {length}
      </span>
      <div
        className={[styles.boxesContainer, isActive ? styles.rowActive : ''].filter(Boolean).join(' ')}
        role="button"
        tabIndex={-1}
        aria-label={`Paraula de ${length} lletres`}
      >
        {Array.from({ length }, (_, i) => {
          const char = chars[i] ?? ''
          const isInvalid = status === 'neutral' && invalidPos.has(i)
          const isCursor = isActive && !char && i === cursorCol
          return (
            <div
              key={i}
              className={[
                styles.box,
                char ? styles.boxFilled : styles.boxEmpty,
                isInvalid ? styles.boxInvalid : '',
                status === 'correct' ? styles.boxCorrect : '',
                status === 'error' ? styles.boxError : '',
                isCursor ? styles.boxActive : '',
              ].filter(Boolean).join(' ')}
            >
              {char}
            </div>
          )
        })}
      </div>
      {errorText && <p className={styles.errorText}>{errorText}</p>}
    </div>
  )
}
