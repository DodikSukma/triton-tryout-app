'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  GraduationCap, Users, BookOpen, ArrowRight,
  Loader2, CheckCircle2, XCircle, ShieldCheck,
  PlusCircle, UserPlus,
} from 'lucide-react'
import api from '@/lib/api'
import { ApiResponse } from '@/types'
import { useProfile } from '@/hooks/useAuth'

interface UserRow { id: string; role: string; is_active: boolean }
interface TryoutRow { id: string; status: string }

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
  const [stats, setStats] = useState<Stats | null>(null)

  const firstName = profile?.nama_lengkap?.split(' ')[0] ?? 'Admin'

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<UserRow[]>>('/users?role=guru').then((r) => r.data.data ?? []),
      api.get<ApiResponse<UserRow[]>>('/users?role=siswa').then((r) => r.data.data ?? []),
      api.get<ApiResponse<TryoutRow[]>>('/tryouts').then((r) => r.data.data ?? []),
    ])
      .then(([guruList, siswaList, tryoutList]) => {
        setStats({
          guru: guruList.length,
          guruAktif: guruList.filter((u) => u.is_active).length,
          siswa: siswaList.length,
          siswaAktif: siswaList.filter((u) => u.is_active).length,
          tryout: tryoutList.length,
          tryoutAktif: tryoutList.filter((t) => t.status === 'aktif').length,
        })
      })
      .catch(() => setStats({ guru: 0, guruAktif: 0, siswa: 0, siswaAktif: 0, tryout: 0, tryoutAktif: 0 }))
  }, [])

  return (
    <div className="pb-10 animate-fade-in-up">

      {/* ── Welcome banner ── */}
      <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-triton-blue-600 via-triton-blue-500 to-blue-400 shadow-[0_8px_40px_rgba(59,130,246,0.35)]">
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-10 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-6 right-32 w-24 h-24 rounded-full bg-white/10" />

        <div className="relative px-8 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-blue-200" />
              <span className="text-blue-200 text-sm font-medium">Admin Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Selamat datang, {firstName}! 👋
            </h1>
            <p className="text-blue-100 mt-1 text-sm capitalize">{today}</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/admin/users?role=guru"
              className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all backdrop-blur-sm"
            >
              <UserPlus size={15} />
              Tambah Guru
            </Link>
            <Link
              href="/admin/users?role=siswa"
              className="inline-flex items-center gap-2 bg-white text-triton-blue-600 hover:bg-blue-50 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              <PlusCircle size={15} />
              Tambah Siswa
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <StatCard
          loading={!stats}
          title="Total Guru"
          value={stats?.guru ?? 0}
          aktif={stats?.guruAktif ?? 0}
          nonaktif={(stats?.guru ?? 0) - (stats?.guruAktif ?? 0)}
          icon={<GraduationCap size={22} className="text-triton-blue-600" />}
          iconBg="bg-triton-blue-100"
          href="/admin/users?role=guru"
          accent="blue"
        />
        <StatCard
          loading={!stats}
          title="Total Siswa"
          value={stats?.siswa ?? 0}
          aktif={stats?.siswaAktif ?? 0}
          nonaktif={(stats?.siswa ?? 0) - (stats?.siswaAktif ?? 0)}
          icon={<Users size={22} className="text-purple-600" />}
          iconBg="bg-purple-100"
          href="/admin/users?role=siswa"
          accent="purple"
        />
        <StatCard
          loading={!stats}
          title="Total Tryout"
          value={stats?.tryout ?? 0}
          aktif={stats?.tryoutAktif ?? 0}
          nonaktif={(stats?.tryout ?? 0) - (stats?.tryoutAktif ?? 0)}
          icon={<BookOpen size={22} className="text-triton-red-500" />}
          iconBg="bg-red-100"
          href="/admin/users?role=guru"
          accent="red"
          aktifLabel="Aktif"
          nonaktifLabel="Draft/Selesai"
        />
      </div>

      {/* ── Quick actions ── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-6">
        <h2 className="text-base font-bold text-slate-800 mb-5">Akses Cepat</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Kelola Guru',  icon: <GraduationCap size={20} />, href: '/admin/users?role=guru',  color: 'bg-triton-blue-50 text-triton-blue-600 hover:bg-triton-blue-100' },
            { label: 'Kelola Siswa', icon: <Users size={20} />,         href: '/admin/users?role=siswa', color: 'bg-purple-50 text-purple-600 hover:bg-purple-100' },
            { label: 'Semua Tryout', icon: <BookOpen size={20} />,      href: '/guru/dashboard',         color: 'bg-red-50 text-triton-red-500 hover:bg-red-100' },
            { label: 'Profil Saya',  icon: <ShieldCheck size={20} />,   href: '/admin/profil',           color: 'bg-slate-50 text-slate-600 hover:bg-slate-100' },
          ].map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl font-semibold text-sm transition-all ${a.color}`}
            >
              <div className="p-2.5 rounded-xl bg-white/60">{a.icon}</div>
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Info strip ── */}
      <div className="rounded-2xl border border-triton-blue-100 bg-triton-blue-50 px-6 py-4 flex items-start gap-3">
        <ShieldCheck size={18} className="text-triton-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-triton-blue-700">
          Anda masuk sebagai <span className="font-bold">Administrator</span>. Anda dapat mengelola semua akun guru dan siswa, serta melihat seluruh tryout di platform.
        </p>
      </div>

    </div>
  )
}

function StatCard({
  loading, title, value, aktif, nonaktif,
  icon, iconBg, href, accent,
  aktifLabel = 'Aktif', nonaktifLabel = 'Nonaktif',
}: {
  loading: boolean
  title: string
  value: number
  aktif: number
  nonaktif: number
  icon: React.ReactNode
  iconBg: string
  href: string
  accent: 'blue' | 'purple' | 'red'
  aktifLabel?: string
  nonaktifLabel?: string
}) {
  const borderAccent = {
    blue:   'hover:border-triton-blue-200',
    purple: 'hover:border-purple-200',
    red:    'hover:border-red-200',
  }[accent]

  return (
    <div className={`bg-white rounded-3xl border border-slate-100 ${borderAccent} shadow-sm p-6 transition-all hover:shadow-[0_4px_24px_rgba(0,0,0,0.07)] group`}>
      {loading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 size={24} className="animate-spin text-slate-200" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center`}>
              {icon}
            </div>
            <Link
              href={href}
              className="text-xs font-semibold text-slate-400 hover:text-triton-blue-500 flex items-center gap-1 transition-colors"
            >
              Lihat semua <ArrowRight size={12} />
            </Link>
          </div>

          <p className="text-4xl font-black text-slate-900 tabular-nums mb-1">{value}</p>
          <p className="text-sm font-semibold text-slate-500 mb-4">{title}</p>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600">
              <CheckCircle2 size={13} /> {aktif} {aktifLabel}
            </span>
            <span className="w-px h-3 bg-slate-200" />
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <XCircle size={13} /> {nonaktif} {nonaktifLabel}
            </span>
          </div>
        </>
      )}
    </div>
  )
}
