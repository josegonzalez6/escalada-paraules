#!/usr/bin/env node
/**
 * generateCalendar.mjs
 *
 * Genera el calendari estable de partides per al 2026.
 * Cada data del 2026-06-01 al 2026-12-31 té una partida assignada
 * amb un shuffle determinista (PRNG seeded) per evitar paraules adjacents similars.
 *
 * Ús:
 *   node scripts/generateCalendar.mjs [--lang ca|es|all]
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

const CALENDAR_SEEDS = {
  ca: 'escalada-calendar-2026-ca',
  es: 'escalada-calendar-2026-es',
}

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

// Mulberry32 deterministic PRNG
function seededRandom(seed) {
  let h = [...seed].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 0x9e3779b9) >>> 0, 0x12345678)
  return function () {
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12
    h = Math.imul(h, 0x297a2d39); h ^= h >>> 15
    return (h >>> 0) / 0x100000000
  }
}

// Fisher-Yates shuffle determinista
function shuffleIndices(count, rng) {
  const arr = Array.from({ length: count }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
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

  // Shuffle determinista dels índexs de partides
  const seed = CALENDAR_SEEDS[lang]
  const rng = seededRandom(seed)
  const shuffledIndices = shuffleIndices(games.length, rng)

  const calendar = dates.map((dateKey, i) => {
    const gameIndex = shuffledIndices[i % shuffledIndices.length]
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
