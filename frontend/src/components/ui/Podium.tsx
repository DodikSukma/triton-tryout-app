'use client'

import { Crown, Medal } from 'lucide-react'

export interface PodiumEntry {
  rank: number
  nama: string
  kelas: string | null
  avatar_url: string | null
  nilai: number
}

// Visual treatment per podium place (gold / silver / bronze).
const PLACE = {
  1: { ring: 'ring-amber-400',  chip: 'bg-amber-400 text-amber-950',   bar: 'from-amber-300 to-amber-500',  pedestal: 'h-28', glow: 'shadow-[0_0_30px_-5px_rgba(251,191,36,0.6)]' },
  2: { ring: 'ring-slate-300',  chip: 'bg-slate-300 text-slate-800',   bar: 'from-slate-200 to-slate-400',  pedestal: 'h-20', glow: '' },
  3: { ring: 'ring-orange-400', chip: 'bg-orange-400 text-orange-950', bar: 'from-orange-300 to-orange-500', pedestal: 'h-14', glow: '' },
} as const

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

function Column({ entry }: { entry: PodiumEntry | undefined }) {
  // Empty slot keeps the layout balanced when fewer than 3 students competed.
  if (!entry) return <div className="flex-1" />
  const place = PLACE[entry.rank as 1 | 2 | 3] ?? PLACE[3]
  const isFirst = entry.rank === 1

  return (
    <div className="flex-1 flex flex-col items-center justify-end">
      {isFirst && <Crown size={26} className="text-amber-400 mb-1 drop-shadow" />}

      <div className={`relative rounded-full ring-4 ${place.ring} ${place.glow}`}>
        {entry.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.avatar_url} alt={entry.nama} className={`rounded-full object-cover ${isFirst ? 'w-20 h-20' : 'w-16 h-16'}`} />
        ) : (
          <div className={`rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-black ${isFirst ? 'w-20 h-20 text-xl' : 'w-16 h-16 text-lg'}`}>
            {initials(entry.nama)}
          </div>
        )}
        <span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full ${place.chip} flex items-center justify-center text-sm font-black shadow`}>
          {entry.rank}
        </span>
      </div>

      <p className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-100 text-center leading-tight line-clamp-2 max-w-[120px]">
        {entry.nama}
      </p>
      {entry.kelas && <p className="text-[11px] text-slate-400 dark:text-slate-500">{entry.kelas}</p>}
      <p className="mt-0.5 text-base font-black text-slate-900 dark:text-white tabular-nums">{Math.round(entry.nilai)}</p>

      {/* Pedestal */}
      <div className={`mt-2 w-full max-w-[120px] rounded-t-xl bg-gradient-to-b ${place.bar} ${place.pedestal} flex items-start justify-center pt-2`}>
        <Medal size={18} className="text-white/80" />
      </div>
    </div>
  )
}

/** Top-3 podium (2nd · 1st · 3rd) with gold/silver/bronze styling. */
export default function Podium({ entries }: { entries: PodiumEntry[] }) {
  const byRank = new Map(entries.map((e) => [e.rank, e]))
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5 px-2">
      <Column entry={byRank.get(2)} />
      <Column entry={byRank.get(1)} />
      <Column entry={byRank.get(3)} />
    </div>
  )
}
