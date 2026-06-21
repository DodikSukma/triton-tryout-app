'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  ArrowLeft, Users, Trophy, TrendingUp, TrendingDown,
  BookOpen, Loader2, BarChart2, Clock, CheckCircle2,
} from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { ApiResponse, HasilRekap, HasilRekapItem, HasilRekapMeta, TryoutDetail } from '@/types'
import { formatTanggal } from '@/lib/utils'

function nilaiColor(nilai: number): string {
  if (nilai >= 90) return 'bg-green-50 text-green-700 border border-green-200'
  if (nilai >= 75) return 'bg-blue-50 text-blue-700 border border-blue-200'
  if (nilai >= 60) return 'bg-amber-50 text-amber-700 border border-amber-200'
  return 'bg-red-50 text-red-700 border border-red-200'
}

function nilaiBar(nilai: number): string {
  if (nilai >= 90) return 'bg-green-500'
  if (nilai >= 75) return 'bg-blue-500'
  if (nilai >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}

export default function HasilSiswaPage() {
  const params = useParams<{ id: string }>()
  const tryoutId = params.id

  const [data, setData] = useState<HasilRekap | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchRekap = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [tryoutRes, rekapRes] = await Promise.all([
        api.get<ApiResponse<TryoutDetail>>(`/tryouts/${tryoutId}`),
        api.get<ApiResponse<HasilRekap>>(`/hasil/rekap/${tryoutId}`),
      ])

      const tryout = tryoutRes.data.data
      const rekap  = rekapRes.data.data

      if (!rekap || !tryout || !rekap.summary || !Array.isArray(rekap.hasil)) {
        setError(true)
        toast.error('Gagal memuat rekap hasil.')
        return
      }

      const meta: HasilRekapMeta = {
        nama_tryout:    tryout.nama_tryout,
        mata_pelajaran: tryout.mata_pelajaran,
        total_soal:     tryout.soal?.length ?? rekap.hasil[0]?.total_soal ?? 0,
      }

      setData({ ...rekap, tryout: meta })
    } catch (err) {
      setError(true)
      toast.error(getErrorMessage(err, 'Gagal memuat rekap hasil.'))
    } finally {
      setLoading(false)
    }
  }, [tryoutId])

  useEffect(() => { fetchRekap() }, [fetchRekap])

  const tryoutMeta = data?.tryout

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">

      {/* Back + title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/guru/dashboard"
          className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          {loading || !tryoutMeta ? (
            <div className="h-6 w-48 bg-slate-100 animate-pulse rounded-lg" />
          ) : (
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{tryoutMeta.nama_tryout}</h1>
          )}
          <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
            <BarChart2 size={13} />
            Rekap Hasil Siswa
          </p>
        </div>
      </div>

      {loading && <LoadingSkeleton />}

      {!loading && error && (
        <div className="flex flex-col items-center py-20 text-center">
          <BarChart2 className="w-16 h-16 text-slate-200 mb-4" />
          <p className="font-semibold text-slate-400">Gagal memuat data</p>
          <button
            onClick={fetchRekap}
            className="mt-4 text-blue-500 text-sm hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !error && data && tryoutMeta && (
        <>
          {/* Tryout meta strip */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm px-5 py-4 flex flex-wrap items-center gap-4 mb-6">
            <SubjectBadge subject={tryoutMeta.mata_pelajaran} />
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <BookOpen size={14} className="text-slate-400" />
              {tryoutMeta.total_soal} soal
            </span>
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Users size={14} className="text-slate-400" />
              {data.summary.total_peserta} peserta
            </span>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              label="Total Peserta"
              value={data.summary.total_peserta}
              icon={<Users size={20} className="text-blue-500" />}
              iconBg="bg-blue-50"
              suffix=""
            />
            <SummaryCard
              label="Rata-rata Nilai"
              value={data.summary.rata_rata_nilai}
              icon={<TrendingUp size={20} className="text-violet-500" />}
              iconBg="bg-violet-50"
              decimal
            />
            <SummaryCard
              label="Nilai Tertinggi"
              value={data.summary.nilai_tertinggi}
              icon={<Trophy size={20} className="text-amber-500" />}
              iconBg="bg-amber-50"
              decimal
            />
            <SummaryCard
              label="Nilai Terendah"
              value={data.summary.nilai_terendah}
              icon={<TrendingDown size={20} className="text-red-400" />}
              iconBg="bg-red-50"
              decimal
            />
          </div>

          {/* Results table */}
          {data.hasil.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center py-20 text-center">
              <Users className="w-16 h-16 text-slate-200 mb-4" />
              <p className="font-semibold text-slate-400 text-lg">
                Belum ada siswa yang mengerjakan tryout ini
              </p>
              <p className="text-sm text-slate-400 mt-1 max-w-[280px]">
                Hasil akan muncul setelah siswa menyelesaikan sesi tryout.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h2 className="font-bold text-slate-800 dark:text-slate-100">
                  Daftar Hasil ({data.hasil.length} siswa)
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-8">#</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Siswa</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Kelas</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Nilai</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Benar/Total</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Waktu Selesai</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Durasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.hasil.map((h, idx) => (
                      <ResultRow key={h.siswa_id} row={h} rank={idx + 1} totalSoal={tryoutMeta.total_soal} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ResultRow({ row, rank, totalSoal }: { row: HasilRekapItem; rank: number; totalSoal: number }) {
  const initial = row.nama_siswa.charAt(0).toUpperCase()
  const pct = totalSoal > 0 ? (row.total_benar / totalSoal) * 100 : 0

  return (
    <tr className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
      <td className="px-6 py-4 text-sm text-slate-400 font-medium">{rank}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            {initial}
          </div>
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{row.nama_siswa}</p>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-500">{row.kelas}</td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${nilaiColor(row.nilai)}`}>
          {row.nilai.toFixed(1)}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
            {row.total_benar}
            <span className="text-slate-400 font-normal">/{row.total_soal}</span>
          </span>
          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${nilaiBar(pct)}`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">
        {row.selesai_at ? (
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-green-500 shrink-0" />
            {formatTanggal(row.selesai_at)}
          </span>
        ) : '—'}
      </td>
      <td className="px-6 py-4 text-sm text-slate-500 hidden md:table-cell">
        {row.durasi_menit != null ? (
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="text-slate-400 shrink-0" />
            {row.durasi_menit} mnt
          </span>
        ) : '—'}
      </td>
    </tr>
  )
}

function SummaryCard({
  label, value, icon, iconBg, decimal = false, suffix = '',
}: {
  label: string
  value: number
  icon: React.ReactNode
  iconBg: string
  decimal?: boolean
  suffix?: string
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tabular-nums">
        {decimal ? value.toFixed(1) : value}{suffix}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

function SubjectBadge({ subject }: { subject: string }) {
  const colorMap: Record<string, string> = {
    Matematika:         'bg-blue-50 text-blue-600',
    Fisika:             'bg-violet-50 text-violet-600',
    Kimia:              'bg-green-50 text-green-600',
    Biologi:            'bg-emerald-50 text-emerald-600',
    'Bahasa Indonesia': 'bg-orange-50 text-orange-600',
    'Bahasa Inggris':   'bg-sky-50 text-sky-600',
    Sejarah:            'bg-amber-50 text-amber-600',
    Ekonomi:            'bg-teal-50 text-teal-600',
  }
  const cls = colorMap[subject] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>
      {subject}
    </span>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex gap-4">
        <div className="h-6 w-24 bg-slate-100 animate-pulse rounded-full" />
        <div className="h-6 w-20 bg-slate-100 animate-pulse rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
            <div className="w-10 h-10 bg-slate-100 animate-pulse rounded-xl" />
            <div className="h-7 w-16 bg-slate-100 animate-pulse rounded-lg" />
            <div className="h-3 w-24 bg-slate-100 animate-pulse rounded-lg" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="h-5 w-40 bg-slate-100 animate-pulse rounded-lg" />
        </div>
        <div className="divide-y divide-slate-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-slate-100 animate-pulse rounded-lg" />
              </div>
              <div className="h-6 w-14 bg-slate-100 animate-pulse rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center py-4">
        <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
      </div>
    </div>
  )
}
