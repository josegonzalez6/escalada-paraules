# Escalada de Paraules v0.1.0

Joc de paraules per a mòbil en català i castellà. Construeix una escalada de paraules de 3 a 7 lletres afegint una lletra a cada pas.

## Mecànica

- Et donen una paraula de 3 lletres
- Has de trobar paraules de 4, 5, 6 i 7 lletres
- Cada paraula ha de contenir totes les lletres de l'anterior + exactament 1 lletra nova
- Les lletres es poden reordenar lliurement
- Tens 60 segons

## Instal·lació i execució

### Requisits
- Node.js >= 18

### Instal·lar dependències
```
npm install
```

### Generar escales vàlides (IMPORTANT: fer primer!)
```
npm run generate:ladders
```

### Executar en local (accessible des del mòbil)
```
npm run dev
```

### Executar tests
```
npm test
```

## Accés des del mòbil

1. Executa `npm run dev`
2. Troba la teva IP local:
   - macOS/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - Windows: `ipconfig`
3. Al mòbil, obre: `http://IP_LOCAL:5173`
4. Per afegir a la pantalla d'inici:
   - iOS Safari: botó Compartir → "Afegir a la pantalla d'inici"
   - Android Chrome: menú ⋮ → "Afegir a la pantalla d'inici"

## Diccionaris

Els diccionaris estan a `public/dictionaries/`:
- `ca.txt` – Català
- `es.txt` – Castellà

**Format:** una paraula per línia, minúscules, UTF-8.

Per substituir pels diccionaris complets:
1. Descarrega un corpus obert (ex. FreeLing, Aspell, hunspell)
2. Exporta totes les formes flexionades, una per línia
3. Substitueix el fitxer corresponent
4. Executa `npm run generate:ladders` per recalcular les escales
5. Reinicia el servidor

**Tractament d'accents:** el joc accepta entrada sense accents i normalitza internament. No cal que l'usuari escrigui accents.

## Escales precomputades

Estan a `public/generated/`:
- `ca-ladders.json`
- `es-ladders.json`

Genera-les amb: `npm run generate:ladders`

## Mode desenvolupador

Al fitxer `src/App.tsx`, canvia `const DEV_MODE = false` per `const DEV_MODE = true`.

Permet:
- Veure la solució actual
- Veure quantes escales s'han carregat
- Provar paraules contra el diccionari
- Regenerar partida

## Estructura del projecte

```
src/
  components/     # Components React
  hooks/          # useGame hook
  utils/          # normalize, validate, dictionary, stats
  test/           # Tests Vitest
  types.ts        # Tipus TypeScript
public/
  dictionaries/   # ca.txt, es.txt (substituïbles)
  generated/      # ca-ladders.json, es-ladders.json
scripts/
  generateLadders.mjs  # Script de precomputació
```

## Limitacions actuals

- Els diccionaris inclosos són de demostració (~100 paraules). Substituir per diccionaris complets.
- Les escales s'han de precomputar amb `npm run generate:ladders` abans de jugar.
- No hi ha backend: tot funciona al navegador.

## Versió

v0.1.0
