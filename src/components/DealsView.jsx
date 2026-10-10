import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Gift, SlidersHorizontal, SearchX, Info } from 'lucide-react'
import { getDeals, getGiveaways, steamHeader } from '../lib/api'
import { PC_PLATFORMS, storeIDsFor } from '../lib/catalog'
import { go, useApp, useCurrency } from '../lib/hooks'
import SearchBox from './SearchBox'
import { FilterChips, FilterPanel, PRICE_MAX } from './Filters'
import DealCard, { DealCardSkeleton } from './DealCard'
import ExternalSites from './ExternalSites'
import { DiscountTag, EmptyState, GameImage, SectionTitle } from './ui'

export default function DealsView({ query, setQuery, filters, setFilters }) {
  const { stores } = useApp()
  const [deals, setDeals] = useState(null)

  const consoleOnly = filters.platforms.length > 0 && !filters.platforms.some((p) => PC_PLATFORMS.includes(p))
  const officialOff = !filters.types.includes('official')
  const liveAvailable = !consoleOnly && !officialOff

  const storeIDs = useMemo(
    () => (filters.platforms.length ? storeIDsFor(filters.platforms, stores) : undefined),
    [filters.platforms, stores],
  )

  useEffect(() => {
    if (!liveAvailable || !stores) return
    let alive = true
    setDeals(null)
    getDeals({
      title: query || undefined,
      storeIDs,
      lowerPrice: filters.price[0],
      upperPrice: filters.price[1] >= PRICE_MAX ? undefined : filters.price[1],
      sortBy: filters.sortBy,
      AAA: filters.aaa,
      onSale: !query, // przy wyszukiwaniu pokazuj też gry bez promocji (pełna cena)
    }).then((d) => alive && setDeals(d))
    return () => {
      alive = false
    }
  }, [query, storeIDs, filters.price, filters.sortBy, filters.aaa, liveAvailable, stores])

  // rabat filtrujemy lokalnie; z jednej gry zostawiamy najlepszą ofertę
  const visible = useMemo(() => {
    if (!deals) return null
    const seen = new Set()
    return deals.filter((d) => {
      if (Number(d.savings) < filters.minDiscount || seen.has(d.gameID)) return false
      seen.add(d.gameID)
      return true
    })
  }, [deals, filters.minDiscount])

  return (
    <div className="space-y-10">
      <Bento query={query} setQuery={setQuery} filters={filters} setFilters={setFilters} />

      <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <details className="group lg:hidden">
            <summary className="btn btn-ghost w-full list-none">
              <SlidersHorizontal className="size-4" aria-hidden /> Cena, rabat i sortowanie
            </summary>
            <div className="mt-3">
              <FilterPanel filters={filters} setFilters={setFilters} />
            </div>
          </details>
          <div className="hidden lg:block">
            <FilterPanel filters={filters} setFilters={setFilters} />
          </div>
        </aside>

        <section className="min-w-0 space-y-6" aria-live="polite">
          <SectionTitle
            eyebrow={query ? 'Wyniki wyszukiwania' : 'Prawdziwe ceny z oficjalnych sklepów'}
            right={
              visible && liveAvailable && <span className="num text-sm text-mute">{visible.length} ofert</span>
            }
          >
            {query ? <>„{query}”</> : 'Najlepsze okazje teraz'}
          </SectionTitle>

          {!liveAvailable ? (
            <div className="flex gap-3 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4 text-sm text-violet-100">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>
                {consoleOnly
                  ? 'Sklepy konsolowe nie udostępniają publicznego API cen. Wpisz nazwę gry, a pokażemy linki do porównywarek i sklepów dla wybranej konsoli.'
                  : 'Ceny na żywo mamy tylko dla oficjalnych sklepów. Marketplace i konta sprawdzisz w linkach poniżej. Wpisz nazwę gry.'}
              </p>
            </div>
          ) : visible === null ? (
            <Grid>
              {Array.from({ length: 9 }, (_, i) => (
                <DealCardSkeleton key={i} />
              ))}
            </Grid>
          ) : visible.length === 0 ? (
            <EmptyState icon={SearchX} title="Brak ofert dla tych filtrów">
              Poluzuj zakres ceny lub minimalny rabat. Jeśli gra nie jest teraz w promocji w żadnym sklepie, sprawdź
              marketplace'y poniżej.
            </EmptyState>
          ) : (
            <Grid>
              {visible.map((d) => (
                <DealCard key={d.dealID} deal={d} store={stores?.[d.storeID]} />
              ))}
            </Grid>
          )}

          {query && (
            <div className="panel space-y-4 p-5">
              <SectionTitle eyebrow="Klucze, konta i konsole">Sprawdź też tutaj</SectionTitle>
              <ExternalSites query={query} filters={filters} />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

const Grid = ({ children }) => <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>

/* ---------- górna siatka bento ---------- */

function Bento({ query, setQuery, filters, setFilters }) {
  const { fmt } = useCurrency()
  const { stores } = useApp()
  const [top, setTop] = useState(null)
  const [gifts, setGifts] = useState(null)

  useEffect(() => {
    getDeals({ sortBy: 'Deal Rating', pageSize: 10, AAA: true }).then((d) => setTop(d?.[0] ?? null))
    getGiveaways().then(setGifts)
  }, [])

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="panel relative p-5 sm:p-7 lg:col-span-2 lg:row-span-2">
        <p className="label text-violet-300">Porównywarka cen gier</p>
        <h1 className="mt-2 max-w-xl font-display text-3xl leading-[1.05] font-bold text-white sm:text-[2.6rem]">
          Znajdź grę w&nbsp;najniższej cenie, zanim promocja się skończy.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-mute sm:text-base">
          Ceny na żywo z Steam, GOG, Epic, Fanatical, Humble, GMG i innych. Do tego najniższa cena w historii i linki
          do Eneby, G2A, Kinguina i rynków kont.
        </p>
        <div className="mt-6">
          <SearchBox query={query} onSubmit={setQuery} />
        </div>
        <div className="mt-5">
          <FilterChips filters={filters} setFilters={setFilters} />
        </div>
      </div>

      {/* Najlepsza okazja AAA */}
      <button
        onClick={() => top && go(`gra/${top.gameID}`)}
        disabled={!top}
        className="panel group relative flex min-h-48 cursor-pointer flex-col justify-end overflow-hidden p-5 text-left"
      >
        {top ? (
          <>
            <GameImage
              srcs={[steamHeader(top.steamAppID), top.thumb]}
              alt=""
              className="absolute inset-0 h-full w-full opacity-40 transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent" />
            <span className="relative">
              <span className="label text-amber-300">Hit dnia · AAA</span>
              <span className="mt-1 block font-display text-lg leading-tight font-semibold text-white">{top.title}</span>
              <span className="mt-2 flex items-center gap-2">
                <DiscountTag savings={top.savings} />
                <span className="num font-bold text-emerald-300">{fmt(top.salePrice)}</span>
                <span className="text-xs text-mute">w {stores?.[top.storeID]?.name}</span>
              </span>
            </span>
          </>
        ) : (
          <span className="skeleton absolute inset-0 rounded-none" />
        )}
      </button>

      {/* Darmówki */}
      <a href="#/darmowe" className="panel group flex flex-col justify-between gap-4 p-5 transition-colors hover:border-amber-400/50">
        <span className="flex items-center justify-between">
          <span className="label">Rozdawane za darmo</span>
          <Gift className="size-5 text-amber-300" aria-hidden />
        </span>
        <span>
          <span className="num block font-display text-4xl font-bold text-white">{gifts ? gifts.length : '–'}</span>
          <span className="line-clamp-1 text-sm text-mute">
            {gifts?.[0] ? `m.in. ${gifts[0].title.replace(/ Giveaway$/i, '')}` : 'gier na Epic, Steam i GOG'}
          </span>
        </span>
        <span className="flex items-center gap-1 text-sm font-semibold text-amber-300">
          Odbierz za 0 zł <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </span>
      </a>
    </div>
  )
}

