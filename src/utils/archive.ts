import type { Language, CalendarEntry, DailyResult } from '../types'
import { getMadridDateStr } from './daily'

export const ARCHIVE_START = '2026-06-01'
export const ARCHIVE_END = '2026-12-31'

export function getArchiveDateRange(): string[] {
  const dates: string[] = []
  const cur = new Date(ARCHIVE_START + 'T12:00:00Z')
  const end = new Date(ARCHIVE_END + 'T12:00:00Z')
  while (cur <= end) {
    const y = cur.getUTCFullYear()
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0')
    const d = String(cur.getUTCDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

const calendarCache: Partial<Record<Language, CalendarEntry[]>> = {}

export async function loadCalendar(lang: Language): Promise<CalendarEntry[]> {
  if (calendarCache[lang]) return calendarCache[lang]!
  const res = await fetch(`/generated/${lang}-calendar-2026.json`)
  if (!res.ok) throw new Error(`No s'ha pogut carregar el calendari per ${lang}`)
  const data: CalendarEntry[] = await res.json()
  calendarCache[lang] = data
  return data
}

export function getCalendarEntry(calendar: CalendarEntry[], dateKey: string): CalendarEntry | null {
  return calendar.find(e => e.dateKey === dateKey) ?? null
}

export function isDateLocked(dateKey: string, now?: Date): boolean {
  return dateKey > getMadridDateStr(now)
}

// Nova clau de localStorage
export const DAILY_RESULT_KEY = (lang: Language, dateKey: string) =>
  `dailyResult:${lang}:${dateKey}`

// Clau antiga (per migració)
const OLD_DAILY_KEY = (lang: Language, dateKey: string) =>
  `escalada-daily-${lang}-${dateKey}`

export function loadDailyResultForDate(lang: Language, dateKey: string): DailyResult | null {
  // Prova nova clau
  const raw = localStorage.getItem(DAILY_RESULT_KEY(lang, dateKey))
    ?? localStorage.getItem(OLD_DAILY_KEY(lang, dateKey))
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as DailyResult
    if (!parsed.errors) parsed.errors = []
    if (!parsed.validationErrors) parsed.validationErrors = []
    return parsed
  } catch { return null }
}

export function saveDailyResultForDate(result: DailyResult): void {
  localStorage.setItem(DAILY_RESULT_KEY(result.lang, result.dateKey), JSON.stringify(result))
}

export function resetDailyForDate(lang: Language, dateKey: string): void {
  localStorage.removeItem(DAILY_RESULT_KEY(lang, dateKey))
  localStorage.removeItem(OLD_DAILY_KEY(lang, dateKey))
}

export function resetTodayDaily(lang: Language, now?: Date): void {
  resetDailyForDate(lang, getMadridDateStr(now))
}

export type DayState = 'future_locked' | 'available' | 'played_perfect' | 'played_partial' | 'played_zero'

export function getDayState(dateKey: string, lang: Language, now?: Date): DayState {
  if (isDateLocked(dateKey, now)) return 'future_locked'
  const result = loadDailyResultForDate(lang, dateKey)
  if (!result) return 'available'
  if (result.score === 5) return 'played_perfect'
  if (result.score === 0) return 'played_zero'
  return 'played_partial'
}
