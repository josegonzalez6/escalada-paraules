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

  it('3/5 inclou temps i files fallides en vermell', () => {
    const errors = new Set([4, 6])
    const text = buildShareText(3, 134, 'ca', 'daily', errors, MOCK_DATE)
    expect(text).toContain('3/5')
    expect(text).toContain('02:14') // temps sempre visible
    expect(text).toContain('🟥🟥🟥🟥')
    expect(text).toContain('🟥🟥🟥🟥🟥🟥')
    expect(text).toContain('🟩🟩🟩')
    expect(text).toContain(OFFICIAL_URL)
  })

  it("capçalera CA conté L'Escalada CAT", () => {
    const text = buildShareText(5, 60, 'ca', 'daily', new Set(), MOCK_DATE)
    expect(text).toContain("L'Escalada CAT")
    expect(text).not.toContain('Escalera')
  })

  it('capçalera ES conté La Escalera ES', () => {
    const text = buildShareText(5, 60, 'es', 'daily', new Set(), MOCK_DATE)
    expect(text).toContain('La Escalera ES')
    expect(text).not.toContain('CAT')
    expect(text).not.toContain("L'Escalada")
  })

  it('text CA per 5/5 conté missatge complet', () => {
    const text = buildShareText(5, 98, 'ca', 'daily', new Set(), MOCK_DATE)
    expect(text).toContain("He completat l'escala")
  })

  it('text ES per 5/5 conté missatge en castellà', () => {
    const text = buildShareText(5, 98, 'es', 'daily', new Set(), MOCK_DATE)
    expect(text).toContain('He completado la escalera')
  })

  it('text CA per 3/5 conté missatge parcial en català', () => {
    const text = buildShareText(3, 134, 'ca', 'daily', new Set([5, 7]), MOCK_DATE)
    expect(text).toContain('He fet 3/5')
  })

  it('text ES per 3/5 conté missatge parcial en castellà', () => {
    const text = buildShareText(3, 134, 'es', 'daily', new Set([5, 7]), MOCK_DATE)
    expect(text).toContain('He hecho 3/5')
  })

  it('files emojis en línies separades: 3,4,5,6,7 quadrats', () => {
    const text = buildShareText(5, 60, 'ca', 'daily', new Set(), MOCK_DATE)
    const lines = text.split('\n')
    expect(lines).toContain('🟩🟩🟩')
    expect(lines).toContain('🟩🟩🟩🟩')
    expect(lines).toContain('🟩🟩🟩🟩🟩')
    expect(lines).toContain('🟩🟩🟩🟩🟩🟩')
    expect(lines).toContain('🟩🟩🟩🟩🟩🟩🟩')
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
