'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Loader2, Search, X, ChevronLeft, ChevronRight, Info, ScrollText, RotateCcw,
} from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { AuditLog, Paginated } from '@/types'

const ROLE_BADGE: Record<string, string> = {
  admin:  'bg-red-50 text-red-600 border-red-200',
  guru:   'bg-blue-50 text-blue-700 border-blue-200',
  siswa:  'bg-green-50 text-green-600 border-green-200',
  system: 'bg-slate-100 text-slate-500 border-slate-200',
}

const CATEGORIES = [
  { v: '', l: 'Semua Aksi' },
  { v: 'auth', l: 'Autentikasi' },
  { v: 'users', l: 'Pengguna' },
  { v: 'tryout', l: 'Tryout' },
  { v: 'exam', l: 'Ujian' },
]
const ROLES = [
  { v: '', l: 'Semua Peran' },
  { v: 'admin', l: 'Admin' },
  { v: 'guru', l: 'Guru' },
  { v: 'siswa', l: 'Siswa' },
]
const RANGES = [
  { v: 'all', l: 'Semua Waktu' },
  { v: 'today', l: 'Hari Ini' },
  { v: '3d', l: '3 Hari' },
  { v: '7d', l: '7 Hari' },
]

function categoryOf(action: string): 'auth' | 'users' | 'tryout' | 'exam' | 'other' {
  if (action.startsWith('AUTH_')) return 'auth'
  if (action.startsWith('USER_')) return 'users'
  if (action.startsWith('TRYOUT_')) return 'tryout'
  if (action.startsWith('EXAM_')) return 'exam'
  return 'other'
}
const ACTION_BADGE: Record<string, string> = {
  auth: 'bg-violet-50 text-violet-600',
  users: 'bg-blue-50 text-blue-600',
  tryout: 'bg-amber-50 text-amber-600',
  exam: 'bg-green-50 text-green-600',
  other: 'bg-slate-100 text-slate-500',
}

function rangeFrom(range: string): string | undefined {
  const now = new Date()
  if (range === 'today') { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString() }
  if (range === '3d') return new Date(now.getTime() - 3 * 86400_000).toISOString()
  if (range === '7d') return new Date(now.getTime() - 7 * 86400_000).toISOString()
  return undefined
}

function fmtTime(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [role, setRole] = useState('')
  const [category, setCategory] = useState('')
  const [range, setRange] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350)
    return () => clearTimeout(t)
  }, [q])

  // Reset to page 1 when any filter changes.
  useEffect(() => { setPage(1) }, [debouncedQ, role, category, range])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page, limit: 20 }
      if (debouncedQ) params.q = debouncedQ
      if (role) params.role = role
      if (category) params.category = category
      const from = rangeFrom(range)
      if (from) params.from = from
      const res = await api.get<Paginated<AuditLog>>('/audit-logs', { params })
      setLogs(res.data.data ?? [])
      setTotalPages(res.data.pagination?.totalPages ?? 1)
      setTotal(res.data.pagination?.total ?? 0)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memuat log aktivitas.'))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedQ, role, category, range])

  useEffect(() => { load() }, [load])

  const hasFilter = !!q || !!role || !!category || range !== 'all'
  function clearFilters() {
    setQ(''); setDebouncedQ(''); setRole(''); setCategory(''); setRange('all'); setPage(1)
  }

  const selectCls = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all'

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-blue-500" /> Log Aktivitas
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Jejak audit seluruh aktivitas pengguna di platform.</p>
      </header>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari email atau deskripsi..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
            />
          </div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
            {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            {CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
          </select>
          <select value={range} onChange={(e) => setRange(e.target.value)} className={selectCls}>
            {RANGES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
          </select>
          {hasFilter && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors"
            >
              <RotateCcw size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 w-44">Waktu</th>
                <th className="text-left px-4 py-3 w-56">Aktor</th>
                <th className="text-left px-4 py-3 w-44">Aksi</th>
                <th className="text-left px-4 py-3">Deskripsi</th>
                <th className="text-center px-4 py-3 w-16">Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-16"><Loader2 size={22} className="mx-auto animate-spin text-blue-500" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-slate-400 font-sans">Tidak ada log yang cocok dengan filter.</td></tr>
              ) : (
                logs.map((log) => {
                  const cat = categoryOf(log.action)
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors align-top">
                      <td className="px-4 py-3 text-xs text-slate-500 tabular-nums whitespace-nowrap">{fmtTime(log.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-slate-700 font-sans font-medium truncate max-w-[200px]">{log.email}</span>
                          <span className={`self-start text-[10px] font-bold uppercase rounded-full px-2 py-0.5 border ${ROLE_BADGE[log.role] ?? ROLE_BADGE.system}`}>{log.role}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-bold rounded-md px-2 py-1 font-sans ${ACTION_BADGE[cat]}`}>{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-sans leading-relaxed">{log.description}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className="inline-flex text-slate-300 hover:text-blue-500 cursor-help transition-colors"
                          title={`IP: ${log.ip_address ?? '—'}\nTarget: ${log.target_id ?? '—'}\nUser-Agent: ${log.user_agent ?? '—'}`}
                        >
                          <Info size={15} />
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-500">{total} log · Halaman {page} / {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} /> Sebelumnya
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Berikutnya <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
