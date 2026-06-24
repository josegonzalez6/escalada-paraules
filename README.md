# L'Escalada de Paraules v0.17.0

Joc de paraules diari per a mòbil en català i castellà. Construeix una escalada de paraules de 3 a 7 lletres a partir d'una paraula base del diccionari.

## Mecànica del joc

- Es mostra una paraula base (8-14 lletres) i les seves lletres disponibles.
- Has de trobar paraules independents de 3, 4, 5, 6 i 7 lletres, totes formades amb les lletres de la paraula base.
- Les lletres es poden reordenar lliurement (no cal seguir cap ordre).
- Puntuació: N/5 (una per cada paraula correcta).
- Temps enregistrat només si fas 5/5.
- Calendari diari del 01/06/2026 al 31/12/2026. Les dates futures estan bloquejades.

---

## Instal·lació local

### Requisits
- Node.js >= 18

### Instal·lar i executar
```bash
npm install
npm run dev
```

### Tests
```bash
npm test
```

### Build de producció
```bash
npm run build
```

---

## Generació de contingut

```bash
# Generar partides (triga uns minuts)
node scripts/generateGames.mjs --lang ca --max-games 500
node scripts/generateGames.mjs --lang es --max-games 500

# Generar calendaris
node scripts/generateCalendar.mjs --lang ca
node scripts/generateCalendar.mjs --lang es

# Verificar calendaris
node scripts/checkCalendar.mjs --lang ca
node scripts/checkCalendar.mjs --lang es
```

---

## Zona d'administrador

### Accés
Navega a: `/#/admin`

### Configuració de la contrasenya (obligatoria)

**Sense `VITE_ADMIN_PASSWORD`, l'admin mostra "Admin no configurat" i no és accessible.**

#### A Vercel
1. Ves a **Project Settings → Environment Variables**.
2. Afegeix `VITE_ADMIN_PASSWORD` amb un valor segur.
3. Aplica a: Production i Preview.
4. Fes redeploy.

#### En local (`.env.local`)
```
VITE_ADMIN_PASSWORD=la-teva-contrasenya-local
```

### Avís de seguretat

> Les variables `VITE_` estan incloses al bundle JavaScript del client i **no constitueixen seguretat forta**. Qualsevol persona que inspeccioni el bundle pot trobar el valor.
>
> Aquesta protecció és una **barrera bàsica de frontend** per evitar accés casual.
>
> Per a un admin real, cal backend amb autenticació de servidor (Supabase + RLS + rols admin).

### Funcionalitats de l'admin

- **Calendari mensual** (juny–desembre 2026) per CA i ES.
- **Navegació per mes**, cerca per paraula base i filtres (passat/futur/poques solucions).
- **Detall del dia**: gameIndex, baseWord, lletres, solucions per longitud (amb avís si n < 3).
- **Buscar alternativa**: 5 partides candidates per al dia seleccionat.
- **Aplicar localment**: previsualitza l'alternativa al teu navegador (no afecta altres usuaris).
- **Exportar JSON**: descarrega el calendari amb els canvis locals aplicats.
- **Exportar CSV**: per anàlisi externa.
- **Reset local**: esborra el resultat guardat localment per un dia (doble clic).

### Canviar la paraula d'un dia (Fase A — frontend estàtic)

1. Obre `/#/admin`, selecciona idioma i dia.
2. Clica **"Buscar alternativa per aquest dia"**.
3. Revisa les 5 alternatives (baseWord, nombre de solucions per longitud).
4. Clica **"Aplicar localment"** per previsualitzar.
5. Clica **"Exportar JSON"** per descarregar el calendari modificat.
6. Substitueix `public/generated/ca-calendar-2026.json` (o `es-`) al projecte.
7. Fes commit i deploy.

> **Aquest canvi és local al teu navegador. Per fer-lo públic, substitueix el JSON i fes deploy.**

### Canvi global sense redeploy (Fase B — requereix Supabase)

Amb Supabase configurat, l'admin podrà guardar overrides a la taula `daily_overrides`.  
El joc consultarà primer la taula; si no hi ha override, usarà el calendari generat.  
Pendent d'implementació (vegeu `src/services/userResults.ts` → `saveDailyOverride`).

---

## Sistema d'usuaris (Fase B — preparada)

La integració amb Supabase és opcional. Sense les variables d'entorn, el joc funciona completament sense comptes.

### Configuració de Supabase

1. Crea un projecte a [supabase.com](https://supabase.com).
2. Al **SQL Editor**, executa `supabase/schema.sql`.
3. A Vercel, afegeix:
   - `VITE_SUPABASE_URL` — URL del projecte Supabase
   - `VITE_SUPABASE_ANON_KEY` — clau `anon` pública
4. **Mai posar `service_role` al frontend.**

### Esquema de la base de dades (`supabase/schema.sql`)

| Taula | Contingut |
|-------|-----------|
| `profiles` | Perfil d'usuari (id, email, display_name) |
| `user_results` | Resultats de partides (score, temps, data, idioma, mode) |
| `daily_overrides` | Canvis de calendari globals per l'admin (Fase B) |

RLS actiu a totes les taules. Cada usuari només veu i escriu les seves pròpies dades.

### Dades que es guarden (minimització GDPR)
- Email (identificació), score, temps, data, idioma, mode.
- **NO**: IP, user-agent, paraules introduïdes (llevat de consentiment explícit).

---

## Protecció de dades / GDPR

Pàgina de privacitat accessible a `/#/privacy`.

| Principi GDPR | Implementació |
|---------------|---------------|
| Minimització | Email + resultats bàsics. Sense IP ni paraules per defecte. |
| Transparència | Pàgina de privacitat amb dades recollides, finalitat i drets. |
| Consentiment | (futur) Checkbox obligatori en crear compte. |
| Limitació de conservació | localStorage: fins que l'usuari esborra. Compte: fins a supressió. |
| Seguretat | Supabase Auth, RLS, sense service_role al client, HTTPS. |
| Drets | Email de contacte i instruccions de supressió documentats. |

**Proveïdors tècnics:** Vercel (allotjament) i Supabase (BD/auth, AWS Europa).  
Si s'operen dades de residents UE, es recomana formalitzar DPA amb cada proveïdor.

> **Nota:** La pàgina de privacitat i aquest README no substitueixen assessorament legal professional.

---

## Mode desenvolupador (DevMode)

Al fitxer `src/App.tsx`, canvia `const DEV_MODE = false` per `true`.

Permet veure la solució, provar paraules contra el diccionari i regenerar partides.  
**No desplegar amb `DEV_MODE = true` a producció.**

---

## Publicar a GitHub / Vercel

```bash
git add .
git commit -m "descripció del canvi"
git push origin main
```

Vercel detecta el push i fa deploy automàticament.

**Variables d'entorn necessàries a Vercel:**
- `VITE_ADMIN_PASSWORD` — per a la zona d'admin (obligatoria si vols admin)
- `VITE_SUPABASE_URL` — per a comptes d'usuari (opcional)
- `VITE_SUPABASE_ANON_KEY` — per a comptes d'usuari (opcional)

---

## Estructura del projecte

```
src/
  components/     # Components React (Game, WordBoxRow, ResultScreen, …)
  hooks/          # useGame
  pages/          # AdminPage, PrivacyPage
  services/       # auth.ts, userResults.ts (stubs Supabase)
  utils/          # normalize, validate, dictionary, stats, archive, daily
  test/           # Tests Vitest
  types.ts
public/
  dictionaries/   # ca.txt, es.txt
  generated/      # ca-games.json, es-games.json, ca-calendar-2026.json, es-calendar-2026.json
scripts/
  generateGames.mjs
  generateCalendar.mjs
  checkCalendar.mjs
supabase/
  schema.sql      # Esquema Supabase (profiles, user_results, daily_overrides)
```

---

## Historial de versions

- **v0.17.0**: Admin reescrit amb calendari mensual complet, alternatives, export JSON/CSV. Seguretat admin (elimina fallback admin123, usa sessionStorage). Stubs Supabase auth/userResults. Pàgina de privacitat. Esquema Supabase. README complet.
- **v0.16.0**: Cursor actiu sense background (outline/box-shadow) per evitar interferència visual amb vermell/verd.
- **v0.15.0**: Fix robust del cursor groc sobre vermell (guard phase, useEffect reset, onClick reset).
- **v0.14.0**: Fix CSS cursor priority (showCursor guard).
- **v0.13.0**: Fix exemples no apareixien (localStorage path hijack). Millora qualitat calendari.
- **v0.12.0**: Exemples de solucions a ResultScreen per files incorrectes.
- **v0.11.0**: Correcció del blur (paraula base, no escala de respostes).
- **v0.10.0**: Botó COMEÇAR/COMENZAR explícit. Cronòmetre comença en prémer.
- **v0.9.0**: Calendari amb PRNG seeded, puntuació de qualitat, checkCalendar millorat.
- **v0.8.0**: Mode arxiu/calendari. Calendari 2026-06-01 a 2026-12-31.
