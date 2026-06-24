import { normalizeWord } from './normalize'
import type { GameInputs } from '../types'

export interface KeyboardState {
  inputs: GameInputs
  activeRow: number
  clickedCol?: number | null  // null/undefined = append mode; number = replace at column
}

export function applyChar(state: KeyboardState, rawChar: string): KeyboardState {
  const char = normalizeWord(rawChar)
  if (!char) return state

  const { inputs, activeRow: row, clickedCol = null } = state
  const newInputs = [...inputs] as GameInputs
  const rowLen = 3 + row

  if (clickedCol !== null) {
    // Replace mode: overwrite char at clickedCol, advance cursor
    const col = clickedCol
    if (col < rowLen) {
      const cur = newInputs[row].padEnd(col, ' ').slice(0, col)  // ensure col exists
      const after = newInputs[row].slice(col + 1)
      newInputs[row] = cur + char + after
      const nextCol = col + 1
      if (nextCol >= rowLen && row < 4) {
        return { inputs: newInputs, activeRow: row + 1, clickedCol: null }
      }
      return { inputs: newInputs, activeRow: row, clickedCol: nextCol < rowLen ? nextCol : null }
    }
    return { inputs: newInputs, activeRow: row, clickedCol: null }
  }

  // Append mode: add to end of current row
  if (newInputs[row].length < rowLen) {
    newInputs[row] = newInputs[row] + char
    if (newInputs[row].length === rowLen && row < 4) {
      return { inputs: newInputs, activeRow: row + 1, clickedCol: null }
    }
  } else if (row < 4) {
    const nextRow = row + 1
    const nextRowLen = 3 + nextRow
    if (newInputs[nextRow].length < nextRowLen) {
      newInputs[nextRow] = newInputs[nextRow] + char
      const newRow = nextRow
      if (newInputs[nextRow].length === nextRowLen && newRow < 4) {
        return { inputs: newInputs, activeRow: newRow + 1, clickedCol: null }
      }
      return { inputs: newInputs, activeRow: newRow, clickedCol: null }
    }
  }

  return { inputs: newInputs, activeRow: row, clickedCol: null }
}

export function applyBackspace(state: KeyboardState): KeyboardState {
  const { inputs, activeRow: row, clickedCol = null } = state
  const newInputs = [...inputs] as GameInputs

  if (clickedCol !== null && clickedCol > 0) {
    // Remove char before cursor, shift rest left
    const col = clickedCol - 1
    const cur = newInputs[row]
    newInputs[row] = cur.slice(0, col) + cur.slice(col + 1)
    return { inputs: newInputs, activeRow: row, clickedCol: col }
  }

  // Append mode backspace
  if (newInputs[row].length > 0) {
    newInputs[row] = newInputs[row].slice(0, -1)
  } else if (row > 0) {
    const prevRow = row - 1
    if (newInputs[prevRow].length > 0) {
      newInputs[prevRow] = newInputs[prevRow].slice(0, -1)
    }
    return { inputs: newInputs, activeRow: prevRow, clickedCol: null }
  }

  return { inputs: newInputs, activeRow: row, clickedCol: null }
}

export function applyChars(state: KeyboardState, rawChars: string): KeyboardState {
  let s = state
  for (const c of rawChars) {
    s = applyChar(s, c)
  }
  return s
}
