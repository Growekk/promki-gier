import { RotateCcw, TriangleAlert } from 'lucide-react'
import { OFFER_TYPES, PLATFORMS } from '../lib/catalog'
import { useCurrency } from '../lib/hooks'

export const PRICE_MAX = 60 // USD; górna wartość suwaka = bez limitu
export const DEFAULT_FILTERS = {
  platforms: [],
  types: ['official', 'marketplace', 'account'],
  price: [0, PRICE_MAX],
  minDiscount: 0,
  hideAccounts: false,
  sortBy: 'Deal Rating',
  aaa: false,
}

const SORTS = [
  ['Deal Rating', 'Najlepsze okazje'],
  ['Savings', 'Największy rabat'],
  ['Price', 'Najniższa cena'],
  ['Metacritic', 'Metacritic'],
  ['Reviews', 'Oceny Steam'],
  ['Recent', 'Najnowsze promocje'],
]

const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

/** Chipy platform i typów — pokazywane pod wyszukiwarką. */
export function FilterChips({ filters, setFilters }) {
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }))
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Platforma">
        <span className="label w-full sm:w-20">Platforma</span>
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            className="chip"
            aria-pressed={filters.platforms.includes(p.id)}
            onClick={() => set({ platforms: toggle(filters.platforms, p.id) })}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Typ oferty">
        <span className="label w-full sm:w-20">Typ</span>
        {OFFER_TYPES.map((t) => {
          const disabled = t.id === 'account' && filters.hideAccounts
          return (
            <button
              key={t.id}
              className="chip disabled:cursor-not-allowed disabled:opacity-40"
              aria-pressed={filters.types.includes(t.id) && !disabled}
              disabled={disabled}
              onClick={() => set({ types: toggle(filters.types, t.id) })}
            >
              {t.id === 'account' && <TriangleAlert className="size-3.5 text-amber-300" aria-hidden />}
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** Panel boczny: suwaki, sortowanie, przełączniki. */
export function FilterPanel({ filters, setFilters }) {
  const { fmt } = useCurrency()
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }))
  const [lo, hi] = filters.price
  const pct = (v) => (v / PRICE_MAX) * 100

  return (
    <div className="panel space-y-6 p-5">
      <div className="flex items-center justify-between">
        <p className="font-display font-semibold text-white">Filtry</p>
        <button
          onClick={() => setFilters(DEFAULT_FILTERS)}
          className="flex cursor-pointer items-center gap-1 text-xs text-mute hover:text-white"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Wyczyść
        </button>
      </div>

      <div>
        <label htmlFor="sort" className="label">
          Sortuj
        </label>
        <select
          id="sort"
          value={filters.sortBy}
          onChange={(e) => set({ sortBy: e.target.value })}
          className="mt-2 w-full cursor-pointer rounded-lg border border-ink-600 bg-ink-850 px-3 py-2 text-sm text-white"
        >
          {SORTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="label">Cena</legend>
        <p className="num mt-2 text-sm text-white">
          {fmt(lo, { round: true, zero: true })} – {hi >= PRICE_MAX ? 'bez limitu' : fmt(hi, { round: true })}
        </p>
        <div className="dual-range relative mt-3 h-5">
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ink-700" />
          <div
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-violet-400"
            style={{ left: `${pct(lo)}%`, right: `${100 - pct(hi)}%` }}
          />
          <input
            id="price-min"
            type="range"
            min={0}
            max={PRICE_MAX}
            step={1}
            value={lo}
            aria-label="Cena minimalna"
            onChange={(e) => set({ price: [Math.min(+e.target.value, hi - 1), hi] })}
            className="range"
          />
          <input
            id="price-max"
            type="range"
            min={0}
            max={PRICE_MAX}
            step={1}
            value={hi}
            aria-label="Cena maksymalna"
            onChange={(e) => set({ price: [lo, Math.max(+e.target.value, lo + 1)] })}
            className="range"
          />
        </div>
      </fieldset>

      <div>
        <label htmlFor="discount" className="label">
          Minimalny rabat
        </label>
        <p className="num mt-2 text-sm text-white">
          {filters.minDiscount ? `co najmniej −${filters.minDiscount}%` : 'dowolny'}
        </p>
        <input
          id="discount"
          type="range"
          min={0}
          max={90}
          step={10}
          value={filters.minDiscount}
          onChange={(e) => set({ minDiscount: +e.target.value })}
          className="mt-3 w-full cursor-pointer accent-violet-400"
        />
        <div className="num mt-1 flex justify-between text-[10px] text-mute">
          <span>0%</span>
          <span>50%</span>
          <span>90%</span>
        </div>
      </div>

      <div className="space-y-3">
        <Switch
          id="aaa"
          checked={filters.aaa}
          onChange={(v) => set({ aaa: v })}
          label="Tylko gry AAA"
          hint="Cena katalogowa od 29,99 USD"
        />
        <Switch
          id="hide-accounts"
          checked={filters.hideAccounts}
          onChange={(v) => set({ hideAccounts: v })}
          label="Ukryj oferty kont"
          hint="Konta łamią regulaminy platform"
        />
      </div>
    </div>
  )
}

function Switch({ id, checked, onChange, label, hint }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-3">
      <span>
        <span className="block text-sm font-medium text-zinc-200">{label}</span>
        <span className="block text-xs text-mute">{hint}</span>
      </span>
      <span className="relative mt-0.5 shrink-0">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="block h-5 w-9 rounded-full bg-ink-600 transition-colors peer-checked:bg-violet-500 peer-focus-visible:outline-2 peer-focus-visible:outline-violet-400" />
        <span className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  )
}
