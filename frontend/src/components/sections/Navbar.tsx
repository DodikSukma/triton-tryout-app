'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, MessageCircle } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Program', href: '#program' },
  { label: 'Prestasi', href: '#prestasi' },
  { label: 'Testimoni', href: '#testimoni' },
  { label: 'Kontak', href: '#kontak' },
]
const SECTION_IDS = NAV_LINKS.map((l) => l.href.slice(1))
const WA_LINK = 'https://wa.me/6281234567890'

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="#beranda" onClick={onClick} className="flex items-center" aria-label="Triton Denpasar — Beranda">
      <Image
        src="/logo.png"
        alt="Triton Denpasar"
        width={140}
        height={48}
        priority
        className="h-9 w-auto object-contain sm:h-10"
      />
    </Link>
  )
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('beranda')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Scroll-spy: drives the animated active underline.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  return (
    <motion.header
      initial={false}
      animate={{
        height: scrolled ? 64 : 80,
        boxShadow: scrolled ? '0 4px 20px -8px rgba(5,10,48,0.18)' : '0 0 0 rgba(0,0,0,0)',
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md"
    >
      <nav className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Center links (desktop) */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = active === link.href.slice(1)
            return (
              <a
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-primary-blue"
              >
                {link.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary-blue"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </a>
            )
          })}
        </div>

        {/* Right CTAs (desktop) */}
        <div className="hidden items-center gap-3 lg:flex">
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-primary-blue hover:text-primary-blue"
          >
            Hubungi Kami
          </a>
          <a
            href="#kontak"
            className="rounded-full bg-gradient-to-r from-primary-blue to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary-blue/20 transition-all hover:from-primary-red hover:to-red-500 hover:shadow-lg hover:shadow-primary-red/25"
          >
            Daftar Sekarang
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-slate-700 lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <Menu size={24} />
        </button>
      </nav>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div
              className="absolute inset-0 bg-navy-dark/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%' }}
              transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-x-0 top-0 rounded-b-3xl bg-white p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <Logo onClick={() => setMobileOpen(false)} />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-2 text-slate-700"
                  aria-label="Tutup menu navigasi"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="mt-6 flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-soft-blue hover:text-primary-blue"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
                >
                  <MessageCircle size={16} /> Hubungi Kami
                </a>
                <a
                  href="#kontak"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full bg-gradient-to-r from-primary-blue to-blue-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-md"
                >
                  Daftar Sekarang
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
