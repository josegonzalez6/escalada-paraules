#!/usr/bin/env node
/**
 * generateGames.mjs
 *
 * Genera partides per al joc "Escalada de Paraules".
 * Cada partida té una paraula base (8-14 lletres) i solucions de 3-7 lletres.
 *
 * Ús:
 *   node scripts/generateGames.mjs [--lang ca|es] [--max-games N] [--max-sol N]
 *
 * Exemples:
 *   node scripts/generateGames.mjs --lang ca --max-games 200 --max-sol 30
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// --- Paràmetres ---
const args = process.argv.slice(2)
function getArg(flag, defaultVal) {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : defaultVal
}

const langArg = getArg('--lang', null)
const MAX_GAMES = parseInt(getArg('--max-games', '500'), 10)
const MAX_SOLUTIONS_PER_LENGTH = parseInt(getArg('--max-sol', '50'), 10)
const MIN_BASE_LEN = 8
const MAX_BASE_LEN = 14
const SOLUTION_LENGTHS = [3, 4, 5, 6, 7]

// --- Normalització ---
function normalize(word) {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀́̂̆̈]/g, '')
    .normalize('NFC')
    .replace(/[^a-zçñ·]/g, '')
}

function getLetterCounts(norm) {
  const counts = {}
  const processed = norm.replace(/l·l/g, '\x01')  // l·l → digraph
  for (const c of processed) counts[c] = (counts[c] ?? 0) + 1
  return counts
}

function canBeFormed(candCounts, baseCounts) {
  for (const [c, n] of Object.entries(candCounts)) {
    if ((baseCounts[c] ?? 0) < n) return false
  }
  return true
}

// Mulberry32 deterministic PRNG — seed com a string
function seededRandom(seed) {
  let h = [...seed].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 0x9e3779b9) >>> 0, 0x12345678)
  return function () {
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12
    h = Math.imul(h, 0x297a2d39); h ^= h >>> 15
    return (h >>> 0) / 0x100000000
  }
}

function shuffle(arr, rng = Math.random) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Heurística per detectar formes verbals evidents (penalitza, no prohibeix)
function looksLikeVerbForm(word, lang) {
  const w = normalize(word)
  if (lang === 'ca') {
    return /(?:àvem|àveu|éssim|éssiu|aríem|aríeu|eríem|eríeu|iríem|iríeu|àssim|àssiu|avessis|essessin|essin|ssin)$/.test(w)
  }
  if (lang === 'es') {
    return /(?:ábamos|aríamos|eríamos|iríamos|aseis|ieseis|aríais|eríais|iríais|ábais|éramos|asteis|arían|erían|irían)$/.test(w)
  }
  return false
}

// Longitud ideal 9-12: ni massa curta ni massa llarga
function baseLengthScore(len) {
  if (len >= 9 && len <= 12) return 1.0
  if (len === 8 || len === 13) return 0.7
  return 0.4  // 14 lletres
}

// Puntuació de qualitat: varietat de lletres, equilibri vocal/consonant, solucions, longitud
function scoreGameQuality(game, lang = 'ca') {
  const norm = normalize(game.baseWord)
  const unique = new Set(norm).size
  const letterVariety = unique / norm.length  // 0..1

  const vowels = 'aeiouàèéíïòóúüáéíóú'
  const vowelCount = [...norm].filter(c => vowels.includes(c)).length
  const vowelRatio = vowelCount / norm.length
  const vowelScore = 1 - Math.abs(vowelRatio - 0.4) * 2  // ideal 0.4, penalitza extrems

  // Penalitza si hi ha ≥3 de la mateixa lletra
  const counts = getLetterCounts(norm)
  const maxRepeat = Math.max(...Object.values(counts))
  const repeatPenalty = maxRepeat >= 4 ? 0.3 : maxRepeat === 3 ? 0.7 : 1.0

  // Solucions per longitud — preferim ≥3 per longitud
  let solScore = 0
  for (const len of SOLUTION_LENGTHS) {
    const n = (game.solutions[String(len)] ?? []).length
    solScore += Math.min(n / 3, 1)  // mínim 3 solucions per nota màxima
  }
  solScore /= SOLUTION_LENGTHS.length  // 0..1

  // Longitud ideal 9-12
  const lenScore = baseLengthScore(norm.length)

  // Penalització lleu per formes verbals evidents
  const verbPenalty = looksLikeVerbForm(game.baseWord, lang) ? 0.6 : 1.0

  const raw = (
    letterVariety * 0.30 +
    Math.max(0, vowelScore) * 0.15 +
    repeatPenalty * 0.15 +
    solScore * 0.25 +
    lenScore * 0.15
  )
  return raw * verbPenalty
}

function loadPreferredWords(lang) {
  const prefPath = path.join(__dirname, `../public/dictionaries/${lang}-preferred.txt`)
  if (!fs.existsSync(prefPath)) return new Set()
  const words = fs.readFileSync(prefPath, 'utf8')
    .split('\n')
    .map(l => l.trim().toLowerCase())
    .filter(l => l && !l.startsWith('#'))
  console.log(`   Paraules preferides [${lang}]: ${words.length}`)
  return new Set(words)
}

function filterGoodGames(games, lang, preferredWords = new Set()) {
  const scored = games.map(g => {
    let s = scoreGameQuality(g, lang)
    // Bonus per paraula preferida (+15%)
    if (preferredWords.has(g.baseWord.toLowerCase())) s = Math.min(1, s * 1.15)
    return { g, s }
  })
  for (const { g, s } of scored) g._quality = s
  return scored.filter(({ s }) => s >= 0.40).map(({ g }) => g)
}

function processLang(lang) {
  const dictPath = path.join(__dirname, `../public/dictionaries/${lang}.txt`)
  const outPath = path.join(__dirname, `../public/generated/${lang}-games.json`)

  console.log(`\n📖 Carregant diccionari: ${dictPath}`)
  if (!fs.existsSync(dictPath)) {
    console.error(`Error: No existeix ${dictPath}`)
    return
  }

  const rawWords = fs.readFileSync(dictPath, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  console.log(`   Paraules al diccionari: ${rawWords.length}`)

  // Precomputa counts normalitzats per a cada paraula
  const wordData = rawWords.map(w => ({
    original: w,
    norm: normalize(w),
    counts: null,
  })).filter(d => d.norm.length >= 3 && d.norm.length <= MAX_BASE_LEN)

  // Filtra per longitud: candidates base (8-14) i solucions (3-7)
  const byLen = {}
  for (const d of wordData) {
    const len = d.norm.length
    if (!byLen[len]) byLen[len] = []
    byLen[len].push(d)
  }

  // Precomputa counts per a les solucions (3-7)
  for (const len of SOLUTION_LENGTHS) {
    for (const d of (byLen[len] ?? [])) {
      d.counts = getLetterCounts(d.norm)
    }
  }

  const baseCandidates = []
  for (let len = MIN_BASE_LEN; len <= MAX_BASE_LEN; len++) {
    for (const d of (byLen[len] ?? [])) {
      d.counts = getLetterCounts(d.norm)
      baseCandidates.push(d)
    }
  }

  // Barreja determinista per tenir varietat consistent
  const rng = seededRandom(`escalada-games-2026-${lang}`)
  const shuffledCandidates = shuffle(baseCandidates, rng)

  console.log(`   Bases candidates (${MIN_BASE_LEN}-${MAX_BASE_LEN} lletres): ${shuffledCandidates.length}`)
  console.log(`\n🔍 Generant partides (màx ${MAX_GAMES})...`)

  const games = []
  let processed = 0
  const total = shuffledCandidates.length

  for (const base of shuffledCandidates) {
    if (games.length >= MAX_GAMES) break
    processed++

    if (processed % 500 === 0 || processed === total) {
      const pct = Math.round((processed / total) * 100)
      process.stdout.write(`\r   Processades: ${processed}/${total} (${pct}%) | Partides: ${games.length}`)
    }

    const solutions = {}
    let allLengthsFound = true

    for (const len of SOLUTION_LENGTHS) {
      const matching = []
      for (const cand of (byLen[len] ?? [])) {
        if (cand.norm === base.norm) continue
        if (canBeFormed(cand.counts, base.counts)) {
          matching.push(cand.original)
          if (matching.length >= MAX_SOLUTIONS_PER_LENGTH) break
        }
      }
      if (matching.length === 0) {
        allLengthsFound = false
        break
      }
      solutions[String(len)] = matching
    }

    if (!allLengthsFound) continue

    games.push({
      baseWord: base.original,
      baseLetters: base.original.split(''),
      solutions,
    })
  }

  process.stdout.write('\n')

  if (games.length === 0) {
    console.error('\n❌ No s\'han pogut generar partides. Comprova el diccionari.')
    return
  }

  // Filtra i puntua per qualitat (amb paraules preferides)
  const preferredWords = loadPreferredWords(lang)
  const goodGames = filterGoodGames(games, lang, preferredWords)
  const preferredSelected = goodGames.filter(g => preferredWords.has(g.baseWord.toLowerCase())).length
  if (preferredSelected > 0) console.log(`   Preferred seleccionades: ${preferredSelected}`)
  const verbLike = goodGames.filter(g => looksLikeVerbForm(g.baseWord, lang)).length
  const highQ = goodGames.filter(g => (g._quality ?? 0) >= 0.65).length
  const midQ = goodGames.filter(g => (g._quality ?? 0) >= 0.50 && (g._quality ?? 0) < 0.65).length
  const lowQ = goodGames.filter(g => (g._quality ?? 0) < 0.50).length
  const avgQ = goodGames.length > 0
    ? (goodGames.reduce((s, g) => s + (g._quality ?? 0), 0) / goodGames.length).toFixed(3)
    : '—'

  console.log(`\n   Filtre qualitat: ${games.length} → ${goodGames.length} partides bones`)
  console.log(`   Alta qualitat (≥0.65): ${highQ} | Mitjana (0.50-0.65): ${midQ} | Baixa (<0.50): ${lowQ}`)
  console.log(`   Forma verbal detectada: ${verbLike} | Qualitat mitjana: ${avgQ}`)

  const finalGames = goodGames.length >= 200 ? goodGames : games
  if (goodGames.length < 200) {
    console.warn(`   ⚠️  Poques partides bones (${goodGames.length}), usant totes (${games.length})`)
  }

  // Neteja la propietat interna _quality abans de guardar
  const output = finalGames.map(({ _quality: _q, ...rest }) => rest)

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8')
  console.log(`✅ Generades ${output.length} partides → ${outPath}`)
}

const langs = langArg ? [langArg] : ['ca', 'es']
for (const lang of langs) {
  processLang(lang)
}
console.log('\nFet!')
