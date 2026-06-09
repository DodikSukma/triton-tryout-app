'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import api, { getErrorMessage } from '@/lib/api'
import { ApiResponse, SesiTryout } from '@/types'

/**
 * Direct-start share link target: /siswa/tryout/[id]/start-direct
 *
 * Auth is handled by the (siswa) RoleGuard — an unauthenticated visitor is sent
 * to /login?redirect=<this path> and returns here after logging in. For an
 * authenticated student we initialize/resume the session and jump straight into
 * the distraction-free exam (or the results page if it was already submitted).
 */
export default function StartDirectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function go() {
      try {
        // Already attempted? Resume or show the result instead of restarting.
        const existingRes = await api.get<ApiResponse<SesiTryout | null>>(`/sesi/by-tryout/${id}`)
        const existing = existingRes.data.data
        if (existing?.status === 'selesai') {
          toast.info('Tryout ini sudah pernah Anda kerjakan.')
          router.replace(`/siswa/hasil/${existing.id}`)
          return
        }

        // Initialize or resume the session, then enter the exam.
        const res = await api.post<ApiResponse<SesiTryout>>('/sesi', { tryout_id: id })
        const sesi = res.data.data
        if (!sesi) throw new Error('Sesi tidak terbentuk')
        router.replace(`/exam/${sesi.id}`)
      } catch (err) {
        setError(getErrorMessage(err, 'Gagal memulai tryout. Tautan mungkin tidak berlaku untuk jenjang Anda.'))
      }
    }
    go()
  }, [id, router])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      {error ? (
        <>
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4">
            <AlertCircle size={26} />
          </div>
          <p className="text-slate-700 font-semibold">{error}</p>
          <button
            onClick={() => router.replace('/siswa/tryout')}
            className="mt-5 inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors"
          >
            Kembali ke Daftar Tryout
          </button>
        </>
      ) : (
        <>
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
          <p className="text-slate-600 font-semibold">Menyiapkan tryout Anda...</p>
          <p className="text-slate-400 text-sm mt-1">Mohon tunggu, sesi sedang dibuka.</p>
        </>
      )}
    </div>
  )
}
