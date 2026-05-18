'use client'

import { useEffect, useRef } from 'react'
import katex from 'katex'

interface RenderHTMLProps {
  html: string
  className?: string
}

/**
 * Renders saved rich-text HTML (from contentEditable editor) and re-runs KaTeX
 * on any .katex-equation spans so equations display correctly.
 */
export default function RenderHTML({ html, className = '' }: RenderHTMLProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = html
    ref.current.querySelectorAll<HTMLElement>('.katex-equation').forEach((span) => {
      const latex = span.getAttribute('data-latex')
      const displayMode = span.getAttribute('data-display') === 'true'
      if (!latex) return
      try {
        span.innerHTML = katex.renderToString(latex, { throwOnError: false, displayMode })
      } catch {
        span.textContent = `[${latex}]`
      }
    })
  }, [html])

  return <div ref={ref} className={`question-content ${className}`} />
}
