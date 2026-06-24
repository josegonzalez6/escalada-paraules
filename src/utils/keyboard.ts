import { normalizeWord } from './normalize'
import type { GameInputs } from '../types'

export interface KeyboardState {
  inputs: GameInputs
  activeRow: number
}

export function applyChar(state: KeyboardState, rawChar: string): KeyboardState {
  const char = normalizeWord(rawChar)
  if (!char) return state

  let { inputs, activeRow: row } = state
  const newInputs = [...inputs] as GameInputs
  const rowLen = 3 + row

  if (newInputs[row].length < rowLen) {
    newInputs[row] = newInputs[row] + char
    if (newInputs[row].length === rowLen && row < 4) {
      row = row + 1
    }
  } else if (row < 4) {
    const nextRow = row + 1
    const nextRowLen = 3 + nextRow
    if (newInputs[nextRow].length < nextRowLen) {
      newInputs[nextRow] = newInputs[nextRow] + char
      row = nextRow
      if (newInputs[nextRow].length === nextRowLen && row < 4) {
        row = row + 1
      }
    }
  }

  return { inputs: newInputs, activeRow: row }
}

export function applyBackspace(state: KeyboardState): KeyboardState {
  let { inputs, activeRow: row } = state
  const newInputs = [...inputs] as GameInputs

  if (newInputs[row].length > 0) {
    newInputs[row] = newInputs[row].slice(0, -1)
  } else if (row > 0) {
    const prevRow = row - 1
    if (newInputs[prevRow].length > 0) {
      newInputs[prevRow] = newInputs[prevRow].slice(0, -1)
    }
    row = prevRow
  }

  return { inputs: newInputs, activeRow: row }
}

export function applyChars(state: KeyboardState, rawChars: string): KeyboardState {
  let s = state
  for (const c of rawChars) {
    s = applyChar(s, c)
  }
  return s
}
