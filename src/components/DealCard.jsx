import { Heart, Bell } from 'lucide-react'
import { steamHeader, storeIcon } from '../lib/api'
import { storeTrust } from '../lib/catalog'
import { gameRef, go, useApp, useCurrency } from '../lib/hooks'
import { DiscountTag, GameImage, Stars, TrustBadge } from './ui'

export default function DealCard({ deal, store }) {
  const { fmt } = useCurrency()
  const { isWished, toggleWish, openAlert } = useApp()
  const ref = gameRef(deal)
  const wished = isWished(deal.gameID)
  const free = Number(deal.salePrice) === 0

  return (
    <article className="group panel relative flex flex-col overflow-hidden transition-colors hover:border-violet-400/50">
      <button
        onClick={() => go(`gra/${deal.gameID}`)}
        className="relative block cursor-pointer text-left"
        aria-label={`Porównaj ceny: ${deal.title}`}
      >
        <GameImage
          srcs={[steamHeader(deal.steamAppID), deal.thumb]}
          alt=""
          className="aspect-[460/215] w-full transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute top-2 left-2">
          {free ? (
            <span className="rounded-md bg-amber-400 px-1.5 py-0.5 text-xs font-bold text-ink-950">ZA DARMO</span>
          ) : (
            <DiscountTag savings={deal.savings} />
          )}
        </span>
      </button>

      <div className="absolute top-2 right-2 flex gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
        <button
          className="icon-btn size-8"
          onClick={() => openAlert(ref, Number(deal.salePrice))}
          aria-label="Ustaw alert cenowy"
          title="Alert cenowy"
        >
          <Bell className="size-4" />
        </button>
        <button
          className={`icon-btn size-8 ${wished ? 'border-rose-400/60 text-rose-300' : ''}`}
          onClick={() => toggleWish(ref)}
          aria-pressed={wished}
          aria-label={wished ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'}
        >
          <Heart className={`size-4 ${wished ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 min-h-[2.6em] font-display text-[15px] leading-tight font-semibold text-white">
          <button onClick={() => go(`gra/${deal.gameID}`)} className="cursor-pointer text-left hover:text-violet-200">
            {deal.title}
          </button>
        </h3>

        <div className="flex flex-wrap items-center gap-2 text-xs text-mute">
          <img src={storeIcon(deal.storeID)} alt="" className="size-4" loading="lazy" />
          <span className="text-zinc-300">{store?.name ?? 'Sklep'}</span>
          <TrustBadge trust={storeTrust(deal.storeID)} compact />
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {!free && Number(deal.savings) > 0 && (
              <span className="num text-xs text-mute line-through">{fmt(deal.normalPrice)}</span>
            )}
            <span className="num text-lg font-bold text-emerald-300">{fmt(deal.salePrice)}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            {Number(deal.metacriticScore) > 0 && (
              <span className="text-xs text-zinc-300">
                <span className="num font-bold">{deal.metacriticScore}</span> <span className="text-mute">MC</span>
              </span>
            )}
            <Stars percent={deal.steamRatingPercent} text={deal.steamRatingText} />
          </div>
        </div>
      </div>
    </article>
  )
}

export function DealCardSkeleton() {
  return (
    <div className="panel overflow-hidden">
      <div className="skeleton aspect-[460/215] rounded-none" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-6 w-1/3" />
      </div>
    </div>
  )
}
