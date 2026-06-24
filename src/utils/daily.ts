import type { Language, GameEntry } from '../types'

// Retorna data a Europe/Madrid en format YYYY-MM-DD
export function getMadridDateStr(date?: Date): string {
  const d = date ?? new Date()
  // 'en-CA' dona format ISO YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

// Retorna data per mostrar a l'usuari (DD/MM/YYYY)
export function formatDateDisplay(date?: Date): string {
  const d = date ?? new Date()
  return new Intl.DateTimeFormat('ca-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

// Índex determinista: mateixa data + idioma = mateixa partida
export function getDailyIndex(gamesCount: number, lang: Language, date?: Date): number {
  if (gamesCount === 0) return 0
  const dateStr = getMadridDateStr(date) // "2026-06-24"
  const numeric = parseInt(dateStr.replace(/-/g, ''), 10) // 20260624
  const langOffset = lang === 'ca' ? 0 : 31337
  return (numeric + langOffset) % gamesCount
}

export function pickDailyGame(games: GameEntry[], lang: Language, date?: Date): GameEntry {
  return games[getDailyIndex(games.length, lang, date)]
}

// Text per compartir (sense revelar paraules)
export function buildShareText(
  score: number,
  timeUsed: number,
  lang: Language,
  mode: import('../types').GameMode,
  date?: Date
): string {
  const langStr = lang === 'ca' ? 'CAT' : 'ESP'
  const dateStr = formatDateDisplay(date)
  const prefix = mode === 'daily' ? '' : '🎲 '
  const scoreLine = score === 5 ? `5/5 · ${timeUsed}s` : `${score}/5`
  return `${prefix}L'Escalada ${langStr}\n${dateStr}\n${scoreLine}`
}
