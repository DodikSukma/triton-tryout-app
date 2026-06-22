'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Loader2, CheckCircle2, Send, XCircle, Link2, Undo2, Clock, FileText, X, AlertTriangle,
  ChevronDown, ChevronUp, ListChecks, Search, ChevronLeft, ChevronRight,
} from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import TritonLoader from '@/components/common/TritonLoader'
import { ApiResponse, Soal, Tryout, TryoutDetail, TryoutStatus } from '@/types'
import RenderHTML from '@/components/shared/RenderHTML'

const STATUS_META: Record<string, { label: string; cls: string }> = {
  draft:            { label: 'Draft', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  pending_approval: { label: 'Menunggu Persetujuan', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  approved:         { label: 'Disetujui', cls: 'bg-teal-50 text-teal-600 border-teal-200' },
  rejected:         { label: 'Butuh Revisi', cls: 'bg-red-50 text-red-600 border-red-200' },
  published:        { label: 'Aktif', cls: 'bg-green-50 text-green-600 border-green-200' },
  closed:           { label: 'Selesai', cls: 'bg-amber-50 text-amber-600 border-amber-200' },
}

// Review-worthy first.
const SORT_RANK: Record<string, number> = {
  pending_approval: 0, approved: 1, rejected: 2, published: 3, draft: 4, closed: 5,
}

export default function AdminApprovalPage() {
  const [tryouts, setTryouts] = useState<Tryout[]>([])
  const [loading, setLoading] = useState(true)
  const [rejectTarget, setRejectTarget] = useState<Tryout | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  // Expandable per-tryout question review.
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [detailCache, setDetailCache] = useState<Record<string, TryoutDetail>>({})
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null)
  // Search + pagination (TRN-18)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  const load = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<Tryout[]>>('/tryouts')
      const list = res.data.data ?? []
      list.sort((a, b) => (SORT_RANK[a.status] ?? 9) - (SORT_RANK[b.status] ?? 9))
      setTryouts(list)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memuat tryout.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function setStatus(t: Tryout, status: TryoutStatus, revision_notes?: string) {
    setBusyId(t.id)
    try {
      await api.patch(`/tryouts/${t.id}/status`, { status, revision_notes })
      toast.success('Status tryout diperbarui.')
      await load()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memperbarui status.'))
    } finally {
      setBusyId(null)
    }
  }

  async function toggleRandom(t: Tryout, field: 'randomize_questions' | 'randomize_options', value: boolean) {
    // Optimistic update.
    setTryouts((arr) => arr.map((x) => (x.id === t.id ? { ...x, [field]: value } : x)))
    try {
      await api.put(`/tryouts/${t.id}`, { [field]: value })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menyimpan pengaturan acak.'))
      load()
    }
  }

  async function toggleDetail(t: Tryout) {
    if (expandedId === t.id) { setExpandedId(null); return }
    setExpandedId(t.id)
    if (!detailCache[t.id]) {
      setDetailLoadingId(t.id)
      try {
        // Admin GET retains is_benar + panduan_essay (only stripped for siswa).
        const res = await api.get<ApiResponse<TryoutDetail>>(`/tryouts/${t.id}`)
        if (res.data.data) setDetailCache((prev) => ({ ...prev, [t.id]: res.data.data as TryoutDetail }))
      } catch (err) {
        toast.error(getErrorMessage(err, 'Gagal memuat detail soal.'))
        setExpandedId(null)
      } finally {
        setDetailLoadingId(null)
      }
    }
  }

  function copyShareLink(t: Tryout) {
    const url = `${window.location.origin}/siswa/tryout/${t.id}/start-direct`
    navigator.clipboard.writeText(url).then(
      () => toast.success('Link sesi disalin ke clipboard.'),
      () => toast.error('Gagal menyalin link.')
    )
  }

  if (loading) {
    return <TritonLoader fullScreen={false} />
  }

  const pendingCount = tryouts.filter((t) => t.status === 'pending_approval').length

  const q = searchQuery.trim().toLowerCase()
  const filtered = tryouts.filter((t) =>
    !q ||
    t.nama_tryout.toLowerCase().includes(q) ||
    t.mata_pelajaran.toLowerCase().includes(q) ||
    (!!t.kelas && t.kelas.toLowerCase().includes(q))
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const page = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  return (
    <div className="p-4 md:p-6 lg:p-10 max-w-5xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-100">Persetujuan Tryout</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Tinjau, setujui, publikasikan, atau minta revisi tryout untuk jenjang aktif.
          Ganti jenjang melalui pemilih di sidebar.
        </p>
        {pendingCount > 0 && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full px-3 py-1">
            <Clock size={13} /> {pendingCount} menunggu persetujuan
          </p>
        )}
      </header>

      {/* Search */}
      <div className="relative mb-5 max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Cari Persetujuan Ujian..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-12 text-center text-slate-400 dark:text-slate-500">
          {tryouts.length === 0 ? 'Belum ada tryout pada jenjang ini.' : 'Tidak ada tryout yang cocok dengan pencarian.'}
        </div>
      ) : (
        <div className="space-y-4">
          {paginated.map((t) => {
            const meta = STATUS_META[t.status] ?? STATUS_META.draft
            const busy = busyId === t.id
            return (
              <div key={t.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">{t.nama_tryout}</h3>
                      <span className={`text-[11px] font-semibold rounded-full px-2.5 py-0.5 border ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                      <span>{t.mata_pelajaran}{t.sub_mata_pelajaran ? ` · ${t.sub_mata_pelajaran}` : ''}</span>
                      {t.kelas && <span>· {t.kelas}</span>}
                      <span className="inline-flex items-center gap-1"><Clock size={11} />{t.durasi_menit}m</span>
                      <span className="inline-flex items-center gap-1"><FileText size={11} />{t.soal_count ?? 0} soal</span>
                    </p>
                  </div>
                </div>

                {t.status === 'rejected' && t.revision_notes && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-2.5 text-xs text-red-600">
                    <span className="font-semibold">Catatan revisi:</span> {t.revision_notes}
                  </div>
                )}

                {/* Randomization toggles */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Toggle label="Acak Urutan Soal" checked={t.randomize_questions ?? true} onChange={(v) => toggleRandom(t, 'randomize_questions', v)} />
                  <Toggle label="Acak Pilihan Ganda" checked={t.randomize_options ?? true} onChange={(v) => toggleRandom(t, 'randomize_options', v)} />
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleDetail(t)}
                    className="inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl px-4 py-2 transition-colors"
                  >
                    {expandedId === t.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Lihat Soal ({t.soal_count ?? 0})
                  </button>
                  {t.status !== 'published' && (
                    <button onClick={() => setStatus(t, 'published')} disabled={busy}
                      className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl px-4 py-2 transition-colors disabled:opacity-50">
                      <Send size={14} /> Publikasikan
                    </button>
                  )}
                  {(t.status === 'pending_approval' || t.status === 'rejected' || t.status === 'draft') && (
                    <button onClick={() => setStatus(t, 'approved')} disabled={busy}
                      className="inline-flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 text-sm font-semibold rounded-xl px-4 py-2 transition-colors disabled:opacity-50">
                      <CheckCircle2 size={14} /> Setujui
                    </button>
                  )}
                  {t.status !== 'rejected' && t.status !== 'published' && (
                    <button onClick={() => setRejectTarget(t)} disabled={busy}
                      className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl px-4 py-2 transition-colors disabled:opacity-50">
                      <XCircle size={14} /> Tolak / Revisi
                    </button>
                  )}
                  {t.status === 'published' && (
                    <>
                      <button onClick={() => copyShareLink(t)}
                        className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-semibold rounded-xl px-4 py-2 transition-colors">
                        <Link2 size={14} /> Salin Link Sesi
                      </button>
                      <button onClick={() => setStatus(t, 'draft')} disabled={busy}
                        className="inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-sm font-semibold rounded-xl px-4 py-2 transition-colors disabled:opacity-50">
                        <Undo2 size={14} /> Tarik dari Publikasi
                      </button>
                    </>
                  )}
                  {busy && <Loader2 size={16} className="animate-spin text-slate-400 dark:text-slate-500 self-center" />}
                </div>

                {/* Expandable full question review */}
                {expandedId === t.id && (
                  <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
                    {detailLoadingId === t.id ? (
                      <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-500 py-4">
                        <Loader2 size={16} className="animate-spin" /> Memuat detail soal...
                      </div>
                    ) : (
                      <SoalReview soal={detailCache[t.id]?.soal ?? []} />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPage={setCurrentPage} />
      )}

      {rejectTarget && (
        <RejectDialog
          tryout={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={async (notes) => { await setStatus(rejectTarget, 'rejected', notes); setRejectTarget(null) }}
        />
      )}
    </div>
  )
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={15} /> Sebelumnya
      </button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
              p === page ? 'bg-blue-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={() => onPage(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Berikutnya <ChevronRight size={15} />
      </button>
    </div>
  )
}

function SoalReview({ soal }: { soal: Soal[] }) {
  if (soal.length === 0) {
    return <p className="text-sm text-slate-400 py-2">Tryout ini belum memiliki soal.</p>
  }
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <ListChecks size={13} /> {soal.length} Soal
      </p>
      {soal.map((s, i) => (
        <div key={s.id} className="rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/50 p-4">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center">{i + 1}</span>
            <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${s.tipe === 'pilihan_ganda' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
              {s.tipe === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Essay'}
            </span>
            <span className="text-xs text-slate-400">Bobot {s.bobot}</span>
          </div>

          <RenderHTML html={s.pertanyaan_html || s.pertanyaan} className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed" />

          {s.gambar_base64 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.gambar_base64} alt={`Gambar soal ${i + 1}`} className="mt-2 max-h-52 rounded-lg border border-slate-200" />
          )}

          {s.tipe === 'pilihan_ganda' ? (
            <div className="mt-3 space-y-1.5">
              {(s.opsi ?? []).map((o) => (
                <div
                  key={o.id}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${o.is_benar ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                >
                  <span className={`font-bold ${o.is_benar ? 'text-green-700' : 'text-slate-500'}`}>{o.huruf}.</span>
                  <div className="flex-1 min-w-0"><RenderHTML html={o.teks_html || o.teks} className="text-slate-700 dark:text-slate-300" /></div>
                  {o.is_benar && <CheckCircle2 size={15} className="text-green-600 shrink-0 mt-0.5" />}
                </div>
              ))}
            </div>
          ) : (
            s.panduan_essay && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <span className="font-semibold">Rubrik / Panduan Jawaban:</span> {s.panduan_essay}
              </div>
            )
          )}
        </div>
      ))}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <button type="button" onClick={() => onChange(!checked)} aria-pressed={checked}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

function RejectDialog({ tryout, onClose, onConfirm }: {
  tryout: Tryout; onClose: () => void; onConfirm: (notes: string) => Promise<void>
}) {
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={saving ? undefined : onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2"><AlertTriangle size={18} className="text-red-500"/> Minta Revisi</h3>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"><X size={18} /></button>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Tulis catatan untuk guru — tryout dikembalikan dengan status “Butuh Revisi”.</p>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 truncate">{tryout.nama_tryout}</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          autoFocus
          placeholder="Contoh: Soal nomor 3 kurang jelas, mohon perbaiki opsi jawaban."
          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 p-3 text-sm outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
        />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} disabled={saving} className="flex-1 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl py-2.5 text-sm transition-colors disabled:opacity-50">Batal</button>
          <button
            onClick={async () => { if (!notes.trim()) { toast.error('Catatan revisi wajib diisi.'); return } setSaving(true); await onConfirm(notes.trim()) }}
            disabled={saving}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />} Kirim Revisi
          </button>
        </div>
      </div>
    </div>
  )
}
