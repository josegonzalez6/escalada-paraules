import { useState } from 'react'
import { Game } from './components/Game'
import type { Language, GameMode } from './types'
import styles from './App.module.css'

const DEV_MODE = false

const RULES = {
  ca: {
    title: "L'Escalada",
    subtitle: 'Forma paraules de 3 a 7 lletres amb les lletres disponibles.',
    rules: [
      'Pots reordenar les lletres lliurement.',
      "No pots usar una lletra més vegades de les que apareix.",
      'Cada paraula és independent de les altres.',
      'Tens 60 segons.',
      'El joc valida quan prems "Validar" o s\'acaba el temps.',
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
    subtitle: 'Forma palabras de 3 a 7 letras con las letras disponibles.',
    rules: [
      'Puedes reordenar las letras libremente.',
      'No puedes usar una letra más veces de las que aparece.',
      'Cada palabra es independiente de las demás.',
      'Tienes 60 segundos.',
      'El juego valida cuando pulsas "Validar" o se acaba el tiempo.',
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
