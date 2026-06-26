'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, GraduationCap, TrendingUp, CheckCircle2 } from 'lucide-react'

const HEADLINE = 'Wujudkan Prestasi Terbaik Anak Anda Bersama Triton'
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const wordContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.12 } },
}
const wordVar = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

const TRUST = ['1000+ Siswa Alumni', '15+ Tahun Pengalaman', '98% Lulus PTN']

export default function Hero() {
  return (
    <section id="beranda" className="relative overflow-hidden bg-gradient-to-b from-white to-soft-blue">
      {/* subtle blue grid pattern, faded toward the bottom */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(#E0E2FF 1px, transparent 1px), linear-gradient(90deg, #E0E2FF 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 35%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 35%, transparent 100%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-5">
          {/* ── LEFT (60%) ── */}
          <div className="lg:col-span-3">
            {/* badge pill — gradient border + shimmer text */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-block rounded-full bg-gradient-to-r from-primary-red to-orange-500 p-[1.5px] shadow-sm"
            >
              <div className="flex items-center gap-2 rounded-full bg-white px-4 py-1.5">
                <i className="fas fa-trophy text-xs text-primary-red" aria-hidden />
                <span className="animate-shimmer bg-[linear-gradient(90deg,#FF0303,#F97316,#FF0303)] bg-[length:200%_auto] bg-clip-text text-xs font-bold uppercase tracking-wide text-transparent">
                  #1 Bimbel Terpercaya di Bali
                </span>
              </div>
            </motion.div>

            {/* headline — staggered word-by-word */}
            <motion.h1
              variants={wordContainer}
              initial="hidden"
              animate="visible"
              className="mt-6 text-4xl font-black leading-[1.1] tracking-tight text-navy-dark sm:text-5xl lg:text-6xl"
            >
              {HEADLINE.split(' ').map((word, i) => (
                <motion.span key={`${word}-${i}`} variants={wordVar} className="mr-[0.25em] inline-block">
                  {word === 'Triton' ? (
                    <span className="bg-gradient-to-r from-primary-blue to-blue-700 bg-clip-text text-transparent">{word}</span>
                  ) : (
                    word
                  )}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
              className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600"
            >
              Bimbingan belajar SD, SMP, SMA terpercaya di Denpasar dengan metode terbukti
              dan rekam jejak alumni yang membanggakan.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6, ease: EASE }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <a
                href="#kontak"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-blue to-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-blue/25 transition-all hover:scale-105 hover:from-primary-red hover:to-red-500 hover:shadow-primary-red/25"
              >
                Daftar Sekarang
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#program"
                className="group inline-flex items-center gap-2 rounded-full border-2 border-primary-blue px-7 py-3.5 text-base font-semibold text-primary-blue transition-colors hover:bg-soft-blue"
              >
                Lihat Program
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7, ease: EASE }}
              className="mt-8 flex flex-wrap gap-x-6 gap-y-3"
            >
              {TRUST.map((t) => (
                <div key={t} className="inline-flex items-center gap-2 text-sm font-medium text-slate-600">
                  <CheckCircle2 size={16} className="shrink-0 text-green-500" />
                  {t}
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT (40%) ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            className="relative lg:col-span-2"
          >
            {/* blurred gradient circles behind illustration */}
            <div className="absolute -left-10 top-6 h-56 w-56 rounded-full bg-primary-blue/15 blur-3xl" />
            <div className="absolute -right-8 bottom-2 h-52 w-52 rounded-full bg-primary-red/10 blur-3xl" />

            <div className="relative">
              <Image
                src="/hero.png"
                alt="Ilustrasi siswa Triton Denpasar yang berprestasi"
                width={600}
                height={400}
                priority
                className="w-full rounded-3xl shadow-2xl shadow-primary-blue/20"
              />

              {/* floating card — top right */}
              <div className="absolute -right-3 top-6 sm:-right-5">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex items-center gap-2.5 rounded-2xl border border-soft-blue bg-white/95 px-4 py-3 shadow-xl backdrop-blur"
                  >
                    <GraduationCap size={22} className="text-primary-blue" />
                    <div>
                      <p className="text-[11px] text-slate-500">Alumni Diterima</p>
                      <p className="text-sm font-bold text-navy-dark">UI · UGM · ITB</p>
                    </div>
                  </motion.div>
                </motion.div>
              </div>

              {/* floating card — bottom left */}
              <div className="absolute -left-3 bottom-8 sm:-left-5">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.85, duration: 0.5 }}
                >
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex items-center gap-2.5 rounded-2xl border border-soft-red bg-white/95 px-4 py-3 shadow-xl backdrop-blur"
                  >
                    <TrendingUp size={22} className="text-primary-red" />
                    <div>
                      <p className="text-[11px] text-slate-500">Nilai rata-rata naik</p>
                      <p className="text-sm font-bold text-navy-dark">+25 poin</p>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
