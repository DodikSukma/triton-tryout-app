'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import { ApiResponse, SessionUser } from '@/types'

// Only honor internal, same-origin redirect targets.
function safeRedirect(target: string | null): string | null {
  if (target && target.startsWith('/') && !target.startsWith('//')) return target
  return null
}

// ─── Skeleton block ───────────────────────────────────────────────────────────

function SkeletonField() {
  return (
    <div className="space-y-2">
      <div className="bg-slate-100 dark:bg-slate-700 animate-pulse rounded-lg h-4 w-20" />
      <div className="bg-slate-100 dark:bg-slate-700 animate-pulse rounded-xl h-12 w-full" />
    </div>
  )
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = safeRedirect(searchParams?.get('redirect') ?? null)
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // Check if already authenticated on mount
  useEffect(() => {
    api.get<ApiResponse<SessionUser>>('/auth/me')
      .then((res) => {
        const role = res.data.data?.role
        if (role) {
          router.replace(redirectTo ?? `/${role}/dashboard`)
        } else {
          setCheckingSession(false)
        }
      })
      .catch(() => setCheckingSession(false))
  }, [router, redirectTo])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post<ApiResponse<SessionUser>>('/auth/login', { email, password })
      const meRes = await api.get<ApiResponse<SessionUser>>('/auth/me')
      const role = meRes.data.data?.role
      if (redirectTo) router.push(redirectTo)
      else if (role) router.push(`/${role}/dashboard`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: ApiResponse<null> } }
      setError(axiosErr.response?.data?.error ?? 'Email atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL — Branding ─────────────────────────────────── */}
      <div className="hidden lg:flex w-[48%] xl:w-1/2 flex-col relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900">

        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-blue-600/30 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-white/5 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10">

          {/* TOP — Logo in white card */}
          <div>
            <div className="bg-white rounded-2xl px-5 py-3 inline-block shadow-md">
              <Image
                src="/logo.png"
                alt="Triton Denpasar"
                width={120}
                height={40}
                priority
                className="h-10 w-auto object-contain"
              />
            </div>
          </div>

          {/* MIDDLE — Einstein asset + marketing copy */}
          <div className="flex-1 flex flex-col justify-center items-center">

            {/* Speech bubble */}
            <div className="self-center mb-4">
              <div className="bg-white rounded-2xl rounded-bl-none px-4 py-2.5 shadow-md inline-block">
                <p className="text-sm font-semibold text-slate-700">Belajar itu menyenangkan! 🎓</p>
              </div>
            </div>

            {/* Einstein photo */}
            <div className="relative w-56 h-64 xl:w-64 xl:h-72">
              <Image
                src="/person-albert-enstein.png"
                alt="Albert Einstein — Triton Denpasar"
                fill
                className="object-contain object-bottom drop-shadow-2xl"
                priority
              />
            </div>

            {/* Tagline */}
            <h2 className="text-white font-black text-2xl text-center mt-5 leading-snug">
              Platform Tryout Terpercaya
            </h2>
            <p className="text-blue-200 text-sm text-center mt-2 leading-relaxed max-w-xs">
              Akses ribuan soal berkualitas dan pantau perkembanganmu secara real-time.
            </p>

            {/* Feature bullets */}
            <div className="mt-7 space-y-3 w-full max-w-xs">
              {[
                'Soal PG, essay, dan persamaan matematika',
                'Nilai otomatis setelah tryout selesai',
                'Guru pantau rekap nilai semua siswa',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  <span className="text-blue-100 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM — Quote */}
          <div className="text-center">
            <p className="text-blue-400 italic text-xs">
              &ldquo;Stay curious.&rdquo; — Albert Einstein
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ───────────────────────────────────── */}
      <div className="flex-1 bg-white dark:bg-slate-800 flex items-center justify-center px-6 md:px-12 xl:px-16">
        <div className="w-full max-w-md">

          {/* Mobile: logo */}
          <div className="lg:hidden mb-10 flex justify-center">
            <Image
              src="/logo.png"
              alt="Triton Denpasar"
              width={140}
              height={48}
              priority
              className="h-12 w-auto object-contain"
            />
          </div>

          {/* ── Session-check skeleton ── */}
          {checkingSession ? (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <div className="bg-slate-100 dark:bg-slate-700 animate-pulse rounded-lg h-8 w-48" />
                <div className="bg-slate-100 dark:bg-slate-700 animate-pulse rounded-lg h-4 w-64" />
              </div>
              <div className="mt-8 space-y-5">
                <SkeletonField />
                <SkeletonField />
                <div className="bg-slate-100 dark:bg-slate-700 animate-pulse rounded-xl h-12 w-full" />
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="animate-fade-in-up">
                <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Selamat Datang! 👋</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
                  Silakan masuk untuk melanjutkan belajar.
                </p>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="animate-fade-in-up mt-8 space-y-5"
                style={{ animationDelay: '0.05s' }}
              >

                {/* Email field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="email@contoh.com"
                      className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder:text-slate-400 transition-all duration-200 text-sm disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      placeholder="••••••••"
                      className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder:text-slate-400 transition-all duration-200 text-sm disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      disabled={loading}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 transition-colors disabled:opacity-40"
                    >
                      {showPassword
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>

                {/* Inline error */}
                {error && (
                  <div className="animate-fade-in bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-600 text-sm leading-snug">{error}</p>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <span>Masuk ke Akun</span>
                  )}
                </button>
              </form>

              {/* Footer note */}
              <p
                className="animate-fade-in-up text-slate-400 dark:text-slate-500 text-xs text-center mt-8"
                style={{ animationDelay: '0.10s' }}
              >
                Belum punya akun?{' '}
                <span className="text-blue-500 font-medium">
                  Hubungi admin Triton Denpasar.
                </span>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-800" />}>
      <LoginInner />
    </Suspense>
  )
}
