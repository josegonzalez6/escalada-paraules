#!/usr/bin/env node
/**
 * generateCalendar.mjs
 *
 * Genera el calendari estable de partides per al 2026.
 * Cada data del 2026-06-01 al 2026-12-31 té una partida assignada
 * de manera determinista (no canvia si el JSON de games no canvia d'ordre).
 *
 * Ús:
 *   node scripts/generateCalendar.mjs [--lang ca|es|all]
 *
 * IMPORTANT: Si el fitxer {lang}-games.json canvia d'ordre, els índexs del
 * calendari canviaran. No reordeneu games.json un cop el calendari està publicat.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const args = process.argv.slice(2)
function getArg(flag, defaultVal) {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : defaultVal
}

const langArg = getArg('--lang', 'all')

const ARCHIVE_START = '2026-06-01'
const ARCHIVE_END = '2026-12-31'

function getArchiveDateRange() {
  const dates = []
  const start = new Date(ARCHIVE_START + 'T12:00:00Z')
  const end = new Date(ARCHIVE_END + 'T12:00:00Z')
  const cur = new Date(start)
  while (cur <= end) {
    const y = cur.getUTCFullYear()
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0')
    const d = String(cur.getUTCDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return dates
}

function getGameIndexForDate(dateKey, gamesCount, lang) {
  const numeric = parseInt(dateKey.replace(/-/g, ''), 10)
  const langOffset = lang === 'ca' ? 0 : 31337
  return (numeric + langOffset) % gamesCount
}

function processLang(lang) {
  const gamesPath = path.join(__dirname, `../public/generated/${lang}-games.json`)
  const outPath = path.join(__dirname, `../public/generated/${lang}-calendar-2026.json`)

  if (!fs.existsSync(gamesPath)) {
    console.error(`❌ No existeix: ${gamesPath}`)
    console.error(`   Executa primer: npm run generate:games`)
    process.exit(1)
  }

  const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'))
  const dates = getArchiveDateRange()

  console.log(`\n📅 Generant calendari [${lang}]...`)
  console.log(`   Partides disponibles: ${games.length}`)
  console.log(`   Dates a cobrir: ${dates.length} (${ARCHIVE_START} → ${ARCHIVE_END})`)

  const calendar = dates.map(dateKey => {
    const gameIndex = getGameIndexForDate(dateKey, games.length, lang)
    const game = games[gameIndex]
    return {
      dateKey,
      gameIndex,
      baseWord: game.baseWord,
    }
  })

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(calendar, null, 2), 'utf8')

  console.log(`   ✅ Generades ${calendar.length} entrades → ${outPath}`)
  console.log(`   Primera: ${calendar[0].dateKey} → ${calendar[0].baseWord} (idx ${calendar[0].gameIndex})`)
  console.log(`   Última:  ${calendar.at(-1).dateKey} → ${calendar.at(-1).baseWord} (idx ${calendar.at(-1).gameIndex})`)
}

const langs = langArg === 'all' ? ['ca', 'es'] : [langArg]
for (const lang of langs) processLang(lang)
console.log('\n✅ Calendari generat correctament.\n')
