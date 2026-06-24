// Normalitza una paraula per a comparació: minúscules, sense accents
// El joc accepta entrada sense accents i normalitza internament
export function normalize(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/·/g, 'l') // l·l -> ll
    .replace(/[^a-z]/g, '')
}

export function letterCounts(word: string): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const c of word) {
    counts[c] = (counts[c] || 0) + 1
  }
  return counts
}

// Comprova si `next` conté totes les lletres de `prev` i n'afegeix exactament 1
export function canFollow(prev: string, next: string): boolean {
  if (next.length !== prev.length + 1) return false
  const cp = letterCounts(prev)
  const cn = letterCounts(next)
  let extra = 0
  for (const [c, n] of Object.entries(cn)) {
    const diff = n - (cp[c] ?? 0)
    if (diff < 0) return false
    extra += diff
  }
  return extra === 1
}
