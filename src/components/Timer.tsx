import styles from './Timer.module.css'

interface Props {
  seconds: number  // temps elapsed (ascendent)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function Timer({ seconds }: Props) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return (
    <div className={styles.timer}>
      <span className={styles.label}>Temps</span>
      <span className={styles.time}>{pad(mins)}:{pad(secs)}</span>
    </div>
  )
}
