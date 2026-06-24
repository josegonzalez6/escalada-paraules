-- ============================================================
-- Escalada de Paraules — Supabase schema
-- Aplica des del SQL Editor de Supabase o via supabase CLI.
--
-- IMPORTANT: activar Row Level Security (RLS) a totes les taules.
-- Només usar VITE_SUPABASE_ANON_KEY al frontend.
-- Mai usar service_role al client.
-- ============================================================

-- ── Extensió UUID (normalment ja activa a Supabase) ──
create extension if not exists "pgcrypto";

-- ════════════════════════════════════════════════
-- 1. PROFILES
-- Perfil d'usuari creat automàticament en registrar-se.
-- Vinculat a auth.users via trigger.
-- ════════════════════════════════════════════════
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  email          text not null,
  display_name   text,
  created_at     timestamptz not null default now()
);

-- Trigger per crear perfil automàticament quan es crea un usuari
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS: cada usuari només pot llegir/modificar el seu propi perfil
alter table public.profiles enable row level security;

create policy "Usuari veu el seu perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Usuari actualitza el seu perfil"
  on public.profiles for update
  using (auth.uid() = id);


-- ════════════════════════════════════════════════
-- 2. USER_RESULTS
-- Resultats de partides per usuari.
-- Minimització de dades: no es guarden paraules introduïdes,
-- IP ni user-agent.
-- ════════════════════════════════════════════════
create table if not exists public.user_results (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  lang              text not null check (lang in ('ca', 'es')),
  date_key          date not null,
  mode              text not null check (mode in ('daily', 'archive')),
  score             integer not null check (score >= 0 and score <= 5),
  elapsed_seconds   integer,   -- null si score < 5
  completed_perfect boolean not null,
  -- Opcional, només si l'usuari accepta explícitament guardar detall:
  -- inputs          text[],
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, lang, date_key, mode)
);

-- RLS: cada usuari només veu i escriu els seus propis resultats
alter table public.user_results enable row level security;

create policy "Usuari veu els seus resultats"
  on public.user_results for select
  using (auth.uid() = user_id);

create policy "Usuari crea els seus resultats"
  on public.user_results for insert
  with check (auth.uid() = user_id);

create policy "Usuari actualitza els seus resultats"
  on public.user_results for update
  using (auth.uid() = user_id);

create policy "Usuari elimina els seus resultats"
  on public.user_results for delete
  using (auth.uid() = user_id);

-- Índex per cerques freqüents
create index if not exists idx_user_results_user_lang
  on public.user_results (user_id, lang, date_key);


-- ════════════════════════════════════════════════
-- 3. DAILY_OVERRIDES
-- Canvis de calendari aplicats per l'admin.
-- Fase B: permet canviar la partida d'un dia globalment
-- sense fer redeploy del JSON generat.
-- ════════════════════════════════════════════════
create table if not exists public.daily_overrides (
  id           uuid primary key default gen_random_uuid(),
  lang         text not null check (lang in ('ca', 'es')),
  date_key     date not null,
  game_index   integer not null,
  created_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (lang, date_key)
);

-- RLS: lectura pública (el joc consulta overrides per mostrar la partida correcta)
alter table public.daily_overrides enable row level security;

create policy "Lectura pública d'overrides"
  on public.daily_overrides for select
  using (true);

-- ESCRIPTURA: només admins.
-- Per implementar rols admin, afegir una taula admin_users o usar
-- Supabase custom claims (JWT). Exemple amb taula:
--
-- create table if not exists public.admin_users (
--   user_id uuid primary key references auth.users(id) on delete cascade
-- );
--
-- create policy "Només admins creen overrides"
--   on public.daily_overrides for insert
--   with check (
--     exists (select 1 from public.admin_users where user_id = auth.uid())
--   );
--
-- create policy "Només admins actualitzen overrides"
--   on public.daily_overrides for update
--   using (
--     exists (select 1 from public.admin_users where user_id = auth.uid())
--   );
--
-- create policy "Només admins eliminen overrides"
--   on public.daily_overrides for delete
--   using (
--     exists (select 1 from public.admin_users where user_id = auth.uid())
--   );

-- ════════════════════════════════════════════════
-- NOTES DE CONFORMITAT GDPR
-- ════════════════════════════════════════════════
-- - Dades mínimes: email + resultats de joc. Sense IP, user-agent ni paraules per defecte.
-- - RLS actiu a totes les taules.
-- - Eliminació en cascada quan l'usuari esborra el compte (on delete cascade).
-- - Per suprimir un compte completament, cal cridar una Edge Function de Supabase
--   que elimini l'usuari de auth.users (i les cascades faran la resta).
-- - Recomanació: fer DPA amb Supabase i Vercel si s'opera amb dades de residents UE.
-- - Conservació: fins que l'usuari sol·liciti supressió.
-- ════════════════════════════════════════════════
