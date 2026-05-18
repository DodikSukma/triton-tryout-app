'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  FileText, Calculator, CheckCircle2, Timer, BarChart2, Users,
  GraduationCap, Trophy, MapPin, Mail, Phone, Star,
} from 'lucide-react'

// ─── Einstein SVG — Hero pose (holding chalkboard) ────────────────────────────

function EinsteinSVG({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 230 280" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Wild hair — sprays */}
      <path d="M82 82 Q50 58 44 28 Q70 52 82 82" fill="#F1F5F9" />
      <path d="M178 82 Q210 58 216 28 Q190 52 178 82" fill="#F1F5F9" />
      <path d="M108 52 Q98 12 118 2 Q122 38 108 52" fill="#E2E8F0" />
      <path d="M152 52 Q162 12 142 2 Q138 38 152 52" fill="#E2E8F0" />
      <path d="M130 48 Q128 8 132 8 Q134 44 130 48" fill="#F1F5F9" />
      {/* Hair base */}
      <ellipse cx="130" cy="85" rx="55" ry="44" fill="#E2E8F0" />
      {/* Head */}
      <ellipse cx="130" cy="118" rx="48" ry="52" fill="#FDDCB0" />
      {/* Ears */}
      <ellipse cx="82" cy="118" rx="9" ry="13" fill="#FDDCB0" />
      <ellipse cx="178" cy="118" rx="9" ry="13" fill="#FDDCB0" />
      <ellipse cx="82" cy="118" rx="5" ry="8" fill="#F5C28A" />
      <ellipse cx="178" cy="118" rx="5" ry="8" fill="#F5C28A" />
      {/* Eyebrows — bushy */}
      <path d="M96 96 Q108 88 118 93" stroke="#CBD5E1" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M142 93 Q152 88 164 96" stroke="#CBD5E1" strokeWidth="5" fill="none" strokeLinecap="round" />
      {/* Eyes */}
      <circle cx="108" cy="110" r="9" fill="white" />
      <circle cx="152" cy="110" r="9" fill="white" />
      <circle cx="109" cy="111" r="4.5" fill="#1E293B" />
      <circle cx="153" cy="111" r="4.5" fill="#1E293B" />
      <circle cx="111" cy="108" r="2" fill="white" />
      <circle cx="155" cy="108" r="2" fill="white" />
      {/* Nose */}
      <path d="M126 128 Q130 136 134 128" stroke="#DDA07A" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M124 132 Q130 139 136 132" stroke="#DDA07A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Mustache */}
      <path d="M102 148 Q116 140 130 145 Q144 140 158 148 Q146 158 130 153 Q114 158 102 148" fill="#D1D5DB" />
      {/* Smile */}
      <path d="M116 162 Q130 173 144 162" stroke="#B07840" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Neck */}
      <rect x="118" y="165" width="24" height="14" fill="#FDDCB0" rx="4" />
      {/* Collar */}
      <path d="M106 178 L118 168 L130 183 L142 168 L154 178 L142 186 L130 179 L118 186 Z" fill="white" />
      {/* Jacket */}
      <path d="M78 190 Q98 178 118 183 L118 280 L78 280 Z" fill="#1E3A8A" />
      <path d="M182 190 Q162 178 142 183 L142 280 L182 280 Z" fill="#1E3A8A" />
      <rect x="100" y="183" width="60" height="97" fill="#2563EB" rx="3" />
      {/* Tie */}
      <path d="M127 185 L130 198 L133 185 L130 191 Z" fill="#EF4444" />
      <path d="M127.5 195 L130 238 L132.5 195 Z" fill="#DC2626" />
      {/* Left arm holding chalkboard */}
      <path d="M100 198 Q72 212 58 232" stroke="#1E3A8A" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d="M100 198 Q72 212 58 232" stroke="#2563EB" strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="56" cy="234" r="9" fill="#FDDCB0" />
      {/* Chalkboard */}
      <rect x="5" y="208" width="60" height="44" rx="5" fill="#374151" />
      <rect x="8" y="211" width="54" height="38" rx="3" fill="#166534" />
      <rect x="5" y="248" width="60" height="5" rx="2" fill="#6B7280" />
      <text x="35" y="234" textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace" fontWeight="bold">E=mc²</text>
      {/* Right arm */}
      <path d="M160 198 Q188 212 196 234" stroke="#1E3A8A" strokeWidth="18" strokeLinecap="round" fill="none" />
      <path d="M160 198 Q188 212 196 234" stroke="#2563EB" strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="197" cy="236" r="9" fill="#FDDCB0" />
    </svg>
  )
}

// ─── Einstein SVG — Teaching pose (pointing up) ───────────────────────────────

function EinsteinTeaching({ className = '' }: { className?: string }) {
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

// ─── StatCounter ──────────────────────────────────────────────────────────────

function StatCounter({
  value, suffix, label, format,
}: {
  value: number
  suffix: string
  label: string
  format?: (n: number) => string
}) {
  const [count, setCount] = useState(0)
  const [triggered, setTriggered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setTriggered(true) },
      { threshold: 0.5 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!triggered) return
    const duration = 1500
    const start = performance.now()
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * value))
      if (progress < 1) requestAnimationFrame(animate)
      else setCount(value)
    }
    requestAnimationFrame(animate)
  }, [triggered, value])

  const display = format ? format(count) : String(count)

  return (
    <div ref={ref}>
      <p className="text-5xl font-extrabold text-white tabular-nums">{display}{suffix}</p>
      <p className="text-blue-200 text-sm mt-2">{label}</p>
    </div>
  )
}

// ─── Landing Page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const featuresRef    = useRef<HTMLElement>(null)
  const howItWorksRef  = useRef<HTMLElement>(null)
  const trustRef       = useRef<HTMLElement>(null)
  const testimonialRef = useRef<HTMLElement>(null)
  const footerRef      = useRef<HTMLElement>(null)

  useEffect(() => {
    const sections = [featuresRef, howItWorksRef, trustRef, testimonialRef, footerRef]
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'))
          }
        })
      },
      { threshold: 0.1 }
    )
    sections.forEach((s) => { if (s.current) obs.observe(s.current) })
    return () => obs.disconnect()
  }, [])

  const navLinks = ['Beranda', 'Fitur', 'Tentang', 'Kontak']

  return (
    <div className="min-h-screen font-sans">

      {/* ── NAVBAR ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center justify-between">
          <Image src="/logo.png" alt="Triton Denpasar" width={140} height={40} className="h-10 w-auto object-contain" priority />

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                {item}
              </a>
            ))}
          </div>

          <Link href="/login"
            className="bg-red-500 hover:bg-red-600 text-white rounded-full px-5 py-2 text-sm font-semibold hover:shadow-md transition-all">
            Masuk
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section id="beranda" className="relative bg-white overflow-hidden py-20 md:py-32"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(59,130,246,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-4 py-2">
                ⭐ Platform Tryout Online #1 di Bali
              </div>

              <h1 className="mt-6 text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
                Belajar Lebih Cerdas,
                <br />
                Raih Hasil{' '}
                <span className="bg-gradient-to-r from-blue-600 to-red-500 bg-clip-text text-transparent">
                  Terbaik
                </span>
              </h1>

              <blockquote className="mt-6 border-l-4 border-blue-500 pl-4">
                <p className="italic text-slate-500 text-base leading-relaxed">
                  "Imagination is more important than knowledge."
                </p>
                <footer className="text-xs text-slate-400 font-semibold mt-1">— Albert Einstein</footer>
              </blockquote>

              <p className="mt-5 text-slate-500 text-lg leading-relaxed max-w-lg">
                Platform latihan soal CBT terlengkap untuk siswa bimbel Triton Denpasar.
                Soal pilihan ganda, essay, dan matematika — nilai otomatis, instan.
              </p>

              <div className="mt-8 flex gap-4 flex-wrap">
                <Link href="/login"
                  className="bg-red-500 hover:bg-red-600 text-white font-bold rounded-full px-8 py-4 text-base shadow-lg shadow-red-200/50 hover:scale-105 transition-all duration-200">
                  Mulai Sekarang →
                </Link>
                <a href="#fitur"
                  className="border-2 border-blue-500 text-blue-600 font-semibold rounded-full px-8 py-4 text-base hover:bg-blue-50 transition-all duration-200">
                  Pelajari Fitur
                </a>
              </div>

              <div className="mt-8 flex gap-6 flex-wrap">
                {['1.000+ Siswa Terdaftar', '500+ Soal Tersedia', 'Nilai Instan'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Einstein illustration */}
            <div className="flex justify-center items-center">
              <div className="relative w-full max-w-sm mx-auto min-h-[360px]">
                {/* Background circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-blue-50" />

                {/* Floating math symbols — desktop only */}
                <span className="hidden md:block absolute top-6 right-6 text-blue-300 font-mono text-sm rotate-12 animate-float" style={{ animationDelay: '0s' }}>E=mc²</span>
                <span className="hidden md:block absolute top-10 left-2 text-red-300 text-2xl -rotate-6 animate-float" style={{ animationDelay: '0.5s' }}>∑</span>
                <span className="hidden md:block absolute bottom-16 right-2 text-blue-200 text-3xl animate-float" style={{ animationDelay: '1s' }}>π</span>
                <span className="hidden md:block absolute left-0 top-1/2 text-red-200 text-2xl rotate-6 animate-float" style={{ animationDelay: '1.5s' }}>∫</span>
                <span className="hidden md:block absolute bottom-20 left-6 text-blue-300 text-lg -rotate-12 animate-float" style={{ animationDelay: '2s' }}>√x</span>

                {/* Speech bubble */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                  <div className="bg-white border border-blue-200 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm">
                    <p className="text-sm font-semibold text-slate-700">Ayo, kita belajar bersama! 🎓</p>
                  </div>
                </div>

                {/* Einstein */}
                <div className="relative z-0 pt-10">
                  <EinsteinSVG className="w-full max-w-[270px] mx-auto" />
                </div>

                {/* Floating badge */}
                <div className="absolute -bottom-2 -left-2 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 flex items-center gap-3 z-10">
                  <Trophy className="w-8 h-8 text-yellow-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Nilai Terbaik</p>
                    <p className="text-xl font-black text-slate-900">98 / 100</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ──────────────────────────────────────────────── */}
      <section className="bg-blue-600 py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {([
              { value: 500,  suffix: '+', label: 'Soal Tersedia',    fmt: undefined },
              { value: 50,   suffix: '+', label: 'Tryout Aktif',     fmt: undefined },
              {
                value: 1000, suffix: '+', label: 'Siswa Terdaftar',
                fmt: (n: number) => n >= 1000
                  ? `${Math.floor(n / 1000)}.${String(n % 1000).padStart(3, '0')}`
                  : String(n),
              },
              { value: 98,   suffix: '%', label: 'Kepuasan Siswa',   fmt: undefined },
            ] as { value: number; suffix: string; label: string; fmt: ((n: number) => string) | undefined }[])
              .map((stat, idx) => (
                <div key={stat.label}
                  className={`py-4 md:py-0 ${idx < 3 ? 'md:border-r md:border-blue-500/40' : ''}`}>
                  <StatCounter value={stat.value} suffix={stat.suffix} label={stat.label} format={stat.fmt} />
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────── */}
      <section id="fitur" ref={featuresRef} className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 reveal">
            <p className="text-xs font-bold tracking-widest text-blue-500 uppercase">FITUR UNGGULAN</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-3">
              Semua yang Dibutuhkan Siswa
            </h2>
            <p className="text-slate-500 text-lg mt-3 max-w-2xl mx-auto">
              Dirancang untuk hasil maksimal — dari input soal hingga analisis nilai.
            </p>
          </div>
          <p className="text-center italic text-slate-400 text-sm mb-16 reveal reveal-delay-1">
            "The only source of knowledge is experience." — Albert Einstein
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {([
              { icon: <FileText className="w-6 h-6 text-blue-500" />,   bg: 'bg-blue-50',   title: 'Soal Beragam',            desc: 'PG, essay, gambar, persamaan matematika — semua format tersedia.',              delay: '' },
              { icon: <Calculator className="w-6 h-6 text-violet-500" />, bg: 'bg-violet-50', title: 'Persamaan Matematika',    desc: 'LaTeX rendered otomatis, tampil jelas di semua perangkat.',                    delay: 'reveal-delay-1' },
              { icon: <CheckCircle2 className="w-6 h-6 text-green-500" />, bg: 'bg-green-50', title: 'Nilai Otomatis',         desc: 'Dihitung instan setelah selesai, transparan dan akurat.',                       delay: 'reveal-delay-2' },
              { icon: <Timer className="w-6 h-6 text-red-500" />,       bg: 'bg-red-50',    title: 'Timer Real-time',          desc: 'Auto-submit saat waktu habis, sesuai kondisi ujian nyata.',                    delay: 'reveal-delay-3' },
              { icon: <BarChart2 className="w-6 h-6 text-orange-500" />, bg: 'bg-orange-50', title: 'Rekap Nilai',            desc: 'Guru pantau semua hasil siswa dengan detail dan statistik lengkap.',            delay: 'reveal-delay-4' },
              { icon: <Users className="w-6 h-6 text-teal-500" />,      bg: 'bg-teal-50',   title: 'Multi Role',               desc: 'Admin, guru, siswa — dalam satu platform terintegrasi.',                       delay: 'reveal-delay-5' },
            ] as { icon: React.ReactNode; bg: string; title: string; desc: string; delay: string }[])
              .map((card) => (
                <div key={card.title}
                  className={`reveal ${card.delay} bg-white border border-slate-100 rounded-2xl p-7 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
                  <div className={`w-12 h-12 rounded-xl ${card.bg} flex items-center justify-center mb-5`}>
                    {card.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-base text-slate-600 leading-relaxed">{card.desc}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────── */}
      <section id="tentang" ref={howItWorksRef} className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Cara Kerjanya Sederhana</h2>
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Connector line — desktop only */}
            <div className="hidden md:block absolute top-8 left-[15%] right-[15%] border-t-2 border-dashed border-blue-200 z-0" />

            {([
              { num: '1', title: 'Daftar & Masuk',   desc: 'Admin buat akun guru dan siswa dengan mudah.',           color: 'from-blue-500 to-blue-700', delay: '' },
              { num: '2', title: 'Pilih Tryout',      desc: 'Siswa pilih tryout sesuai mata pelajaran.',              color: 'from-red-500 to-red-700',  delay: 'reveal-delay-1' },
              { num: '3', title: 'Kerjakan Soal',     desc: 'Jawab dalam batas waktu yang ditentukan.',               color: 'from-blue-500 to-blue-700', delay: 'reveal-delay-2' },
              { num: '4', title: 'Lihat Hasil',       desc: 'Nilai muncul instan, rekap tersedia untuk semua.',       color: 'from-red-500 to-red-700',  delay: 'reveal-delay-3' },
            ] as { num: string; title: string; desc: string; color: string; delay: string }[])
              .map((step) => (
                <div key={step.num} className={`reveal ${step.delay} text-center relative z-10`}>
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center font-black text-white text-xl mx-auto shadow-lg`}>
                    {step.num}
                  </div>
                  <h3 className="font-bold text-slate-900 mt-5">{step.title}</h3>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">{step.desc}</p>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ── EINSTEIN TRUST SECTION ─────────────────────────────────── */}
      <section ref={trustRef} className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: Einstein teaching */}
            <div className="flex justify-center reveal">
              <div className="relative w-72 h-80">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-blue-50" />
                <EinsteinTeaching className="absolute inset-0 w-full h-full" />

                {/* Floating card 1 */}
                <div className="absolute -top-4 -right-6 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 flex items-center gap-3 z-10">
                  <GraduationCap className="w-8 h-8 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">Guru Berpengalaman</p>
                    <p className="text-xs text-slate-400">Triton Denpasar</p>
                  </div>
                </div>

                {/* Floating card 2 */}
                <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 z-10">
                  <div className="flex gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xl font-black text-slate-900">4.9 / 5.0</p>
                  <p className="text-xs text-slate-400">Rating Siswa</p>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div>
              <p className="reveal text-xs font-bold tracking-widest text-blue-500 uppercase">
                MENGAPA TRITON DENPASAR?
              </p>
              <h2 className="reveal reveal-delay-1 text-3xl md:text-4xl font-bold text-slate-900 mt-3">
                Dipercaya Ribuan Siswa di Bali
              </h2>

              <blockquote className="reveal reveal-delay-2 mt-4 border-l-4 border-red-500 pl-4">
                <p className="italic text-slate-500">"Genius is 1% talent and 99% hard work."</p>
                <footer className="text-xs text-slate-400 font-semibold mt-1">— Albert Einstein</footer>
              </blockquote>

              <div className="mt-8 space-y-4">
                {([
                  { title: 'Soal Berkualitas Tinggi',    desc: 'Dibuat oleh guru berpengalaman sesuai kurikulum terbaru.',              delay: 'reveal-delay-2' },
                  { title: 'Sistem Penilaian Akurat',    desc: 'Nilai dihitung otomatis, transparan, dan bisa diverifikasi.',           delay: 'reveal-delay-3' },
                  { title: 'Pantau Perkembangan',        desc: 'Guru dan siswa dapat melihat rekap nilai setiap saat.',                 delay: 'reveal-delay-4' },
                  { title: 'Platform Aman & Terpercaya', desc: 'Data tersimpan aman, akses hanya dengan akun terdaftar.',              delay: 'reveal-delay-5' },
                ] as { title: string; desc: string; delay: string }[])
                  .map((item) => (
                    <div key={item.title} className={`reveal ${item.delay} flex items-start gap-3`}>
                      <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="text-slate-500 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────── */}
      <section ref={testimonialRef} className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 reveal">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Apa Kata Mereka?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {([
              { quote: 'Tryout di Triton sangat membantu persiapan UTBK saya!',              name: 'Ni Kadek Ayu',          role: 'Siswa Kelas 12 IPA', delay: '' },
              { quote: 'Fitur soal matematikanya luar biasa, bisa input rumus langsung!',     name: 'I Made Wirawan, S.Pd.', role: 'Guru Matematika',    delay: 'reveal-delay-2' },
              { quote: 'Nilai saya naik dari 65 ke 87 setelah rutin tryout di sini.',         name: 'I Putu Eka',            role: 'Siswa Kelas 11 IPS', delay: 'reveal-delay-4' },
            ] as { quote: string; name: string; role: string; delay: string }[])
              .map((t) => (
                <div key={t.name}
                  className={`reveal ${t.delay} bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="flex gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="italic text-slate-700 leading-relaxed mb-6">"{t.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                      <p className="text-xs text-slate-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-700 to-blue-900 py-24 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full border border-white/10" />
        <div className="absolute bottom-0 left-16 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute right-0 bottom-0 w-44 opacity-10 hidden lg:block" style={{ filter: 'grayscale(100%)' }}>
          <EinsteinSVG className="w-full" />
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6">
          <h2 className="text-white font-extrabold text-4xl leading-tight">
            Siap Memulai Perjalanan Belajarmu?
          </h2>
          <p className="text-blue-200 text-lg mt-4 max-w-xl mx-auto">
            Bergabung dengan ribuan siswa Triton Denpasar yang sudah membuktikan.
          </p>
          <p className="text-blue-300 italic text-sm mt-3">
            "Education is not the learning of facts, but the training of the mind." — Albert Einstein
          </p>
          <Link href="/login"
            className="bg-red-500 hover:bg-red-400 text-white font-bold rounded-full px-10 py-4 text-lg mt-10 inline-block shadow-xl hover:scale-105 transition-all duration-200">
            Mulai Sekarang — Gratis!
          </Link>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer id="kontak" ref={footerRef} className="bg-slate-900 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

            {/* Brand */}
            <div className="reveal">
              <Image src="/logo.png" alt="Triton Denpasar" width={140} height={40}
                className="h-10 w-auto object-contain"
                style={{ filter: 'brightness(0) invert(1)' }} />
              <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                Platform tryout online terpercaya untuk persiapan ujian.
              </p>
              <p className="text-slate-600 italic text-xs mt-3">"Stay curious." — Einstein</p>
            </div>

            {/* Platform */}
            <div className="reveal reveal-delay-1">
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                {navLinks.map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`}
                      className="text-slate-400 text-sm hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pengguna */}
            <div className="reveal reveal-delay-2">
              <h4 className="text-white font-semibold mb-4">Pengguna</h4>
              <ul className="space-y-2">
                {['Untuk Siswa', 'Untuk Guru', 'Untuk Admin'].map((item) => (
                  <li key={item}>
                    <a href="/login" className="text-slate-400 text-sm hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Kontak */}
            <div className="reveal reveal-delay-3">
              <h4 className="text-white font-semibold mb-4">Kontak</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-slate-400 text-sm">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                  Jl. Raya Kuta No. 88, Denpasar, Bali
                </li>
                <li className="flex items-center gap-2 text-slate-400 text-sm">
                  <Mail className="w-4 h-4 shrink-0 text-blue-400" />
                  info@tritondenpasar.id
                </li>
                <li className="flex items-center gap-2 text-slate-400 text-sm">
                  <Phone className="w-4 h-4 shrink-0 text-blue-400" />
                  (0361) 888-9999
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-600 text-sm">© 2024 Triton Denpasar · Dibuat dengan ❤ di Bali</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
