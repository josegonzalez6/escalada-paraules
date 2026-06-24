import { describe, it, expect } from 'vitest'
import { buildShareText } from '../utils/daily'

const MOCK_DATE = new Date('2026-06-24T10:00:00Z')
const OFFICIAL_URL = 'https://escalada-paraules.vercel.app/'

describe('buildShareText — emoji grid i format', () => {
  it('5/5 inclou temps i totes les files verdes', () => {
    const text = buildShareText(5, 134, 'ca', 'daily', new Set(), MOCK_DATE)
    expect(text).toContain('5/5')
    expect(text).toContain('02:14')
    expect(text).toContain('🟩🟩🟩')
    expect(text).toContain('🟩🟩🟩🟩🟩🟩🟩')
    expect(text).not.toContain('🟥')
    expect(text).toContain(OFFICIAL_URL)
  })

  it('3/5 no inclou temps, files fallides en vermell', () => {
    const errors = new Set([4, 6])
    const text = buildShareText(3, 0, 'ca', 'daily', errors, MOCK_DATE)
    expect(text).toContain('3/5')
    expect(text).not.toContain('02:')
    expect(text).toContain('🟥🟥🟥🟥')
    expect(text).toContain('🟥🟥🟥🟥🟥🟥')
    expect(text).toContain('🟩🟩🟩')
    expect(text).toContain(OFFICIAL_URL)
  })

  it('mode aleatori inclou prefix 🎲', () => {
    const text = buildShareText(5, 60, 'ca', 'random', new Set(), MOCK_DATE)
    expect(text).toContain('🎲')
  })

  it('idioma ES usa ESP', () => {
    const text = buildShareText(5, 60, 'es', 'daily', new Set(), MOCK_DATE)
    expect(text).toContain('ESP')
    expect(text).not.toContain('CAT')
  })

  it('no revela cap paraula', () => {
    const text = buildShareText(4, 0, 'ca', 'daily', new Set([7]), MOCK_DATE)
    const lines = text.split('\n')
    expect(lines.length).toBeGreaterThanOrEqual(8)
    const wordLines = lines.filter(l => /^[a-zA-ZàèéíïóòúüñçÇ]{3,}$/.test(l.trim()))
    expect(wordLines.length).toBe(0)
  })

  it("inclou l'URL oficial", () => {
    const text = buildShareText(2, 0, 'es', 'daily', new Set([3,4,6]), MOCK_DATE)
    expect(text).toContain(OFFICIAL_URL)
  })
})
