import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Bell, Heart, ShoppingCart, Trophy, PiggyBank, CalendarDays, SearchX, ExternalLink } from 'lucide-react'
import { dealLink, getDealInfo, getGame, steamHeader, storeIcon } from '../lib/api'
import { storeTrust } from '../lib/catalog'
import { bestDeal, plural, useApp, useCurrency } from '../lib/hooks'
import ExternalSites from './ExternalSites'
import { Badge, DiscountTag, EmptyState, GameImage, SectionTitle, TrustBadge } from './ui'

const officialFirst = (o) => (storeTrust(o.storeID) === 'official' ? 0 : 1)
const dateFmt =(unix) => new Date(unix * 1000).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })

export default function GameView({ id, filters }) {
  const { stores, isWished, toggleWish, openAlert } = useApp()
  const { fmt } = useCurrency()
  const [game, setGame] = useState(undefined)
  const [info, setInfo] = useState(null)

  useEffect(() => {
    let alive = true
    setGame(undefined)
    setInfo(null)
    getGame(id).then((g) => {
      if (!alive) return
      setGame(g && g.info ? g : null)
      const best = bestDeal(g)
      if (best) getDealInfo(best.dealID).then((i) => alive && setInfo(i?.gameInfo ?? null))
    })
    return () => {
      alive = false
    }
  }, [id])

  const offers = useMemo(
    () => (game?.deals ?? []).filter((d) => stores?.[d.storeID]?.active !== false).sort((a, b) => a.price - b.price || officialFirst(a) - officialFirst(b)),
    [game, stores],
  )

  if (game === undefined) return <GameSkeleton />
  if (game === null)
    return (
      <EmptyState icon={SearchX} title="Nie znaleźliśmy tej gry">
        Może zniknęła z bazy sklepów. <a href="#/" className="text-violet-300 underline">Wróć do okazji</a>.
      </EmptyState>
    )

  const title = game.info.title
  const ref = { gameID: String(id), title, thumb: game.info.thumb, steamAppID: game.info.steamAppID }
  const best = offers[0]
  const atl = Number(game.cheapestPriceEver?.price)
  const steamOffer = offers.find((o) => o.storeID === '1')
  const base = steamOffer ? Number(steamOffer.retailPrice) : Math.max(...offers.map((o) => Number(o.retailPrice)))
  const wished = isWished(id)

  return (
    <div className="space-y-8">
      <a href="#/" className="inline-flex items-center gap-1.5 text-sm text-mute hover:text-white">
        <ArrowLeft className="size-4" aria-hidden /> Wszystkie okazje
      </a>

      {/* nagłówek gry */}
      <section className="panel grid overflow-hidden md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <GameImage
          srcs={[steamHeader(game.info.steamAppID), game.info.thumb]}
          alt={title}
          className="aspect-[460/215] w-full md:h-full"
        />
        <div className="flex flex-col gap-4 p-5 sm:p-7">
          <h1 className="font-display text-2xl leading-tight font-bold text-white sm:text-3xl">{title}</h1>
          <div className="flex flex-wrap gap-2">
            {Number(info?.metacriticScore) > 0 && <Badge tone="violet">Metacritic {info.metacriticScore}</Badge>}
            {Number(info?.steamRatingPercent) > 0 && (
              <Badge tone={info.steamRatingPercent >= 80 ? 'emerald' : 'amber'}>
                Steam {info.steamRatingPercent}% · {info.steamRatingText}
              </Badge>
            )}
            {info?.releaseDate > 0 && (
              <Badge>
                <CalendarDays className="size-3" aria-hidden /> {dateFmt(info.releaseDate)}
              </Badge>
            )}
          </div>
          {best && (
            <div className="mt-auto flex flex-wrap items-end gap-x-4 gap-y-2">
              <div>
                <p className="label">Najtaniej teraz</p>
                <p className="num text-3xl font-bold text-emerald-300">{fmt(best.price)}</p>
                <p className="text-xs text-mute">w {stores?.[best.storeID]?.name}</p>
              </div>
              {Number(best.savings) > 0 && <DiscountTag savings={best.savings} className="mb-6 text-sm" />}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {best && (
              <a href={dealLink(best.dealID)} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                <ShoppingCart className="size-4" aria-hidden /> Kup najtaniej
              </a>
            )}
            <button
              onClick={() => openAlert(ref, best ? Number(best.price) : 0, atl)}
              className="btn btn-ghost"
            >
              <Bell className="size-4" aria-hidden /> Alert cenowy
            </button>
            <button
              onClick={() => toggleWish(ref)}
              aria-pressed={wished}
              className={`btn btn-ghost ${wished ? 'border-rose-400/60 text-rose-200' : ''}`}
            >
              <Heart className={`size-4 ${wished ? 'fill-current' : ''}`} aria-hidden />
              {wished ? 'W ulubionych' : 'Do ulubionych'}
            </button>
          </div>
        </div>
      </section>

      {best && (
        <section className="grid gap-4 md:grid-cols-3">
          <SavingsCard best={Number(best.price)} base={base} fromSteam={!!steamOffer} />
          <PriceScale best={Number(best.price)} atl={atl} atlDate={game.cheapestPriceEver?.date} retail={base} />
        </section>
      )}

      {/* tabela porównania */}
      <section className="space-y-4">
        <SectionTitle eyebrow="Ceny na żywo, od najniższej" right={<span className="num text-sm text-mute">{plural(offers.length, 'sklep', 'sklepy', 'sklepów')}</span>}>
          Porównanie ofert
        </SectionTitle>
        {offers.length === 0 ? (
          <EmptyState icon={SearchX} title="Brak ofert w oficjalnych sklepach">
            Sprawdź marketplace'y poniżej.
          </EmptyState>
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead>
                <tr className="border-b border-ink-700 text-left">
                  {['Sklep', 'Zaufanie', 'Typ', 'Rabat', 'Cena', ''].map((h, i) => (
                    <th key={i} scope="col" className={`label px-4 py-3 font-semibold ${i >= 3 ? 'text-right' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {offers.map((o, i) => {
                  const isAtl = Number(o.price) <= atl
                  const trust = storeTrust(o.storeID)
                  return (
                    <tr
                      key={o.dealID}
                      className={`border-b border-ink-700/60 last:border-0 ${i === 0 ? 'bg-emerald-400/[0.06]' : 'hover:bg-ink-850'}`}
                    >
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2.5">
                          <img src={storeIcon(o.storeID)} alt="" className="size-5" loading="lazy" />
                          <span className="font-semibold text-white">{stores?.[o.storeID]?.name}</span>
                          {i === 0 && <Badge tone="emerald">Najtaniej</Badge>}
                          {isAtl && (
                            <Badge tone="amber" title="Cena równa najniższej w historii">
                              <Trophy className="size-3" aria-hidden /> All-Time Low
                            </Badge>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <TrustBadge trust={trust} compact />
                      </td>
                      <td className="px-4 py-3 text-zinc-300">{trust === 'official' ? 'Sklep platformy' : 'Klucz (autoryzowany)'}</td>
                      <td className="px-4 py-3 text-right">
                        {Number(o.savings) > 0 ? <DiscountTag savings={o.savings} /> : <span className="text-mute">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Number(o.savings) > 0 && (
                          <span className="num mr-2 text-xs text-mute line-through">{fmt(o.retailPrice)}</span>
                        )}
                        <span className={`num font-bold ${i === 0 ? 'text-emerald-300' : 'text-white'}`}>{fmt(o.price)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={dealLink(o.dealID)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-ink-600 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 hover:border-violet-400/60 hover:text-white"
                        >
                          Do sklepu <ExternalLink className="size-3" aria-hidden />
                        </a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-mute">
          Ceny pochodzą z amerykańskich wersji sklepów (USD) i są przeliczane po kursie EBC. W polskim regionie cena może
          się nieznacznie różnić.
        </p>
      </section>

      <section className="panel space-y-4 p-5">
        <SectionTitle eyebrow="Klucze z marketplace, konta, konsole">Sprawdź też tutaj</SectionTitle>
        <ExternalSites query={title} filters={filters} />
      </section>
    </div>
  )
}

function SavingsCard({ best, base, fromSteam }) {
  const { fmt } = useCurrency()
  const saved = Math.max(0, base - best)
  const pct = base ? Math.round((saved / base) * 100) : 0
  return (
    <div className="panel flex flex-col justify-between gap-3 p-5">
      <span className="flex items-center justify-between">
        <span className="label">Kalkulator oszczędności</span>
        <PiggyBank className="size-5 text-emerald-300" aria-hidden />
      </span>
      {saved > 0 ? (
        <p className="text-sm text-zinc-300">
          Oszczędzasz <span className="num block font-display text-3xl font-bold text-emerald-300">{fmt(saved)}</span>
          względem {fromSteam ? 'ceny bazowej na Steam' : 'ceny katalogowej'} ({fmt(base)}), czyli{' '}
          <span className="num font-semibold text-white">{pct}%</span>.
        </p>
      ) : (
        <p className="text-sm text-zinc-300">
          Teraz brak rabatu względem {fromSteam ? 'ceny na Steam' : 'ceny katalogowej'} ({fmt(base)}). Ustaw alert cenowy,
          a damy znać, gdy stanieje.
        </p>
      )}
    </div>
  )
}

/** Skala: 0 … cena katalogowa, z zaznaczoną najniższą ceną w historii i aktualną. Tylko prawdziwe dane. */
function PriceScale({ best, atl, atlDate, retail }) {
  const { fmt } = useCurrency()
  const max = Math.max(retail, best, atl) || 1
  const pos = (v) => Math.min(100, (v / max) * 100)
  const atAtl = best <= atl
  return (
    <div className="panel space-y-4 p-5 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="label">Aktualna cena vs najniższa w historii</span>
        {atAtl ? (
          <Badge tone="amber">
            <Trophy className="size-3" aria-hidden /> Najniższa cena w historii
          </Badge>
        ) : (
          <span className="text-xs text-mute">
            <span className="num text-zinc-200">{fmt(best - atl)}</span> powyżej rekordu
          </span>
        )}
      </div>

      <div className="relative pt-7 pb-8" role="img" aria-label={`Najniższa w historii ${fmt(atl)}, teraz ${fmt(best)}, cena katalogowa ${fmt(retail)}`}>
        <div className="h-2.5 rounded-full bg-ink-700" />
        <div className="absolute top-7 left-0 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-violet-400" style={{ width: `${pos(best)}%` }} />
        <Marker left={pos(atl)} tone="bg-amber-300" label={fmt(atl)} sub="rekord" below />
        <Marker left={pos(best)} tone="bg-white" label={fmt(best)} sub="teraz" />
        <span className="num absolute right-0 bottom-0 text-xs text-mute">{fmt(retail)} katalogowa</span>
      </div>

      {atlDate && <p className="text-xs text-mute">Rekordowo niska cena: {dateFmt(atlDate)}.</p>}
    </div>
  )
}

function Marker({ left, tone, label, sub, below }) {
  return (
    <span className="absolute top-7 -translate-x-1/2" style={{ left: `${left}%` }}>
      <span className={`block h-2.5 w-1 rounded-full ${tone} ring-2 ring-ink-900`} />
      <span
        className={`num absolute text-xs whitespace-nowrap ${
          left < 18 ? 'left-0' : left > 82 ? 'right-0' : 'left-1/2 -translate-x-1/2'
        } ${
          below ? 'top-4 text-amber-200' : '-top-6 font-bold text-white'
        }`}
      >
        {label} <span className="font-sans font-normal text-mute">{sub}</span>
      </span>
    </span>
  )
}

function GameSkeleton() {
  return (
    <div className="space-y-6">
      <div className="skeleton h-5 w-40" />
      <div className="panel grid overflow-hidden md:grid-cols-2">
        <div className="skeleton aspect-[460/215] rounded-none" />
        <div className="space-y-4 p-7">
          <div className="skeleton h-8 w-3/4" />
          <div className="skeleton h-5 w-1/2" />
          <div className="skeleton h-10 w-1/3" />
        </div>
      </div>
      <div className="skeleton h-64 w-full" />
    </div>
  )
}
