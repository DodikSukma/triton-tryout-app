'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Star } from 'lucide-react'
import Reveal from '@/components/ui/Reveal'
import SectionLabel from '@/components/ui/SectionLabel'

type Period = 'bulanan' | 'semester'

const PLANS = [
  {
    name: 'Starter',
    price: 350000,
    features: ['2x pertemuan per minggu', '1 mata pelajaran', 'Akses tryout online', 'Progress report bulanan'],
    popular: false,
  },
  {
    name: 'Popular',
    price: 600000,
    features: [
      '3x pertemuan per minggu',
      '3 mata pelajaran',
      'Akses tryout online unlimited',
      'Progress report mingguan',
      'Konsultasi orang tua',
    ],
    popular: true,
  },
  {
    name: 'Intensif',
    price: 900000,
    features: [
      '5x pertemuan per minggu',
      'Semua mata pelajaran',
      'Akses tryout + analisis mendalam',
      'Progress report harian',
      'Konsultasi prioritas',
      'Garansi kenaikan nilai',
    ],
    popular: false,
  },
]

const cardStagger = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }
const cardVar = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export default function Pricing() {
  const [period, setPeriod] = useState<Period>('bulanan')
  const multiplier = period === 'semester' ? 5 : 1

  return (
    <section id="paket" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionLabel>Paket Belajar</SectionLabel>
          <h2 className="mt-4 text-3xl font-bold text-navy-dark sm:text-4xl">
            Investasi Terbaik untuk Masa Depan
          </h2>
        </Reveal>

        {/* animated period toggle */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-full border border-slate-200 bg-gray-light p-1">
            {(['bulanan', 'semester'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                aria-pressed={period === p}
                className={`relative z-10 rounded-full px-6 py-2 text-sm font-semibold capitalize transition-colors ${
                  period === p ? 'text-white' : 'text-slate-600'
                }`}
              >
                {period === p && (
                  <motion.span
                    layoutId="toggle-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-primary-blue to-blue-600"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {p}
              </button>
            ))}
          </div>
        </div>

        <motion.div
          variants={cardStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid items-stretch gap-7 lg:grid-cols-3"
        >
          {PLANS.map((plan) => {
            const total = plan.price * multiplier
            return (
              <motion.div
                key={plan.name}
                variants={cardVar}
                className={`relative flex flex-col rounded-3xl border-2 bg-white p-7 ${
                  plan.popular
                    ? 'border-primary-blue shadow-2xl shadow-primary-blue/20 lg:-translate-y-4'
                    : 'border-soft-blue shadow-md'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-primary-red to-orange-500 px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
                    <Star size={11} className="fill-white" /> Paling Populer
                  </span>
                )}

                <h3 className="text-lg font-bold text-navy-dark">{plan.name}</h3>

                <div className="mt-3 flex items-end gap-1">
                  <span className="pb-1 text-sm font-semibold text-slate-400">Rp</span>
                  <div className="overflow-hidden">
                    {/* key change remounts → animated number transition on toggle */}
                    <motion.span
                      key={total}
                      initial={{ y: 22, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="inline-block text-4xl font-black tabular-nums text-navy-dark"
                    >
                      {total.toLocaleString('id-ID')}
                    </motion.span>
                  </div>
                  <span className="pb-1 text-sm font-medium text-slate-400">/{period}</span>
                </div>

                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                      <Check size={18} className={`mt-0.5 shrink-0 ${plan.popular ? 'text-primary-blue' : 'text-green-500'}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#kontak"
                  className={`mt-8 rounded-full px-6 py-3 text-center text-sm font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary-blue to-blue-600 text-white shadow-lg shadow-primary-blue/25 hover:from-primary-red hover:to-red-500'
                      : 'border-2 border-primary-blue text-primary-blue hover:bg-soft-blue'
                  }`}
                >
                  Pilih Paket
                </a>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
