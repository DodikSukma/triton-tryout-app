'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Entrance delay in seconds (use for manual staggering). */
  delay?: number
  /** Vertical offset to slide up from, in px. */
  y?: number
  /** Animation duration in seconds. */
  duration?: number
}

/**
 * Scroll-triggered fade + slide-up wrapper. Animates once when the element
 * enters the viewport, triggering slightly before it is fully visible
 * (margin: -100px) per the global animation spec.
 */
export default function Reveal({ children, className, delay = 0, y = 24, duration = 0.6 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
