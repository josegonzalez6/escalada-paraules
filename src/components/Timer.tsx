import styles from './Timer.module.css'

interface Props {
  seconds: number
  total: number
}

export function Timer({ seconds, total }: Props) {
  const pct = (seconds / total) * 100
  const urgent = seconds <= 10
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.bar} ${urgent ? styles.urgent : ''}`}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
      <span className={`${styles.label} ${urgent ? styles.urgentLabel : ''}`}>
        {seconds}s
      </span>
    </div>
  )
}
