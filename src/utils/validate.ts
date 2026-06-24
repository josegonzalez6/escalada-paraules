import type { ValidationResult, StepError, ErrorReason, Language, GameInputs, GameEntry } from '../types'
import { normalizeWord, canBeFormedFromBase } from './normalize'

export function validateCompleteAttempt(
  baseWord: string,
  inputs: GameInputs,
  dictionary: Set<string>,
  solutions: GameEntry['solutions']
): ValidationResult {
  const base = normalizeWord(baseWord)
  const errors: StepError[] = []
  const seen = new Set<string>()

  for (let i = 0; i < inputs.length; i++) {
    const expectedLen = 3 + i
    const word = normalizeWord(inputs[i])
    let reason: ErrorReason | null = null

    if (!word) {
      reason = 'empty'
    } else if (/[^a-z]/.test(word)) {
      reason = 'invalid_chars'
    } else if (word.length !== expectedLen) {
      reason = 'wrong_length'
    } else if (seen.has(word)) {
      reason = 'duplicate'
    } else if (!dictionary.has(word)) {
      reason = 'not_in_dictionary'
    } else if (!canBeFormedFromBase(word, base)) {
      reason = 'letters_not_in_base'
    }

    if (reason) {
      errors.push({ wordLength: expectedLen, word: inputs[i], reason })
    } else {
      seen.add(word)
    }
  }

  const score = 5 - errors.length

  return { score, errors, solutions }
}

export function reasonText(reason: ErrorReason, lang: Language): string {
  const texts: Record<ErrorReason, Record<Language, string>> = {
    empty: {
      ca: 'Camp buit',
      es: 'Campo vacío',
    },
    wrong_length: {
      ca: 'Longitud incorrecta',
      es: 'Longitud incorrecta',
    },
    not_in_dictionary: {
      ca: 'Paraula no trobada al diccionari',
      es: 'Palabra no encontrada en el diccionario',
    },
    letters_not_in_base: {
      ca: 'Usa lletres que no estan disponibles',
      es: 'Usa letras que no están disponibles',
    },
    duplicate: {
      ca: 'Paraula repetida',
      es: 'Palabra repetida',
    },
    invalid_chars: {
      ca: 'Caràcters no vàlids',
      es: 'Caracteres no válidos',
    },
  }
  return texts[reason][lang]
}
