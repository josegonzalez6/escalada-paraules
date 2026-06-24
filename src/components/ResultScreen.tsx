import { useState } from 'react'
import type { ValidationResult, Language, Stats, GameMode } from '../types'
import { reasonText } from '../utils/validate'
import { buildShareText, formatDateDisplay } from '../utils/daily'
import styles from './ResultScreen.module.css'

interface Props {
  result: ValidationResult
  lang: Language
  mode: GameMode
  stats: Stats
  timeUsed: number
  onNewGame: () => void
  onChangeLang: () => void
}

const T = {
  ca: {
    score_label: 'Resultat',
    perfect: '🎉 Perfecte!',
    partial: 'Bona feina!',
    fail: 'Segueix provant',
    time_used: 'Temps emprat:',
    solution: 'Solucions possibles:',
    errors: 'Paraules incorrectes:',
    letters: 'lletres',
    new_random: '🎲 Partida aleatòria',
    new_again: '🔄 Tornar a jugar',
    change: '← Inici',
    share: 'Compartir resultat',
    shared: 'Copiat!',
    played: 'Jugades',
    perfect_lbl: '5/5',
    pct: 'Encert',
    best: 'Millor temps',
    streak: 'Ratxa',
    best_streak: 'Millor ratxa',
    seconds: 's',
  },
  es: {
    score_label: 'Resultado',
    perfect: '🎉 ¡Perfecto!',
    partial: '¡Buen trabajo!',
    fail: 'Sigue intentándolo',
    time_used: 'Tiempo usado:',
    solution: 'Soluciones posibles:',
    errors: 'Palabras incorrectas:',
    letters: 'letras',
    new_random: '🎲 Partida aleatoria',
    new_again: '🔄 Volver a jugar',
    change: '← Inicio',
    share: 'Compartir resultado',
    shared: '¡Copiado!',
    played: 'Jugadas',
    perfect_lbl: '5/5',
    pct: 'Acierto',
    best: 'Mejor tiempo',
    streak: 'Racha',
    best_streak: 'Mejor racha',
    seconds: 's',
  },
}

const LENGTHS = [3, 4, 5, 6, 7] as const

export function ResultScreen({ result, lang, mode, stats, timeUsed, onNewGame, onChangeLang }: Props) {
  const t = T[lang]
  const [copied, setCopied] = useState(false)
  const isPerfect = result.score === 5
  const pct = stats.played > 0 ? Math.round((stats.perfect / stats.played) * 100) : 0
  const errorLengths = new Set(result.errors.map(e => e.wordLength))
  const titleText = isPerfect ? t.perfect : result.score >= 3 ? t.partial : t.fail

  async function handleShare() {
    const text = buildShareText(result.score, timeUsed, lang, mode)
    try {
      if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      // User cancelled share — no action needed
    }
  }

  // formatDateDisplay unused but imported — kept for potential future use
  void formatDateDisplay

  const newBtnText = mode === 'daily' ? t.new_random : t.new_again

  return (
    <div className={styles.container}>

      {/* Puntuació N/5 */}
      <div className={`${styles.scoreBlock} ${isPerfect ? styles.scoreBlockPerfect : ''}`}>
        <p className={styles.scoreLabel}>{t.score_label}</p>
        <div className={styles.scoreBig}>
          <span className={`${styles.scoreNum} ${isPerfect ? styles.scoreNumPerfect : ''}`}>
            {result.score}
          </span>
          <span className={styles.scoreDen}>/5</span>
        </div>
        <p className={styles.scoreTitle}>{titleText}</p>
        {isPerfect && (
          <p className={styles.timeRow}>
            <span className={styles.timeLabel}>{t.time_used}</span>
            <strong className={styles.timeValue}>{timeUsed}{t.seconds}</strong>
          </p>
        )}
      </div>

      {/* Errors */}
      {result.errors.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t.errors}</h3>
          {result.errors.map((e, i) => (
            <div key={i} className={styles.errorItem}>
              <span className={styles.errorStep}>{e.wordLength} {t.letters}</span>
              <span className={styles.errorWord}>«{e.word || '—'}»</span>
              <span className={styles.errorReason}>{reasonText(e.reason, lang)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Solucions possibles */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t.solution}</h3>
        <div className={styles.solution}>
          {LENGTHS.map(len => {
            const words = result.solutions[String(len) as keyof typeof result.solutions]
            const example = words[0] ?? '—'
            const hadError = errorLengths.has(len)
            return (
              <div key={len} className={`${styles.solutionStep} ${hadError ? styles.solutionFailed : styles.solutionOk}`}>
                <span className={`${styles.solutionLen} ${hadError ? styles.solutionLenFailed : styles.solutionLenOk}`}>
                  {len}
                </span>
                <span className={styles.solutionWord}>{example.toUpperCase()}</span>
                {words.length > 1 && (
                  <span className={styles.solutionAlt}>+{words.length - 1}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Estadístiques */}
      <div className={styles.stats}>
        <div className={styles.statItem}><span className={styles.statVal}>{stats.played}</span><span className={styles.statLbl}>{t.played}</span></div>
        <div className={styles.statItem}><span className={styles.statVal}>{stats.perfect}</span><span className={styles.statLbl}>{t.perfect_lbl}</span></div>
        <div className={styles.statItem}><span className={styles.statVal}>{pct}%</span><span className={styles.statLbl}>{t.pct}</span></div>
        <div className={styles.statItem}><span className={styles.statVal}>{stats.bestTime !== null ? `${stats.bestTime}${t.seconds}` : '—'}</span><span className={styles.statLbl}>{t.best}</span></div>
        <div className={styles.statItem}><span className={styles.statVal}>{stats.currentStreak}</span><span className={styles.statLbl}>{t.streak}</span></div>
        <div className={styles.statItem}><span className={styles.statVal}>{stats.bestStreak}</span><span className={styles.statLbl}>{t.best_streak}</span></div>
      </div>

      <div className={styles.actions}>
        <button className={styles.shareBtn} onClick={handleShare}>
          {copied ? t.shared : t.share}
        </button>
        <button className={styles.btnPrimary} onClick={onNewGame}>{newBtnText}</button>
        <button className={styles.btnSecondary} onClick={onChangeLang}>{t.change}</button>
      </div>
    </div>
  )
}
