#!/usr/bin/env node
/**
 * checkCalendar.mjs
 * Valida el calendari generat contra les partides.
 * Ús: node scripts/checkCalendar.mjs ca|es [--audit]
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const lang = process.argv[2] ?? 'ca'
const audit = process.argv.includes('--audit')

const ARCHIVE_START = '2026-06-01'
const ARCHIVE_END = '2026-12-31'

function getArchiveDateRange() {
  const dates = []
  const cur = new Date(ARCHIVE_START + 'T12:00:00Z')
  const end = new Date(ARCHIVE_END + 'T12:00:00Z')
  while (cur <= end) {
    const y = cur.getUTCFullYear()
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0')
    const d = String(cur.getUTCDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

function normalize(word) {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀́̂̆̈]/g, '')
    .normalize('NFC')
    .replace(/[^a-zçñ·]/g, '')
}

// Detecta si dues paraules base són massa similars
// (comparteixen 5+ caràcters de prefix o distància d'edició ≤ 3)
function areTooSimilar(baseA, baseB) {
  const a = normalize(baseA)
  const b = normalize(baseB)
  // Prefix comú llarg
  let prefix = 0
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++
  if (prefix >= 5) return true
  // Edició ≤ 3 (només per paraules curtes o molt similars)
  if (Math.abs(a.length - b.length) > 3) return false
  // Levenshtein simplificat
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n] <= 3
}

const calPath = path.join(__dirname, `../public/generated/${lang}-calendar-2026.json`)
const gamesPath = path.join(__dirname, `../public/generated/${lang}-games.json`)

if (!fs.existsSync(calPath)) { console.error(`❌ No existeix: ${calPath}`); process.exit(1) }
if (!fs.existsSync(gamesPath)) { console.error(`❌ No existeix: ${gamesPath}`); process.exit(1) }

console.log(`\n🔍 Auditoria del calendari [${lang}]...`)

const calendar = JSON.parse(fs.readFileSync(calPath, 'utf8'))
const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'))
const expectedDates = getArchiveDateRange()

let errors = 0
let warnings = 0

// 1. Nombre d'entrades
if (calendar.length !== expectedDates.length) {
  console.error(`❌ S'esperaven ${expectedDates.length} entrades, hi ha ${calendar.length}`)
  errors++
}

// 2. Dates duplicades
const seenDates = new Set()
for (const entry of calendar) {
  if (seenDates.has(entry.dateKey)) {
    console.error(`❌ Data duplicada: ${entry.dateKey}`)
    errors++
  }
  seenDates.add(entry.dateKey)
}

// 3. Totes les dates esperades hi són
for (const d of expectedDates) {
  if (!seenDates.has(d)) {
    console.error(`❌ Falta la data: ${d}`)
    errors++
  }
}

// 4. Format, ordre cronològic, gameIndex i baseWord
for (let i = 0; i < calendar.length; i++) {
  const entry = calendar[i]

  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.dateKey)) {
    console.error(`❌ Format incorrecte: ${entry.dateKey}`)
    errors++
  }

  if (i > 0 && entry.dateKey <= calendar[i - 1].dateKey) {
    console.error(`❌ Ordre incorrecte: ${calendar[i - 1].dateKey} → ${entry.dateKey}`)
    errors++
  }

  if (entry.gameIndex < 0 || entry.gameIndex >= games.length) {
    console.error(`❌ gameIndex ${entry.gameIndex} fora de rang per ${entry.dateKey} (max: ${games.length - 1})`)
    errors++
  } else {
    const expectedBase = games[entry.gameIndex].baseWord
    if (entry.baseWord !== expectedBase) {
      console.error(`❌ ${entry.dateKey}: baseWord esperat "${expectedBase}", trobat "${entry.baseWord}"`)
      errors++
    }
  }
}

// 5. Paraules base repetides al calendari
const seenBases = new Map()
for (const entry of calendar) {
  if (seenBases.has(entry.baseWord)) {
    console.warn(`⚠️  BaseWord repetida: "${entry.baseWord}" apareix el ${seenBases.get(entry.baseWord)} i el ${entry.dateKey}`)
    warnings++
  } else {
    seenBases.set(entry.baseWord, entry.dateKey)
  }
}

// 6. Paraules base massa similars en dies consecutius
let similarCount = 0
for (let i = 1; i < calendar.length; i++) {
  if (areTooSimilar(calendar[i - 1].baseWord, calendar[i].baseWord)) {
    console.warn(`⚠️  Paraules massa similars: ${calendar[i - 1].dateKey} "${calendar[i - 1].baseWord}" → ${calendar[i].dateKey} "${calendar[i].baseWord}"`)
    similarCount++
    warnings++
  }
}

// 7. Audit: mostra els primers 30 dies
if (audit) {
  console.log('\n📋 Primers 30 dies del calendari:')
  for (let i = 0; i < Math.min(30, calendar.length); i++) {
    const e = calendar[i]
    console.log(`   ${e.dateKey}  idx=${String(e.gameIndex).padStart(3)}  ${e.baseWord}`)
  }
}

console.log(`\n   Entrades comprovades: ${calendar.length}`)
console.log(`   Partides disponibles: ${games.length}`)
console.log(`   Paraules base úniques: ${seenBases.size}`)
console.log(`   Parells consecutius similars: ${similarCount}`)

if (errors === 0 && warnings === 0) {
  console.log(`   ✅ Calendari [${lang}] vàlid i de bona qualitat! ${calendar.length} entrades correctes.\n`)
} else if (errors === 0) {
  console.log(`   ⚠️  Calendari [${lang}] vàlid però amb ${warnings} advertències.\n`)
} else {
  console.error(`\n   ❌ ${errors} errors trobats!\n`)
  process.exit(1)
}
