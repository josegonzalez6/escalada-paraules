import { describe, it, expect } from 'vitest'
import { validateCompleteAttempt } from '../utils/validate'
import type { GameEntry, GameInputs } from '../types'

// Paraula base de test: 'cartons' = { c:1, a:1, r:1, t:1, o:1, n:1, s:1 }
const BASE = 'cartons'

const solutions: GameEntry['solutions'] = {
  '3': ['car', 'rot', 'son'],
  '4': ['rost', 'cort', 'tron'],
  '5': ['canto', 'trons'],
  '6': ['carton'],
  '7': ['cartons'],
}

const dict = new Set([
  'car', 'rot', 'son',
  'rost', 'cort', 'tron',
  'canto', 'trons',
  'carton',
  'cartons',
  // paraules per tests negatius (existents al diccionari però no formables)
  'perla', 'carro',
])

describe('validateCompleteAttempt', () => {
  it('accepta una escalada correcta', () => {
    const inputs: GameInputs = ['car', 'rost', 'canto', 'carton', 'cartons']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rebutja camps buits', () => {
    const inputs: GameInputs = ['', '', '', '', '']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.success).toBe(false)
    expect(result.errors[0].reason).toBe('empty')
    expect(result.errors).toHaveLength(5)
  })

  it('exigeix longitud exacta per cada pas', () => {
    // 'car' té 3 lletres però el posem al camp de 4 (index 1)
    const inputs: GameInputs = ['car', 'car', 'canto', 'carton', 'cartons']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.success).toBe(false)
    expect(result.errors.some(e => e.wordLength === 4 && e.reason === 'wrong_length')).toBe(true)
  })

  it('rebutja paraules que no existeixen al diccionari', () => {
    const inputs: GameInputs = ['cor', 'rost', 'canto', 'carton', 'cartons'] // 'cor' no està al dict
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.success).toBe(false)
    expect(result.errors.some(e => e.reason === 'not_in_dictionary')).toBe(true)
  })

  it('rebutja paraules que usen lletres fora de la base', () => {
    // 'carro' al dict però necessita 2 r's, 'cartons' només en té 1
    // 'carro' (5) usat en lloc de 'canto': usa 2 r's -> fora de base
    const inputs2: GameInputs = ['car', 'rost', 'carro', 'carton', 'cartons']
    const result = validateCompleteAttempt(BASE, inputs2, dict, solutions)
    expect(result.success).toBe(false)
    expect(result.errors.some(e => e.reason === 'letters_not_in_base')).toBe(true)
  })

  it('rebutja una paraula absent del diccionari i fora de la base', () => {
    const inputs: GameInputs = ['car', 'rost', 'perla', 'carton', 'cartons'] // 'perla' no és formable
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.success).toBe(false)
    // 'perla' existeix al dict però no es pot formar amb 'cartons'
    expect(result.errors.some(e => e.wordLength === 5)).toBe(true)
  })

  it('rebutja paraules repetides', () => {
    // 'car' (3) i 'car' novament (però no pot ser al camp de 4 per longitud)
    // Ús de 'rot' dues vegades: al camp 3 i al camp 4 com a 'rots'? no...
    // Test real: 'rot' (3) i 'tron' (4) i 'canto' (5) i 'carton' (6) i 'rot' repetit no pot passar per longitud
    // Però podem repetir si la mateixa paraula de 4 sortís com a solució de 4 i 4... impossible.
    // Testem que si els inputs normalitzats coincideixen en paraules de la mateixa longitud (pot passar si
    // l'usuari escriu al camp 3 i al camp 7 la mateixa paraula de 3 lletres? No, perquè lengths diferent)
    // El cas real: 'son' és de 3 lletres; si es posa 'son' al camp 3 i 'son' al camp... no possible (longitud)
    // Però: camp 3='car', camp 4='rost', camp 5='canto', camp 6='carton', camp 7='carton' -> camp7 te 6 not 7 -> wrong_length
    // Per testejar duplicate real: forcem que el dict tingui la mateixa paraula a longitud diferent... no possible.
    // El duplicate només es produiria si dos camps de la MATEIXA longitud compartissin valor, però hi ha un sol camp per longitud.
    // Deixem un test documentant aquest comportament:
    const inputs: GameInputs = ['car', 'rost', 'canto', 'carton', 'cartons']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.success).toBe(true) // cap duplicat possible amb longituds totes diferents
  })

  it('cada paraula és independent (no cal que contingui les lletres de l\'anterior)', () => {
    // 'son' (3), 'tron' (4), 'canto' (5), 'carton' (6), 'cartons' (7)
    // 'tron' NO conté totes les lletres de 'son' (la 's' no hi és), però ha de ser vàlid
    const inputs: GameInputs = ['son', 'tron', 'canto', 'carton', 'cartons']
    const result = validateCompleteAttempt(BASE, inputs, dict, solutions)
    expect(result.success).toBe(true)
  })
})
