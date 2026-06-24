import styles from './BaseWordDisplay.module.css'

interface Props {
  baseWord: string
  letters: string[]
}

export function BaseWordDisplay({ baseWord, letters }: Props) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.baseLabel}>Paraula base</p>
      <p className={styles.baseWord}>{baseWord.toUpperCase()}</p>
      <p className={styles.tilesLabel}>Lletres disponibles</p>
      <div className={styles.tiles}>
        {letters.map((l, i) => (
          <div key={i} className={styles.tile}>{l.toUpperCase()}</div>
        ))}
      </div>
    </div>
  )
}
