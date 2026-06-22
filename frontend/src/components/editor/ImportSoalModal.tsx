'use client'

import { useState, useRef, useCallback } from 'react'
import {
  X, Upload, Download, FileText,
  CheckCircle2, AlertTriangle, Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import api, { getErrorMessage } from '@/lib/api'
import { ApiResponse, Soal } from '@/types'

// ─── Local types ──────────────────────────────────────────────────────────────

interface ImportOpsi {
  huruf: string
  teks_html: string
  is_benar: boolean
}

interface ParsedSoal {
  tipe: 'pilihan_ganda' | 'essay'
  bobot: number
  pertanyaan_html: string
  panduan_essay: string
  opsi: ImportOpsi[]
  _warning?: string
}

// ─── Template ─────────────────────────────────────────────────────────────────

const TEMPLATE_TXT = `[SOAL]
Diketahui fungsi f(x) = 2x + 5. Nilai dari f(3) adalah...

[A]
8

[B]
10

[C]
11

[D]
13

[KUNCI]
C

---

[SOAL]
Soal kedua. Isi pertanyaan di sini.

[A]
Pilihan A

[B]
Pilihan B

[C]
Pilihan C

[D]
Pilihan D

[KUNCI]
B`

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseTxtTemplate(text: string): ParsedSoal[] {
  const blocks = text.split(/^\s*---\s*$/m)
  const results: ParsedSoal[] = []

  for (const block of blocks) {
    type Section = 'none' | 'soal' | 'A' | 'B' | 'C' | 'D' | 'E' | 'kunci'
    let section: Section = 'none'
    const acc: Record<string, string[]> = {
      soal: [], A: [], B: [], C: [], D: [], E: [], kunci: [],
    }

    for (const raw of block.split('\n')) {
      const t = raw.trim()
      if (t === '[SOAL]')  { section = 'soal';  continue }
      if (t === '[A]')     { section = 'A';      continue }
      if (t === '[B]')     { section = 'B';      continue }
      if (t === '[C]')     { section = 'C';      continue }
      if (t === '[D]')     { section = 'D';      continue }
      if (t === '[E]')     { section = 'E';      continue }
      if (t === '[KUNCI]') { section = 'kunci';  continue }
      if (section !== 'none') acc[section].push(raw)
    }

    const pertanyaan = acc.soal.join('\n').trim()
    if (!pertanyaan) continue

    const kunci = acc.kunci.join('').trim().toUpperCase()
    const opsi: ImportOpsi[] = (['A', 'B', 'C', 'D', 'E'] as const)
      .filter((h) => acc[h].join('').trim())
      .map((h) => ({
        huruf: h,
        teks_html: acc[h].join('\n').trim(),
        is_benar: h === kunci,
      }))

    const warnings: string[] = []
    if (opsi.length > 0 && opsi.length < 2) warnings.push('kurang dari 2 opsi')
    if (opsi.length > 0 && !opsi.some((o) => o.is_benar)) warnings.push('kunci jawaban tidak valid')

    results.push({
      tipe: opsi.length > 0 ? 'pilihan_ganda' : 'essay',
      bobot: 1,
      pertanyaan_html: pertanyaan,
      panduan_essay: '',
      opsi,
      _warning: warnings.length > 0 ? warnings.join(', ') : undefined,
    })
  }

  return results
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ImportSoalModalProps {
  tryoutId: string
  onClose: () => void
  onSaved: () => void
}

export default function ImportSoalModal({ tryoutId, onClose, onSaved }: ImportSoalModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName]     = useState<string | null>(null)
  const [parsing, setParsing]       = useState(false)
  const [parsed, setParsed]         = useState<ParsedSoal[] | null>(null)
  const [saving, setSaving]         = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_TXT], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = 'template-soal-triton.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  const processFile = useCallback(async (f: File) => {
    setFileName(f.name)
    setParsed(null)
    setParsing(true)
    try {
      if (f.name.endsWith('.txt')) {
        const text   = await f.text()
        const result = parseTxtTemplate(text)
        if (result.length === 0) {
          toast.error('Tidak ada soal yang terbaca. Periksa format file atau unduh template.')
          return
        }
        setParsed(result)
      } else {
        // .docx / .pdf — send to backend parser
        const form = new FormData()
        form.append('file', f)
        const res = await api.post<ApiResponse<ParsedSoal[]>>(
          `/tryouts/${tryoutId}/soal/parse`,
          form,
        )
        setParsed(res.data.data ?? [])
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memproses file. Gunakan format .txt yang tersedia.'))
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

  function reset() {
    setParsed(null)
    setFileName(null)
  }

  async function handleSaveAll() {
    if (!parsed) return
    setSaving(true)
    let saved = 0
    try {
      for (const s of parsed) {
        if (s._warning) continue
        const body = {
          tipe: s.tipe,
          bobot: s.bobot,
          pertanyaan: s.pertanyaan_html,
          pertanyaan_html: s.pertanyaan_html,
          panduan_essay: s.tipe === 'essay' ? s.panduan_essay : '',
          opsi: s.tipe === 'pilihan_ganda'
            ? s.opsi.map((o) => ({
                huruf: o.huruf,
                teks: o.teks_html,
                teks_html: o.teks_html,
                is_benar: o.is_benar,
              }))
            : undefined,
        }
        await api.post<ApiResponse<Soal>>(`/tryouts/${tryoutId}/soal`, body)
        saved++
      }
      if (saved === 0) {
        toast.error('Tidak ada soal valid yang dapat disimpan. Perbaiki peringatan terlebih dahulu.')
        return
      }
      toast.success(`${saved} soal berhasil diimpor!`)
      onSaved()
      onClose()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal mengimpor beberapa soal.'))
    } finally {
      setSaving(false)
    }
  }

  const validCount = parsed?.filter((s) => !s._warning).length ?? 0
  const warnCount  = parsed?.filter((s) =>  s._warning).length ?? 0

  return (
    <div
      className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700/50 dark:to-blue-900/20 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between rounded-t-3xl sm:rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Upload size={18} className="text-blue-500" />
              Import Soal
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Unggah file .txt, .docx, atau .pdf berisi soal</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg hover:bg-white/60 dark:hover:bg-slate-700 transition-colors mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Template download strip */}
          <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Unduh Template</p>
                <p className="text-xs text-blue-600/80">Format: [SOAL] [A–E] [KUNCI] dipisah ---</p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 border border-blue-200 bg-white hover:bg-blue-50 rounded-lg px-3 py-1.5 transition-colors shrink-0"
            >
              <Download size={13} />
              Unduh .txt
            </button>
          </div>

          {/* Drop zone */}
          {!parsed && !parsing && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all select-none ${
                isDragging
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              <Upload
                size={28}
                className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-blue-500' : 'text-slate-300'}`}
              />
              <p className="text-sm font-semibold text-slate-600">Seret file ke sini atau klik untuk pilih</p>
              <p className="text-xs text-slate-400 mt-1">Mendukung .txt · .docx · .pdf</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.docx,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) processFile(f)
                }}
              />
            </div>
          )}

          {/* Parsing spinner */}
          {parsing && (
            <div className="border-2 border-slate-100 rounded-2xl p-8 text-center">
              <Loader2 size={28} className="text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Memproses {fileName}...</p>
              <p className="text-xs text-slate-400 mt-1">Membaca dan memvalidasi soal</p>
            </div>
          )}

          {/* Parsed preview */}
          {parsed && (
            <div>
              <div className="flex items-center mb-3">
                <p className="text-sm font-bold text-slate-700 flex-1">
                  <span className="text-blue-600">{parsed.length}</span> soal ditemukan
                  <span className="text-slate-400 font-normal"> · {fileName}</span>
                </p>
                <button
                  onClick={reset}
                  className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
                >
                  Ganti file
                </button>
              </div>

              {warnCount > 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-3">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                  <span className="text-sm text-amber-700 font-medium">
                    {warnCount} soal memiliki peringatan dan tidak akan disimpan
                  </span>
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {parsed.map((s, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3.5 border transition-colors ${
                      s._warning
                        ? 'border-amber-200 bg-amber-50/30'
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${
                        s.tipe === 'pilihan_ganda' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                      }`}>
                        {s.tipe === 'pilihan_ganda' ? 'PG' : 'Essay'}
                      </span>
                      <span className="text-xs text-slate-400">Soal {i + 1}</span>
                      {s._warning ? (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100 rounded-full px-2 py-0.5 shrink-0">
                          <AlertTriangle size={9} />
                          {s._warning}
                        </span>
                      ) : (
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-green-600 shrink-0">
                          <CheckCircle2 size={9} />
                          Valid
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2 leading-snug">{s.pertanyaan_html}</p>
                    {s.tipe === 'pilihan_ganda' && s.opsi.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {s.opsi.map((o) => (
                          <span
                            key={o.huruf}
                            className={`text-[11px] rounded px-2 py-0.5 font-medium ${
                              o.is_benar
                                ? 'bg-green-100 text-green-700'
                                : 'bg-white border border-slate-200 text-slate-500'
                            }`}
                          >
                            {o.huruf}. {o.teks_html}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={reset}
                  disabled={saving}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Ganti File
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={saving || validCount === 0}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Menyimpan...' : `Simpan ${validCount} Soal →`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
