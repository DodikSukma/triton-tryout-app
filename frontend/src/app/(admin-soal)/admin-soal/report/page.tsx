'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { Loader2, Download, FileSpreadsheet, Users } from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { LEVELS, LEVEL_LABELS, levelPath, type Level } from '@/lib/level'
import { ApiResponse, HasilRekap, Tryout } from '@/types'

type SuperTryout = Tryout & { level: Level }

interface PivotRow {
  siswa_id: string
  nama: string
  jenjang: string
  scores: Record<string, number> // keyed by tryout id
}

export default function AdminSoalReportPage() {
  const [tryouts, setTryouts] = useState<SuperTryout[]>([])
  const [rows, setRows] = useState<PivotRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // 1. All Super Tryouts across levels.
      const lists = await Promise.all(
        LEVELS.map(async (lv) => {
          try {
            const r = await api.get<ApiResponse<Tryout[]>>(levelPath('/tryouts', lv))
            return (r.data.data ?? []).filter((t) => t.is_super_tryout).map((t) => ({ ...t, level: lv }))
          } catch {
            return [] as SuperTryout[]
          }
        })
      )
      const supers = lists.flat()
      setTryouts(supers)

      // 2. Recap (respondents + scores) per Super Tryout.
      const recaps = await Promise.all(
        supers.map(async (t) => {
          try {
            const r = await api.get<ApiResponse<HasilRekap>>(levelPath(`/hasil/rekap/${t.id}`, t.level))
            return { tryout: t, hasil: r.data.data?.hasil ?? [] }
          } catch {
            return { tryout: t, hasil: [] }
          }
        })
      )

      // 3. Pivot by student (rows) × tryout (columns).
      const map = new Map<string, PivotRow>()
      for (const { tryout, hasil } of recaps) {
        for (const h of hasil) {
          const cur = map.get(h.siswa_id) ?? { siswa_id: h.siswa_id, nama: h.nama_siswa, jenjang: h.kelas, scores: {} }
          cur.scores[tryout.id] = h.nilai
          if (!cur.jenjang || cur.jenjang === '—') cur.jenjang = h.kelas
          map.set(h.siswa_id, cur)
        }
      }
      setRows([...map.values()].sort((a, b) => a.nama.localeCompare(b.nama)))
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memuat laporan.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Unique, readable column label per Super Tryout (suffix the level on name clashes).
  const columns = useMemo(() => {
    const seen = new Map<string, number>()
    return tryouts.map((t) => {
      const n = (seen.get(t.nama_tryout) ?? 0) + 1
      seen.set(t.nama_tryout, n)
      return { id: t.id, label: n > 1 ? `${t.nama_tryout} (${LEVEL_LABELS[t.level]})` : t.nama_tryout }
    })
  }, [tryouts])

  function exportXlsx() {
    if (rows.length === 0) { toast.error('Belum ada data untuk diekspor.'); return }
    const header = ['Nama Siswa', 'Jenjang', ...columns.map((c) => c.label)]
    const data = rows.map((r) => {
      const obj: Record<string, string | number> = { 'Nama Siswa': r.nama, 'Jenjang': r.jenjang }
      for (const c of columns) obj[c.label] = r.scores[c.id] ?? ''
      return obj
    })
    const ws = XLSX.utils.json_to_sheet(data, { header })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Tryout')
    const ts = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `laporan-super-tryout-${ts}.xlsx`)
    toast.success('Laporan Excel diunduh.')
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Laporan Super Try Out</h1>
          <p className="text-sm text-slate-500 mt-1">Rekap nilai seluruh peserta — gabungan lintas mata pelajaran.</p>
        </div>
        <button
          onClick={exportXlsx}
          disabled={loading || rows.length === 0}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors shadow-sm"
        >
          <Download size={16} /> Download Report (Merge)
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center text-sm text-slate-400">
          Belum ada peserta yang mengerjakan Super Try Out.
        </div>
      ) : (
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 text-sm text-slate-500">
            <FileSpreadsheet size={15} className="text-green-500" />
            <span><strong className="text-slate-800 dark:text-slate-200">{rows.length}</strong> siswa · <strong className="text-slate-800 dark:text-slate-200">{columns.length}</strong> tryout</span>
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400"><Users size={13} /> nilai per tryout</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/40 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 sticky left-0 bg-slate-50 dark:bg-slate-700/40">Nama Siswa</th>
                  <th className="text-left px-4 py-3">Jenjang</th>
                  {columns.map((c) => (
                    <th key={c.id} className="text-center px-4 py-3 whitespace-nowrap">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {rows.map((r) => (
                  <tr key={r.siswa_id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-800">{r.nama}</td>
                    <td className="px-4 py-2.5 text-slate-500">{r.jenjang}</td>
                    {columns.map((c) => {
                      const v = r.scores[c.id]
                      return (
                        <td key={c.id} className="px-4 py-2.5 text-center tabular-nums">
                          {v === undefined ? <span className="text-slate-300">—</span> : (
                            <span className={`font-semibold ${v >= 75 ? 'text-green-600' : v >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{Math.round(v)}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
