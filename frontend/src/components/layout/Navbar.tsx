'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Tentang', href: '/#tentang' },
  { label: 'Kontak', href: '/#kontak' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${scrolled ? 'bg-white/80 backdrop-blur-md border-slate-200/50 shadow-sm py-2' : 'bg-transparent border-transparent py-4'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="relative z-10 transition-transform hover:scale-105">
            <div className="w-36 h-12 relative">
              <Image src="/logo.png" alt="Triton Denpasar" fill className="object-contain" priority />
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-slate-600 font-semibold hover:text-triton-blue-600 transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-triton-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
            <Link
              href="/login"
              className="px-6 py-2.5 bg-slate-900 hover:bg-triton-blue-600 text-white font-bold rounded-full transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Masuk
            </Link>
          </div>

          <button
            className="md:hidden p-2 text-slate-700 bg-white/50 rounded-full backdrop-blur-sm border border-slate-200/50"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xl px-4 py-6 flex flex-col gap-4 animate-fade-in-down">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-slate-700 font-bold hover:text-triton-blue-600 text-lg py-2 border-b border-slate-100"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="mt-4 px-5 py-3.5 bg-gradient-to-r from-triton-blue-600 to-triton-blue-500 text-white font-bold rounded-xl text-center transition-all shadow-glow"
            onClick={() => setOpen(false)}
          >
            Masuk ke Akun
          </Link>
        </div>
      )}
    </nav>
  )
}
