import { useState, useEffect } from 'react'
import { getDailyIndex, getMadridDateStr, formatDateDisplay, getDailyGameForDate } from '../utils/daily'
import { loadGames } from '../utils/dictionary'
import type { Language, GameEntry } from '../types'
import styles from './AdminPage.module.css'

const ADMIN_KEY = 'escalada-admin-auth'
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? 'admin123'

interface DayInfo {
  dateKey: string
  displayDate: string
  isToday: boolean
  isPast: boolean
}

function generateDays(centerDate: Date, before: number, after: number): DayInfo[] {
  const today = getMadridDateStr()
  const days: DayInfo[] = []
  for (let i = -before; i <= after; i++) {
    const d = new Date(centerDate)
    d.setDate(d.getDate() + i)
    const dateKey = getMadridDateStr(d)
    days.push({
      dateKey,
      displayDate: formatDateDisplay(d),
      isToday: dateKey === today,
      isPast: dateKey < today,
    })
  }
  return days
}

export function AdminPage() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(ADMIN_KEY) === ADMIN_PASSWORD)
  const [password, setPassword] = useState('')
  const [lang, setLang] = useState<Language>('ca')
  const [games, setGames] = useState<GameEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string>(getMadridDateStr())

  const days = generateDays(new Date(), 30, 30)

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    loadGames(lang).then(g => { setGames(g); setLoading(false) }).catch(() => setLoading(false))
  }, [authed, lang])

  function handleLogin() {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem(ADMIN_KEY, password)
      setAuthed(true)
    } else {
      alert('Contrasenya incorrecta')
    }
  }

  function handleLogout() {
    localStorage.removeItem(ADMIN_KEY)
    setAuthed(false)
  }

  function exportJSON() {
    if (!games.length) return
    const data = days.map(d => {
      const game = getDailyGameForDate(games, lang, d.dateKey)
      return { dateKey: d.dateKey, lang, index: getDailyIndex(games.length, lang, new Date(d.dateKey + 'T12:00:00Z')), ...game }
    })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `escalada-schedule-${lang}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <h1>Admin — L'Escalada</h1>
        <div className={styles.loginForm}>
          <input
            type="password"
            placeholder="Contrasenya admin"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className={styles.loginInput}
          />
          <button className={styles.loginBtn} onClick={handleLogin}>Entrar</button>
        </div>
        <p className={styles.loginNote}><a href="#/">← Tornar al joc</a></p>
      </div>
    )
  }

  const selectedGame = games.length > 0 ? getDailyGameForDate(games, lang, selectedDay) : null
  const selectedIndex = games.length > 0 ? getDailyIndex(games.length, lang, new Date(selectedDay + 'T12:00:00Z')) : -1

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Admin — L'Escalada</h1>
        <div className={styles.headerActions}>
          <select value={lang} onChange={e => setLang(e.target.value as Language)} className={styles.select}>
            <option value="ca">Català</option>
            <option value="es">Castellano</option>
          </select>
          <button className={styles.btnSecondary} onClick={exportJSON}>Exportar JSON</button>
          <button className={styles.btnSecondary} onClick={handleLogout}>Sortir</button>
          <a href="#/" className={styles.btnSecondary}>← Joc</a>
        </div>
      </header>

      {loading && <p className={styles.loading}>Carregant partides...</p>}

      <div className={styles.content}>
        <div className={styles.dayList}>
          {days.map(d => (
            <button
              key={d.dateKey}
              className={[
                styles.dayBtn,
                d.isToday ? styles.dayBtnToday : '',
                d.isPast ? styles.dayBtnPast : styles.dayBtnFuture,
                selectedDay === d.dateKey ? styles.dayBtnSelected : '',
              ].filter(Boolean).join(' ')}
              onClick={() => setSelectedDay(d.dateKey)}
            >
              <span className={styles.dayDate}>{d.displayDate}</span>
              {d.isToday && <span className={styles.todayBadge}>Avui</span>}
            </button>
          ))}
        </div>

        {selectedGame && (
          <div className={styles.detail}>
            <h2>{formatDateDisplay(new Date(selectedDay + 'T12:00:00Z'))}</h2>
            <p className={styles.meta}>Idioma: <strong>{lang.toUpperCase()}</strong> · Índex: <strong>{selectedIndex}</strong> / {games.length - 1}</p>
            <div className={styles.gameCard}>
              <p className={styles.fieldLabel}>Paraula base</p>
              <p className={styles.baseWord}>{selectedGame.baseWord.toUpperCase()}</p>
              <p className={styles.fieldLabel}>Lletres disponibles</p>
              <div className={styles.tiles}>
                {selectedGame.baseLetters.map((l, i) => (
                  <span key={i} className={styles.tile}>{l.toUpperCase()}</span>
                ))}
              </div>
              <p className={styles.fieldLabel}>Solucions</p>
              {[3, 4, 5, 6, 7].map(len => {
                const sols = selectedGame.solutions[String(len) as keyof typeof selectedGame.solutions]
                return (
                  <div key={len} className={styles.solRow}>
                    <span className={styles.solLen}>{len}:</span>
                    <span className={styles.solWords}>{sols.slice(0, 5).join(', ')}{sols.length > 5 ? ` +${sols.length - 5}` : ''}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
