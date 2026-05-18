'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, Plus, Trash2, CheckCircle2, AlertTriangle, Loader2, FileQuestion,
  CheckSquare, AlignLeft, Send, Sparkles,
} from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import RichTextEditor, { RichTextEditorHandle } from '@/components/editor/RichTextEditor'
import AIGeneratorModal from '@/components/editor/AIGeneratorModal'
import { ApiResponse, Soal, SoalTipe, TryoutDetail } from '@/types'

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
  opsi: DraftOpsi[]
}

const NEW_SOAL_DEFAULT: DraftSoal = {
  tipe: 'pilihan_ganda',
  bobot: 1,
  pertanyaan_html: '',
  panduan_essay: '',
  opsi: [
    { huruf: 'A', teks_html: '', is_benar: false },
    { huruf: 'B', teks_html: '', is_benar: false },
    { huruf: 'C', teks_html: '', is_benar: false },
    { huruf: 'D', teks_html: '', is_benar: false },
  ],
}

function soalToDraft(s: Soal): DraftSoal {
  return {
    id: s.id,
    nomor_soal: s.nomor_soal,
    tipe: s.tipe,
    bobot: s.bobot,
    pertanyaan_html: s.pertanyaan_html || s.pertanyaan || '',
    panduan_essay: s.panduan_essay ?? '',
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
    draft:     { bg: 'bg-slate-100',  text: 'text-slate-600', label: 'Draft' },
    published: { bg: 'bg-green-100',  text: 'text-green-700', label: 'Published' },
    closed:    { bg: 'bg-amber-100',  text: 'text-amber-700', label: 'Closed' },
  }
  return map[status] ?? map.draft
}

export default function KelolaSoalPage() {
  const { id: tryoutId } = useParams<{ id: string }>()
  const router = useRouter()

  const [tryout, setTryout] = useState<TryoutDetail | null>(null)
  const [draft, setDraft] = useState<DraftSoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [aiModalOpen, setAiModalOpen] = useState(false)

  const editorRef = useRef<RichTextEditorHandle>(null)
  // Holds latest opsi HTML from per-option editors (uncontrolled, only synced on input)
  const opsiHtmlRef = useRef<string[]>([])

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

  // ─── Select / create soal ────────────────────────────────
  function startNew() {
    setDraft({ ...NEW_SOAL_DEFAULT, opsi: NEW_SOAL_DEFAULT.opsi.map((o) => ({ ...o })) })
    opsiHtmlRef.current = NEW_SOAL_DEFAULT.opsi.map((o) => o.teks_html)
    setTimeout(() => editorRef.current?.setHtml(''), 50)
  }

  function selectSoal(s: Soal) {
    const d = soalToDraft(s)
    setDraft(d)
    opsiHtmlRef.current = d.opsi.map((o) => o.teks_html)
    setTimeout(() => editorRef.current?.setHtml(d.pertanyaan_html), 50)
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
      if (d.opsi.length >= 5) {
        toast.error('Maksimal 5 opsi jawaban.')
        return d
      }
      const huruf = String.fromCharCode(65 + d.opsi.length)
      opsiHtmlRef.current = [...opsiHtmlRef.current, '']
      return { ...d, opsi: [...d.opsi, { huruf, teks_html: '', is_benar: false }] }
    })
  }

  function removeOpsi(idx: number) {
    setDraft((d) => {
      if (!d) return d
      if (d.opsi.length <= 2) {
        toast.error('Minimal 2 opsi jawaban.')
        return d
      }
      const next = d.opsi.filter((_, i) => i !== idx).map((o, i) => ({ ...o, huruf: String.fromCharCode(65 + i) }))
      opsiHtmlRef.current = opsiHtmlRef.current.filter((_, i) => i !== idx)
      return { ...d, opsi: next }
    })
  }

  // ─── Save / delete soal ──────────────────────────────────
  async function handleSave() {
    if (!draft) return
    const html = editorRef.current?.getHtml() ?? draft.pertanyaan_html
    const text = editorRef.current?.getText() ?? ''
    if (!text.trim()) {
      toast.error('Pertanyaan tidak boleh kosong.')
      return
    }

    let opsiPayload: { huruf: string; teks: string; teks_html: string; is_benar: boolean }[] | undefined
    if (draft.tipe === 'pilihan_ganda') {
      if (draft.opsi.length < 2) {
        toast.error('Pilihan ganda butuh minimal 2 opsi.')
        return
      }
      const hasCorrect = draft.opsi.some((o) => o.is_benar)
      if (!hasCorrect) {
        toast.error('Pilih salah satu opsi sebagai jawaban yang benar.')
        return
      }
      // Build opsi payload — strip HTML to get teks
      opsiPayload = draft.opsi.map((o, i) => {
        const opsiHtml = opsiHtmlRef.current[i] ?? o.teks_html
        const opsiText = htmlToText(opsiHtml).trim()
        if (!opsiText) {
          throw new Error(`Opsi ${o.huruf} kosong.`)
        }
        return {
          huruf: o.huruf,
          teks: opsiText,
          teks_html: opsiHtml,
          is_benar: o.is_benar,
        }
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
        // Re-select to display freshly saved data
        const fresh = (await fetchTryout({ silent: true }))?.soal.find((s) => s.id === savedSoal!.id)
        if (fresh) selectSoal(fresh)
      }
    } catch (err) {
      const msg = err instanceof Error && err.message.includes('kosong') ? err.message : getErrorMessage(err, 'Gagal menyimpan soal.')
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
      if (draft?.id === soalId) setDraft(null)
      await fetchTryout({ silent: true })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menghapus soal.'))
    }
  }

  async function handlePublish() {
    if (!tryout) return
    if ((tryout.soal?.length ?? 0) === 0) {
      toast.error('Tambahkan minimal 1 soal sebelum publish.')
      return
    }
    setPublishing(true)
    try {
      await api.patch(`/tryouts/${tryoutId}/publish`, { status: 'published' })
      toast.success('Tryout berhasil dipublish!')
      await fetchTryout({ silent: true })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal mempublish tryout.'))
    } finally {
      setPublishing(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (!tryout) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-500">
        Tryout tidak ditemukan.
      </div>
    )
  }

  const soalList = tryout.soal ?? []
  const totalBobot = soalList.reduce((sum, s) => sum + (s.bobot || 0), 0)
  const sb = statusBadge(tryout.status)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ─── LEFT SIDEBAR ─────────────────────────────────── */}
      <aside className="w-72 shrink-0 border-r border-slate-100 bg-white flex flex-col">

        <div className="px-5 pt-5 pb-4 border-b border-slate-100">
          <Link href="/guru/tryout" className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:underline mb-2">
            <ArrowLeft size={14} />
            Kembali ke Tryout
          </Link>
          <h2 className="text-lg font-extrabold text-slate-900 leading-tight">{tryout.nama_tryout}</h2>
          <p className="text-xs text-slate-400 mt-1">{tryout.mata_pelajaran} · {tryout.durasi_menit} menit</p>
          <span className={`mt-2 inline-block ${sb.bg} ${sb.text} text-xs font-semibold px-2.5 py-0.5 rounded-full`}>
            {sb.label}
          </span>
        </div>

        <div className="p-4 border-b border-slate-100 space-y-2">
          <button
            onClick={startNew}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl py-2.5 px-4 text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={16} />
            Tambah Soal Manual
          </button>
          <button
            onClick={() => setAiModalOpen(true)}
            className="w-full border-2 border-violet-400 text-violet-600 bg-violet-50 hover:bg-violet-100 font-semibold rounded-xl py-2.5 px-4 text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles size={15} />
            Generate dengan AI
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {soalList.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-12 px-4">
              Belum ada soal. Klik <strong>"Tambah Soal Baru"</strong> untuk membuat.
            </div>
          ) : (
            soalList.map((s, i) => {
              const isActive = draft?.id === s.id
              const isPG = s.tipe === 'pilihan_ganda'
              return (
                <div
                  key={s.id}
                  onClick={() => selectSoal(s)}
                  className={`group cursor-pointer rounded-xl p-3 border transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-50 border-blue-500 border-l-4'
                      : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-blue-50/40'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className={`inline-block text-[10px] font-semibold rounded px-1.5 py-0.5 mb-1 ${
                        isPG ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                      }`}>
                        {isPG ? 'PG' : 'Essay'}
                      </span>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-snug">
                        {stripHtmlForPreview(s.pertanyaan_html || s.pertanyaan) || <span className="italic text-slate-400">(kosong)</span>}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(s.id) }}
                      className="text-slate-300 hover:text-red-500 transition-colors p-0.5 shrink-0"
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

        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-500 mb-3">
            <strong className="text-slate-900">{soalList.length}</strong> soal · Total bobot: <strong className="text-slate-900">{totalBobot}</strong>
          </p>
          {tryout.status === 'draft' && (
            <button
              onClick={handlePublish}
              disabled={publishing || soalList.length === 0}
              className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              {publishing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {publishing ? 'Mempublish...' : 'Publish Tryout'}
            </button>
          )}
          {tryout.status === 'published' && (
            <button
              onClick={async () => {
                setPublishing(true)
                try {
                  await api.patch(`/tryouts/${tryoutId}/publish`, { status: 'draft' })
                  toast.success('Tryout dikembalikan ke draft.')
                  await fetchTryout({ silent: true })
                } catch (err) { toast.error(getErrorMessage(err)) }
                finally { setPublishing(false) }
              }}
              disabled={publishing}
              className="w-full border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold rounded-xl py-2.5 text-sm transition-colors"
            >
              {publishing ? 'Memproses...' : 'Tarik dari Publikasi'}
            </button>
          )}
        </div>
      </aside>

      {/* ─── MAIN EDITOR AREA ─────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">

        {!draft ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <FileQuestion size={56} className="text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg font-medium">Pilih soal di kiri atau tambah soal baru</p>
            <p className="text-slate-400 text-sm mt-1">Editor akan muncul di sini setelah memilih atau membuat soal.</p>
            <button
              onClick={startNew}
              className="mt-6 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-5 py-2.5 font-semibold text-sm transition-colors"
            >
              <Plus size={16} /> Tambah Soal Baru
            </button>
          </div>
        ) : (
          <SoalEditor
            draft={draft}
            editorRef={editorRef}
            opsiHtmlRef={opsiHtmlRef}
            saving={saving}
            soalCount={soalList.length}
            soalIndex={draft.id ? soalList.findIndex((s) => s.id === draft.id) : soalList.length}
            updateDraft={updateDraft}
            updateOpsi={updateOpsi}
            markCorrect={markCorrect}
            addOpsi={addOpsi}
            removeOpsi={removeOpsi}
            onSave={handleSave}
            onCancel={() => setDraft(null)}
            onRequestDelete={(id) => setConfirmDelete(id)}
          />
        )}
      </main>

      {/* ─── AI GENERATOR MODAL ──────────────────────────── */}
      {aiModalOpen && (
        <AIGeneratorModal
          tryoutId={tryoutId}
          onClose={() => setAiModalOpen(false)}
          onSaved={() => fetchTryout({ silent: true })}
        />
      )}

      {/* ─── DELETE CONFIRMATION ──────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500 mx-auto mb-3">
              <AlertTriangle size={22} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center">Hapus soal ini?</h3>
            <p className="text-sm text-slate-500 text-center mt-1.5">Soal yang dihapus tidak dapat dikembalikan.</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl py-2.5 text-sm transition-colors"
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

// ─── Sub-component: SoalEditor ─────────────────────────────────
interface SoalEditorProps {
  draft: DraftSoal
  editorRef: React.RefObject<RichTextEditorHandle>
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
}

function SoalEditor({
  draft, editorRef, opsiHtmlRef, saving, soalCount, soalIndex,
  updateDraft, updateOpsi, markCorrect, addOpsi, removeOpsi, onSave, onCancel, onRequestDelete,
}: SoalEditorProps) {
  const correctIdx = draft.opsi.findIndex((o) => o.is_benar)
  const isExisting = !!draft.id

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 pb-32">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-end gap-6 flex-wrap">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipe Soal</label>
            <select
              value={draft.tipe}
              onChange={(e) => updateDraft('tipe', e.target.value as SoalTipe)}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800 min-w-[180px] outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
            >
              <option value="pilihan_ganda">Pilihan Ganda</option>
              <option value="essay">Essay</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Bobot Nilai</label>
            <input
              type="number"
              min={1}
              max={100}
              value={draft.bobot}
              onChange={(e) => updateDraft('bobot', Math.max(1, Number(e.target.value) || 1))}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold w-20 text-center outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex-1 text-right">
            <p className="text-sm text-slate-400">Soal ke-{soalIndex + 1} {isExisting && `dari ${soalCount}`}</p>
          </div>

          {isExisting && (
            <button
              onClick={() => draft.id && onRequestDelete(draft.id)}
              className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
            >
              <Trash2 size={14} /> Hapus
            </button>
          )}
        </div>

        {/* Question */}
        <div className="px-8 py-6 border-b border-slate-100">
          <label className="block text-sm font-semibold text-slate-700 mb-3">Pertanyaan</label>
          <RichTextEditor
            ref={editorRef}
            initialHtml={draft.pertanyaan_html}
            placeholder="Tulis pertanyaan di sini. Klik Σ untuk persamaan matematika, ikon gambar untuk menyisipkan gambar."
            minHeight="160px"
          />
        </div>

        {/* Answer Options (PG) */}
        {draft.tipe === 'pilihan_ganda' && (
          <div className="px-8 py-6 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold text-slate-700">Pilihan Jawaban</label>
              <span className="text-xs text-slate-400">Pilih satu jawaban yang benar</span>
            </div>

            <div className="space-y-3">
              {draft.opsi.map((o, idx) => (
                <div key={idx} className="flex items-start gap-3 group">
                  <button
                    type="button"
                    onClick={() => markCorrect(idx)}
                    className={`w-9 h-9 mt-1 rounded-full flex items-center justify-center shrink-0 transition-all font-bold text-sm ${
                      o.is_benar
                        ? 'bg-green-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-500'
                    }`}
                    title={o.is_benar ? 'Jawaban benar' : 'Tandai sebagai jawaban benar'}
                  >
                    {o.is_benar ? <CheckCircle2 size={16} /> : o.huruf}
                  </button>

                  <div className="flex-1">
                    <OpsiEditor
                      initialHtml={o.teks_html}
                      placeholder={`Opsi ${o.huruf}`}
                      correct={o.is_benar}
                      onChange={(html) => { opsiHtmlRef.current[idx] = html; updateOpsi(idx, { teks_html: html }) }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeOpsi(idx)}
                    disabled={draft.opsi.length <= 2}
                    className="text-slate-300 hover:text-red-500 transition-colors mt-3 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Hapus opsi"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {draft.opsi.length < 5 && (
              <button
                type="button"
                onClick={addOpsi}
                className="mt-4 inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors"
              >
                <Plus size={14} /> Tambah Opsi
              </button>
            )}

            <div className="mt-4 text-sm flex items-center gap-2">
              {correctIdx >= 0 ? (
                <>
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="text-green-600 font-medium">Kunci jawaban: Opsi {draft.opsi[correctIdx].huruf}</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span className="text-amber-600">Belum ada kunci jawaban yang dipilih.</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Essay guide */}
        {draft.tipe === 'essay' && (
          <div className="px-8 py-6 border-b border-slate-100">
            <label className="block text-sm font-semibold text-slate-700">Panduan Jawaban</label>
            <p className="text-xs text-slate-400 mt-0.5 mb-3">Hanya terlihat oleh guru — sebagai panduan penilaian manual.</p>
            <textarea
              value={draft.panduan_essay}
              onChange={(e) => updateDraft('panduan_essay', e.target.value)}
              rows={4}
              placeholder="Tuliskan kunci jawaban atau rubrik penilaian essay ini..."
              className="w-full rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 transition-all resize-none"
            />
          </div>
        )}

        {/* Save bar */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-8 py-4 flex items-center justify-end gap-3 shadow-[0_-4px_12px_rgba(15,23,42,0.04)]">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2 shadow-sm"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Menyimpan...' : (isExisting ? 'Update Soal' : 'Simpan Soal')}
          </button>
        </div>
      </div>

      {/* Visual type indicator */}
      <div className="mt-4 text-center text-xs text-slate-400 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-100">
        {draft.tipe === 'pilihan_ganda' ? <CheckSquare size={12} /> : <AlignLeft size={12} />}
        Tipe: <strong className="text-slate-600">{draft.tipe === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Essay'}</strong>
      </div>
    </div>
  )
}

// ─── Sub-component: OpsiEditor (compact contentEditable per option) ──
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
      className={`question-content min-h-[44px] border rounded-xl px-4 py-2.5 text-sm outline-none transition-all leading-relaxed ${
        correct
          ? 'border-green-300 bg-green-50/40 focus:ring-2 focus:ring-green-500/20 focus:border-green-500'
          : 'border-slate-200 bg-white hover:border-blue-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
      }`}
    />
  )
}

// ─── Helpers ───────────────────────────────────────────────────
function htmlToText(html: string): string {
  if (typeof window === 'undefined') return html
  const tmp = document.createElement('div')
  tmp.innerHTML = html
  // Replace katex equations with their LaTeX for plain-text fallback
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
