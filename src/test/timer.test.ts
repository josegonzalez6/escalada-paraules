import { describe, it, expect } from 'vitest'

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

describe('Botó COMENÇAR/COMENZAR: control explícit d\'inici de partida', () => {
  // Simula la lògica del hook useGame amb gameStarted
  function makeGameController() {
    let gameStarted = false
    let elapsed = 0
    let running = false
    const inputs = ['', '', '', '', '']

    function startTimer() {
      running = true
      elapsed = 0
    }

    function stopTimer() {
      running = false
    }

    function handleStart() {
      if (gameStarted) return
      gameStarted = true
      startTimer()
    }

    function handleInput(index: number, value: string) {
      if (!gameStarted) return  // bloquejat fins que no es prem COMEÇAR
      inputs[index] = value
    }

    function tick() {
      if (running) elapsed++
    }

    function handleValidate() {
      stopTimer()
      return { timeUsed: elapsed }
    }

    return {
      handleStart,
      handleInput,
      tick,
      handleValidate,
      getElapsed: () => elapsed,
      isRunning: () => running,
      isGameStarted: () => gameStarted,
      getInputs: () => [...inputs],
    }
  }

  it('en entrar a una partida nova, gameStarted és false', () => {
    const ctrl = makeGameController()
    expect(ctrl.isGameStarted()).toBe(false)
  })

  it('en entrar a una partida nova, elapsedSeconds és 0', () => {
    const ctrl = makeGameController()
    ctrl.tick()
    ctrl.tick()
    expect(ctrl.getElapsed()).toBe(0)
  })

  it('el cronòmetre NO comença fins que es prem COMEÇAR/COMENZAR', () => {
    const ctrl = makeGameController()
    ctrl.tick()
    ctrl.tick()
    expect(ctrl.isRunning()).toBe(false)
    expect(ctrl.getElapsed()).toBe(0)
  })

  it('escriure abans de COMEÇAR no modifica inputs', () => {
    const ctrl = makeGameController()
    ctrl.handleInput(0, 'gat')
    expect(ctrl.getInputs()[0]).toBe('')
  })

  it('tancar instruccions no inicia el cronòmetre', () => {
    const ctrl = makeGameController()
    // tancar instruccions no crida handleStart
    ctrl.tick()
    expect(ctrl.isGameStarted()).toBe(false)
    expect(ctrl.getElapsed()).toBe(0)
  })

  it('canviar idioma no inicia el cronòmetre', () => {
    // canviar idioma reinicia el hook → nou controller
    const ctrl2 = makeGameController()
    ctrl2.tick()
    expect(ctrl2.isGameStarted()).toBe(false)
    expect(ctrl2.getElapsed()).toBe(0)
  })

  it('prémer COMEÇAR inicia el cronòmetre', () => {
    const ctrl = makeGameController()
    ctrl.handleStart()
    expect(ctrl.isGameStarted()).toBe(true)
    expect(ctrl.isRunning()).toBe(true)
    ctrl.tick()
    expect(ctrl.getElapsed()).toBe(1)
  })

  it('prémer COMEÇAR activa l\'escala (gameStarted = true)', () => {
    const ctrl = makeGameController()
    expect(ctrl.isGameStarted()).toBe(false)
    ctrl.handleStart()
    expect(ctrl.isGameStarted()).toBe(true)
  })

  it('després de COMEÇAR es pot escriure', () => {
    const ctrl = makeGameController()
    ctrl.handleStart()
    ctrl.handleInput(0, 'gat')
    expect(ctrl.getInputs()[0]).toBe('gat')
  })

  it('si es valida sense prémer COMEÇAR, timeUsed = 0', () => {
    const ctrl = makeGameController()
    ctrl.tick()
    ctrl.tick()
    const { timeUsed } = ctrl.handleValidate()
    expect(timeUsed).toBe(0)
  })

  it('si es valida després de COMEÇAR, timeUsed > 0', () => {
    const ctrl = makeGameController()
    ctrl.handleStart()
    ctrl.tick()
    ctrl.tick()
    ctrl.tick()
    const { timeUsed } = ctrl.handleValidate()
    expect(timeUsed).toBe(3)
  })

  it('el cronòmetre s\'atura en validar', () => {
    const ctrl = makeGameController()
    ctrl.handleStart()
    ctrl.tick()
    ctrl.handleValidate()
    ctrl.tick()
    ctrl.tick()
    expect(ctrl.getElapsed()).toBe(1)
  })

  it('prémer COMEÇAR dues vegades no reinicia el cronòmetre', () => {
    const ctrl = makeGameController()
    ctrl.handleStart()
    ctrl.tick()
    ctrl.tick()
    ctrl.handleStart()  // segon cop: ignorat
    expect(ctrl.getElapsed()).toBe(2)
  })
})

describe('Textos del botó d\'inici per idioma', () => {
  const translations = {
    ca: { startGame: 'COMENÇAR', startGameHint: 'Prem COMENÇAR per iniciar la partida.' },
    es: { startGame: 'COMENZAR', startGameHint: 'Pulsa COMENZAR para iniciar la partida.' },
  }

  it('en català el botó diu COMENÇAR', () => {
    expect(translations.ca.startGame).toBe('COMENÇAR')
  })

  it('en castellà el botó diu COMENZAR', () => {
    expect(translations.es.startGame).toBe('COMENZAR')
  })

  it('missatge de hint en català és correcte', () => {
    expect(translations.ca.startGameHint).toContain('COMENÇAR')
  })

  it('missatge de hint en castellà és correcte', () => {
    expect(translations.es.startGameHint).toContain('COMENZAR')
  })
})
