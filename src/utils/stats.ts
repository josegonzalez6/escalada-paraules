import type { Stats, Language } from '../types'

function key(lang: Language) { return `escalada_stats_${lang}` }

const defaultStats: Stats = {
  played: 0,
  perfect: 0,
  bestTime: null,
  currentStreak: 0,
  bestStreak: 0,
}

export function loadStats(lang: Language): Stats {
  try {
    const raw = localStorage.getItem(key(lang))
    if (!raw) return { ...defaultStats }
    // Migra stats antigues que tenien 'won' en lloc de 'perfect'
    const parsed = JSON.parse(raw) as Record<string, unknown>
    return {
      played: (parsed.played as number) ?? 0,
      perfect: (parsed.perfect as number) ?? (parsed.won as number) ?? 0,
      bestTime: (parsed.bestTime as number | null) ?? null,
      currentStreak: (parsed.currentStreak as number) ?? 0,
      bestStreak: (parsed.bestStreak as number) ?? 0,
    }
  } catch {
    return { ...defaultStats }
  }
}

export function saveResult(lang: Language, score: number, timeUsed: number): Stats {
  const stats = loadStats(lang)
  stats.played++
  if (score === 5) {
    stats.perfect++
    stats.currentStreak++
    if (stats.currentStreak > stats.bestStreak) stats.bestStreak = stats.currentStreak
    if (stats.bestTime === null || timeUsed < stats.bestTime) stats.bestTime = timeUsed
  } else {
    stats.currentStreak = 0
  }
  localStorage.setItem(key(lang), JSON.stringify(stats))
  return stats
}
