import { normalizeForLookup } from '../utils/normalize'
import styles from './WordBoxRow.module.css'

interface Props {
  length: number
  value: string
  baseCounts: Record<string, number>
  status?: 'neutral' | 'correct' | 'error'
  errorText?: string
  isActive?: boolean
  activeCursorCol?: number | null  // column index where cursor is (replace mode)
  onRowClick?: () => void
  onCellClick?: (col: number) => void
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

export function WordBoxRow({
  length, value, baseCounts, status = 'neutral', errorText,
  isActive, activeCursorCol, onRowClick, onCellClick,
}: Props) {
  const chars = value.toUpperCase().split('').slice(0, length)
  const invalidPos = status === 'neutral' ? getInvalidPositions(value, baseCounts) : new Set<number>()
  // Natural cursor: first empty cell (or last if full)
  const naturalCursor = isActive && activeCursorCol == null
    ? Math.min(value.length, length - 1)
    : -1
  // Explicit cursor from cell click
  const explicitCursor = isActive && activeCursorCol != null ? activeCursorCol : -1
  const cursorCol = explicitCursor >= 0 ? explicitCursor : naturalCursor

  function handleCellClick(e: React.MouseEvent, col: number) {
    e.stopPropagation()
    onCellClick?.(col)
  }

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
        className={styles.boxesContainer}
        role="button"
        tabIndex={-1}
        aria-label={`Paraula de ${length} lletres`}
      >
        {Array.from({ length }, (_, i) => {
          const char = chars[i] ?? ''
          const isInvalid = status === 'neutral' && invalidPos.has(i)
          const isCursorCell = isActive && i === cursorCol && !char
          const isCursorReplace = isActive && i === cursorCol && !!char
          return (
            <div
              key={i}
              className={[
                styles.box,
                char ? styles.boxFilled : styles.boxEmpty,
                isInvalid ? styles.boxInvalid : '',
                status === 'correct' ? styles.boxCorrect : '',
                status === 'error' ? styles.boxError : '',
                isCursorCell ? styles.boxActive : '',
                isCursorReplace ? styles.boxCursorReplace : '',
              ].filter(Boolean).join(' ')}
              onClick={e => handleCellClick(e, i)}
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
