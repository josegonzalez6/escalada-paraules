import { describe, it, expect, beforeEach } from 'vitest'
import { getArchiveDateRange, isDateLocked, getDayState, resetDailyForDate, ARCHIVE_START, ARCHIVE_END } from '../utils/archive'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true })

beforeEach(() => localStorageMock.clear())

describe('getArchiveDateRange', () => {
  it('comença el 2026-06-01', () => {
    const dates = getArchiveDateRange()
    expect(dates[0]).toBe('2026-06-01')
  })

  it('acaba el 2026-12-31', () => {
    const dates = getArchiveDateRange()
    expect(dates[dates.length - 1]).toBe('2026-12-31')
  })

  it('cobreix 214 dies (juny-desembre 2026)', () => {
    const dates = getArchiveDateRange()
    expect(dates.length).toBe(214)
  })

  it('totes les dates estan en format YYYY-MM-DD', () => {
    const dates = getArchiveDateRange()
    for (const d of dates) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('ARCHIVE_START i ARCHIVE_END coincideixen amb el rang', () => {
    expect(ARCHIVE_START).toBe('2026-06-01')
    expect(ARCHIVE_END).toBe('2026-12-31')
  })
})

describe('isDateLocked', () => {
  const MOCK_NOW = new Date('2026-06-24T10:00:00Z')

  it('data futura està bloquejada', () => {
    expect(isDateLocked('2026-12-31', MOCK_NOW)).toBe(true)
    expect(isDateLocked('2099-01-01', MOCK_NOW)).toBe(true)
  })

  it('data passada no està bloquejada', () => {
    expect(isDateLocked('2026-06-01', MOCK_NOW)).toBe(false)
    expect(isDateLocked('2020-01-01', MOCK_NOW)).toBe(false)
  })

  it("avui no està bloquejat (la data d'avui s'ha de poder jugar)", () => {
    // getMadridDateStr(MOCK_NOW) = '2026-06-24' aproximadament (depèn del TZ del servidor)
    // Fem servir una data clarament passada
    expect(isDateLocked('2026-06-23', MOCK_NOW)).toBe(false)
  })
})

describe('getDayState', () => {
  const MOCK_NOW = new Date('2026-06-24T10:00:00Z')

  it('data futura → future_locked', () => {
    expect(getDayState('2026-12-31', 'ca', MOCK_NOW)).toBe('future_locked')
  })

  it('data passada sense resultat → available', () => {
    expect(getDayState('2026-06-01', 'ca', MOCK_NOW)).toBe('available')
  })

  it('data amb score 5 → played_perfect', () => {
    localStorageMock.setItem('dailyResult:ca:2026-06-01', JSON.stringify({ score: 5, errors: [], validationErrors: [], inputs: ['','','','',''], timeUsed: 60, dateKey: '2026-06-01', lang: 'ca', timestamp: 0 }))
    expect(getDayState('2026-06-01', 'ca', MOCK_NOW)).toBe('played_perfect')
  })

  it('data amb score 0 → played_zero', () => {
    localStorageMock.setItem('dailyResult:ca:2026-06-02', JSON.stringify({ score: 0, errors: [3,4,5,6,7], validationErrors: [], inputs: ['','','','',''], timeUsed: 0, dateKey: '2026-06-02', lang: 'ca', timestamp: 0 }))
    expect(getDayState('2026-06-02', 'ca', MOCK_NOW)).toBe('played_zero')
  })

  it('data amb score 3 → played_partial', () => {
    localStorageMock.setItem('dailyResult:ca:2026-06-03', JSON.stringify({ score: 3, errors: [6,7], validationErrors: [], inputs: ['','','','',''], timeUsed: 0, dateKey: '2026-06-03', lang: 'ca', timestamp: 0 }))
    expect(getDayState('2026-06-03', 'ca', MOCK_NOW)).toBe('played_partial')
  })
})

describe('resetDailyForDate', () => {
  it('elimina la clau nova de localStorage', () => {
    localStorageMock.setItem('dailyResult:ca:2026-06-10', '{"score":5}')
    resetDailyForDate('ca', '2026-06-10')
    expect(localStorageMock.getItem('dailyResult:ca:2026-06-10')).toBeNull()
  })

  it('elimina la clau antiga de localStorage (backward compat)', () => {
    localStorageMock.setItem('escalada-daily-ca-2026-06-10', '{"score":3}')
    resetDailyForDate('ca', '2026-06-10')
    expect(localStorageMock.getItem('escalada-daily-ca-2026-06-10')).toBeNull()
  })

  it('no afecta altres dates', () => {
    localStorageMock.setItem('dailyResult:ca:2026-06-11', '{"score":5}')
    resetDailyForDate('ca', '2026-06-10')
    expect(localStorageMock.getItem('dailyResult:ca:2026-06-11')).toBe('{"score":5}')
  })

  it('no barreja idiomes', () => {
    localStorageMock.setItem('dailyResult:es:2026-06-10', '{"score":4}')
    resetDailyForDate('ca', '2026-06-10')
    expect(localStorageMock.getItem('dailyResult:es:2026-06-10')).toBe('{"score":4}')
  })
})
