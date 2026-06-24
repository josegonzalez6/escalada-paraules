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

describe('canBeFormedFromBase', () => {
  // base = cartons = { c:1, a:1, r:1, t:1, o:1, n:1, s:1 }

  it('returns true when candidate uses only base letters', () => {
    expect(canBeFormedFromBase('car', 'cartons')).toBe(true)
    expect(canBeFormedFromBase('rost', 'cartons')).toBe(true)
    expect(canBeFormedFromBase('canto', 'cartons')).toBe(true)
    expect(canBeFormedFromBase('cartons', 'cartons')).toBe(true)
  })

  it('returns true with letter reordering', () => {
    expect(canBeFormedFromBase('rot', 'cartons')).toBe(true)
    expect(canBeFormedFromBase('tron', 'cartons')).toBe(true)
  })

  it('returns false when candidate uses a letter absent from base', () => {
    // 'cartons' has no 'p', 'e', 'l'
    expect(canBeFormedFromBase('perla', 'cartons')).toBe(false)
    expect(canBeFormedFromBase('bol', 'cartons')).toBe(false)
  })

  it('returns false when candidate repeats a letter more times than in base', () => {
    // 'cartons' has only 1 'r', 1 'a'
    expect(canBeFormedFromBase('carro', 'cartons')).toBe(false) // needs 2 r's
    expect(canBeFormedFromBase('caramel', 'cartons')).toBe(false) // needs 2 a's + absent letters
  })

  it('returns false for empty base', () => {
    expect(canBeFormedFromBase('car', '')).toBe(false)
  })

  it('returns true for empty candidate against any base', () => {
    expect(canBeFormedFromBase('', 'cartons')).toBe(true)
  })
})
