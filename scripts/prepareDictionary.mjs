#!/usr/bin/env node
/**
 * prepareDictionary.mjs
 *
 * Neteja un fitxer de diccionari brut i el converteix a un fitxer .txt
 * amb una paraula vàlida per línia (minúscules, sense duplicats, 3-14 lletres).
 *
 * Ús:
 *   node scripts/prepareDictionary.mjs <input> <output> [--lang ca|es]
 *
 * Exemples:
 *   node scripts/prepareDictionary.mjs raw/ca-hunspell.dic public/dictionaries/ca.txt --lang ca
 *   node scripts/prepareDictionary.mjs raw/es-hunspell.dic public/dictionaries/es.txt --lang es
 *
 * El fitxer d'entrada pot ser:
 *   - Format Hunspell .dic (primera línia = count, la resta "paraula/FLAGS")
 *   - Una llista plana (una paraula per línia)
 *   - Un fitxer .txt genèric
 *
 * Filtres aplicats:
 *   - Minúscules
 *   - Mantén accents (à, è, é, í, ï, ó, ò, ú, ü), ñ, ç, l·l
 *   - Elimina guions, punts, comes, apòstrofs, dígits
 *   - Elimina noms propis (comencen per majúscula al fitxer original)
 *   - Elimina abreviatures (contenen punt)
 *   - Filtra longituds: 3-14 lletres (normalitzades, sense accents)
 *   - Elimina duplicats
 *   - Ordena alfabèticament
 */

import fs from 'fs'
import path from 'path'
import readline from 'readline'

const args = process.argv.slice(2)
const inputFile = args[0]
const outputFile = args[1]
const langFlag = args.indexOf('--lang')
const lang = langFlag >= 0 ? args[langFlag + 1] : 'ca'

if (!inputFile || !outputFile) {
  console.error('Ús: node scripts/prepareDictionary.mjs <input> <output> [--lang ca|es]')
  process.exit(1)
}

// Normalitza per comptar lletres (treu accents però manté l·l com ll)
function normalizeForCount(word) {
  return word.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // treu diacrítics
    .replace(/·/g, 'l')              // l·l → ll
    .replace(/[^a-z]/g, '')
}

// Comprova si la paraula original sembla un nom propi
function looksProper(rawLine) {
  const trimmed = rawLine.split('/')[0].trim()
  return trimmed.length > 0 && trimmed[0] === trimmed[0].toUpperCase() && trimmed[0] !== trimmed[0].toLowerCase()
}

// Comprova si és una abreviatura (conté punt, guió, digit, espai)
function looksAbbreviation(word) {
  return /[.0-9\-\s_']/.test(word)
}

async function processFile(inputPath, outputPath) {
  const seen = new Set()
  const results = []
  let totalLines = 0
  let skippedProper = 0
  let skippedLength = 0
  let skippedAbbr = 0
  let skippedDup = 0
  let isFirstLine = true

  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  for await (const rawLine of rl) {
    totalLines++

    // Hunspell: primera línia sol ser el count
    if (isFirstLine) {
      isFirstLine = false
      if (/^\d+$/.test(rawLine.trim())) continue
    }

    // Detectar noms propis (comencen per majúscula)
    if (looksProper(rawLine)) {
      skippedProper++
      continue
    }

    // Treure part de flags hunspell (paraula/FLAGS → paraula)
    const word = rawLine.split('/')[0].trim().toLowerCase()

    if (!word) continue

    // Abreviatures
    if (looksAbbreviation(word)) {
      skippedAbbr++
      continue
    }

    // Neteja bàsica: treu caràcters no vàlids però manté accents i caràcters especials
    // Manté: a-z, àèéíïóòúü, ñ, ç, ·
    const cleaned = word.replace(/[^a-zàèéíïóòúüñç·]/gi, '').toLowerCase()
    if (!cleaned) continue

    // Filtre de longitud (normalitzada)
    const normalized = normalizeForCount(cleaned)
    if (normalized.length < 3 || normalized.length > 14) {
      skippedLength++
      continue
    }

    // Duplicats
    if (seen.has(cleaned)) {
      skippedDup++
      continue
    }
    seen.add(cleaned)
    results.push(cleaned)
  }

  results.sort((a, b) => a.localeCompare(b, lang))
  fs.writeFileSync(outputPath, results.join('\n') + '\n', 'utf8')

  console.log(`\n✅ Processament completat:`)
  console.log(`   Línies llegides:     ${totalLines}`)
  console.log(`   Paraules vàlides:    ${results.length}`)
  console.log(`   Noms propis saltats: ${skippedProper}`)
  console.log(`   Abrev. saltades:     ${skippedAbbr}`)
  console.log(`   Longitud fora rang:  ${skippedLength}`)
  console.log(`   Duplicats eliminats: ${skippedDup}`)
  console.log(`   → Desat a: ${outputPath}`)
}

console.log(`🔧 Preparant diccionari [${lang}]: ${inputFile} → ${outputFile}`)
processFile(inputFile, outputFile).catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
