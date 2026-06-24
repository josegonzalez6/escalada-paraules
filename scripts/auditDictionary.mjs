#!/usr/bin/env node
/**
 * auditDictionary.mjs
 * Analitza public/dictionaries/{lang}.txt i informa de la qualitat.
 * Ús: node scripts/auditDictionary.mjs ca|es
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const lang = process.argv[2] ?? 'ca'
const dictPath = path.join(__dirname, `../public/dictionaries/${lang}.txt`)

if (!fs.existsSync(dictPath)) {
  console.error(`❌ No existeix: ${dictPath}`)
  process.exit(1)
}

function normalizeForCount(word) {
  return word.toLowerCase().normalize('NFD')
    .replace(/[̀́̂̆̈]/g, '')
    .normalize('NFC')
    .replace(/[^a-zçñ·]/g, '')
}

const lines = fs.readFileSync(dictPath, 'utf8').split('\n').map(l => l.trim()).filter(Boolean)
const total = lines.length

const byLen = {}
let withAccent = 0, withC_cedilla = 0, withNtilde = 0, withMidDot = 0

for (const w of lines) {
  const norm = normalizeForCount(w)
  const len = norm.length
  if (!byLen[len]) byLen[len] = []
  byLen[len].push(w)
  if (/[àèéíïóòúü]/i.test(w)) withAccent++
  if (/ç/i.test(w)) withC_cedilla++
  if (/ñ/i.test(w)) withNtilde++
  if (/·/.test(w)) withMidDot++
}

const basesCount = Object.entries(byLen)
  .filter(([len]) => Number(len) >= 8 && Number(len) <= 14)
  .reduce((sum, [, arr]) => sum + arr.length, 0)

console.log(`\n📖 Auditoria del diccionari [${lang}]: ${dictPath}`)
console.log(`\n   Total paraules:     ${total.toLocaleString()}`)
console.log(`   Amb accents:        ${withAccent.toLocaleString()} (${Math.round(withAccent/total*100)}%)`)
if (lang === 'ca') console.log(`   Amb ç:             ${withC_cedilla.toLocaleString()}`)
if (lang === 'es') console.log(`   Amb ñ:             ${withNtilde.toLocaleString()}`)
console.log(`   Amb l·l:            ${withMidDot.toLocaleString()}`)
console.log(`   Bases potenc. 8-14: ${basesCount.toLocaleString()}`)

console.log(`\n   Distribució per longitud:`)
for (let len = 3; len <= 14; len++) {
  const arr = byLen[len] ?? []
  const bar = '█'.repeat(Math.min(40, Math.round(arr.length / total * 200)))
  console.log(`   ${String(len).padStart(2)}L: ${String(arr.length).padStart(7)} ${bar}`)
}

console.log(`\n   Mostres aleatòries:`)
for (const len of [3, 4, 5, 6, 7, 10]) {
  const arr = byLen[len] ?? []
  if (arr.length === 0) { console.log(`   ${len}L: (cap)`); continue }
  const sample = arr.sort(() => Math.random() - 0.5).slice(0, 5)
  console.log(`   ${len}L: ${sample.join(', ')}`)
}

console.log(`\n⚠️  Verificació:`)
let warnings = 0
if (total < 30000) { console.log(`   ⚠️  Menys de 30.000 paraules (${total}) — diccionari massa petit`); warnings++ }
if (lang === 'ca' && withC_cedilla === 0) { console.log(`   ⚠️  Cap paraula amb ç — possible error de processament`); warnings++ }
if (lang === 'es' && withNtilde === 0) { console.log(`   ⚠️  Cap paraula amb ñ — possible error de processament`); warnings++ }
if (withAccent < total * 0.02) { console.log(`   ⚠️  Molt poques paraules amb accents (<2%) — possible error`); warnings++ }
if (basesCount < 100) { console.log(`   ⚠️  Molt poques bases 8-14 lletres (${basesCount})`); warnings++ }
if (warnings === 0) console.log(`   ✅ Cap advertència`)
console.log()
