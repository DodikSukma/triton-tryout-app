'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import {
  Trophy, Star, BookOpen, TrendingUp, CheckCircle2, XCircle, MinusCircle, Loader2, ArrowLeft,
} from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { ApiResponse, Hasil, OpsiJawaban, SesiTryout, Soal, Tryout } from '@/types'
import RenderHTML from '@/components/shared/RenderHTML'

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
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-triton-blue-500 animate-spin" />
      </div>
    )
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

      {/* ─── Hero ─── */}
      <div className="relative bg-gradient-to-br from-triton-blue-600 to-triton-blue-800 rounded-2xl p-8 md:p-10 text-center text-white overflow-hidden shadow-xl">
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative">
          <grade.Icon size={80} className={`mx-auto ${grade.iconClass}`} />

          <h1 className="text-2xl md:text-3xl font-black mt-4">Tryout Selesai!</h1>
          {data.tryout && (
            <p className="text-triton-blue-200 text-base md:text-lg mt-1">{data.tryout.nama_tryout}</p>
          )}

          <div className="mt-7 flex items-baseline justify-center gap-1">
            <span className="text-7xl md:text-8xl font-black leading-none tabular-nums">{animatedScore}</span>
            <span className="text-xl md:text-2xl text-triton-blue-300 font-bold">/100</span>
          </div>

          <span className={`mt-5 inline-block rounded-full px-6 py-2 font-bold text-sm md:text-base ${grade.badge}`}>
            {grade.label}
          </span>

          <div className="mt-8 grid grid-cols-3 divide-x divide-white/15 max-w-md mx-auto">
            <Stat label="Benar"  value={benar}  color="text-green-300" Icon={CheckCircle2} />
            <Stat label="Salah"  value={salah}  color="text-red-300"   Icon={XCircle} />
            <Stat label="Kosong" value={skipCount} color="text-slate-300" Icon={MinusCircle} />
          </div>
        </div>
      </div>

      {/* ─── Detail per soal ─── */}
      <div className="mt-8 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-lg text-slate-900">Detail Jawaban</h2>
          <p className="text-xs text-slate-500 mt-0.5">Periksa kembali jawaban Anda untuk belajar dari kesalahan.</p>
        </div>

        <div className="divide-y divide-slate-100">
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
      <p className="text-xs text-triton-blue-200 mt-0.5">{label}</p>
    </div>
  )
}

function DetailItem({ item, idx }: { item: HasilDetailItem; idx: number }) {
  const isPG = item.soal.tipe === 'pilihan_ganda'
  const status = item.is_skipped
    ? { Icon: MinusCircle, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Tidak Dijawab' }
    : item.is_correct
      ? { Icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', label: 'Benar' }
      : { Icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: isPG ? 'Salah' : 'Perlu Penilaian' }

  return (
    <div className="px-6 py-5">
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="bg-triton-blue-500 text-white rounded-full px-3 py-1 text-xs font-bold">Soal {idx + 1}</span>
        <span className="bg-slate-100 text-slate-500 rounded-md px-2 py-0.5 text-xs">{isPG ? 'PG' : 'Essay'}</span>
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

      {isPG && (
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

      {!isPG && (
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Jawaban Anda</p>
          {item.student_answer?.jawaban_teks ? (
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{item.student_answer.jawaban_teks}</p>
          ) : (
            <p className="text-sm italic text-slate-400">(tidak ada jawaban)</p>
          )}
          <p className="text-xs text-amber-600 mt-3 inline-flex items-center gap-1">
            <MinusCircle size={11} /> Essay dinilai secara manual oleh guru
          </p>
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
      iconClass: 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]',
      badge: 'bg-green-400 text-white',
      label: 'Sangat Baik — A',
    }
  }
  if (nilai >= 75) {
    return {
      Icon: Star,
      iconClass: 'text-yellow-300',
      badge: 'bg-triton-blue-400 text-white',
      label: 'Baik — B',
    }
  }
  if (nilai >= 60) {
    return {
      Icon: BookOpen,
      iconClass: 'text-triton-blue-200',
      badge: 'bg-yellow-400 text-slate-900',
      label: 'Cukup — C',
    }
  }
  return {
    Icon: TrendingUp,
    iconClass: 'text-triton-blue-300',
    badge: 'bg-red-400 text-white',
    label: 'Perlu Peningkatan — D',
  }
}
