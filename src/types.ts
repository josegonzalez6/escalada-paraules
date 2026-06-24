export type Language = 'ca' | 'es'

export type GamePhase = 'playing' | 'finished'

// 5 inputs: paraules de 3, 4, 5, 6, 7 lletres
export type GameInputs = [string, string, string, string, string]

export interface GameEntry {
  baseWord: string       // paraula base de 8-10 lletres (conjunt de lletres disponibles)
  baseLetters: string[]  // lletres individuals de baseWord, per mostrar a la UI
  solutions: {
    '3': string[]
    '4': string[]
    '5': string[]
    '6': string[]
    '7': string[]
  }
}

export interface ValidationResult {
  score: number          // 0-5: quantes paraules eren correctes
  errors: StepError[]   // errors per cada longitud que ha fallat
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
  perfect: number        // partides amb 5/5
  bestTime: number | null // només per 5/5
  currentStreak: number  // ratxa de 5/5 consecutius
  bestStreak: number
}
