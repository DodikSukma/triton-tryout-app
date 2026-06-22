'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Clock, FileText, BookOpen, GraduationCap, CheckCircle2, Hourglass } from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import TritonLoader from '@/components/common/TritonLoader'
import { toast } from 'sonner'
import { ApiResponse, Tryout, Hasil, SesiTryout } from '@/types'
import { formatDurasi } from '@/lib/utils'
import { useLevelTheme } from '@/components/shared/LevelTheme'

type StatusFilter = 'all' | 'not_started' | 'in_progress' | 'done'

interface EnrichedTryout extends Tryout {
  status_siswa: 'not_started' | 'in_progress' | 'done'
  nilai?: number | string
  sesi_id?: string
}

const SUBJECT_COLORS: Record<string, string> = {
  Matematika:        'bg-blue-50 text-blue-600',
  Fisika:            'bg-violet-50 text-violet-600',
  Kimia:             'bg-green-50 text-green-600',
  Biologi:           'bg-emerald-50 text-emerald-600',
  'Bahasa Indonesia': 'bg-orange-50 text-orange-600',
  'Bahasa Inggris':  'bg-sky-50 text-sky-600',
  Sejarah:           'bg-amber-50 text-amber-600',
  Ekonomi:           'bg-teal-50 text-teal-600',
}

const STRIPE_COLORS: Record<string, string> = {
  Matematika: 'bg-blue-500',
  Fisika: 'bg-violet-500',
  Kimia: 'bg-green-500',
  Biologi: 'bg-emerald-500',
  'Bahasa Indonesia': 'bg-orange-500',
  'Bahasa Inggris': 'bg-sky-500',
  Sejarah: 'bg-amber-500',
  Ekonomi: 'bg-teal-500',
}

export default function SiswaTryoutListPage() {
  const { theme } = useLevelTheme()
  const [tryouts, setTryouts] = useState<EnrichedTryout[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subject, setSubject] = useState<string>('all')
  const [status, setStatus] = useState<StatusFilter>('all')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const tRes = await api.get<ApiResponse<Tryout[]>>('/tryouts/available')
        const tryoutData = tRes.data.data ?? []

        // Pull riwayat to know which are in-progress / done
        const rRes = await api.get<ApiResponse<Array<{
          sesi_id: string; tryout_id: string; status: SesiTryout['status']; nilai?: number | string
        }>>>('/riwayat')
        const riwayat = rRes.data.data ?? []
        const riwayatMap = new Map(riwayat.map((r) => [r.tryout_id, r]))

        const enriched: EnrichedTryout[] = tryoutData.map((t) => {
          const r = riwayatMap.get(t.id)
          let status_siswa: EnrichedTryout['status_siswa'] = 'not_started'
          if (r) {
            if (r.status === 'selesai' || r.status === 'timeout') status_siswa = 'done'
            else if (r.status === 'berlangsung') status_siswa = 'in_progress'
          }
          return { ...t, status_siswa, nilai: r?.nilai, sesi_id: r?.sesi_id }
        })

        if (!cancelled) setTryouts(enriched)
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Gagal memuat tryout.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const subjects = useMemo(
    () => Array.from(new Set(tryouts.map((t) => t.mata_pelajaran))).sort(),
    [tryouts]
  )

  const filtered = useMemo(() => {
    return tryouts.filter((t) => {
      if (search && !t.nama_tryout.toLowerCase().includes(search.toLowerCase())) return false
      if (subject !== 'all' && t.mata_pelajaran !== subject) return false
      if (status !== 'all' && t.status_siswa !== status) return false
      return true
    })
  }, [tryouts, search, subject, status])

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Tryout Tersedia</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Pilih tryout untuk dikerjakan atau lanjutkan yang sedang berjalan.</p>
      </header>

      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama tryout..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-triton-blue-500/20 focus:border-triton-blue-500 text-sm transition-all"
          />
        </div>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-triton-blue-500/20 focus:border-triton-blue-500 transition-all min-w-[180px]"
        >
          <option value="all">Semua Mata Pelajaran</option>
          {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-triton-blue-500/20 focus:border-triton-blue-500 transition-all min-w-[180px]"
        >
          <option value="all">Semua Status</option>
          <option value="not_started">Belum Dikerjakan</option>
          <option value="in_progress">Sedang Dikerjakan</option>
          <option value="done">Sudah Selesai</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <TritonLoader fullScreen={false} />
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center">
          <BookOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">Tidak ada tryout yang cocok</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t) => {
            const subjColor = SUBJECT_COLORS[t.mata_pelajaran] ?? 'bg-slate-100 text-slate-600'
            const stripeColor = STRIPE_COLORS[t.mata_pelajaran] ?? 'bg-slate-400'

            const statusChip =
              t.status_siswa === 'done'
                ? { bg: 'bg-green-50', text: 'text-green-600', label: 'Selesai', Icon: CheckCircle2 }
                : t.status_siswa === 'in_progress'
                  ? { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Sedang Dikerjakan', Icon: Hourglass }
                  : { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Belum Dikerjakan', Icon: BookOpen }

            const button =
              t.status_siswa === 'done'
                ? { href: `/siswa/hasil/${t.sesi_id}`, label: 'Lihat Hasil', cls: 'bg-green-500 hover:bg-green-600' }
                : t.status_siswa === 'in_progress'
                  ? { href: `/siswa/tryout/${t.id}`, label: 'Lanjutkan →', cls: 'bg-amber-500 hover:bg-amber-600' }
                  : { href: `/siswa/tryout/${t.id}`, label: 'Mulai Tryout →', cls: theme.button }

            return (
              <div
                key={t.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
              >
                <div className={`h-1.5 ${stripeColor}`} />
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <span className={`${subjColor} rounded-full px-3 py-1 text-xs font-semibold`}>{t.mata_pelajaran}</span>
                    <span className={`${statusChip.bg} ${statusChip.text} rounded-full px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1`}>
                      <statusChip.Icon size={11} /> {statusChip.label}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 leading-snug mb-3">{t.nama_tryout}</h3>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mb-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={14} className="text-slate-400" />
                      {formatDurasi(t.durasi_menit)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <FileText size={14} className="text-slate-400" />
                      {t.soal_count ?? 0} soal
                    </span>
                  </div>

                  {t.status_siswa === 'done' && t.nilai !== undefined && t.nilai !== null && (
                    <div className="mb-4 flex items-baseline gap-1">
                      <span className="text-sm text-slate-500 dark:text-slate-400">Nilai:</span>
                      <span className="text-3xl font-black text-green-500 leading-none">{Math.round(Number(t.nilai))}</span>
                      <span className="text-sm text-slate-400">/100</span>
                    </div>
                  )}

                  <Link
                    href={button.href}
                    className={`mt-auto block text-center ${button.cls} text-white font-semibold rounded-xl py-2.5 text-sm transition-colors`}
                  >
                    {button.label}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
