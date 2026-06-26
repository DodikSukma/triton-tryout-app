'use client'

import Image from 'next/image'
import { CheckCircle2 } from 'lucide-react'
import Reveal from '@/components/ui/Reveal'
import SectionLabel from '@/components/ui/SectionLabel'

const ROWS = [
  {
    title: 'Pengajar Berpengalaman & Terseleksi',
    desc: 'Semua pengajar kami adalah lulusan PTN terbaik dengan pengalaman mengajar minimal 3 tahun dan melewati seleksi yang ketat.',
    points: ['Lulusan PTN Top', 'Terlatih pedagogi', 'Evaluasi rutin'],
    image: 'https://placehold.co/400x300/E8EAFF/0309FF/png?text=Method+1',
    reverse: false,
  },
  {
    title: 'Kurikulum Adaptif & Personal',
    desc: 'Setiap siswa mendapat peta belajar yang disesuaikan dengan kelemahan dan target nilai masing-masing.',
    points: ['Asesmen awal', 'Rencana belajar personal', 'Progress report'],
    image: 'https://placehold.co/400x300/E8EAFF/0309FF/png?text=Method+2',
    reverse: true,
  },
  {
    title: 'Platform Tryout Online Terintegrasi',
    desc: 'Latihan soal CBT online kapan saja dengan 500+ soal, nilai instan, dan analisis kesalahan untuk perbaikan berkelanjutan.',
    points: ['500+ Soal', 'Nilai Otomatis', 'Analisis Mendalam'],
    image: 'https://placehold.co/400x300/E8EAFF/0309FF/png?text=Method+3',
    reverse: false,
  },
]

export default function Method() {
  return (
    <section className="bg-gray-light py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionLabel>Metode Kami</SectionLabel>
          <h2 className="mt-4 text-3xl font-bold text-navy-dark sm:text-4xl">Kenapa Triton Berbeda?</h2>
        </Reveal>

        <div className="mt-16 space-y-16 lg:space-y-24">
          {ROWS.map((row, i) => (
            <Reveal key={row.title}>
              <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
                {/* illustration */}
                <div className={`relative ${row.reverse ? 'lg:order-2' : ''}`}>
                  <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-primary-blue/10 to-primary-red/10 blur-2xl" />
                  <Image
                    src={row.image}
                    alt={`Ilustrasi metode: ${row.title}`}
                    width={400}
                    height={300}
                    className="relative w-full rounded-3xl border border-[#E0F2FE] shadow-lg"
                  />
                  <span className="absolute -top-4 left-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-blue to-blue-700 text-lg font-black text-white shadow-lg">
                    0{i + 1}
                  </span>
                </div>

                {/* copy */}
                <div className={row.reverse ? 'lg:order-1' : ''}>
                  <h3 className="text-2xl font-bold text-navy-dark">{row.title}</h3>
                  <p className="mt-3 leading-relaxed text-slate-600">{row.desc}</p>
                  <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
                    {row.points.map((p) => (
                      <li key={p} className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                        <CheckCircle2 size={16} className="text-primary-blue" /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
