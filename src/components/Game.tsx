import { useRef, useEffect, useCallback, useState } from 'react'
import type { Language } from '../types'
import { useGame } from '../hooks/useGame'
import { useT } from '../i18n'
import { Timer } from './Timer'
import { WordBoxRow } from './WordBoxRow'
import { BaseWordDisplay } from './BaseWordDisplay'
import { ResultScreen } from './ResultScreen'
import { HowToPlay, HELP_SEEN_KEY } from './HowToPlay'
import { DevMode } from './DevMode'
import { loadStats } from '../utils/stats'
import { reasonText } from '../utils/validate'
import {
  formatDateDisplay, buildShareText, getSecondsUntilNextMadridMidnight,
} from '../utils/daily'
import { loadDailyResultForDate, resetTodayDaily, isDateLocked } from '../utils/archive'
import { trackDailyStarted } from '../services/analytics'
import { applyChars, applyBackspace } from '../utils/keyboard'
import type { ValidationResult } from '../types'
import styles from './Game.module.css'

interface Props {
  lang: Language
  archiveDateKey?: string   // undefined = avui
  todayKey: string
  onChangeLang: (l: Language) => void
  onOpenArchive: () => void
  onBackToToday: () => void
  devMode: boolean
}

export function Game({ lang, archiveDateKey, todayKey, onChangeLang, onOpenArchive, onBackToToday, devMode }: Props) {
  const {
    phase, elapsed, timeUsed, inputs, game, validationResult, loading, error,
    gameCount, dictionary, dateKey, gameStarted,
    handleInput, handleValidate, handleNewGame, handleStart, baseCounts,
  } = useGame(lang, archiveDateKey)

  const tr = useT(lang)
  const hiddenInputRef = useRef<HTMLInputElement>(null)
  const [activeRow, setActiveRow] = useState(0)
  const [clickedCol, setClickedCol] = useState<number | null>(null)
  const [showHelp, setShowHelp] = useState(() => !localStorage.getItem(HELP_SEEN_KEY))
  const [countdown, setCountdown] = useState(0)

  const isArchiveDate = archiveDateKey !== undefined && archiveDateKey !== todayKey
  const isLockedDate = archiveDateKey !== undefined && isDateLocked(archiveDateKey)

  function handleCloseHelp() {
    localStorage.setItem(HELP_SEEN_KEY, '1')
    setShowHelp(false)
    hiddenInputRef.current?.focus()
  }

  useEffect(() => {
    if (game && phase === 'playing') {
      setActiveRow(0)
      setClickedCol(null)
    }
  }, [game]) // eslint-disable-line react-hooks/exhaustive-deps

  // Quan comença la partida, posa focus a la primera casella
  useEffect(() => {
    if (gameStarted) {
      hiddenInputRef.current?.focus()
    }
  }, [gameStarted])

  // En acabar la partida (phase canvia a 'finished'), neteja l'estat de selecció
  useEffect(() => {
    if (phase === 'finished') {
      setActiveRow(-1)
      setClickedCol(null)
      hiddenInputRef.current?.blur()
    }
  }, [phase])

  // Resultat guardat per a aquesta data (avui o arxiu)
  const savedDaily = loadDailyResultForDate(lang, dateKey)
  // Només mostrar resultat guardat si no acabem de validar ara mateix (phase !== 'finished')
  // Si phase==='finished', el resultat live té solutions reals; el guardat en tindria null.
  const showSavedResult = savedDaily !== null && phase !== 'finished'

  // Compte enrere fins a la propera escalada (només per avui)
  useEffect(() => {
    if (!showSavedResult || isArchiveDate) return
    setCountdown(getSecondsUntilNextMadridMidnight())
    const interval = setInterval(() => {
      setCountdown(getSecondsUntilNextMadridMidnight())
    }, 1000)
    return () => clearInterval(interval)
  }, [showSavedResult, isArchiveDate])

  useEffect(() => {
    if (!showSavedResult && game) {
      trackDailyStarted(lang, dateKey)
    }
  }, [game]) // eslint-disable-line react-hooks/exhaustive-deps

  const processChars = useCallback((rawChars: string) => {
    if (phase !== 'playing') return
    const result = applyChars({ inputs, activeRow, clickedCol }, rawChars)
    for (let i = 0; i < 5; i++) {
      if (result.inputs[i] !== inputs[i]) handleInput(i, result.inputs[i])
    }
    setActiveRow(result.activeRow)
    setClickedCol(result.clickedCol ?? null)
  }, [phase, inputs, activeRow, clickedCol, handleInput])

  const handleBackspace = useCallback(() => {
    if (phase !== 'playing') return
    const result = applyBackspace({ inputs, activeRow, clickedCol })
    for (let i = 0; i < 5; i++) {
      if (result.inputs[i] !== inputs[i]) handleInput(i, result.inputs[i])
    }
    setActiveRow(result.activeRow)
    setClickedCol(result.clickedCol ?? null)
  }, [phase, inputs, activeRow, clickedCol, handleInput])

  function handleRowClick(rowIndex: number) {
    if (phase !== 'playing') return
    setActiveRow(rowIndex)
    setClickedCol(null)
    hiddenInputRef.current?.focus()
  }

  function handleCellClick(rowIndex: number, col: number) {
    if (phase !== 'playing') return
    setActiveRow(rowIndex)
    setClickedCol(col)
    hiddenInputRef.current?.focus()
  }

  function handleStartGame() {
    handleStart()
  }

  function handleResetToday() {
    if (confirm(lang === 'ca' ? "Reiniciar l'escalada d'avui?" : "¿Reiniciar la escalera de hoy?")) {
      resetTodayDaily(lang)
      window.location.reload()
    }
  }

  if (loading) return <div className={styles.center}><p>{tr.loading}</p></div>
  if (error) return (
    <div className={styles.center}>
      <p className={styles.errorMsg}>{tr.errorLoading}</p>
      <p className={styles.errorDetail}>{error}</p>
    </div>
  )

  // Data bloquejada (futura)
  if (isLockedDate) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>{tr.archiveLocked}</h1>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.modeToggle} onClick={onBackToToday}>{tr.backToGame}</button>
          </div>
        </header>
        <div className={styles.center}>
          <p style={{ fontSize: '2rem' }}>🔒</p>
          <p>{tr.archiveLockedMsg}</p>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            {archiveDateKey && formatDateDisplay(new Date(archiveDateKey + 'T12:00:00Z'))}
          </p>
        </div>
      </div>
    )
  }

  const isFinished = phase === 'finished' && validationResult !== null

  function getErrorSet(result: ValidationResult): Set<number> {
    return new Set(result.errors.map(e => e.wordLength))
  }

  // Títol del header
  const headerTitle = isArchiveDate && archiveDateKey
    ? tr.archiveDailyTitle(formatDateDisplay(new Date(archiveDateKey + 'T12:00:00Z')))
    : tr.dailyTitle

  const header = (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <h1 className={styles.title}>{headerTitle}</h1>
        {!isArchiveDate && (
          <span className={styles.dateBadge}>{formatDateDisplay()}</span>
        )}
        {isArchiveDate && (
          <button className={styles.backLink} onClick={onBackToToday}>{tr.backToGame}</button>
        )}
      </div>
      <div className={styles.headerRight}>
        <select
          className={styles.langSelect}
          value={lang}
          onChange={e => onChangeLang(e.target.value as Language)}
          aria-label={tr.langLabel}
        >
          <option value="ca">{tr.langCA}</option>
          <option value="es">{tr.langES}</option>
        </select>
        <button className={styles.modeToggle} onClick={onOpenArchive}>
          {tr.archiveBtn}
        </button>
        <button className={styles.helpBtn} onClick={() => setShowHelp(true)} aria-label={tr.helpAriaLabel}>?</button>
      </div>
    </header>
  )

  if (showSavedResult && savedDaily) {
    const savedErrors = new Set(savedDaily.errors ?? [])
    return (
      <div className={styles.container}>
        {showHelp && <HowToPlay lang={lang} onClose={handleCloseHelp} />}
        {header}
        <ResultScreen
          score={savedDaily.score}
          timeUsed={savedDaily.timeUsed}
          errors={savedErrors}
          solutions={game?.solutions ?? null}
          validationErrors={savedDaily.validationErrors ?? []}
          userInputs={savedDaily.inputs ? [...savedDaily.inputs] : ['', '', '', '', '']}
          lang={lang}
          stats={loadStats(lang)}
          onOpenArchive={onOpenArchive}
          buildShare={() => buildShareText(savedDaily.score, savedDaily.timeUsed, lang, 'daily', savedErrors, new Date())}
          alreadyPlayed={true}
          countdown={isArchiveDate ? 0 : countdown}
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
      {showHelp && <HowToPlay lang={lang} onClose={handleCloseHelp} />}
      {header}

      {isFinished ? (
        <ResultScreen
          score={validationResult.score}
          timeUsed={timeUsed}
          errors={getErrorSet(validationResult)}
          solutions={validationResult.solutions}
          validationErrors={validationResult.errors}
          userInputs={[...inputs]}
          lang={lang}
          stats={loadStats(lang)}
          onOpenArchive={onOpenArchive}
          buildShare={() => buildShareText(validationResult.score, timeUsed, lang, 'daily', getErrorSet(validationResult))}
          alreadyPlayed={false}
          countdown={0}
        />
      ) : (
        <>
          <div className={gameStarted ? styles.baseSection : `${styles.baseSection} ${styles.baseSectionLocked}`}>
            <BaseWordDisplay letters={game.baseLetters} label={tr.availableLetters} />
          </div>

          {!gameStarted && (
            <div className={styles.startRow}>
              <button className={styles.startBtn} onClick={handleStartGame}>
                {tr.startGame}
              </button>
            </div>
          )}

          <div className={styles.timerRow}>
            <Timer seconds={elapsed} />
            <p className={styles.hint}>{tr.hint}</p>
          </div>

          <div className={styles.board}>
            {([0, 1, 2, 3, 4] as const).map(i => {
              const len = 3 + i
              return (
                <WordBoxRow
                  key={len}
                  length={len}
                  value={inputs[i]}
                  baseCounts={baseCounts}
                  status={validationResult ? (errorMap[len] ? 'error' : 'correct') : 'neutral'}
                  errorText={errorMap[len]}
                  isActive={phase === 'playing' && gameStarted && activeRow === i}
                  activeCursorCol={phase === 'playing' && gameStarted && activeRow === i ? clickedCol : null}
                  onRowClick={() => handleRowClick(i)}
                  onCellClick={(col) => handleCellClick(i, col)}
                />
              )
            })}

            {gameStarted && (
              <div className={styles.actions}>
                <button
                  className={styles.validateBtn}
                  onClick={() => { setActiveRow(-1); setClickedCol(null); handleValidate() }}
                  disabled={phase !== 'playing'}
                >
                  {tr.validate}
                </button>
              </div>
            )}

            {devMode && game && (
              <>
                <DevMode
                  game={game}
                  gameCount={gameCount}
                  dictionary={dictionary}
                  lang={lang}
                  onRegenerate={handleNewGame}
                />
                <button
                  className={styles.btnBack}
                  onClick={handleResetToday}
                  style={{ marginTop: '0.5rem', color: '#ef4444' }}
                >
                  {tr.resetToday}
                </button>
              </>
            )}
          </div>

          <input
            ref={hiddenInputRef}
            className={styles.hiddenCatcher}
            type="text"
            inputMode="text"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            defaultValue=""
            aria-hidden="true"
            tabIndex={-1}
            disabled={showHelp || !gameStarted}
            onInput={(e) => {
              const target = e.target as HTMLInputElement
              const val = target.value
              if (val) { processChars(val); target.value = '' }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') { e.preventDefault(); handleBackspace() }
              if (e.key === 'Enter') { e.preventDefault(); handleValidate() }
            }}
          />
        </>
      )}
    </div>
  )
}
