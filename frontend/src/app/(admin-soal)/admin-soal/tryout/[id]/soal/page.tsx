'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, Plus, Trash2, Loader2, Database, Send, X, Search, Pencil, CheckCircle2,
} from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { levelPath, LEVEL_LABELS, LEVELS, type Level } from '@/lib/level'
import RichTextEditor, { RichTextEditorHandle } from '@/components/editor/RichTextEditor'
import RenderHTML from '@/components/shared/RenderHTML'
import {
  ApiResponse, MasterKelas, MasterMataPelajaran, Soal, SoalTipe, TryoutDetail,
} from '@/types'

export default function SuperTryoutBuilderPage() {
  return (
    <Suspense fallback={<div className="h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>}>
      <SuperTryoutBuilder />
    </Suspense>
  )
}

function randomKode(): string {
  return `SOAL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function SuperTryoutBuilder() {
  const { id: tryoutId } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const levelParam = (searchParams?.get('level') ?? 'sma') as Level
  const level: Level = LEVELS.includes(levelParam) ? levelParam : 'sma'

  const [tryout, setTryout] = useState<TryoutDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSoal, setEditingSoal] = useState<Soal | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    try {
      const r = await api.get<ApiResponse<TryoutDetail>>(levelPath(`/tryouts/${tryoutId}`, level))
      setTryout(r.data.data ?? null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memuat Super Try Out.'))
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }, [tryoutId, level])

  useEffect(() => { load() }, [load])

  async function handleDelete(soalId: string) {
    try {
      await api.delete(levelPath(`/soal/${soalId}`, level))
      toast.success('Soal dihapus.')
      setConfirmDelete(null)
      await load({ silent: true })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menghapus soal.'))
    }
  }

  async function publish() {
    setPublishing(true)
    try {
      // Super Try Out bypasses teacher approval — admin-soal publishes directly.
      await api.patch(levelPath(`/tryouts/${tryoutId}/status`, level), { status: 'published' })
      toast.success('Super Try Out dipublikasikan.')
      await load({ silent: true })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal mempublikasikan.'))
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
  }
  if (!tryout) {
    return <div className="h-[60vh] flex items-center justify-center text-slate-500">Super Try Out tidak ditemukan.</div>
  }

  const soalList = tryout.soal ?? []
  const totalBobot = soalList.reduce((s, q) => s + (q.bobot || 0), 0)

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
      <Link href="/admin-soal/dashboard" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline mb-4">
        <ArrowLeft size={15} /> Kembali ke Dashboard
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 rounded-full px-2.5 py-1">
              Super Try Out · {LEVEL_LABELS[level]}
            </span>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-2">{tryout.nama_tryout}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {tryout.mata_pelajaran}{tryout.kelas ? ` · ${tryout.kelas}` : ''} · {soalList.length} soal · bobot {totalBobot}
            </p>
          </div>
          <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-full px-3 py-1">
            {tryout.status === 'published' ? 'Aktif' : tryout.status === 'draft' ? 'Draft' : tryout.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => { setEditingSoal(null); setEditorOpen(true) }}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors shadow-sm">
            <Plus size={15} /> Tambah Soal Manual
          </button>
          <button onClick={() => setBankOpen(true)}
            className="inline-flex items-center gap-1.5 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors">
            <Database size={15} /> Ambil dari Bank Soal
          </button>
          {tryout.status !== 'published' && (
            <button onClick={publish} disabled={publishing || soalList.length === 0}
              className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors shadow-sm ml-auto">
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Publikasikan
            </button>
          )}
        </div>
      </div>

      {/* Question list */}
      <div className="mt-5 space-y-3">
        {soalList.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center text-sm text-slate-400">
            Belum ada soal. Tambah manual atau impor dari Bank Soal.
          </div>
        ) : (
          soalList.map((s, i) => (
            <div key={s.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${s.tipe === 'pilihan_ganda' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                      {s.tipe === 'pilihan_ganda' ? 'PG' : 'Essay'}
                    </span>
                    {s.kode_soal && <span className="text-[10px] font-mono bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">{s.kode_soal}</span>}
                    <span className="text-[10px] text-slate-400">Bobot {s.bobot}</span>
                    {s.penyelesaian_html && <span className="text-[10px] text-green-600 inline-flex items-center gap-0.5"><CheckCircle2 size={11} /> ada pembahasan</span>}
                  </div>
                  <RenderHTML html={s.pertanyaan_html || s.pertanyaan || ''} className="text-sm text-slate-700 dark:text-slate-300" />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditingSoal(s); setEditorOpen(true) }} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit soal"><Pencil size={15} /></button>
                  <button onClick={() => setConfirmDelete(s.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Hapus soal"><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {bankOpen && (
        <BankModal
          level={level}
          tryoutId={tryoutId}
          onClose={() => setBankOpen(false)}
          onImported={async () => { setBankOpen(false); await load({ silent: true }) }}
        />
      )}

      {editorOpen && (
        <QuestionEditorModal
          key={editingSoal?.id ?? 'new'}
          level={level}
          tryoutId={tryoutId}
          soal={editingSoal}
          onClose={() => setEditorOpen(false)}
          onSaved={async () => { setEditorOpen(false); await load({ silent: true }) }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 text-center">Hapus soal ini?</h3>
            <p className="text-sm text-slate-500 text-center mt-1.5">Hanya menghapus dari Super Try Out ini, tidak memengaruhi soal asli guru.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl py-2.5 text-sm">Batal</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl py-2.5 text-sm">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Bank Soal import modal ────────────────────────────────────────────────────
interface BankItem extends Soal {
  nama_tryout?: string
}

function BankModal({ level, tryoutId, onClose, onImported }: {
  level: Level; tryoutId: string; onClose: () => void; onImported: () => void
}) {
  const [mapel, setMapel] = useState('')
  const [kelas, setKelas] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [items, setItems] = useState<BankItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [searched, setSearched] = useState(false)
  const [mapelList, setMapelList] = useState<MasterMataPelajaran[]>([])
  const [kelasList, setKelasList] = useState<MasterKelas[]>([])

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<MasterMataPelajaran[]>>('/master/mata-pelajaran').catch(() => null),
      api.get<ApiResponse<MasterKelas[]>>('/master/kelas').catch(() => null),
    ]).then(([m, k]) => {
      setMapelList((m?.data.data ?? []).filter((x) => x.level === level.toUpperCase()))
      setKelasList((k?.data.data ?? []).filter((x) => x.level === level.toUpperCase()))
    })
    // run an initial unfiltered search
    search()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function search() {
    setSearching(true)
    try {
      const params = new URLSearchParams()
      if (mapel.trim()) params.set('mata_pelajaran', mapel.trim())
      if (kelas.trim()) params.set('kelas', kelas.trim())
      if (searchQuery.trim()) params.set('search', searchQuery.trim())
      const qs = params.toString()
      const r = await api.get<ApiResponse<BankItem[]>>(levelPath(`/soal/bank${qs ? `?${qs}` : ''}`, level))
      setItems(r.data.data ?? [])
      setSearched(true)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memuat Bank Soal.'))
    } finally {
      setSearching(false)
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  }

  async function importSelected() {
    if (selected.size === 0) { toast.error('Pilih minimal satu soal.'); return }
    setImporting(true)
    try {
      const r = await api.post<ApiResponse<{ imported: number }>>(
        levelPath(`/tryouts/${tryoutId}/import-questions`, level),
        { questionIds: Array.from(selected) }
      )
      toast.success(r.data.message ?? `${r.data.data?.imported ?? selected.size} soal diimpor.`)
      onImported()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal mengimpor soal.'))
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Database size={18} /></span>
            <div>
              <h3 className="font-bold text-slate-900">Bank Soal — {LEVEL_LABELS[level]}</h3>
              <p className="text-xs text-slate-400">Cari & impor soal dari guru lain ke Super Try Out</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cari Kode Soal / Kata Kunci</label>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') search() }}
              placeholder="cth: MTK-SMA-001 atau kata kunci"
              className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Mata Pelajaran</label>
            <input value={mapel} onChange={(e) => setMapel(e.target.value)} list="bank-mapel" placeholder="Semua"
              className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            <datalist id="bank-mapel">{mapelList.map((m) => <option key={m.id} value={m.nama} />)}</datalist>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Kelas</label>
            <input value={kelas} onChange={(e) => setKelas(e.target.value)} list="bank-kelas" placeholder="Semua"
              className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            <datalist id="bank-kelas">{kelasList.map((k) => <option key={k.id} value={k.nama} />)}</datalist>
          </div>
          <button onClick={search} disabled={searching}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors">
            {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Cari
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {searching ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">{searched ? 'Tidak ada soal yang cocok.' : 'Gunakan filter lalu klik Cari.'}</p>
          ) : (
            items.map((s) => {
              const isSel = selected.has(s.id)
              return (
                <button key={s.id} onClick={() => toggle(s.id)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${isSel ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200 hover:border-blue-200'}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${isSel ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                      {isSel && <CheckCircle2 size={13} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {s.kode_soal && <span className="text-[10px] font-mono bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">{s.kode_soal}</span>}
                        <span className="text-[10px] text-slate-400">{s.nama_tryout}</span>
                      </div>
                      <RenderHTML html={s.pertanyaan_html || s.pertanyaan || ''} className="text-sm text-slate-700" />
                      {(s.penyelesaian_html || s.penyelesaian) && (
                        <div className="mt-1">
                          <span className="text-[11px] font-semibold text-green-600">Pembahasan: </span>
                          <RenderHTML html={s.penyelesaian_html || s.penyelesaian || ''} className="text-[11px] text-green-600" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-sm text-slate-500"><strong className="text-slate-800">{selected.size}</strong> soal dipilih</span>
          <button onClick={importSelected} disabled={importing || selected.size === 0}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-colors">
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Import Soal
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Question editor modal (manual add / edit) ─────────────────────────────────
interface DraftOpsi { huruf: string; teks: string; is_benar: boolean }

function QuestionEditorModal({ level, tryoutId, soal, onClose, onSaved }: {
  level: Level; tryoutId: string; soal: Soal | null; onClose: () => void; onSaved: () => void
}) {
  const isEdit = !!soal
  const qRef = useRef<RichTextEditorHandle>(null)
  const solRef = useRef<RichTextEditorHandle>(null)
  const [tipe, setTipe] = useState<SoalTipe>(soal?.tipe ?? 'pilihan_ganda')
  const [bobot, setBobot] = useState(soal?.bobot ?? 1)
  const [kode, setKode] = useState(soal?.kode_soal ?? '')
  const [panduan, setPanduan] = useState(soal?.panduan_essay ?? '')
  const [opsi, setOpsi] = useState<DraftOpsi[]>(
    soal?.opsi && soal.opsi.length > 0
      ? soal.opsi.map((o) => ({ huruf: o.huruf, teks: o.teks, is_benar: !!o.is_benar }))
      : [
          { huruf: 'A', teks: '', is_benar: false },
          { huruf: 'B', teks: '', is_benar: false },
          { huruf: 'C', teks: '', is_benar: false },
          { huruf: 'D', teks: '', is_benar: false },
        ]
  )
  const [saving, setSaving] = useState(false)

  function setCorrect(idx: number) {
    setOpsi((prev) => prev.map((o, i) => ({ ...o, is_benar: i === idx })))
  }
  function setOpsiTeks(idx: number, teks: string) {
    setOpsi((prev) => prev.map((o, i) => (i === idx ? { ...o, teks } : o)))
  }
  function addOpsi() {
    setOpsi((prev) => prev.length >= 5 ? prev : [...prev, { huruf: String.fromCharCode(65 + prev.length), teks: '', is_benar: false }])
  }
  function removeOpsi(idx: number) {
    setOpsi((prev) => prev.length <= 2 ? prev : prev.filter((_, i) => i !== idx).map((o, i) => ({ ...o, huruf: String.fromCharCode(65 + i) })))
  }

  async function save() {
    const pertanyaanHtml = qRef.current?.getHtml() ?? ''
    const pertanyaanText = (qRef.current?.getText() ?? '').trim()
    if (!pertanyaanText) { toast.error('Pertanyaan tidak boleh kosong.'); return }

    let opsiPayload: { huruf: string; teks: string; teks_html: string; is_benar: boolean }[] | undefined
    if (tipe === 'pilihan_ganda') {
      if (opsi.length < 2) { toast.error('Minimal 2 opsi.'); return }
      if (!opsi.some((o) => o.is_benar)) { toast.error('Tandai satu jawaban benar.'); return }
      if (opsi.some((o) => !o.teks.trim())) { toast.error('Semua opsi harus diisi.'); return }
      opsiPayload = opsi.map((o) => ({ huruf: o.huruf, teks: o.teks.trim(), teks_html: o.teks.trim(), is_benar: o.is_benar }))
    }

    const penyelesaianHtml = solRef.current?.getHtml() ?? ''
    const penyelesaianText = (solRef.current?.getText() ?? '').trim()

    const body = {
      tipe,
      bobot,
      pertanyaan: pertanyaanText,
      pertanyaan_html: pertanyaanHtml,
      panduan_essay: tipe === 'essay' ? panduan : '',
      kode_soal: kode.trim() || randomKode(),
      penyelesaian: penyelesaianText || null,
      penyelesaian_html: penyelesaianHtml || null,
      opsi: opsiPayload,
    }

    setSaving(true)
    try {
      if (isEdit && soal) {
        await api.put(levelPath(`/soal/${soal.id}`, level), body)
        toast.success('Soal diperbarui.')
      } else {
        await api.post(levelPath(`/tryouts/${tryoutId}/soal`, level), body)
        toast.success('Soal ditambahkan.')
      }
      onSaved()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menyimpan soal.'))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{isEdit ? 'Edit Soal' : 'Tambah Soal Manual'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Tipe</label>
              <select value={tipe} onChange={(e) => setTipe(e.target.value as SoalTipe)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="pilihan_ganda">Pilihan Ganda</option>
                <option value="essay">Essay</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Bobot</label>
              <input type="number" min={1} value={bobot} onChange={(e) => setBobot(Math.max(1, Number(e.target.value) || 1))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold w-16 text-center outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Kode Soal</label>
              <input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Otomatis bila kosong"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Pertanyaan</label>
            <RichTextEditor ref={qRef} initialHtml={soal?.pertanyaan_html || soal?.pertanyaan || ''} minHeight="120px"
              placeholder="Tulis pertanyaan. Klik Σ untuk persamaan matematika." />
          </div>

          {tipe === 'pilihan_ganda' ? (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Pilihan Jawaban</label>
              <div className="space-y-2">
                {opsi.map((o, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button type="button" onClick={() => setCorrect(idx)}
                      className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center shrink-0 transition-colors ${o.is_benar ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-green-50'}`}>
                      {o.is_benar ? <CheckCircle2 size={15} /> : o.huruf}
                    </button>
                    <input value={o.teks} onChange={(e) => setOpsiTeks(idx, e.target.value)} placeholder={`Opsi ${o.huruf}`}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    <button type="button" onClick={() => removeOpsi(idx)} disabled={opsi.length <= 2}
                      className="text-slate-300 hover:text-red-500 disabled:opacity-30 p-1"><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>
              {opsi.length < 5 && (
                <button type="button" onClick={addOpsi} className="mt-2 inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-600 text-sm font-medium">
                  <Plus size={14} /> Tambah Opsi
                </button>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Panduan Jawaban (guru)</label>
              <textarea value={panduan} onChange={(e) => setPanduan(e.target.value)} rows={3}
                className="w-full rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-sm outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 resize-none" />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Penyelesaian / Pembahasan</label>
            <RichTextEditor ref={solRef} initialHtml={soal?.penyelesaian_html || soal?.penyelesaian || ''} minHeight="100px"
              placeholder="Langkah penyelesaian (opsional). Klik Σ untuk rumus." />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
          <button onClick={onClose} className="border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl px-5 py-2.5 text-sm">Batal</button>
          <button onClick={save} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl px-6 py-2.5 text-sm inline-flex items-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />} {isEdit ? 'Simpan Perubahan' : 'Tambah Soal'}
          </button>
        </div>
      </div>
    </div>
  )
}
