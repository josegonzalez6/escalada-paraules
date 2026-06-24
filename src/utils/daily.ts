import type { Language, GameEntry, GameMode, DailyResult } from '../types'

export function getMadridDateStr(date?: Date): string {
  const d = date ?? new Date()
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function formatDateDisplay(date?: Date): string {
  const d = date ?? new Date()
  return new Intl.DateTimeFormat('ca-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function getDailyIndex(gamesCount: number, lang: Language, date?: Date): number {
  if (gamesCount === 0) return 0
  const dateStr = getMadridDateStr(date)
  const numeric = parseInt(dateStr.replace(/-/g, ''), 10)
  const langOffset = lang === 'ca' ? 0 : 31337
  return (numeric + langOffset) % gamesCount
}

export function pickDailyGame(games: GameEntry[], lang: Language, date?: Date): GameEntry {
  return games[getDailyIndex(games.length, lang, date)]
}

export function getDailyGameForDate(games: GameEntry[], lang: Language, dateKey: string): GameEntry {
  const date = new Date(dateKey + 'T12:00:00Z')
  return pickDailyGame(games, lang, date)
}

const DAILY_KEY = (lang: Language, dateKey: string) => `escalada-daily-${lang}-${dateKey}`

export function saveDailyResult(result: DailyResult): void {
  localStorage.setItem(DAILY_KEY(result.lang, result.dateKey), JSON.stringify(result))
}

export function loadTodayDailyResult(lang: Language, date?: Date): DailyResult | null {
  const dateKey = getMadridDateStr(date)
  const raw = localStorage.getItem(DAILY_KEY(lang, dateKey))
  if (!raw) return null
  try { return JSON.parse(raw) as DailyResult } catch { return null }
}

export function buildShareText(
  score: number,
  timeUsed: number,
  lang: Language,
  mode: GameMode,
  errors: Set<number>,
  date?: Date
): string {
  const langStr = lang === 'ca' ? 'CAT' : 'ESP'
  const dateStr = formatDateDisplay(date)
  const prefix = mode === 'daily' ? '' : '🎲 '
  const timeStr = score === 5 ? ` · ${formatTime(timeUsed)}` : ''
  const scoreLine = `${score}/5${timeStr}`

  const grid = [3, 4, 5, 6, 7].map(len => {
    const emoji = errors.has(len) ? '🟥' : '🟩'
    return emoji.repeat(len)
  }).join('\n')

  const url = 'https://escalada-paraules.vercel.app/'
  return `${prefix}L'Escalada ${langStr}\n${dateStr}\n${scoreLine}\n\n${grid}\n\n${url}`
}
