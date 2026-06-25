'use client'

import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle } from 'lucide-react'

const WA_LINK = 'https://wa.me/6281234567890'

const fade = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

export default function CTABanner() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-28">
      {/* slow looping gradient base */}
      <div className="absolute inset-0 animate-gradient-shift bg-[linear-gradient(120deg,#050A30,#0a1147,#1E3A5F,#050A30)] bg-[length:200%_200%]" />

      {/* floating shapes */}
      <motion.div
        animate={{ y: [0, -25, 0], x: [0, 12, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-10 top-10 h-24 w-24 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm"
      />
      <motion.div
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-16 top-20 h-16 w-16 rounded-full border border-sky-400/20 bg-sky-400/10"
      />
      <motion.div
        animate={{ y: [0, -18, 0], x: [0, -10, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 right-1/4 h-20 w-20 rounded-2xl border border-primary-red/25 bg-primary-red/10"
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        transition={{ staggerChildren: 0.1 }}
        className="relative mx-auto max-w-3xl px-4 text-center sm:px-6"
      >
        <motion.h2
          variants={fade}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-3xl font-black text-white sm:text-4xl lg:text-5xl"
        >
          Siap Wujudkan Prestasi Terbaik?
        </motion.h2>
        <motion.p
          variants={fade}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg"
        >
          Bergabunglah dengan 1000+ siswa yang telah membuktikan bahwa Triton adalah pilihan
          terbaik untuk masa depan mereka.
        </motion.p>
        <motion.div
          variants={fade}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="#kontak"
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary-blue to-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-blue/30 transition-all hover:scale-105 hover:from-primary-red hover:to-red-500"
          >
            Daftar Sekarang — Gratis!
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-green-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-green-900/30 transition-all hover:scale-105 hover:bg-green-600"
          >
            <MessageCircle size={18} /> Hubungi Kami via WhatsApp
          </a>
        </motion.div>
      </motion.div>
    </section>
  )
}
