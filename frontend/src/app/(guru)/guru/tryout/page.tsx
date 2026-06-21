'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { ApiResponse, Tryout } from '@/types'
import { ArrowLeft, Loader2, BookOpen, Clock, Tag } from 'lucide-react'

export default function BuatTryoutPage() {
  const router = useRouter()
  const [form, setForm] = useState({ nama_tryout: '', mata_pelajaran: '', durasi_menit: 90 })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post<ApiResponse<Tryout>>('/tryouts', form)
      const tryout = res.data.data
      if (tryout) router.push(`/guru/tryout/${tryout.id}/soal`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: ApiResponse<null> } }
      setError(axiosErr.response?.data?.error ?? 'Gagal membuat tryout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in-up pb-8 max-w-2xl mx-auto">
      <Link href="/guru/dashboard" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-triton-blue-600 transition-colors mb-6 font-medium">
        <ArrowLeft size={18} />
        Kembali ke Dashboard
      </Link>
      
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Buat Tryout Baru</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Isi detail tryout di bawah ini untuk mulai menambahkan soal.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-8 sm:p-10 shadow-glass flex flex-col gap-6">
        <div className="group">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-triton-blue-600">
            <Tag size={16} /> Nama Tryout
          </label>
          <input
            type="text"
            value={form.nama_tryout}
            onChange={(e) => setForm({ ...form, nama_tryout: e.target.value })}
            required
            placeholder="Contoh: Tryout UTBK SNBT Batch 1"
            className="w-full px-5 py-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-triton-blue-500/20 focus:border-triton-blue-500 text-slate-900 transition-all font-medium placeholder:font-normal placeholder:text-slate-400"
          />
        </div>
        <div className="group">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-triton-blue-600">
            <BookOpen size={16} /> Mata Pelajaran
          </label>
          <input
            type="text"
            value={form.mata_pelajaran}
            onChange={(e) => setForm({ ...form, mata_pelajaran: e.target.value })}
            required
            placeholder="Contoh: TPS / Literasi"
            className="w-full px-5 py-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-triton-blue-500/20 focus:border-triton-blue-500 text-slate-900 transition-all font-medium placeholder:font-normal placeholder:text-slate-400"
          />
        </div>
        <div className="group">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 transition-colors group-focus-within:text-triton-blue-600">
            <Clock size={16} /> Durasi (menit)
          </label>
          <input
            type="number"
            value={form.durasi_menit}
            onChange={(e) => setForm({ ...form, durasi_menit: Number(e.target.value) })}
            min={10}
            required
            className="w-full px-5 py-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-600 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-triton-blue-500/20 focus:border-triton-blue-500 text-slate-900 transition-all font-medium"
          />
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 px-5 py-3.5 rounded-2xl text-sm font-medium flex items-start gap-3 animate-fade-in border border-red-100">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="mt-4 py-4 bg-gradient-to-r from-triton-blue-600 to-triton-blue-500 hover:from-triton-blue-700 hover:to-triton-blue-600 disabled:opacity-70 text-white font-bold rounded-2xl transition-all shadow-glow hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            'Buat & Lanjut ke Soal'
          )}
        </button>
      </form>
    </div>
  )
}
