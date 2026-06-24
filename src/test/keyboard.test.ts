import { describe, it, expect } from 'vitest'
import { applyChar, applyBackspace, applyChars } from '../utils/keyboard'
import type { KeyboardState } from '../utils/keyboard'

function emptyState(): KeyboardState {
  return { inputs: ['', '', '', '', ''], activeRow: 0 }
}

describe('applyChar — escriptura contínua', () => {
  it('escriu una lletra a la fila 0', () => {
    const s = applyChar(emptyState(), 'a')
    expect(s.inputs[0]).toBe('a')
    expect(s.activeRow).toBe(0)
  })

  it('omple la fila 0 (3 lletres) i passa a fila 1', () => {
    let s = applyChars(emptyState(), 'abc')
    expect(s.inputs[0]).toBe('abc')
    expect(s.activeRow).toBe(1)
  })

  it('continua omplint fila 1 (4 lletres) sense fer clic', () => {
    let s = applyChars(emptyState(), 'abcabcd')
    expect(s.inputs[0]).toBe('abc')
    expect(s.inputs[1]).toBe('abcd')
    expect(s.activeRow).toBe(2)
  })

  it('omple fila 2 (5 lletres) sense fer clic', () => {
    let s = applyChars(emptyState(), 'abcabcdabcde')
    expect(s.inputs[2]).toBe('abcde')
    expect(s.activeRow).toBe(3)
  })

  it('omple fila 3 (6 lletres) sense fer clic', () => {
    let s = applyChars(emptyState(), 'abcabcdabcdeabcdef')
    expect(s.inputs[3]).toBe('abcdef')
    expect(s.activeRow).toBe(4)
  })

  it('omple fila 4 (7 lletres) i no avança més', () => {
    let s = applyChars(emptyState(), 'abcabcdabcdeabcdefabcdefg')
    expect(s.inputs[4]).toBe('abcdefg')
    expect(s.activeRow).toBe(4)
  })

  it('ignora lletres extra quan la fila i la fila següent estan plenes', () => {
    let s = applyChars(emptyState(), 'abcabcdabcdeabcdefabcdefg')
    const s2 = applyChar(s, 'x')
    expect(s2.inputs[4]).toBe('abcdefg') // no canvia
    expect(s2.activeRow).toBe(4)
  })

  it('normalitza majúscules (A → a)', () => {
    const s = applyChar(emptyState(), 'A')
    expect(s.inputs[0]).toBe('a')
  })

  it('normalitza accents (é → e)', () => {
    const s = applyChar(emptyState(), 'é')
    expect(s.inputs[0]).toBe('e')
  })

  it('ignora caràcters no vàlids (dígits, símbols)', () => {
    const s = applyChar(emptyState(), '5')
    expect(s.inputs[0]).toBe('')
    expect(s.activeRow).toBe(0)
  })
})

describe('applyBackspace — esborrat', () => {
  it('esborra l\'última lletra de la fila activa', () => {
    let s = applyChars(emptyState(), 'ab')
    s = applyBackspace(s)
    expect(s.inputs[0]).toBe('a')
    expect(s.activeRow).toBe(0)
  })

  it('des del principi de fila 1, torna a fila 0 i esborra', () => {
    let s = applyChars(emptyState(), 'abc') // fila 0 plena, cursor a fila 1
    expect(s.activeRow).toBe(1)
    s = applyBackspace(s)
    expect(s.inputs[0]).toBe('ab')
    expect(s.activeRow).toBe(0)
  })

  it('des de fila 2 buida, torna a fila 1 i esborra', () => {
    let s = applyChars(emptyState(), 'abcabcd') // fila 1 plena, cursor a fila 2
    s = applyBackspace(s)
    expect(s.inputs[1]).toBe('abc')
    expect(s.activeRow).toBe(1)
  })

  it('des de fila 4 buida, torna a fila 3 i esborra', () => {
    let s = applyChars(emptyState(), 'abcabcdabcdeabcdef') // fila 3 plena, cursor a fila 4
    s = applyBackspace(s)
    expect(s.inputs[3]).toBe('abcde')
    expect(s.activeRow).toBe(3)
  })

  it('a fila 0 buida, no fa res', () => {
    const s = applyBackspace(emptyState())
    expect(s.inputs[0]).toBe('')
    expect(s.activeRow).toBe(0)
  })
})

describe('applyChars — seqüència completa', () => {
  it('escriure tota l\'escala de cop', () => {
    const allChars = 'abc' + 'abcd' + 'abcde' + 'abcdef' + 'abcdefg'
    const s = applyChars(emptyState(), allChars)
    expect(s.inputs).toEqual(['abc', 'abcd', 'abcde', 'abcdef', 'abcdefg'])
    expect(s.activeRow).toBe(4)
  })
})
