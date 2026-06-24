/**
 * userResults.ts — Guardat de resultats de partida per usuari autenticat.
 *
 * Sense Supabase configurat, totes les funcions són no-op.
 * Amb Supabase, guarda a la taula `user_results` amb RLS per user_id.
 *
 * Dades mínimes recollides (minimització GDPR):
 *   - user_id, lang, date_key, mode, score, elapsed_seconds, completed_perfect
 * NO es guarden per defecte:
 *   - paraules introduïdes per l'usuari
 *   - IP, user-agent, dades de dispositiu
 */

import type { Language } from '../types'
import { isSupabaseConfigured } from './auth'

export interface UserResultPayload {
  lang: Language
  dateKey: string            // 'YYYY-MM-DD'
  mode: 'daily' | 'archive'
  score: number              // 0–5
  elapsedSeconds: number | null  // null si no és 5/5
  completedPerfect: boolean
}

export interface SaveResultResponse {
  success: boolean
  error?: string
}

export async function saveUserResult(
  _userId: string,
  _payload: UserResultPayload,
): Promise<SaveResultResponse> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase no configurat' }

  // TODO: importar client Supabase i executar:
  // const { error } = await supabase.from('user_results').upsert({
  //   user_id: userId,
  //   lang: payload.lang,
  //   date_key: payload.dateKey,
  //   mode: payload.mode,
  //   score: payload.score,
  //   elapsed_seconds: payload.elapsedSeconds,
  //   completed_perfect: payload.completedPerfect,
  //   updated_at: new Date().toISOString(),
  // }, { onConflict: 'user_id,lang,date_key,mode' })
  // return error ? { success: false, error: error.message } : { success: true }

  return { success: false, error: 'No implementat encara' }
}

export async function loadUserResults(_userId: string, _lang: Language): Promise<UserResultPayload[]> {
  if (!isSupabaseConfigured()) return []

  // TODO: const { data } = await supabase
  //   .from('user_results')
  //   .select('*')
  //   .eq('user_id', userId)
  //   .eq('lang', lang)
  //   .order('date_key', { ascending: false })
  // return (data ?? []).map(r => ({ ... }))

  return []
}

/**
 * getDailyOverride — Consulta si hi ha un override de calendari per una data.
 * Fase A (sense backend): retorna null sempre.
 * Fase B (amb Supabase): consulta la taula daily_overrides.
 */
export async function getDailyOverride(
  _lang: Language,
  _dateKey: string,
): Promise<number | null> {
  if (!isSupabaseConfigured()) return null

  // TODO: const { data } = await supabase
  //   .from('daily_overrides')
  //   .select('game_index')
  //   .eq('lang', lang)
  //   .eq('date_key', dateKey)
  //   .single()
  // return data?.game_index ?? null

  return null
}

/**
 * saveDailyOverride — Desa un override de calendari per una data.
 * Requereix que l'usuari tingui rol admin a Supabase RLS.
 * Fase A: no-op (només localStorage local).
 */
export async function saveDailyOverride(
  _lang: Language,
  _dateKey: string,
  _gameIndex: number,
): Promise<SaveResultResponse> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Supabase no configurat — fase A: usa export JSON' }

  // TODO: const { error } = await supabase.from('daily_overrides').upsert({
  //   lang,
  //   date_key: dateKey,
  //   game_index: gameIndex,
  //   updated_at: new Date().toISOString(),
  // }, { onConflict: 'lang,date_key' })
  // return error ? { success: false, error: error.message } : { success: true }

  return { success: false, error: 'No implementat encara' }
}
