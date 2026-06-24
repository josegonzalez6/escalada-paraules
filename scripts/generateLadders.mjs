// Script Node.js per precomputar escales vàlides des dels diccionaris
// Executa amb: node scripts/generateLadders.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function normalize(word) {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
}

function loadDict(lang) {
  const path = join(root, 'public', 'dictionaries', `${lang}.txt`)
  const raw = readFileSync(path, 'utf-8')
  const words = new Set()
  for (const line of raw.split('\n')) {
    const w = normalize(line.trim())
    if (w.length >= 3 && w.length <= 7) words.add(w)
  }
  return words
}

function letterCounts(word) {
  const counts = {}
  for (const c of word) counts[c] = (counts[c] || 0) + 1
  return counts
}

function canFollow(prev, next) {
  if (next.length !== prev.length + 1) return false
  const cp = letterCounts(prev)
  const cn = letterCounts(next)
  let extra = 0
  for (const [c, n] of Object.entries(cn)) {
    const diff = n - (cp[c] || 0)
    if (diff < 0) return false
    extra += diff
  }
  return extra === 1
}

function buildLadders(words) {
  const byLen = {}
  for (let i = 3; i <= 7; i++) byLen[i] = []
  for (const w of words) {
    if (byLen[w.length]) byLen[w.length].push(w)
  }

  const ladders = []
  let count = 0

  for (const w3 of byLen[3]) {
    for (const w4 of byLen[4]) {
      if (!canFollow(w3, w4)) continue
      for (const w5 of byLen[5]) {
        if (!canFollow(w4, w5)) continue
        for (const w6 of byLen[6]) {
          if (!canFollow(w5, w6)) continue
          for (const w7 of byLen[7]) {
            if (!canFollow(w6, w7)) continue
            ladders.push([w3, w4, w5, w6, w7])
            count++
            if (count >= 500) break
          }
          if (count >= 500) break
        }
        if (count >= 500) break
      }
      if (count >= 500) break
    }
    if (count >= 500) break
  }

  return ladders
}

for (const lang of ['ca', 'es']) {
  console.log(`Processing ${lang}...`)
  try {
    const words = loadDict(lang)
    console.log(`  Loaded ${words.size} words`)
    const ladders = buildLadders(words)
    console.log(`  Found ${ladders.length} valid ladders`)
    const outDir = join(root, 'public', 'generated')
    mkdirSync(outDir, { recursive: true })
    writeFileSync(
      join(outDir, `${lang}-ladders.json`),
      JSON.stringify(ladders, null, 2)
    )
    console.log(`  Saved to public/generated/${lang}-ladders.json`)
  } catch (e) {
    console.error(`  Error: ${e.message}`)
  }
}
console.log('Done.')
