import type { Language } from '../types'
import { useGame } from '../hooks/useGame'
import { Timer } from './Timer'
import { LadderRow } from './LadderRow'
import { BaseWordDisplay } from './BaseWordDisplay'
import { ResultScreen } from './ResultScreen'
import { DevMode } from './DevMode'
import { loadStats } from '../utils/stats'
import { reasonText } from '../utils/validate'
import styles from './Game.module.css'

const TOTAL_TIME = 60

const T = {
  ca: {
    validate: 'Validar escalada',
    new: 'Nova partida',
    lang: 'Idioma',
    loading: 'Carregant...',
    error: 'Error en carregar les dades.',
    baseLabel: 'Lletres disponibles',
  },
  es: {
    validate: 'Validar escalada',
    new: 'Nueva partida',
    lang: 'Idioma',
    loading: 'Cargando...',
    error: 'Error al cargar los datos.',
    baseLabel: 'Letras disponibles',
  },
}

interface Props {
  lang: Language
  onChangeLang: () => void
  devMode: boolean
}

export function Game({ lang, onChangeLang, devMode }: Props) {
  const {
    phase, timeLeft, timeUsed, inputs, game, validationResult, loading, error,
    gameCount, dictionary, handleInput, handleValidate, handleNewGame,
  } = useGame(lang)

  const t = T[lang]

  if (loading) {
    return <div className={styles.center}><p>{t.loading}</p></div>
  }

  if (error) {
    return (
      <div className={styles.center}>
        <p className={styles.errorMsg}>{t.error}</p>
        <p className={styles.errorDetail}>{error}</p>
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
      <header className={styles.header}>
        <h1 className={styles.title}>Escalada</h1>
        <button className={styles.langBtn} onClick={onChangeLang}>{t.lang}</button>
      </header>

      {phase === 'finished' && validationResult ? (
        <ResultScreen
          result={validationResult}
          lang={lang}
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
            <Timer seconds={timeLeft} total={TOTAL_TIME} />
          </div>

          <div className={styles.board}>
            {([0, 1, 2, 3, 4] as const).map(i => {
              const len = 3 + i
              const hasError = !!errorMap[len]
              return (
                <LadderRow
                  key={len}
                  length={len}
                  value={inputs[i]}
                  onChange={v => handleInput(i, v)}
                  status={validationResult ? (hasError ? 'error' : 'correct') : 'neutral'}
                  errorText={errorMap[len]}
                  autoFocus={i === 0}
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
              <button className={styles.newBtn} onClick={handleNewGame}>
                {t.new}
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
