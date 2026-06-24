#!/usr/bin/env node
/**
 * checkCalendar.mjs
 * Valida el calendari generat contra les partides.
 * Ús: node scripts/checkCalendar.mjs ca|es
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const lang = process.argv[2] ?? 'ca'

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

const calPath = path.join(__dirname, `../public/generated/${lang}-calendar-2026.json`)
const gamesPath = path.join(__dirname, `../public/generated/${lang}-games.json`)

if (!fs.existsSync(calPath)) { console.error(`❌ No existeix: ${calPath}`); process.exit(1) }
if (!fs.existsSync(gamesPath)) { console.error(`❌ No existeix: ${gamesPath}`); process.exit(1) }

console.log(`\n🔍 Auditoria del calendari [${lang}]...`)

const calendar = JSON.parse(fs.readFileSync(calPath, 'utf8'))
const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'))
const expectedDates = getArchiveDateRange()

let errors = 0

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

// 4. Format i ordre cronològic
for (let i = 0; i < calendar.length; i++) {
  const entry = calendar[i]

  // Format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.dateKey)) {
    console.error(`❌ Format incorrecte: ${entry.dateKey}`)
    errors++
  }

  // Ordre cronològic
  if (i > 0 && entry.dateKey <= calendar[i - 1].dateKey) {
    console.error(`❌ Ordre incorrecte: ${calendar[i - 1].dateKey} → ${entry.dateKey}`)
    errors++
  }

  // gameIndex vàlid
  if (entry.gameIndex < 0 || entry.gameIndex >= games.length) {
    console.error(`❌ gameIndex ${entry.gameIndex} fora de rang per ${entry.dateKey} (max: ${games.length - 1})`)
    errors++
  } else {
    // baseWord coincideix
    const expectedBase = games[entry.gameIndex].baseWord
    if (entry.baseWord !== expectedBase) {
      console.error(`❌ ${entry.dateKey}: baseWord esperat "${expectedBase}", trobat "${entry.baseWord}"`)
      errors++
    }
  }
}

console.log(`\n   Entrades comprovades: ${calendar.length}`)
console.log(`   Partides disponibles: ${games.length}`)

if (errors === 0) {
  console.log(`   ✅ Calendari [${lang}] vàlid! ${calendar.length} entrades correctes.\n`)
} else {
  console.error(`\n   ❌ ${errors} errors trobats!\n`)
  process.exit(1)
}
