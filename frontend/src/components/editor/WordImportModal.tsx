'use client'

import { useCallback, useRef, useState } from 'react'
import {
  X, FileText, Download, CheckCircle2, AlertTriangle, Loader2, FileType2,
} from 'lucide-react'
import { toast } from 'sonner'
import api, { getErrorMessage } from '@/lib/api'
import { ApiResponse } from '@/types'

interface ParsedOpsi {
  huruf: string
  teks: string
  is_benar: boolean
}

interface ParsedSoal {
  tipe: 'pilihan_ganda' | 'essay'
  bobot: number
  pertanyaan: string
  pertanyaan_html: string
  equation: string | null
  equation_latex: string | null
  gambar_base64: string | null
  panduan_essay: string | null
  opsi: ParsedOpsi[]
  warning?: string
}

interface WordImportModalProps {
  tryoutId: string
  onClose: () => void
  onSaved: () => void
}

export default function WordImportModal({ tryoutId, onClose, onSaved }: WordImportModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedSoal[] | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (f: File) => {
    if (!f.name.toLowerCase().endsWith('.docx')) {
      toast.error('Hanya mendukung file Word (.docx).')
      return
    }
    setFile(f)
    setParsed(null)
    setParsing(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      // Preview = parse only, no insert.
      const res = await api.post<ApiResponse<ParsedSoal[]>>(
        `/tryouts/${tryoutId}/upload-docx?preview=true`, fd
      )
      const data = res.data.data ?? []
      if (data.length === 0) {
        toast.error('Tidak ada soal terbaca. Periksa format dokumen.')
        setFile(null)
        return
      }
      setParsed(data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal membaca dokumen. Pastikan formatnya sesuai template.'))
      setFile(null)
    } finally {
      setParsing(false)
    }
  }, [tryoutId])

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) processFile(f)
  }

  async function handleSave() {
    if (!file) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post<ApiResponse<null>>(`/tryouts/${tryoutId}/upload-docx`, fd)
      toast.success(res.data.message ?? 'Soal berhasil diimpor.')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menyimpan soal.'))
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setParsed(null)
    setFile(null)
  }

  const validCount = parsed?.filter((s) => !s.warning).length ?? 0
  const warnCount = parsed?.filter((s) => s.warning).length ?? 0

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-100 flex items-start justify-between rounded-t-3xl sm:rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileType2 size={18} className="text-blue-500" />
              Import dari Word
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Unggah file .docx sesuai template untuk impor massal soal.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/60 transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Template download */}
          <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Unduh Template</p>
                <p className="text-xs text-blue-600/80">Format: [SOAL] · Tipe · Bobot · Pertanyaan · A–E · *kunci · Rubrik</p>
              </div>
            </div>
            <a
              href="/template-tryout.docx"
              download
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 rounded-lg px-3 py-1.5 transition-colors shrink-0"
            >
              <Download size={13} />
              .docx
            </a>
          </div>

          {/* Drop zone */}
          {!parsed && !parsing && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all select-none ${
                isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <FileType2 size={28} className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-blue-500' : 'text-slate-300'}`} />
              <p className="text-sm font-semibold text-slate-600">Seret file Word ke sini atau klik untuk pilih</p>
              <p className="text-xs text-slate-400 mt-1">Hanya .docx</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }}
              />
            </div>
          )}

          {/* Parsing */}
          {parsing && (
            <div className="border-2 border-slate-100 rounded-2xl p-8 text-center">
              <Loader2 size={28} className="text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Memproses {file?.name}...</p>
              <p className="text-xs text-slate-400 mt-1">Membaca dokumen & memvalidasi soal</p>
            </div>
          )}

          {/* Preview */}
          {parsed && (
            <div>
              <div className="flex items-center mb-3">
                <p className="text-sm font-bold text-slate-700 flex-1">
                  <span className="text-blue-600">{parsed.length}</span> soal terbaca
                  <span className="text-slate-400 font-normal"> · {file?.name}</span>
                </p>
                <button onClick={reset} className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors">Ganti file</button>
              </div>

              {warnCount > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-3">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <span className="text-sm text-amber-700 font-medium">{warnCount} soal bermasalah — perbaiki dokumen sebelum menyimpan.</span>
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {parsed.map((s, i) => (
                  <div key={i} className={`rounded-xl p-3.5 border transition-colors ${s.warning ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${s.tipe === 'pilihan_ganda' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                        {s.tipe === 'pilihan_ganda' ? 'PG' : 'Essay'}
                      </span>
                      <span className="text-xs text-slate-400">Soal {i + 1} · bobot {s.bobot}</span>
                      {s.equation && <span className="text-[10px] font-semibold text-violet-600 bg-violet-50 rounded px-1.5 py-0.5">∑ math</span>}
                      {s.gambar_base64 && <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 rounded px-1.5 py-0.5">🖼 gambar</span>}
                      {s.warning ? (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100 rounded-full px-2 py-0.5 shrink-0">
                          <AlertTriangle size={9} /> {s.warning}
                        </span>
                      ) : (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-green-600 shrink-0">
                          <CheckCircle2 size={9} /> Valid
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2 leading-snug">{s.pertanyaan}</p>
                    {s.gambar_base64 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.gambar_base64} alt="lampiran soal" className="mt-2 max-h-24 rounded-lg border border-slate-200" />
                    )}
                    {s.tipe === 'pilihan_ganda' && s.opsi.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {s.opsi.map((o) => (
                          <span key={o.huruf} className={`text-[11px] rounded px-2 py-0.5 font-medium ${o.is_benar ? 'bg-green-100 text-green-700' : 'bg-white border border-slate-200 text-slate-500'}`}>
                            {o.huruf}. {o.teks}
                          </span>
                        ))}
                      </div>
                    )}
                    {s.tipe === 'essay' && s.panduan_essay && (
                      <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-1">Rubrik: {s.panduan_essay}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={reset} disabled={saving} className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50">
                  Ganti File
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || warnCount > 0 || validCount === 0}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
                  title={warnCount > 0 ? 'Perbaiki soal bermasalah di dokumen terlebih dahulu' : undefined}
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Menyimpan...' : `Simpan ${parsed.length} Soal →`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
