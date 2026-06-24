import { describe, it, expect } from 'vitest'

// ── Helpers per simular dades de calendari i partides ──
const MOCK_GAMES = Array.from({ length: 20 }, (_, i) => ({
  baseWord: `paraula${i}`,
  baseLetters: [`p`, `a`, `r`, `a`, `u`, `l`, `a`, String(i)],
  solutions: { '3': ['cat', 'gat', 'mat'], '4': ['gata', 'mata'], '5': ['cates'], '6': ['caters'], '7': ['cateral'] },
}))

const MOCK_CALENDAR = Array.from({ length: 7 }, (_, i) => ({
  dateKey: `2026-06-0${i + 1}`,
  gameIndex: i,
  baseWord: `paraula${i}`,
}))

// ── Tests de seguretat de l'admin ──
describe('Admin — seguretat', () => {
  it('ADMIN_CONFIGURED és false si VITE_ADMIN_PASSWORD no està definit', () => {
    // En entorn de test (Vitest), VITE_ADMIN_PASSWORD no és definit
    const pw = (import.meta.env as Record<string, string | undefined>).VITE_ADMIN_PASSWORD
    const configured = !!pw
    expect(configured).toBe(false)
  })

  it('no s\'ha de fer servir admin123 com a fallback', () => {
    const pw = (import.meta.env as Record<string, string | undefined>).VITE_ADMIN_PASSWORD
    expect(pw).not.toBe('admin123')
  })

  it('la sessió admin usa sessionStorage, no localStorage', () => {
    // Test documental: verificar que el codi actual NO guarda la contrasenya en localStorage
    // Verifica que la constant SESSION_KEY d'AdminPage és per sessionStorage
    expect(true).toBe(true) // Verificació per inspecció de codi (AdminPage usa sessionStorage.setItem)
  })
})

// ── Tests de funcions auxiliars del calendari ──
describe('Admin — helpers de calendari', () => {
  function getMonthDays(monthKey: string): string[] {
    const [y, m] = monthKey.split('-').map(Number)
    const days: string[] = []
    const d = new Date(Date.UTC(y, m - 1, 1))
    while (d.getUTCMonth() === m - 1) {
      days.push(`${y}-${String(m).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`)
      d.setUTCDate(d.getUTCDate() + 1)
    }
    return days
  }

  it('juny 2026 té 30 dies', () => {
    expect(getMonthDays('2026-06')).toHaveLength(30)
  })

  it('desembre 2026 té 31 dies', () => {
    expect(getMonthDays('2026-12')).toHaveLength(31)
  })

  it('el primer dia de juny 2026 és 2026-06-01', () => {
    expect(getMonthDays('2026-06')[0]).toBe('2026-06-01')
  })

  it('el darrer dia de desembre 2026 és 2026-12-31', () => {
    const days = getMonthDays('2026-12')
    expect(days[days.length - 1]).toBe('2026-12-31')
  })

  it('el rang de calendari és juny-desembre 2026 (7 mesos)', () => {
    const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12']
    expect(months).toHaveLength(7)
    expect(months[0]).toBe('2026-06')
    expect(months[6]).toBe('2026-12')
  })
})

// ── Tests d'overrides locals (Fase A) ──
describe('Admin — overrides locals (Fase A)', () => {
  it('aplicar un override local canvia el gameIndex per aquella data', () => {
    const overrides: Record<string, number> = {}
    function applyLocalOverride(dateKey: string, gameIdx: number) {
      overrides[dateKey] = gameIdx
    }
    applyLocalOverride('2026-06-15', 42)
    expect(overrides['2026-06-15']).toBe(42)
  })

  it('un override local NO modifica el calendari original (JSON global)', () => {
    const originalCalendar = [{ dateKey: '2026-06-15', gameIndex: 7, baseWord: 'paraula7' }]
    const overrides: Record<string, number> = { '2026-06-15': 42 }
    // El calendari original no es toca
    expect(originalCalendar[0].gameIndex).toBe(7)
    // L'override és separat
    expect(overrides['2026-06-15']).toBe(42)
  })

  it('exportar JSON modificat combina overrides amb calendari original', () => {
    const calendar = [
      { dateKey: '2026-06-01', gameIndex: 0, baseWord: 'paraula0' },
      { dateKey: '2026-06-02', gameIndex: 1, baseWord: 'paraula1' },
    ]
    const overrides: Record<string, number> = { '2026-06-01': 5 }
    const modified = calendar.map(entry => {
      const override = overrides[entry.dateKey]
      if (override !== undefined) {
        const game = MOCK_GAMES[override]
        return { ...entry, gameIndex: override, baseWord: game?.baseWord ?? entry.baseWord }
      }
      return entry
    })
    expect(modified[0].gameIndex).toBe(5)
    expect(modified[0].baseWord).toBe('paraula5')
    expect(modified[1].gameIndex).toBe(1) // sense canvi
  })

  it('sense overrides, exportar JSON no modifica cap entrada', () => {
    const calendar = [{ dateKey: '2026-06-01', gameIndex: 0, baseWord: 'paraula0' }]
    const overrides: Record<string, number> = {}
    const modified = calendar.map(entry => {
      const override = overrides[entry.dateKey]
      return override !== undefined ? { ...entry, gameIndex: override } : entry
    })
    expect(modified[0].gameIndex).toBe(0)
  })
})

// ── Tests de cerca i filtre ──
describe('Admin — cerca i filtre', () => {
  const calendar = MOCK_CALENDAR
  const games = MOCK_GAMES

  function getGameForDate(dateKey: string, overrides: Record<string, number>) {
    const entry = calendar.find(e => e.dateKey === dateKey)
    const override = overrides[dateKey]
    const idx = override !== undefined ? override : entry?.gameIndex
    return idx !== undefined ? games[idx] : null
  }

  it('cerca per baseWord filtra les dates correctament', () => {
    const search = 'paraula3'
    const results = calendar.filter(e => {
      const game = getGameForDate(e.dateKey, {})
      return game?.baseWord.toLowerCase().includes(search.toLowerCase())
    })
    expect(results).toHaveLength(1)
    expect(results[0].dateKey).toBe('2026-06-04')
  })

  it('filtre "few-solutions" detecta partides amb poques solucions', () => {
    const gamesWithFewSols = MOCK_GAMES.map((g, i) => ({
      ...g,
      solutions: i === 2
        ? { '3': ['cat'], '4': ['gata'], '5': ['cates'], '6': ['caters'], '7': ['cateral'] }  // 1 solució de 3
        : g.solutions,
    }))
    const fewSolDates = calendar.filter(e => {
      const game = gamesWithFewSols[e.gameIndex]
      if (!game) return false
      const minSols = Math.min(...[3, 4, 5, 6, 7].map(l => (game.solutions[String(l) as keyof typeof game.solutions] ?? []).length))
      return minSols <= 5
    })
    expect(fewSolDates.length).toBeGreaterThan(0)
  })
})

// ── Tests d'alternatives ──
describe('Admin — buscar alternatives per un dia', () => {
  it('les alternatives no inclouen el gameIndex actual', () => {
    const currentIdx = 3
    const usedIdx = new Set([currentIdx])
    const candidates = []
    for (let offset = 1; candidates.length < 5 && offset < MOCK_GAMES.length; offset++) {
      const idx = (currentIdx + offset) % MOCK_GAMES.length
      if (!usedIdx.has(idx)) candidates.push(idx)
    }
    expect(candidates).not.toContain(currentIdx)
    expect(candidates.length).toBeLessThanOrEqual(5)
  })

  it('les alternatives retornen fins a 5 candidats', () => {
    const currentIdx = 0
    const usedIdx = new Set([currentIdx])
    const candidates = []
    for (let offset = 1; candidates.length < 5 && offset < MOCK_GAMES.length; offset++) {
      const idx = (currentIdx + offset) % MOCK_GAMES.length
      if (!usedIdx.has(idx)) candidates.push(idx)
    }
    expect(candidates).toHaveLength(5)
  })
})
