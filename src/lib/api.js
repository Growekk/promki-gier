// Cała komunikacja z publicznymi API (bez kluczy, CORS: *).
// - CheapShark: ceny w ~15 oficjalnych i autoryzowanych sklepach PC (USD), najniższa cena w historii
// - GamerPower: aktualnie rozdawane gry
// - Frankfurter (EBC): kursy walut
// Odpowiedzi są cache'owane w sessionStorage. Gdy API nie odpowiada (np. limit zapytań),
// funkcje przechodzą na migawkę prawdziwych danych i ustawiają flagę offline.
import snapshot from '../data/snapshot.json'

const CS = 'https://www.cheapshark.com/api/1.0'
const GP = 'https://www.gamerpower.com/api'
const FX = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=PLN,EUR'

export const SNAPSHOT_DATE = new Date(snapshot.takenAt)

/* ---------- status offline (mały store do subskrypcji w React) ---------- */
let offline = false
const listeners = new Set()
function setOffline(v) {
  if (offline === v) return
  offline = v
  listeners.forEach((fn) => fn(v))
}
export const offlineStore = {
  get: () => offline,
  subscribe: (fn) => (listeners.add(fn), () => listeners.delete(fn)),
}

/* ---------- cache ---------- */
const memory = new Map()
function readCache(key) {
  if (memory.has(key)) return memory.get(key)
  try {
    const raw = sessionStorage.getItem('pg:' + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function writeCache(key, data) {
  const entry = { t: Date.now(), data }
  memory.set(key, entry)
  try {
    sessionStorage.setItem('pg:' + key, JSON.stringify(entry))
  } catch {
    /* pełny storage albo tryb prywatny — wystarczy pamięć */
  }
}

let rateLimitedUntil = 0

async function getJSON(url, ttl = 10 * 60 * 1000) {
  const hit = readCache(url)
  if (hit && Date.now() - hit.t < ttl) return hit.data
  if (url.startsWith(CS) && Date.now() < rateLimitedUntil) throw new Error('rate-limit')
  const res = await fetch(url)
  if (res.status === 429) {
    rateLimitedUntil = Date.now() + 60 * 1000
    throw new Error('rate-limit')
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  writeCache(url, data)
  return data
}

/** Wywołuje źródło online; jeśli padnie — zwraca wynik z migawki i włącza baner offline. */
async function withFallback(online, fallback) {
  try {
    const data = await online()
    setOffline(false)
    return data
  } catch (err) {
    console.warn('[api] przełączam na migawkę:', err.message)
    setOffline(true)
    return fallback()
  }
}

const qs = (params) =>
  Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')

/* ---------- CheapShark ---------- */

export const storeIcon = (storeID) => `https://www.cheapshark.com/img/stores/icons/${Number(storeID) - 1}.png`
export const dealLink = (dealID) => `https://www.cheapshark.com/redirect?dealID=${dealID}`
export const steamHeader = (appID) =>
  appID ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appID}/header.jpg` : null

export function getStores() {
  return withFallback(
    () => getJSON(`${CS}/stores`, 24 * 3600 * 1000),
    () => snapshot.stores,
  ).then((list) =>
    Object.fromEntries(list.map((s) => [s.storeID, { id: s.storeID, name: s.storeName, active: s.isActive === 1 }])),
  )
}

/**
 * Lista okazji. Ceny w USD.
 * sortBy: 'Deal Rating' | 'Savings' | 'Price' | 'Metacritic' | 'Reviews' | 'Release' | 'Recent'
 */
export function getDeals({ title, storeIDs, lowerPrice, upperPrice, sortBy = 'Deal Rating', pageSize = 60, onSale = 1, AAA }) {
  const params = {
    title,
    storeID: storeIDs?.length ? storeIDs.join(',') : undefined,
    lowerPrice: lowerPrice > 0 ? lowerPrice : undefined,
    upperPrice,
    sortBy,
    desc: sortBy === 'Price' ? 0 : undefined,
    pageSize,
    onSale,
    AAA: AAA ? 1 : undefined,
  }
  return withFallback(
    () => getJSON(`${CS}/deals?${qs(params)}`),
    () => {
      const t = title?.toLowerCase()
      return snapshot.deals.filter(
        (d) =>
          (!t || d.title.toLowerCase().includes(t)) &&
          (!storeIDs?.length || storeIDs.includes(d.storeID)) &&
          (!upperPrice || +d.salePrice <= upperPrice) &&
          (!lowerPrice || +d.salePrice >= lowerPrice),
      )
    },
  )
}

/** Podpowiedzi do wyszukiwarki. */
export function searchGames(title, limit = 8) {
  return withFallback(
    () => getJSON(`${CS}/games?${qs({ title, limit })}`),
    () => {
      const t = title.toLowerCase()
      return Object.entries(snapshot.games)
        .filter(([, g]) => g.info.title.toLowerCase().includes(t))
        .slice(0, limit)
        .map(([gameID, g]) => ({
          gameID,
          external: g.info.title,
          thumb: g.info.thumb,
          steamAppID: g.info.steamAppID,
          cheapest: Math.min(...g.deals.map((d) => +d.price)).toFixed(2),
        }))
    },
  )
}

/** Szczegóły gry: oferty we wszystkich sklepach + najniższa cena w historii. */
export function getGame(id) {
  return withFallback(
    () => getJSON(`${CS}/games?id=${id}`),
    () => snapshot.games[id] ?? null,
  )
}

/** Wiele gier naraz (max 25) — do listy życzeń i alertów. */
export async function getGames(ids) {
  if (!ids.length) return {}
  const chunks = []
  for (let i = 0; i < ids.length; i += 25) chunks.push(ids.slice(i, i + 25))
  const parts = await Promise.all(
    chunks.map((c) =>
      withFallback(
        () => getJSON(`${CS}/games?ids=${c.join(',')}`, 5 * 60 * 1000),
        () => Object.fromEntries(c.filter((id) => snapshot.games[id]).map((id) => [id, snapshot.games[id]])),
      ),
    ),
  )
  return Object.assign({}, ...parts)
}

/** Dodatkowe info o grze (oceny, data premiery) z konkretnej oferty. */
export function getDealInfo(dealID) {
  return withFallback(
    () => getJSON(`${CS}/deals?id=${encodeURIComponent(decodeURIComponent(dealID))}`),
    () => null,
  )
}

/* ---------- GamerPower ---------- */

export function getGiveaways(type = 'game') {
  return withFallback(
    () => getJSON(`${GP}/filter?platform=epic-games-store.steam.gog&type=${type}`, 30 * 60 * 1000),
    () => snapshot.giveaways,
  ).then((list) => (Array.isArray(list) ? list : []))
}

/* ---------- Kursy walut ---------- */

export function getRates() {
  return withFallback(
    () => getJSON(FX, 12 * 3600 * 1000).then((r) => r.rates),
    () => snapshot.rates,
  ).then((rates) => ({ USD: 1, ...rates }))
}
