// Script Node.js per precomputar partides vàlides des dels diccionaris.
// Executa amb: node scripts/generateGames.mjs
//
// Format de sortida (ca-games.json / es-games.json):
// [{ baseWord, solutions: { "3": [...], "4": [...], "5": [...], "6": [...], "7": [...] } }]
//
// Mecànica: el sistema dona una paraula base de 7 lletres. El jugador
// ha de trobar paraules de 3, 4, 5, 6 i 7 lletres usant ÚNICAMENT les
// lletres de la paraula base (sense superar la freqüència de cada lletra).

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const MAX_GAMES = 500
const MAX_SOLUTIONS_PER_LEN = 10

function normalize(word) {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/·/g, 'l')
    .replace(/[^a-z]/g, '')
}

function loadDict(lang) {
  const path = join(root, 'public', 'dictionaries', `${lang}.txt`)
  const raw = readFileSync(path, 'utf-8')
  const byLen = {}
  for (let i = 3; i <= 7; i++) byLen[i] = new Set()

  for (const line of raw.split('\n')) {
    const w = normalize(line.trim())
    if (w.length >= 3 && w.length <= 7) {
      byLen[w.length].add(w)
    }
  }
  return byLen
}

function getLetterCounts(word) {
  const counts = {}
  for (const c of word) counts[c] = (counts[c] || 0) + 1
  return counts
}

function canBeFormedFromBase(candidate, baseCounts) {
  const candCounts = getLetterCounts(candidate)
  for (const [c, n] of Object.entries(candCounts)) {
    if ((baseCounts[c] || 0) < n) return false
  }
  return true
}

function buildGames(byLen) {
  const games = []
  const bases = [...byLen[7]]

  for (const baseWord of bases) {
    if (games.length >= MAX_GAMES) break

    const baseCounts = getLetterCounts(baseWord)
    const solutions = { '3': [], '4': [], '5': [], '6': [], '7': [] }

    for (let len = 3; len <= 7; len++) {
      const key = String(len)
      for (const word of byLen[len]) {
        if (solutions[key].length >= MAX_SOLUTIONS_PER_LEN) break
        if (canBeFormedFromBase(word, baseCounts)) {
          solutions[key].push(word)
        }
      }
    }

    // La paraula base sempre és una solució vàlida de 7 lletres
    if (!solutions['7'].includes(baseWord)) {
      solutions['7'].unshift(baseWord)
    }

    const allLengthsCovered = [3, 4, 5, 6, 7].every(
      len => solutions[String(len)].length > 0
    )

    if (allLengthsCovered) {
      games.push({ baseWord, solutions })
    }
  }

  return games
}

for (const lang of ['ca', 'es']) {
  console.log(`\nProcessant ${lang}...`)
  try {
    const byLen = loadDict(lang)
    const total = Object.values(byLen).reduce((s, set) => s + set.size, 0)
    console.log(`  Paraules carregades: ${total}`)
    for (let i = 3; i <= 7; i++) {
      console.log(`    ${i} lletres: ${byLen[i].size}`)
    }

    const games = buildGames(byLen)
    console.log(`  Partides vàlides: ${games.length}`)

    const outDir = join(root, 'public', 'generated')
    mkdirSync(outDir, { recursive: true })
    writeFileSync(
      join(outDir, `${lang}-games.json`),
      JSON.stringify(games, null, 2)
    )
    console.log(`  Guardat a public/generated/${lang}-games.json`)
  } catch (e) {
    console.error(`  Error: ${e.message}`)
  }
}
console.log('\nFet!')
