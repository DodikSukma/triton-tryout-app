'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Trophy, Star, BookOpen, TrendingUp, CheckCircle2, XCircle, MinusCircle, ArrowLeft, Lightbulb,
} from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { ApiResponse, Hasil, OpsiJawaban, SesiTryout, Soal, SOAL_TIPE_LABELS, Tryout } from '@/types'
import RenderHTML from '@/components/shared/RenderHTML'
import TritonLoader from '@/components/common/TritonLoader'

interface HasilDetailItem {
  soal: Soal
  student_answer: { opsi_id: string | null; jawaban_teks: string | null } | null
  student_opsi: OpsiJawaban | null
  correct_opsi: OpsiJawaban | null
  is_correct: boolean
  is_skipped: boolean
}

interface HasilResponse {
  hasil: Hasil
  sesi: SesiTryout
  tryout: Tryout | null
  detail: HasilDetailItem[]
}

export default function HasilPage() {
  const { sesiId } = useParams<{ sesiId: string }>()
  const [data, setData] = useState<HasilResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await api.get<ApiResponse<HasilResponse>>(`/hasil/${sesiId}`)
        if (!cancelled) setData(res.data.data ?? null)
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Gagal memuat hasil.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [sesiId])

  // ─── Count-up animation ──────────────────────────────────
  useEffect(() => {
    if (!data) return
    const target = Math.round(Number(data.hasil.nilai))
    const duration = 1100
    const start = performance.now()
    let raf = 0
    function step(now: number) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setAnimatedScore(Math.round(eased * target))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [data])

  if (loading) {
    return <TritonLoader fullScreen={false} />
  }
  if (!data) return <div className="text-center py-16 text-slate-500">Hasil tidak ditemukan.</div>

  const nilai = Math.round(Number(data.hasil.nilai))
  const grade = computeGrade(nilai)
  const benar = data.hasil.total_benar
  const totalSoal = data.hasil.total_soal
  const skipCount = data.detail.filter((d) => d.is_skipped).length
  const salah = Math.max(0, totalSoal - benar - skipCount)

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 md:px-6">

      <Link href="/siswa/tryout" className="inline-flex items-center gap-1.5 text-sm text-triton-blue-600 hover:text-triton-blue-700 hover:underline mb-5">
        <ArrowLeft size={14} /> Kembali ke Tryout
      </Link>

      {/* ─── Hero (high-contrast: slate text + solid white score card) ─── */}
      <div className="relative bg-gradient-to-br from-blue-50 via-white to-slate-50 dark:from-blue-950/30 dark:via-slate-800 dark:to-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-6 md:p-8 text-center overflow-hidden shadow-sm">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-100/40 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-slate-100/60 pointer-events-none" />

        <div className="relative">
          <grade.Icon size={72} className={`mx-auto ${grade.iconClass}`} />

          <h1 className="text-2xl md:text-3xl font-black mt-3 text-slate-900 dark:text-slate-100">Tryout Selesai!</h1>
          {data.tryout && (
            <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg mt-1">{data.tryout.nama_tryout}</p>
          )}

          {/* Solid high-contrast score container */}
          <div className="mt-6 inline-flex flex-col items-center bg-white/95 dark:bg-slate-700/95 backdrop-blur-sm shadow-lg border border-slate-100 dark:border-slate-600 rounded-2xl px-8 md:px-12 py-6 text-slate-900 dark:text-slate-100">
            <div className="flex items-baseline gap-1">
              <span className="text-6xl md:text-7xl font-black leading-none tabular-nums text-slate-900 dark:text-slate-100">{animatedScore}</span>
              <span className="text-xl md:text-2xl text-slate-400 font-bold">/100</span>
            </div>
            <span className={`mt-3 inline-block rounded-full px-5 py-1.5 font-bold text-sm md:text-base ${grade.badge}`}>
              {grade.label}
            </span>
          </div>

          <div className="mt-7 grid grid-cols-3 divide-x divide-slate-200 max-w-md mx-auto">
            <Stat label="Benar"  value={benar}     color="text-green-600" Icon={CheckCircle2} />
            <Stat label="Salah"  value={salah}     color="text-red-600"   Icon={XCircle} />
            <Stat label="Kosong" value={skipCount} color="text-slate-500" Icon={MinusCircle} />
          </div>
        </div>
      </div>

      {/* ─── Detail per soal ─── */}
      <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Detail Jawaban</h2>
          <p className="text-xs text-slate-500 mt-0.5">Periksa kembali jawaban Anda untuk belajar dari kesalahan.</p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {data.detail.map((item, idx) => (
            <DetailItem key={item.soal.id} item={item} idx={idx} />
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          href="/siswa/dashboard"
          className="flex-1 border-2 border-triton-blue-500 text-triton-blue-600 hover:bg-triton-blue-50 font-semibold rounded-xl px-6 py-3 text-center transition-colors"
        >
          ← Kembali ke Dashboard
        </Link>
        <Link
          href="/siswa/tryout"
          className="flex-1 bg-triton-blue-500 hover:bg-triton-blue-600 text-white font-semibold rounded-xl px-6 py-3 text-center transition-colors"
        >
          Tryout Lainnya →
        </Link>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────
function Stat({ label, value, color, Icon }: { label: string; value: number; color: string; Icon: React.ElementType }) {
  return (
    <div className="px-3">
      <Icon size={18} className={`mx-auto mb-1 ${color}`} />
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  )
}

// Loose text compare for short-answer / matching feedback.
function eqText(a: string, b: string): boolean {
  return a.trim().toLowerCase().replace(/\s+/g, ' ') === b.trim().toLowerCase().replace(/\s+/g, ' ')
}
function safeArray(json: string | null | undefined): string[] {
  try {
    const v = JSON.parse(json ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function DetailItem({ item, idx }: { item: HasilDetailItem; idx: number }) {
  const tipe = item.soal.tipe
  const isAutoGraded = tipe !== 'essay' // everything except essay is machine-scored
  const status = item.is_skipped
    ? { Icon: MinusCircle, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Tidak Dijawab' }
    : item.is_correct
      ? { Icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', label: 'Benar' }
      : { Icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: isAutoGraded ? 'Salah' : 'Perlu Penilaian' }

  return (
    <div className="px-6 py-5">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="bg-triton-blue-500 text-white rounded-full px-3 py-1 text-xs font-bold">Soal {idx + 1}</span>
        <span className="bg-slate-100 text-slate-500 rounded-md px-2 py-0.5 text-xs">{SOAL_TIPE_LABELS[tipe] ?? 'Soal'}</span>
        <span className="text-xs text-slate-400">Bobot: {item.soal.bobot}</span>
        <span className={`ml-auto inline-flex items-center gap-1.5 text-sm font-semibold ${status.color}`}>
          <status.Icon size={16} />
          {status.label}
        </span>
      </div>

      <RenderHTML
        html={item.soal.pertanyaan_html || item.soal.pertanyaan}
        className="text-sm text-slate-700 leading-relaxed mb-4"
      />

      {tipe === 'pilihan_ganda' && (
        <div className="space-y-2">
          {/* Student answer */}
          {item.student_opsi && (
            <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${
              item.is_correct
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                item.is_correct ? 'text-green-600' : 'text-red-500'
              }`}>Jawaban Anda</span>
              <div className="flex-1 text-sm">
                <strong className="mr-2">{item.student_opsi.huruf}.</strong>
                <RenderHTML className="inline" html={item.student_opsi.teks_html || item.student_opsi.teks} />
              </div>
            </div>
          )}

          {/* Correct answer (show if wrong or skipped) */}
          {!item.is_correct && item.correct_opsi && (
            <div className="flex items-start gap-3 rounded-xl px-4 py-3 border border-green-300 bg-green-50 text-green-700">
              <span className="text-xs font-bold uppercase tracking-wider shrink-0 mt-0.5 text-green-600">Jawaban Benar</span>
              <div className="flex-1 text-sm font-semibold">
                <strong className="mr-2">{item.correct_opsi.huruf}.</strong>
                <RenderHTML className="inline" html={item.correct_opsi.teks_html || item.correct_opsi.teks} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Pilihan Ganda Kompleks (TRN-22): mark each option ─── */}
      {tipe === 'pg_kompleks' && (() => {
        const selected = safeArray(item.student_answer?.jawaban_teks)
        return (
          <div className="space-y-2">
            {(item.soal.opsi ?? []).map((o) => {
              const chosen = selected.includes(o.id)
              const correct = !!o.is_benar
              const cls = correct
                ? 'bg-green-50 border-green-200 text-green-700'
                : chosen
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-white border-slate-200 text-slate-600'
              return (
                <div key={o.id} className={`flex items-start gap-3 rounded-xl px-4 py-2.5 border ${cls}`}>
                  <strong className="text-sm shrink-0">{o.huruf}.</strong>
                  <div className="flex-1 text-sm"><RenderHTML className="inline" html={o.teks_html || o.teks} /></div>
                  {chosen && <span className="text-[10px] font-bold uppercase tracking-wider bg-white/70 rounded px-1.5 py-0.5 shrink-0">Dipilih</span>}
                  {correct && <span className="text-[10px] font-bold uppercase tracking-wider bg-green-600 text-white rounded px-1.5 py-0.5 shrink-0">Kunci</span>}
                </div>
              )
            })}
          </div>
        )
      })()}

      {/* ─── Isian Singkat (TRN-22) ─── */}
      {tipe === 'isian_singkat' && (
        <div className="space-y-2">
          <div className={`rounded-xl px-4 py-3 border ${item.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${item.is_correct ? 'text-green-600' : 'text-red-500'}`}>Jawaban Anda</p>
            <p className="text-sm text-slate-700">{item.student_answer?.jawaban_teks?.trim() || <span className="italic text-slate-400">(tidak ada jawaban)</span>}</p>
          </div>
          {!item.is_correct && item.soal.jawaban_benar && (
            <div className="rounded-xl px-4 py-3 border border-green-300 bg-green-50">
              <p className="text-xs font-bold uppercase tracking-wider text-green-600 mb-1">Kunci Jawaban</p>
              <p className="text-sm font-semibold text-green-700">
                {item.soal.jawaban_benar.split('\n').map((k) => k.trim()).filter(Boolean).join('  •  ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ─── Menjodohkan (TRN-22): per-pair comparison ─── */}
      {tipe === 'menjodohkan' && (() => {
        const left = item.soal.matching_pairs?.left ?? []
        const right = item.soal.matching_pairs?.right ?? [] // correct order: left[i] ↔ right[i]
        const chosen = safeArray(item.student_answer?.jawaban_teks)
        return (
          <div className="space-y-2">
            {left.map((l, i) => {
              const stu = chosen[i] ?? ''
              const cor = right[i] ?? ''
              const ok = stu !== '' && eqText(stu, cor)
              return (
                <div key={i} className={`rounded-xl px-4 py-2.5 border ${ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-semibold text-slate-700">{l}</span>
                    <span className="text-slate-300">→</span>
                    <span className={ok ? 'text-green-700 font-semibold' : 'text-red-600'}>{stu || '—'}</span>
                  </div>
                  {!ok && (
                    <p className="mt-1 text-xs text-green-700">Jawaban benar: <span className="font-semibold">{cor}</span></p>
                  )}
                </div>
              )
            })}
          </div>
        )
      })()}

      {tipe === 'essay' && (
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Jawaban Anda</p>
          {item.student_answer?.jawaban_teks ? (
            <RenderHTML
              html={item.student_answer.jawaban_teks}
              className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap"
            />
          ) : (
            <p className="text-sm italic text-slate-400">(tidak ada jawaban)</p>
          )}
          <p className="text-xs text-amber-600 mt-3 inline-flex items-center gap-1">
            <MinusCircle size={11} /> Essay dinilai secara manual oleh guru
          </p>
        </div>
      )}

      {/* ─── Penyelesaian / Pembahasan (TRN-10) ─── */}
      {item.soal.penyelesaian_html && item.soal.penyelesaian_html.trim() && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
          <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600">
            <Lightbulb size={13} /> Penyelesaian / Pembahasan Soal
          </p>
          <RenderHTML
            html={item.soal.penyelesaian_html}
            className="text-sm leading-relaxed text-slate-700"
          />
        </div>
      )}
    </div>
  )
}

// ─── Grade computation ─────────────────────────────────────
function computeGrade(nilai: number) {
  if (nilai >= 90) {
    return {
      Icon: Trophy,
      iconClass: 'text-amber-500',
      badge: 'bg-green-600 text-white',
      label: 'Sangat Baik — A',
    }
  }
  if (nilai >= 75) {
    return {
      Icon: Star,
      iconClass: 'text-blue-500',
      badge: 'bg-blue-600 text-white',
      label: 'Baik — B',
    }
  }
  if (nilai >= 60) {
    return {
      Icon: BookOpen,
      iconClass: 'text-amber-500',
      badge: 'bg-amber-500 text-white',
      label: 'Cukup — C',
    }
  }
  return {
    Icon: TrendingUp,
    iconClass: 'text-red-500',
    badge: 'bg-red-600 text-white',
    label: 'Perlu Peningkatan — D',
  }
}
