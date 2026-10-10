import { useEffect, useRef, useState } from 'react'
import { Search, X, Loader2, History } from 'lucide-react'
import { searchGames, steamHeader } from '../lib/api'
import { go, useCurrency, useDebounced, useStored } from '../lib/hooks'
import { GameImage } from './ui'

/** Wyszukiwarka z podpowiedziami na żywo. Enter = filtruj okazje, wybór podpowiedzi = widok gry. */
export default function SearchBox({ query, onSubmit }) {
  const { fmt } = useCurrency()
  const [text, setText] = useState(query)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const [recent, setRecent] = useStored('pg:recent', [])
  const debounced = useDebounced(text.trim(), 250)
  const inputRef = useRef(null)
  const boxRef = useRef(null)

  useEffect(() => setText(query), [query])

  useEffect(() => {
    if (debounced.length < 2) return setItems([])
    let alive = true
    setLoading(true)
    searchGames(debounced, 7)
      .then((r) => alive && setItems(r))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [debounced])

  // skrót klawiszowy "/"
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName)) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    const onClick = (e) => !boxRef.current?.contains(e.target) && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [])

  const remember = (q) => q && setRecent((r) => [q, ...r.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 6))

  const submit = (q = text.trim()) => {
    remember(q)
    setOpen(false)
    onSubmit(q)
  }
  const pick = (g) => {
    remember(g.external)
    setOpen(false)
    go(`gra/${g.gameID}`)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(a + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      active >= 0 && items[active] ? pick(items[active]) : submit()
    } else if (e.key === 'Escape') setOpen(false)
  }

  const showList = open && (items.length > 0 || loading || (text.trim().length < 2 && recent.length > 0))

  return (
    <div ref={boxRef} className="relative">
      <label htmlFor="search" className="sr-only">
        Szukaj gry
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-ink-600 bg-ink-850 px-4 py-3 transition-colors focus-within:border-violet-400/70 focus-within:bg-ink-800">
        {loading ? (
          <Loader2 className="size-5 shrink-0 animate-spin text-violet-400" aria-hidden />
        ) : (
          <Search className="size-5 shrink-0 text-mute" aria-hidden />
        )}
        <input
          id="search"
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Wpisz nazwę gry, np. Cyberpunk 2077"
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls="search-list"
          className="min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-mute focus:outline-none"
        />
        {text ? (
          <button
            onClick={() => {
              setText('')
              onSubmit('')
              inputRef.current?.focus()
            }}
            className="cursor-pointer text-mute hover:text-white"
            aria-label="Wyczyść"
          >
            <X className="size-4" />
          </button>
        ) : (
          <kbd className="hidden rounded border border-ink-600 px-1.5 text-[11px] text-mute sm:block">/</kbd>
        )}
        <button onClick={() => submit()} className="btn btn-primary hidden py-2 sm:inline-flex">
          Szukaj
        </button>
      </div>

      {showList && (
        <ul
          id="search-list"
          role="listbox"
          className="panel absolute inset-x-0 top-full z-30 mt-2 max-h-[60vh] overflow-auto bg-ink-900 p-1.5 shadow-2xl shadow-black/60"
        >
          {text.trim().length < 2
            ? recent.map((r) => (
                <li key={r}>
                  <button
                    onClick={() => {
                      setText(r)
                      submit(r)
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-300 hover:bg-ink-800"
                  >
                    <History className="size-4 text-mute" aria-hidden /> {r}
                  </button>
                </li>
              ))
            : items.map((g, i) => (
                <li key={g.gameID} role="option" aria-selected={i === active}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(g)}
                    className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left ${
                      i === active ? 'bg-ink-800' : ''
                    }`}
                  >
                    <GameImage
                      srcs={[g.thumb, steamHeader(g.steamAppID)]}
                      alt=""
                      className="h-10 w-20 shrink-0 rounded-md"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{g.external}</span>
                    <span className="shrink-0 text-right">
                      <span className="block text-[10px] uppercase tracking-wider text-mute">od</span>
                      <span className="num text-sm font-bold text-emerald-300">{fmt(g.cheapest)}</span>
                    </span>
                  </button>
                </li>
              ))}
          {loading && items.length === 0 && <li className="px-3 py-2 text-sm text-mute">Szukam…</li>}
        </ul>
      )}
    </div>
  )
}
