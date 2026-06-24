import type { Language, GameEntry, GameMode, DailyResult } from '../types'
import { useT } from '../i18n'

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

export function getSecondsUntilNextMadridMidnight(now?: Date): number {
  const d = now ?? new Date()
  const todayMadrid = getMadridDateStr(d)

  // Binary search: find exact moment when Madrid date changes (within 1 second)
  let lo = d.getTime()
  let hi = lo + 26 * 3600 * 1000

  while (hi - lo > 1000) {
    const mid = Math.floor((lo + hi) / 2)
    if (getMadridDateStr(new Date(mid)) === todayMadrid) {
      lo = mid
    } else {
      hi = mid
    }
  }

  return Math.max(0, Math.ceil((hi - d.getTime()) / 1000))
}

// localStorage — delega a archive.ts per consistència de claus
// Però manté funcions per compatibilitat de codi existent

export function saveDailyResult(result: DailyResult): void {
  const key = `dailyResult:${result.lang}:${result.dateKey}`
  localStorage.setItem(key, JSON.stringify(result))
}

export function loadTodayDailyResult(lang: Language, date?: Date): DailyResult | null {
  const dateKey = getMadridDateStr(date)
  // Nova clau
  const raw = localStorage.getItem(`dailyResult:${lang}:${dateKey}`)
    ?? localStorage.getItem(`escalada-daily-${lang}-${dateKey}`) // backward compat
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as DailyResult
    if (!parsed.errors) parsed.errors = []
    if (!parsed.validationErrors) parsed.validationErrors = []
    return parsed
  } catch { return null }
}

export function buildShareText(
  score: number,
  timeUsed: number,
  lang: Language,
  _mode: GameMode,
  errors: Set<number>,
  date?: Date
): string {
  const tr = useT(lang)
  const dateStr = formatDateDisplay(date)
  const timeStr = formatTime(timeUsed)
  const scoreLine = `${score}/5 · ${timeStr}`

  const grid = [3, 4, 5, 6, 7].map(len => {
    const emoji = errors.has(len) ? '🟥' : '🟩'
    return emoji.repeat(len)
  }).join('\n')

  const msg = score === 5 ? tr.sharePerfect(timeStr) : tr.sharePartial(score, timeStr)

  return `${tr.shareHeader}\n${dateStr}\n${scoreLine}\n\n${grid}\n\n${msg}\n${tr.shareURL}`
}
