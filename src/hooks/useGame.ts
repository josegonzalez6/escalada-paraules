import { useState, useEffect, useCallback, useRef } from 'react'
import type { Language, GamePhase, ValidationResult, GameEntry, GameInputs, GameMode } from '../types'
import { loadDictionary, loadGames, pickRandomGame } from '../utils/dictionary'
import { pickDailyGame } from '../utils/daily'
import { validateCompleteAttempt } from '../utils/validate'
import { normalizeWord } from '../utils/normalize'
import { saveResult } from '../utils/stats'

const GAME_DURATION = 60
const EMPTY_INPUTS: GameInputs = ['', '', '', '', '']

export function useGame(lang: Language, mode: GameMode) {
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [inputs, setInputs] = useState<GameInputs>([...EMPTY_INPUTS])
  const [game, setGame] = useState<GameEntry | null>(null)
  const [dictionary, setDictionary] = useState<Set<string>>(new Set())
  const [games, setGames] = useState<GameEntry[]>([])
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [timeUsed, setTimeUsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeLeftRef = useRef(GAME_DURATION)
  const inputsRef = useRef<GameInputs>([...EMPTY_INPUTS])
  const gameRef = useRef<GameEntry | null>(null)
  const dictRef = useRef<Set<string>>(new Set())

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const finishGame = useCallback((
    currentInputs: GameInputs,
    currentGame: GameEntry,
    currentDict: Set<string>
  ) => {
    stopTimer()
    setPhase('finished')
    const result = validateCompleteAttempt(
      currentGame.baseWord,
      currentInputs,
      currentDict,
      currentGame.solutions
    )
    setValidationResult(result)
    const used = GAME_DURATION - timeLeftRef.current
    setTimeUsed(used)
    saveResult(lang, result.score, used)
  }, [lang, stopTimer])

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1
        timeLeftRef.current = next
        if (next <= 0) {
          if (gameRef.current && dictRef.current.size > 0) {
            finishGame(inputsRef.current, gameRef.current, dictRef.current)
          }
          return 0
        }
        return next
      })
    }, 1000)
  }, [finishGame])

  const initGame = useCallback((gamesList: GameEntry[], dict: Set<string>, forceRandom = false) => {
    stopTimer()
    // En mode daily, la primera vegada tria la partida del dia. Nova partida → aleatòria.
    const chosen = (mode === 'daily' && !forceRandom)
      ? pickDailyGame(gamesList, lang)
      : pickRandomGame(gamesList)
    const fresh: GameInputs = [...EMPTY_INPUTS]
    inputsRef.current = fresh
    gameRef.current = chosen
    dictRef.current = dict
    timeLeftRef.current = GAME_DURATION
    setGame(chosen)
    setInputs(fresh)
    setTimeLeft(GAME_DURATION)
    setValidationResult(null)
    setTimeUsed(0)
    setPhase('playing')
    startTimer()
  }, [mode, lang, stopTimer, startTimer])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [dict, gamesList] = await Promise.all([loadDictionary(lang), loadGames(lang)])
        if (cancelled) return
        setDictionary(dict)
        setGames(gamesList)
        dictRef.current = dict
        initGame(gamesList, dict)
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true; stopTimer() }
  }, [lang, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = useCallback((index: number, value: string) => {
    if (phase !== 'playing') return
    const expectedLen = 3 + index
    const normalized = normalizeWord(value).slice(0, expectedLen)
    setInputs(prev => {
      const next: GameInputs = [...prev]
      next[index] = normalized
      inputsRef.current = next
      return next
    })
  }, [phase])

  const handleValidate = useCallback(() => {
    if (phase !== 'playing' || !gameRef.current) return
    finishGame(inputsRef.current, gameRef.current, dictRef.current)
  }, [phase, finishGame])

  const handleNewGame = useCallback(() => {
    if (games.length > 0 && dictionary.size > 0) {
      // forceRandom=true: en mode daily, la nova partida és aleatòria
      initGame(games, dictionary, true)
    }
  }, [games, dictionary, initGame])

  return {
    phase, timeLeft, timeUsed, inputs, game, validationResult,
    loading, error, gameCount: games.length, dictionary,
    handleInput, handleValidate, handleNewGame,
  }
}
