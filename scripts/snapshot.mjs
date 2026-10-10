// Zapisuje migawkę PRAWDZIWYCH danych z API do src/data/snapshot.json.
// Aplikacja używa jej tylko wtedy, gdy API nie odpowiada (limit zapytań, brak sieci),
// i zawsze pokazuje wtedy baner z datą migawki.
// Użycie: npm run snapshot
import { writeFile, mkdir } from 'node:fs/promises'

const UA = { 'User-Agent': 'PromkiGier/1.0 (https://github.com/Growekk/promki-gier)' }
const CS = 'https://www.cheapshark.com/api/1.0'
const get = async (url) => {
  const r = await fetch(url, { headers: UA })
  if (!r.ok) throw new Error(`${r.status} ${url}`)
  return r.json()
}

const stores = await get(`${CS}/stores`)
const deals = await get(`${CS}/deals?pageSize=60&sortBy=Deal%20Rating&onSale=1`)
const ids = [...new Set(deals.map((d) => d.gameID))].slice(0, 25)
const games = await get(`${CS}/games?ids=${ids.join(',')}`)
const giveaways = await get('https://www.gamerpower.com/api/filter?platform=epic-games-store.steam.gog&type=game')
const fx = await get('https://api.frankfurter.dev/v1/latest?base=USD&symbols=PLN,EUR')

await mkdir(new URL('../src/data/', import.meta.url), { recursive: true })
await writeFile(
  new URL('../src/data/snapshot.json', import.meta.url),
  JSON.stringify({ takenAt: new Date().toISOString(), stores, deals, games, giveaways, rates: fx.rates }),
)
console.log(`Migawka: ${deals.length} okazji, ${Object.keys(games).length} gier, ${giveaways.length} darmówek`)
