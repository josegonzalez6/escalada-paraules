import { useState, useEffect } from 'react'
import { Game } from './components/Game'
import { ArchiveView } from './components/ArchiveView'
import { AdminPage } from './pages/AdminPage'
import type { Language } from './types'
import { loadLangPref, saveLangPref } from './utils/langPrefs'
import { getMadridDateStr } from './utils/daily'
import styles from './App.module.css'

type AppView = 'game' | 'archive'

const DEV_MODE = false

function Router() {
  const hash = window.location.hash
  if (hash === '#/admin') return <div className={styles.appShell}><AdminPage /></div>
  return <AppShell />
}

function AppShell() {
  const [lang, setLang] = useState<Language>(loadLangPref)
  const [view, setView] = useState<AppView>('game')
  const [archiveDateKey, setArchiveDateKey] = useState<string | undefined>(undefined)
  const [todayKey, setTodayKey] = useState(getMadridDateStr())

  useEffect(() => {
    const interval = setInterval(() => {
      const current = getMadridDateStr()
      if (current !== todayKey) setTodayKey(current)
    }, 60_000)
    return () => clearInterval(interval)
  }, [todayKey])

  function handleChangeLang(newLang: Language) {
    saveLangPref(newLang)
    setLang(newLang)
    setView('game')
    setArchiveDateKey(undefined)
  }

  function handleOpenArchive() {
    setView('archive')
  }

  function handlePlayDate(dateKey: string) {
    setArchiveDateKey(dateKey)
    setView('game')
  }

  function handleBackToGame() {
    setView('game')
    setArchiveDateKey(undefined)
  }

  return (
    <div className={styles.appShell}>
      {view === 'archive' ? (
        <ArchiveView
          lang={lang}
          todayKey={todayKey}
          onPlayDate={handlePlayDate}
          onBack={handleBackToGame}
          onChangeLang={handleChangeLang}
        />
      ) : (
        <Game
          lang={lang}
          archiveDateKey={archiveDateKey}
          todayKey={todayKey}
          devMode={DEV_MODE}
          onChangeLang={handleChangeLang}
          onOpenArchive={handleOpenArchive}
          onBackToToday={handleBackToGame}
        />
      )}
    </div>
  )
}

export default function App() {
  return <Router />
}
