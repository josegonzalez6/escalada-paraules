import { useState } from 'react'
import { Game } from './components/Game'
import type { Language, GameMode } from './types'
import styles from './App.module.css'

const DEV_MODE = false

const RULES = {
  ca: {
    title: "L'Escalada",
    subtitle: "Forma una escala de paraules de 3 a 7 lletres usant les lletres d'una paraula base. No hi ha límit de temps, però si completes l'escala es guardarà el teu temps.",
    rules: [
      'Usa les lletres disponibles per formar paraules de 3, 4, 5, 6 i 7 lletres.',
      'Pots reordenar les lletres lliurement.',
      "No pots usar una lletra més vegades de les que apareix.",
      'Cada paraula és independent de les altres.',
      'No hi ha límit de temps — prem «Validar» quan vulguis.',
      "Si completes l'escala (5/5), es guarda el teu temps.",
    ],
    chooseLang: 'Tria idioma',
    chooseMode: 'Tria mode de joc',
    langCA: 'Català',
    langES: 'Castellano',
    daily: '📅 Paraula del dia',
    random: '🎲 Partida aleatòria',
    dailyDesc: 'La mateixa paraula per a tothom avui',
    randomDesc: 'Una partida nova aleatòria',
  },
  es: {
    title: 'La Escalada',
    subtitle: 'Forma una escalera de palabras de 3 a 7 letras usando las letras de una palabra base. Sin límite de tiempo. Si completas la escalera se guardará tu tiempo.',
    rules: [
      'Usa las letras disponibles para formar palabras de 3, 4, 5, 6 y 7 letras.',
      'Puedes reordenar las letras libremente.',
      'No puedes usar una letra más veces de las que aparece.',
      'Cada palabra es independiente de las demás.',
      'Sin límite de tiempo — pulsa «Validar» cuando quieras.',
      'Si completas la escalera (5/5), se guarda tu tiempo.',
    ],
    chooseLang: 'Elige idioma',
    chooseMode: 'Elige modo de juego',
    langCA: 'Català',
    langES: 'Castellano',
    daily: '📅 Palabra del día',
    random: '🎲 Partida aleatoria',
    dailyDesc: 'La misma palabra para todos hoy',
    randomDesc: 'Una nueva partida aleatoria',
  },
}

export default function App() {
  const [lang, setLang] = useState<Language | null>(null)
  const [mode, setMode] = useState<GameMode | null>(null)

  if (lang && mode) {
    return (
      <Game
        lang={lang}
        mode={mode}
        devMode={DEV_MODE}
        onChangeLang={() => { setLang(null); setMode(null) }}
      />
    )
  }

  const t = lang ? RULES[lang] : RULES.ca

  return (
    <div className={styles.splash}>
      <div className={styles.splashInner}>
        <h1 className={styles.title}>{t.title}</h1>
        <p className={styles.subtitle}>{t.subtitle}</p>

        <ul className={styles.rules}>
          {t.rules.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>

        {!lang ? (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>{t.chooseLang}</p>
            <div className={styles.btnGroup}>
              <button className={styles.langBtn} onClick={() => setLang('ca')}>
                🇦🇩 Català
              </button>
              <button className={styles.langBtn} onClick={() => setLang('es')}>
                🇪🇸 Castellano
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>{t.chooseMode}</p>
            <div className={styles.btnGroup}>
              <button className={styles.modeBtn} onClick={() => setMode('daily')}>
                <span className={styles.modeBtnTitle}>{t.daily}</span>
                <span className={styles.modeBtnDesc}>{t.dailyDesc}</span>
              </button>
              <button className={styles.modeBtn} onClick={() => setMode('random')}>
                <span className={styles.modeBtnTitle}>{t.random}</span>
                <span className={styles.modeBtnDesc}>{t.randomDesc}</span>
              </button>
            </div>
            <button className={styles.backBtn} onClick={() => setLang(null)}>← Canviar idioma</button>
          </div>
        )}
      </div>
    </div>
  )
}
