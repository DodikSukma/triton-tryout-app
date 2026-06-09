'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, TrendingUp, CheckCircle2, Clock, ArrowRight, Trophy } from 'lucide-react'
import api from '@/lib/api'
import { ApiResponse, Tryout } from '@/types'
import { useProfile } from '@/hooks/useAuth'
import { useLevelTheme } from '@/components/shared/LevelTheme'

interface RiwayatRow {
  sesi_id: string
  tryout_id: string
  status: 'berlangsung' | 'selesai' | 'timeout'
  nilai: number | string | null
  mulai_at: string
}

export default function SiswaDashboard() {
  const { profile } = useProfile()
  const { theme } = useLevelTheme()
  const [available, setAvailable] = useState<Tryout[]>([])
  const [riwayat, setRiwayat] = useState<RiwayatRow[]>([])

  useEffect(() => {
    api.get<ApiResponse<Tryout[]>>('/tryouts/available').then((r) => setAvailable(r.data.data ?? [])).catch(() => null)
    api.get<ApiResponse<RiwayatRow[]>>('/riwayat').then((r) => setRiwayat(r.data.data ?? [])).catch(() => null)
  }, [])

  const stats = useMemo(() => {
    const done = riwayat.filter((r) => r.status === 'selesai')
    const inProgress = riwayat.filter((r) => r.status === 'berlangsung')
    const avg = done.length ? done.reduce((s, r) => s + Number(r.nilai ?? 0), 0) / done.length : 0
    return { available: available.length, done: done.length, inProgress: inProgress.length, avg }
  }, [available, riwayat])

  // Not-yet-done tryouts (exclude completed)
  const doneIds = new Set(riwayat.filter((r) => r.status === 'selesai').map((r) => r.tryout_id))
  const recommend = available.filter((t) => !doneIds.has(t.id)).slice(0, 3)
  const inProgressTryouts = riwayat
    .filter((r) => r.status === 'berlangsung')
    .map((r) => ({ ...r, tryout: available.find((t) => t.id === r.tryout_id) }))
    .filter((r) => r.tryout)

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">

      <header className="mb-8">
        <p className={`text-sm ${theme.accentText} font-semibold`}>Selamat datang,</p>
        <h1 className="text-3xl font-black text-slate-900 mt-1">{profile?.nama_lengkap || 'Siswa'} 👋</h1>
        <p className="text-slate-500 mt-1">Ayo lanjutkan persiapan ujianmu hari ini.</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Tryout Tersedia"   value={stats.available}  color={theme.accentBg} Icon={BookOpen} />
        <StatCard label="Selesai"           value={stats.done}       color="text-green-600 bg-green-50"          Icon={CheckCircle2} />
        <StatCard label="Berlangsung"       value={stats.inProgress} color="text-amber-600 bg-amber-50"          Icon={Clock} />
        <StatCard label="Rata-rata Nilai"   value={stats.avg.toFixed(1)} suffix="/100" color="text-violet-600 bg-violet-50" Icon={TrendingUp} />
      </div>

      {inProgressTryouts.length > 0 && (
        <section className="mb-8 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-amber-900">Anda memiliki tryout yang belum selesai</h3>
              <p className="text-sm text-amber-700/80 mt-1">
                Lanjutkan tryout sebelum waktu habis. Jawaban yang sudah Anda isi sudah tersimpan.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {inProgressTryouts.slice(0, 3).map((r) => (
                  <Link
                    key={r.sesi_id}
                    href={`/siswa/tryout/${r.tryout_id}`}
                    className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors"
                  >
                    {r.tryout?.nama_tryout ?? 'Tryout'}
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Tryout Direkomendasikan</h2>
          <Link href="/siswa/tryout" className="text-sm font-semibold text-triton-blue-600 hover:text-triton-blue-700 hover:underline">
            Lihat Semua →
          </Link>
        </div>

        {recommend.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <Trophy size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">Anda sudah menyelesaikan semua tryout!</p>
            <p className="text-slate-400 text-sm mt-1">Pantau riwayat di menu Riwayat & Nilai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommend.map((t) => (
              <Link
                key={t.id}
                href={`/siswa/tryout/${t.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 p-6 flex flex-col group"
              >
                <span className={`inline-block ${theme.accentBg} rounded-full px-3 py-1 text-xs font-semibold self-start`}>
                  {t.mata_pelajaran}
                </span>
                <h3 className="font-bold text-slate-900 mt-3">{t.nama_tryout}</h3>
                <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><Clock size={13} />{t.durasi_menit} mnt</span>
                  <span className="inline-flex items-center gap-1.5"><BookOpen size={13} />{t.soal_count ?? 0} soal</span>
                </div>
                <div className="mt-auto pt-5 flex items-center justify-between">
                  <span className={`text-sm font-semibold ${theme.accentText}`}>Mulai Tryout</span>
                  <ArrowRight size={16} className={`${theme.accentText} group-hover:translate-x-1 transition-transform`} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, Icon, color, suffix }: {
  label: string; value: number | string; Icon: React.ElementType; color: string; suffix?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <p className="text-2xl font-black text-slate-900 mt-3 tabular-nums">
        {value}{suffix && <span className="text-sm text-slate-400 font-medium">{suffix}</span>}
      </p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}
