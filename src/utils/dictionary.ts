import type { Language } from '../types'
import { normalize } from './normalize'

const cache: Partial<Record<Language, Set<string>>> = {}
const ladderCache: Partial<Record<Language, string[][]>> = {}

export async function loadDictionary(lang: Language): Promise<Set<string>> {
  if (cache[lang]) return cache[lang]!

  const res = await fetch(`/dictionaries/${lang}.txt`)
  if (!res.ok) throw new Error(`Cannot load dictionary for ${lang}`)
  const text = await res.text()

  const words = new Set<string>()
  for (const line of text.split('\n')) {
    const w = normalize(line.trim())
    if (w.length >= 3 && w.length <= 7) words.add(w)
  }
  cache[lang] = words
  return words
}

export async function loadLadders(lang: Language): Promise<string[][]> {
  if (ladderCache[lang]) return ladderCache[lang]!

  const res = await fetch(`/generated/${lang}-ladders.json`)
  if (!res.ok) throw new Error(`Cannot load ladders for ${lang}`)
  const data: string[][] = await res.json()
  ladderCache[lang] = data
  return data
}

export function pickRandomLadder(ladders: string[][]): string[] {
  return ladders[Math.floor(Math.random() * ladders.length)]
}
