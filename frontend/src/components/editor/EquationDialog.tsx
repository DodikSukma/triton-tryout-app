'use client'

import { useEffect, useMemo, useState } from 'react'
import katex from 'katex'
import { X, Calculator, BookOpen } from 'lucide-react'

interface EquationDialogProps {
  open: boolean
  onClose: () => void
  onInsert: (latex: string, displayMode: boolean) => void
  initialLatex?: string
  /** Pre-set the block/inline toggle (used when editing an existing equation). */
  initialDisplayMode?: boolean
}

const SYMBOLS = [
  { label: '÷', latex: '\\div' },
  { label: '×', latex: '\\times' },
  { label: '±', latex: '\\pm' },
  { label: '√', latex: '\\sqrt{}' },
  { label: '∑', latex: '\\sum' },
  { label: '∫', latex: '\\int' },
  { label: '∞', latex: '\\infty' },
  { label: 'π', latex: '\\pi' },
  { label: 'α', latex: '\\alpha' },
  { label: 'β', latex: '\\beta' },
  { label: 'θ', latex: '\\theta' },
  { label: 'λ', latex: '\\lambda' },
  { label: 'μ', latex: '\\mu' },
  { label: 'σ', latex: '\\sigma' },
  { label: '≤', latex: '\\leq' },
  { label: '≥', latex: '\\geq' },
  { label: '≠', latex: '\\neq' },
  { label: '≈', latex: '\\approx' },
  { label: '∈', latex: '\\in' },
  { label: '→', latex: '\\to' },
]

const TEMPLATES: { label: string; latex: string }[] = [
  { label: 'Pecahan',           latex: '\\frac{a}{b}' },
  { label: 'Akar Kuadrat',      latex: '\\sqrt{x}' },
  { label: 'Pangkat',           latex: 'x^{n}' },
  { label: 'Sigma',             latex: '\\sum_{i=1}^{n} x_i' },
  { label: 'Integral',          latex: '\\int_{a}^{b} f(x)\\,dx' },
  { label: 'Limit',             latex: '\\lim_{x \\to \\infty} f(x)' },
  { label: 'Vektor',            latex: '\\vec{v}' },
  { label: 'Absolut',           latex: '|x|' },
  { label: 'Matriks 2×2',       latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { label: 'Sistem Persamaan',  latex: '\\begin{cases} ax+by=c \\\\ dx+ey=f \\end{cases}' },
]

const QUICK_REF: { label: string; code: string }[] = [
  { label: 'Pecahan',     code: '\\frac{a}{b}' },
  { label: 'Akar',        code: '\\sqrt{x}' },
  { label: 'Akar n',      code: '\\sqrt[n]{x}' },
  { label: 'Pangkat',     code: 'x^{2}' },
  { label: 'Subscript',   code: 'x_{1}' },
  { label: 'Sigma',       code: '\\sum_{i=1}^{n}' },
  { label: 'Integral',    code: '\\int_{a}^{b}' },
  { label: 'Limit',       code: '\\lim_{x \\to 0}' },
  { label: 'Alpha',       code: '\\alpha' },
  { label: 'Beta',        code: '\\beta' },
  { label: 'Pi',          code: '\\pi' },
  { label: 'Theta',       code: '\\theta' },
  { label: '≤ / ≥',       code: '\\leq, \\geq' },
  { label: '≠',           code: '\\neq' },
  { label: '≈',           code: '\\approx' },
]

export default function EquationDialog({ open, onClose, onInsert, initialLatex, initialDisplayMode }: EquationDialogProps) {
  const [latex, setLatex] = useState(initialLatex ?? '')
  const [displayMode, setDisplayMode] = useState(false)
  const [tab, setTab] = useState<'latex' | 'ref'>('latex')

  useEffect(() => {
    if (open) {
      setLatex(initialLatex ?? '')
      setDisplayMode(initialDisplayMode ?? false)
      setTab('latex')
    }
  }, [open, initialLatex, initialDisplayMode])

  const preview = useMemo(() => {
    if (!latex.trim()) return { html: '', error: false }
    try {
      const html = katex.renderToString(latex, {
        throwOnError: true,
        displayMode,
        strict: 'ignore',
      })
      return { html, error: false }
    } catch {
      return { html: '', error: true }
    }
  }, [latex, displayMode])

  function insertSymbol(symbolLatex: string) {
    setLatex((prev) => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + symbolLatex)
  }

  function handleInsert() {
    if (!latex.trim() || preview.error) return
    onInsert(latex, displayMode)
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-500">
            <Calculator size={20} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Sisipkan Persamaan Matematika</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">Tulis dengan sintaks LaTeX, preview otomatis di bawah</p>
          </div>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-slate-100 dark:border-slate-700 flex gap-1">
          <button
            onClick={() => setTab('latex')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              tab === 'latex'
                ? 'text-violet-600 border-b-2 border-violet-500 -mb-px'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            LaTeX
          </button>
          <button
            onClick={() => setTab('ref')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5 ${
              tab === 'ref'
                ? 'text-violet-600 border-b-2 border-violet-500 -mb-px'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <BookOpen size={14} /> Panduan Cepat
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'latex' ? (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kode LaTeX</label>
                <textarea
                  value={latex}
                  onChange={(e) => setLatex(e.target.value)}
                  rows={3}
                  placeholder="Contoh: x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
                  className="w-full font-mono text-sm border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Simbol Cepat</label>
                <div className="flex flex-wrap gap-1.5">
                  {SYMBOLS.map((s) => (
                    <button
                      key={s.latex}
                      type="button"
                      onClick={() => insertSymbol(s.latex)}
                      title={s.latex}
                      className="w-9 h-9 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-600 transition-colors"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Template</label>
                <div className="flex flex-wrap gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      onClick={() => setLatex(t.latex)}
                      className="rounded-full bg-slate-100 hover:bg-violet-100 hover:text-violet-700 text-slate-600 px-3.5 py-1.5 text-xs font-medium transition-colors"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Preview</label>
                <div className={`bg-slate-50 border rounded-xl p-6 min-h-[96px] flex items-center justify-center text-center ${preview.error ? 'border-red-200 bg-red-50' : 'border-slate-100'}`}>
                  {!latex.trim() ? (
                    <span className="text-slate-400 text-sm italic">Tulis kode LaTeX di atas untuk melihat preview</span>
                  ) : preview.error ? (
                    <span className="text-red-500 text-sm font-medium">Persamaan tidak valid — periksa sintaks LaTeX</span>
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: preview.html }} />
                  )}
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <span className="relative inline-flex h-5 w-9">
                  <input
                    type="checkbox"
                    checked={displayMode}
                    onChange={(e) => setDisplayMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className="w-9 h-5 rounded-full bg-slate-200 peer-checked:bg-violet-500 transition-colors" />
                  <span className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
                </span>
                <span className="text-sm text-slate-600">Tampilkan sebagai blok terpisah (baris baru)</span>
              </label>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-2.5">Yang Ingin Ditulis</th>
                    <th className="text-left px-4 py-2.5">Kode LaTeX</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {QUICK_REF.map((r) => (
                    <tr key={r.label} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 text-slate-700">{r.label}</td>
                      <td className="px-4 py-2.5 font-mono text-xs bg-slate-50/50 text-slate-600">{r.code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-white transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleInsert}
            disabled={!latex.trim() || preview.error}
            className="px-6 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Sisipkan ke Soal
          </button>
        </div>
      </div>
    </div>
  )
}
