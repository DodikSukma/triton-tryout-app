'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Layers, ClipboardCheck, Plus, Loader2, CheckCircle2, X, ChevronRight,
  AlertTriangle, BookOpenCheck, Trash2,
} from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { LEVELS, LEVEL_LABELS, levelPath, type Level } from '@/lib/level'
import { ApiResponse, MasterKelas, MasterMataPelajaran, Tryout } from '@/types'

type TryoutWithLevel = Tryout & { level: Level }

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft', pending_approval: 'Menunggu', approved: 'Disetujui',
  rejected: 'Revisi', published: 'Aktif', closed: 'Selesai',
}

export default function AdminSoalDashboard() {
  const router = useRouter()
  const [tryouts, setTryouts] = useState<TryoutWithLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [rejectFor, setRejectFor] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TryoutWithLevel | null>(null)

  const load = useCallback(async () => {
    try {
      const results = await Promise.all(
        LEVELS.map(async (lv) => {
          try {
            const r = await api.get<ApiResponse<Tryout[]>>(levelPath('/tryouts', lv))
            return (r.data.data ?? []).map((t) => ({ ...t, level: lv }))
          } catch {
            return [] as TryoutWithLevel[]
          }
        })
      )
      setTryouts(results.flat())
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memuat data.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const pending = useMemo(
    () => tryouts.filter((t) => t.status === 'pending_approval' && !t.is_super_tryout),
    [tryouts]
  )
  const supers = useMemo(() => tryouts.filter((t) => t.is_super_tryout), [tryouts])

  async function approve(t: TryoutWithLevel) {
    setBusyId(t.id)
    try {
      await api.patch(levelPath(`/tryouts/${t.id}/status`, t.level), { status: 'published' })
      toast.success(`"${t.nama_tryout}" disetujui & dipublikasikan.`)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menyetujui tryout.'))
    } finally {
      setBusyId(null)
    }
  }

  async function reject(t: TryoutWithLevel) {
    if (!rejectNotes.trim()) { toast.error('Tuliskan catatan revisi.'); return }
    setBusyId(t.id)
    try {
      await api.patch(levelPath(`/tryouts/${t.id}/status`, t.level), { status: 'rejected', revision_notes: rejectNotes.trim() })
      toast.success('Tryout dikembalikan ke guru untuk revisi.')
      setRejectFor(null)
      setRejectNotes('')
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menolak tryout.'))
    } finally {
      setBusyId(null)
    }
  }

  async function deleteSuper(t: TryoutWithLevel) {
    setBusyId(t.id)
    try {
      await api.delete(levelPath(`/tryouts/${t.id}`, t.level))
      toast.success(`Super Try Out "${t.nama_tryout}" dihapus.`)
      setDeleteTarget(null)
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menghapus Super Try Out.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Dashboard Admin Soal</h1>
          <p className="text-sm text-slate-500 mt-1">Kelola Bank Soal, persetujuan tryout guru, dan Super Try Out.</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors shadow-sm"
        >
          <Plus size={16} /> Buat Super Try Out
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <MetricCard icon={<Layers size={22} />} label="Total Super Try Out" value={supers.length} tone="blue" />
        <MetricCard icon={<ClipboardCheck size={22} />} label="Menunggu Persetujuan" value={pending.length} tone="amber" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
      ) : (
        <>
          {/* Pending approvals */}
          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-amber-500" /> Tryout Guru Menunggu Persetujuan
            </h2>
            {pending.length === 0 ? (
              <EmptyCard text="Tidak ada tryout yang menunggu persetujuan." />
            ) : (
              <div className="space-y-3">
                {pending.map((t) => (
                  <div key={t.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[11px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 rounded px-2 py-0.5">{LEVEL_LABELS[t.level]}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{t.nama_tryout}</p>
                        <p className="text-xs text-slate-500">{t.mata_pelajaran}{t.kelas ? ` · ${t.kelas}` : ''} · {t.soal_count ?? 0} soal</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => approve(t)}
                          disabled={busyId === t.id}
                          className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg px-3 py-2 transition-colors"
                        >
                          {busyId === t.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Setujui & Publikasi
                        </button>
                        <button
                          onClick={() => { setRejectFor(rejectFor === t.id ? null : t.id); setRejectNotes('') }}
                          className="inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg px-3 py-2 transition-colors"
                        >
                          Tolak / Revisi
                        </button>
                      </div>
                    </div>
                    {rejectFor === t.id && (
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <textarea
                          value={rejectNotes}
                          onChange={(e) => setRejectNotes(e.target.value)}
                          rows={2}
                          placeholder="Catatan revisi untuk guru..."
                          className="w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setRejectFor(null)} className="text-xs font-medium text-slate-500 px-3 py-1.5">Batal</button>
                          <button
                            onClick={() => reject(t)}
                            disabled={busyId === t.id}
                            className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-semibold rounded-lg px-3 py-1.5"
                          >
                            Kirim Revisi
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Super tryouts */}
          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Layers size={18} className="text-blue-500" /> Super Try Out Saya
            </h2>
            {supers.length === 0 ? (
              <EmptyCard text="Belum ada Super Try Out. Klik 'Buat Super Try Out' untuk memulai." />
            ) : (
              <div className="space-y-3">
                {supers.map((t) => (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm hover:border-blue-200 transition-colors flex items-center gap-3"
                  >
                    <button
                      onClick={() => router.push(`/admin-soal/tryout/${t.id}/soal?level=${t.level}`)}
                      className="flex flex-1 items-center gap-3 min-w-0 text-left"
                    >
                      <span className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><BookOpenCheck size={18} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{t.nama_tryout}</p>
                        <p className="text-xs text-slate-500">{LEVEL_LABELS[t.level]} · {t.mata_pelajaran}{t.kelas ? ` · ${t.kelas}` : ''} · {t.soal_count ?? 0} soal</p>
                      </div>
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full px-2.5 py-1">{STATUS_LABEL[t.status] ?? t.status}</span>
                      <ChevronRight size={18} className="text-slate-300 shrink-0" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(t)}
                      className="shrink-0 p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Hapus Super Try Out"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {createOpen && (
        <CreateSuperTryoutModal
          onClose={() => setCreateOpen(false)}
          onCreated={(id, level) => router.push(`/admin-soal/tryout/${id}/soal?level=${level}`)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => busyId ? null : setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto mb-3">
              <AlertTriangle size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Hapus Super Try Out?</h3>
            <p className="text-sm text-slate-500 text-center mt-1.5">
              <span className="font-semibold text-slate-700">{deleteTarget.nama_tryout}</span> beserta seluruh soalnya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={busyId === deleteTarget.id}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={() => deleteSuper(deleteTarget)}
                disabled={busyId === deleteTarget.id}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busyId === deleteTarget.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'blue' | 'amber' }) {
  const toneCls = tone === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm flex items-center gap-4">
      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${toneCls}`}>{icon}</span>
      <div>
        <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tabular-nums">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-sm text-slate-400">
      {text}
    </div>
  )
}

// ─── Create Super Try Out modal ───────────────────────────────────────────────
function CreateSuperTryoutModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (id: string, level: Level) => void
}) {
  const [level, setLevel] = useState<Level>('sma')
  const [nama, setNama] = useState('')
  const [mapel, setMapel] = useState('')
  const [kelas, setKelas] = useState('')
  const [durasi, setDurasi] = useState(90)
  const [saving, setSaving] = useState(false)
  const [mapelList, setMapelList] = useState<MasterMataPelajaran[]>([])
  const [kelasList, setKelasList] = useState<MasterKelas[]>([])

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<MasterMataPelajaran[]>>('/master/mata-pelajaran').catch(() => null),
      api.get<ApiResponse<MasterKelas[]>>('/master/kelas').catch(() => null),
    ]).then(([m, k]) => {
      setMapelList(m?.data.data ?? [])
      setKelasList(k?.data.data ?? [])
    })
  }, [])

  const lvUpper = level.toUpperCase()
  const mapelOptions = mapelList.filter((m) => m.level === lvUpper)
  const kelasOptions = kelasList.filter((k) => k.level === lvUpper)

  async function submit() {
    if (!nama.trim() || !mapel.trim() || !kelas.trim()) {
      toast.error('Nama, Mata Pelajaran, dan Kelas wajib diisi.')
      return
    }
    setSaving(true)
    try {
      const r = await api.post<ApiResponse<{ id: string }>>(levelPath('/tryouts', level), {
        nama_tryout: nama.trim(),
        mata_pelajaran: mapel.trim(),
        kelas: kelas.trim(),
        durasi_menit: durasi,
        is_super_tryout: true,
      })
      const id = r.data.data?.id
      if (!id) throw new Error('No id returned')
      toast.success('Super Try Out dibuat.')
      onCreated(id, level)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal membuat Super Try Out.'))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Buat Super Try Out</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Jenjang</label>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  onClick={() => { setLevel(lv); setMapel(''); setKelas('') }}
                  className={`rounded-lg py-2 text-sm font-semibold border transition-colors ${
                    level === lv ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {LEVEL_LABELS[lv]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Super Try Out</label>
            <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="cth: Super Try Out UTBK 2026"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Mata Pelajaran <span className="text-red-500">*</span></label>
            <select value={mapel} onChange={(e) => setMapel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
              <option value="">Pilih Mata Pelajaran</option>
              {mapelOptions.map((m) => <option key={m.id} value={m.nama}>{m.nama}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Kelas <span className="text-red-500">*</span></label>
              <select value={kelas} onChange={(e) => setKelas(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                <option value="">Pilih Kelas</option>
                {kelasOptions.map((k) => <option key={k.id} value={k.nama}>{k.nama}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Durasi (menit)</label>
              <input type="number" min={1} value={durasi} onChange={(e) => setDurasi(Math.max(1, Number(e.target.value) || 90))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl py-2.5 text-sm">Batal</button>
          <button onClick={submit} disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm inline-flex items-center justify-center gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Buat & Kelola Soal
          </button>
        </div>
      </div>
    </div>
  )
}
