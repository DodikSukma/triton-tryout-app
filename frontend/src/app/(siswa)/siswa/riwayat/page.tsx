'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Calendar, CheckCircle2, Hourglass, Loader2, TrendingUp, FileText } from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { ApiResponse } from '@/types'
import { formatTanggal } from '@/lib/utils'

interface RiwayatRow {
  sesi_id: string
  tryout_id: string
  mulai_at: string
  selesai_at: string | null
  status: 'berlangsung' | 'selesai' | 'timeout'
  nilai: number | string | null
  total_benar: number | null
  total_soal: number | null
  nama_tryout?: string
  mata_pelajaran?: string
}

export default function RiwayatPage() {
  const [rows, setRows] = useState<RiwayatRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Riwayat doesn't include tryout names, so we cross-join with /tryouts/available
        const [rRes, tRes] = await Promise.all([
          api.get<ApiResponse<RiwayatRow[]>>('/riwayat'),
          api.get<ApiResponse<{ id: string; nama_tryout: string; mata_pelajaran: string }[]>>('/tryouts/available'),
        ])
        if (cancelled) return
        const riwayat = rRes.data.data ?? []
        const tMap = new Map((tRes.data.data ?? []).map((t) => [t.id, t]))
        const enriched = riwayat.map((r) => ({
          ...r,
          nama_tryout: tMap.get(r.tryout_id)?.nama_tryout,
          mata_pelajaran: tMap.get(r.tryout_id)?.mata_pelajaran,
        }))
        setRows(enriched)
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Gagal memuat riwayat.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const stats = useMemo(() => {
    const done = rows.filter((r) => r.status === 'selesai')
    const avg = done.length ? done.reduce((sum, r) => sum + Number(r.nilai ?? 0), 0) / done.length : 0
    const best = done.length ? done.reduce((max, r) => Math.max(max, Number(r.nilai ?? 0)), 0) : 0
    return { total: rows.length, done: done.length, avg, best }
  }, [rows])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-triton-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Riwayat & Nilai</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Pantau perkembangan belajar Anda dari semua tryout.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Tryout"   value={stats.total} Icon={FileText}  color="text-triton-blue-600 bg-triton-blue-50" />
        <StatCard label="Selesai"        value={stats.done}  Icon={CheckCircle2} color="text-green-600 bg-green-50" />
        <StatCard label="Rata-rata"      value={`${stats.avg.toFixed(1)}`} Icon={TrendingUp}  color="text-violet-600 bg-violet-50" suffix="/100" />
        <StatCard label="Nilai Tertinggi" value={`${stats.best.toFixed(0)}`} Icon={TrendingUp} color="text-amber-600 bg-amber-50" suffix="/100" />
      </div>

      {rows.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Belum ada riwayat tryout</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Mulai kerjakan tryout pertamamu untuk melihat riwayat di sini.</p>
          <Link href="/siswa/tryout" className="mt-6 inline-block bg-triton-blue-500 hover:bg-triton-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors">
            Lihat Tryout Tersedia
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3">Nama Tryout</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Mata Pelajaran</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Tanggal</th>
                  <th className="text-left px-5 py-3">Nilai</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {rows.map((r) => {
                  const isDone = r.status === 'selesai'
                  const isProgress = r.status === 'berlangsung'
                  const nilai = r.nilai !== null && r.nilai !== undefined ? Math.round(Number(r.nilai)) : null
                  return (
                    <tr key={r.sesi_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        {r.nama_tryout ?? <span className="italic text-slate-400 dark:text-slate-500">Tryout tidak tersedia</span>}
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell">{r.mata_pelajaran ?? '—'}</td>
                      <td className="px-5 py-4">
                        {isDone && (
                          <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 rounded-full px-2.5 py-1 text-xs font-semibold">
                            <CheckCircle2 size={11} /> Selesai
                          </span>
                        )}
                        {isProgress && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 rounded-full px-2.5 py-1 text-xs font-semibold">
                            <Hourglass size={11} /> Berlangsung
                          </span>
                        )}
                        {r.status === 'timeout' && (
                          <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 rounded-full px-2.5 py-1 text-xs font-semibold">
                            Timeout
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs hidden md:table-cell inline-flex items-center gap-1">
                        <Calendar size={11} />
                        {formatTanggal(r.mulai_at)}
                      </td>
                      <td className="px-5 py-4">
                        {nilai !== null ? (
                          <span className="text-xl font-black text-green-500 tabular-nums">{nilai}</span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {isDone && (
                          <Link href={`/siswa/hasil/${r.sesi_id}`} className="text-triton-blue-600 hover:text-triton-blue-700 hover:underline text-sm font-semibold">
                            Lihat Detail
                          </Link>
                        )}
                        {isProgress && (
                          <Link href={`/siswa/tryout/${r.tryout_id}`} className="text-amber-600 hover:text-amber-700 hover:underline text-sm font-semibold">
                            Lanjutkan
                          </Link>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, Icon, color, suffix }: {
  label: string; value: number | string; Icon: React.ElementType
  color: string; suffix?: string
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-3 tabular-nums">{value}{suffix && <span className="text-sm text-slate-400 dark:text-slate-500 font-medium">{suffix}</span>}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}
