'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  FileText, Calculator, CheckCircle2, Timer, BarChart2, Users,
  GraduationCap, Trophy, MapPin, Mail, Phone, Star,
} from 'lucide-react'


// ─── StatCounter ──────────────────────────────────────────────────────────────

function StatCounter({
  value,
  suffix,
  label,
  format,
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
  const featuresRef = useRef<HTMLElement>(null)
  const howItWorksRef = useRef<HTMLElement>(null)
  const trustRef = useRef<HTMLElement>(null)
  const testimonialRef = useRef<HTMLElement>(null)
  const footerRef = useRef<HTMLElement>(null)

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
          <Image
            src="/logo.png"
            alt="Triton Denpasar"
            width={140}
            height={48}
            className="h-12 w-auto object-contain"
            priority
          />
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
          <Link
            href="/login"
            className="bg-red-500 hover:bg-red-600 text-white rounded-full px-5 py-2 text-sm font-semibold hover:shadow-md transition-all"
          >
            Masuk
          </Link>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section
        id="beranda"
        className="relative overflow-hidden py-20 md:py-32"
        style={{ background: 'linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 25%, #ffffff 65%)' }}
      >
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(59,130,246,0.10) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Soft glow blobs */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-100/40 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-blue-50/60 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ── Left: Text ── */}
            <div>
              <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-4 py-2">
                ⭐ Platform Tryout Online #1 di Bali
              </div>

              <h1
                className="animate-fade-in-up mt-6 text-6xl md:text-7xl font-black tracking-tight leading-[1.1] text-slate-900"
                style={{ animationDelay: '0.10s' }}
              >
                Belajar Lebih Cerdas,
                <br />
                Raih Hasil{' '}
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Terbaik
                </span>
              </h1>

              <blockquote
                className="animate-fade-in-up mt-6 border-l-4 border-blue-500 pl-4"
                style={{ animationDelay: '0.20s' }}
              >
                <p className="italic text-slate-500 text-base leading-relaxed">
                  &ldquo;Imagination is more important than knowledge.&rdquo;
                </p>
                <footer className="text-xs text-slate-400 font-semibold mt-1">— Albert Einstein</footer>
              </blockquote>

              <p
                className="animate-fade-in-up mt-5 text-slate-500 text-lg leading-relaxed max-w-lg"
                style={{ animationDelay: '0.25s' }}
              >
                Platform latihan soal CBT terlengkap untuk siswa bimbel Triton Denpasar.
                Soal pilihan ganda, essay, dan matematika — nilai otomatis, instan.
              </p>

              <div
                className="animate-fade-in-up mt-8 flex gap-4 flex-wrap"
                style={{ animationDelay: '0.30s' }}
              >
                <Link
                  href="/login"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-full px-8 py-4 text-base shadow-lg shadow-blue-200/60 hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  Mulai Sekarang →
                </Link>
                <a
                  href="#fitur"
                  className="border-2 border-blue-500 text-blue-600 font-semibold rounded-full px-8 py-4 text-base hover:bg-blue-50 transition-all duration-200"
                >
                  Pelajari Fitur
                </a>
              </div>

              <div
                className="animate-fade-in-up mt-8 flex gap-6 flex-wrap"
                style={{ animationDelay: '0.40s' }}
              >
                {['1.000+ Siswa Terdaftar', '500+ Soal Tersedia', 'Nilai Instan'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-500">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Einstein photo asset ── */}
            <div
              className="animate-fade-in-up flex justify-center items-end"
              style={{ animationDelay: '0.15s' }}
            >
              <div className="relative w-full max-w-md mx-auto">
                {/* Ambient glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-blue-200/30 blur-3xl" />

                {/* Floating math symbols */}
                <span className="hidden lg:block absolute top-6 right-6 text-blue-400 font-mono text-sm rotate-12 animate-float z-10" style={{ animationDelay: '0s' }}>E=mc²</span>
                <span className="hidden lg:block absolute top-12 left-0 text-blue-300 text-2xl -rotate-6 animate-float z-10" style={{ animationDelay: '0.5s' }}>∑</span>
                <span className="hidden lg:block absolute bottom-20 right-2 text-blue-200 text-3xl animate-float z-10" style={{ animationDelay: '1s' }}>π</span>
                <span className="hidden lg:block absolute left-2 top-1/2 text-blue-200 text-2xl rotate-6 animate-float z-10" style={{ animationDelay: '1.5s' }}>∫</span>
                <span className="hidden lg:block absolute bottom-28 left-8 text-blue-300 text-lg -rotate-12 animate-float z-10" style={{ animationDelay: '2s' }}>√x</span>

                {/* Speech bubble */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap">
                  <div className="bg-white border border-blue-200 rounded-2xl rounded-bl-none px-4 py-2 shadow-md">
                    <p className="text-sm font-semibold text-slate-700">Ayo, kita belajar bersama! 🎓</p>
                  </div>
                </div>

                {/* Einstein image — primary asset */}
                <div className="relative z-10 pt-10">
                  <Image
                    src="/landing-page-picture-albert-enstein.png"
                    alt="Albert Einstein — Triton Denpasar Platform Tryout"
                    width={480}
                    height={480}
                    className="w-full h-auto object-contain drop-shadow-xl"
                    priority
                  />
                </div>

                {/* Floating score badge */}
                <div className="absolute -bottom-2 -left-4 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 flex items-center gap-3 z-20">
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
            {(
              [
                { value: 500, suffix: '+', label: 'Soal Tersedia', fmt: undefined },
                { value: 50, suffix: '+', label: 'Tryout Aktif', fmt: undefined },
                {
                  value: 1000, suffix: '+', label: 'Siswa Terdaftar',
                  fmt: (n: number) =>
                    n >= 1000
                      ? `${Math.floor(n / 1000)}.${String(n % 1000).padStart(3, '0')}`
                      : String(n),
                },
                { value: 98, suffix: '%', label: 'Kepuasan Siswa', fmt: undefined },
              ] as { value: number; suffix: string; label: string; fmt: ((n: number) => string) | undefined }[]
            ).map((stat, idx) => (
              <div
                key={stat.label}
                className={`py-4 md:py-0 ${idx < 3 ? 'md:border-r md:border-blue-500/40' : ''}`}
              >
                <StatCounter
                  value={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                  format={stat.fmt}
                />
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
            &ldquo;The only source of knowledge is experience.&rdquo; — Albert Einstein
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(
              [
                { icon: <FileText className="w-6 h-6 text-blue-500" />, bg: 'bg-blue-50', title: 'Soal Beragam', desc: 'PG, essay, gambar, persamaan matematika — semua format tersedia.', delay: '' },
                { icon: <Calculator className="w-6 h-6 text-violet-500" />, bg: 'bg-violet-50', title: 'Persamaan Matematika', desc: 'LaTeX rendered otomatis, tampil jelas di semua perangkat.', delay: 'reveal-delay-1' },
                { icon: <CheckCircle2 className="w-6 h-6 text-green-500" />, bg: 'bg-green-50', title: 'Nilai Otomatis', desc: 'Dihitung instan setelah selesai, transparan dan akurat.', delay: 'reveal-delay-2' },
                { icon: <Timer className="w-6 h-6 text-red-500" />, bg: 'bg-red-50', title: 'Timer Real-time', desc: 'Auto-submit saat waktu habis, sesuai kondisi ujian nyata.', delay: 'reveal-delay-3' },
                { icon: <BarChart2 className="w-6 h-6 text-orange-500" />, bg: 'bg-orange-50', title: 'Rekap Nilai', desc: 'Guru pantau semua hasil siswa dengan detail dan statistik lengkap.', delay: 'reveal-delay-4' },
                { icon: <Users className="w-6 h-6 text-teal-500" />, bg: 'bg-teal-50', title: 'Multi Role', desc: 'Admin, guru, siswa — dalam satu platform terintegrasi.', delay: 'reveal-delay-5' },
              ] as { icon: React.ReactNode; bg: string; title: string; desc: string; delay: string }[]
            ).map((card) => (
              <div
                key={card.title}
                className={`reveal ${card.delay} bg-white border border-slate-100 rounded-2xl p-7 hover:border-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}
              >
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
            <div className="hidden md:block absolute top-8 left-[15%] right-[15%] border-t-2 border-dashed border-blue-200 z-0" />
            {(
              [
                { num: '1', title: 'Daftar & Masuk', desc: 'Admin buat akun guru dan siswa dengan mudah.', color: 'from-blue-500 to-blue-700', delay: '' },
                { num: '2', title: 'Pilih Tryout', desc: 'Siswa pilih tryout sesuai mata pelajaran.', color: 'from-red-500 to-red-700', delay: 'reveal-delay-1' },
                { num: '3', title: 'Kerjakan Soal', desc: 'Jawab dalam batas waktu yang ditentukan.', color: 'from-blue-500 to-blue-700', delay: 'reveal-delay-2' },
                { num: '4', title: 'Lihat Hasil', desc: 'Nilai muncul instan, rekap tersedia untuk semua.', color: 'from-red-500 to-red-700', delay: 'reveal-delay-3' },
              ] as { num: string; title: string; desc: string; color: string; delay: string }[]
            ).map((step) => (
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

      {/* ── TRUST SECTION ──────────────────────────────────────────── */}
      <section ref={trustRef} className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: Einstein teaching */}
            <div className="flex justify-center reveal">
              <div className="relative w-72 h-80">
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-blue-50" />
                <Image
                  src="/teachercool.gif"
                  alt="Teacher Triton Denpasar"
                  fill
                  unoptimized
                  className="object-contain"
                />
                <div className="absolute -top-4 -right-6 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 flex items-center gap-3 z-10">
                  <GraduationCap className="w-8 h-8 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">Guru Berpengalaman</p>
                    <p className="text-xs text-slate-400">Triton Denpasar</p>
                  </div>
                </div>
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
                <p className="italic text-slate-500">&ldquo;Genius is 1% talent and 99% hard work.&rdquo;</p>
                <footer className="text-xs text-slate-400 font-semibold mt-1">— Albert Einstein</footer>
              </blockquote>
              <div className="mt-8 space-y-4">
                {(
                  [
                    { title: 'Soal Berkualitas Tinggi', desc: 'Dibuat oleh guru berpengalaman sesuai kurikulum terbaru.', delay: 'reveal-delay-2' },
                    { title: 'Sistem Penilaian Akurat', desc: 'Nilai dihitung otomatis, transparan, dan bisa diverifikasi.', delay: 'reveal-delay-3' },
                    { title: 'Pantau Perkembangan', desc: 'Guru dan siswa dapat melihat rekap nilai setiap saat.', delay: 'reveal-delay-4' },
                    { title: 'Platform Aman & Terpercaya', desc: 'Data tersimpan aman, akses hanya dengan akun terdaftar.', delay: 'reveal-delay-5' },
                  ] as { title: string; desc: string; delay: string }[]
                ).map((item) => (
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
            {(
              [
                { quote: 'Tryout di Triton sangat membantu persiapan UTBK saya!', name: 'Ni Kadek Ayu', role: 'Siswa Kelas 12 IPA', delay: '' },
                { quote: 'Fitur soal matematikanya luar biasa, bisa input rumus langsung!', name: 'I Made Wirawan, S.Pd.', role: 'Guru Matematika', delay: 'reveal-delay-2' },
                { quote: 'Nilai saya naik dari 65 ke 87 setelah rutin tryout di sini.', name: 'I Putu Eka', role: 'Siswa Kelas 11 IPS', delay: 'reveal-delay-4' },
              ] as { quote: string; name: string; role: string; delay: string }[]
            ).map((t) => (
              <div
                key={t.name}
                className={`reveal ${t.delay} bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="italic text-slate-700 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />
        <div className="relative z-10 text-center px-4 sm:px-6">
          <h2 className="text-white font-extrabold text-4xl leading-tight">
            Siap Memulai Perjalanan Belajarmu?
          </h2>
          <p className="text-blue-200 text-lg mt-4 max-w-xl mx-auto">
            Bergabung dengan ribuan siswa Triton Denpasar yang sudah membuktikan.
          </p>
          <p className="text-blue-300 italic text-sm mt-3">
            &ldquo;Education is not the learning of facts, but the training of the mind.&rdquo; — Albert Einstein
          </p>
          <Link
            href="/login"
            className="bg-red-500 hover:bg-red-400 text-white font-bold rounded-full px-10 py-4 text-lg mt-10 inline-block shadow-xl hover:scale-105 transition-all duration-200"
          >
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
              <Image
                src="/logo.png"
                alt="Triton Denpasar"
                width={140}
                height={48}
                className="h-10 w-auto object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <p className="text-slate-400 text-sm mt-4 leading-relaxed">
                Platform tryout online terpercaya untuk persiapan ujian.
              </p>
              <p className="text-slate-600 italic text-xs mt-3">&ldquo;Stay curious.&rdquo; — Einstein</p>
            </div>

            {/* Platform */}
            <div className="reveal reveal-delay-1">
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                {navLinks.map((item) => (
                  <li key={item}>
                    <a href={`#${item.toLowerCase()}`} className="text-slate-400 text-sm hover:text-white transition-colors">
                      {item}
                    </a>
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
                    <a href="/login" className="text-slate-400 text-sm hover:text-white transition-colors">
                      {item}
                    </a>
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
