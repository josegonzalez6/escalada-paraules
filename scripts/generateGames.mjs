// Script Node.js per precomputar partides vàlides des dels diccionaris.
// Executa amb: node scripts/generateGames.mjs
//
// Format de sortida (ca-games.json / es-games.json):
// [{
//   baseWord: "caminants",          <- paraula base de 8-10 lletres (NO és la resposta de 7)
//   baseLetters: ["c","a","m",...], <- lletres disponibles (desordenades)
//   solutions: {
//     "3": ["nas","cam",...],
//     "4": ["cama","cims",...],
//     "5": ["canta",...],
//     "6": ["camins",...],
//     "7": ["cantina",...]
//   }
// }]
//
// La paraula base de 8-10 lletres NO s'inclou automàticament com a solució.
// Totes les solucions han de ser paraules de 3-7 lletres formables amb les
// lletres de la base, sense superar la freqüència de cap lletra.

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const MAX_GAMES = 500
const MAX_SOLUTIONS_PER_LEN = 10
const MIN_BASE_LEN = 8
const MAX_BASE_LEN = 10

function normalize(word) {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/·/g, 'l')
    .replace(/[^a-z]/g, '')
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function loadDict(lang) {
  const path = join(root, 'public', 'dictionaries', `${lang}.txt`)
  const raw = readFileSync(path, 'utf-8')
  const byLen = {}
  for (let i = 3; i <= MAX_BASE_LEN; i++) byLen[i] = new Set()

  for (const line of raw.split('\n')) {
    const w = normalize(line.trim())
    if (w.length >= 3 && w.length <= MAX_BASE_LEN && byLen[w.length]) {
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

  // Candidats a paraula base: paraules de 8-10 lletres
  const baseCandidates = []
  for (let len = MIN_BASE_LEN; len <= MAX_BASE_LEN; len++) {
    if (byLen[len]) baseCandidates.push(...byLen[len])
  }

  for (const baseWord of baseCandidates) {
    if (games.length >= MAX_GAMES) break

    const baseCounts = getLetterCounts(baseWord)
    const solutions = { '3': [], '4': [], '5': [], '6': [], '7': [] }

    for (let len = 3; len <= 7; len++) {
      const key = String(len)
      if (!byLen[len]) continue
      for (const word of byLen[len]) {
        if (solutions[key].length >= MAX_SOLUTIONS_PER_LEN) break
        if (canBeFormedFromBase(word, baseCounts)) {
          solutions[key].push(word)
        }
      }
    }

    const allLengthsCovered = [3, 4, 5, 6, 7].every(
      len => solutions[String(len)].length > 0
    )

    if (allLengthsCovered) {
      // Desordenem les lletres de la base per no revelar la paraula
      const baseLetters = shuffle(baseWord.split(''))
      games.push({ baseWord, baseLetters, solutions })
    }
  }

  return games
}

for (const lang of ['ca', 'es']) {
  console.log(`\nProcessant ${lang}...`)
  try {
    const byLen = loadDict(lang)
    let total = 0
    for (let i = 3; i <= MAX_BASE_LEN; i++) {
      const n = byLen[i]?.size ?? 0
      if (n > 0) console.log(`    ${i} lletres: ${n}`)
      total += n
    }
    console.log(`  Total paraules: ${total}`)

    const games = buildGames(byLen)
    console.log(`  Partides vàlides: ${games.length}`)

    if (games.length === 0) {
      console.log(`  ⚠️  Cap partida generada. Cal un diccionari amb paraules de 8-10 lletres.`)
      console.log(`  ⚠️  Consulta README.md → "Diccionaris complets".`)
    }

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
