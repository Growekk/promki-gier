import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WifiOff, X, BellRing } from 'lucide-react'
import { getGames, getRates, getStores, SNAPSHOT_DATE } from './lib/api'
import {
  AppContext,
  bestDeal,
  CurrencyContext,
  gameRef,
  ToastContext,
  useCurrencyState,
  useHashRoute,
  useOffline,
  useStored,
} from './lib/hooks'
import Header from './components/Header'
import DealsView from './components/DealsView'
import GameView from './components/GameView'
import GiveawaysView from './components/GiveawaysView'
import WatchView from './components/WatchView'
import AlertModal from './components/AlertModal'
import { DEFAULT_FILTERS } from './components/Filters'

export default function App() {
  const route = useHashRoute()
  const offline = useOffline()
  const [stores, setStores] = useState(null)
  const [rates, setRates] = useState(null)
  const currency = useCurrencyState(rates)

  const [query, setQuery] = useState('')
  const [filters, setFilters] = useStored('pg:filters', DEFAULT_FILTERS)
  const [wishlist, setWishlist] = useStored('pg:wishlist', [])
  const [alerts, setAlerts] = useStored('pg:alerts', [])
  const [alertTarget, setAlertTarget] = useState(null)
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    getStores().then(setStores)
    getRates().then(setRates)
  }, [])

  /* ---------- toasty ---------- */
  const toast = useCallback((text, tone = 'violet') => {
    const id = Math.random()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])

  /* ---------- ulubione i alerty ---------- */
  const isWished = useCallback((id) => wishlist.some((w) => w.gameID === String(id)), [wishlist])
  const toggleWish = useCallback(
    (g) => {
      const ref = gameRef(g)
      const has = wishlist.some((w) => w.gameID === ref.gameID)
      setWishlist(has ? wishlist.filter((w) => w.gameID !== ref.gameID) : [ref, ...wishlist])
      toast(has ? `Usunięto z ulubionych: ${ref.title}` : `Dodano do ulubionych: ${ref.title}`, has ? 'zinc' : 'rose')
    },
    [wishlist, setWishlist, toast],
  )
  const openAlert = useCallback((game, current = 0, atl = 0) => setAlertTarget({ game: gameRef(game), current, atl }), [])
  const saveAlert = (targetUSD) => {
    const { game } = alertTarget
    setAlerts((list) => [{ ...game, targetUSD, createdAt: Date.now(), notified: false }, ...list.filter((a) => a.gameID !== game.gameID)])
    toast(`Alert ustawiony: ${game.title} za ${currency.fmt(targetUSD, { zero: true })}`)
    setAlertTarget(null)
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {})
  }
  const removeAlert = useCallback((id) => setAlerts((list) => list.filter((a) => a.gameID !== id)), [setAlerts])

  // sprawdzanie alertów: przy starcie i co 30 minut
  const alertsRef = useRef(alerts)
  alertsRef.current = alerts
  useEffect(() => {
    const check = async () => {
      const pending = alertsRef.current.filter((a) => !a.notified)
      if (!pending.length) return
      const games = await getGames(pending.map((a) => a.gameID))
      const hits = pending.filter((a) => {
        const best = bestDeal(games[a.gameID])
        return best && Number(best.price) <= a.targetUSD
      })
      if (!hits.length) return
      hits.forEach((a) => {
        toast(`Cena osiągnięta: ${a.title}!`, 'emerald')
        try {
          if ('Notification' in window && Notification.permission === 'granted')
            new Notification('Promki Gier: cena osiągnięta', { body: a.title, icon: './favicon.svg' })
        } catch {
          /* niektóre przeglądarki wymagają service workera — wystarczy toast */
        }
      })
      const ids = new Set(hits.map((a) => a.gameID))
      setAlerts((list) => list.map((a) => (ids.has(a.gameID) ? { ...a, notified: true } : a)))
    }
    check()
    const t = setInterval(check, 30 * 60 * 1000)
    return () => clearInterval(t)
  }, [setAlerts, toast])

  const app = useMemo(
    () => ({ stores, wishlist, alerts, isWished, toggleWish, openAlert, removeAlert }),
    [stores, wishlist, alerts, isWished, toggleWish, openAlert, removeAlert],
  )

  /* ---------- routing ---------- */
  const [section, param] = route.split('/')
  let page
  if (section === 'gra' && param) page = <GameView id={param} filters={filters} />
  else if (section === 'darmowe') page = <GiveawaysView />
  else if (section === 'obserwowane') page = <WatchView />
  else page = <DealsView query={query} setQuery={setQuery} filters={filters} setFilters={setFilters} />

  return (
    <CurrencyContext.Provider value={currency}>
      <AppContext.Provider value={app}>
        <ToastContext.Provider value={toast}>
          <Header route={route} />
          {offline && (
            <div className="border-b border-amber-400/30 bg-amber-400/10">
              <p className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-sm text-amber-200 sm:px-6">
                <WifiOff className="size-4 shrink-0" aria-hidden />
                API nie odpowiada (limit zapytań albo brak sieci). Pokazuję zapisane prawdziwe ceny z{' '}
                {SNAPSHOT_DATE.toLocaleDateString('pl-PL')}. Mogą być nieaktualne.
              </p>
            </div>
          )}
          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">{page}</main>
          <Footer />
          {alertTarget && <AlertModal target={alertTarget} onSave={saveAlert} onClose={() => setAlertTarget(null)} />}
          <Toasts toasts={toasts} dismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
        </ToastContext.Provider>
      </AppContext.Provider>
    </CurrencyContext.Provider>
  )
}

const TOAST_TONE = {
  violet: 'border-violet-400/40',
  emerald: 'border-emerald-400/50',
  rose: 'border-rose-400/40',
  zinc: 'border-ink-600',
}

function Toasts({ toasts, dismiss }) {
  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border bg-ink-850 px-4 py-3 text-sm text-zinc-100 shadow-xl shadow-black/50 ${TOAST_TONE[t.tone]}`}
        >
          {t.tone === 'emerald' && <BellRing className="size-4 shrink-0 text-emerald-300" aria-hidden />}
          <span className="flex-1">{t.text}</span>
          <button onClick={() => dismiss(t.id)} className="cursor-pointer text-mute hover:text-white" aria-label="Zamknij">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-ink-700/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-xs text-mute sm:flex-row sm:justify-between sm:px-6">
        <p>
          Ceny:{' '}
          <a className="underline hover:text-white" href="https://www.cheapshark.com" target="_blank" rel="noopener noreferrer">
            CheapShark
          </a>{' '}
          · darmówki:{' '}
          <a className="underline hover:text-white" href="https://www.gamerpower.com" target="_blank" rel="noopener noreferrer">
            GamerPower
          </a>{' '}
          · kursy: EBC (Frankfurter)
        </p>
        <p>Promki Gier nie sprzedaje gier. Linki prowadzą do sklepów.</p>
      </div>
    </footer>
  )
}
