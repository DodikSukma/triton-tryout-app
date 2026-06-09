'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { AI_PRESETS, AiPresetQuestion } from '@/data/ai-presets'
import api, { getErrorMessage } from '@/lib/api'
import { ApiResponse, Soal } from '@/types'

interface AIGeneratorModalProps {
  tryoutId: string
  onClose: () => void
  onSaved: () => void
}

type Subject = 'matematika' | 'fisika' | 'biologi'

const SUBJECT_CONFIG: { key: Subject; label: string; icon: string }[] = [
  { key: 'matematika', label: 'Matematika', icon: '∑' },
  { key: 'fisika',     label: 'Fisika',     icon: '⚡' },
  { key: 'biologi',    label: 'Biologi',    icon: '🧬' },
]

// Ensure every PG question's opsi array is non-empty and has normalised text.
function normaliseOpsi(q: AiPresetQuestion) {
  if (q.tipe !== 'pilihan_ganda') return undefined
  if (q.opsi.length === 0)       return undefined   // skip — will be reported

  return q.opsi.slice(0, 5).map((o, idx) => {
    const fallback = String.fromCharCode(65 + idx)
    const teks     = o.teks_html.replace(/<[^>]*>/g, '').trim() || fallback
    return {
      huruf:    String.fromCharCode(65 + idx),
      teks,
      teks_html: o.teks_html || fallback,
      is_benar: o.is_benar,
    }
  })
}

export default function AIGeneratorModal({ tryoutId, onClose, onSaved }: AIGeneratorModalProps) {
  const [subject,      setSubject]      = useState<Subject>('matematika')
  const [quantity,     setQuantity]     = useState<1 | 5>(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generated,    setGenerated]    = useState<AiPresetQuestion[] | null>(null)
  const [saving,       setSaving]       = useState(false)

  async function handleGenerate() {
    setIsGenerating(true)
    setGenerated(null)
    await new Promise((r) => setTimeout(r, 1500))
    const key = quantity === 5 ? 'set_5' : 'set_1'
    setGenerated(AI_PRESETS[subject][key])
    setIsGenerating(false)
  }

  async function handleSave() {
    if (!generated) return
    setSaving(true)
    let saved   = 0
    let skipped = 0
    try {
      for (const q of generated) {
        const opsi = normaliseOpsi(q)

        // PG with no opsi — report and skip
        if (q.tipe === 'pilihan_ganda' && !opsi) {
          skipped++
          continue
        }

        // PG with no correct answer — report and skip
        if (q.tipe === 'pilihan_ganda' && opsi && !opsi.some((o) => o.is_benar)) {
          skipped++
          continue
        }

        const body = {
          tipe:          q.tipe,
          bobot:         q.bobot,
          pertanyaan:    q.pertanyaan_html.replace(/<[^>]*>/g, ''),
          pertanyaan_html: q.pertanyaan_html,
          panduan_essay: q.tipe === 'essay' ? (q.panduan_essay ?? '') : '',
          opsi,
        }
        await api.post<ApiResponse<Soal>>(`/tryouts/${tryoutId}/soal`, body)
        saved++
      }

      if (skipped > 0) {
        toast.error(`${skipped} soal dilewati karena opsi tidak lengkap.`)
      }
      if (saved > 0) {
        toast.success(`${saved} soal berhasil ditambahkan!`)
        onSaved()
        onClose()
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal menyimpan soal.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-violet-50 to-blue-50 border-b border-slate-100 flex items-start justify-between rounded-t-3xl sm:rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-violet-500" />
              Generate Soal dengan AI ✨
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Buat soal berkualitas dalam hitungan detik</p>
            <span className="inline-block mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-3 py-1">
              Mode Demo — Soal static untuk presentasi
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/60 transition-colors mt-0.5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Subject selector */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Mata Pelajaran</p>
            <div className="grid grid-cols-3 gap-3">
              {SUBJECT_CONFIG.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => { setSubject(key); setGenerated(null) }}
                  className={`border-2 rounded-2xl p-4 cursor-pointer text-center transition-all ${
                    subject === key
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-slate-200 hover:border-violet-300 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className="font-semibold text-sm text-slate-700">{label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity selector */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Jumlah Soal</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setQuantity(1); setGenerated(null) }}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  quantity === 1
                    ? 'bg-violet-500 text-white'
                    : 'border-2 border-slate-200 text-slate-600 hover:border-violet-300 bg-white'
                }`}
              >
                1 Soal
              </button>
              <button
                onClick={() => { setQuantity(5); setGenerated(null) }}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  quantity === 5
                    ? 'bg-violet-500 text-white'
                    : 'border-2 border-slate-200 text-slate-600 hover:border-violet-300 bg-white'
                }`}
              >
                5 Soal — Paket Lengkap
              </button>
            </div>
          </div>

          {/* Generate button */}
          {!generated && !isGenerating && (
            <button
              onClick={handleGenerate}
              className="w-full bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white font-bold rounded-xl py-4 text-base flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-violet-200 transition-all"
            >
              <Sparkles size={18} />
              Generate Sekarang
            </button>
          )}

          {/* Loading */}
          {isGenerating && (
            <div className="bg-violet-50 rounded-2xl p-8 text-center border border-violet-100">
              <Loader2 className="w-12 h-12 text-violet-500 animate-spin mx-auto" />
              <p className="font-semibold text-violet-700 mt-4">Sedang membuat soal...</p>
              <p className="text-slate-400 text-sm mt-2">AI sedang menganalisis kurikulum dan membuat soal terbaik...</p>
            </div>
          )}

          {/* Preview */}
          {generated && (
            <div>
              <p className="text-green-600 font-bold flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} />
                {generated.length} soal berhasil dibuat!
              </p>

              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {generated.map((q, i) => {
                  const hasOpsi    = q.tipe === 'pilihan_ganda' && q.opsi.length > 0
                  const hasCorrect = hasOpsi && q.opsi.some((o) => o.is_benar)
                  const warn       = q.tipe === 'pilihan_ganda' && (!hasOpsi || !hasCorrect)

                  return (
                    <div
                      key={i}
                      className={`border rounded-xl p-4 transition-colors ${
                        warn ? 'border-amber-200 bg-amber-50/30' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold rounded-lg px-2 py-0.5 ${
                            q.tipe === 'pilihan_ganda' ? 'bg-blue-50 text-blue-600' : 'bg-violet-50 text-violet-600'
                          }`}>
                            {q.tipe === 'pilihan_ganda' ? 'PG' : 'Essay'}
                          </span>
                          <span className="text-xs text-slate-400">Bobot: {q.bobot}</span>
                        </div>
                        {warn && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-100 rounded-full px-2 py-0.5">
                            <AlertTriangle size={9} />
                            {!hasOpsi ? 'tidak ada opsi' : 'kunci jawaban kosong'}
                          </span>
                        )}
                      </div>

                      <p
                        className="text-sm text-slate-700 leading-relaxed line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: q.pertanyaan_html }}
                      />

                      {q.tipe === 'pilihan_ganda' && q.opsi.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {q.opsi.map((o) => (
                            <span
                              key={o.huruf}
                              className={`text-xs rounded-lg px-2.5 py-1 font-medium ${
                                o.is_benar
                                  ? 'bg-green-100 text-green-700 font-semibold'
                                  : 'bg-white border border-slate-200 text-slate-600'
                              }`}
                            >
                              {o.huruf}. {o.teks_html}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setGenerated(null); handleGenerate() }}
                  disabled={saving}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Ulangi Generate
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Menyimpan...' : `Simpan ${generated.length} Soal →`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
