import { useState } from 'react'
import type { Language, GameEntry, DictionaryIndex } from '../types'
import { normalizeForLookup } from '../utils/normalize'
import styles from './DevMode.module.css'

interface Props {
  game: GameEntry | null
  gameCount: number
  dictionary: DictionaryIndex
  lang: Language
  onRegenerate: () => void
}

export function DevMode({ game, gameCount, dictionary, lang, onRegenerate }: Props) {
  const [testWord, setTestWord] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)

  function handleTest() {
    const n = normalizeForLookup(testWord)
    const found = dictionary.lookupMap.has(n)
    setTestResult(found ? `✅ "${n}" al diccionari (${lang})` : `❌ "${n}" no trobat (${lang})`)
  }

  return (
    <div className={styles.panel}>
      <p className={styles.label}>🛠 DEV MODE</p>
      <p className={styles.info}>Partides carregades: <strong>{gameCount}</strong></p>
      {game && (
        <div className={styles.solution}>
          <p className={styles.label}>
            Paraula base: <span className={styles.word}>{game.baseWord.toUpperCase()}</span>
            {' '}— al diccionari: <strong>{dictionary.lookupMap.has(normalizeForLookup(game.baseWord)) ? '✅' : '❌'}</strong>
          </p>
          {([3, 4, 5, 6, 7] as const).map(len => {
            const sols = game.solutions[String(len) as keyof typeof game.solutions]
            return (
              <div key={len} className={styles.solutionRow}>
                <span className={styles.lenBadge}>{len}</span>
                {sols.slice(0, 3).map((w, i) => (
                  <span key={i} className={styles.word}>{w.toUpperCase()}</span>
                ))}
                {sols.length > 3 && <span className={styles.more}>+{sols.length - 3}</span>}
              </div>
            )
          })}
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
