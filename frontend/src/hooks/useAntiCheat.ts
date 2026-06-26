'use client'

import { useEffect } from 'react'

interface AntiCheatOptions {
  /** Activate the restrictions (e.g. only once the exam has started). */
  enabled: boolean
  /** Called when a blocked shortcut/action is intercepted (for toasts/logging). */
  onBlocked?: (action: string) => void
}

// Keyboard shortcuts that have no place in a locked exam:
//  - copy / cut / paste          (Ctrl/⌘ + C/X/V)
//  - print / save / view-source  (Ctrl/⌘ + P/S/U)
//  - DevTools                    (F12, Ctrl+Shift+I/J/C/K)
// Note: Ctrl+A (select-all) is intentionally allowed — copy is already blocked,
// so select-all alone is harmless and students need it to edit essay answers.
const BLOCKED_CTRL_KEYS = new Set(['c', 'x', 'v', 'p', 's', 'u'])
const BLOCKED_DEVTOOLS_KEYS = new Set(['i', 'j', 'c', 'k'])

/**
 * TRN-25 — client-side anti-cheat browser restrictions for the exam engine.
 *
 * When `enabled`, this hook blocks the context menu, clipboard actions, and the
 * keyboard shortcuts above. It is intentionally side-effect only (no React
 * state) so it can be dropped into the exam page without re-renders. The strike
 * system (tab-switch / fullscreen-exit) lives in the exam page itself, since it
 * is tied to component state.
 */
export function useAntiCheat({ enabled, onBlocked }: AntiCheatOptions): void {
  useEffect(() => {
    if (!enabled) return

    const block = (e: Event) => e.preventDefault()

    const blockContextMenu = (e: Event) => {
      e.preventDefault()
      onBlocked?.('menu klik-kanan')
    }

    const blockClipboard = (e: Event) => {
      e.preventDefault()
      onBlocked?.(e.type) // 'copy' | 'cut' | 'paste'
    }

    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey

      // F12 — DevTools
      if (e.key === 'F12') {
        e.preventDefault()
        onBlocked?.('DevTools (F12)')
        return
      }
      // Ctrl/⌘ + Shift + I/J/C/K — DevTools
      if (ctrl && e.shiftKey && BLOCKED_DEVTOOLS_KEYS.has(key)) {
        e.preventDefault()
        onBlocked?.(`DevTools (Ctrl+Shift+${e.key.toUpperCase()})`)
        return
      }
      // Ctrl/⌘ + C/X/V/A/P/S/U
      if (ctrl && !e.shiftKey && BLOCKED_CTRL_KEYS.has(key)) {
        e.preventDefault()
        onBlocked?.(`pintasan Ctrl+${e.key.toUpperCase()}`)
      }
    }

    document.addEventListener('contextmenu', blockContextMenu)
    document.addEventListener('copy', blockClipboard)
    document.addEventListener('cut', blockClipboard)
    document.addEventListener('paste', blockClipboard)
    document.addEventListener('dragstart', block)
    // Capture phase so we intercept before the browser/devtools react.
    document.addEventListener('keydown', blockKeys, true)

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu)
      document.removeEventListener('copy', blockClipboard)
      document.removeEventListener('cut', blockClipboard)
      document.removeEventListener('paste', blockClipboard)
      document.removeEventListener('dragstart', block)
      document.removeEventListener('keydown', blockKeys, true)
    }
  }, [enabled, onBlocked])
}

export default useAntiCheat
