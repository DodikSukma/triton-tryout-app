'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight, Star } from 'lucide-react'

export type ProgramAccent = 'sky' | 'navy' | 'redorange'

export interface ProgramData {
  /** FontAwesome class, e.g. "fas fa-graduation-cap". */
  icon: string
  title: string
  grades: string
  description: string
  subjects: string[]
  image: string
  accent: ProgramAccent
  popular?: boolean
  href?: string
}

const accentMap: Record<ProgramAccent, {
  iconBg: string; iconColor: string; chip: string; border: string; glow: string; cta: string; bar: string
}> = {
  sky: {
    iconBg: 'bg-soft-blue',
    iconColor: 'text-primary-blue',
    chip: 'bg-soft-blue text-primary-blue',
    border: 'hover:border-primary-blue/40',
    glow: 'hover:shadow-primary-blue/20',
    cta: 'text-primary-blue',
    bar: 'from-primary-blue to-blue-600',
  },
  navy: {
    iconBg: 'bg-[#E0E2FF]',
    iconColor: 'text-navy-dark',
    chip: 'bg-soft-blue text-navy-dark',
    border: 'hover:border-navy-dark/40',
    glow: 'hover:shadow-navy-dark/20',
    cta: 'text-navy-dark',
    bar: 'from-navy-dark to-[#0b1450]',
  },
  redorange: {
    iconBg: 'bg-soft-red',
    iconColor: 'text-primary-red',
    chip: 'bg-soft-red text-primary-red',
    border: 'hover:border-primary-red/40',
    glow: 'hover:shadow-primary-red/20',
    cta: 'text-primary-red',
    bar: 'from-primary-red to-red-600',
  },
}

// Entrance is driven by the parent grid's stagger container.
const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
}

export default function ProgramCard({ program }: { program: ProgramData }) {
  const a = accentMap[program.accent]

  return (
    <motion.div
      variants={cardVariants}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border-2 border-soft-blue bg-white transition-all duration-300 hover:shadow-2xl ${a.border} ${a.glow} ${
        program.popular ? 'shadow-xl ring-2 ring-navy-dark/10 lg:-translate-y-4' : 'shadow-md'
      }`}
    >
      <div className={`h-1.5 w-full bg-gradient-to-r ${a.bar}`} />

      {program.popular && (
        <span className="absolute right-4 top-5 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary-red to-orange-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md">
          <Star size={11} className="fill-white" /> Most Popular
        </span>
      )}

      <div className="p-7">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${a.iconBg}`}>
            <i className={`${program.icon} text-2xl ${a.iconColor}`} aria-hidden />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy-dark">{program.title}</h3>
            <p className="text-sm font-medium text-slate-500">{program.grades}</p>
          </div>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-2xl bg-soft-blue">
          <Image
            src={program.image}
            alt={`Ilustrasi ${program.title}`}
            width={300}
            height={180}
            className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <p className="mt-5 text-[15px] leading-relaxed text-slate-600">{program.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          {program.subjects.map((s) => (
            <span key={s} className={`rounded-full px-3 py-1 text-xs font-medium ${a.chip}`}>
              {s}
            </span>
          ))}
        </div>
      </div>

      <a
        href={program.href ?? '#paket'}
        className={`mt-auto inline-flex items-center gap-1.5 px-7 pb-7 pt-2 text-sm font-bold ${a.cta}`}
        aria-label={`Pelajari ${program.title}`}
      >
        Pelajari
        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1.5" />
      </a>
    </motion.div>
  )
}
