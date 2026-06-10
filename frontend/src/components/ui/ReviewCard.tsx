'use client'

import { Star, GraduationCap } from 'lucide-react'

export interface Review {
  id: number
  name: string
  role: string
  program: string
  avatar_initial: string
  avatar_color: string
  rating: number
  text: string
  university: string | null
  year: string
}

/**
 * A single testimonial card sized for the auto-scrolling marquee.
 * Carries its own right margin (`mr-5`) so the marquee seam stays even.
 */
export default function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="mr-5 flex w-[340px] shrink-0 flex-col rounded-2xl border-l-4 border-primary-blue bg-white p-6 shadow-md ring-1 ring-slate-100">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold text-white"
          style={{ backgroundColor: review.avatar_color }}
          aria-hidden
        >
          {review.avatar_initial}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-navy-dark">{review.name}</p>
          <p className="truncate text-xs text-slate-500">{review.role}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-0.5" aria-label={`Rating ${review.rating} dari 5`}>
        {Array.from({ length: review.rating }).map((_, i) => (
          <Star key={i} size={15} className="fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      <p className="mt-3 flex-1 text-sm italic leading-relaxed text-slate-600">&ldquo;{review.text}&rdquo;</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-soft-blue px-2.5 py-1 text-[11px] font-semibold text-primary-blue">
          {review.program}
        </span>
        {review.university && (
          <span className="inline-flex items-center gap-1 rounded-full bg-soft-red px-2.5 py-1 text-[11px] font-semibold text-primary-red">
            <GraduationCap size={12} />
            {review.university}
          </span>
        )}
      </div>
    </article>
  )
}
