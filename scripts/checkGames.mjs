#!/usr/bin/env node
/**
 * checkGames.mjs
 * Valida les partides generades contra el diccionari.
 * Ús: node scripts/checkGames.mjs ca|es
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const lang = process.argv[2] ?? 'ca'

function normalizeForLookup(w) {
  return w.toLowerCase().normalize('NFD')
    .replace(/[̀́̂̆̈]/g, '')
    .normalize('NFC')
    .replace(/[^a-zçñ·]/g, '')
}

function getLetterCounts(norm) {
  const counts = {}
  const processed = norm.replace(/l·l/g, '\x01')
  for (const c of processed) counts[c] = (counts[c] ?? 0) + 1
  return counts
}

function canBeFormed(candNorm, baseCounts) {
  const cc = getLetterCounts(candNorm)
  for (const [c, n] of Object.entries(cc)) {
    if ((baseCounts[c] ?? 0) < n) return false
  }
  return true
}

const dictPath = path.join(__dirname, `../public/dictionaries/${lang}.txt`)
const gamesPath = path.join(__dirname, `../public/generated/${lang}-games.json`)

if (!fs.existsSync(dictPath)) { console.error(`❌ No existeix: ${dictPath}`); process.exit(1) }
if (!fs.existsSync(gamesPath)) { console.error(`❌ No existeix: ${gamesPath}`); process.exit(1) }

console.log(`\n🔍 Auditoria de partides [${lang}]...`)

const lookupMap = new Map()
for (const line of fs.readFileSync(dictPath, 'utf8').split('\n')) {
  const orig = line.trim().toLowerCase()
  if (!orig) continue
  const norm = normalizeForLookup(orig)
  if (!lookupMap.has(norm)) lookupMap.set(norm, [])
  lookupMap.get(norm).push(orig)
}

const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'))
let errors = 0
let checked = 0

for (const game of games) {
  checked++
  const baseNorm = normalizeForLookup(game.baseWord)
  const baseCounts = getLetterCounts(baseNorm)

  if (!lookupMap.has(baseNorm)) {
    console.error(`❌ [${checked}] baseWord "${game.baseWord}" (norm:"${baseNorm}") NO existeix al diccionari`)
    errors++
  }

  if (baseNorm.length < 8 || baseNorm.length > 14) {
    console.error(`❌ [${checked}] baseWord "${game.baseWord}" té ${baseNorm.length} lletres (hauria de ser 8-14)`)
    errors++
  }

  const fromWord = baseNorm.split('').sort().join('')
  const fromLetters = game.baseLetters.map(l => normalizeForLookup(l)).sort().join('')
  if (fromWord !== fromLetters) {
    console.error(`❌ [${checked}] baseLetters de "${game.baseWord}" no coincideix amb baseWord`)
    errors++
  }

  for (const len of [3, 4, 5, 6, 7]) {
    const sols = game.solutions[String(len)] ?? []
    if (sols.length === 0) {
      console.error(`❌ [${checked}] "${game.baseWord}": cap solució per longitud ${len}`)
      errors++
      continue
    }
    for (const sol of sols) {
      const solNorm = normalizeForLookup(sol)
      if (!lookupMap.has(solNorm)) {
        console.error(`❌ [${checked}] solució "${sol}" (norm:"${solNorm}") NO existeix al diccionari`)
        errors++
      }
      if (!canBeFormed(solNorm, baseCounts)) {
        console.error(`❌ [${checked}] solució "${sol}" no es pot formar des de "${game.baseWord}"`)
        errors++
      }
    }
  }
}

console.log(`\n   Partides comprovades: ${checked}`)
if (errors === 0) {
  console.log(`   ✅ Totes les partides són vàlides!\n`)
} else {
  console.error(`\n   ❌ ${errors} errors trobats!\n`)
  process.exit(1)
}
