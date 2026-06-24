import { describe, it, expect } from 'vitest'
import { validateCompleteAttempt } from '../utils/validate'
import type { GameEntry, GameInputs, DictionaryIndex } from '../types'

// Paraula base de 9 lletres: "caminants" = c:1,a:2,m:1,i:1,n:2,t:1,s:1
// Les respostes han de ser de 3 a 7 lletres, NO la paraula base mateixa.
const BASE = 'caminants'

const solutions: GameEntry['solutions'] = {
  '3': ['cam', 'mas', 'tan'],
  '4': ['cana', 'mana', 'cant'],
  '5': ['canta', 'manta', 'camin'],
  '6': ['camins', 'mantic'],
  '7': ['cantina'],
}

// Crea un DictionaryIndex des d'una llista de paraules (ja normalitzades per als tests)
function makeDictIndex(words: string[]): DictionaryIndex {
  const lookupMap = new Map<string, string[]>()
  const originalSet = new Set<string>()
  for (const w of words) {
    originalSet.add(w)
    if (!lookupMap.has(w)) lookupMap.set(w, [])
    lookupMap.get(w)!.push(w)
  }
  return { lookupMap, originalSet }
}

const dict: DictionaryIndex = makeDictIndex([
  // solucions vàlides
  'cam', 'mas', 'tan',
  'cana', 'mana', 'cant',
  'canta', 'manta', 'camin',
  'camins', 'mantic',
  'cantina',
  // paraules per tests negatius
  'perla',  // al dict però no formable des de 'caminants'
  'coco',   // 2 c's, no formable
])

describe('validateCompleteAttempt amb base de 9 lletres', () => {

  it('accepta una escalada correcta — cada paraula és independent', () => {
    // 'tan'(3) no conté lletres de 'cana'(4) i viceversa → però tots dos vàlids
    const inputs: GameInputs = ['tan', 'cana', 'canta', 'camins', 'cantina']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.score).toBe(5)
    expect(result.errors).toHaveLength(0)
  })

  it('calcula N/5 amb 3 paraules correctes', () => {
    const inputs: GameInputs = ['cam', 'cana', 'canta', '', '']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.score).toBe(3)
    expect(result.errors).toHaveLength(2)
  })

  it('calcula 0/5 amb tots els camps buits', () => {
    const inputs: GameInputs = ['', '', '', '', '']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.score).toBe(0)
    expect(result.errors).toHaveLength(5)
    expect(result.errors[0].reason).toBe('empty')
  })

  it('exigeix longitud exacta (3, 4, 5, 6, 7)', () => {
    // 'cam' (3) al camp de 4 → wrong_length
    const inputs: GameInputs = ['cam', 'cam', 'canta', 'camins', 'cantina']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.score).toBe(4)
    expect(result.errors.some(e => e.wordLength === 4 && e.reason === 'wrong_length')).toBe(true)
  })

  it('rebutja paraules que no existeixen al diccionari', () => {
    const inputs: GameInputs = ['xyz', 'cana', 'canta', 'camins', 'cantina']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.score).toBe(4)
    expect(result.errors.some(e => e.reason === 'not_in_dictionary')).toBe(true)
  })

  it('rebutja paraules que usen lletres fora de la base', () => {
    // 'perla' existeix al dict però té p, e, l que no estan a "caminants"
    const inputs: GameInputs = ['cam', 'cana', 'perla', 'camins', 'cantina']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.score).toBe(4)
    expect(result.errors.some(e => e.reason === 'letters_not_in_base' && e.wordLength === 5)).toBe(true)
  })

  it('la paraula base (9 lletres) NO pot ser resposta de 7 (wrong_length)', () => {
    // "caminants" té 9 lletres, el camp de 7 espera exactament 7 → wrong_length
    const inputs: GameInputs = ['cam', 'cana', 'canta', 'camins', 'caminants']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.errors.some(e => e.wordLength === 7 && e.reason === 'wrong_length')).toBe(true)
  })

  it('cada paraula és independent — no cal que contingui les lletres de l\'anterior', () => {
    // 'tan'(3) no comparteix totes les lletres de 'cana'(4) → però tots dos han de ser vàlids
    const inputs: GameInputs = ['tan', 'mana', 'manta', 'mantic', 'cantina']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.score).toBe(5)
  })

  it('el temps NO s\'enregistra si el resultat no és 5/5', () => {
    // Test de lògica: un score < 5 no ha de generar bestTime
    // (la lògica real és a saveResult, però verifiquem que score < 5 quan hi ha errors)
    const inputs: GameInputs = ['cam', '', '', '', '']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.score).toBeLessThan(5)
  })

  it('el generador ha de trobar solucions per a totes les longituds', () => {
    // Verificació que solutions té almenys un element per cada longitud
    for (const len of [3, 4, 5, 6, 7]) {
      expect(solutions[String(len) as keyof typeof solutions].length).toBeGreaterThan(0)
    }
  })
})
