import { useRef, useEffect, useCallback } from 'react'
import type { Language, GameMode, ValidationResult } from '../types'
import { useGame } from '../hooks/useGame'
import { Timer } from './Timer'
import { WordBoxRow } from './WordBoxRow'
import type { WordBoxRowHandle } from './WordBoxRow'
import { BaseWordDisplay } from './BaseWordDisplay'
import { ResultScreen } from './ResultScreen'
import { DevMode } from './DevMode'
import { loadStats } from '../utils/stats'
import { reasonText } from '../utils/validate'
import { formatDateDisplay, loadTodayDailyResult, saveDailyResult, buildShareText } from '../utils/daily'
import { trackDailyStarted } from '../services/analytics'
import styles from './Game.module.css'

const T = {
  ca: {
    validate: 'Validar',
    lang: 'Idioma',
    loading: 'Carregant...',
    error: 'Error en carregar les dades.',
    hint: 'Forma paraules de 3, 4, 5, 6 i 7 lletres.',
    daily: 'Escalada del dia',
    random: 'Partida aleatòria',
    switchRandom: '🎲 Partida aleatòria',
    switchDaily: '📅 Escalada del dia',
    langCA: 'Català',
    langES: 'Castellano',
  },
  es: {
    validate: 'Validar',
    lang: 'Idioma',
    loading: 'Cargando...',
    error: 'Error al cargar los datos.',
    hint: 'Forma palabras de 3, 4, 5, 6 y 7 letras.',
    daily: 'Escalada del día',
    random: 'Partida aleatoria',
    switchRandom: '🎲 Partida aleatoria',
    switchDaily: '📅 Escalada del día',
    langCA: 'Català',
    langES: 'Castellano',
  },
}

interface Props {
  lang: Language
  mode: GameMode
  todayKey: string
  onChangeLang: (l: Language) => void
  onSetMode: (m: GameMode) => void
  devMode: boolean
}

export function Game({ lang, mode, todayKey, onChangeLang, onSetMode, devMode }: Props) {
  const {
    phase, elapsed, timeUsed, inputs, game, validationResult, loading, error,
    gameCount, dictionary, handleInput, handleValidate, handleNewGame, baseCounts,
  } = useGame(lang, mode)

  const t = T[lang]
  const rowRefs = useRef<(WordBoxRowHandle | null)[]>([null, null, null, null, null])

  const savedDaily = mode === 'daily' ? loadTodayDailyResult(lang) : null
  const showSavedResult = mode === 'daily' && savedDaily !== null && savedDaily.dateKey === todayKey

  useEffect(() => {
    if (mode === 'daily' && phase === 'finished' && validationResult && game) {
      saveDailyResult({
        dateKey: todayKey,
        lang,
        score: validationResult.score,
        timeUsed,
        inputs,
        timestamp: Date.now(),
      })
    }
  }, [mode, phase, validationResult]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode === 'daily' && !showSavedResult && game) {
      trackDailyStarted(lang, todayKey)
    }
  }, [game, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'playing') return
    for (let i = 0; i < 5; i++) {
      const expectedLen = 3 + i
      if (inputs[i].length === expectedLen && i < 4) {
        rowRefs.current[i + 1]?.focus()
        break
      }
    }
  }, [inputs, phase])

  const handleBackspaceAtStart = useCallback((rowIndex: number) => {
    if (rowIndex === 0) return
    const prevIndex = rowIndex - 1
    const prevValue = inputs[prevIndex]
    if (prevValue.length > 0) {
      handleInput(prevIndex, prevValue.slice(0, -1))
    }
    rowRefs.current[prevIndex]?.focus()
  }, [inputs, handleInput])

  if (loading) return <div className={styles.center}><p>{t.loading}</p></div>
  if (error) return (
    <div className={styles.center}>
      <p className={styles.errorMsg}>{t.error}</p>
      <p className={styles.errorDetail}>{error}</p>
    </div>
  )

  const isFinished = phase === 'finished' && validationResult !== null

  function getErrorSet(result: ValidationResult): Set<number> {
    return new Set(result.errors.map(e => e.wordLength))
  }

  const header = (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.title}>
          {mode === 'daily' ? t.daily : t.random}
        </h1>
        {mode === 'daily' && (
          <span className={styles.dateBadge}>{formatDateDisplay()}</span>
        )}
      </div>
      <div className={styles.headerRight}>
        <select
          className={styles.langSelect}
          value={lang}
          onChange={e => onChangeLang(e.target.value as Language)}
          aria-label={t.lang}
        >
          <option value="ca">{t.langCA}</option>
          <option value="es">{t.langES}</option>
        </select>
        <button
          className={styles.modeToggle}
          onClick={() => onSetMode(mode === 'daily' ? 'random' : 'daily')}
        >
          {mode === 'daily' ? t.switchRandom : t.switchDaily}
        </button>
      </div>
    </header>
  )

  if (showSavedResult && savedDaily) {
    return (
      <div className={styles.container}>
        {header}
        <ResultScreen
          score={savedDaily.score}
          timeUsed={savedDaily.timeUsed}
          errors={new Set()}
          solutions={null}
          validationErrors={[]}
          lang={lang}
          mode={mode}
          stats={loadStats(lang)}
          onNewGame={() => onSetMode('random')}
          buildShare={() => buildShareText(savedDaily.score, savedDaily.timeUsed, lang, mode, new Set(), new Date())}
          alreadyPlayed={true}
        />
      </div>
    )
  }

  if (!game) return null

  const errorMap: Record<number, string> = {}
  if (validationResult) {
    for (const e of validationResult.errors) {
      errorMap[e.wordLength] = reasonText(e.reason, lang)
    }
  }

  return (
    <div className={styles.container}>
      {header}

      {isFinished ? (
        <ResultScreen
          score={validationResult.score}
          timeUsed={timeUsed}
          errors={getErrorSet(validationResult)}
          solutions={validationResult.solutions}
          validationErrors={validationResult.errors}
          lang={lang}
          mode={mode}
          stats={loadStats(lang)}
          onNewGame={handleNewGame}
          buildShare={() => buildShareText(validationResult.score, timeUsed, lang, mode, getErrorSet(validationResult))}
          alreadyPlayed={false}
        />
      ) : (
        <>
          <div className={styles.baseSection}>
            <BaseWordDisplay letters={game.baseLetters} />
          </div>

          <div className={styles.timerRow}>
            <Timer seconds={elapsed} />
            <p className={styles.hint}>{t.hint}</p>
          </div>

          <div className={styles.board}>
            {([0, 1, 2, 3, 4] as const).map(i => {
              const len = 3 + i
              return (
                <WordBoxRow
                  key={len}
                  ref={el => { rowRefs.current[i] = el }}
                  length={len}
                  value={inputs[i]}
                  baseCounts={baseCounts}
                  onChange={v => handleInput(i, v)}
                  onBackspaceAtStart={() => handleBackspaceAtStart(i)}
                  status={validationResult ? (errorMap[len] ? 'error' : 'correct') : 'neutral'}
                  errorText={errorMap[len]}
                  autoFocus={i === 0}
                  disabled={phase !== 'playing'}
                />
              )
            })}

            <div className={styles.actions}>
              <button
                className={styles.validateBtn}
                onClick={handleValidate}
                disabled={phase !== 'playing'}
              >
                {t.validate}
              </button>
            </div>

            {devMode && game && (
              <DevMode
                game={game}
                gameCount={gameCount}
                dictionary={dictionary}
                lang={lang}
                onRegenerate={handleNewGame}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
