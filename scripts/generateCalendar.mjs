#!/usr/bin/env node
/**
 * generateCalendar.mjs
 *
 * Genera el calendari estable de partides per al 2026 amb selecció ponderada per qualitat.
 * Distribució: ~75% alta qualitat, ~20% mitjana, ~5% baixa però vàlida.
 * Evita paraules adjacents massa similars en una finestra de 7 dies.
 *
 * Ús: node scripts/generateCalendar.mjs [--lang ca|es|all]
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

// Mulberry32 deterministic PRNG
function seededRandom(seed) {
  let h = [...seed].reduce((a, c) => Math.imul(a ^ c.charCodeAt(0), 0x9e3779b9) >>> 0, 0x12345678)
  return function () {
    h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12
    h = Math.imul(h, 0x297a2d39); h ^= h >>> 15
    return (h >>> 0) / 0x100000000
  }
}

function shuffle(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function normalize(word) {
  return word.toLowerCase().normalize('NFD').replace(/[̀́̂̆̈]/g, '').normalize('NFC').replace(/[^a-zçñ·]/g, '')
}

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

// Puntuació de qualitat (consistent amb generateGames.mjs)
function scoreGameQuality(game, lang) {
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

  const l = norm.length
  const lenScore = (l >= 9 && l <= 12) ? 1.0 : (l === 8 || l === 13) ? 0.7 : 0.4
  const verbPenalty = looksLikeVerbForm(game.baseWord, lang) ? 0.6 : 1.0

  return (letterVariety * 0.30 + Math.max(0, vowelScore) * 0.15 + repeatPenalty * 0.15 + solScore * 0.25 + lenScore * 0.15) * verbPenalty
}

function areTooSimilar(baseA, baseB) {
  const a = normalize(baseA)
  const b = normalize(baseB)
  let prefix = 0
  while (prefix < a.length && prefix < b.length && a[prefix] === b[prefix]) prefix++
  if (prefix >= 5) return true
  if (Math.abs(a.length - b.length) > 3) return false
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n] <= 3
}

function processLang(lang) {
  const gamesPath = path.join(__dirname, `../public/generated/${lang}-games.json`)
  const outPath = path.join(__dirname, `../public/generated/${lang}-calendar-2026.json`)

  if (!fs.existsSync(gamesPath)) {
    console.error(`❌ No existeix: ${gamesPath}`)
    process.exit(1)
  }

  const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'))
  const dates = getArchiveDateRange()
  const needed = dates.length  // 214

  console.log(`\n📅 Generant calendari [${lang}]...`)
  console.log(`   Partides disponibles: ${games.length} | Dates a cobrir: ${needed}`)

  // Puntua totes les partides
  const scored = games.map((g, idx) => ({ idx, game: g, quality: scoreGameQuality(g, lang) }))
  scored.sort((a, b) => b.quality - a.quality)

  const highQ = scored.filter(x => x.quality >= 0.65)
  const midQ = scored.filter(x => x.quality >= 0.50 && x.quality < 0.65)
  const lowQ = scored.filter(x => x.quality < 0.50)
  const avgQ = (scored.reduce((s, x) => s + x.quality, 0) / scored.length).toFixed(3)
  const verbLike = scored.filter(x => looksLikeVerbForm(x.game.baseWord, lang)).length

  console.log(`   Alta (≥0.65): ${highQ.length} | Mitjana (0.50-0.65): ${midQ.length} | Baixa (<0.50): ${lowQ.length}`)
  console.log(`   Verb-like: ${verbLike} | Qualitat mitjana: ${avgQ}`)

  // Distribució ponderada: 75% alta, 20% mitjana, 5% baixa
  const targetHigh = Math.round(needed * 0.75)
  const targetMid = Math.round(needed * 0.20)
  const targetLow = needed - targetHigh - targetMid

  const rng = seededRandom(CALENDAR_SEEDS[lang])

  function pickFrom(pool, n) {
    const shuffled = shuffle(pool, rng)
    return shuffled.slice(0, Math.min(n, shuffled.length))
  }

  let selected = [
    ...pickFrom(highQ, targetHigh),
    ...pickFrom(midQ, targetMid),
    ...pickFrom(lowQ, targetLow),
  ]

  // Si no en tenim prou, relaxar i agafar la resta
  if (selected.length < needed) {
    const usedIdxs = new Set(selected.map(x => x.idx))
    const remaining = scored.filter(x => !usedIdxs.has(x.idx))
    const extra = shuffle(remaining, rng).slice(0, needed - selected.length)
    if (extra.length < needed - selected.length) {
      console.warn(`   ⚠️  Insuficients partides úniques (${selected.length + extra.length}/${needed}), repetint`)
    }
    selected = [...selected, ...extra]
    // Si encara no en tenim prou, repetim ciclicament
    while (selected.length < needed) {
      selected.push(scored[selected.length % scored.length])
    }
  }

  // Barreja final per no tenir tots els alta-qualitat al principi
  const finalSelected = shuffle(selected.slice(0, needed), rng)

  // Construeix calendari evitant similituds en finestra de 7 dies
  const calendar = []
  const used = new Set()

  for (let i = 0; i < needed; i++) {
    const dateKey = dates[i]
    // Busca el primer candidat no usat i no massa similar als últims 7
    let best = null
    for (const candidate of finalSelected) {
      if (used.has(candidate.idx)) continue
      const recentBases = calendar.slice(-7).map(e => e.baseWord)
      const tooSimilar = recentBases.some(b => areTooSimilar(b, candidate.game.baseWord))
      if (!tooSimilar) { best = candidate; break }
    }
    // Si tots els candidats disponibles son similars, agafa el millor disponible
    if (!best) {
      for (const candidate of finalSelected) {
        if (!used.has(candidate.idx)) { best = candidate; break }
      }
    }
    if (!best) {
      // No queden partides úniques — reinicia (no hauria de passar)
      used.clear()
      best = finalSelected[i % finalSelected.length]
    }

    used.add(best.idx)
    calendar.push({ dateKey, gameIndex: best.idx, baseWord: best.game.baseWord, _quality: best.quality })
  }

  // Estadística finals
  const calAvgQ = (calendar.reduce((s, e) => s + (e._quality ?? 0), 0) / calendar.length).toFixed(3)
  const calVerbLike = calendar.filter(e => looksLikeVerbForm(e.baseWord, lang)).length

  console.log(`\n   Qualitat mitjana del calendari: ${calAvgQ} | Verb-like seleccionades: ${calVerbLike}`)
  console.log(`\n   📋 Primers 30 dies:`)
  for (let i = 0; i < Math.min(30, calendar.length); i++) {
    const e = calendar[i]
    const verb = looksLikeVerbForm(e.baseWord, lang) ? ' [V]' : ''
    console.log(`      ${e.dateKey}  idx=${String(e.gameIndex).padStart(3)}  q=${(e._quality ?? 0).toFixed(3)}  ${e.baseWord}${verb}`)
  }

  // Elimina _quality del JSON final
  const output = calendar.map(({ _quality: _q, ...rest }) => rest)

  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf8')

  console.log(`\n   ✅ Generades ${output.length} entrades → ${outPath}`)
}

const langs = langArg === 'all' ? ['ca', 'es'] : [langArg]
for (const lang of langs) processLang(lang)
console.log('\n✅ Calendari generat correctament.\n')
