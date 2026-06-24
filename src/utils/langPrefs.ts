import type { Language } from '../types'

const KEY = 'escalada-lang'

export function loadLangPref(): Language {
  const raw = localStorage.getItem(KEY)
  if (raw === 'ca' || raw === 'es') return raw
  return 'ca'
}

export function saveLangPref(lang: Language): void {
  localStorage.setItem(KEY, lang)
}
