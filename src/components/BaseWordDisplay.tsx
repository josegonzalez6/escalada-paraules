import styles from './BaseWordDisplay.module.css'

interface Props {
  word: string
}

export function BaseWordDisplay({ word }: Props) {
  const letters = word.toUpperCase().split('')
  return (
    <div className={styles.wrapper}>
      <div className={styles.tiles}>
        {letters.map((l, i) => (
          <div key={i} className={styles.tile}>{l}</div>
        ))}
      </div>
    </div>
  )
}
