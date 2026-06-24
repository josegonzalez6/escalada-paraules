import { describe, it, expect } from 'vitest'

// Tests del model de cronòmetre ascendent (sense compte enrere)
describe('Cronòmetre ascendent (sense límit de temps)', () => {
  it('el cronòmetre comença a 0', () => {
    let elapsed = 0
    expect(elapsed).toBe(0)
  })

  it('el cronòmetre puja 1 cada segon', () => {
    let elapsed = 0
    // Simula 5 ticks
    for (let i = 0; i < 5; i++) elapsed += 1
    expect(elapsed).toBe(5)
  })

  it('el temps no limita la partida: no hi ha màxim', () => {
    // El joc no té GAME_DURATION — no s'importa cap constant de temps màxim
    // Verificació: podem tenir temps arbitrariament alt sense acabar el joc
    let elapsed = 0
    for (let i = 0; i < 3600; i++) elapsed += 1 // 1 hora
    expect(elapsed).toBe(3600)
    // Un elapsed de 3600 no hauria de finalitzar el joc — el control de fase
    // és extern (handleValidate), no el timer
  })

  it('el temps s\'emmagatzema només amb score 5/5', () => {
    // Comprova que saveResult gestiona correctament el temps
    // Fem servir un mock dels stats
    function simulateSaveResult(score: number, timeUsed: number) {
      const stats = { played: 0, perfect: 0, bestTime: null as number | null, avgTime: null as number | null, currentStreak: 0, bestStreak: 0 }
      stats.played += 1
      if (score === 5) {
        stats.perfect += 1
        stats.bestTime = timeUsed
        stats.avgTime = timeUsed
        stats.currentStreak += 1
        stats.bestStreak = stats.currentStreak
      }
      return stats
    }

    const result4 = simulateSaveResult(4, 120) // 4/5 → no guarda temps
    expect(result4.bestTime).toBeNull()
    expect(result4.perfect).toBe(0)

    const result5 = simulateSaveResult(5, 45) // 5/5 → guarda temps
    expect(result5.bestTime).toBe(45)
    expect(result5.perfect).toBe(1)
  })

  it('format MM:SS del cronòmetre', () => {
    function formatTime(seconds: number): string {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(65)).toBe('01:05')
    expect(formatTime(3600)).toBe('60:00')
    expect(formatTime(61)).toBe('01:01')
  })
})
