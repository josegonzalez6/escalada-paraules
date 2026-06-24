/**
 * auth.ts — Capa d'autenticació via Supabase.
 *
 * Si VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY no estan definides,
 * totes les funcions retornen null / llancen errors controlats.
 *
 * IMPORTANT: VITE_SUPABASE_ANON_KEY és pública (client-side).
 * Mai posar service_role al frontend.
 */

export interface AuthUser {
  id: string
  email: string
}

export interface AuthError {
  message: string
}

export function isSupabaseConfigured(): boolean {
  return !!(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY
  )
}

// Stub: en una integració real, importaria de '@supabase/supabase-js'
// i faria: createClient(url, anonKey)
function getClient() {
  if (!isSupabaseConfigured()) return null
  // TODO: return createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  return null
}

export async function getUser(): Promise<AuthUser | null> {
  const client = getClient()
  if (!client) return null
  // TODO: const { data } = await client.auth.getUser()
  // return data.user ? { id: data.user.id, email: data.user.email ?? '' } : null
  return null
}

export async function signUp(_email: string, _password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  const client = getClient()
  if (!client) return { user: null, error: { message: 'Supabase no configurat' } }
  // TODO: const { data, error } = await client.auth.signUp({ email: _email, password: _password })
  // if (error) return { user: null, error: { message: error.message } }
  // return { user: data.user ? { id: data.user.id, email: data.user.email ?? '' } : null, error: null }
  return { user: null, error: { message: 'No implementat encara' } }
}

export async function signIn(_email: string, _password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  const client = getClient()
  if (!client) return { user: null, error: { message: 'Supabase no configurat' } }
  // TODO: const { data, error } = await client.auth.signInWithPassword({ email: _email, password: _password })
  // if (error) return { user: null, error: { message: error.message } }
  // return { user: data.user ? { id: data.user.id, email: data.user.email ?? '' } : null, error: null }
  return { user: null, error: { message: 'No implementat encara' } }
}

export async function signOut(): Promise<void> {
  const client = getClient()
  if (!client) return
  // TODO: await client.auth.signOut()
}

export async function deleteAccount(): Promise<{ error: AuthError | null }> {
  // Requereix cridar una Edge Function de Supabase o un endpoint backend
  // perquè l'eliminació d'usuari no és possible des del client amb anon key.
  return { error: { message: 'Cal implementar via Supabase Edge Function o backend' } }
}
