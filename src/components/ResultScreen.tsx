import type { ValidationResult, Language, Stats } from '../types'
import { reasonText } from '../utils/validate'
import styles from './ResultScreen.module.css'

interface Props {
  result: ValidationResult
  lang: Language
  stats: Stats
  onNewGame: () => void
  onChangeLang: () => void
}

const T = {
  ca: {
    title_ok: '🎉 Escalada completada!',
    title_fail: 'Escalada incompleta',
    solution: 'Solució possible:',
    errors: 'Errors:',
    letters: 'lletres',
    new: 'Nova partida',
    change: 'Canviar idioma',
    played: 'Jugades',
    won: 'Guanyades',
    pct: 'Encert',
    best: 'Millor temps',
    streak: 'Ratxa',
    best_streak: 'Millor ratxa',
    seconds: 's',
  },
  es: {
    title_ok: '🎉 ¡Escalada completada!',
    title_fail: 'Escalada incompleta',
    solution: 'Posible solución:',
    errors: 'Errores:',
    letters: 'letras',
    new: 'Nueva partida',
    change: 'Cambiar idioma',
    played: 'Jugadas',
    won: 'Ganadas',
    pct: 'Acierto',
    best: 'Mejor tiempo',
    streak: 'Racha',
    best_streak: 'Mejor racha',
    seconds: 's',
  },
}

const LENGTHS = [3, 4, 5, 6, 7] as const

export function ResultScreen({ result, lang, stats, onNewGame, onChangeLang }: Props) {
  const t = T[lang]
  const pct = stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0

  return (
    <div className={styles.container}>
      <h2 className={`${styles.title} ${result.success ? styles.titleOk : styles.titleFail}`}>
        {result.success ? t.title_ok : t.title_fail}
      </h2>

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

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>{t.solution}</h3>
        <div className={styles.solution}>
          {LENGTHS.map(len => {
            const words = result.solutions[String(len) as keyof typeof result.solutions]
            const example = words[0] ?? '—'
            return (
              <div key={len} className={styles.solutionStep}>
                <span className={styles.solutionLen}>{len}</span>
                <span className={styles.solutionWord}>{example.toUpperCase()}</span>
                {words.length > 1 && (
                  <span className={styles.solutionAlt}>+{words.length - 1}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}><span className={styles.statVal}>{stats.played}</span><span className={styles.statLbl}>{t.played}</span></div>
        <div className={styles.statItem}><span className={styles.statVal}>{stats.won}</span><span className={styles.statLbl}>{t.won}</span></div>
        <div className={styles.statItem}><span className={styles.statVal}>{pct}%</span><span className={styles.statLbl}>{t.pct}</span></div>
        <div className={styles.statItem}><span className={styles.statVal}>{stats.bestTime !== null ? `${stats.bestTime}${t.seconds}` : '—'}</span><span className={styles.statLbl}>{t.best}</span></div>
        <div className={styles.statItem}><span className={styles.statVal}>{stats.currentStreak}</span><span className={styles.statLbl}>{t.streak}</span></div>
        <div className={styles.statItem}><span className={styles.statVal}>{stats.bestStreak}</span><span className={styles.statLbl}>{t.best_streak}</span></div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btnPrimary} onClick={onNewGame}>{t.new}</button>
        <button className={styles.btnSecondary} onClick={onChangeLang}>{t.change}</button>
      </div>
    </div>
  )
}
