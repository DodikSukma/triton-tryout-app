'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface AnimatedCounterProps {
  /** Target number to count up to. */
  value: number
  prefix?: string
  suffix?: string
  /** Count-up duration in ms. */
  duration?: number
  className?: string
  /** Optional custom formatter (overrides the default id-ID grouping). */
  format?: (n: number) => string
}

/**
 * Counts up from 0 to `value` once, the first time it scrolls into view.
 */
export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1800,
  className = '',
  format,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3) // easeOutCubic
      setCount(Math.round(eased * value))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setCount(value)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, value, duration])

  const display = format ? format(count) : count.toLocaleString('id-ID')

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  )
}
