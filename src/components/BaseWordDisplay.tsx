import styles from './BaseWordDisplay.module.css'

interface Props {
  letters: string[]
  label: string
}

export function BaseWordDisplay({ letters, label }: Props) {
  return (
    <div className={styles.wrapper}>
      <p className={styles.label}>{label}</p>
      <div className={styles.tiles}>
        {letters.map((l, i) => (
          <div key={i} className={styles.tile}>{l.toUpperCase()}</div>
        ))}
      </div>
    </div>
  )
}
