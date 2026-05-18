'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Mail, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import api from '@/lib/api'
import { ApiResponse, SessionUser } from '@/types'

function EinsteinSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 230 280" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M82 82 Q50 58 44 28 Q70 52 82 82" fill="#F1F5F9" />
      <path d="M178 82 Q210 58 216 28 Q190 52 178 82" fill="#F1F5F9" />
      <path d="M108 52 Q98 12 118 2 Q122 38 108 52" fill="#E2E8F0" />
      <path d="M152 52 Q162 12 142 2 Q138 38 152 52" fill="#E2E8F0" />
      <ellipse cx="130" cy="85" rx="55" ry="44" fill="#E2E8F0" />
      <ellipse cx="130" cy="118" rx="48" ry="52" fill="#FDDCB0" />
      <ellipse cx="82" cy="118" rx="9" ry="13" fill="#FDDCB0" />
      <ellipse cx="178" cy="118" rx="9" ry="13" fill="#FDDCB0" />
      <ellipse cx="82" cy="118" rx="5" ry="8" fill="#F5C28A" />
      <ellipse cx="178" cy="118" rx="5" ry="8" fill="#F5C28A" />
      <path d="M96 96 Q108 88 118 93" stroke="#CBD5E1" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M142 93 Q152 88 164 96" stroke="#CBD5E1" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="108" cy="110" r="9" fill="white" />
      <circle cx="152" cy="110" r="9" fill="white" />
      <circle cx="109" cy="111" r="4.5" fill="#1E293B" />
      <circle cx="153" cy="111" r="4.5" fill="#1E293B" />
      <circle cx="111" cy="108" r="2" fill="white" />
      <circle cx="155" cy="108" r="2" fill="white" />
      <path d="M126 128 Q130 136 134 128" stroke="#DDA07A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M102 148 Q116 140 130 145 Q144 140 158 148 Q146 158 130 153 Q114 158 102 148" fill="#D1D5DB" />
      <path d="M116 162 Q130 173 144 162" stroke="#B07840" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="118" y="165" width="24" height="14" fill="#FDDCB0" rx="4" />
      <path d="M106 178 L118 168 L130 183 L142 168 L154 178 L142 186 L130 179 L118 186 Z" fill="white" />
      <path d="M78 190 Q98 178 118 183 L118 280 L78 280 Z" fill="#1E3A8A" />
      <path d="M182 190 Q162 178 142 183 L142 280 L182 280 Z" fill="#1E3A8A" />
      <rect x="100" y="183" width="60" height="97" fill="#2563EB" rx="3" />
      <path d="M127 185 L130 198 L133 185 L130 191 Z" fill="#EF4444" />
      <path d="M127.5 195 L130 238 L132.5 195 Z" fill="#DC2626" />
      {/* Left arm at side */}
      <path d="M100 198 Q72 212 62 238" stroke="#1E3A8A" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d="M100 198 Q72 212 62 238" stroke="#2563EB" strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="61" cy="240" r="9" fill="#FDDCB0" />
      {/* Right arm pointing UP */}
      <path d="M160 195 Q188 172 196 148" stroke="#1E3A8A" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d="M160 195 Q188 172 196 148" stroke="#2563EB" strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="196" cy="145" r="9" fill="#FDDCB0" />
      <ellipse cx="196" cy="130" rx="5" ry="13" fill="#FDDCB0" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post<ApiResponse<SessionUser>>('/auth/login', { email, password })
      const meRes = await api.get<ApiResponse<SessionUser>>('/auth/me')
      const role = meRes.data.data?.role
      if (role) router.push(`/${role}/dashboard`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: ApiResponse<null> } }
      setError(axiosErr.response?.data?.error ?? 'Email atau password salah')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ───────────────────────────────────────────── */}
      <div className="hidden lg:flex w-1/2 flex-col relative overflow-hidden bg-gradient-to-br from-blue-700 to-blue-900">

        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 rounded-full bg-white/5 blur-2xl pointer-events-none" />

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

          {/* MIDDLE — Einstein + copy */}
          <div className="flex-1 flex flex-col justify-center">
            {/* Speech bubble */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl rounded-bl-none px-4 py-2 shadow-md inline-block mb-4">
                <p className="text-sm font-semibold text-slate-700">Belajar itu menyenangkan! 🎓</p>
              </div>
            </div>

            {/* Einstein */}
            <EinsteinSVG className="w-48 h-48 mx-auto" />

            <h2 className="text-white font-black text-2xl text-center mt-6">
              Platform Tryout Terpercaya
            </h2>
            <p className="text-blue-200 text-sm text-center mt-2 leading-relaxed max-w-xs mx-auto">
              Akses ribuan soal berkualitas dan pantau perkembanganmu.
            </p>

            {/* Bullets */}
            <div className="mt-8 space-y-3 max-w-xs mx-auto">
              {[
                'Soal PG, essay, dan persamaan matematika',
                'Nilai otomatis setelah tryout selesai',
                'Guru pantau rekap nilai semua siswa',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-blue-100 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM — Einstein quote */}
          <div className="text-center">
            <p className="text-blue-400 italic text-xs">&quot;Stay curious.&quot; — Albert Einstein</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────── */}
      <div className="flex-1 bg-white flex items-center justify-center px-8 md:px-16">
        <div className="max-w-md w-full">

          {/* Mobile: show logo without filter */}
          <div className="lg:hidden mb-10 flex justify-center">
            <Image
              src="/logo.png"
              alt="Triton Denpasar"
              width={140}
              height={40}
              priority
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Header */}
          <h1 className="text-3xl font-black text-slate-900">Selamat Datang! 👋</h1>
          <p className="text-slate-500 text-sm mt-2">Silakan masuk untuk melanjutkan belajar.</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@contoh.com"
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 placeholder:text-slate-400 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-slate-900 placeholder:text-slate-400 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm flex items-start gap-2">
                <span className="shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-70 text-white font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk ke Akun'
              )}
            </button>
          </form>

          {/* Bottom note */}
          <p className="text-slate-400 text-xs text-center mt-8">
            Belum punya akun? Hubungi admin Triton Denpasar.
          </p>
        </div>
      </div>
    </div>
  )
}
