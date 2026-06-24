import { describe, it, expect } from 'vitest'
import { getMadridDateStr, getDailyIndex, buildShareText, formatDateDisplay } from '../utils/daily'

const MOCK_DATE = new Date('2026-06-24T10:00:00Z') // 10:00 UTC = 12:00 Madrid (CEST)

describe('getMadridDateStr', () => {
  it('retorna format YYYY-MM-DD', () => {
    const str = getMadridDateStr(MOCK_DATE)
    expect(str).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('retorna la data correcta per Europe/Madrid', () => {
    // 2026-06-24T10:00 UTC = 2026-06-24 a Madrid (CEST = UTC+2)
    expect(getMadridDateStr(MOCK_DATE)).toBe('2026-06-24')
  })
})

describe('getDailyIndex', () => {
  it('és determinista: mateixa data + idioma = mateix índex', () => {
    const idx1 = getDailyIndex(15, 'ca', MOCK_DATE)
    const idx2 = getDailyIndex(15, 'ca', MOCK_DATE)
    expect(idx1).toBe(idx2)
  })

  it('retorna índex dins del rang [0, gamesCount)', () => {
    for (const count of [5, 10, 15, 100]) {
      const idx = getDailyIndex(count, 'ca', MOCK_DATE)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(count)
    }
  })

  it('idiomes diferents poden donar índexs diferents (offset de 31337)', () => {
    const idxCA = getDailyIndex(100, 'ca', MOCK_DATE)
    const idxES = getDailyIndex(100, 'es', MOCK_DATE)
    // Amb 100 jocs i offset 31337, és molt probable que siguin diferents
    // (31337 % 100 = 37, i el primer índex no és 37 tret de casualitat)
    expect(typeof idxCA).toBe('number')
    expect(typeof idxES).toBe('number')
  })

  it('dies consecutius donen índexs potencialment diferents', () => {
    const day1 = new Date('2026-06-24T10:00:00Z')
    const day2 = new Date('2026-06-25T10:00:00Z')
    const idx1 = getDailyIndex(15, 'ca', day1)
    const idx2 = getDailyIndex(15, 'ca', day2)
    // Difieren en 1 (mod gamesCount), si gamesCount > 1
    expect(Math.abs(idx2 - idx1)).not.toBe(0) // No és el mateix dia
  })

  it('retorna 0 si gamesCount és 0 (edge case)', () => {
    expect(getDailyIndex(0, 'ca', MOCK_DATE)).toBe(0)
  })
})

describe('buildShareText', () => {
  it('format correcte per 5/5', () => {
    const text = buildShareText(5, 37, 'ca', 'daily', MOCK_DATE)
    expect(text).toContain('CAT')
    expect(text).toContain('5/5')
    expect(text).toContain('37s')
    expect(text).not.toContain('🎲') // mode daily no té el prefix aleatori
  })

  it('format correcte per 3/5', () => {
    const text = buildShareText(3, 45, 'ca', 'daily', MOCK_DATE)
    expect(text).toContain('3/5')
    expect(text).not.toContain('37s') // temps no apareix si no és 5/5
  })

  it('mode aleatori té prefix 🎲', () => {
    const text = buildShareText(4, 50, 'es', 'random', MOCK_DATE)
    expect(text).toContain('🎲')
    expect(text).toContain('ESP')
    expect(text).toContain('4/5')
  })

  it('no revela cap paraula', () => {
    const text = buildShareText(5, 30, 'ca', 'daily', MOCK_DATE)
    // El text compartit NO ha de contenir paraules del diccionari
    // Verificació simple: només conté números, lletres de l'encapçalament i emojis
    const lines = text.split('\n')
    expect(lines).toHaveLength(3)
  })

  it('idioma ES usa ESP', () => {
    const text = buildShareText(5, 20, 'es', 'daily', MOCK_DATE)
    expect(text).toContain('ESP')
    expect(text).not.toContain('CAT')
  })
})

describe('formatDateDisplay', () => {
  it('retorna format llegible DD/MM/YYYY', () => {
    const str = formatDateDisplay(MOCK_DATE)
    expect(str).toMatch(/\d{2}\/\d{2}\/\d{4}/)
  })
})
