import type { ValidationResult, StepError, ErrorReason, Language } from '../types'
import { normalize, canFollow } from './normalize'

export function validateLadder(
  startWord: string,
  inputs: [string, string, string, string],
  dictionary: Set<string>,
  solution: string[],
  _lang: Language
): ValidationResult {
  const words = [normalize(startWord), ...inputs.map(normalize)]
  const errors: StepError[] = []
  const seen = new Set<string>()

  seen.add(words[0])

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const expectedLen = 3 + i
    const prev = words[i - 1]
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
    } else if (!canFollow(prev, word)) {
      // Determine which sub-reason
      const prevCounts: Record<string, number> = {}
      for (const c of prev) prevCounts[c] = (prevCounts[c] || 0) + 1
      const wordCounts: Record<string, number> = {}
      for (const c of word) wordCounts[c] = (wordCounts[c] || 0) + 1
      let missing = false
      for (const [c, n] of Object.entries(prevCounts)) {
        if ((wordCounts[c] ?? 0) < n) { missing = true; break }
      }
      reason = missing ? 'missing_letters' : 'too_many_new_letters'
    }

    if (reason) {
      errors.push({ step: i, word: inputs[i - 1] ?? '', reason })
    } else {
      seen.add(word)
    }
  }

  return {
    success: errors.length === 0,
    errors,
    solution,
  }
}

export function reasonText(reason: ErrorReason, lang: Language): string {
  const texts: Record<ErrorReason, Record<Language, string>> = {
    empty: { ca: 'Camp buit', es: 'Campo vacío' },
    wrong_length: { ca: 'Longitud incorrecta', es: 'Longitud incorrecta' },
    not_in_dictionary: { ca: 'Paraula no trobada al diccionari', es: 'Palabra no encontrada en el diccionario' },
    missing_letters: { ca: 'Falten lletres de la paraula anterior', es: 'Faltan letras de la palabra anterior' },
    too_many_new_letters: { ca: "S'ha afegit més d'una lletra nova", es: 'Se ha añadido más de una letra nueva' },
    duplicate: { ca: 'Paraula repetida', es: 'Palabra repetida' },
    invalid_chars: { ca: 'Caràcters no vàlids', es: 'Caracteres no válidos' },
  }
  return texts[reason][lang]
}
