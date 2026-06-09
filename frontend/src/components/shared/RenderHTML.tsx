'use client'

import { useEffect, useRef } from 'react'
import katex from 'katex'
import renderMathInElement from 'katex/contrib/auto-render'

interface RenderHTMLProps {
  html: string
  className?: string
}

/**
 * Renders saved rich-text HTML and runs KaTeX two ways:
 *  1. `.katex-equation` spans produced by the in-app editor (data-latex attrs).
 *  2. `$$…$$` / `$…$` delimiters — used by questions imported from Word (TRN-03).
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

    try {
      renderMathInElement(ref.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
      })
    } catch {
      /* leave delimiters as plain text on failure */
    }
  }, [html])

  return <div ref={ref} className={`question-content ${className}`} />
}
