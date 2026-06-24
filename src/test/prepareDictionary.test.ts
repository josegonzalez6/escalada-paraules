import { describe, it, expect } from 'vitest'

/**
 * Tests de la lògica de prepareDictionary.mjs
 * Repliquen les funcions clau del script per verificar el comportament.
 */

function normalizeForCount(word: string): string {
  return word.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/·/g, 'l')
    .replace(/[^a-z]/g, '')
}

const INVALID_CHARS = /[0-9.\-,;:!?'"()\[\]{}_@#$%^&*+=|\\/<>~`]/

function processToken(raw: string): string | null {
  const withoutFlags = raw.split('/')[0]
  if (INVALID_CHARS.test(withoutFlags)) return null
  const cleaned = withoutFlags.replace(/[^a-zA-ZàèéíïóòúüÀÈÉÍÏÓÒÚÜñÑçÇ·]/g, '').toLowerCase()
  return cleaned || null
}

function isProper(token: string): boolean {
  const beforeFlags = token.split('/')[0]
  return beforeFlags.length > 0 &&
    beforeFlags[0] === beforeFlags[0].toUpperCase() &&
    beforeFlags[0] !== beforeFlags[0].toLowerCase()
}

// Simula el processament d'una línia completa (com fa el script)
function processLine(rawLine: string): string[] {
  const tokens = rawLine.trim().split(/[\s\t]+/).filter(Boolean)
  const results: string[] = []
  for (const token of tokens) {
    if (isProper(token)) continue
    const cleaned = processToken(token)
    if (!cleaned) continue
    const norm = normalizeForCount(cleaned)
    if (norm.length < 3 || norm.length > 14) continue
    results.push(cleaned)
  }
  return results
}

describe('prepareDictionary — processament de tokens', () => {
  it('una línia amb una sola paraula genera un token', () => {
    expect(processLine('caminar')).toEqual(['caminar'])
  })

  it('línia aspell expand (múltiples formes per espai) genera múltiples tokens', () => {
    const line = 'caminar camina camines camini caminem camineu caminen'
    const result = processLine(line)
    expect(result).toContain('caminar')
    expect(result).toContain('camina')
    expect(result).toContain('camines')
    expect(result.length).toBe(7)
  })

  it('tokens amb caràcters invàlids (dígits, punts, guions) es descarten', () => {
    expect(processToken('l\'home')).toBeNull()   // apòstrof
    expect(processToken('cap-i-cua')).toBeNull() // guió
    expect(processToken('sr.')).toBeNull()        // punt
    expect(processToken('2024')).toBeNull()       // dígits
    expect(processToken('mots/FLAGS')).toBe('mots') // flags hunspell → ok
  })

  it('noms propis (comencen per majúscula) es descarten', () => {
    expect(isProper('Barcelona')).toBe(true)
    expect(isProper('Joan')).toBe(true)
    expect(isProper('caminar')).toBe(false)
    expect(isProper('àgil')).toBe(false)
  })

  it('mantén accents i caràcters especials del català', () => {
    expect(processToken('àgil')).toBe('àgil')
    expect(processToken('català')).toBe('català')
    expect(processToken('l·lum')).toBe('l·lum')
    expect(processToken('cançó')).toBe('cançó')
  })

  it('mantén ñ i ç del castellà', () => {
    expect(processToken('mañana')).toBe('mañana')
    expect(processToken('corazón')).toBe('corazón')
    expect(processToken('niño')).toBe('niño')
  })

  it('filtra paraules fora del rang 3-14 lletres (normalitzades)', () => {
    // Longitud normalitzada és sense accents
    const short = processLine('ca') // 2 lletres → descartat
    expect(short).toEqual([])

    const long = processLine('anticonstitucionalisme') // 22 lletres → descartat
    expect(long).toEqual([])

    const ok3 = processLine('mar')
    expect(ok3).toEqual(['mar'])

    const ok14 = processLine('constitucional') // 14 lletres
    expect(ok14).toEqual(['constitucional'])
  })

  it('format hunspell paraula/FLAGS: conserva la paraula, descarta els flags', () => {
    const result = processLine('caminar/ABCDE')
    expect(result).toEqual(['caminar'])
  })

  it('una línia buida no genera cap token', () => {
    expect(processLine('')).toEqual([])
    expect(processLine('   ')).toEqual([])
  })

  it('línia amb mix de vàlids i invàlids processa els vàlids', () => {
    // Típic aspell: "caminant Caminant caminants"
    // "Caminant" és nom propi i es descarta
    const result = processLine('caminant Caminant caminants')
    expect(result).toContain('caminant')
    expect(result).toContain('caminants')
    expect(result).not.toContain('Caminant')
    expect(result.length).toBe(2)
  })
})

describe('prepareDictionary — normalització per comptar lletres', () => {
  it('treu accents per comptar lletres', () => {
    expect(normalizeForCount('català')).toBe('catala')
    expect(normalizeForCount('àgil')).toBe('agil')
    expect(normalizeForCount('niño')).toBe('nino')
  })

  it('l·l: el punt mitjà es converteix en l, consistent amb normalizeWord', () => {
    // '·' → 'l', per tant 'l·l' → 'lll' (3 chars)
    // Comportament consistent amb src/utils/normalize.ts
    expect(normalizeForCount('l·l')).toBe('lll')
    expect(normalizeForCount('col·legi')).toBe('colllegi')
  })

  it('la longitud normalitzada determina el filtre 3-14', () => {
    // 'cançó' normalitzada = 'canco' (5 lletres) → acceptada
    expect(normalizeForCount('cançó').length).toBe(5)
    // 'constitucionalíssim' → molt llarga → hauria de ser >14
    expect(normalizeForCount('anticonstitucionalisme').length).toBeGreaterThan(14)
  })
})
