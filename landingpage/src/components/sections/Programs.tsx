'use client'

import { motion } from 'framer-motion'
import Reveal from '@/components/ui/Reveal'
import SectionLabel from '@/components/ui/SectionLabel'
import ProgramCard, { type ProgramData } from '@/components/ui/ProgramCard'

const PROGRAMS: ProgramData[] = [
  {
    icon: 'fas fa-shapes',
    title: 'Program SD',
    grades: 'Kelas 1–6',
    description: 'Membangun fondasi akademik yang kuat dengan metode belajar menyenangkan dan interaktif.',
    subjects: ['Matematika', 'IPA', 'Bahasa Indonesia', 'Bahasa Inggris'],
    image: '/program-sd.png',
    accent: 'sky',
  },
  {
    icon: 'fas fa-book-open-reader',
    title: 'Program SMP',
    grades: 'Kelas 7–9',
    description: 'Persiapan intensif menghadapi ujian sekolah dan seleksi masuk SMA favorit.',
    subjects: ['Matematika', 'IPA', 'IPS', 'Bahasa Inggris', 'Bahasa Indonesia'],
    image: '/program-smp.png',
    accent: 'navy',
    popular: true,
  },
  {
    icon: 'fas fa-graduation-cap',
    title: 'Program SMA',
    grades: 'Kelas 10–12',
    description: 'Bimbingan intensif persiapan UTBK/SNBT dan ujian sekolah untuk masuk perguruan tinggi impian.',
    subjects: ['Matematika', 'Fisika', 'Kimia', 'Biologi', 'Ekonomi', 'Bahasa Inggris', 'Geografi'],
    image: '/program-sma.png',
    accent: 'redorange',
  },
]

const gridStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

export default function Programs() {
  return (
    <section id="program" className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionLabel>Program Kami</SectionLabel>
          <h2 className="mt-4 text-3xl font-bold text-navy-dark sm:text-4xl">
            Program Belajar untuk Setiap Jenjang
          </h2>
          <p className="mt-4 text-slate-600">
            Kurikulum terstruktur, guru berpengalaman, dan metode belajar yang terbukti
            meningkatkan nilai siswa.
          </p>
        </Reveal>

        <motion.div
          variants={gridStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="mt-14 grid items-stretch gap-7 md:grid-cols-2 lg:grid-cols-3"
        >
          {PROGRAMS.map((p) => (
            <ProgramCard key={p.title} program={p} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
