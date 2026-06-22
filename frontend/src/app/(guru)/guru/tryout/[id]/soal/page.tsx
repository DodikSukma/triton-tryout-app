'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus, Trash2, CheckCircle2,
  AlertTriangle, Loader2, FileQuestion, Send, Upload, FileType2,
} from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import RichTextEditor, { RichTextEditorHandle } from '@/components/editor/RichTextEditor'
import TritonLoader from '@/components/common/TritonLoader'
// AI question generator hidden per client request (TRN-09 Feature 2).
import ImportSoalModal from '@/components/editor/ImportSoalModal'
import WordImportModal from '@/components/editor/WordImportModal'
import { ApiResponse, Soal, SoalTipe, TryoutDetail } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DraftOpsi {
  id?: string
  huruf: string
  teks_html: string
  is_benar: boolean
}

interface DraftSoal {
  id?: string
  nomor_soal?: number
  tipe: SoalTipe
  bobot: number
  pertanyaan_html: string
  panduan_essay: string
  kode_soal: string
  penyelesaian: string
  penyelesaian_html: string
  opsi: DraftOpsi[]
}

const NEW_SOAL_DEFAULT: DraftSoal = {
  tipe: 'pilihan_ganda',
  bobot: 1,
  pertanyaan_html: '',
  panduan_essay: '',
  kode_soal: '',
  penyelesaian: '',
  penyelesaian_html: '',
  opsi: [
    { huruf: 'A', teks_html: '', is_benar: false },
    { huruf: 'B', teks_html: '', is_benar: false },
    { huruf: 'C', teks_html: '', is_benar: false },
    { huruf: 'D', teks_html: '', is_benar: false },
  ],
}

// Auto-generate a question code when the teacher leaves it blank.
function generateKodeSoal(): string {
  return `SOAL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function soalToDraft(s: Soal): DraftSoal {
  return {
    id: s.id,
    nomor_soal: s.nomor_soal,
    tipe: s.tipe,
    bobot: s.bobot,
    pertanyaan_html: s.pertanyaan_html || s.pertanyaan || '',
    panduan_essay: s.panduan_essay ?? '',
    kode_soal: s.kode_soal ?? '',
    penyelesaian: s.penyelesaian ?? '',
    penyelesaian_html: s.penyelesaian_html ?? '',
    opsi: (s.opsi ?? []).map((o) => ({
      id: o.id,
      huruf: o.huruf,
      teks_html: o.teks_html || o.teks || '',
      is_benar: !!o.is_benar,
    })),
  }
}

function statusBadge(status: string) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    draft:            { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Draft' },
    pending_approval: { bg: 'bg-blue-100',  text: 'text-blue-700',  label: 'Menunggu Persetujuan' },
    approved:         { bg: 'bg-teal-100',  text: 'text-teal-700',  label: 'Disetujui' },
    rejected:         { bg: 'bg-red-100',   text: 'text-red-700',   label: 'Butuh Revisi' },
    published:        { bg: 'bg-green-100', text: 'text-green-700', label: 'Aktif' },
    closed:           { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Selesai' },
  }
  return map[status] ?? map.draft
}

function hasSoalIssue(s: Soal): boolean {
  if (s.tipe !== 'pilihan_ganda') return false
  const opsi = s.opsi ?? []
  return opsi.length < 2 || !opsi.some((o) => Boolean(o.is_benar))
}

function htmlToText(html: string): string {
  if (typeof window === 'undefined') return html
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  tmp.querySelectorAll('.katex-equation').forEach((el) => {
    const latex = el.getAttribute('data-latex')
    el.textContent = latex ? `[${latex}]` : '[equation]'
  })
  return tmp.innerText || tmp.textContent || ''
}

function stripHtmlForPreview(html: string | null | undefined): string {
  if (!html) return ''
  if (typeof window === 'undefined') return html.replace(/<[^>]*>/g, '')
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  tmp.querySelectorAll('.katex-equation').forEach((el) => {
    const l = el.getAttribute('data-latex')
    el.textContent = l ? ` [${l}] ` : ' [eq] '
  })
  tmp.querySelectorAll('figure').forEach((el) => el.replaceWith('[gambar]'))
  return (tmp.innerText || '').trim().replace(/\s+/g, ' ')
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function KelolaSoalPage() {
  const { id: tryoutId } = useParams<{ id: string }>()

  const [tryout,        setTryout]        = useState<TryoutDetail | null>(null)
  const [draft,         setDraft]         = useState<DraftSoal | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [publishing,    setPublishing]    = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [importOpen,    setImportOpen]    = useState(false)
  const [wordOpen,      setWordOpen]      = useState(false)
  // Increments on every soal switch — forces SoalEditor to remount so uncontrolled
  // OpsiEditor contentEditable divs always reset to the correct soal's content.
  const [editorKey,     setEditorKey]     = useState(0)
  // Mobile navigation: 'list' = sidebar visible, 'editor' = editor visible.
  const [mobileView,    setMobileView]    = useState<'list' | 'editor'>('list')

  const editorRef       = useRef<RichTextEditorHandle>(null)
  const penyelesaianRef = useRef<RichTextEditorHandle>(null)
  const opsiHtmlRef     = useRef<string[]>([])

  // ─── Data fetching ───────────────────────────────────────────────

  const fetchTryout = useCallback(
    async function fetchTryout(opts?: { silent?: boolean }) {
      try {
        if (!opts?.silent) setLoading(true)
        const res = await api.get<ApiResponse<TryoutDetail>>(`/tryouts/${tryoutId}`)
        setTryout(res.data.data ?? null)
        return res.data.data ?? null
      } catch (err) {
        toast.error(getErrorMessage(err, 'Gagal memuat data tryout.'))
        return null
      } finally {
        if (!opts?.silent) setLoading(false)
      }
    },
    [tryoutId]
  )

  useEffect(() => { fetchTryout() }, [fetchTryout])

  // ─── Select / create soal ────────────────────────────────────────

  function startNew() {
    setDraft({ ...NEW_SOAL_DEFAULT, opsi: NEW_SOAL_DEFAULT.opsi.map((o) => ({ ...o })) })
    opsiHtmlRef.current = NEW_SOAL_DEFAULT.opsi.map((o) => o.teks_html)
    setEditorKey((k) => k + 1)
    setMobileView('editor')
    setTimeout(() => {
      editorRef.current?.setHtml('')
      penyelesaianRef.current?.setHtml('')
    }, 50)
  }

  function selectSoal(s: Soal) {
    const d = soalToDraft(s)
    setDraft(d)
    opsiHtmlRef.current = d.opsi.map((o) => o.teks_html)
    setEditorKey((k) => k + 1)
    setMobileView('editor')
    setTimeout(() => {
      editorRef.current?.setHtml(d.pertanyaan_html)
      penyelesaianRef.current?.setHtml(d.penyelesaian_html)
    }, 50)
  }

  function backToList() {
    setDraft(null)
    setMobileView('list')
  }

  function updateDraft<K extends keyof DraftSoal>(key: K, value: DraftSoal[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d))
  }

  function updateOpsi(idx: number, patch: Partial<DraftOpsi>) {
    setDraft((d) => {
      if (!d) return d
      const opsi = [...d.opsi]
      opsi[idx] = { ...opsi[idx], ...patch }
      return { ...d, opsi }
    })
  }

  function markCorrect(idx: number) {
    setDraft((d) => {
      if (!d) return d
      return { ...d, opsi: d.opsi.map((o, i) => ({ ...o, is_benar: i === idx })) }
    })
  }

  function addOpsi() {
    setDraft((d) => {
      if (!d) return d
      if (d.opsi.length >= 5) { toast.error('Maksimal 5 opsi jawaban.'); return d }
      const huruf = String.fromCharCode(65 + d.opsi.length)
      opsiHtmlRef.current = [...opsiHtmlRef.current, '']
      return { ...d, opsi: [...d.opsi, { huruf, teks_html: '', is_benar: false }] }
    })
  }

  function removeOpsi(idx: number) {
    setDraft((d) => {
      if (!d) return d
      if (d.opsi.length <= 2) { toast.error('Minimal 2 opsi jawaban.'); return d }
      const next = d.opsi
        .filter((_, i) => i !== idx)
        .map((o, i) => ({ ...o, huruf: String.fromCharCode(65 + i) }))
      opsiHtmlRef.current = opsiHtmlRef.current.filter((_, i) => i !== idx)
      return { ...d, opsi: next }
    })
  }

  // ─── Save / delete ───────────────────────────────────────────────

  async function handleSave() {
    if (!draft) return
    const html = editorRef.current?.getHtml() ?? draft.pertanyaan_html
    const text = editorRef.current?.getText() ?? ''
    if (!text.trim()) { toast.error('Pertanyaan tidak boleh kosong.'); return }

    // TRN-10: solution editor + question code (auto-generated when blank).
    const penyelesaianHtml = penyelesaianRef.current?.getHtml() ?? draft.penyelesaian_html
    const penyelesaianText = (penyelesaianRef.current?.getText() ?? draft.penyelesaian).trim()
    const kodeSoal = draft.kode_soal.trim() || generateKodeSoal()

    let opsiPayload: { huruf: string; teks: string; teks_html: string; is_benar: boolean }[] | undefined
    if (draft.tipe === 'pilihan_ganda') {
      if (draft.opsi.length < 2) { toast.error('Pilihan ganda butuh minimal 2 opsi.'); return }
      if (!draft.opsi.some((o) => o.is_benar)) {
        toast.error('Pilih salah satu opsi sebagai jawaban yang benar.')
        return
      }
      opsiPayload = draft.opsi.map((o, i) => {
        const opsiHtml = opsiHtmlRef.current[i] ?? o.teks_html
        const opsiText = htmlToText(opsiHtml).trim()
        if (!opsiText) throw new Error(`Opsi ${o.huruf} kosong.`)
        return { huruf: o.huruf, teks: opsiText, teks_html: opsiHtml, is_benar: o.is_benar }
      })
    }

    setSaving(true)
    try {
      const body = {
        tipe: draft.tipe,
        bobot: draft.bobot,
        pertanyaan: text.trim(),
        pertanyaan_html: html,
        panduan_essay: draft.tipe === 'essay' ? draft.panduan_essay : '',
        kode_soal: kodeSoal,
        penyelesaian: penyelesaianText || null,
        penyelesaian_html: penyelesaianHtml || null,
        opsi: opsiPayload,
      }
      let savedSoal: Soal | undefined
      if (draft.id) {
        const res = await api.put<ApiResponse<Soal>>(`/soal/${draft.id}`, body)
        savedSoal = res.data.data
        toast.success('Soal berhasil diperbarui.')
      } else {
        const res = await api.post<ApiResponse<Soal>>(`/tryouts/${tryoutId}/soal`, body)
        savedSoal = res.data.data
        toast.success('Soal berhasil disimpan.')
      }
      await fetchTryout({ silent: true })
      if (savedSoal) {
        const fresh = (await fetchTryout({ silent: true }))?.soal.find((s) => s.id === savedSoal!.id)
        if (fresh) selectSoal(fresh)
      }
    } catch (err) {
      const msg = err instanceof Error && err.message.includes('kosong')
        ? err.message
        : getErrorMessage(err, 'Gagal menyimpan soal.')
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(soalId: string) {
    try {
      await api.delete(`/soal/${soalId}`)
      toast.success('Soal berhasil dihapus.')
      setConfirmDelete(null)
      if (draft?.id === soalId) backToList()
      await fetchTryout({ silent: true })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menghapus soal.'))
    }
  }

  async function changeStatus(status: 'draft' | 'pending_approval', opts?: { requireSoal?: boolean }) {
    if (!tryout) return
    if (opts?.requireSoal && (tryout.soal?.length ?? 0) === 0) {
      toast.error('Tambahkan minimal 1 soal sebelum mengajukan.')
      return
    }
    setPublishing(true)
    try {
      await api.patch(`/tryouts/${tryoutId}/status`, { status })
      toast.success(status === 'pending_approval'
        ? 'Tryout diajukan untuk persetujuan admin.'
        : 'Tryout dikembalikan ke draft.')
      await fetchTryout({ silent: true })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memperbarui status.'))
    } finally {
      setPublishing(false)
    }
  }

  // ─── Loading / error states ──────────────────────────────────────

  if (loading) {
    return <TritonLoader fullScreen={false} />
  }

  if (!tryout) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-500">
        Tryout tidak ditemukan.
      </div>
    )
  }

  const soalList       = tryout.soal ?? []
  const totalBobot     = soalList.reduce((sum, s) => sum + (s.bobot || 0), 0)
  const sb             = statusBadge(tryout.status)
  const currentSoalIdx = draft?.id ? soalList.findIndex((s) => s.id === draft.id) : soalList.length

  // ─── Render ──────────────────────────────────────────────────────

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">

      {/* ══════════════════════════════════════════════════════
          LEFT SIDEBAR
          • mobile: full-width, hidden when mobileView==='editor'
          • lg+: fixed 288px, always visible
         ══════════════════════════════════════════════════════ */}
      <aside
        className={`shrink-0 border-r border-slate-100 bg-white flex-col
          ${mobileView === 'editor' ? 'hidden lg:flex lg:w-72' : 'flex w-full lg:w-72'}`}
      >
        {/* Sidebar header */}
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-slate-100">
          <Link
            href="/guru/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline mb-2"
          >
            <ArrowLeft size={14} />
            Kembali ke Dashboard
          </Link>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-tight">{tryout.nama_tryout}</h2>
          <p className="text-xs text-slate-400 mt-1">{tryout.mata_pelajaran} · {tryout.durasi_menit} menit</p>
          <span className={`mt-2 inline-block ${sb.bg} ${sb.text} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
            {sb.label}
          </span>
        </div>

        {/* Action buttons */}
        <div className="p-3 sm:p-4 border-b border-slate-100 space-y-2">
          <button
            onClick={startNew}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl py-2.5 px-4 text-sm flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-95"
          >
            <Plus size={16} />
            Tambah Soal Manual
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="w-full border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100 font-semibold rounded-xl py-2 px-2 text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <Upload size={13} />
            Import Soal
          </button>
          <button
            onClick={() => setWordOpen(true)}
            className="w-full border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 font-semibold rounded-xl py-2 px-2 text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <FileType2 size={13} />
            Import dari Word
          </button>
        </div>

        {/* Soal list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {soalList.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-12 px-4">
              Belum ada soal. Klik <strong>&quot;Tambah Soal Manual&quot;</strong> untuk membuat.
            </div>
          ) : (
            soalList.map((s, i) => {
              const isActive = draft?.id === s.id
              const isPG     = s.tipe === 'pilihan_ganda'
              const hasIssue = hasSoalIssue(s)

              return (
                <div
                  key={s.id}
                  onClick={() => selectSoal(s)}
                  className={`group cursor-pointer rounded-xl p-3 border transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 border-blue-500 border-l-4'
                      : hasIssue
                        ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                        : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                    }`}>
                      {i + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`inline-block text-[10px] font-semibold rounded px-1.5 py-0.5 ${
                          isPG ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                        }`}>
                          {isPG ? 'PG' : 'Essay'}
                        </span>
                        {hasIssue && (
                          <span
                            title="Kunci jawaban belum dipilih"
                            className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                          />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-snug">
                        {stripHtmlForPreview(s.pertanyaan_html || s.pertanyaan) || (
                          <span className="italic text-slate-400">(kosong)</span>
                        )}
                      </p>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(s.id) }}
                      className="text-slate-300 hover:text-red-500 transition-colors p-0.5 shrink-0 mt-0.5"
                      title="Hapus soal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer stats + publish */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            <strong className="text-slate-900 dark:text-slate-100">{soalList.length}</strong> soal · Total bobot:{' '}
            <strong className="text-slate-900 dark:text-slate-100">{totalBobot}</strong>
          </p>
          {(tryout.status === 'draft' || tryout.status === 'rejected') && (
            <>
              {tryout.status === 'rejected' && tryout.revision_notes && (
                <div className="mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                  <span className="font-semibold">Catatan revisi admin:</span> {tryout.revision_notes}
                </div>
              )}
              <button
                onClick={() => changeStatus('pending_approval', { requireSoal: true })}
                disabled={publishing || soalList.length === 0}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-95"
              >
                {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {publishing ? 'Mengajukan...' : 'Ajukan Persetujuan'}
              </button>
            </>
          )}
          {tryout.status === 'pending_approval' && (
            <div className="space-y-2">
              <p className="text-xs text-center text-blue-600 bg-blue-50 border border-blue-200 rounded-lg py-2 font-medium">
                Menunggu persetujuan admin
              </p>
              <button
                onClick={() => changeStatus('draft')}
                disabled={publishing}
                className="w-full border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl py-2 text-sm transition-colors"
              >
                {publishing ? 'Memproses...' : 'Tarik ke Draft'}
              </button>
            </div>
          )}
          {tryout.status === 'approved' && (
            <p className="text-xs text-center text-teal-600 bg-teal-50 border border-teal-200 rounded-lg py-2 font-medium">
              Disetujui — menunggu publikasi admin
            </p>
          )}
          {tryout.status === 'published' && (
            <p className="text-xs text-center text-green-600 bg-green-50 border border-green-200 rounded-lg py-2 font-medium">
              Tryout aktif (dikelola admin)
            </p>
          )}
          {tryout.status === 'closed' && (
            <p className="text-xs text-center text-slate-500 bg-slate-100 border border-slate-200 rounded-lg py-2 font-medium">
              Tryout selesai
            </p>
          )}
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════
          MAIN EDITOR AREA
          • mobile: full-width, hidden when mobileView==='list'
          • lg+: flex-1, always visible
         ══════════════════════════════════════════════════════ */}
      <main
        className={`flex-col overflow-hidden
          ${mobileView === 'list' ? 'hidden lg:flex lg:flex-1' : 'flex flex-1'}`}
      >
        {/* ── Mobile top bar (back navigation) ─────────────── */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-100 shrink-0">
          <button
            onClick={backToList}
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-500 hover:text-blue-600 transition-colors active:scale-95"
          >
            <ArrowLeft size={16} />
            Daftar Soal
          </button>
          {draft && (
            <div className="ml-auto flex items-center gap-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                draft.tipe === 'pilihan_ganda' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
              }`}>
                {draft.tipe === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Essay'}
              </span>
              <span className="text-xs text-slate-400">Bobot {draft.bobot}</span>
            </div>
          )}
        </div>

        {/* ── Scrollable content ────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {!draft ? (
            // Desktop empty state only — on mobile we never reach this (mobileView guards it)
            <div className="hidden lg:flex h-full flex-col items-center justify-center text-center px-6">
              <FileQuestion size={56} className="text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg font-medium">Pilih soal di kiri atau tambah soal baru</p>
              <p className="text-slate-400 text-sm mt-1">
                Editor akan muncul di sini setelah memilih atau membuat soal.
              </p>
              <button
                onClick={startNew}
                className="mt-6 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-5 py-2.5 font-semibold text-sm transition-colors"
              >
                <Plus size={16} /> Tambah Soal Baru
              </button>
            </div>
          ) : (
            <SoalEditor
              key={editorKey}
              draft={draft}
              editorRef={editorRef}
              penyelesaianRef={penyelesaianRef}
              opsiHtmlRef={opsiHtmlRef}
              saving={saving}
              soalCount={soalList.length}
              soalIndex={currentSoalIdx}
              updateDraft={updateDraft}
              updateOpsi={updateOpsi}
              markCorrect={markCorrect}
              addOpsi={addOpsi}
              removeOpsi={removeOpsi}
              onSave={handleSave}
              onCancel={backToList}
              onRequestDelete={(id) => setConfirmDelete(id)}
              onPrev={currentSoalIdx > 0 ? () => selectSoal(soalList[currentSoalIdx - 1]) : undefined}
              onNext={currentSoalIdx < soalList.length - 1 ? () => selectSoal(soalList[currentSoalIdx + 1]) : undefined}
            />
          )}
        </div>
      </main>

      {/* AI Generator hidden per client request (TRN-09 Feature 2). */}

      {/* ── Import Soal Modal ─────────────────────────────── */}
      {importOpen && (
        <ImportSoalModal
          tryoutId={tryoutId}
          onClose={() => setImportOpen(false)}
          onSaved={() => fetchTryout({ silent: true })}
        />
      )}

      {/* ── Import dari Word Modal ─────────────────────────── */}
      {wordOpen && (
        <WordImportModal
          tryoutId={tryoutId}
          onClose={() => setWordOpen(false)}
          onSaved={() => fetchTryout({ silent: true })}
        />
      )}

      {/* ── Delete confirmation ───────────────────────────── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 mx-auto mb-3">
              <AlertTriangle size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 text-center">Hapus soal ini?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1.5">
              Soal yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl py-2.5 text-sm transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-component: SoalEditor ────────────────────────────────────────────────

interface SoalEditorProps {
  draft: DraftSoal
  editorRef: React.RefObject<RichTextEditorHandle>
  penyelesaianRef: React.RefObject<RichTextEditorHandle>
  opsiHtmlRef: React.MutableRefObject<string[]>
  saving: boolean
  soalCount: number
  soalIndex: number
  updateDraft: <K extends keyof DraftSoal>(key: K, value: DraftSoal[K]) => void
  updateOpsi: (idx: number, patch: Partial<DraftOpsi>) => void
  markCorrect: (idx: number) => void
  addOpsi: () => void
  removeOpsi: (idx: number) => void
  onSave: () => void
  onCancel: () => void
  onRequestDelete: (id: string) => void
  onPrev?: () => void
  onNext?: () => void
}

function SoalEditor({
  draft, editorRef, penyelesaianRef, opsiHtmlRef, saving, soalCount, soalIndex,
  updateDraft, updateOpsi, markCorrect, addOpsi, removeOpsi,
  onSave, onCancel, onRequestDelete, onPrev, onNext,
}: SoalEditorProps) {
  const correctIdx = draft.opsi.findIndex((o) => o.is_benar)
  const isExisting = !!draft.id

  const pgMissingKey  = draft.tipe === 'pilihan_ganda' && correctIdx < 0
  const pgMissingOpsi = draft.tipe === 'pilihan_ganda' && draft.opsi.length < 2
  const hasWarning    = pgMissingKey || pgMissingOpsi

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-5 md:p-8 pb-28 sm:pb-32">
      <div className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm overflow-hidden transition-colors ${
        hasWarning ? 'border-amber-200 dark:border-amber-700' : 'border-slate-100 dark:border-slate-700'
      }`}>

        {/* Validation warning banner */}
        {hasWarning && (
          <div className="px-4 sm:px-6 md:px-8 py-2.5 bg-amber-50/30 border-b border-amber-200 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
            <p className="text-xs font-semibold text-amber-700">
              {pgMissingOpsi
                ? 'Tambahkan minimal 2 opsi jawaban.'
                : 'Tandai satu opsi sebagai jawaban yang benar.'}
            </p>
          </div>
        )}

        {/* ── Card header: tipe + bobot + meta ─────────── */}
        <div className="px-4 sm:px-6 md:px-8 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 flex-wrap">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Tipe Soal
            </label>
            <select
              value={draft.tipe}
              onChange={(e) => updateDraft('tipe', e.target.value as SoalTipe)}
              className="rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white dark:bg-slate-700"
            >
              <option value="pilihan_ganda">Pilihan Ganda</option>
              <option value="essay">Essay</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Bobot
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={draft.bobot}
              onChange={(e) => updateDraft('bobot', Math.max(1, Number(e.target.value) || 1))}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold w-16 text-center outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Kode Soal
            </label>
            <input
              type="text"
              value={draft.kode_soal}
              onChange={(e) => updateDraft('kode_soal', e.target.value)}
              placeholder="Otomatis bila kosong"
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 w-40 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:block">
              Soal ke-{soalIndex + 1}{isExisting ? ` / ${soalCount}` : ''}
            </span>
            {isExisting && (
              <button
                onClick={() => draft.id && onRequestDelete(draft.id)}
                className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50"
              >
                <Trash2 size={13} /> Hapus
              </button>
            )}
          </div>
        </div>

        {/* ── Question ─────────────────────────────────── */}
        <div className="px-4 sm:px-6 md:px-8 py-5 border-b border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Pertanyaan</label>
          <RichTextEditor
            ref={editorRef}
            initialHtml={draft.pertanyaan_html}
            placeholder="Tulis pertanyaan di sini. Klik Σ untuk persamaan matematika."
            minHeight="140px"
          />
        </div>

        {/* ── Pilihan Ganda options ─────────────────────── */}
        {draft.tipe === 'pilihan_ganda' && (
          <div className={`px-4 sm:px-6 md:px-8 py-5 border-b transition-colors ${
            hasWarning ? 'border-amber-100 bg-amber-50/10' : 'border-slate-100'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700">Pilihan Jawaban</label>
              <span className="text-xs text-slate-400 hidden sm:block">Pilih satu jawaban benar</span>
            </div>

            <div className="space-y-2.5">
              {draft.opsi.map((o, idx) => (
                <div key={idx} className="flex items-start gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => markCorrect(idx)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 mt-1 rounded-full flex items-center justify-center shrink-0 transition-all font-bold text-sm ${
                      o.is_benar
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-500'
                    }`}
                  >
                    {o.is_benar ? <CheckCircle2 size={15} /> : o.huruf}
                  </button>

                  <div className="flex-1">
                    <OpsiEditor
                      initialHtml={o.teks_html}
                      placeholder={`Opsi ${o.huruf}`}
                      correct={o.is_benar}
                      onChange={(html) => {
                        opsiHtmlRef.current[idx] = html
                        updateOpsi(idx, { teks_html: html })
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeOpsi(idx)}
                    disabled={draft.opsi.length <= 2}
                    className="text-slate-300 hover:text-red-500 transition-colors mt-2.5 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {draft.opsi.length < 5 && (
              <button
                type="button"
                onClick={addOpsi}
                className="mt-3 inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors"
              >
                <Plus size={14} /> Tambah Opsi
              </button>
            )}

            <div className="mt-3 text-sm flex items-center gap-2">
              {correctIdx >= 0 ? (
                <>
                  <CheckCircle2 size={15} className="text-green-500" />
                  <span className="text-green-600 font-medium text-xs sm:text-sm">
                    Kunci jawaban: Opsi {draft.opsi[correctIdx].huruf}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={15} className="text-amber-500" />
                  <span className="text-amber-600 text-xs sm:text-sm">Belum ada kunci jawaban dipilih.</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Essay guide ───────────────────────────────── */}
        {draft.tipe === 'essay' && (
          <div className="px-4 sm:px-6 md:px-8 py-5 border-b border-slate-100">
            <label className="block text-sm font-semibold text-slate-700">Panduan Jawaban</label>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">
              Hanya terlihat guru — panduan penilaian manual.
            </p>
            <textarea
              value={draft.panduan_essay}
              onChange={(e) => updateDraft('panduan_essay', e.target.value)}
              rows={4}
              placeholder="Tuliskan kunci jawaban atau rubrik penilaian essay ini..."
              className="w-full rounded-xl border border-amber-200 bg-amber-50/40 p-3 sm:p-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all resize-none"
            />
          </div>
        )}

        {/* ── Penyelesaian / Pembahasan (TRN-10) ────────── */}
        <div className="px-4 sm:px-6 md:px-8 py-5 border-b border-slate-100">
          <label className="block text-sm font-semibold text-slate-700">Penyelesaian / Pembahasan</label>
          <p className="text-xs text-slate-400 mt-0.5 mb-3">
            Opsional — ditampilkan ke siswa setelah ujian selesai. Mendukung rumus matematika &amp; gambar.
          </p>
          <RichTextEditor
            ref={penyelesaianRef}
            initialHtml={draft.penyelesaian_html}
            placeholder="Tulis langkah penyelesaian di sini. Klik Σ untuk persamaan matematika."
            minHeight="120px"
          />
        </div>

        {/* ── Sticky save bar ───────────────────────────── */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center gap-2 sm:gap-3 shadow-[0_-4px_12px_rgba(15,23,42,0.04)]">

          {/* Prev / Next navigation */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onPrev}
              disabled={!onPrev}
              title="Soal sebelumnya"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={onNext}
              disabled={!onNext}
              title="Soal berikutnya"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
            <span className="text-xs text-slate-400 tabular-nums ml-0.5 hidden sm:block">
              {isExisting ? `${soalIndex + 1} / ${soalCount}` : 'Baru'}
            </span>
          </div>

          <div className="flex-1" />

          {/* Cancel + Save */}
          <button
            type="button"
            onClick={onCancel}
            className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm active:scale-95"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Menyimpan...' : (isExisting ? 'Update' : 'Simpan')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-component: OpsiEditor ────────────────────────────────────────────────

function OpsiEditor({ initialHtml, placeholder, correct, onChange }: {
  initialHtml: string
  placeholder: string
  correct: boolean
  onChange: (html: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML === '' && initialHtml) {
      ref.current.innerHTML = initialHtml
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
      className={`question-content min-h-[40px] border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm outline-none transition-all leading-relaxed ${
        correct
          ? 'border-green-300 bg-green-50/40 focus:ring-2 focus:ring-green-500/20 focus:border-green-500'
          : 'border-slate-200 bg-white hover:border-blue-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
      }`}
    />
  )
}
