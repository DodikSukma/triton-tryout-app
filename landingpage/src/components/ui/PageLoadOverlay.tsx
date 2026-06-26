'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TritonLoader from '@/components/common/TritonLoader'

/**
 * Full-screen branded intro shown on the landing page's first paint. Plays the
 * animated Triton logo long enough for the "TR" mark to assemble, then dissolves.
 */
export default function PageLoadOverlay() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 2400)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999]"
        >
          <TritonLoader fullScreen delay={0} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
