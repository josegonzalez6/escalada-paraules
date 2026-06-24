import { useState, useEffect } from 'react'
import type { Language } from '../types'
import { useT } from '../i18n'
import { loadCalendar, getDayState, isDateLocked } from '../utils/archive'
import { formatDateDisplay } from '../utils/daily'
import type { DayState } from '../utils/archive'
import styles from './ArchiveView.module.css'

interface Props {
  lang: Language
  todayKey: string
  onPlayDate: (dateKey: string) => void
  onBack: () => void
  onChangeLang: (lang: Language) => void
}

const MONTHS_CA = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre']
const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const WEEKDAYS_CA = ['Dl', 'Dt', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg']
const WEEKDAYS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// Mesos de l'arxiu: juny (6) a desembre (12) de 2026
const ARCHIVE_MONTHS = [6, 7, 8, 9, 10, 11, 12]

function getDayClass(state: DayState, isToday: boolean): string {
  const base = styles.day
  const stateClass = {
    future_locked: styles.dayLocked,
    available: styles.dayAvailable,
    played_perfect: styles.dayPerfect,
    played_partial: styles.dayPartial,
    played_zero: styles.dayZero,
  }[state]
  return [base, stateClass, isToday ? styles.dayToday : ''].filter(Boolean).join(' ')
}

function getDayEmoji(state: DayState): string {
  return { future_locked: '🔒', available: '', played_perfect: '✅', played_partial: '🟡', played_zero: '❌' }[state]
}

function buildMonthGrid(year: number, month: number): (string | null)[] {
  // month: 1-12
  const firstDay = new Date(year, month - 1, 1)
  // JS: 0=diumenge. Convertim a dilluns=0
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (string | null)[] = Array(startDow).fill(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `2026-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push(key)
  }
  return cells
}

export function ArchiveView({ lang, todayKey, onPlayDate, onBack, onChangeLang }: Props) {
  const tr = useT(lang)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    loadCalendar(lang)
      .catch(e => setLoadError((e as Error).message))
  }, [lang])

  const months = lang === 'ca' ? MONTHS_CA : MONTHS_ES
  const weekdays = lang === 'ca' ? WEEKDAYS_CA : WEEKDAYS_ES

  function handleDayClick(dateKey: string) {
    if (isDateLocked(dateKey)) return
    onPlayDate(dateKey)
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={onBack}>{tr.backToGame}</button>
        <h1 className={styles.title}>{tr.archiveTitle}</h1>
        <select
          className={styles.langSelect}
          value={lang}
          onChange={e => onChangeLang(e.target.value as Language)}
          aria-label={tr.langLabel}
        >
          <option value="ca">{tr.langCA}</option>
          <option value="es">{tr.langES}</option>
        </select>
      </header>

      {loadError && <p className={styles.errorMsg}>{loadError}</p>}

      <div className={styles.months}>
        {ARCHIVE_MONTHS.map(month => {
          const monthName = months[month - 1]
          const cells = buildMonthGrid(2026, month)

          return (
            <section key={month} className={styles.month}>
              <h2 className={styles.monthTitle}>{monthName} 2026</h2>
              <div className={styles.weekdays}>
                {weekdays.map(d => <span key={d} className={styles.weekday}>{d}</span>)}
              </div>
              <div className={styles.grid}>
                {cells.map((dateKey, i) => {
                  if (!dateKey) {
                    return <div key={`empty-${i}`} className={styles.dayEmpty} />
                  }
                  const state = getDayState(dateKey, lang)
                  const isToday = dateKey === todayKey
                  const dayNum = parseInt(dateKey.split('-')[2], 10)
                  return (
                    <button
                      key={dateKey}
                      className={getDayClass(state, isToday)}
                      onClick={() => handleDayClick(dateKey)}
                      disabled={state === 'future_locked'}
                      title={state === 'future_locked' ? tr.archiveLockedMsg : formatDateDisplay(new Date(dateKey + 'T12:00:00Z'))}
                      aria-label={`${dayNum} ${monthName} — ${tr['archive' + (state.charAt(0).toUpperCase() + state.slice(1).replace('_', '')) as keyof typeof tr] ?? state}`}
                    >
                      <span className={styles.dayNum}>{dayNum}</span>
                      {getDayEmoji(state) && (
                        <span className={styles.dayEmoji}>{getDayEmoji(state)}</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <div className={styles.legend}>
        <span className={`${styles.legendItem} ${styles.legendAvailable}`}>{tr.archiveAvailable}</span>
        <span className={`${styles.legendItem} ${styles.legendPerfect}`}>{tr.archivePlayed} 5/5</span>
        <span className={`${styles.legendItem} ${styles.legendPartial}`}>{tr.archivePlayed} &lt;5</span>
        <span className={`${styles.legendItem} ${styles.legendLocked}`}>{tr.archiveLocked}</span>
      </div>
    </div>
  )
}
