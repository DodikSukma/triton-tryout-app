'use client'

import { useEffect, useState } from 'react'
import styles from './TritonLoader.module.css'

interface TritonLoaderProps {
  /** Cover the whole viewport (default) or sit inside a container/card. */
  fullScreen?: boolean
  /**
   * Wait this many ms before showing the loader. Fast loads that finish within
   * the delay never render it — avoiding the ugly half-drawn "red flash".
   * Pass 0 to show immediately (e.g. the landing-page intro).
   */
  delay?: number
}

/**
 * Branded animated Triton "TR" logo loader (red base, blue panels, white
 * strokes, diagonal slash). Styling is isolated via CSS modules and honors
 * `prefers-reduced-motion` (renders the final logo statically).
 */
export default function TritonLoader({ fullScreen = true, delay = 350 }: TritonLoaderProps) {
  const [visible, setVisible] = useState(delay <= 0)

  useEffect(() => {
    if (delay <= 0) return
    const t = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  if (!visible) return null

  return (
    <div
      className={`${styles.container} ${fullScreen ? styles.fullscreen : styles.embed}`}
      role="status"
      aria-live="polite"
    >
      <div className={styles.loaderWrap}>
        <div className={styles.loader}>
          <span className={styles.blueLeft} />
          <span className={styles.whiteStrokeLeft} />
          <span className={styles.blueRight} />
          <span className={styles.whiteStrokeRight} />
          <span className={styles.diagonal} />
        </div>
      </div>
      <span className={styles.srOnly}>Memuat…</span>
    </div>
  )
}
