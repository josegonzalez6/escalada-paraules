import type { Language } from './types'

const translations = {
  ca: {
    // Header
    dailyTitle: "Escalada del dia",
    randomTitle: "Partida aleatòria",
    randomSubtitle: "Mode pràctica",
    switchToRandom: "🎲 Practicar",
    switchToDaily: "📅 Escalada del dia",
    langLabel: "Idioma",
    langCA: "Català",
    langES: "Castellano",
    helpAriaLabel: "Instruccions",

    // Game board
    availableLetters: "Lletres disponibles",
    validate: "Validar",
    hint: "Forma paraules de 3, 4, 5, 6 i 7 lletres.",
    loading: "Carregant...",
    errorLoading: "Error en carregar les dades.",
    newRandomGame: "🔄 Nova partida aleatòria",
    backToDaily: "📅 Tornar a l'Escalada del dia",

    // Result screen
    complete: "Escalada completada! 🎉",
    incomplete: "Escalada incompleta",
    timeLabel: "Temps:",
    solutionTitle: "Solucions:",
    userWordsTitle: "Les teves paraules:",
    share: "📤 Compartir resultat",
    copied: "✅ Resultat copiat!",
    alreadyPlayedMsg: "Ja has jugat l'Escalada del dia.",
    nextIn: "Propera escalada en",
    statPlayed: "Jugades",
    statPerfect: "5/5",
    statPct: "Encert",
    statBest: "Millor",
    statAvg: "Mitjana",
    statStreak: "Ratxa",
    statBestStreak: "Millor ratxa",

    // Arxiu
    archiveBtn: "Arxiu",
    archiveTitle: "Arxiu d'Escalades",
    archiveLocked: "Bloquejada",
    archiveAvailable: "Disponible",
    archivePlayed: "Jugada",
    archiveLockedMsg: "Aquesta escalada encara no està disponible",
    archiveDailyTitle: (date: string) => `Escalada del ${date}`,
    resetToday: "Reiniciar escalada d'avui",
    resetDate: "Reiniciar aquesta data",
    backToGame: "← Tornar al joc",

    // Share text (built in buildShareText)
    shareHeader: "L'Escalada CAT",
    sharePerfect: (time: string) => `He completat l'escala en ${time}. A veure quant tardes tu:`,
    sharePartial: (score: number, time: string) => `He fet ${score}/5 en ${time}. A veure quant tardes tu:`,
    shareURL: "https://escalada-paraules.vercel.app/",
  },
  es: {
    // Header
    dailyTitle: "Escalera del día",
    randomTitle: "Partida aleatoria",
    randomSubtitle: "Modo práctica",
    switchToRandom: "🎲 Practicar",
    switchToDaily: "📅 Escalera del día",
    langLabel: "Idioma",
    langCA: "Català",
    langES: "Castellano",
    helpAriaLabel: "Instrucciones",

    // Game board
    availableLetters: "Letras disponibles",
    validate: "Validar",
    hint: "Forma palabras de 3, 4, 5, 6 y 7 letras.",
    loading: "Cargando...",
    errorLoading: "Error al cargar los datos.",
    newRandomGame: "🔄 Nueva partida aleatoria",
    backToDaily: "📅 Volver a la Escalera del día",

    // Result screen
    complete: "¡Escalera completada! 🎉",
    incomplete: "Escalera incompleta",
    timeLabel: "Tiempo:",
    solutionTitle: "Soluciones:",
    userWordsTitle: "Tus palabras:",
    share: "📤 Compartir resultado",
    copied: "✅ ¡Resultado copiado!",
    alreadyPlayedMsg: "Ya has jugado la Escalera del día.",
    nextIn: "Siguiente escalera en",
    statPlayed: "Jugadas",
    statPerfect: "5/5",
    statPct: "Acierto",
    statBest: "Mejor",
    statAvg: "Media",
    statStreak: "Racha",
    statBestStreak: "Mejor racha",

    // Arxiu
    archiveBtn: "Archivo",
    archiveTitle: "Archivo de Escaleras",
    archiveLocked: "Bloqueada",
    archiveAvailable: "Disponible",
    archivePlayed: "Jugada",
    archiveLockedMsg: "Esta escalera todavía no está disponible",
    archiveDailyTitle: (date: string) => `Escalera del ${date}`,
    resetToday: "Reiniciar escalera de hoy",
    resetDate: "Reiniciar esta fecha",
    backToGame: "← Volver al juego",

    // Share text
    shareHeader: "La Escalera ES",
    sharePerfect: (time: string) => `He completado la escalera en ${time}. A ver cuánto tardas tú:`,
    sharePartial: (score: number, time: string) => `He hecho ${score}/5 en ${time}. A ver cuánto tardas tú:`,
    shareURL: "https://escalada-paraules.vercel.app/",
  },
}

export type Translations = typeof translations['ca']

export function useT(lang: Language): Translations {
  return translations[lang]
}
