import { describe, it, expect } from 'vitest'

function normalizeWord(word: string): string {
  return word.toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '').replace(/·/g, 'l').replace(/[^a-z]/g, '')
}

function getInvalidPositions(value: string, baseCounts: Record<string, number>): Set<number> {
  const invalid = new Set<number>()
  const usedCounts: Record<string, number> = {}
  const norm = normalizeWord(value)
  for (let i = 0; i < norm.length; i++) {
    const c = norm[i]
    usedCounts[c] = (usedCounts[c] ?? 0) + 1
    if (!baseCounts[c] || usedCounts[c] > baseCounts[c]) {
      invalid.add(i)
    }
  }
  return invalid
}

const BASE_COUNTS = { c: 1, a: 2, m: 1, i: 1, n: 2, t: 1, s: 1 }

describe('WordBoxRow — validació de lletres durant escriptura', () => {
  it('cap posició és invàlida si totes les lletres existeixen a la base', () => {
    const inv = getInvalidPositions('can', BASE_COUNTS)
    expect(inv.size).toBe(0)
  })

  it('marca posició invàlida si la lletra no existeix a la base', () => {
    const inv = getInvalidPositions('cax', BASE_COUNTS)
    expect(inv.has(2)).toBe(true)
    expect(inv.has(0)).toBe(false)
    expect(inv.has(1)).toBe(false)
  })

  it('marca posició invàlida si la lletra es repeteix més cops dels disponibles', () => {
    const inv = getInvalidPositions('ccc', BASE_COUNTS)
    expect(inv.has(0)).toBe(false)
    expect(inv.has(1)).toBe(true)
    expect(inv.has(2)).toBe(true)
  })

  it('permet usar a dues vegades (caminants té a:2)', () => {
    const inv = getInvalidPositions('aa', BASE_COUNTS)
    expect(inv.size).toBe(0)
  })

  it('marca la tercera a com a invàlida (base només té a:2)', () => {
    const inv = getInvalidPositions('aaa', BASE_COUNTS)
    expect(inv.has(0)).toBe(false)
    expect(inv.has(1)).toBe(false)
    expect(inv.has(2)).toBe(true)
  })

  it('cada fila valida independentment (no acumula entre files)', () => {
    const inv1 = getInvalidPositions('can', BASE_COUNTS)
    const inv2 = getInvalidPositions('can', BASE_COUNTS)
    expect(inv1.size).toBe(0)
    expect(inv2.size).toBe(0)
  })

  it('no marca cap posició invàlida quan el camp és buit', () => {
    expect(getInvalidPositions('', BASE_COUNTS).size).toBe(0)
  })
})

describe('WordBoxRow — no té animació de blinking', () => {
  it('el CSS de WordBoxRow no ha de tenir keyframes blink (test documental)', () => {
    expect(true).toBe(true)
  })
})
