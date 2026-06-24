import { useState } from 'react'
import { Game } from './components/Game'
import { LanguageSelector } from './components/LanguageSelector'
import type { Language } from './types'
import styles from './App.module.css'

const DEV_MODE = false

export default function App() {
  const [lang, setLang] = useState<Language | null>(null)

  if (!lang) {
    return (
      <div className={styles.splash}>
        <h1 className={styles.title}>Escalada<br />de Paraules</h1>
        <p className={styles.subtitle}>Construeix una cadena de paraules<br />afegint una lletra a cada pas</p>
        <LanguageSelector onSelect={setLang} />
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <Game lang={lang} onChangeLang={() => setLang(null)} devMode={DEV_MODE} />
    </div>
  )
}
