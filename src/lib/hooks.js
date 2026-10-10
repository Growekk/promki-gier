import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { offlineStore } from './api'

/* ---------- localStorage ---------- */

function read(key, initial) {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? initial : JSON.parse(raw)
  } catch {
    return initial
  }
}

/** useState zapisywany w localStorage (z try/catch — tryb prywatny itp.). */
export function useStored(key, initial) {
  const [value, setValue] = useState(() => read(key, initial))
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* brak dostępu do storage — działa tylko w tej sesji */
    }
  }, [key, value])
  return [value, setValue]
}

/* ---------- routing po hashu (działa na GitHub Pages bez przekierowań) ---------- */

export function useHashRoute() {
  const get = () => decodeURIComponent(location.hash.replace(/^#\/?/, ''))
  const [route, setRoute] = useState(get)
  useEffect(() => {
    const on = () => {
      setRoute(get())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
export const go = (path) => {
  location.hash = '/' + path
}

export const useOffline = () => useSyncExternalStore(offlineStore.subscribe, offlineStore.get)

export function useDebounced(value, ms = 250) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/* ---------- waluty ---------- */

export const CURRENCIES = ['PLN', 'EUR', 'USD']
export const CurrencyContext = createContext(null)

export function useCurrencyState(rates) {
  const [currency, setCurrency] = useStored('pg:currency', 'PLN')
  const rate = rates?.[currency] ?? 1
  const fmt = useCallback(
    (usd, opts = {}) => {
      const n = Number(usd) * rate
      if (!Number.isFinite(n)) return '—'
      if (n === 0 && !opts.zero) return 'Za darmo'
      return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency,
        maximumFractionDigits: opts.round ? 0 : 2,
        minimumFractionDigits: opts.round ? 0 : 2,
      }).format(n)
    },
    [currency, rate],
  )
  const toUSD = useCallback((amount) => amount / rate, [rate])
  const fromUSD = useCallback((usd) => usd * rate, [rate])
  return { currency, setCurrency, rate, fmt, toUSD, fromUSD }
}
export const useCurrency = () => useContext(CurrencyContext)

/* ---------- toasty ---------- */

export const ToastContext = createContext(() => {})
export const useToast = () => useContext(ToastContext)

/* ---------- lista życzeń i alerty ---------- */

export const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

/** Minimalny opis gry do zapisania w localStorage. */
export const gameRef = ({ gameID, title, thumb, steamAppID }) => ({ gameID: String(gameID), title, thumb, steamAppID })

/** Najlepsza oferta z odpowiedzi /games. */
export function bestDeal(game) {
  if (!game?.deals?.length) return null
  return game.deals.reduce((a, b) => (+b.price < +a.price ? b : a))
}

export function timeLeft(dateStr) {
  if (!dateStr || dateStr === 'N/A') return null
  const end = new Date(dateStr.replace(' ', 'T'))
  const ms = end - Date.now()
  if (!Number.isFinite(ms)) return null
  if (ms <= 0) return 'kończy się'
  const h = Math.floor(ms / 3600e3)
  if (h < 24) return `${h} godz.`
  const d = Math.floor(h / 24)
  return d === 1 ? '1 dzień' : `${d} dni`
}

/** Polska odmiana: plural(5, 'oferta', 'oferty', 'ofert') → '5 ofert' */
export function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100
  const word = n === 1 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many
  return `${n} ${word}`
}
