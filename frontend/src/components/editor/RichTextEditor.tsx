'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import katex from 'katex'
import { toast } from 'sonner'
import {
  Bold, Italic, Underline, List, ListOrdered, Image as ImageIcon, Eraser, Sigma,
} from 'lucide-react'
import EquationDialog from './EquationDialog'

export interface RichTextEditorHandle {
  /** Returns current HTML content of the editor */
  getHtml: () => string
  /** Returns plain text of the editor */
  getText: () => string
  /** Sets the HTML content (re-renders KaTeX) */
  setHtml: (html: string) => void
  /** Clear all content */
  clear: () => void
  /** Focus the editor */
  focus: () => void
}

interface RichTextEditorProps {
  initialHtml?: string
  placeholder?: string
  minHeight?: string
  className?: string
  /** Called whenever content changes; passes plain text and current HTML */
  onChange?: (data: { html: string; text: string }) => void
  /** Show full toolbar (default) or only essentials */
  variant?: 'full' | 'compact'
  /** Maximum image size in MB (default 2) */
  maxImageMB?: number
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor(
  { initialHtml = '', placeholder = 'Tulis di sini...', minHeight = '160px', className = '', onChange, variant = 'full', maxImageMB = 2 },
  ref
) {
  const editorRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [equationOpen, setEquationOpen] = useState(false)
  const [active, setActive] = useState({ bold: false, italic: false, underline: false })

  // ─── Initialize content ───
  useEffect(() => {
    if (editorRef.current && initialHtml && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = initialHtml
      // Re-render any katex equations that were saved
      rerenderEquations(editorRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Track formatting state ───
  function updateActive() {
    if (typeof document === 'undefined') return
    setActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    })
  }

  function saveSelection() {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange()
    }
  }

  function restoreSelection() {
    const range = savedRangeRef.current
    if (range && editorRef.current) {
      editorRef.current.focus()
      const sel = window.getSelection()
      sel?.removeAllRanges()
      sel?.addRange(range)
    } else {
      editorRef.current?.focus()
    }
  }

  function exec(command: string, value?: string) {
    restoreSelection()
    document.execCommand(command, false, value)
    updateActive()
    handleInput()
  }

  function handleInput() {
    if (!editorRef.current) return
    onChange?.({
      html: editorRef.current.innerHTML,
      text: editorRef.current.innerText,
    })
  }

  function rerenderEquations(root: HTMLElement) {
    root.querySelectorAll<HTMLElement>('.katex-equation').forEach((span) => {
      const latex = span.getAttribute('data-latex')
      const displayMode = span.getAttribute('data-display') === 'true'
      if (latex) {
        try {
          span.innerHTML = katex.renderToString(latex, { throwOnError: false, displayMode })
        } catch {
          span.textContent = `[Invalid: ${latex}]`
        }
      }
      span.setAttribute('contenteditable', 'false')
    })
  }

  function insertEquation(latex: string, displayMode: boolean) {
    if (!editorRef.current) return
    restoreSelection()
    const span = document.createElement('span')
    span.className = 'katex-equation'
    span.setAttribute('contenteditable', 'false')
    span.setAttribute('data-latex', latex)
    span.setAttribute('data-display', String(displayMode))
    try {
      span.innerHTML = katex.renderToString(latex, { throwOnError: false, displayMode })
    } catch {
      toast.error('Persamaan tidak valid.')
      return
    }
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      range.deleteContents()
      range.insertNode(span)
      // Add a space after for cursor placement
      const space = document.createTextNode(' ')
      span.after(space)
      const newRange = document.createRange()
      newRange.setStartAfter(space)
      newRange.collapse(true)
      sel.removeAllRanges()
      sel.addRange(newRange)
    } else {
      editorRef.current.appendChild(span)
    }
    handleInput()
  }

  function handleImageClick() {
    saveSelection()
    fileInputRef.current?.click()
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar.')
      return
    }
    if (file.size > maxImageMB * 1024 * 1024) {
      toast.error(`Ukuran gambar maksimal ${maxImageMB}MB.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      restoreSelection()
      const figure = document.createElement('figure')
      figure.setAttribute('contenteditable', 'false')
      figure.className = 'inline-block my-2 relative max-w-full'
      figure.innerHTML = `
        <img src="${base64}" class="max-w-full max-h-[280px] object-contain rounded-lg border border-slate-200" />
        <button type="button" data-delete="1"
          class="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">×</button>
      `
      figure.querySelector<HTMLButtonElement>('[data-delete]')?.addEventListener('click', () => {
        figure.remove()
        handleInput()
      })
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        range.deleteContents()
        range.insertNode(figure)
      } else {
        editorRef.current?.appendChild(figure)
      }
      handleInput()
    }
    reader.readAsDataURL(file)
    // Reset so same file can be re-uploaded
    e.target.value = ''
  }

  useImperativeHandle(ref, () => ({
    getHtml: () => editorRef.current?.innerHTML ?? '',
    getText: () => editorRef.current?.innerText ?? '',
    setHtml: (html: string) => {
      if (!editorRef.current) return
      editorRef.current.innerHTML = html
      rerenderEquations(editorRef.current)
      // Re-attach delete listeners on images
      editorRef.current.querySelectorAll<HTMLElement>('figure[contenteditable="false"]').forEach((fig) => {
        fig.querySelector<HTMLButtonElement>('[data-delete]')?.addEventListener('click', () => {
          fig.remove()
          handleInput()
        })
      })
    },
    clear: () => {
      if (editorRef.current) editorRef.current.innerHTML = ''
      handleInput()
    },
    focus: () => editorRef.current?.focus(),
  }))

  const ToolBtn = ({
    onClick, active, title, children, accent,
  }: {
    onClick: () => void
    active?: boolean
    title?: string
    children: React.ReactNode
    accent?: 'violet' | 'blue'
  }) => {
    const base = 'w-8 h-8 rounded-lg flex items-center justify-center transition-all'
    const idle = 'text-slate-600 hover:bg-white hover:shadow-sm hover:text-slate-900'
    const activeCls = 'bg-blue-500 text-white shadow-sm'
    const accentCls =
      accent === 'violet'
        ? 'text-violet-600 bg-violet-50 hover:bg-violet-100 hover:text-violet-700 px-2.5 w-auto'
        : accent === 'blue'
          ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 px-2.5 w-auto'
          : ''
    return (
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        title={title}
        className={`${base} ${accent ? accentCls : active ? activeCls : idle}`}
      >
        {children}
      </button>
    )
  }

  const Sep = () => <span className="w-px h-5 bg-slate-200 mx-0.5 self-center" />

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="bg-slate-50 rounded-t-xl border border-slate-200 border-b-slate-100 p-2 flex flex-wrap items-center gap-0.5">
        <ToolBtn onClick={() => exec('bold')} active={active.bold} title="Tebal (Ctrl+B)"><Bold size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('italic')} active={active.italic} title="Miring (Ctrl+I)"><Italic size={14} /></ToolBtn>
        <ToolBtn onClick={() => exec('underline')} active={active.underline} title="Garis Bawah (Ctrl+U)"><Underline size={14} /></ToolBtn>

        {variant === 'full' && (
          <>
            <Sep />
            <ToolBtn onClick={() => exec('insertUnorderedList')} title="Daftar tidak berurut"><List size={14} /></ToolBtn>
            <ToolBtn onClick={() => exec('insertOrderedList')} title="Daftar berurut"><ListOrdered size={14} /></ToolBtn>
          </>
        )}

        <Sep />
        <ToolBtn accent="violet" onClick={() => { saveSelection(); setEquationOpen(true) }} title="Sisipkan Persamaan Matematika">
          <Sigma size={14} className="mr-1" />
          <span className="text-xs font-bold">Σ</span>
        </ToolBtn>
        {variant === 'full' && (
          <ToolBtn accent="blue" onClick={handleImageClick} title="Sisipkan Gambar">
            <ImageIcon size={14} />
          </ToolBtn>
        )}

        <Sep />
        <ToolBtn onClick={() => exec('removeFormat')} title="Hapus Format"><Eraser size={14} /></ToolBtn>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={handleInput}
        onKeyUp={updateActive}
        onMouseUp={updateActive}
        onFocus={updateActive}
        style={{ minHeight }}
        className="question-content border border-slate-200 border-t-0 rounded-b-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 text-base leading-relaxed bg-white transition-colors"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleImageChange}
      />

      <EquationDialog
        open={equationOpen}
        onClose={() => setEquationOpen(false)}
        onInsert={insertEquation}
      />
    </div>
  )
})

export default RichTextEditor
