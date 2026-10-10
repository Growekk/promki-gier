import { useState } from 'react'
import { ShieldCheck, ShieldAlert, ShieldX, Gamepad2 } from 'lucide-react'
import { TRUST } from '../lib/catalog'

const TONES = {
  emerald: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  amber: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  rose: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  violet: 'border-violet-400/30 bg-violet-400/10 text-violet-200',
  zinc: 'border-ink-600 bg-ink-800 text-zinc-300',
}

export function Badge({ tone = 'zinc', children, className = '', title }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export function TrustBadge({ trust, compact }) {
  const t = TRUST[trust]
  const Icon = t.level === 3 ? ShieldCheck : t.level === 2 ? ShieldAlert : ShieldX
  return (
    <Badge tone={t.tone} title={t.hint}>
      <Icon className="size-3" aria-hidden />
      {compact ? ['', 'Niskie', 'Średnie', 'Wysokie'][t.level] : t.label}
    </Badge>
  )
}

export function DiscountTag({ savings, className = '' }) {
  const pct = Math.round(Number(savings))
  if (!pct) return null
  return (
    <span
      className={`num inline-flex items-center rounded-md bg-emerald-400 px-1.5 py-0.5 text-xs font-bold text-ink-950 ${className}`}
    >
      −{pct}%
    </span>
  )
}

/** Obrazek z kolejnymi źródłami zapasowymi i ikoną, gdy żadne nie zadziała. */
export function GameImage({ srcs, alt, className = '' }) {
  const list = srcs.filter(Boolean)
  const [i, setI] = useState(0)
  if (i >= list.length)
    return (
      <div className={`flex items-center justify-center bg-ink-800 text-ink-600 ${className}`}>
        <Gamepad2 className="size-8" aria-hidden />
      </div>
    )
  return (
    <img
      src={list[i]}
      alt={alt}
      loading="lazy"
      onError={() => setI(i + 1)}
      className={`object-cover ${className}`}
    />
  )
}

export function SectionTitle({ eyebrow, children, right }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="label mb-1">{eyebrow}</p>}
        <h2 className="font-display text-xl font-semibold text-white sm:text-2xl">{children}</h2>
      </div>
      {right}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-12 text-center">
      {Icon && <Icon className="size-8 text-ink-600" aria-hidden />}
      <p className="font-display text-lg font-semibold text-white">{title}</p>
      <div className="max-w-md text-sm text-mute">{children}</div>
    </div>
  )
}

export function Stars({ percent, text }) {
  if (!percent || percent === '0') return null
  const p = Number(percent)
  const tone = p >= 80 ? 'text-emerald-300' : p >= 60 ? 'text-amber-300' : 'text-rose-300'
  return (
    <span className={`text-xs ${tone}`} title={`Oceny na Steam: ${text}`}>
      <span className="num">{p}%</span> Steam
    </span>
  )
}
