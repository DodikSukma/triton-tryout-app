'use client'

import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Award, Target } from 'lucide-react'
import Marquee from '@/components/ui/Marquee'
import Reveal from '@/components/ui/Reveal'
import SectionLabel from '@/components/ui/SectionLabel'
import AlumniCard, { type AlumniData } from '@/components/ui/AlumniCard'

const UNIVERSITIES = ['UI', 'UGM', 'ITB', 'UNUD', 'UNDIP', 'ITS', 'IPB', 'UNAIR', 'UB', 'UNHAS']

const ACHIEVEMENTS = [
  { icon: Trophy, number: '500+', desc: 'Alumni diterima PTN Top 10 Indonesia (2020–2024)' },
  { icon: TrendingUp, number: '+25', desc: 'Rata-rata kenaikan nilai siswa dalam 3 bulan' },
  { icon: Award, number: 'Top 3', desc: 'Bimbel Terbaik di Bali versi survei orang tua 2023' },
  { icon: Target, number: '98%', desc: 'Siswa kelas 12 lulus UTBK di atas passing grade' },
]

const ALUMNI: AlumniData[] = [
  {
    name: 'I Kadek Arya Wibawa',
    acceptedTo: 'Teknik Informatika — ITB 2023',
    quote: 'Metode belajar Triton bikin saya paham konsep, bukan sekadar menghafal. Itu yang mengantarkan saya lolos.',
    image: '/alumni-1.png',
  },
  {
    name: 'Ni Putu Gita Cahyani',
    acceptedTo: 'Kedokteran — UNUD 2024',
    quote: 'Tryout rutin dan bimbingan intensif menjelang UTBK benar-benar mengubah hasil belajar saya.',
    image: '/alumni-2.png',
  },
  {
    name: 'I Gede Bagus Mahendra',
    acceptedTo: 'Manajemen — UGM 2023',
    quote: 'Pengajarnya selalu memotivasi. Triton bukan cuma bimbel, tapi rumah kedua untuk belajar.',
    image: '/alumni-3.png',
  },
]

const flipContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }
const flipCard = {
  hidden: { opacity: 0, rotateY: -90 },
  visible: { opacity: 1, rotateY: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}
const riseContainer = { hidden: {}, visible: { transition: { staggerChildren: 0.15 } } }

export default function Alumni() {
  return (
    <section id="prestasi" className="relative overflow-hidden bg-navy-dark py-20 lg:py-28">
      {/* blue→red gradient accent lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary-red/60 to-transparent" />
      {/* ambient glows */}
      <div className="pointer-events-none absolute -left-20 top-20 h-72 w-72 rounded-full bg-primary-blue/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-primary-red/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionLabel light>Prestasi Alumni</SectionLabel>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            Alumni Triton Diterima di Universitas Terbaik
          </h2>
          <p className="mt-4 text-slate-400">
            Ribuan siswa kami telah membuktikan — Triton bukan sekadar bimbel, ini investasi masa depan.
          </p>
        </Reveal>

        {/* university logo strip — infinite marquee */}
        <div className="relative mt-12 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <Marquee speed={50}>
            {UNIVERSITIES.map((u) => (
              <span
                key={u}
                className="mr-4 inline-flex items-center rounded-full border border-white/10 bg-white px-6 py-2.5 text-sm font-bold text-navy-dark shadow-sm"
              >
                {u}
              </span>
            ))}
          </Marquee>
        </div>

        {/* achievement cards 2×2 — flip in */}
        <motion.div
          variants={flipContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          style={{ perspective: 1000 }}
        >
          {ACHIEVEMENTS.map((a) => (
            <motion.div
              key={a.desc}
              variants={flipCard}
              style={{ transformStyle: 'preserve-3d' }}
              className="rounded-2xl bg-white p-6 shadow-lg"
            >
              <a.icon className="text-primary-blue" size={28} />
              <p className="mt-3 bg-gradient-to-r from-primary-blue to-blue-700 bg-clip-text text-3xl font-black text-transparent">
                {a.number}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{a.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* featured alumni spotlight */}
        <motion.div
          variants={riseContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid gap-6 md:grid-cols-3"
        >
          {ALUMNI.map((a) => (
            <AlumniCard key={a.name} alumni={a} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
