import { useState, useEffect, useCallback, useRef } from 'react'
import type { Language, GamePhase, ValidationResult } from '../types'
import { loadDictionary, loadLadders, pickRandomLadder } from '../utils/dictionary'
import { validateLadder } from '../utils/validate'
import { normalize } from '../utils/normalize'
import { saveResult } from '../utils/stats'

const GAME_DURATION = 60

export function useGame(lang: Language) {
  const [phase, setPhase] = useState<GamePhase>('playing')
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [inputs, setInputs] = useState<[string, string, string, string]>(['', '', '', ''])
  const [ladder, setLadder] = useState<string[] | null>(null)
  const [dictionary, setDictionary] = useState<Set<string>>(new Set())
  const [ladders, setLadders] = useState<string[][]>([])
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeLeftRef = useRef(GAME_DURATION)

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const finishGame = useCallback((
    currentInputs: [string, string, string, string],
    currentLadder: string[],
    currentDict: Set<string>
  ) => {
    stopTimer()
    setPhase('finished')
    const result = validateLadder(currentLadder[0], currentInputs, currentDict, currentLadder, lang)
    setValidationResult(result)
    const timeUsed = GAME_DURATION - timeLeftRef.current
    saveResult(lang, result.success, timeUsed)
  }, [lang, stopTimer])

  // Refs per passar a startTimer
  const inputsRef = useRef<[string, string, string, string]>(['', '', '', ''])
  const ladderRef = useRef<string[] | null>(null)
  const dictRef = useRef<Set<string>>(new Set())

  const startTimer = useCallback((
    iRef: React.MutableRefObject<[string, string, string, string]>,
    lRef: React.MutableRefObject<string[] | null>,
    dRef: React.MutableRefObject<Set<string>>
  ) => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1
        timeLeftRef.current = next
        if (next <= 0) {
          if (lRef.current && dRef.current.size > 0) {
            finishGame(iRef.current, lRef.current, dRef.current)
          }
          return 0
        }
        return next
      })
    }, 1000)
  }, [finishGame])

  const initGame = useCallback(async (laddersList: string[][], dict: Set<string>) => {
    stopTimer()
    const chosen = pickRandomLadder(laddersList)
    const fresh: [string, string, string, string] = ['', '', '', '']
    inputsRef.current = fresh
    ladderRef.current = chosen
    dictRef.current = dict
    timeLeftRef.current = GAME_DURATION
    setLadder(chosen)
    setInputs(fresh)
    setTimeLeft(GAME_DURATION)
    setValidationResult(null)
    setPhase('playing')
    startTimer(inputsRef, ladderRef, dictRef)
  }, [stopTimer, startTimer])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const [dict, lads] = await Promise.all([loadDictionary(lang), loadLadders(lang)])
        if (cancelled) return
        setDictionary(dict)
        setLadders(lads)
        await initGame(lads, dict)
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true; stopTimer() }
  }, [lang]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = useCallback((index: number, value: string) => {
    if (phase !== 'playing') return
    const normalized = normalize(value)
    setInputs(prev => {
      const next: [string, string, string, string] = [...prev] as [string, string, string, string]
      next[index] = normalized
      inputsRef.current = next
      return next
    })
  }, [phase])

  const handleValidate = useCallback(() => {
    if (phase !== 'playing' || !ladder) return
    finishGame(inputsRef.current, ladder, dictRef.current)
  }, [phase, ladder, finishGame])

  const handleNewGame = useCallback(() => {
    if (ladders.length > 0 && dictionary.size > 0) {
      initGame(ladders, dictionary)
    }
  }, [ladders, dictionary, initGame])

  return {
    phase,
    timeLeft,
    inputs,
    ladder,
    validationResult,
    loading,
    error,
    ladderCount: ladders.length,
    dictionary,
    handleInput,
    handleValidate,
    handleNewGame,
  }
}
