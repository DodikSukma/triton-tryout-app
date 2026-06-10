'use client'

import Reveal from '@/components/ui/Reveal'
import SectionLabel from '@/components/ui/SectionLabel'
import Accordion, { type FaqItem } from '@/components/ui/Accordion'

const FAQS: FaqItem[] = [
  {
    q: 'Apakah ada tes masuk untuk bergabung di Triton?',
    a: 'Tidak ada tes seleksi yang memberatkan. Kami hanya mengadakan asesmen awal gratis untuk memetakan kemampuan dan kebutuhan belajar siswa, sehingga kami dapat menyusun rencana belajar yang paling sesuai sejak hari pertama.',
  },
  {
    q: 'Bagaimana sistem pembayaran dan pendaftaran?',
    a: 'Pendaftaran dapat dilakukan langsung di kantor kami atau melalui WhatsApp. Pembayaran tersedia dalam skema bulanan maupun semester dengan opsi transfer bank dan e-wallet. Anda akan menerima bukti pembayaran dan jadwal belajar segera setelah pendaftaran dikonfirmasi.',
  },
  {
    q: 'Apakah bisa ikut tryout online tanpa daftar kelas?',
    a: 'Bisa. Platform tryout online Triton dapat diakses untuk berlatih soal dan melihat nilai secara instan. Namun, siswa yang terdaftar di kelas bimbel mendapat analisis kesalahan yang lebih mendalam serta pembahasan langsung dari pengajar.',
  },
  {
    q: 'Berapa ukuran kelas bimbel di Triton?',
    a: 'Kami menjaga kelas tetap kecil, maksimal 10–15 siswa per kelas, agar setiap siswa mendapat perhatian yang merata. Tersedia juga opsi kelas privat dan semi-privat bagi yang menginginkan bimbingan lebih intensif.',
  },
  {
    q: 'Apakah ada garansi kenaikan nilai?',
    a: 'Paket Intensif kami dilengkapi garansi kenaikan nilai. Apabila setelah mengikuti program secara penuh dan disiplin nilai siswa belum meningkat, kami memberikan sesi tambahan tanpa biaya hingga target tercapai.',
  },
  {
    q: 'Bagaimana jika siswa tertinggal materi?',
    a: 'Setiap siswa memiliki akses ke rekaman materi dan bank soal online untuk mengejar ketertinggalan. Pengajar juga menyediakan sesi konsultasi tambahan dan remedial agar tidak ada materi penting yang terlewat.',
  },
]

export default function FAQ() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="mt-4 text-3xl font-bold text-navy-dark sm:text-4xl">
            Pertanyaan yang Sering Diajukan
          </h2>
        </Reveal>

        <Reveal className="mt-10">
          <Accordion items={FAQS} />
        </Reveal>
      </div>
    </section>
  )
}
