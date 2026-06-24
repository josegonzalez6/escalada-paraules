import { useState, useEffect, useCallback, useRef } from 'react'
import type { Language, ValidationResult, GameEntry, GameInputs, GameMode, DictionaryIndex } from '../types'
import { loadDictionary, loadGames, pickRandomGame } from '../utils/dictionary'
import { pickDailyGame } from '../utils/daily'
import { validateCompleteAttempt } from '../utils/validate'
import { normalizeWord, normalizeForLookup, getLetterCountsForLookup } from '../utils/normalize'
import { saveResult } from '../utils/stats'

const EMPTY_INPUTS: GameInputs = ['', '', '', '', '']

export function useGame(lang: Language, mode: GameMode) {
  const [phase, setPhase] = useState<'playing' | 'finished'>('playing')
  const [elapsed, setElapsed] = useState(0)  // cronòmetre ascendent (segons)
  const [inputs, setInputs] = useState<GameInputs>([...EMPTY_INPUTS])
  const [game, setGame] = useState<GameEntry | null>(null)
  const [dictionary, setDictionary] = useState<DictionaryIndex>({ lookupMap: new Map(), originalSet: new Set() })
  const [games, setGames] = useState<GameEntry[]>([])
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [timeUsed, setTimeUsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const elapsedRef = useRef(0)
  const inputsRef = useRef<GameInputs>([...EMPTY_INPUTS])
  const gameRef = useRef<GameEntry | null>(null)
  const dictRef = useRef<DictionaryIndex>({ lookupMap: new Map(), originalSet: new Set() })

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    elapsedRef.current = 0
    setElapsed(0)
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1
      setElapsed(elapsedRef.current)
    }, 1000)
  }, [stopTimer])

  const initGame = useCallback((gamesList: GameEntry[], dict: DictionaryIndex, forceRandom = false) => {
    const chosen = (mode === 'daily' && !forceRandom)
      ? pickDailyGame(gamesList, lang)
      : pickRandomGame(gamesList)
    const fresh: GameInputs = [...EMPTY_INPUTS]
    inputsRef.current = fresh
    gameRef.current = chosen
    dictRef.current = dict
    setGame(chosen)
    setInputs(fresh)
    setValidationResult(null)
    setTimeUsed(0)
    setPhase('playing')
    startTimer()
  }, [mode, lang, startTimer])

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
    stopTimer()
    setPhase('finished')
    const used = elapsedRef.current
    setTimeUsed(used)
    const result = validateCompleteAttempt(
      gameRef.current.baseWord,
      inputsRef.current,
      dictRef.current,
      gameRef.current.solutions
    )
    setValidationResult(result)
    saveResult(lang, result.score, used)
  }, [phase, lang, stopTimer])

  const handleNewGame = useCallback(() => {
    if (games.length > 0 && dictionary.lookupMap.size > 0) {
      initGame(games, dictionary, true)
    }
  }, [games, dictionary, initGame])

  const baseCounts = game ? getLetterCountsForLookup(normalizeForLookup(game.baseWord)) : {}

  return {
    phase, elapsed, timeUsed, inputs, game, validationResult,
    loading, error, gameCount: games.length, dictionary,
    handleInput, handleValidate, handleNewGame, baseCounts,
  }
}
