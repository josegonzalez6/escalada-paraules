import type { Stats, Language } from '../types'

function key(lang: Language) { return `escalada_stats_${lang}` }

const defaultStats: Stats = {
  played: 0,
  won: 0,
  bestTime: null,
  currentStreak: 0,
  bestStreak: 0,
}

export function loadStats(lang: Language): Stats {
  try {
    const raw = localStorage.getItem(key(lang))
    if (!raw) return { ...defaultStats }
    return JSON.parse(raw) as Stats
  } catch {
    return { ...defaultStats }
  }
}

export function saveResult(lang: Language, won: boolean, timeUsed: number): Stats {
  const stats = loadStats(lang)
  stats.played++
  if (won) {
    stats.won++
    stats.currentStreak++
    if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak
    if (stats.bestTime === null || timeUsed < stats.bestTime) stats.bestTime = timeUsed
  } else {
    stats.currentStreak = 0
  }
  localStorage.setItem(key(lang), JSON.stringify(stats))
  return stats
}
