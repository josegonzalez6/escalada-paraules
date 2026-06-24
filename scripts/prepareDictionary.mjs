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
 * Formats d'entrada acceptats:
 *   - Sortida d'aspell expand: múltiples formes per línia separades per espais
 *       "caminar camina camines camini caminem camineu caminen"
 *   - Format Hunspell .dic: "paraula/FLAGS" (una per línia)
 *   - Llista plana: una paraula per línia
 *
 * Filtres aplicats per token:
 *   - Divideix cada línia en tokens per espais/tabuladors
 *   - Descarta tokens que comencen per majúscula (noms propis)
 *   - Descarta tokens amb /FLAGS hunspell (conserva la part before /)
 *   - Descarta tokens amb dígits, punts, comes, guions, apòstrofs, etc.
 *   - Neteja i manté: a-z, accents (àèéíïóòúüñç), l·l
 *   - Filtra longituds: 3-14 lletres (normalitzades sense accents)
 *   - Elimina duplicats
 *   - Ordena alfabèticament
 */

import fs from 'fs'
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

// Normalitza per comptar lletres (treu accents, l·l → ll)
function normalizeForCount(word) {
  return word.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/·/g, 'l')
    .replace(/[^a-z]/g, '')
}

// Token vàlid: només lletres i caràcters especials permesos (accents, ñ, ç, ·)
// Descarta si conté dígits, punts, comes, guions, apòstrofs, parèntesis, etc.
const INVALID_CHARS = /[0-9.\-,;:!?'"()\[\]{}_@#$%^&*+=|\\/<>~`]/

function processToken(raw) {
  // Treure part de flags hunspell: "paraula/FLAGS" → "paraula"
  const withoutFlags = raw.split('/')[0]

  // Descarta si conté caràcters no vàlids (dígits, punts, guions, etc.)
  if (INVALID_CHARS.test(withoutFlags)) return null

  // Neteja: manté lletres, accents (àèéíïóòúüñç), l·l
  const cleaned = withoutFlags.replace(/[^a-zA-ZàèéíïóòúüÀÈÉÍÏÓÒÚÜñÑçÇ·]/g, '').toLowerCase()
  if (!cleaned) return null

  return cleaned
}

async function processFile(inputPath, outputPath) {
  const seen = new Set()
  const results = []

  let totalLines = 0
  let totalTokens = 0
  let skippedProper = 0
  let skippedInvalidChars = 0
  let skippedLength = 0
  let skippedDup = 0
  let isFirstLine = true

  const rl = readline.createInterface({
    input: fs.createReadStream(inputPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  })

  for await (const rawLine of rl) {
    totalLines++

    // Hunspell .dic: primera línia és el count
    if (isFirstLine) {
      isFirstLine = false
      if (/^\d+$/.test(rawLine.trim())) continue
    }

    // Divideix la línia en tokens per espais i tabuladors
    // Això gestiona la sortida d'aspell expand (múltiples formes per línia)
    const tokens = rawLine.trim().split(/[\s\t]+/).filter(Boolean)

    for (const token of tokens) {
      totalTokens++

      // Detecta noms propis: el token original (abans de /FLAGS) comença per majúscula
      const beforeFlags = token.split('/')[0]
      if (
        beforeFlags.length > 0 &&
        beforeFlags[0] === beforeFlags[0].toUpperCase() &&
        beforeFlags[0] !== beforeFlags[0].toLowerCase()
      ) {
        skippedProper++
        continue
      }

      const cleaned = processToken(token)
      if (cleaned === null) {
        skippedInvalidChars++
        continue
      }

      // Filtre de longitud (sobre la forma normalitzada sense accents)
      const norm = normalizeForCount(cleaned)
      if (norm.length < 3 || norm.length > 14) {
        skippedLength++
        continue
      }

      // Dedup per forma original (conserva accents en el fitxer)
      if (seen.has(cleaned)) {
        skippedDup++
        continue
      }
      seen.add(cleaned)
      results.push(cleaned)
    }
  }

  results.sort((a, b) => a.localeCompare(b, lang === 'es' ? 'es' : 'ca'))
  fs.writeFileSync(outputPath, results.join('\n') + '\n', 'utf8')

  const skippedTotal = skippedProper + skippedInvalidChars + skippedLength + skippedDup
  console.log(`\n✅ Processament completat:`)
  console.log(`   Línies llegides:              ${totalLines.toLocaleString()}`)
  console.log(`   Tokens processats:            ${totalTokens.toLocaleString()}`)
  console.log(`   Paraules vàlides:             ${results.length.toLocaleString()}`)
  console.log(`   ──────────────────────────────`)
  console.log(`   Noms propis descartats:       ${skippedProper.toLocaleString()}`)
  console.log(`   Caràcters invàlids descartats:${skippedInvalidChars.toLocaleString()}`)
  console.log(`   Longitud fora rang (3-14):    ${skippedLength.toLocaleString()}`)
  console.log(`   Duplicats eliminats:          ${skippedDup.toLocaleString()}`)
  console.log(`   Total descartats:             ${skippedTotal.toLocaleString()}`)
  console.log(`   → Desat a: ${outputPath}`)
}

console.log(`🔧 Preparant diccionari [${lang}]: ${inputFile} → ${outputFile}`)
processFile(inputFile, outputFile).catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
