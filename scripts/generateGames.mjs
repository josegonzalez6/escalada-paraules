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
  return word.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/·/g, 'l')
    .replace(/[^a-z]/g, '')
}

function getLetterCounts(norm) {
  const counts = {}
  for (const c of norm) counts[c] = (counts[c] ?? 0) + 1
  return counts
}

function canBeFormed(candCounts, baseCounts) {
  for (const [c, n] of Object.entries(candCounts)) {
    if ((baseCounts[c] ?? 0) < n) return false
  }
  return true
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
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

  // Barreja bases per tenir varietat
  shuffle(baseCandidates)

  console.log(`   Bases candidates (${MIN_BASE_LEN}-${MAX_BASE_LEN} lletres): ${baseCandidates.length}`)
  console.log(`\n🔍 Generant partides (màx ${MAX_GAMES})...`)

  const games = []
  let processed = 0
  const total = baseCandidates.length

  for (const base of baseCandidates) {
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
      baseLetters: shuffle(base.original.split('')),
      solutions,
    })
  }

  process.stdout.write('\n')

  if (games.length === 0) {
    console.error('\n❌ No s\'han pogut generar partides. Comprova el diccionari.')
    return
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(games, null, 2), 'utf8')
  console.log(`\n✅ Generades ${games.length} partides → ${outPath}`)
}

const langs = langArg ? [langArg] : ['ca', 'es']
for (const lang of langs) {
  processLang(lang)
}
console.log('\nFet!')
