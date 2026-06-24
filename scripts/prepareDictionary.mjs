// Script per netejar i normalitzar un fitxer de diccionari extern.
// Executa amb: node scripts/prepareDictionary.mjs <input> <output>
//
// Exemple:
//   node scripts/prepareDictionary.mjs ~/Downloads/ca_raw.txt public/dictionaries/ca.txt
//
// El fitxer d'entrada pot tenir:
//   - Una paraula per línia (format simple)
//   - Format Hunspell (.dic): primera línia = nombre de paraules, la resta "paraula/flags"
//   - Línies buides o comentaris (#) — s'ignoren
//
// El fitxer de sortida:
//   - Una paraula per línia
//   - Minúscules, sense accents (normalitzat per comparació)
//   - Sense duplicats
//   - Ordenat alfabèticament
//   - Longitud 3-10 (3-7 per a respostes, 8-10 per a bases de partida)
//
// NOTA SOBRE ACCENTS:
//   El joc normalitza TOTA la entrada eliminant accents. Per tant, "café" i "cafe"
//   es tracten com la mateixa paraula. Pots incloure les formes accentuades i
//   el sistema les normalitzarà automàticament.

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Ús: node scripts/prepareDictionary.mjs <input> <output>')
  console.error('Exemple: node scripts/prepareDictionary.mjs ~/Downloads/ca_raw.txt public/dictionaries/ca.txt')
  process.exit(1)
}

const [inputPath, outputPath] = args

function normalize(word) {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/·/g, 'l')   // l·l catalan -> ll
    .replace(/[^a-z]/g, '')
}

function processLine(line) {
  // Ignora comentaris i línies buides
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null

  // Format Hunspell: "paraula/FLAGS" → agafa la paraula
  const slashIdx = trimmed.indexOf('/')
  const raw = slashIdx >= 0 ? trimmed.slice(0, slashIdx) : trimmed

  return normalize(raw)
}

console.log(`Llegint: ${inputPath}`)
let raw
try {
  raw = readFileSync(inputPath, 'utf-8')
} catch {
  // Prova path relatiu des de root
  raw = readFileSync(join(process.cwd(), inputPath), 'utf-8')
}

const lines = raw.split('\n')
console.log(`Línies totals: ${lines.length}`)

const words = new Set()
let skippedTooShort = 0
let skippedTooLong = 0
let skippedEmpty = 0

for (const line of lines) {
  const w = processLine(line)
  if (!w) { skippedEmpty++; continue }
  if (w.length < 3) { skippedTooShort++; continue }
  if (w.length > 10) { skippedTooLong++; continue }
  words.add(w)
}

const sorted = [...words].sort()

writeFileSync(outputPath, sorted.join('\n') + '\n', 'utf-8')

console.log(`\nResultat guardat a: ${outputPath}`)
console.log(`Paraules úniques: ${sorted.length}`)
console.log(`  3 lletres: ${sorted.filter(w => w.length === 3).length}`)
console.log(`  4 lletres: ${sorted.filter(w => w.length === 4).length}`)
console.log(`  5 lletres: ${sorted.filter(w => w.length === 5).length}`)
console.log(`  6 lletres: ${sorted.filter(w => w.length === 6).length}`)
console.log(`  7 lletres: ${sorted.filter(w => w.length === 7).length}`)
console.log(`  8 lletres: ${sorted.filter(w => w.length === 8).length}`)
console.log(`  9 lletres: ${sorted.filter(w => w.length === 9).length}`)
console.log(` 10 lletres: ${sorted.filter(w => w.length === 10).length}`)
console.log(`Saltats: ${skippedTooShort} curts, ${skippedTooLong} llargs, ${skippedEmpty} buits`)
console.log('\nAra executa: npm run generate:games')
