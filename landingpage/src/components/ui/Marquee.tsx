'use client'

import { motion, useAnimationFrame, useMotionValue } from 'framer-motion'
import { useRef, useState, type ReactNode } from 'react'

interface MarqueeProps {
  children: ReactNode
  /** Scroll direction. */
  direction?: 'left' | 'right'
  /** Speed in pixels per second. */
  speed?: number
  /** Pause the animation while hovered. */
  pauseOnHover?: boolean
  className?: string
}

/**
 * Infinite, seamless marquee driven by Framer Motion's animation frame loop.
 * Renders two identical copies of `children` and translates the track, wrapping
 * the offset by one copy's width so the loop never visibly resets.
 *
 * NOTE: each child should carry its own trailing horizontal spacing
 * (e.g. `mr-5`) so the seam between the two copies stays evenly spaced.
 */
export default function Marquee({
  children,
  direction = 'left',
  speed = 40,
  pauseOnHover = true,
  className = '',
}: MarqueeProps) {
  const x = useMotionValue(direction === 'left' ? 0 : -1)
  const trackRef = useRef<HTMLDivElement>(null)
  const halfRef = useRef(0)
  const [paused, setPaused] = useState(false)

  useAnimationFrame((_, delta) => {
    if (paused || !trackRef.current) return
    // One copy is exactly half of the full (duplicated) track width.
    const half = trackRef.current.scrollWidth / 2
    halfRef.current = half
    if (half <= 0) return

    const move = (direction === 'left' ? -1 : 1) * (speed * delta) / 1000
    let next = x.get() + move
    if (next <= -half) next += half
    else if (next >= 0) next -= half
    x.set(next)
  })

  return (
    <div
      className={`overflow-hidden ${className}`}
      onMouseEnter={() => pauseOnHover && setPaused(true)}
      onMouseLeave={() => pauseOnHover && setPaused(false)}
    >
      <motion.div ref={trackRef} style={{ x }} className="flex w-max">
        <div className="flex shrink-0">{children}</div>
        <div className="flex shrink-0" aria-hidden>{children}</div>
      </motion.div>
    </div>
  )
}
