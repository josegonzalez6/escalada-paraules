import { describe, it, expect } from 'vitest'
import { normalize, letterCounts, canFollow } from '../utils/normalize'

describe('normalize', () => {
  it('converts to lowercase', () => {
    expect(normalize('CASA')).toBe('casa')
  })

  it('removes accents', () => {
    expect(normalize('àéíóú')).toBe('aeiou')
    expect(normalize('café')).toBe('cafe')
  })

  it('handles catalan ç', () => {
    expect(normalize('cançó')).toBe('canco')
  })

  it('removes non-alpha characters', () => {
    expect(normalize('bon dia!')).toBe('bondia')
  })
})

describe('letterCounts', () => {
  it('counts letters correctly', () => {
    expect(letterCounts('casa')).toEqual({ c: 1, a: 2, s: 1 })
  })

  it('counts repeated letters', () => {
    expect(letterCounts('aaa')).toEqual({ a: 3 })
  })
})

describe('canFollow', () => {
  it('returns true when next has all prev letters + 1 new', () => {
    expect(canFollow('sol', 'sols')).toBe(true)
    expect(canFollow('mar', 'marc')).toBe(true)
    expect(canFollow('gat', 'gats')).toBe(true)
  })

  it('returns true with reordering', () => {
    expect(canFollow('sol', 'losa')).toBe(true)  // s,o,l -> l,o,s,a
  })

  it('returns false when wrong length', () => {
    expect(canFollow('sol', 'sola')).toBe(true)
    expect(canFollow('sol', 'solar')).toBe(false) // +2 letters
  })

  it('returns false when missing letters', () => {
    expect(canFollow('sol', 'gola')).toBe(false) // no s
  })

  it('returns false when adding more than 1 letter', () => {
    expect(canFollow('sol', 'solra')).toBe(false)
  })
})
