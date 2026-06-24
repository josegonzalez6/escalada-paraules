import { useState } from 'react'
import type { Language, GameMode, Stats, StepError, GameEntry } from '../types'
import { formatTime } from '../utils/daily'
import { trackShare } from '../services/analytics'
import { getMadridDateStr } from '../utils/daily'
import styles from './ResultScreen.module.css'

interface Props {
  score: number
  timeUsed: number
  errors: Set<number>
  solutions: GameEntry['solutions'] | null
  validationErrors: StepError[]
  lang: Language
  mode: GameMode
  stats: Stats
  onNewGame: () => void
  buildShare: () => string
  alreadyPlayed: boolean
}

const T = {
  ca: {
    complete: 'Escalada completada! 🎉',
    incomplete: 'Escalada incompleta',
    timeLabel: 'Temps complert:',
    solutionTitle: 'Solucions:',
    errorTitle: 'Errors:',
    letters: 'lletres',
    newRandom: '🎲 Partida aleatòria',
    share: '📤 Compartir resultat',
    copied: '✅ Resultat copiat!',
    alreadyPlayedMsg: "Ja has jugat l'Escalada del dia. Torna demà!",
    played: 'Jugades', perfect: '5/5', pct: 'Encert',
    best: 'Millor', avg: 'Mitjana', streak: 'Ratxa', bestStreak: 'Millor ratxa',
    seconds: 's',
  },
  es: {
    complete: '¡Escalada completada! 🎉',
    incomplete: 'Escalada incompleta',
    timeLabel: 'Tiempo completado:',
    solutionTitle: 'Soluciones:',
    errorTitle: 'Errores:',
    letters: 'letras',
    newRandom: '🎲 Partida aleatoria',
    share: '📤 Compartir resultado',
    copied: '✅ ¡Resultado copiado!',
    alreadyPlayedMsg: '¡Ya jugaste la Escalada del día. ¡Vuelve mañana!',
    played: 'Jugadas', perfect: '5/5', pct: 'Acierto',
    best: 'Mejor', avg: 'Media', streak: 'Racha', bestStreak: 'Mejor racha',
    seconds: 's',
  },
}

const LENGTHS = [3, 4, 5, 6, 7] as const

export function ResultScreen({
  score, timeUsed, errors, solutions, lang, stats,
  onNewGame, buildShare, alreadyPlayed,
}: Props) {
  const t = T[lang]
  const [copied, setCopied] = useState(false)
  const isPerfect = score === 5
  const pct = stats.played > 0 ? Math.round((stats.perfect / stats.played) * 100) : 0

  async function handleShare() {
    const text = buildShare()
    trackShare(lang, getMadridDateStr())
    try {
      if (navigator.share) {
        await navigator.share({ text })
      } else {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch { /* user cancelled */ }
  }

  return (
    <div className={styles.container}>
      <div className={`${styles.scoreBlock} ${isPerfect ? styles.scoreBlockPerfect : ''}`}>
        <div className={styles.scoreBig}>
          <span className={`${styles.scoreNum} ${isPerfect ? styles.scoreNumPerfect : ''}`}>{score}</span>
          <span className={styles.scoreDen}>/5</span>
        </div>
        <p className={styles.scoreTitle}>{isPerfect ? t.complete : t.incomplete}</p>
        {isPerfect && (
          <p className={styles.timeRow}>
            <span>{t.timeLabel}</span>
            <strong className={styles.timeVal}>{formatTime(timeUsed)}</strong>
          </p>
        )}
      </div>

      <div className={styles.emojiGrid}>
        {LENGTHS.map(len => {
          const ok = !errors.has(len)
          const emoji = ok ? '🟩' : '🟥'
          return (
            <div key={len} className={styles.emojiRow}>
              {Array.from({ length: len }, (_, i) => (
                <span key={i} className={styles.emojiCell}>{emoji}</span>
              ))}
            </div>
          )
        })}
      </div>

      {solutions && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{t.solutionTitle}</h3>
          {LENGTHS.map(len => {
            const words = solutions[String(len) as keyof typeof solutions]
            const example = words[0] ?? '—'
            const failed = errors.has(len)
            return (
              <div key={len} className={`${styles.solutionRow} ${failed ? styles.solutionFailed : styles.solutionOk}`}>
                <span className={`${styles.solutionLen} ${failed ? styles.solutionLenFailed : styles.solutionLenOk}`}>{len}</span>
                <span className={styles.solutionWord}>{example.toUpperCase()}</span>
                {words.length > 1 && <span className={styles.solutionAlt}>+{words.length - 1}</span>}
              </div>
            )
          })}
        </div>
      )}

      <div className={styles.stats}>
        {[
          [stats.played, t.played],
          [stats.perfect, t.perfect],
          [`${pct}%`, t.pct],
          [stats.bestTime !== null ? formatTime(stats.bestTime) : '—', t.best],
          [stats.avgTime !== null ? formatTime(stats.avgTime) : '—', t.avg],
          [stats.currentStreak, t.streak],
          [stats.bestStreak, t.bestStreak],
        ].map(([val, lbl], i) => (
          <div key={i} className={styles.statItem}>
            <span className={styles.statVal}>{val}</span>
            <span className={styles.statLbl}>{lbl as string}</span>
          </div>
        ))}
      </div>

      {alreadyPlayed && (
        <p className={styles.alreadyMsg}>{t.alreadyPlayedMsg}</p>
      )}

      <div className={styles.actions}>
        <button className={styles.shareBtn} onClick={handleShare}>
          {copied ? t.copied : t.share}
        </button>
        <button className={styles.btnPrimary} onClick={onNewGame}>{t.newRandom}</button>
      </div>
    </div>
  )
}
