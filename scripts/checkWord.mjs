#!/usr/bin/env node
/**
 * checkWord.mjs
 * Comprova si una paraula existeix al diccionari (accepta formes sense accent).
 * Ús: node scripts/checkWord.mjs ca camí
 *     node scripts/checkWord.mjs es canción
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const lang = process.argv[2] ?? 'ca'
const word = process.argv[3] ?? ''

if (!word) {
  console.error('Ús: node scripts/checkWord.mjs ca|es <paraula>')
  process.exit(1)
}

function normalizeForLookup(w) {
  return w.toLowerCase().normalize('NFD')
    .replace(/[̀́̂̆̈]/g, '')
    .normalize('NFC')
    .replace(/[^a-zçñ·]/g, '')
}

const dictPath = path.join(__dirname, `../public/dictionaries/${lang}.txt`)
if (!fs.existsSync(dictPath)) { console.error(`❌ No existeix: ${dictPath}`); process.exit(1) }

const lookupMap = new Map()
for (const line of fs.readFileSync(dictPath, 'utf8').split('\n')) {
  const orig = line.trim().toLowerCase()
  if (!orig) continue
  const norm = normalizeForLookup(orig)
  if (!lookupMap.has(norm)) lookupMap.set(norm, [])
  lookupMap.get(norm).push(orig)
}

const normalized = normalizeForLookup(word)
const matches = lookupMap.get(normalized) ?? []

console.log(`\n🔍 Comprovació: "${word}" [${lang}]`)
console.log(`   Forma normalitzada: "${normalized}"`)
console.log(`   Existeix: ${matches.length > 0 ? '✅ sí' : '❌ no'}`)
if (matches.length > 0) console.log(`   Originals al dict:  ${matches.join(', ')}`)
console.log()
