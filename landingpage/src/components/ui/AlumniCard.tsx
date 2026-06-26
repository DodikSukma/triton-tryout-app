'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { GraduationCap, Quote } from 'lucide-react'

export interface AlumniData {
  name: string
  acceptedTo: string
  quote: string
  image: string
}

// Slides up into place; entrance is orchestrated by the parent stagger container.
const variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
}

export default function AlumniCard({ alumni }: { alumni: AlumniData }) {
  return (
    <motion.div
      variants={variants}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="relative flex flex-col items-center rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center backdrop-blur-sm transition-shadow hover:shadow-2xl hover:shadow-sky-500/10"
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-blue to-primary-red opacity-60 blur-md" />
        <Image
          src={alumni.image}
          alt={`Foto alumni ${alumni.name}`}
          width={96}
          height={96}
          className="relative h-24 w-24 rounded-full border-2 border-white/20 object-cover"
        />
      </div>

      <h4 className="mt-4 text-lg font-bold text-white">{alumni.name}</h4>
      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300">
        <GraduationCap size={14} />
        {alumni.acceptedTo}
      </div>

      <Quote size={26} className="mt-4 text-white/15" />
      <p className="mt-1 text-sm italic leading-relaxed text-slate-300">&ldquo;{alumni.quote}&rdquo;</p>
    </motion.div>
  )
}
