import { useState, useEffect } from 'react'
import { Game } from './components/Game'
import type { Language } from './types'
import { loadLangPref, saveLangPref } from './utils/langPrefs'
import { getMadridDateStr } from './utils/daily'
import styles from './App.module.css'

const DEV_MODE = false

export default function App() {
  const [lang, setLang] = useState<Language>(loadLangPref)
  const [mode, setMode] = useState<'daily' | 'random'>('daily')
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
    setMode('daily')
  }

  return (
    <div className={styles.appShell}>
      <Game
        lang={lang}
        mode={mode}
        todayKey={todayKey}
        devMode={DEV_MODE}
        onChangeLang={handleChangeLang}
        onSetMode={setMode}
      />
    </div>
  )
}
