import { useState } from 'react'
import type { Language, Stats, StepError, GameEntry } from '../types'
import { formatTime } from '../utils/daily'
import { trackShare } from '../services/analytics'
import { getMadridDateStr } from '../utils/daily'
import { reasonText } from '../utils/validate'
import { useT } from '../i18n'
import styles from './ResultScreen.module.css'

interface Props {
  score: number
  timeUsed: number
  errors: Set<number>
  solutions: GameEntry['solutions'] | null
  validationErrors: StepError[]
  userInputs: string[]
  lang: Language
  stats: Stats
  onOpenArchive: () => void
  buildShare: () => string
  alreadyPlayed: boolean
  countdown: number
}

const LENGTHS = [3, 4, 5, 6, 7] as const

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function ResultScreen({
  score, timeUsed, errors, solutions, validationErrors, userInputs, lang, stats,
  onOpenArchive, buildShare, alreadyPlayed, countdown,
}: Props) {
  const tr = useT(lang)
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
        <p className={styles.scoreTitle}>{isPerfect ? tr.complete : tr.incomplete}</p>
        <p className={styles.timeRow}>
          <span>{tr.timeLabel}</span>
          <strong className={styles.timeVal}>{formatTime(timeUsed)}</strong>
        </p>
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

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{tr.userWordsTitle}</h3>
        {LENGTHS.map((len, i) => {
          const word = userInputs[i] ?? ''
          const failed = errors.has(len)
          const validationErr = validationErrors.find(e => e.wordLength === len)
          return (
            <div key={len} className={`${styles.userWordRow} ${failed ? styles.userWordFailed : styles.userWordOk}`}>
              <span className={`${styles.solutionLen} ${failed ? styles.solutionLenFailed : styles.solutionLenOk}`}>{len}</span>
              <div className={styles.userLetters}>
                {Array.from({ length: len }, (_, pos) => (
                  <span key={pos} className={`${styles.userLetterBox} ${failed ? styles.userLetterFailed : styles.userLetterOk}`}>
                    {word[pos]?.toUpperCase() ?? ''}
                  </span>
                ))}
              </div>
              {validationErr && <span className={styles.userWordError}>{reasonText(validationErr.reason, lang)}</span>}
            </div>
          )
        })}
      </div>

      {solutions && errors.size > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>{tr.possibleWordsTitle}</h3>
          {LENGTHS.filter(len => errors.has(len)).map(len => {
            const words = solutions[String(len) as keyof typeof solutions] ?? []
            const examples = words.slice(0, 3)
            return (
              <div key={len} className={styles.examplesRow}>
                <span className={styles.examplesLen}>{tr.possibleWordsForLength(len)}:</span>
                <span className={styles.examplesWords}>
                  {examples.length > 0
                    ? examples.map(w => w.toUpperCase()).join(', ')
                    : tr.noExamplesAvailable}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div className={styles.stats}>
        {[
          [stats.played, tr.statPlayed],
          [stats.perfect, tr.statPerfect],
          [`${pct}%`, tr.statPct],
          [stats.bestTime !== null ? formatTime(stats.bestTime) : '—', tr.statBest],
          [stats.avgTime !== null ? formatTime(stats.avgTime) : '—', tr.statAvg],
          [stats.currentStreak, tr.statStreak],
          [stats.bestStreak, tr.statBestStreak],
        ].map(([val, lbl], i) => (
          <div key={i} className={styles.statItem}>
            <span className={styles.statVal}>{val}</span>
            <span className={styles.statLbl}>{lbl as string}</span>
          </div>
        ))}
      </div>

      {alreadyPlayed && (
        <div className={styles.alreadyBlock}>
          <p className={styles.alreadyMsg}>{tr.alreadyPlayedMsg}</p>
          {countdown > 0 && (
            <p className={styles.countdown}>
              {tr.nextIn}: <strong>{formatCountdown(countdown)}</strong>
            </p>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.shareBtn} onClick={handleShare}>
          {copied ? tr.copied : tr.share}
        </button>
        <button className={styles.btnSecondary} onClick={onOpenArchive}>{tr.archiveBtn}</button>
      </div>
    </div>
  )
}
