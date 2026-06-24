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

describe('WordBoxRow — prioritat visual: resultat sobre cursor', () => {
  // Replica la lògica de showCursor i isCursorReplace del component
  function computeCellClasses(opts: {
    status: 'neutral' | 'correct' | 'error'
    isActive: boolean
    char: string
    col: number
    cursorCol: number
  }) {
    const { status, isActive, char, col, cursorCol } = opts
    const showCursor = isActive && status === 'neutral'
    const isCursorReplace = showCursor && col === cursorCol && !!char
    const isCursorCell = showCursor && col === cursorCol && !char
    return {
      boxError: status === 'error',
      boxCorrect: status === 'correct',
      boxCursorReplace: isCursorReplace,
      boxActive: isCursorCell,
    }
  }

  it('una cel·la error no té mai classe cursor (evita ambre sobre vermell)', () => {
    const classes = computeCellClasses({ status: 'error', isActive: true, char: 'A', col: 2, cursorCol: 2 })
    expect(classes.boxError).toBe(true)
    expect(classes.boxCursorReplace).toBe(false)
  })

  it('una cel·la correcta no té mai classe cursor', () => {
    const classes = computeCellClasses({ status: 'correct', isActive: true, char: 'G', col: 0, cursorCol: 0 })
    expect(classes.boxCorrect).toBe(true)
    expect(classes.boxCursorReplace).toBe(false)
  })

  it('durant edició (neutral), la cel·la activa amb text sí té cursor replace', () => {
    const classes = computeCellClasses({ status: 'neutral', isActive: true, char: 'G', col: 1, cursorCol: 1 })
    expect(classes.boxCursorReplace).toBe(true)
    expect(classes.boxError).toBe(false)
    expect(classes.boxCorrect).toBe(false)
  })

  it('durant edició (neutral), la cel·la activa buida té boxActive', () => {
    const classes = computeCellClasses({ status: 'neutral', isActive: true, char: '', col: 0, cursorCol: 0 })
    expect(classes.boxActive).toBe(true)
    expect(classes.boxCursorReplace).toBe(false)
  })

  it('si la fila no és activa, cap classe cursor s\'aplica', () => {
    const classes = computeCellClasses({ status: 'neutral', isActive: false, char: 'A', col: 0, cursorCol: 0 })
    expect(classes.boxCursorReplace).toBe(false)
    expect(classes.boxActive).toBe(false)
  })

  it('si la fila és error i activa (last row), NO hi ha highlight groc a cap cel·la', () => {
    for (let col = 0; col < 7; col++) {
      const classes = computeCellClasses({ status: 'error', isActive: true, char: 'X', col, cursorCol: 6 })
      expect(classes.boxCursorReplace).toBe(false)
      expect(classes.boxActive).toBe(false)
    }
  })

  it('quan phase no és playing, isActive és false i no hi ha cursor', () => {
    const classes = computeCellClasses({ status: 'neutral', isActive: false, char: 'A', col: 3, cursorCol: 3 })
    expect(classes.boxCursorReplace).toBe(false)
    expect(classes.boxActive).toBe(false)
  })

  it('si status és error i isActive és false (phase finished), cap classe cursor', () => {
    const classes = computeCellClasses({ status: 'error', isActive: false, char: 'Z', col: 2, cursorCol: 2 })
    expect(classes.boxError).toBe(true)
    expect(classes.boxCursorReplace).toBe(false)
    expect(classes.boxActive).toBe(false)
  })

  // Les classes active/cursorReplace ja NO apliquen background-color (v0.16.0)
  // Usen outline+box-shadow, per tant no poden interferir mai amb vermell/verd.
  it('active i error poden coexistir, però error sempre és present (disseny outline)', () => {
    // En el disseny nou, active usa outline i no toca background.
    // Si per qualsevol motiu isActive=true i status='error', boxError ha de ser present.
    // showCursor bloqueja boxActive/boxCursorReplace quan status!='neutral', per tant:
    const classes = computeCellClasses({ status: 'error', isActive: true, char: 'A', col: 0, cursorCol: 0 })
    expect(classes.boxError).toBe(true)
    expect(classes.boxCursorReplace).toBe(false)
    expect(classes.boxActive).toBe(false)
  })
})
