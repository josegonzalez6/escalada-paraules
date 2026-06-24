// Normalitza una paraula per a comparació: minúscules, sense accents.
// El joc accepta entrada sense accents i normalitza internament.
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/·/g, 'l') // l·l -> ll
    .replace(/[^a-z]/g, '')
}

// Normalitza per cerca: elimina accents de vocals però conserva ç, ñ, ·
export function normalizeForLookup(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀́̂̆̈]/g, '')
    .normalize('NFC')
    .replace(/[^a-zçñ·]/g, '')
}

export function getLetterCountsForLookup(normalizedWord: string): Record<string, number> {
  const counts: Record<string, number> = {}
  const processed = normalizedWord.replace(/l·l/g, '\x01')
  for (const c of processed) {
    counts[c] = (counts[c] || 0) + 1
  }
  return counts
}

export function getLetterCounts(word: string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const c of word) {
    counts[c] = (counts[c] || 0) + 1
  }
  return counts
}

// Comprova si candidate es pot formar exclusivament amb les lletres de base,
// sense superar el nombre de vegades que cada lletra apareix a base.
export function canBeFormedFromBase(candidate: string, base: string): boolean {
  const baseCounts = getLetterCounts(base)
  const candCounts = getLetterCounts(candidate)
  for (const [c, n] of Object.entries(candCounts)) {
    if ((baseCounts[c] ?? 0) < n) return false
  }
  return true
}
