import { ExternalLink, TriangleAlert } from 'lucide-react'
import { GROUP_LABEL, sitesFor, TRUST } from '../lib/catalog'
import { TrustBadge } from './ui'

const GROUP_ORDER = ['compare', 'official', 'marketplace', 'account']
const GROUP_TRUST = { official: 'official', marketplace: 'marketplace', account: 'account' }

/** Linki „sprawdź tę grę na…” dla stron bez publicznego API cen. */
export default function ExternalSites({ query, filters }) {
  const sites = sitesFor(filters)
  if (!query) return null
  const groups = GROUP_ORDER.map((g) => [g, sites.filter((s) => s.group === g)]).filter(([, l]) => l.length)

  return (
    <div className="space-y-5">
      <p className="text-sm text-mute">
        Te strony nie udostępniają publicznego API, więc nie pokazujemy ich cen. Każdy link otwiera wyszukiwanie „
        <span className="text-zinc-200">{query}</span>” bezpośrednio na danej stronie.
      </p>
      {groups.map(([group, list]) => (
        <section key={group} aria-label={GROUP_LABEL[group]}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="label">{GROUP_LABEL[group]}</h3>
            {GROUP_TRUST[group] && <TrustBadge trust={GROUP_TRUST[group]} />}
          </div>
          {group === 'account' && (
            <div className="mb-3 flex gap-2.5 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>{TRUST.account.hint} Sprzedawca może też odzyskać konto po sprzedaży. Linki pokazują konta z grą, bez przelewów monet i „player trade”.</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((s) => (
              <a
                key={s.name}
                href={s.url(query, filters.platforms)}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group flex items-center justify-between gap-2 rounded-xl border border-ink-600 bg-ink-850 px-3 py-2.5 text-sm transition-colors hover:border-violet-400/60 hover:bg-ink-800"
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-zinc-100">{s.name}</span>
                  <span className="text-[11px] text-mute">{s.region}</span>
                </span>
                <ExternalLink className="size-4 shrink-0 text-mute group-hover:text-violet-300" aria-hidden />
              </a>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
