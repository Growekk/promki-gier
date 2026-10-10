import { useEffect, useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'
import { useCurrency } from '../lib/hooks'

/** Modal ustawiania alertu cenowego. Cel zapisywany w USD, wyświetlany w wybranej walucie. */
export default function AlertModal({ target, onSave, onClose }) {
  const { fmt, currency, fromUSD, toUSD } = useCurrency()
  const { game, current, atl } = target
  const suggested = current > 0 ? Math.max(0.01, (atl && atl < current ? atl : current * 0.8)) : 5
  const [value, setValue] = useState(() => fromUSD(suggested).toFixed(2))
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.select()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const presets = [
    current > 0 && { label: '−10%', usd: current * 0.9 },
    current > 0 && { label: '−25%', usd: current * 0.75 },
    atl > 0 && { label: 'Rekord', usd: atl },
  ].filter(Boolean)

  const num = parseFloat(String(value).replace(',', '.'))
  const valid = Number.isFinite(num) && num >= 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onSave(toUSD(num))
        }}
        className="panel w-full max-w-md space-y-5 bg-ink-900 p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="label flex items-center gap-1.5 text-violet-300">
              <Bell className="size-3.5" aria-hidden /> Alert cenowy
            </p>
            <h2 id="alert-title" className="mt-1 font-display text-xl font-semibold text-white">
              {game.title}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="icon-btn shrink-0" aria-label="Zamknij">
            <X className="size-4" />
          </button>
        </div>

        {current > 0 && (
          <p className="text-sm text-mute">
            Teraz najtaniej: <span className="num font-semibold text-white">{fmt(current)}</span>
            {atl > 0 && (
              <>
                {' '}· rekord: <span className="num font-semibold text-amber-200">{fmt(atl)}</span>
              </>
            )}
          </p>
        )}

        <div>
          <label htmlFor="alert-price" className="label">
            Powiadom mnie, gdy cena spadnie do
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-850 px-4 py-3 focus-within:border-violet-400/70">
            <input
              id="alert-price"
              ref={inputRef}
              inputMode="decimal"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="num min-w-0 flex-1 bg-transparent text-2xl font-bold text-white focus:outline-none"
            />
            <span className="num text-mute">{currency}</span>
          </div>
          {presets.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {presets.map((p) => (
                <button key={p.label} type="button" className="chip text-xs" onClick={() => setValue(fromUSD(p.usd).toFixed(2))}>
                  {p.label} · <span className="num">{fmt(p.usd)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-mute">
          Alert zapisuje się w tej przeglądarce. Sprawdzamy ceny przy każdym otwarciu strony i co 30 minut, gdy jest
          otwarta. Jeśli zezwolisz, dostaniesz też powiadomienie systemowe.
        </p>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
            Anuluj
          </button>
          <button type="submit" disabled={!valid} className="btn btn-primary flex-1">
            Zapisz alert
          </button>
        </div>
      </form>
    </div>
  )
}
