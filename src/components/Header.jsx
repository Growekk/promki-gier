import { Tag, Gift, Heart, Flame } from 'lucide-react'
import { CURRENCIES, useApp, useCurrency } from '../lib/hooks'

const NAV = [
  { path: '', label: 'Okazje', icon: Flame },
  { path: 'darmowe', label: 'Za darmo', icon: Gift },
  { path: 'obserwowane', label: 'Obserwowane', icon: Heart },
]

export default function Header({ route }) {
  const { currency, setCurrency } = useCurrency()
  const { wishlist, alerts } = useApp()
  const section = route.split('/')[0]
  const watched = wishlist.length + alerts.length

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <a href="#/" className="flex items-center gap-2.5" aria-label="Promki Gier — strona główna">
          <span className="grid size-9 place-items-center rounded-xl bg-violet-500 text-white shadow-[0_0_24px_-4px] shadow-violet-500/70">
            <Tag className="size-5 -rotate-12" aria-hidden />
          </span>
          <span className="hidden font-display text-lg font-bold tracking-tight text-white sm:block">
            Promki<span className="text-violet-400">Gier</span>
          </span>
        </a>

        <nav className="ml-auto flex items-center gap-1 sm:ml-6 sm:mr-auto" aria-label="Sekcje">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = section === path || (path === '' && section === 'gra')
            return (
              <a
                key={path}
                href={`#/${path}`}
                aria-current={active ? 'page' : undefined}
                className={`relative flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors sm:px-3 ${
                  active ? 'bg-ink-800 text-white' : 'text-mute hover:text-white'
                }`}
              >
                <Icon className="size-4" aria-hidden />
                <span className="hidden md:inline">{label}</span>
                {path === 'obserwowane' && watched > 0 && (
                  <span className="num grid min-w-5 place-items-center rounded-full bg-violet-500 px-1 text-[10px] text-white">
                    {watched}
                  </span>
                )}
              </a>
            )
          })}
        </nav>

        <div className="flex rounded-lg border border-ink-600 bg-ink-850 p-0.5" role="group" aria-label="Waluta">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              aria-pressed={currency === c}
              className={`num cursor-pointer rounded-md px-2 py-1 text-xs font-bold transition-colors ${
                currency === c ? 'bg-violet-500 text-white' : 'text-mute hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
