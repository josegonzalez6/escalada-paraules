import type { Language, Stats } from '../types'

const KEY = (lang: string) => `escalada-stats-${lang}`

function migrate(raw: Record<string, unknown>): Stats {
  return {
    played: Number(raw.played ?? 0),
    perfect: Number(raw.perfect ?? raw.won ?? 0),
    bestTime: raw.bestTime != null ? Number(raw.bestTime) : null,
    avgTime: raw.avgTime != null ? Number(raw.avgTime) : null,
    currentStreak: Number(raw.currentStreak ?? 0),
    bestStreak: Number(raw.bestStreak ?? 0),
  }
}

export function loadStats(lang: Language): Stats {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY(lang)) ?? '{}')
    return migrate(raw)
  } catch {
    return { played: 0, perfect: 0, bestTime: null, avgTime: null, currentStreak: 0, bestStreak: 0 }
  }
}

export function saveResult(lang: Language, score: number, timeUsed: number): Stats {
  const s = loadStats(lang)
  const rawKey = KEY(lang)
  let totalPerfectTime = 0
  try {
    const raw = JSON.parse(localStorage.getItem(rawKey) ?? '{}')
    totalPerfectTime = Number(raw._totalPerfectTime ?? 0)
  } catch { /* */ }

  s.played += 1
  if (score === 5) {
    s.perfect += 1
    totalPerfectTime += timeUsed
    if (s.bestTime === null || timeUsed < s.bestTime) s.bestTime = timeUsed
    s.avgTime = Math.round(totalPerfectTime / s.perfect)
    s.currentStreak += 1
    if (s.currentStreak > s.bestStreak) s.bestStreak = s.currentStreak
  } else {
    s.currentStreak = 0
  }
  localStorage.setItem(rawKey, JSON.stringify({ ...s, _totalPerfectTime: totalPerfectTime }))
  return s
}
