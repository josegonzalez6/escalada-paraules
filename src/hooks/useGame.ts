import { useState, useEffect, useCallback, useRef } from 'react'
import type { Language, ValidationResult, GameEntry, GameInputs, DictionaryIndex } from '../types'
import { loadDictionary, loadGames } from '../utils/dictionary'
import { validateCompleteAttempt } from '../utils/validate'
import { normalizeWord, normalizeForLookup, getLetterCountsForLookup } from '../utils/normalize'
import { saveResult } from '../utils/stats'
import { getMadridDateStr } from '../utils/daily'
import { loadCalendar, getCalendarEntry, saveDailyResultForDate, loadDailyResultForDate } from '../utils/archive'

const EMPTY_INPUTS: GameInputs = ['', '', '', '', '']

export function useGame(lang: Language, archiveDateKey?: string) {
  const [phase, setPhase] = useState<'playing' | 'finished'>('playing')
  const [elapsed, setElapsed] = useState(0)
  const [inputs, setInputs] = useState<GameInputs>([...EMPTY_INPUTS])
  const [game, setGame] = useState<GameEntry | null>(null)
  const [dictionary, setDictionary] = useState<DictionaryIndex>({ lookupMap: new Map(), originalSet: new Set() })
  const [games, setGames] = useState<GameEntry[]>([])
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [timeUsed, setTimeUsed] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateKey, setDateKey] = useState<string>(archiveDateKey ?? getMadridDateStr())

  const [gameStarted, setGameStarted] = useState(false)

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

  const initGame = useCallback((chosenGame: GameEntry, dict: DictionaryIndex) => {
    const fresh: GameInputs = [...EMPTY_INPUTS]
    inputsRef.current = fresh
    gameRef.current = chosenGame
    dictRef.current = dict
    stopTimer()
    elapsedRef.current = 0
    setElapsed(0)
    setGameStarted(false)
    setGame(chosenGame)
    setInputs(fresh)
    setValidationResult(null)
    setTimeUsed(0)
    setPhase('playing')
  }, [stopTimer])

  useEffect(() => {
    const targetDateKey = archiveDateKey ?? getMadridDateStr()
    setDateKey(targetDateKey)

    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)

        const [dict, gamesList, calendar] = await Promise.all([
          loadDictionary(lang),
          loadGames(lang),
          loadCalendar(lang),
        ])

        if (cancelled) return

        const entry = getCalendarEntry(calendar, targetDateKey)
        if (!entry) {
          setError(`No hi ha partida per a la data ${targetDateKey}. El calendari cobreix del 2026-06-01 al 2026-12-31.`)
          setLoading(false)
          return
        }

        const chosenGame = gamesList[entry.gameIndex]
        if (!chosenGame) {
          setError(`Partida ${entry.gameIndex} no trobada.`)
          setLoading(false)
          return
        }

        setDictionary(dict)
        setGames(gamesList)
        dictRef.current = dict
        initGame(chosenGame, dict)
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true; stopTimer() }
  }, [lang, archiveDateKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = useCallback(() => {
    if (gameStarted) return
    setGameStarted(true)
    startTimer()
  }, [gameStarted, startTimer])

  const handleInput = useCallback((index: number, value: string) => {
    if (phase !== 'playing' || !gameStarted) return
    const expectedLen = 3 + index
    const normalized = normalizeWord(value).slice(0, expectedLen)
    setInputs(prev => {
      const next: GameInputs = [...prev]
      next[index] = normalized
      inputsRef.current = next
      return next
    })
  }, [phase, gameStarted])

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

    // Guardar resultat diari (sempre, sigui avui o arxiu)
    saveDailyResultForDate({
      dateKey: dateKey,
      lang,
      score: result.score,
      timeUsed: used,
      inputs: inputsRef.current,
      errors: result.errors.map(e => e.wordLength),
      validationErrors: result.errors,
      timestamp: Date.now(),
    })
  }, [phase, lang, dateKey, stopTimer])

  const handleNewGame = useCallback(() => {
    // En mode arxiu no hi ha "nova partida" — el hook no ofereix random
    // Reservat per compatibilitat amb components que el criden
  }, [])

  const baseCounts = game ? getLetterCountsForLookup(normalizeForLookup(game.baseWord)) : {}

  // Resultat guardat per a la data activa (per saber si ja s'ha jugat)
  const savedResult = loadDailyResultForDate(lang, dateKey)

  return {
    phase, elapsed, timeUsed, inputs, game, validationResult,
    loading, error, gameCount: games.length, dictionary, dateKey,
    savedResult, gameStarted,
    handleInput, handleValidate, handleNewGame, handleStart, baseCounts,
  }
}
