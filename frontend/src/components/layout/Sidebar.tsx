'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  LogOut, LayoutDashboard, Users, BookOpen, GraduationCap,
  User, BarChart2, FileText, X, Database, ClipboardCheck, ScrollText,
  Sun, Moon, Trophy,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { ApiResponse, Role, Tryout } from '@/types'
import { useProfile } from '@/hooks/useAuth'
import { getEducationLevel, LEVELS, LEVEL_THEME, levelPath } from '@/lib/level'
import LevelSwitcher from './LevelSwitcher'
import { useDarkMode } from '@/contexts/ThemeContext'

type NavItem =
  | { type: 'link'; label: string; href: string; icon: React.ReactNode }
  | { type: 'divider' }

const adminNav: NavItem[] = [
  { type: 'link', label: 'Dashboard',    href: '/admin/dashboard',        icon: <LayoutDashboard size={18} /> },
  { type: 'link', label: 'Kelola Guru',  href: '/admin/users?role=guru',  icon: <GraduationCap size={18} /> },
  { type: 'link', label: 'Kelola Siswa', href: '/admin/users?role=siswa', icon: <Users size={18} /> },
  { type: 'link', label: 'Master Data',  href: '/admin/master',           icon: <Database size={18} /> },
  { type: 'link', label: 'Persetujuan',  href: '/admin/approvals',        icon: <ClipboardCheck size={18} /> },
  { type: 'link', label: 'Log Aktivitas', href: '/admin/logs',            icon: <ScrollText size={18} /> },
  { type: 'divider' },
  { type: 'link', label: 'Profil Saya',  href: '/admin/profil',           icon: <User size={18} /> },
]

const guruNav: NavItem[] = [
  { type: 'link', label: 'Dashboard',   href: '/guru/dashboard',          icon: <LayoutDashboard size={18} /> },
  { type: 'link', label: 'Bank Soal',   href: '/guru/tryout',             icon: <BookOpen size={18} /> },
  { type: 'link', label: 'Monitoring',  href: '/guru/tryout-monitoring',  icon: <BarChart2 size={18} /> },
  { type: 'divider' },
  { type: 'link', label: 'Profil Saya', href: '/guru/profil',             icon: <User size={18} /> },
]

const siswaNav: NavItem[] = [
  { type: 'link', label: 'Dashboard',       href: '/siswa/dashboard', icon: <LayoutDashboard size={18} /> },
  { type: 'link', label: 'Tryout Tersedia', href: '/siswa/tryout',    icon: <FileText size={18} /> },
  { type: 'link', label: 'Riwayat & Nilai', href: '/siswa/riwayat',   icon: <BarChart2 size={18} /> },
  { type: 'link', label: 'Papan Peringkat', href: '/siswa/leaderboard', icon: <Trophy size={18} /> },
  { type: 'divider' },
  { type: 'link', label: 'Profil Saya',     href: '/siswa/profil',    icon: <User size={18} /> },
]

// TRN-10: Question Bank administrator / Super Try Out builder.
const adminSoalNav: NavItem[] = [
  { type: 'link', label: 'Dashboard',   href: '/admin-soal/dashboard', icon: <LayoutDashboard size={18} /> },
  { type: 'link', label: 'Laporan',     href: '/admin-soal/report',    icon: <BarChart2 size={18} /> },
  { type: 'divider' },
  { type: 'link', label: 'Profil Saya', href: '/admin-soal/profil',    icon: <User size={18} /> },
]

const navByRole: Record<Role, NavItem[]> = {
  admin: adminNav,
  guru: guruNav,
  siswa: siswaNav,
  'admin-soal': adminSoalNav,
}

interface SidebarProps {
  role: Role
  fallbackName?: string
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export default function Sidebar({ role, fallbackName, mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { profile } = useProfile()
  const { theme, toggleTheme } = useDarkMode()
  const navItems = navByRole[role]

  // ─── Pending-approval badge (TRN-17) — admin & admin-soal ───
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  const fetchPendingCounts = useCallback(async () => {
    if (role !== 'admin' && role !== 'admin-soal') return
    try {
      // Count teacher tryouts awaiting approval across all education levels.
      const results = await Promise.all(
        LEVELS.map(async (lv) => {
          try {
            const res = await api.get<ApiResponse<Tryout[]>>(levelPath('/tryouts', lv))
            const list = res.data.data ?? []
            return list.filter((t) => t.status === 'pending_approval' && !t.is_super_tryout).length
          } catch {
            return 0
          }
        })
      )
      setPendingCount(results.reduce((sum, c) => sum + c, 0))
    } catch {
      /* fail silently — badge just won't show */
    }
  }, [role])

  useEffect(() => {
    fetchPendingCounts()
    const interval = setInterval(fetchPendingCounts, 30000) // refresh every 30s
    return () => clearInterval(interval)
  }, [fetchPendingCounts])

  const displayName = profile?.nama_lengkap || fallbackName || 'User'
  const initial = displayName.charAt(0).toUpperCase()

  // Students get a level-specific accent (SD red / SMP navy / SMA grey) derived
  // from their class; teachers/admins keep the default blue accent.
  const studentTheme = role === 'siswa' ? LEVEL_THEME[getEducationLevel(profile?.kelas)] : null

  async function handleLogout() {
    try {
      await api.post('/auth/logout')
      toast.success('Berhasil keluar.')
      router.push('/login')
    } catch {
      toast.error('Gagal keluar. Silakan coba lagi.')
    }
  }

  function isActive(href: string) {
    const [hrefPath, hrefQuery] = href.split('?')
    if (hrefQuery) {
      const hrefParams = new URLSearchParams(hrefQuery)
      let match = pathname === hrefPath
      hrefParams.forEach((v, k) => { if (searchParams?.get(k) !== v) match = false })
      return match
    }
    return pathname === hrefPath || pathname?.startsWith(hrefPath + '/')
  }

  const sidebarContent = (
    <>
      <div className="px-6 pt-8 pb-6 border-b border-slate-100/60 dark:border-slate-700/60 flex items-center justify-between">
        <Link href={`/${role}/dashboard`} className="inline-block hover:opacity-80 transition-opacity" onClick={onMobileClose}>
          <div className="w-32 h-10 relative">
            <Image src="/logo.png" alt="Triton Denpasar" fill priority className="object-contain" />
          </div>
        </Link>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {role !== 'siswa' && <LevelSwitcher />}

      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        {navItems.map((item, idx) => {
          if (item.type === 'divider') {
            return <div key={`d-${idx}`} className="border-t border-slate-100 my-4 mx-2" />
          }
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`group relative flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${
                active
                  ? studentTheme?.navActive ?? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
              }`}
            >
              {active && (
                <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-r-full ${studentTheme?.navBar ?? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
              )}
              <span className={`transition-transform duration-300 ${active ? `${studentTheme?.navIcon ?? 'text-blue-600'} scale-110` : 'text-slate-400 group-hover:scale-110'}`}>
                {item.icon}
              </span>
              {item.label}
              {/* Pending-approval notification badge (TRN-17) */}
              {(item.label === 'Persetujuan' || (role === 'admin-soal' && item.label === 'Dashboard')) &&
                pendingCount !== null && pendingCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center justify-center min-w-[20px] h-5 shadow-sm animate-pulse">
                  {pendingCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-100/80 dark:border-slate-700/80 p-4 space-y-2 bg-slate-50/50 dark:bg-slate-800/50">
        <Link
          href={`/${role}/profil`}
          onClick={onMobileClose}
          className="flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all group"
        >
          {profile?.avatar_url ? (
            <div className="relative w-11 h-11 shrink-0">
              <Image
                src={profile.avatar_url}
                alt={displayName}
                fill
                unoptimized
                className="rounded-full object-cover ring-2 ring-white shadow-sm group-hover:ring-blue-100 transition-all"
              />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm group-hover:shadow-md transition-all">
              {initial}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{displayName}</p>
            <p className="text-xs font-medium text-slate-500 capitalize mt-0.5">{role}</p>
          </div>
        </Link>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-all group"
        >
          {theme === 'dark'
            ? <Sun size={18} className="text-yellow-400 group-hover:rotate-12 transition-transform" />
            : <Moon size={18} className="text-slate-400 group-hover:-rotate-12 transition-transform" />
          }
          {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Keluar
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar — visible lg+ */}
      <aside className="hidden lg:flex w-64 shrink-0 fixed left-0 top-0 h-screen flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-700 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        {sidebarContent}
      </aside>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onMobileClose}
          />
          <aside className="absolute left-0 top-0 h-full w-[280px] flex flex-col bg-white dark:bg-slate-900 shadow-xl z-50 animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
