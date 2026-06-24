import { useRef, useEffect } from 'react'
import type { Language, GameMode } from '../types'
import { useGame } from '../hooks/useGame'
import { Timer } from './Timer'
import { WordBoxRow } from './WordBoxRow'
import type { WordBoxRowHandle } from './WordBoxRow'
import { BaseWordDisplay } from './BaseWordDisplay'
import { ResultScreen } from './ResultScreen'
import { DevMode } from './DevMode'
import { loadStats } from '../utils/stats'
import { reasonText } from '../utils/validate'
import { formatDateDisplay } from '../utils/daily'
import styles from './Game.module.css'

const T = {
  ca: {
    validate: 'Validar escalada',
    new: 'Nova partida aleatòria',
    lang: 'Inici',
    loading: 'Carregant...',
    error: 'Error en carregar les dades.',
    baseLabel: 'Lletres disponibles',
    hint: 'Forma paraules de 3, 4, 5, 6 i 7 lletres. No hi ha límit de temps.',
  },
  es: {
    validate: 'Validar escalada',
    new: 'Partida aleatoria',
    lang: 'Inicio',
    loading: 'Cargando...',
    error: 'Error al cargar los datos.',
    baseLabel: 'Letras disponibles',
    hint: 'Forma palabras de 3, 4, 5, 6 y 7 letras. Sin límite de tiempo.',
  },
}

interface Props {
  lang: Language
  mode: GameMode
  onChangeLang: () => void
  devMode: boolean
}

export function Game({ lang, mode, onChangeLang, devMode }: Props) {
  const {
    phase, elapsed, timeUsed, inputs, game, validationResult, loading, error,
    gameCount, dictionary, handleInput, handleValidate, handleNewGame,
  } = useGame(lang, mode)

  const t = T[lang]
  const rowRefs = useRef<(WordBoxRowHandle | null)[]>([null, null, null, null, null])

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

  if (loading) return <div className={styles.center}><p>{t.loading}</p></div>
  if (error) return (
    <div className={styles.center}>
      <p className={styles.errorMsg}>{t.error}</p>
      <p className={styles.errorDetail}>{error}</p>
    </div>
  )
  if (!game) return null

  const errorMap: Record<number, string> = {}
  if (validationResult) {
    for (const e of validationResult.errors) {
      errorMap[e.wordLength] = reasonText(e.reason, lang)
    }
  }

  const isFinished = phase === 'finished' && validationResult !== null

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>L'Escalada</h1>
          {mode === 'daily' && (
            <span className={styles.dailyBadge}>{formatDateDisplay()}</span>
          )}
        </div>
        <button className={styles.langBtn} onClick={onChangeLang}>{t.lang}</button>
      </header>

      {isFinished ? (
        <ResultScreen
          result={validationResult}
          lang={lang}
          mode={mode}
          stats={loadStats(lang)}
          timeUsed={timeUsed}
          onNewGame={handleNewGame}
          onChangeLang={onChangeLang}
        />
      ) : (
        <>
          <div className={styles.baseSection}>
            <BaseWordDisplay letters={game.baseLetters} label={t.baseLabel} />
          </div>

          <div className={styles.timerWrapper}>
            <Timer seconds={elapsed} />
          </div>

          <p className={styles.hint}>{t.hint}</p>

          <div className={styles.board}>
            {([0, 1, 2, 3, 4] as const).map(i => {
              const len = 3 + i
              const hasError = !!errorMap[len]
              return (
                <WordBoxRow
                  key={len}
                  ref={el => { rowRefs.current[i] = el }}
                  length={len}
                  value={inputs[i]}
                  onChange={v => handleInput(i, v)}
                  status={validationResult ? (hasError ? 'error' : 'correct') : 'neutral'}
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

            {devMode && (
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
