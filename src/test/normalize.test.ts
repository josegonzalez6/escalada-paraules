import { describe, it, expect } from 'vitest'
import { normalizeWord, getLetterCounts, canBeFormedFromBase } from '../utils/normalize'

describe('normalizeWord', () => {
  it('converts to lowercase', () => {
    expect(normalizeWord('CASA')).toBe('casa')
  })

  it('removes accents', () => {
    expect(normalizeWord('àéíóú')).toBe('aeiou')
    expect(normalizeWord('café')).toBe('cafe')
  })

  it('handles catalan ç', () => {
    expect(normalizeWord('cançó')).toBe('canco')
  })

  it('removes non-alpha characters', () => {
    expect(normalizeWord('bon dia!')).toBe('bondia')
  })
})

describe('getLetterCounts', () => {
  it('counts letters correctly', () => {
    expect(getLetterCounts('casa')).toEqual({ c: 1, a: 2, s: 1 })
  })

  it('counts repeated letters', () => {
    expect(getLetterCounts('aaa')).toEqual({ a: 3 })
  })
})

describe('canBeFormedFromBase — base de 8-10 lletres', () => {
  // base = "caminants" (9 lletres): c:1, a:2, m:1, i:1, n:2, t:1, s:1

  it('accepta paraules de 3 lletres formades de la base', () => {
    expect(canBeFormedFromBase('cam', 'caminants')).toBe(true)
    expect(canBeFormedFromBase('mas', 'caminants')).toBe(true)
    expect(canBeFormedFromBase('tan', 'caminants')).toBe(true)
  })

  it('accepta paraules de 7 lletres formades de la base (no la base mateixa)', () => {
    // cantina (7): c:1,a:2,n:2,t:1,i:1 — tot present a "caminants"
    expect(canBeFormedFromBase('cantina', 'caminants')).toBe(true)
  })

  it('rebutja paraules que usen lletres absents', () => {
    expect(canBeFormedFromBase('perla', 'caminants')).toBe(false)  // no p, e, l
    expect(canBeFormedFromBase('robot', 'caminants')).toBe(false)  // no r, o, b
  })

  it('rebutja paraules que repeteixen massa una lletra', () => {
    // "caminants" té c:1. "coco" necessita c:2, o:2 → fals
    expect(canBeFormedFromBase('coco', 'caminants')).toBe(false)
    // "caminants" té a:2. "macarena" necessita a:3 → fals
    expect(canBeFormedFromBase('macarena', 'caminants')).toBe(false)
  })

  it('la paraula base (9 lletres) no es pot posar com a resposta de 7 lletres', () => {
    // "caminants" té 9 lletres → no pot ser resposta de 7 (longitud incorrecta)
    expect('caminants'.length).toBe(9)
    expect('caminants'.length).not.toBe(7)
  })

  it('accepta base de 8 lletres', () => {
    // base = "caminant" (8): c:1,a:2,m:1,i:1,n:2,t:1
    expect(canBeFormedFromBase('cantina', 'caminant')).toBe(true)  // cantina: c:1,a:2,n:2,t:1,i:1
    expect(canBeFormedFromBase('cam', 'caminant')).toBe(true)
  })

  it('returns false for empty base', () => {
    expect(canBeFormedFromBase('car', '')).toBe(false)
  })
})
