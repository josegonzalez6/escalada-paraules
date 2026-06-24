export type Language = 'ca' | 'es'

export type GamePhase = 'playing' | 'finished'

// 5 inputs: paraules de 3, 4, 5, 6, 7 lletres
export type GameInputs = [string, string, string, string, string]

export interface GameEntry {
  baseWord: string
  solutions: {
    '3': string[]
    '4': string[]
    '5': string[]
    '6': string[]
    '7': string[]
  }
}

export interface ValidationResult {
  success: boolean
  errors: StepError[]
  solutions: GameEntry['solutions']
}

export interface StepError {
  wordLength: number // 3, 4, 5, 6 o 7
  word: string
  reason: ErrorReason
}

export type ErrorReason =
  | 'empty'
  | 'wrong_length'
  | 'not_in_dictionary'
  | 'letters_not_in_base'
  | 'duplicate'
  | 'invalid_chars'

export interface Stats {
  played: number
  won: number
  bestTime: number | null
  currentStreak: number
  bestStreak: number
}
