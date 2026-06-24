import { useEffect, useRef } from 'react'
import type { Language } from '../types'
import styles from './HowToPlay.module.css'

interface Props {
  lang: Language
  onClose: () => void
}

const CONTENT = {
  ca: {
    title: 'Com es juga?',
    intro: 'Troba una paraula de 3, 4, 5, 6 i 7 lletres utilitzant només les lletres disponibles.',
    rules: [
      'Pots reordenar les lletres lliurement.',
      'Cada paraula és independent.',
      'No pots utilitzar una lletra més vegades de les que apareix.',
      "Les paraules han d'existir al diccionari.",
      'Pots escriure les paraules sense accents.',
      'La ç, la ñ i la l·l no se substitueixen per altres lletres.',
      'No hi ha límit de temps.',
      "Si completes l'escala 5/5, es guardarà el teu temps.",
    ],
    btn: 'Començar',
  },
  es: {
    title: '¿Cómo se juega?',
    intro: 'Encuentra una palabra de 3, 4, 5, 6 y 7 letras utilizando solo las letras disponibles.',
    rules: [
      'Puedes reordenar las letras libremente.',
      'Cada palabra es independiente.',
      'No puedes utilizar una letra más veces de las que aparece.',
      'Las palabras deben existir en el diccionario.',
      'Puedes escribir las palabras sin acentos.',
      'La ç, la ñ y la l·l no se sustituyen por otras letras.',
      'No hay límite de tiempo.',
      'Si completas la escalera 5/5, se guardará tu tiempo.',
    ],
    btn: 'Empezar',
  },
}

export const HELP_SEEN_KEY = 'escalada-help-seen'

export function HowToPlay({ lang, onClose }: Props) {
  const t = CONTENT[lang]
  const overlayRef = useRef<HTMLDivElement>(null)

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose()
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Tancar">✕</button>
        <h2 className={styles.title}>{t.title}</h2>
        <p className={styles.intro}>{t.intro}</p>
        <ul className={styles.rules}>
          {t.rules.map((r, i) => <li key={i}>{r}</li>)}
        </ul>
        <button className={styles.startBtn} onClick={onClose}>{t.btn}</button>
      </div>
    </div>
  )
}
