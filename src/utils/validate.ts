import type { ValidationResult, StepError, ErrorReason, Language, GameInputs, GameEntry, DictionaryIndex } from '../types'
import { normalizeForLookup, getLetterCountsForLookup } from './normalize'

function canBeFormedFromBaseLookup(candidate: string, baseCounts: Record<string, number>): boolean {
  const candCounts = getLetterCountsForLookup(candidate)
  for (const [c, n] of Object.entries(candCounts)) {
    if ((baseCounts[c] ?? 0) < n) return false
  }
  return true
}

export function validateCompleteAttempt(
  baseWord: string,
  inputs: GameInputs,
  dictIndex: DictionaryIndex,
  solutions: GameEntry['solutions']
): ValidationResult {
  const baseNorm = normalizeForLookup(baseWord)
  const baseCounts = getLetterCountsForLookup(baseNorm)
  const errors: StepError[] = []
  const seen = new Set<string>()

  for (let i = 0; i < inputs.length; i++) {
    const expectedLen = 3 + i
    const rawInput = inputs[i]
    const wordNorm = normalizeForLookup(rawInput)
    let reason: ErrorReason | null = null

    if (!wordNorm) {
      reason = 'empty'
    } else if (wordNorm.length !== expectedLen) {
      reason = 'wrong_length'
    } else if (seen.has(wordNorm)) {
      reason = 'duplicate'
    } else if (!dictIndex.lookupMap.has(wordNorm)) {
      reason = 'not_in_dictionary'
    } else if (!canBeFormedFromBaseLookup(wordNorm, baseCounts)) {
      reason = 'letters_not_in_base'
    }

    if (reason) {
      errors.push({ wordLength: expectedLen, word: rawInput, reason })
    } else {
      seen.add(wordNorm)
    }
  }

  const score = 5 - errors.length
  return { score, errors, solutions }
}

export function reasonText(reason: ErrorReason, lang: Language): string {
  const T = {
    ca: {
      empty: 'Camp buit',
      wrong_length: 'Longitud incorrecta',
      not_in_dictionary: 'No existeix al diccionari',
      letters_not_in_base: 'Usa lletres no disponibles',
      duplicate: 'Paraula duplicada',
      invalid_chars: 'Caràcters no vàlids',
    },
    es: {
      empty: 'Campo vacío',
      wrong_length: 'Longitud incorrecta',
      not_in_dictionary: 'No existe en el diccionario',
      letters_not_in_base: 'Usa letras no disponibles',
      duplicate: 'Palabra duplicada',
      invalid_chars: 'Caracteres no válidos',
    },
  }
  return T[lang][reason] ?? reason
}
