import { useState } from 'react'
import type { Language } from '../types'
import { normalize } from '../utils/normalize'
import styles from './DevMode.module.css'

interface Props {
  ladder: string[] | null
  ladderCount: number
  dictionary: Set<string>
  lang: Language
  onRegenerate: () => void
}

export function DevMode({ ladder, ladderCount, dictionary, lang, onRegenerate }: Props) {
  const [testWord, setTestWord] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)

  function handleTest() {
    const n = normalize(testWord)
    const found = dictionary.has(n)
    setTestResult(found ? `✅ "${n}" al diccionari (${lang})` : `❌ "${n}" no trobat (${lang})`)
  }

  return (
    <div className={styles.panel}>
      <p className={styles.label}>🛠 DEV MODE</p>
      <p className={styles.info}>Escales carregades: <strong>{ladderCount}</strong></p>
      {ladder && (
        <div className={styles.solution}>
          <p className={styles.label}>Solució actual:</p>
          {ladder.map((w, i) => <span key={i} className={styles.word}>{w.toUpperCase()}</span>)}
        </div>
      )}
      <div className={styles.testRow}>
        <input
          className={styles.testInput}
          value={testWord}
          onChange={e => setTestWord(e.target.value)}
          placeholder="Prova paraula..."
        />
        <button className={styles.testBtn} onClick={handleTest}>Test</button>
      </div>
      {testResult && <p className={styles.testResult}>{testResult}</p>}
      <button className={styles.regenBtn} onClick={onRegenerate}>🔄 Regenerar partida</button>
    </div>
  )
}
