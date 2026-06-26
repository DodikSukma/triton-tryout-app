'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Trophy, Clock, Loader2, ChevronDown, Users } from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import TritonLoader from '@/components/common/TritonLoader'
import Podium, { type PodiumEntry } from '@/components/ui/Podium'
import { ApiResponse } from '@/types'

interface LeaderboardEntry {
  rank: number
  siswa_id: string
  nama: string
  kelas: string | null
  avatar_url: string | null
  nilai: number
  completion_seconds: number
}
interface LeaderboardData {
  total_peserta: number
  entries: LeaderboardEntry[]
  me: LeaderboardEntry | null
}
interface TryoutOption { id: string; nama_tryout: string; mata_pelajaran: string }

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
}

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '?'
}

export default function LeaderboardPage() {
  const [tryouts, setTryouts] = useState<TryoutOption[]>([])
  const [selected, setSelected] = useState('')
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [loadingTryouts, setLoadingTryouts] = useState(true)
  const [loadingBoard, setLoadingBoard] = useState(false)

  useEffect(() => {
    api.get<ApiResponse<TryoutOption[]>>('/tryouts/available')
      .then((res) => {
        const list = res.data.data ?? []
        setTryouts(list)
        if (list.length) setSelected(list[0].id)
      })
      .catch((err) => toast.error(getErrorMessage(err, 'Gagal memuat daftar tryout.')))
      .finally(() => setLoadingTryouts(false))
  }, [])

  useEffect(() => {
    if (!selected) { setData(null); return }
    let cancelled = false
    setLoadingBoard(true)
    api.get<ApiResponse<LeaderboardData>>(`/leaderboard?tryout_id=${selected}&limit=100`)
      .then((res) => { if (!cancelled) setData(res.data.data ?? null) })
      .catch((err) => { if (!cancelled) toast.error(getErrorMessage(err, 'Gagal memuat papan peringkat.')) })
      .finally(() => { if (!cancelled) setLoadingBoard(false) })
    return () => { cancelled = true }
  }, [selected])

  const top3 = useMemo<PodiumEntry[]>(() => (data?.entries ?? []).filter((e) => e.rank <= 3), [data])
  const rest = useMemo(() => (data?.entries ?? []).filter((e) => e.rank > 3), [data])
  const meInList = !!data?.me && (data?.entries ?? []).some((e) => e.siswa_id === data.me!.siswa_id)

  if (loadingTryouts) return <TritonLoader fullScreen={false} />

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-4xl mx-auto pb-28">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Trophy className="text-amber-500" size={28} /> Papan Peringkat
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Bandingkan nilaimu dengan peserta lain pada setiap tryout. Skor tertinggi menang — waktu pengerjaan tercepat memutus seri.
        </p>
      </header>

      {tryouts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center text-slate-400 dark:text-slate-500">
          Belum ada tryout tersedia untuk jenjangmu.
        </div>
      ) : (
        <>
          {/* Tryout selector */}
          <div className="relative mb-6 max-w-md">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              {tryouts.map((t) => (
                <option key={t.id} value={t.id}>{t.nama_tryout} — {t.mata_pelajaran}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {loadingBoard ? (
            <div className="py-20 text-center"><Loader2 size={26} className="mx-auto animate-spin text-blue-500" /></div>
          ) : !data || data.total_peserta === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center text-slate-400 dark:text-slate-500">
              Belum ada peserta yang menyelesaikan tryout ini.
            </div>
          ) : (
            <>
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 mb-4">
                <Users size={15} /> {data.total_peserta} peserta
              </p>

              {/* Podium */}
              <div className="bg-gradient-to-b from-blue-50/80 to-white dark:from-slate-800 dark:to-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm pt-8 pb-2 px-4 mb-6">
                <Podium entries={top3} />
              </div>

              {/* Ranks 4+ */}
              {rest.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[480px]">
                      <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="text-center px-4 py-3 w-16">Rank</th>
                          <th className="text-left px-4 py-3">Nama</th>
                          <th className="text-left px-4 py-3 hidden sm:table-cell">Kelas</th>
                          <th className="text-right px-4 py-3 hidden sm:table-cell">Waktu</th>
                          <th className="text-right px-4 py-3">Nilai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {rest.map((e) => {
                          const isMe = data.me?.siswa_id === e.siswa_id
                          return (
                            <tr key={e.siswa_id} className={isMe ? 'bg-blue-50/60 dark:bg-blue-900/20' : 'hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors'}>
                              <td className="px-4 py-3 text-center font-bold text-slate-500 dark:text-slate-400 tabular-nums">{e.rank}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {e.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={e.avatar_url} alt={e.nama} className="w-8 h-8 rounded-full object-cover shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">{initials(e.nama)}</div>
                                  )}
                                  <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">{e.nama}{isMe && <span className="text-blue-500"> (Anda)</span>}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{e.kelas ?? '—'}</td>
                              <td className="px-4 py-3 text-right text-slate-400 dark:text-slate-500 tabular-nums hidden sm:table-cell">
                                <span className="inline-flex items-center gap-1"><Clock size={12} />{fmtTime(e.completion_seconds)}</span>
                              </td>
                              <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white tabular-nums">{Math.round(e.nilai)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Pinned "your rank" — always visible so the student knows where they stand. */}
      {data && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 px-4 pb-4 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            {data.me ? (
              <div className={`flex items-center gap-3 rounded-2xl shadow-lg border px-5 py-3 ${meInList ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-blue-600 border-blue-600 text-white'}`}>
                <span className={`text-xs font-bold uppercase tracking-wider ${meInList ? 'text-slate-400' : 'text-blue-100'}`}>Peringkat Anda</span>
                <span className="text-2xl font-black tabular-nums">#{data.me.rank}</span>
                <span className={`text-sm ${meInList ? 'text-slate-500 dark:text-slate-400' : 'text-blue-100'}`}>dari {data.total_peserta}</span>
                <span className="flex-1" />
                <span className="inline-flex items-center gap-1 text-xs tabular-nums opacity-80"><Clock size={12} />{fmtTime(data.me.completion_seconds)}</span>
                <span className="text-lg font-black tabular-nums">{Math.round(data.me.nilai)}</span>
              </div>
            ) : data.total_peserta > 0 ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-sm text-slate-500 dark:text-slate-400">
                Anda belum mengikuti tryout ini.
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
