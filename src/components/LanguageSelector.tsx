import type { Language } from '../types'
import styles from './LanguageSelector.module.css'

interface Props {
  onSelect: (lang: Language) => void
}

export function LanguageSelector({ onSelect }: Props) {
  return (
    <div className={styles.container}>
      <button className={styles.btn} onClick={() => onSelect('ca')}>
        🇦🇩 Català
      </button>
      <button className={styles.btn} onClick={() => onSelect('es')}>
        🇪🇸 Castellà
      </button>
    </div>
  )
}
