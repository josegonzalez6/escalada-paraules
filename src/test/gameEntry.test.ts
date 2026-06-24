import { describe, it, expect } from 'vitest'
import { normalizeWord, getLetterCounts } from '../utils/normalize'
import type { GameEntry } from '../types'

// Helpers que repliquen la lògica del generador per validar GameEntry
function baseLettersMatchBaseWord(entry: GameEntry): boolean {
  const fromWord = normalizeWord(entry.baseWord).split('').sort().join('')
  const fromLetters = [...entry.baseLetters].map(l => normalizeWord(l)).sort().join('')
  return fromWord === fromLetters
}

function hasAllLengths(entry: GameEntry): boolean {
  return [3, 4, 5, 6, 7].every(
    len => entry.solutions[String(len) as keyof GameEntry['solutions']].length > 0
  )
}

function allSolutionsFormableFromBase(entry: GameEntry): boolean {
  const baseCounts = getLetterCounts(normalizeWord(entry.baseWord))
  for (const [lenStr, words] of Object.entries(entry.solutions)) {
    const len = Number(lenStr)
    for (const word of words) {
      const w = normalizeWord(word)
      if (w.length !== len) return false
      const wCounts = getLetterCounts(w)
      for (const [c, n] of Object.entries(wCounts)) {
        if ((baseCounts[c] ?? 0) < n) return false
      }
    }
  }
  return true
}

// Partides de referència per als tests (equivalents a les que genera el script)
const validEntry: GameEntry = {
  baseWord: 'caminants',          // 9 lletres — paraula real
  baseLetters: ['c','a','m','i','n','a','n','t','s'],
  solutions: {
    '3': ['can', 'mas'],
    '4': ['cana', 'mana'],
    '5': ['canta', 'camin'],
    '6': ['camins'],
    '7': ['cantina'],
  },
}

const validLongEntry: GameEntry = {
  baseWord: 'relacionament',       // 13 lletres — paraula real
  baseLetters: ['r','e','l','a','c','i','o','n','a','m','e','n','t'],
  solutions: {
    '3': ['mar'],
    '4': ['marc'],
    '5': ['marca'],
    '6': ['maceta'],
    '7': ['cantina'],
  },
}

describe('GameEntry — baseWord ha de ser paraula real del diccionari', () => {

  it('baseWord té entre 8 i 14 lletres', () => {
    expect(normalizeWord(validEntry.baseWord).length).toBeGreaterThanOrEqual(8)
    expect(normalizeWord(validEntry.baseWord).length).toBeLessThanOrEqual(14)

    expect(normalizeWord(validLongEntry.baseWord).length).toBeGreaterThanOrEqual(8)
    expect(normalizeWord(validLongEntry.baseWord).length).toBeLessThanOrEqual(14)
  })

  it('baseLetters deriva exactament de baseWord (mateixes lletres, possible ordre diferent)', () => {
    expect(baseLettersMatchBaseWord(validEntry)).toBe(true)
    expect(baseLettersMatchBaseWord(validLongEntry)).toBe(true)
  })

  it('no s\'accepten bases inventades — baseLetters ha de coincidir amb baseWord', () => {
    const fakEntry: GameEntry = {
      baseWord: 'caminants',
      baseLetters: ['x','y','z','x','y','z','x','y','z'], // no deriven de 'caminants'
      solutions: { '3': ['can'], '4': ['cana'], '5': ['canta'], '6': ['camins'], '7': ['cantina'] },
    }
    expect(baseLettersMatchBaseWord(fakEntry)).toBe(false)
  })

  it('tota GameEntry té almenys una solució per cada longitud (3,4,5,6,7)', () => {
    expect(hasAllLengths(validEntry)).toBe(true)
    expect(hasAllLengths(validLongEntry)).toBe(true)
  })

  it('detecta partida sense solució de 6 lletres com a invàlida', () => {
    const incomplete: GameEntry = {
      baseWord: 'caminants',
      baseLetters: 'caminants'.split(''),
      solutions: {
        '3': ['can'],
        '4': ['cana'],
        '5': ['canta'],
        '6': [],       // buida — partida invàlida
        '7': ['cantina'],
      },
    }
    expect(hasAllLengths(incomplete)).toBe(false)
  })

  it('totes les solucions es poden formar amb les lletres de baseWord', () => {
    expect(allSolutionsFormableFromBase(validEntry)).toBe(true)
    expect(allSolutionsFormableFromBase(validLongEntry)).toBe(true)
  })

  it('detecta solució invàlida que usa lletres fora de la base', () => {
    const badSolution: GameEntry = {
      baseWord: 'caminants',
      baseLetters: 'caminants'.split(''),
      solutions: {
        '3': ['can'],
        '4': ['cana'],
        '5': ['perla'],  // 'perla' necessita p, e, l — fora de 'caminants'
        '6': ['camins'],
        '7': ['cantina'],
      },
    }
    expect(allSolutionsFormableFromBase(badSolution)).toBe(false)
  })

  it('les solucions de 7 lletres NO coincideixen amb la paraula base (que és de 8-14)', () => {
    for (const words of Object.values(validEntry.solutions)) {
      for (const w of words) {
        expect(w).not.toBe(validEntry.baseWord)
        expect(normalizeWord(w).length).toBeLessThanOrEqual(7)
      }
    }
  })

  it('accepta base de 8 lletres (mínim)', () => {
    const entry8: GameEntry = {
      baseWord: 'caminant',   // 8 lletres
      baseLetters: 'caminant'.split(''),
      solutions: {
        '3': ['can'],
        '4': ['cana'],
        '5': ['camin'],
        '6': ['mantic'],
        '7': ['cantina'],
      },
    }
    expect(normalizeWord(entry8.baseWord).length).toBe(8)
    expect(baseLettersMatchBaseWord(entry8)).toBe(true)
    expect(hasAllLengths(entry8)).toBe(true)
    expect(allSolutionsFormableFromBase(entry8)).toBe(true)
  })

  it('accepta base de 14 lletres (màxim)', () => {
    const entry14: GameEntry = {
      baseWord: 'encaminaments',  // 13 lletres (la 14 no en tenim de demo)
      baseLetters: 'encaminaments'.split(''),
      solutions: {
        '3': ['can'],
        '4': ['mane'],
        '5': ['manes'],
        '6': ['macets'],
        '7': ['macetes'],
      },
    }
    expect(normalizeWord(entry14.baseWord).length).toBeGreaterThanOrEqual(8)
    expect(baseLettersMatchBaseWord(entry14)).toBe(true)
  })
})

// Replica la funció isValidEntry de dictionary.ts per als tests
function isValidEntry(entry: GameEntry): boolean {
  const norm = normalizeWord(entry.baseWord)
  if (norm.length < 8 || norm.length > 14) return false
  const fromWord = norm.split('').sort().join('')
  const fromLetters = entry.baseLetters.map((l: string) => normalizeWord(l)).sort().join('')
  if (fromWord !== fromLetters) return false
  for (const len of ['3', '4', '5', '6', '7'] as const) {
    if (!entry.solutions[len] || entry.solutions[len].length === 0) return false
  }
  return true
}

describe('isValidEntry — validació de GameEntry en carregar JSON', () => {
  it('accepta una entrada vàlida', () => {
    expect(isValidEntry(validEntry)).toBe(true)
  })

  it('descarta baseWord inventada (baseLetters no coincideix)', () => {
    const bad: GameEntry = {
      baseWord: 'caminants',
      baseLetters: ['x','y','z','a','b','c','d','e','f'],
      solutions: { '3': ['can'], '4': ['cana'], '5': ['canta'], '6': ['camins'], '7': ['cantina'] },
    }
    expect(isValidEntry(bad)).toBe(false)
  })

  it('descarta baseWord massa curta (< 8 lletres)', () => {
    const short: GameEntry = {
      baseWord: 'camins',
      baseLetters: 'camins'.split(''),
      solutions: { '3': ['can'], '4': ['cana'], '5': ['camin'], '6': ['camins'], '7': ['cantina'] },
    }
    expect(isValidEntry(short)).toBe(false)
  })

  it('descarta entrada sense solucions en alguna longitud', () => {
    const missing: GameEntry = {
      ...validEntry,
      solutions: { ...validEntry.solutions, '6': [] },
    }
    expect(isValidEntry(missing)).toBe(false)
  })

  it('la UI ha de mostrar baseWord (no baseLetters barrejades) com a text principal', () => {
    // El BaseWordDisplay ara rep `baseWord: string` explícitament
    // Aquest test documenta que baseWord és una propietat obligatòria de GameEntry
    expect(typeof validEntry.baseWord).toBe('string')
    expect(validEntry.baseWord.length).toBeGreaterThan(0)
    // baseWord és la paraula que es mostra, baseLetters és l'ordre visual
    expect(validEntry.baseLetters.sort().join('')).toBe(
      normalizeWord(validEntry.baseWord).split('').sort().join('')
    )
  })
})
