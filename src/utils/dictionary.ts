import type { Language, GameEntry, DictionaryIndex } from '../types'
import { normalizeWord } from './normalize'
import { normalizeForLookup } from './normalize'

const dictCache: Partial<Record<Language, DictionaryIndex>> = {}
const gamesCache: Partial<Record<Language, GameEntry[]>> = {}

export async function loadDictionary(lang: Language): Promise<DictionaryIndex> {
  if (dictCache[lang]) return dictCache[lang]!

  const res = await fetch(`/dictionaries/${lang}.txt`)
  if (!res.ok) throw new Error(`Cannot load dictionary for ${lang}`)
  const text = await res.text()

  const lookupMap = new Map<string, string[]>()
  const originalSet = new Set<string>()

  for (const line of text.split('\n')) {
    const original = line.trim()
    if (!original) continue
    const norm = normalizeForLookup(original)
    if (norm.length < 3 || norm.length > 14) continue
    originalSet.add(original)
    if (!lookupMap.has(norm)) lookupMap.set(norm, [])
    lookupMap.get(norm)!.push(original)
  }

  const index: DictionaryIndex = { lookupMap, originalSet }
  dictCache[lang] = index
  return index
}

function isValidEntry(entry: GameEntry): boolean {
  const norm = normalizeWord(entry.baseWord)
  if (norm.length < 8 || norm.length > 14) return false
  // baseLetters ha de coincidir amb baseWord
  const fromWord = norm.split('').sort().join('')
  const fromLetters = entry.baseLetters.map(l => normalizeWord(l)).sort().join('')
  if (fromWord !== fromLetters) return false
  // totes les longituds 3-7 han de tenir solucions
  for (const len of ['3', '4', '5', '6', '7'] as const) {
    if (!entry.solutions[len] || entry.solutions[len].length === 0) return false
  }
  return true
}

export async function loadGames(lang: Language): Promise<GameEntry[]> {
  if (gamesCache[lang]) return gamesCache[lang]!

  const res = await fetch(`/generated/${lang}-games.json`)
  if (!res.ok) throw new Error(`Cannot load games for ${lang}. Run: npm run generate:games`)
  const data: GameEntry[] = await res.json()
  const valid = data.filter(isValidEntry)
  if (valid.length === 0) throw new Error(`No valid games found for ${lang}. Regenerate with: npm run generate:games`)
  gamesCache[lang] = valid
  return valid
}

export function pickRandomGame(games: GameEntry[]): GameEntry {
  return games[Math.floor(Math.random() * games.length)]
}
