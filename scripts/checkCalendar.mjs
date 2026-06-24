#!/usr/bin/env node
/**
 * checkCalendar.mjs — Valida el calendari i emet ERRORs i WARNINGs.
 * Ús: node scripts/checkCalendar.mjs ca|es [--audit]
 *
 * ERROR: baseWord inexistent, gameIndex invàlid, data faltant/duplicada.
 * WARNING: massa verb-like, baixa varietat, qualitat baixa.
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
  return word.toLowerCase().normalize('NFD').replace(/[̀́̂̆̈]/g, '').normalize('NFC').replace(/[^a-zçñ·]/g, '')
}

function looksLikeVerbForm(word, l) {
  const w = normalize(word)
  if (l === 'ca') return /(?:àvem|àveu|éssim|éssiu|aríem|aríeu|eríem|eríeu|iríem|iríeu|àssim|àssiu|avessis|essessin|essin|ssin)$/.test(w)
  if (l === 'es') return /(?:ábamos|aríamos|eríamos|iríamos|aseis|ieseis|aríais|eríais|iríais|ábais|éramos|asteis|arían|erían|irían)$/.test(w)
  return false
}

function scoreGameQuality(game, l) {
  const vowels = 'aeiouàèéíïòóúüáéíóú'
  const norm = normalize(game.baseWord)
  const unique = new Set(norm).size
  const letterVariety = unique / norm.length
  const vowelCount = [...norm].filter(c => vowels.includes(c)).length
  const vowelRatio = vowelCount / norm.length
  const vowelScore = 1 - Math.abs(vowelRatio - 0.4) * 2
  const counts = {}
  const processed = norm.replace(/l·l/g, '\x01')
  for (const c of processed) counts[c] = (counts[c] ?? 0) + 1
  const maxRepeat = Math.max(...Object.values(counts))
  const repeatPenalty = maxRepeat >= 4 ? 0.3 : maxRepeat === 3 ? 0.7 : 1.0
  let solScore = 0
  for (const len of [3, 4, 5, 6, 7]) {
    const n = (game.solutions?.[String(len)] ?? []).length
    solScore += Math.min(n / 3, 1)
  }
  solScore /= 5
  const nl = norm.length
  const lenScore = (nl >= 9 && nl <= 12) ? 1.0 : (nl === 8 || nl === 13) ? 0.7 : 0.4
  const verbPenalty = looksLikeVerbForm(game.baseWord, l) ? 0.6 : 1.0
  return (letterVariety * 0.30 + Math.max(0, vowelScore) * 0.15 + repeatPenalty * 0.15 + solScore * 0.25 + lenScore * 0.15) * verbPenalty
}

function areTooSimilar(baseA, baseB) {
  const a = normalize(baseA), b = normalize(baseB)
  let prefix = 0
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++
  if (prefix >= 5) return true
  if (Math.abs(a.length - b.length) > 3) return false
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0))
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
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
  if (seenDates.has(entry.dateKey)) { console.error(`❌ Data duplicada: ${entry.dateKey}`); errors++ }
  seenDates.add(entry.dateKey)
}

// 3. Totes les dates esperades hi són
for (const d of expectedDates) {
  if (!seenDates.has(d)) { console.error(`❌ Falta la data: ${d}`); errors++ }
}

// 4. Format, ordre, gameIndex, baseWord
for (let i = 0; i < calendar.length; i++) {
  const entry = calendar[i]
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.dateKey)) { console.error(`❌ Format: ${entry.dateKey}`); errors++ }
  if (i > 0 && entry.dateKey <= calendar[i - 1].dateKey) { console.error(`❌ Ordre: ${calendar[i-1].dateKey} → ${entry.dateKey}`); errors++ }
  if (entry.gameIndex < 0 || entry.gameIndex >= games.length) {
    console.error(`❌ gameIndex ${entry.gameIndex} fora de rang per ${entry.dateKey}`)
    errors++
  } else {
    const expectedBase = games[entry.gameIndex].baseWord
    if (entry.baseWord !== expectedBase) {
      console.error(`❌ ${entry.dateKey}: baseWord esperat "${expectedBase}", trobat "${entry.baseWord}"`)
      errors++
    }
    const g = games[entry.gameIndex]
    for (const len of [3, 4, 5, 6, 7]) {
      if (!g.solutions?.[String(len)]?.length) {
        console.error(`❌ ${entry.dateKey}: solucions buides per longitud ${len}`)
        errors++
      }
    }
  }
}

// 5. Paraules base repetides
const seenBases = new Map()
for (const entry of calendar) {
  if (seenBases.has(entry.baseWord)) {
    console.warn(`⚠️  BaseWord repetida: "${entry.baseWord}" el ${seenBases.get(entry.baseWord)} i el ${entry.dateKey}`)
    warnings++
  } else {
    seenBases.set(entry.baseWord, entry.dateKey)
  }
}

// 6. Massa similars consecutius
let similarCount = 0
for (let i = 1; i < calendar.length; i++) {
  if (areTooSimilar(calendar[i-1].baseWord, calendar[i].baseWord)) {
    console.warn(`⚠️  Similars consecutius: ${calendar[i-1].dateKey} "${calendar[i-1].baseWord}" → ${calendar[i].dateKey} "${calendar[i].baseWord}"`)
    similarCount++; warnings++
  }
}

// 7. Verb-like als primers 30 dies
const first30 = calendar.slice(0, 30)
const verbLike30 = first30.filter(e => looksLikeVerbForm(e.baseWord, lang))
if (verbLike30.length > 8) {
  console.warn(`⚠️  Massa verb-like als primers 30 dies: ${verbLike30.length}/30 (límit: 8)`)
  warnings++
}

// 8. Qualitat mitjana del calendari
const qualities = calendar.map(e => games[e.gameIndex] ? scoreGameQuality(games[e.gameIndex], lang) : 0)
const avgQ = qualities.reduce((s, q) => s + q, 0) / qualities.length
if (avgQ < 0.45) {
  console.warn(`⚠️  Qualitat mitjana baixa: ${avgQ.toFixed(3)} (límit: 0.45)`)
  warnings++
}

// 9. Varietat per mes (masses del mateix tipus)
const byMonth = {}
for (const entry of calendar) {
  const m = entry.dateKey.slice(0, 7)
  if (!byMonth[m]) byMonth[m] = []
  byMonth[m].push(entry.baseWord)
}
for (const [month, bases] of Object.entries(byMonth)) {
  const prefixes = bases.map(b => normalize(b).slice(0, 4))
  const unique = new Set(prefixes).size
  const diversity = unique / bases.length
  if (diversity < 0.5) {
    console.warn(`⚠️  Poca varietat al mes ${month}: ${unique}/${bases.length} prefixes únics`)
    warnings++
  }
}

// 10. Audit: primers 30 dies
if (audit) {
  console.log('\n📋 Primers 30 dies del calendari:')
  for (let i = 0; i < Math.min(30, calendar.length); i++) {
    const e = calendar[i]
    const q = games[e.gameIndex] ? scoreGameQuality(games[e.gameIndex], lang) : 0
    const verb = looksLikeVerbForm(e.baseWord, lang) ? ' [V]' : ''
    console.log(`   ${e.dateKey}  idx=${String(e.gameIndex).padStart(3)}  q=${q.toFixed(3)}  ${e.baseWord}${verb}`)
  }
}

console.log(`\n   Entrades: ${calendar.length} | Úniques: ${seenBases.size}`)
console.log(`   Parells similars consecutius: ${similarCount}`)
console.log(`   Verb-like primeres 30 dates: ${verbLike30.length}/30`)
console.log(`   Qualitat mitjana: ${avgQ.toFixed(3)}`)

if (errors === 0 && warnings === 0) {
  console.log(`   ✅ Calendari [${lang}] perfecte! ${calendar.length} entrades vàlides.\n`)
} else if (errors === 0) {
  console.log(`   ⚠️  Calendari [${lang}] vàlid però amb ${warnings} advertències.\n`)
} else {
  console.error(`\n   ❌ ${errors} ERRORs i ${warnings} warnings!\n`)
  process.exit(1)
}
