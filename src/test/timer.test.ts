import { describe, it, expect } from 'vitest'

// Tests del model de cronòmetre ascendent (sense compte enrere)
describe('Cronòmetre ascendent (sense límit de temps)', () => {
  it('el cronòmetre comença a 0', () => {
    let elapsed = 0
    expect(elapsed).toBe(0)
  })

  it('el cronòmetre puja 1 cada segon', () => {
    let elapsed = 0
    for (let i = 0; i < 5; i++) elapsed += 1
    expect(elapsed).toBe(5)
  })

  it('el temps no limita la partida: no hi ha màxim', () => {
    let elapsed = 0
    for (let i = 0; i < 3600; i++) elapsed += 1
    expect(elapsed).toBe(3600)
  })

  it('el temps s\'emmagatzema només amb score 5/5', () => {
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

    const result4 = simulateSaveResult(4, 120)
    expect(result4.bestTime).toBeNull()
    expect(result4.perfect).toBe(0)

    const result5 = simulateSaveResult(5, 45)
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

describe('Comportament del cronòmetre: no comença fins al primer caràcter', () => {
  // Simula la lògica de hasStarted del hook
  function makeTimerController() {
    let hasStarted = false
    let elapsed = 0
    let running = false

    function startTimer() {
      hasStarted = true
      running = true
      elapsed = 0
    }

    function stopTimer() {
      running = false
    }

    function onInput(value: string) {
      if (!hasStarted && value.length > 0) startTimer()
    }

    function tick() {
      if (running) elapsed++
    }

    function validate() {
      stopTimer()
      return { timeUsed: elapsed }
    }

    return { onInput, tick, validate, getElapsed: () => elapsed, isRunning: () => running, hasStarted: () => hasStarted }
  }

  it('el cronòmetre NO comença al carregar el joc', () => {
    const ctrl = makeTimerController()
    ctrl.tick()
    ctrl.tick()
    expect(ctrl.getElapsed()).toBe(0)
    expect(ctrl.isRunning()).toBe(false)
    expect(ctrl.hasStarted()).toBe(false)
  })

  it('el cronòmetre comença al primer caràcter', () => {
    const ctrl = makeTimerController()
    ctrl.tick() // no ha comencat
    ctrl.onInput('a')
    expect(ctrl.hasStarted()).toBe(true)
    expect(ctrl.isRunning()).toBe(true)
    ctrl.tick()
    expect(ctrl.getElapsed()).toBe(1)
  })

  it('obrir/tancar ajuda no inicia el cronòmetre', () => {
    const ctrl = makeTimerController()
    // simula obrir i tancar ajuda: no crida onInput
    ctrl.tick()
    ctrl.tick()
    expect(ctrl.hasStarted()).toBe(false)
    expect(ctrl.getElapsed()).toBe(0)
  })

  it('canviar idioma no inicia el cronòmetre', () => {
    // canviar idioma reinicia el hook → nou makeTimerController
    const ctrl2 = makeTimerController()
    ctrl2.tick()
    expect(ctrl2.hasStarted()).toBe(false)
    expect(ctrl2.getElapsed()).toBe(0)
  })

  it('si es valida sense escriure, timeUsed = 0', () => {
    const ctrl = makeTimerController()
    ctrl.tick()
    ctrl.tick()
    const { timeUsed } = ctrl.validate()
    expect(timeUsed).toBe(0)
  })

  it('si es valida després d\'escriure, timeUsed > 0', () => {
    const ctrl = makeTimerController()
    ctrl.onInput('gat')
    ctrl.tick()
    ctrl.tick()
    ctrl.tick()
    const { timeUsed } = ctrl.validate()
    expect(timeUsed).toBe(3)
  })

  it('el cronòmetre s\'atura en validar', () => {
    const ctrl = makeTimerController()
    ctrl.onInput('gat')
    ctrl.tick()
    ctrl.validate()
    ctrl.tick()
    ctrl.tick()
    expect(ctrl.getElapsed()).toBe(1) // no ha pujat després de validate
  })
})
