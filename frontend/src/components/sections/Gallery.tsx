'use client'

import Image from 'next/image'
import Reveal from '@/components/ui/Reveal'
import SectionLabel from '@/components/ui/SectionLabel'

// Varied heights produce the masonry rhythm (CSS multi-column layout).
const GALLERY = [
  { src: 'https://placehold.co/600x450/E8EAFF/0309FF/png?text=Gallery+1', caption: 'Kelas Modern', h: 450 },
  { src: 'https://placehold.co/600x650/E8EAFF/0309FF/png?text=Gallery+2', caption: 'Meja Belajar Siswa', h: 650 },
  { src: 'https://placehold.co/600x450/E8EAFF/0309FF/png?text=Gallery+3', caption: 'Guru Mengajar Matematika', h: 450 },
  { src: 'https://placehold.co/600x550/E8EAFF/0309FF/png?text=Gallery+4', caption: 'Perayaan Lulus UTBK', h: 550 },
  { src: 'https://placehold.co/600x430/E8EAFF/0309FF/png?text=Gallery+5', caption: 'Area Belajar Kolaboratif', h: 430 },
  { src: 'https://placehold.co/600x520/E8EAFF/0309FF/png?text=Gallery+6', caption: 'Konsultasi Akademik', h: 520 },
]

export default function Gallery() {
  return (
    <section className="bg-gray-light py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionLabel>Galeri</SectionLabel>
          <h2 className="mt-4 text-3xl font-bold text-navy-dark sm:text-4xl">Suasana Belajar di Triton</h2>
        </Reveal>

        <div className="mt-12 gap-4 sm:columns-2 lg:columns-3">
          {GALLERY.map((g) => (
            <Reveal key={g.caption} className="mb-4 break-inside-avoid">
              <figure className="group relative overflow-hidden rounded-2xl border border-[#E0F2FE] shadow-sm">
                <Image
                  src={g.src}
                  alt={g.caption}
                  width={600}
                  height={g.h}
                  className="w-full transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/85 via-navy-dark/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <figcaption className="absolute bottom-4 left-4 translate-y-2 text-sm font-semibold text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  {g.caption}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
