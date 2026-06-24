import { describe, it, expect } from 'vitest'
import { normalizeForLookup } from '../utils/normalize'

describe('normalizeForLookup — conserva ç, ñ i l·l', () => {
  it('elimina accent vocal: camí → cami', () => {
    expect(normalizeForLookup('camí')).toBe('cami')
  })

  it('paraula sense accent: cami → cami', () => {
    expect(normalizeForLookup('cami')).toBe('cami')
  })

  it('conserva ç: cançó → canço', () => {
    expect(normalizeForLookup('cançó')).toBe('canço')
  })

  it('canço → canço (sense accent és igual)', () => {
    expect(normalizeForLookup('canço')).toBe('canço')
  })

  it('canco ≠ canço (c i ç són lletres distintes)', () => {
    expect(normalizeForLookup('canco')).not.toBe('canço')
    expect(normalizeForLookup('canco')).toBe('canco')
  })

  it('conserva ñ: año → año', () => {
    expect(normalizeForLookup('año')).toBe('año')
  })

  it('ano ≠ año (n i ñ són lletres distintes)', () => {
    expect(normalizeForLookup('ano')).not.toBe('año')
    expect(normalizeForLookup('ano')).toBe('ano')
  })

  it('elimina accent: canción → cancion', () => {
    expect(normalizeForLookup('canción')).toBe('cancion')
  })

  it('conserva l·l: col·legi → col·legi', () => {
    expect(normalizeForLookup('col·legi')).toBe('col·legi')
  })

  it('minúscules: CATALÀ → catala (sense accent, minúsc.)', () => {
    expect(normalizeForLookup('CATALÀ')).toBe('catala')
  })

  it('elimina caràcters no vàlids: "hola!" → "hola"', () => {
    expect(normalizeForLookup('hola!')).toBe('hola')
  })
})
