export type Language = 'ca' | 'es'

export type GamePhase = 'playing' | 'validating' | 'finished'

export interface LadderStep {
  word: string
  length: number
}

export interface GameState {
  lang: Language
  startWord: string
  inputs: [string, string, string, string] // 4,5,6,7 letters
  phase: GamePhase
  timeLeft: number
  ladder: string[] | null // the full generated ladder [w3,w4,w5,w6,w7]
  validationResult: ValidationResult | null
}

export interface ValidationResult {
  success: boolean
  errors: StepError[]
  solution: string[]
}

export interface StepError {
  step: number // 0=step3->4, 1=step4->5...
  word: string
  reason: ErrorReason
}

export type ErrorReason =
  | 'empty'
  | 'wrong_length'
  | 'not_in_dictionary'
  | 'missing_letters'
  | 'too_many_new_letters'
  | 'duplicate'
  | 'invalid_chars'

export interface Stats {
  played: number
  won: number
  bestTime: number | null
  currentStreak: number
  bestStreak: number
}
