/**
 * AdminPage — Zona d'administrador de L'Escalada de Paraules.
 *
 * AVÍS DE SEGURETAT: Aquesta protecció és de frontend (VITE_ADMIN_PASSWORD).
 * Les variables VITE_ queden exposades al bundle del client i no constitueixen
 * seguretat forta. Per a un admin real, cal backend + autenticació de servidor.
 *
 * Accés: /#/admin
 */
import { useState, useEffect, useMemo } from 'react'
import type { Language, CalendarEntry, GameEntry } from '../types'
import { loadGames } from '../utils/dictionary'
import { loadCalendar } from '../utils/archive'
import { getMadridDateStr, formatDateDisplay } from '../utils/daily'
import { loadDailyResultForDate, resetDailyForDate, ARCHIVE_START, ARCHIVE_END } from '../utils/archive'
import styles from './AdminPage.module.css'

// ────────── Seguretat ──────────
const ADMIN_PW = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined
const ADMIN_CONFIGURED = !!ADMIN_PW
const SESSION_KEY = 'escalada-admin-session'

// ────────── Constants de calendari ──────────
const MONTHS = [
  { label: 'Juny 2026', key: '2026-06' },
  { label: 'Juliol 2026', key: '2026-07' },
  { label: 'Agost 2026', key: '2026-08' },
  { label: 'Setembre 2026', key: '2026-09' },
  { label: 'Octubre 2026', key: '2026-10' },
  { label: 'Novembre 2026', key: '2026-11' },
  { label: 'Desembre 2026', key: '2026-12' },
]

const WEEKDAYS = ['Dl', 'Dm', 'Dc', 'Dj', 'Dv', 'Ds', 'Dg']

function getMonthDays(monthKey: string): string[] {
  const [y, m] = monthKey.split('-').map(Number)
  const days: string[] = []
  const d = new Date(Date.UTC(y, m - 1, 1))
  while (d.getUTCMonth() === m - 1) {
    days.push(`${y}-${String(m).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`)
    d.setUTCDate(d.getUTCDate() + 1)
  }
  return days
}

function getFirstDayOfWeek(monthKey: string): number {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1, 1))
  return (d.getUTCDay() + 6) % 7  // 0=Dl, 6=Dg
}

function isInArchiveRange(dateKey: string): boolean {
  return dateKey >= ARCHIVE_START && dateKey <= ARCHIVE_END
}

// ────────── Component principal ──────────
export function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [lang, setLang] = useState<Language>('ca')
  const [games, setGames] = useState<GameEntry[]>([])
  const [calendar, setCalendar] = useState<CalendarEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [monthIdx, setMonthIdx] = useState(0)
  const [selectedDate, setSelectedDate] = useState<string>(getMadridDateStr())
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'future' | 'past' | 'few-solutions'>('all')

  // Alternatives state (Fase A)
  const [altDate, setAltDate] = useState<string | null>(null)
  const [localOverrides, setLocalOverrides] = useState<Record<string, number>>({})

  if (!ADMIN_CONFIGURED) {
    return (
      <div className={styles.loginPage}>
        <h1 className={styles.loginTitle}>Admin no configurat</h1>
        <p className={styles.loginNote}>
          Cal definir la variable d'entorn <code>VITE_ADMIN_PASSWORD</code> per accedir a l'administrador.
        </p>
        <p className={styles.loginNote}>
          Vegeu el README per configurar-la a Vercel.
        </p>
        <a href="#/" className={styles.loginLink}>← Tornar al joc</a>
      </div>
    )
  }

  function handleLogin() {
    if (password === ADMIN_PW) {
      sessionStorage.setItem(SESSION_KEY, '1')
      setAuthed(true)
      setLoginError('')
    } else {
      setLoginError('Contrasenya incorrecta')
    }
    setPassword('')
  }

  function handleLogout() {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthed(false)
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!authed) return
    setLoading(true)
    setLoadError('')
    Promise.all([loadGames(lang), loadCalendar(lang)])
      .then(([g, c]) => { setGames(g); setCalendar(c) })
      .catch(e => setLoadError(String(e)))
      .finally(() => setLoading(false))
  }, [authed, lang])

  // ── Mapa dateKey → CalendarEntry ──
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const calendarMap = useMemo(() => {
    const m = new Map<string, CalendarEntry>()
    for (const e of calendar) m.set(e.dateKey, e)
    return m
  }, [calendar])

  // ── Dades del dia seleccionat ──
  function getGameForDate(dateKey: string): GameEntry | null {
    const override = localOverrides[dateKey]
    const entry = calendarMap.get(dateKey)
    const idx = override !== undefined ? override : entry?.gameIndex
    return idx !== undefined && games[idx] ? games[idx] : null
  }

  function getCalendarEntryForDate(dateKey: string): CalendarEntry | null {
    return calendarMap.get(dateKey) ?? null
  }

  // ── Cerca i filtre ──
  const today = getMadridDateStr()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const filteredDates = useMemo(() => {
    const month = MONTHS[monthIdx].key
    const days = getMonthDays(month).filter(isInArchiveRange)
    return days.filter(d => {
      if (filter === 'future' && d <= today) return false
      if (filter === 'past' && d >= today) return false
      if (filter === 'few-solutions') {
        const game = getGameForDate(d)
        if (!game) return false
        const minSols = Math.min(...[3, 4, 5, 6, 7].map(l => (game.solutions[String(l) as keyof typeof game.solutions] ?? []).length))
        if (minSols > 5) return false
      }
      if (search) {
        const game = getGameForDate(d)
        return game?.baseWord.toLowerCase().includes(search.toLowerCase()) ?? false
      }
      return true
    })
  }, [monthIdx, calendar, games, localOverrides, filter, search, today])

  // ── Alternatives per un dia (Fase A) ──
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const alternatives = useMemo(() => {
    if (!altDate || games.length === 0) return []
    const entry = calendarMap.get(altDate)
    const currentIdx = localOverrides[altDate] ?? entry?.gameIndex ?? -1
    // Índexs usats al calendari ±10 dies per evitar repeticions properes
    const usedIdx = new Set<number>()
    usedIdx.add(currentIdx)
    for (const [dk, e] of calendarMap) {
      if (Math.abs(new Date(dk).getTime() - new Date(altDate).getTime()) < 10 * 86400000) {
        usedIdx.add(e.gameIndex)
      }
    }
    // Cerca 5 alternatives no usades properes
    const candidates: Array<{ idx: number; game: GameEntry }> = []
    for (let offset = 1; candidates.length < 5 && offset < games.length; offset++) {
      const idx = (currentIdx + offset) % games.length
      if (!usedIdx.has(idx) && games[idx]) candidates.push({ idx, game: games[idx] })
    }
    return candidates
  }, [altDate, games, calendarMap, localOverrides])

  function applyLocalOverride(dateKey: string, gameIdx: number) {
    setLocalOverrides(prev => ({ ...prev, [dateKey]: gameIdx }))
    setAltDate(null)
  }

  function exportCalendarJSON() {
    const modified = calendar.map(entry => {
      const override = localOverrides[entry.dateKey]
      if (override !== undefined) {
        const game = games[override]
        return { ...entry, gameIndex: override, baseWord: game?.baseWord ?? entry.baseWord }
      }
      return entry
    })
    const overrideCount = Object.keys(localOverrides).length
    const blob = new Blob([JSON.stringify(modified, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${lang}-calendar-2026-modified.json`
    a.click()
    URL.revokeObjectURL(url)
    alert(`JSON exportat amb ${overrideCount} canvis locals.\n\nPer publicar-ho: substitueix public/generated/${lang}-calendar-2026.json i fes deploy.`)
  }

  function exportCSV() {
    const rows = ['Data,Idioma,GameIndex,BaseWord,Sol3,Sol4,Sol5,Sol6,Sol7,Estat,JugatLocal']
    for (const entry of calendar) {
      const game = getGameForDate(entry.dateKey)
      if (!game) continue
      const state = entry.dateKey > today ? 'futur' : entry.dateKey === today ? 'avui' : 'passat'
      const playedLocal = loadDailyResultForDate(lang, entry.dateKey) ? 'si' : 'no'
      const idx = localOverrides[entry.dateKey] ?? entry.gameIndex
      rows.push([
        entry.dateKey, lang, idx, game.baseWord,
        game.solutions['3'].length, game.solutions['4'].length,
        game.solutions['5'].length, game.solutions['6'].length,
        game.solutions['7'].length, state, playedLocal,
      ].join(','))
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `escalada-${lang}-2026.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (!authed) {
    return (
      <div className={styles.loginPage}>
        <h1 className={styles.loginTitle}>Admin — L'Escalada</h1>
        <p className={styles.loginWarning}>
          Zona restringida. Aquesta protecció és de frontend i no constitueix seguretat forta.
        </p>
        <div className={styles.loginForm}>
          <input
            type="password"
            placeholder="Contrasenya admin"
            value={password}
            autoFocus
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className={styles.loginInput}
          />
          <button className={styles.loginBtn} onClick={handleLogin}>Entrar</button>
        </div>
        {loginError && <p className={styles.loginError}>{loginError}</p>}
        <a href="#/" className={styles.loginLink}>← Tornar al joc</a>
      </div>
    )
  }

  // ── Detall del dia seleccionat ──
  const selectedGame = getGameForDate(selectedDate)
  const selectedEntry = getCalendarEntryForDate(selectedDate)
  const selectedState = !isInArchiveRange(selectedDate) ? 'fora de rang'
    : selectedDate > today ? 'futur'
    : selectedDate === today ? 'avui'
    : 'passat'
  const selectedPlayed = loadDailyResultForDate(lang, selectedDate)
  const hasLocalOverride = localOverrides[selectedDate] !== undefined

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <h1>Admin — L'Escalada</h1>
        <div className={styles.headerActions}>
          <select value={lang} onChange={e => setLang(e.target.value as Language)} className={styles.select}>
            <option value="ca">Català</option>
            <option value="es">Castellano</option>
          </select>
          <button className={styles.btnSecondary} onClick={exportCalendarJSON} disabled={Object.keys(localOverrides).length === 0}>
            Exportar JSON {Object.keys(localOverrides).length > 0 ? `(${Object.keys(localOverrides).length} canvis)` : ''}
          </button>
          <button className={styles.btnSecondary} onClick={exportCSV}>Exportar CSV</button>
          <button className={styles.btnSecondary} onClick={handleLogout}>Sortir</button>
          <a href="#/" className={styles.btnSecondary}>← Joc</a>
        </div>
      </header>

      {/* ── Avís seguretat ── */}
      <div className={styles.securityNote}>
        Zona d'administrador. La protecció és de frontend (VITE_ADMIN_PASSWORD) — no és seguretat forta. Per a un admin real, cal backend + autenticació de servidor.
      </div>

      {loading && <p className={styles.loading}>Carregant partides i calendari...</p>}
      {loadError && <p className={styles.loadError}>{loadError}</p>}

      {!loading && !loadError && (
        <div className={styles.main}>
          {/* ── Columna esquerra: calendari ── */}
          <div className={styles.calCol}>
            {/* Filtres i cerca */}
            <div className={styles.toolbar}>
              <input
                className={styles.searchInput}
                placeholder="Cerca paraula base..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select className={styles.select} value={filter} onChange={e => setFilter(e.target.value as typeof filter)}>
                <option value="all">Tots els dies</option>
                <option value="past">Passats</option>
                <option value="future">Futurs</option>
                <option value="few-solutions">Poques solucions (&lt;6)</option>
              </select>
            </div>

            {/* Navegació de mes */}
            <div className={styles.monthNav}>
              <button className={styles.monthBtn} onClick={() => setMonthIdx(i => Math.max(0, i - 1))} disabled={monthIdx === 0}>‹</button>
              <span className={styles.monthLabel}>{MONTHS[monthIdx].label}</span>
              <button className={styles.monthBtn} onClick={() => setMonthIdx(i => Math.min(MONTHS.length - 1, i + 1))} disabled={monthIdx === MONTHS.length - 1}>›</button>
            </div>

            {/* Capçalera dies setmana */}
            <div className={styles.weekHeader}>
              {WEEKDAYS.map(d => <span key={d} className={styles.weekDay}>{d}</span>)}
            </div>

            {/* Graella del mes */}
            <CalendarGrid
              monthKey={MONTHS[monthIdx].key}
              calendar={calendarMap}
              games={games}
              localOverrides={localOverrides}
              selectedDate={selectedDate}
              today={today}
              filteredDates={new Set(filteredDates)}
              onSelectDate={setSelectedDate}
            />

            <p className={styles.calStats}>
              {calendar.length} dies al calendari · {Object.keys(localOverrides).length} canvis locals
            </p>
          </div>

          {/* ── Columna dreta: detall ── */}
          <div className={styles.detailCol}>
            {selectedEntry ? (
              <>
                <div className={styles.detailHeader}>
                  <h2>{formatDateDisplay(new Date(selectedDate + 'T12:00:00Z'))}</h2>
                  <span className={`${styles.stateBadge} ${styles['stateBadge_' + selectedState.replace(' ', '_')]}`}>
                    {selectedState}
                  </span>
                  {hasLocalOverride && <span className={styles.overrideBadge}>Override local</span>}
                </div>

                {selectedGame ? (
                  <div className={styles.gameCard}>
                    <div className={styles.gameCardRow}>
                      <span className={styles.fieldLabel}>Índex</span>
                      <span>{localOverrides[selectedDate] ?? selectedEntry.gameIndex} / {games.length - 1}</span>
                    </div>
                    <div className={styles.gameCardRow}>
                      <span className={styles.fieldLabel}>Paraula base</span>
                      <span className={styles.baseWord}>{selectedGame.baseWord.toUpperCase()}</span>
                    </div>
                    <div className={styles.gameCardRow}>
                      <span className={styles.fieldLabel}>Lletres</span>
                      <div className={styles.tiles}>
                        {selectedGame.baseLetters.map((l, i) => (
                          <span key={i} className={styles.tile}>{l.toUpperCase()}</span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.solGrid}>
                      {[3, 4, 5, 6, 7].map(len => {
                        const sols = selectedGame.solutions[String(len) as keyof typeof selectedGame.solutions] ?? []
                        return (
                          <div key={len} className={styles.solRow}>
                            <span className={`${styles.solLen} ${sols.length < 3 ? styles.solLenWarn : ''}`}>{len} ({sols.length})</span>
                            <span className={styles.solWords}>{sols.slice(0, 4).join(', ')}{sols.length > 4 ? ` +${sols.length - 4}` : ''}</span>
                          </div>
                        )
                      })}
                    </div>

                    {selectedPlayed && (
                      <div className={styles.playedInfo}>
                        Jugat localment: {selectedPlayed.score}/5
                        <button
                          className={styles.btnDanger}
                          onClick={() => { resetDailyForDate(lang, selectedDate); alert('Reset local fet.') }}
                        >
                          Reset local
                        </button>
                      </div>
                    )}

                    {/* Alternatives (Fase A) */}
                    <div className={styles.altSection}>
                      {altDate === selectedDate ? (
                        <>
                          <p className={styles.altNote}>
                            Alternatives per a {formatDateDisplay(new Date(selectedDate + 'T12:00:00Z'))}.
                            "Aplicar localment" és una previsualització al teu navegador — no afecta altres usuaris.
                            Per publicar el canvi, exporta el JSON i fes deploy.
                          </p>
                          {alternatives.length === 0 ? (
                            <p className={styles.altEmpty}>No s'han trobat alternatives.</p>
                          ) : (
                            alternatives.map(({ idx, game }) => (
                              <div key={idx} className={styles.altCard}>
                                <div className={styles.altCardHeader}>
                                  <span className={styles.altBaseWord}>{game.baseWord.toUpperCase()}</span>
                                  <span className={styles.altIdx}>#{idx}</span>
                                </div>
                                <div className={styles.altSols}>
                                  {[3, 4, 5, 6, 7].map(l => {
                                    const n = (game.solutions[String(l) as keyof typeof game.solutions] ?? []).length
                                    return <span key={l} className={n < 3 ? styles.altSolWarn : styles.altSolOk}>{l}:{n}</span>
                                  })}
                                </div>
                                <button className={styles.btnApply} onClick={() => applyLocalOverride(selectedDate, idx)}>
                                  Aplicar localment
                                </button>
                              </div>
                            ))
                          )}
                          <button className={styles.btnSecondary} onClick={() => setAltDate(null)}>Cancel·lar</button>
                        </>
                      ) : (
                        <button className={styles.btnAlt} onClick={() => setAltDate(selectedDate)}>
                          Buscar alternativa per aquest dia
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className={styles.noGame}>No hi ha partida per aquesta data.</p>
                )}
              </>
            ) : (
              <p className={styles.noGame}>Selecciona un dia del calendari.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Subcomponent: graella mensual ──
interface CalendarGridProps {
  monthKey: string
  calendar: Map<string, CalendarEntry>
  games: GameEntry[]
  localOverrides: Record<string, number>
  selectedDate: string
  today: string
  filteredDates: Set<string>
  onSelectDate: (d: string) => void
}

function CalendarGrid({ monthKey, calendar, games, localOverrides, selectedDate, today, filteredDates, onSelectDate }: CalendarGridProps) {
  const days = getMonthDays(monthKey)
  const firstDay = getFirstDayOfWeek(monthKey)
  const cells: Array<string | null> = [...Array(firstDay).fill(null), ...days]

  return (
    <div className={styles.calGrid}>
      {cells.map((dateKey, i) => {
        if (!dateKey) return <div key={`empty-${i}`} className={styles.calEmpty} />
        const entry = calendar.get(dateKey)
        const inRange = isInArchiveRange(dateKey)
        const override = localOverrides[dateKey]
        const gameIdx = override !== undefined ? override : entry?.gameIndex
        const game = gameIdx !== undefined ? games[gameIdx] : null
        const isToday = dateKey === today
        const isFuture = dateKey > today
        const isPast = dateKey < today
        const isDimmed = filteredDates.size > 0 && !filteredDates.has(dateKey)
        const isSelected = dateKey === selectedDate

        return (
          <button
            key={dateKey}
            className={[
              styles.calCell,
              isSelected ? styles.calCellSelected : '',
              isToday ? styles.calCellToday : '',
              isFuture ? styles.calCellFuture : '',
              isPast ? styles.calCellPast : '',
              !inRange ? styles.calCellOut : '',
              isDimmed ? styles.calCellDimmed : '',
              override !== undefined ? styles.calCellOverride : '',
            ].filter(Boolean).join(' ')}
            onClick={() => inRange && onSelectDate(dateKey)}
            disabled={!inRange}
          >
            <span className={styles.calDay}>{parseInt(dateKey.slice(8))}</span>
            {game && <span className={styles.calWord}>{game.baseWord.slice(0, 4).toUpperCase()}</span>}
          </button>
        )
      })}
    </div>
  )
}
