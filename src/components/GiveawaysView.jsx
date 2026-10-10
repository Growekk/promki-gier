import { useEffect, useMemo, useState } from 'react'
import { Gift, Clock, Users, ExternalLink } from 'lucide-react'
import { getGiveaways } from '../lib/api'
import { timeLeft, useCurrency } from '../lib/hooks'
import { Badge, EmptyState, GameImage, SectionTitle } from './ui'

const FILTERS = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'Epic Games Store', label: 'Epic Games' },
  { id: 'Steam', label: 'Steam' },
  { id: 'GOG', label: 'GOG' },
]

export default function GiveawaysView() {
  const { fmt } = useCurrency()
  const [type, setType] = useState('game')
  const [platform, setPlatform] = useState('all')
  const [list, setList] = useState(null)

  useEffect(() => {
    let alive = true
    setList(null)
    getGiveaways(type).then((l) => alive && setList(l))
    return () => {
      alive = false
    }
  }, [type])

  const visible = useMemo(
    () => list?.filter((g) => platform === 'all' || g.platforms.includes(platform)),
    [list, platform],
  )
  const totalWorth = visible?.reduce((s, g) => s + (parseFloat(g.worth.replace('$', '')) || 0), 0) ?? 0

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Aktualizowane co 30 minut · źródło: GamerPower"
        right={
          totalWorth > 0 && (
            <span className="text-sm text-mute">
              Razem warte <span className="num font-bold text-amber-300">{fmt(totalWorth)}</span>
            </span>
          )
        }
      >
        Rozdawane za darmo
      </SectionTitle>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.id} className="chip" aria-pressed={platform === f.id} onClick={() => setPlatform(f.id)}>
            {f.label}
          </button>
        ))}
        <span className="mx-1 hidden w-px bg-ink-600 sm:block" />
        <button className="chip" aria-pressed={type === 'game'} onClick={() => setType('game')}>
          Pełne gry
        </button>
        <button className="chip" aria-pressed={type === 'loot'} onClick={() => setType('loot')}>
          DLC i przedmioty
        </button>
      </div>

      {visible === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-72" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState icon={Gift} title="Teraz nic tu nie rozdają">
          Zajrzyj później. Epic rozdaje gry co czwartek o 17:00.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((g) => {
            const left = timeLeft(g.end_date)
            return (
              <article key={g.id} className="panel group flex flex-col overflow-hidden transition-colors hover:border-amber-400/50">
                <GameImage srcs={[g.image, g.thumbnail]} alt="" className="aspect-[16/9] w-full" />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {g.platforms
                      .split(',')
                      .map((p) => p.trim())
                      .filter((p) => p !== 'PC')
                      .map((p) => (
                        <Badge key={p}>{p}</Badge>
                      ))}
                  </div>
                  <h3 className="font-display leading-tight font-semibold text-white">
                    {g.title.replace(/ \((Steam|GOG|Epic Games)\)/, '').replace(/ Giveaway$/i, '')}
                  </h3>
                  <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-mute">
                    {left && (
                      <span className="flex items-center gap-1 text-amber-300">
                        <Clock className="size-3.5" aria-hidden /> zostało {left}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" aria-hidden />
                      <span className="num">{g.users.toLocaleString('pl-PL')}</span> odebrało
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-ink-700 pt-3">
                    <span className="text-sm">
                      {g.worth !== 'N/A' && (
                        <span className="num mr-2 text-mute line-through">{fmt(parseFloat(g.worth.replace('$', '')))}</span>
                      )}
                      <span className="font-bold text-emerald-300">0 zł</span>
                    </span>
                    <a
                      href={g.open_giveaway_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn bg-amber-400 py-2 text-ink-950 hover:bg-amber-300"
                    >
                      Odbierz <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
