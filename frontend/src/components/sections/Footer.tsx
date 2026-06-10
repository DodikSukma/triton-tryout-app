import Link from 'next/link'
import Image from 'next/image'
import {
  Instagram, Facebook, Youtube, Music2,
  MapPin, Mail, Phone, MessageCircle, Star, Heart,
} from 'lucide-react'

const WA_LINK = 'https://wa.me/6281234567890'

const PLATFORM_LINKS = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Program', href: '#program' },
  { label: 'Prestasi', href: '#prestasi' },
  { label: 'Testimoni', href: '#testimoni' },
  { label: 'Tryout Online', href: '/login' },
  { label: 'Kontak', href: '#kontak' },
]

const PROGRAM_LINKS = [
  { label: 'Program SD', href: '#program' },
  { label: 'Program SMP', href: '#program' },
  { label: 'Program SMA', href: '#program' },
  { label: 'Tryout Online', href: '/login' },
  { label: 'Jadwal Belajar', href: '#kontak' },
  { label: 'Pendaftaran', href: '#kontak' },
]

const SOCIALS = [
  { Icon: Instagram, label: 'Instagram' },
  { Icon: Facebook, label: 'Facebook' },
  { Icon: Youtube, label: 'YouTube' },
  { Icon: Music2, label: 'TikTok' },
]

export default function Footer() {
  return (
    <footer id="kontak" className="bg-navy-dark pt-16 pb-8 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Image
              src="/logo.png"
              alt="Triton Denpasar"
              width={160}
              height={54}
              className="h-11 w-auto object-contain brightness-0 invert"
            />
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Bimbel terpercaya sejak 2009 — mendampingi siswa SD, SMP, dan SMA di Denpasar
              meraih prestasi terbaiknya.
            </p>
            <div className="mt-5 flex gap-3">
              {SOCIALS.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-colors hover:bg-primary-blue hover:text-white"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
              <Star size={15} className="fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold text-white">4.9 / 5.0</span>
              <span className="text-xs text-slate-400">rating orang tua</span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-white">Platform</h4>
            <ul className="mt-4 space-y-2.5">
              {PLATFORM_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Program */}
          <div>
            <h4 className="font-semibold text-white">Program</h4>
            <ul className="mt-4 space-y-2.5">
              {PROGRAM_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h4 className="font-semibold text-white">Kontak</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-sky-400" />
                Jl. Raya Kuta No. 88, Denpasar, Bali
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="shrink-0 text-sky-400" />
                <a href="mailto:info@tritondenpasar.id" className="transition-colors hover:text-white">
                  info@tritondenpasar.id
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="shrink-0 text-sky-400" />
                <a href="tel:+623618889999" className="transition-colors hover:text-white">
                  (0361) 888-9999
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MessageCircle size={16} className="shrink-0 text-sky-400" />
                <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  wa.me/6281234567890
                </a>
              </li>
              <li className="pt-1 text-xs text-slate-500">Senin–Sabtu, 08.00–20.00 WITA</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="inline-flex items-center gap-1.5 text-sm text-slate-500">
            © 2026 Triton Denpasar · Dibuat dengan
            <Heart size={14} className="fill-primary-red text-primary-red" />
            di Bali
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-slate-500 transition-colors hover:text-white">Privacy Policy</a>
            <a href="#" className="text-sm text-slate-500 transition-colors hover:text-white">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
