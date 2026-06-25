'use client'

import Reveal from '@/components/ui/Reveal'
import SectionLabel from '@/components/ui/SectionLabel'
import Marquee from '@/components/ui/Marquee'
import ReviewCard, { type Review } from '@/components/ui/ReviewCard'
import reviewsData from '@/data/reviews.json'

const reviews = reviewsData as Review[]
const mid = Math.ceil(reviews.length / 2)
const rowOne = reviews.slice(0, mid)
const rowTwo = reviews.slice(mid)

export default function Testimonials() {
  return (
    <section id="testimoni" className="overflow-hidden bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <Reveal>
          <SectionLabel>Testimoni</SectionLabel>
          <h2 className="mt-4 text-3xl font-bold text-navy-dark sm:text-4xl">Apa Kata Mereka?</h2>
          <p className="mt-4 text-slate-600">
            Lebih dari 1000 siswa dan orang tua telah mempercayakan pendidikan mereka kepada
            Triton Denpasar.
          </p>
        </Reveal>
      </div>

      {/* Two rows scrolling in opposite directions, edges faded. */}
      <div className="mt-14 space-y-5 [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]">
        <Marquee direction="left" speed={30}>
          {rowOne.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </Marquee>
        <Marquee direction="right" speed={30}>
          {rowTwo.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </Marquee>
      </div>
    </section>
  )
}
