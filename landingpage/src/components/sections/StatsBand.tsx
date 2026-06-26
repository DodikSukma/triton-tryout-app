'use client'

import { motion } from 'framer-motion'
import AnimatedCounter from '@/components/ui/AnimatedCounter'

const STATS = [
  { icon: 'fas fa-trophy', color: 'text-primary-red', value: 1000, suffix: '+', label: 'Alumni Sukses' },
  { icon: 'fas fa-book', color: 'text-primary-blue', value: 15, suffix: '+', label: 'Tahun Pengalaman' },
  { icon: 'fas fa-chalkboard-user', color: 'text-primary-blue', value: 50, suffix: '+', label: 'Pengajar Berpengalaman' },
  { icon: 'fas fa-bullseye', color: 'text-primary-red', value: 98, suffix: '%', label: 'Tingkat Kelulusan PTN' },
]

export default function StatsBand() {
  return (
    <section className="bg-soft-blue py-14">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-y-10 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: i * 0.15 }}
            className={`flex flex-col items-center px-2 text-center ${i < 3 ? 'md:border-r md:border-primary-blue/15' : ''}`}
          >
            <i className={`${s.icon} text-3xl ${s.color}`} aria-hidden />
            <AnimatedCounter
              value={s.value}
              suffix={s.suffix}
              className="mt-3 text-4xl font-black tabular-nums text-navy-dark lg:text-5xl"
            />
            <span className="mt-1 text-sm font-medium text-slate-600">{s.label}</span>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
