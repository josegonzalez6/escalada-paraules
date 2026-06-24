import type { Language, GameEntry } from '../types'
import { normalizeWord } from './normalize'

const dictCache: Partial<Record<Language, Set<string>>> = {}
const gamesCache: Partial<Record<Language, GameEntry[]>> = {}

export async function loadDictionary(lang: Language): Promise<Set<string>> {
  if (dictCache[lang]) return dictCache[lang]!

  const res = await fetch(`/dictionaries/${lang}.txt`)
  if (!res.ok) throw new Error(`Cannot load dictionary for ${lang}`)
  const text = await res.text()

  const words = new Set<string>()
  for (const line of text.split('\n')) {
    const w = normalizeWord(line.trim())
    if (w.length >= 3 && w.length <= 7) words.add(w)
  }
  dictCache[lang] = words
  return words
}

export async function loadGames(lang: Language): Promise<GameEntry[]> {
  if (gamesCache[lang]) return gamesCache[lang]!

  const res = await fetch(`/generated/${lang}-games.json`)
  if (!res.ok) throw new Error(`Cannot load games for ${lang}. Run: npm run generate:games`)
  const data: GameEntry[] = await res.json()
  gamesCache[lang] = data
  return data
}

export function pickRandomGame(games: GameEntry[]): GameEntry {
  return games[Math.floor(Math.random() * games.length)]
}
