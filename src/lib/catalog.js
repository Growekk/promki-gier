// Katalog sklepów: poziom zaufania, typ oferty, platformy.
// Sklepy z CheapShark mają PRAWDZIWE ceny. Marketplace'y i rynki kont nie mają
// publicznego API, więc dostają linki do wyszukiwania danej gry u nich — bez wymyślonych cen.

export const PLATFORMS = [
  { id: 'steam', label: 'Steam' },
  { id: 'epic', label: 'Epic Games' },
  { id: 'gog', label: 'GOG' },
  { id: 'playstation', label: 'PlayStation' },
  { id: 'xbox', label: 'Xbox' },
  { id: 'switch', label: 'Nintendo Switch' },
]
export const PC_PLATFORMS = ['steam', 'epic', 'gog']

export const OFFER_TYPES = [
  { id: 'official', label: 'Oficjalny sklep / klucz', short: 'Oficjalny' },
  { id: 'marketplace', label: 'Klucz z marketplace', short: 'Marketplace' },
  { id: 'account', label: 'Dostęp do konta', short: 'Konto' },
]

export const TRUST = {
  official: {
    label: 'Oficjalny sklep',
    level: 3,
    tone: 'emerald',
    hint: 'Sklep samej platformy. Najbezpieczniej, pełne prawa konsumenta.',
  },
  authorized: {
    label: 'Autoryzowany sprzedawca',
    level: 3,
    tone: 'emerald',
    hint: 'Klucze kupowane bezpośrednio od wydawców. Bezpieczne.',
  },
  marketplace: {
    label: 'Marketplace',
    level: 2,
    tone: 'amber',
    hint: 'Sprzedają osoby i firmy trzecie. Taniej, ale sprawdzaj oceny sprzedawcy i region klucza.',
  },
  account: {
    label: 'Konto (ryzyko)',
    level: 1,
    tone: 'rose',
    hint: 'Zakup lub współdzielenie konta łamie regulaminy Steam, PSN, Xbox i Nintendo. Grozi utratą dostępu lub banem.',
  },
}

/** Metadane sklepów CheapShark (storeID → zaufanie i platformy kluczy). */
export const STORE_META = {
  1: { trust: 'official', platforms: ['steam'] },
  7: { trust: 'official', platforms: ['gog'] },
  25: { trust: 'official', platforms: ['epic'] },
  13: { trust: 'official', platforms: ['ubisoft'] },
  2: { trust: 'authorized', platforms: ['steam'] },
  3: { trust: 'authorized', platforms: ['steam'] },
  11: { trust: 'authorized', platforms: ['steam'] },
  15: { trust: 'authorized', platforms: ['steam'] },
  21: { trust: 'authorized', platforms: ['steam'] },
  23: { trust: 'authorized', platforms: ['steam'] },
  27: { trust: 'authorized', platforms: ['steam'] },
  28: { trust: 'authorized', platforms: ['steam'] },
  30: { trust: 'authorized', platforms: ['steam'] },
  35: { trust: 'authorized', platforms: ['steam'] },
}
export const storeTrust = (storeID) => STORE_META[storeID]?.trust ?? 'authorized'

/** storeID-y CheapShark pasujące do wybranych platform (pusta tablica wyboru = wszystkie). */
export function storeIDsFor(platforms, stores) {
  const active = Object.values(stores ?? {}).filter((s) => s.active).map((s) => s.id)
  if (!platforms.length) return active
  return active.filter((id) => (STORE_META[id]?.platforms ?? ['steam']).some((p) => platforms.includes(p)))
}

/* ---------- Strony bez API: linki do wyszukiwania ---------- */

const enc = encodeURIComponent
const google = (domain, extra = '') => (q) =>
  `https://www.google.com/search?q=${enc(`site:${domain} ${q} ${extra}`.trim())}`
const ALL = ['steam', 'epic', 'gog', 'playstation', 'xbox', 'switch']

/** group: 'compare' (porównywarki) | 'official' | 'marketplace' | 'account' */
export const EXTERNAL_SITES = [
  // Porównywarki
  { name: 'GG.deals', group: 'compare', platforms: ALL, region: 'Global', url: (q) => `https://gg.deals/games/?title=${enc(q)}` },
  { name: 'AllKeyShop', group: 'compare', platforms: ALL, region: 'EU', url: (q) => `https://www.allkeyshop.com/blog/products/?search_name=${enc(q)}` },
  { name: 'DLCompare', group: 'compare', platforms: ALL, region: 'EU', url: (q) => `https://www.dlcompare.com/search?q=${enc(q)}` },
  { name: 'SteamDB', group: 'compare', platforms: ['steam'], region: 'Global', url: (q) => `https://steamdb.info/search/?a=app&q=${enc(q)}` },
  { name: 'PSPrices', group: 'compare', platforms: ['playstation'], region: 'PL', url: google('psprices.com/region-pl') },
  { name: 'XB Deals', group: 'compare', platforms: ['xbox'], region: 'PL', url: (q) => `https://xbdeals.net/pl-store/search?search_query=${enc(q)}` },
  { name: 'Deku Deals', group: 'compare', platforms: ['switch'], region: 'Global', url: (q) => `https://www.dekudeals.com/search?q=${enc(q)}` },

  // Oficjalne sklepy (bez cen w API albo konsolowe)
  { name: 'Steam', group: 'official', platforms: ['steam'], region: 'PL', url: (q) => `https://store.steampowered.com/search/?term=${enc(q)}` },
  { name: 'Epic Games Store', group: 'official', platforms: ['epic'], region: 'PL', url: (q) => `https://store.epicgames.com/pl/browse?q=${enc(q)}` },
  { name: 'GOG', group: 'official', platforms: ['gog'], region: 'PL', url: (q) => `https://www.gog.com/en/games?query=${enc(q)}` },
  { name: 'PlayStation Store', group: 'official', platforms: ['playstation'], region: 'PL', url: (q) => `https://store.playstation.com/pl-pl/search/${enc(q)}` },
  { name: 'Xbox Store', group: 'official', platforms: ['xbox'], region: 'PL', url: (q) => `https://www.xbox.com/pl-PL/search/results/games?q=${enc(q)}` },
  { name: 'Nintendo eShop', group: 'official', platforms: ['switch'], region: 'PL', url: google('nintendo.com/pl-pl') },
  { name: 'Fanatical', group: 'official', platforms: ['steam', 'epic', 'gog'], region: 'Global', url: (q) => `https://www.fanatical.com/en/search?search=${enc(q)}` },
  { name: 'Humble Store', group: 'official', platforms: ['steam', 'gog'], region: 'Global', url: (q) => `https://www.humblebundle.com/store/search?search=${enc(q)}` },

  // Marketplace'y z kluczami
  { name: 'Eneba', group: 'marketplace', platforms: ALL, region: 'EU', url: (q) => `https://www.eneba.com/store/all?text=${enc(q)}` },
  { name: 'G2A', group: 'marketplace', platforms: ALL, region: 'PL', url: (q) => `https://www.g2a.com/search?query=${enc(q)}` },
  { name: 'Kinguin', group: 'marketplace', platforms: ALL, region: 'EU', url: (q) => `https://www.kinguin.net/listing?phrase=${enc(q)}` },
  { name: 'Instant Gaming', group: 'marketplace', platforms: ALL, region: 'EU', url: (q) => `https://www.instant-gaming.com/en/search/?q=${enc(q)}` },
  { name: 'Gamivo', group: 'marketplace', platforms: ALL, region: 'EU', url: (q) => `https://www.gamivo.com/search/${enc(q)}` },
  { name: 'Driffle', group: 'marketplace', platforms: ALL, region: 'Global', url: (q) => `https://driffle.com/pl/search?q=${enc(q)}` },
  { name: 'Loaded (CDKeys)', group: 'marketplace', platforms: ['steam', 'playstation', 'xbox', 'switch'], region: 'EU', url: (q) => `https://www.loaded.com/catalogsearch/result/?q=${enc(q)}` },
  { name: 'K4G', group: 'marketplace', platforms: ['steam', 'epic', 'xbox'], region: 'EU', url: google('k4g.com') },
  { name: 'HRK Game', group: 'marketplace', platforms: ['steam'], region: 'Global', url: google('hrkgame.com') },
  { name: 'Allegro', group: 'marketplace', platforms: ALL, region: 'PL', url: (q) => `https://allegro.pl/listing?string=${enc(q + ' klucz')}` },

  // Rynki kont: konta z grą (np. „FC 27 – Steam – Account – Full Access”), bez przelewów monet / player trade.
  // Gdy wybrano dokładnie jedną platformę, dopisujemy ją do zapytania (np. „… Steam Account”).
  { name: 'G2A — konta', group: 'account', platforms: ALL, region: 'PL', url: (q) => `https://www.g2a.com/search?query=${enc(q)}&f%5Btype%5D%5B0%5D=9` },
  { name: 'Kinguin — konta', group: 'account', platforms: ALL, region: 'EU', url: (q, p) => `https://www.kinguin.net/listing?phrase=${enc(withPlatform(q, p, 'Account'))}` },
  { name: 'Z2U', group: 'account', platforms: ALL, region: 'Global', url: (q, p) => `https://www.z2u.com/search?keyword=${enc(withPlatform(q, p, 'Account'))}` },
  { name: 'Allegro — konta', group: 'account', platforms: ALL, region: 'PL', url: (q, p) => `https://allegro.pl/listing?string=${enc(withPlatform(q, p, 'konto'))}` },
]

const PLATFORM_WORD = { steam: 'Steam', epic: 'Epic', gog: 'GOG', playstation: 'PS5', xbox: 'Xbox', switch: 'Switch' }
function withPlatform(q, platforms = [], suffix) {
  const word = platforms.length === 1 ? PLATFORM_WORD[platforms[0]] : ''
  return [q, word, suffix].filter(Boolean).join(' ')
}

export const GROUP_LABEL = {
  compare: 'Porównywarki',
  official: 'Oficjalne sklepy',
  marketplace: 'Marketplace z kluczami',
  account: 'Rynki kont',
}

/** Strony pasujące do filtrów (pusta lista platform = wszystkie). */
export function sitesFor({ platforms, types, hideAccounts }) {
  return EXTERNAL_SITES.filter((s) => {
    if (platforms.length && !s.platforms.some((p) => platforms.includes(p))) return false
    if (s.group === 'compare') return true
    if (s.group === 'account' && hideAccounts) return false
    return types.includes(s.group)
  })
}
