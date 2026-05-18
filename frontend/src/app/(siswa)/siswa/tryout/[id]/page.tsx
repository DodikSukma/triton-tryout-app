'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Clock, FileText, Scale, Calendar, AlertCircle, Loader2 } from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { ApiResponse, SesiTryout, TryoutDetail } from '@/types'
import { formatDurasi, formatTanggal } from '@/lib/utils'

export default function TryoutConfirmationPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tryout, setTryout] = useState<TryoutDetail | null>(null)
  const [existingSesi, setExistingSesi] = useState<SesiTryout | null>(null)
  const [loading, setLoading] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [tRes, sRes] = await Promise.all([
          api.get<ApiResponse<TryoutDetail>>(`/tryouts/${id}`),
          api.get<ApiResponse<SesiTryout | null>>(`/sesi/by-tryout/${id}`),
        ])
        if (cancelled) return
        setTryout(tRes.data.data ?? null)
        setExistingSesi(sRes.data.data ?? null)
        if (sRes.data.data?.status === 'selesai') {
          toast.info('Tryout ini sudah pernah Anda kerjakan.')
          router.replace(`/siswa/hasil/${sRes.data.data.id}`)
        }
      } catch (err) {
        if (!cancelled) toast.error(getErrorMessage(err, 'Gagal memuat detail tryout.'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id, router])

  async function handleStart() {
    if (!tryout || !agreed) return
    setStarting(true)
    try {
      const res = await api.post<ApiResponse<SesiTryout>>('/sesi', { tryout_id: tryout.id })
      const sesi = res.data.data
      if (!sesi) throw new Error('Sesi tidak terbentuk')
      router.push(`/exam/${sesi.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gagal memulai tryout.'))
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-triton-blue-500 animate-spin" />
      </div>
    )
  }
  if (!tryout) return <div className="text-center py-16 text-slate-500">Tryout tidak ditemukan.</div>

  const totalBobot = (tryout.soal ?? []).reduce((sum, s) => sum + (s.bobot || 0), 0)
  const isResume = existingSesi?.status === 'berlangsung'

  const infoItems = [
    { Icon: Clock,    label: 'Durasi',         value: formatDurasi(tryout.durasi_menit) },
    { Icon: FileText, label: 'Jumlah Soal',    value: `${tryout.soal?.length ?? 0} soal` },
    { Icon: Scale,    label: 'Total Bobot',    value: `${totalBobot} poin` },
    { Icon: Calendar, label: 'Tanggal Dibuat', value: formatTanggal(tryout.created_at) },
  ]

  const rules = [
    'Pastikan koneksi internet Anda stabil sebelum memulai.',
    'Timer berjalan setelah Anda klik "Mulai Tryout".',
    'Jawaban disimpan otomatis setiap berpindah soal.',
    'Tryout akan dikumpulkan otomatis saat waktu habis.',
    'Anda hanya bisa mengerjakan tryout ini satu kali.',
  ]

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 md:px-6">
      <Link href="/siswa/tryout" className="inline-flex items-center gap-1.5 text-sm text-triton-blue-600 hover:text-triton-blue-700 hover:underline mb-5">
        <ArrowLeft size={14} /> Kembali ke Tryout
      </Link>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-10">
        <span className="inline-block bg-triton-blue-50 text-triton-blue-600 rounded-full px-3 py-1 text-xs font-semibold">
          {tryout.mata_pelajaran}
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-3">{tryout.nama_tryout}</h1>
        {isResume && (
          <p className="mt-3 text-sm font-medium text-amber-600 bg-amber-50 inline-flex items-center gap-2 rounded-full px-3 py-1.5">
            <AlertCircle size={14} />
            Anda sedang mengerjakan tryout ini. Klik "Lanjutkan" untuk melanjutkan.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mt-7">
          {infoItems.map(({ Icon, label, value }) => (
            <div key={label} className="bg-slate-50 rounded-xl p-4">
              <Icon size={18} className="text-triton-blue-500" />
              <p className="text-xs text-slate-400 mt-2">{label}</p>
              <p className="font-bold text-slate-900 text-sm">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <h2 className="font-bold text-slate-900 mb-4">Peraturan Tryout</h2>
          <ul className="space-y-2.5">
            {rules.map((rule) => (
              <li key={rule} className="flex items-start gap-3 text-sm text-slate-600 leading-relaxed">
                <AlertCircle size={14} className="text-triton-blue-500 mt-0.5 shrink-0" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>

        <label className="mt-8 flex items-start gap-3 cursor-pointer select-none p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-triton-blue-500 cursor-pointer"
          />
          <span className="text-sm text-slate-700 font-medium">
            Saya telah membaca dan menyetujui semua peraturan di atas.
          </span>
        </label>

        <button
          onClick={handleStart}
          disabled={!agreed || starting}
          className="mt-5 w-full bg-triton-red-500 hover:bg-triton-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base hover:shadow-lg hover:shadow-red-200/60 transition-all inline-flex items-center justify-center gap-2"
        >
          {starting && <Loader2 size={16} className="animate-spin" />}
          {starting ? 'Memulai...' : isResume ? 'Lanjutkan Tryout →' : 'Mulai Tryout Sekarang →'}
        </button>
      </div>
    </div>
  )
}
