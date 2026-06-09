'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  GraduationCap, Users, BookOpen, ArrowRight,
  Loader2, CheckCircle2, XCircle, ShieldCheck,
  UserPlus, PlusCircle, TrendingUp,
} from 'lucide-react'
import api from '@/lib/api'
import { ApiResponse, EducationLevel } from '@/types'
import { getEducationLevel } from '@/lib/level'
import { useProfile } from '@/hooks/useAuth'

interface UserRow {
  id: string
  role: string
  is_active: boolean
  profile?: { education_level?: EducationLevel | null; kelas?: string | null } | null
}
interface TryoutRow { id: string; status: string; level?: EducationLevel }

type LevelTab = 'ALL' | 'SD' | 'SMP' | 'SMA'
const LEVEL_TABS: LevelTab[] = ['ALL', 'SD', 'SMP', 'SMA']

// A student's level: explicit education_level, else parsed from the class string.
function studentLevel(u: UserRow): EducationLevel {
  return (u.profile?.education_level ?? (getEducationLevel(u.profile?.kelas).toUpperCase() as EducationLevel))
}

interface Stats {
  guru: number
  guruAktif: number
  siswa: number
  siswaAktif: number
  tryout: number
  tryoutAktif: number
}

export default function AdminDashboard() {
  const { profile } = useProfile()
  const [selectedLevel, setSelectedLevel] = useState<LevelTab>('ALL')
  const [guruList, setGuruList] = useState<UserRow[]>([])
  const [siswaList, setSiswaList] = useState<UserRow[]>([])
  const [tryoutList, setTryoutList] = useState<TryoutRow[]>([])
  const [loaded, setLoaded] = useState(false)

  const firstName = profile?.nama_lengkap?.split(' ')[0] ?? 'Admin'
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  useEffect(() => {
    const tag = (rows: TryoutRow[] | undefined, level: EducationLevel) =>
      (rows ?? []).map((t) => ({ ...t, level }))
    // Tryouts live in three level services; admin reads all (firewall bypassed).
    Promise.all([
      api.get<ApiResponse<UserRow[]>>('/users?role=guru').then((r) => r.data.data ?? []),
      api.get<ApiResponse<UserRow[]>>('/users?role=siswa').then((r) => r.data.data ?? []),
      api.get<ApiResponse<TryoutRow[]>>('/sd/tryouts').then((r) => r.data.data ?? []).catch(() => []),
      api.get<ApiResponse<TryoutRow[]>>('/smp/tryouts').then((r) => r.data.data ?? []).catch(() => []),
      api.get<ApiResponse<TryoutRow[]>>('/sma/tryouts').then((r) => r.data.data ?? []).catch(() => []),
    ])
      .then(([guru, siswa, sd, smp, sma]) => {
        setGuruList(guru)
        setSiswaList(siswa)
        setTryoutList([...tag(sd, 'SD'), ...tag(smp, 'SMP'), ...tag(sma, 'SMA')])
      })
      .catch(() => null)
      .finally(() => setLoaded(true))
  }, [])

  // Students + tryouts honor the level tab; teachers are always global.
  const stats: Stats = useMemo(() => {
    const siswaF = selectedLevel === 'ALL' ? siswaList : siswaList.filter((u) => studentLevel(u) === selectedLevel)
    const tryoutF = selectedLevel === 'ALL' ? tryoutList : tryoutList.filter((t) => t.level === selectedLevel)
    return {
      guru:        guruList.length,
      guruAktif:   guruList.filter((u) => u.is_active).length,
      siswa:       siswaF.length,
      siswaAktif:  siswaF.filter((u) => u.is_active).length,
      tryout:      tryoutF.length,
      tryoutAktif: tryoutF.filter((t) => t.status === 'published').length,
    }
  }, [selectedLevel, guruList, siswaList, tryoutList])

  const activeRate = stats.siswa > 0 ? Math.round((stats.siswaAktif / stats.siswa) * 100) : 0

  return (
    <div className="p-5 md:p-8 space-y-5 animate-fade-in-up">

      {/* ── HERO BANNER ────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg shadow-blue-200/40">
        {/* Decorative blurred shapes */}
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-14 -left-10 w-72 h-72 rounded-full bg-blue-400/25 blur-3xl pointer-events-none" />
        <div className="absolute top-3 right-36 w-20 h-20 rounded-full bg-white/10 blur-xl pointer-events-none" />

        <div className="relative z-10 px-7 md:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

          {/* Left */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-200" />
              <span className="text-blue-200 text-xs font-bold tracking-widest uppercase">Admin Panel</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-snug">
              Selamat datang, {firstName}! 👋
            </h1>
            <p className="text-blue-100/80 mt-1.5 text-sm capitalize">{today}</p>
          </div>

          {/* Right: Buttons — stacked on mobile, row on sm+ */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto shrink-0">
            <Link
              href="/admin/users?role=guru"
              className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 backdrop-blur-sm active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Guru
            </Link>
            <Link
              href="/admin/users?role=siswa"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 hover:bg-blue-50 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-sm active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              Tambah Siswa
            </Link>
          </div>
        </div>
      </div>

      {/* ── LEVEL FILTER TABS ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">Jenjang:</span>
        {LEVEL_TABS.map((lvl) => (
          <button
            key={lvl}
            onClick={() => setSelectedLevel(lvl)}
            className={`text-sm px-4 py-1.5 rounded-xl font-semibold transition-colors ${
              selectedLevel === lvl
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {lvl === 'ALL' ? 'Semua' : lvl}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-1 hidden sm:inline">· Statistik guru tetap global</span>
      </div>

      {/* ── STATS GRID ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          loading={!loaded}
          title="Total Guru"
          value={stats?.guru ?? 0}
          aktif={stats?.guruAktif ?? 0}
          nonaktif={(stats?.guru ?? 0) - (stats?.guruAktif ?? 0)}
          icon={<GraduationCap className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
          accentBar="bg-blue-500"
          href="/admin/users?role=guru"
          hoverBorder="hover:border-blue-200"
        />
        <StatCard
          loading={!loaded}
          title={`Total Siswa${selectedLevel !== 'ALL' ? ` (${selectedLevel})` : ''}`}
          value={stats?.siswa ?? 0}
          aktif={stats?.siswaAktif ?? 0}
          nonaktif={(stats?.siswa ?? 0) - (stats?.siswaAktif ?? 0)}
          icon={<Users className="w-5 h-5 text-violet-600" />}
          iconBg="bg-violet-50"
          accentBar="bg-violet-500"
          href="/admin/users?role=siswa"
          hoverBorder="hover:border-violet-200"
        />
        <StatCard
          loading={!loaded}
          title={`Total Tryout${selectedLevel !== 'ALL' ? ` (${selectedLevel})` : ''}`}
          value={stats?.tryout ?? 0}
          aktif={stats?.tryoutAktif ?? 0}
          nonaktif={(stats?.tryout ?? 0) - (stats?.tryoutAktif ?? 0)}
          icon={<BookOpen className="w-5 h-5 text-red-500" />}
          iconBg="bg-red-50"
          accentBar="bg-red-500"
          href="/admin/approvals"
          hoverBorder="hover:border-red-200"
          aktifLabel="Aktif"
          nonaktifLabel="Draft / Selesai"
        />
      </div>

      {/* ── BOTTOM ROW — Quick Access + Activity ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Akses Cepat — takes 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Akses Cepat</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(
              [
                {
                  label: 'Kelola Guru',
                  desc: 'Tambah & atur akun guru',
                  icon: <GraduationCap className="w-5 h-5" />,
                  href: '/admin/users?role=guru',
                  iconBg: 'bg-blue-50 text-blue-600',
                  border: 'hover:border-blue-200',
                },
                {
                  label: 'Kelola Siswa',
                  desc: 'Tambah & atur akun siswa',
                  icon: <Users className="w-5 h-5" />,
                  href: '/admin/users?role=siswa',
                  iconBg: 'bg-violet-50 text-violet-600',
                  border: 'hover:border-violet-200',
                },
                {
                  label: 'Persetujuan Tryout',
                  desc: 'Tinjau & publikasikan tryout',
                  icon: <BookOpen className="w-5 h-5" />,
                  href: '/admin/approvals',
                  iconBg: 'bg-red-50 text-red-500',
                  border: 'hover:border-red-200',
                },
                {
                  label: 'Profil Saya',
                  desc: 'Edit data akun admin',
                  icon: <ShieldCheck className="w-5 h-5" />,
                  href: '/admin/profil',
                  iconBg: 'bg-slate-100 text-slate-600',
                  border: 'hover:border-slate-300',
                },
              ] as {
                label: string
                desc: string
                icon: React.ReactNode
                href: string
                iconBg: string
                border: string
              }[]
            ).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`group flex items-center gap-4 p-4 rounded-xl border border-slate-100 ${item.border} bg-white hover:shadow-sm transition-all duration-200 active:scale-95`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 ml-auto shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Activity summary — takes 1/3 */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Ringkasan</h2>
          </div>

          {/* Active rate bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500">Siswa Aktif</span>
              <span className="text-xs font-black text-blue-600">{activeRate}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-700"
                style={{ width: `${activeRate}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {stats?.siswaAktif ?? 0} dari {stats?.siswa ?? 0} siswa aktif
            </p>
          </div>

          <div className="border-t border-slate-50 pt-4 space-y-3">
            {[
              {
                label: 'Guru aktif',
                value: stats?.guruAktif ?? 0,
                total: stats?.guru ?? 0,
                color: 'text-blue-600',
                dot: 'bg-blue-500',
              },
              {
                label: 'Tryout aktif',
                value: stats?.tryoutAktif ?? 0,
                total: stats?.tryout ?? 0,
                color: 'text-red-500',
                dot: 'bg-red-500',
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${row.dot}`} />
                  <span className="text-xs text-slate-500 font-medium">{row.label}</span>
                </div>
                <span className={`text-xs font-black tabular-nums ${row.color}`}>
                  {row.value}
                  <span className="text-slate-300 font-normal"> / {row.total}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Skeleton while loading */}
          {!loaded && (
            <div className="absolute inset-6 bg-white flex flex-col gap-3">
              <div className="bg-slate-100 animate-pulse rounded-lg h-4 w-24" />
              <div className="bg-slate-100 animate-pulse rounded-xl h-2 w-full" />
              <div className="bg-slate-100 animate-pulse rounded-lg h-3 w-32 mt-2" />
              <div className="bg-slate-100 animate-pulse rounded-lg h-3 w-28" />
            </div>
          )}
        </div>
      </div>

      {/* ── INFO NOTICE ────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 px-6 py-4 flex items-start gap-4">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-800 leading-snug">Anda login sebagai Administrator</p>
          <p className="text-xs text-blue-600/80 mt-1 leading-relaxed">
            Kelola semua akun guru dan siswa, serta pantau seluruh tryout yang berjalan di platform.
          </p>
        </div>
      </div>

    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  loading,
  title,
  value,
  aktif,
  nonaktif,
  icon,
  iconBg,
  accentBar,
  href,
  hoverBorder,
  aktifLabel    = 'Aktif',
  nonaktifLabel = 'Nonaktif',
}: {
  loading: boolean
  title: string
  value: number
  aktif: number
  nonaktif: number
  icon: React.ReactNode
  iconBg: string
  accentBar: string
  href: string
  hoverBorder: string
  aktifLabel?: string
  nonaktifLabel?: string
}) {
  return (
    <div
      className={`relative bg-white rounded-2xl border border-slate-100 ${hoverBorder} overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
    >
      {/* Colored accent bar at top */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentBar}`} />

      {loading ? (
        <div className="flex items-center justify-center h-28 px-6 py-5">
          <Loader2 className="w-5 h-5 animate-spin text-slate-200" />
        </div>
      ) : (
        <div className="px-6 py-5">

          {/* Top: icon + link */}
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center`}>
              {icon}
            </div>
            <Link
              href={href}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-blue-500 transition-colors group"
            >
              Lihat semua
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Metric */}
          <p className="text-4xl font-black text-slate-900 tabular-nums leading-none">{value}</p>
          <p className="text-sm font-medium text-slate-400 mt-1.5">{title}</p>

          {/* Sub-metrics */}
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-50">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {aktif} {aktifLabel}
            </span>
            <span className="w-px h-3 bg-slate-200 shrink-0" />
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <XCircle className="w-3.5 h-3.5" />
              {nonaktif} {nonaktifLabel}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
