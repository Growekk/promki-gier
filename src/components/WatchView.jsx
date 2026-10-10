import { useEffect, useState } from 'react'
import { Heart, Bell, Trash2, Trophy, BellRing } from 'lucide-react'
import { getGames, steamHeader } from '../lib/api'
import { bestDeal, go, useApp, useCurrency } from '../lib/hooks'
import { Badge, EmptyState, GameImage, SectionTitle } from './ui'

export default function WatchView() {
  const { wishlist, alerts, toggleWish, removeAlert, openAlert } = useApp()
  const { fmt } = useCurrency()
  const [games, setGames] = useState({})

  const ids = [...new Set([...wishlist, ...alerts].map((g) => g.gameID))]
  const key = ids.sort().join(',')
  useEffect(() => {
    getGames(key ? key.split(',') : []).then(setGames)
  }, [key])

  const priceOf = (id) => {
    const g = games[id]
    const best = bestDeal(g)
    return { best: best ? Number(best.price) : null, atl: Number(g?.cheapestPriceEver?.price) || null }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <SectionTitle eyebrow="Zapisane w tej przeglądarce" right={<Count n={alerts.length} />}>
          Alerty cenowe
        </SectionTitle>
        {alerts.length === 0 ? (
          <EmptyState icon={Bell} title="Nie masz jeszcze alertów">
            Kliknij dzwonek na karcie gry i ustaw cenę. Damy znać, gdy gra do niej stanieje.
          </EmptyState>
        ) : (
          <ul className="panel divide-y divide-ink-700/60">
            {alerts.map((a) => {
              const { best, atl } = priceOf(a.gameID)
              const hit = best !== null && best <= a.targetUSD
              const progress = best ? Math.min(100, (a.targetUSD / best) * 100) : 0
              return (
                <li key={a.gameID} className="flex flex-wrap items-center gap-4 p-4">
                  <Thumb g={a} />
                  <div className="min-w-0 flex-1">
                    <button onClick={() => go(`gra/${a.gameID}`)} className="cursor-pointer text-left font-semibold text-white hover:text-violet-200">
                      {a.title}
                    </button>
                    <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-ink-700" aria-hidden>
                      <div className={`h-full ${hit ? 'bg-emerald-400' : 'bg-violet-400'}`} style={{ width: `${progress}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-mute">
                      cel <span className="num text-zinc-200">{fmt(a.targetUSD, { zero: true })}</span> · teraz{' '}
                      <span className="num text-zinc-200">{best === null ? '…' : fmt(best)}</span>
                    </p>
                  </div>
                  {hit ? (
                    <Badge tone="emerald">
                      <BellRing className="size-3" aria-hidden /> Cena osiągnięta
                    </Badge>
                  ) : (
                    best !== null && <span className="num text-xs text-mute">brakuje {fmt(best - a.targetUSD)}</span>
                  )}
                  <div className="flex gap-1.5">
                    <button className="icon-btn" onClick={() => openAlert(a, best ?? 0, atl ?? 0)} aria-label="Zmień alert">
                      <Bell className="size-4" />
                    </button>
                    <button className="icon-btn hover:text-rose-300" onClick={() => removeAlert(a.gameID)} aria-label="Usuń alert">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle eyebrow="Wishlist" right={<Count n={wishlist.length} />}>
          Ulubione
        </SectionTitle>
        {wishlist.length === 0 ? (
          <EmptyState icon={Heart} title="Lista ulubionych jest pusta">
            Dodaj gry serduszkiem. Zobaczysz tu ich aktualną najniższą cenę i rekord.
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlist.map((w) => {
              const { best, atl } = priceOf(w.gameID)
              return (
                <article key={w.gameID} className="panel flex flex-col overflow-hidden">
                  <button onClick={() => go(`gra/${w.gameID}`)} className="cursor-pointer">
                    <GameImage srcs={[steamHeader(w.steamAppID), w.thumb]} alt="" className="aspect-[460/215] w-full" />
                  </button>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <h3 className="font-display leading-tight font-semibold text-white">{w.title}</h3>
                    <div className="mt-auto flex items-end justify-between gap-2">
                      <div>
                        <p className="num text-lg font-bold text-emerald-300">{best === null ? '…' : fmt(best)}</p>
                        {atl && (
                          <p className="text-xs text-mute">
                            rekord <span className="num">{fmt(atl)}</span>
                          </p>
                        )}
                      </div>
                      {best !== null && atl && best <= atl && (
                        <Badge tone="amber">
                          <Trophy className="size-3" aria-hidden /> All-Time Low
                        </Badge>
                      )}
                      <div className="flex gap-1.5">
                        <button className="icon-btn" onClick={() => openAlert(w, best ?? 0, atl ?? 0)} aria-label="Ustaw alert cenowy">
                          <Bell className="size-4" />
                        </button>
                        <button className="icon-btn hover:text-rose-300" onClick={() => toggleWish(w)} aria-label="Usuń z ulubionych">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

const Count = ({ n }) => <span className="num text-sm text-mute">{n}</span>

function Thumb({ g }) {
  return <GameImage srcs={[g.thumb, steamHeader(g.steamAppID)]} alt="" className="h-12 w-24 shrink-0 rounded-lg" />
}
