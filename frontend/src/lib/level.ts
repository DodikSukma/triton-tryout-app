// Global education-level context for the frontend.
//
// The backend is split into three level services (sd/smp/sma), each behind a
// gateway prefix (`/sd`, `/smp`, `/sma`). The frontend keeps a single "active
// level" — chosen via the sidebar LevelSwitcher and persisted in localStorage —
// that determines which level service every tryout/soal/sesi/hasil request hits.
//
// `lib/api.ts` reads this at request time (via an axios interceptor) so call
// sites keep using plain paths like `/tryouts` and get them rewritten to
// `/sma/tryouts` automatically.

export type Level = 'sd' | 'smp' | 'sma'

export const LEVELS: Level[] = ['sd', 'smp', 'sma']

export const LEVEL_LABELS: Record<Level, string> = {
  sd: 'SD',
  smp: 'SMP',
  sma: 'SMA',
}

const STORAGE_KEY = 'triton.level'
const DEFAULT_LEVEL: Level = 'sma'

function isLevel(value: unknown): value is Level {
  return value === 'sd' || value === 'smp' || value === 'sma'
}

let current: Level = DEFAULT_LEVEL
const listeners = new Set<(level: Level) => void>()

/** Current active level. Re-reads localStorage so external changes are honored. */
export function getLevel(): Level {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLevel(stored)) current = stored
  }
  return current
}

/** Set the active level, persist it, and notify subscribers. */
export function setLevel(level: Level): void {
  if (!isLevel(level)) return
  current = level
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, level)
  }
  listeners.forEach((fn) => fn(level))
}

/** Subscribe to level changes. Returns an unsubscribe function. */
export function subscribeLevel(fn: (level: Level) => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

// Route prefixes owned by the level services. Requests to these paths are
// rewritten to include the active level prefix; everything else (e.g. /auth,
// /users) is left untouched.
const LEVEL_ROUTES = ['/tryouts', '/soal', '/sesi', '/hasil', '/riwayat']

/** True when `url` targets a level service route that must be prefixed. */
export function isLevelRoute(url: string): boolean {
  return LEVEL_ROUTES.some(
    (route) => url === route || url.startsWith(`${route}/`) || url.startsWith(`${route}?`)
  )
}

/** Prefix a level-service path with the (active, by default) level segment. */
export function levelPath(url: string, level: Level = getLevel()): string {
  return `/${level}${url}`
}

// ─── Profile-driven level resolution (student portal) ───────────────────────
// A student's level is fixed by their class (`profile.kelas`), e.g. "6 SD",
// "9 SMP", "12 SMA". This drives both the visual theme and the active API level
// so a student only ever sees their own level's content.
export function getEducationLevel(kelas: string | null | undefined): Level {
  if (!kelas) return 'sma' // Default fallback
  const k = kelas.toLowerCase()
  if (k.includes('sd') || /\b[1-6]\b/.test(k) || /\b(i|ii|iii|iv|v|vi)\b/.test(k)) {
    return 'sd'
  }
  if (k.includes('smp') || /\b[7-9]\b/.test(k) || /\b(vii|viii|ix)\b/.test(k)) {
    return 'smp'
  }
  return 'sma'
}

// ─── Per-level visual theme (student portal) ────────────────────────────────
// NOTE: every Tailwind class here must appear as a full literal string so the
// JIT scanner keeps it (see tailwind.config content globs, which now include
// src/lib). Do not build these by interpolation.
export interface LevelTheme {
  /** Page/background gradient for the student area. */
  pageBg: string
  /** Banner gradient `from-… via-… to-white` (TRN-02 objective 1). */
  headerGradient: string
  /** Primary action buttons (Mulai Tryout / Kumpulkan). */
  button: string
  /** Accent text (welcome header, CTA labels). */
  accentText: string
  /** Soft accent container for stat icons / chips (bg + text). */
  accentBg: string
  /** Hover / focus border + text accent. */
  border: string
  /** Sidebar active item background + text. */
  navActive: string
  /** Sidebar active left indicator bar. */
  navBar: string
  /** Sidebar active icon color. */
  navIcon: string
}

export const LEVEL_THEME: Record<Level, LevelTheme> = {
  sd: {
    pageBg: 'bg-gradient-to-br from-red-600/10 via-red-50/50 to-white',
    headerGradient: 'from-red-600 via-red-500 to-white',
    button: 'bg-red-600 hover:bg-red-700 text-white',
    accentText: 'text-red-600',
    accentBg: 'bg-red-100 text-red-600',
    border: 'border-red-200 text-red-600',
    navActive: 'bg-gradient-to-r from-red-50 to-red-50/50 text-red-700 shadow-sm',
    navBar: 'bg-red-500',
    navIcon: 'text-red-600',
  },
  smp: {
    pageBg: 'bg-gradient-to-br from-blue-900/10 via-blue-50/50 to-white',
    headerGradient: 'from-blue-900 via-blue-800 to-white',
    button: 'bg-blue-900 hover:bg-blue-950 text-white',
    accentText: 'text-blue-900',
    accentBg: 'bg-blue-100 text-blue-900',
    border: 'border-blue-200 text-blue-900',
    navActive: 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-900 shadow-sm',
    navBar: 'bg-blue-900',
    navIcon: 'text-blue-900',
  },
  sma: {
    pageBg: 'bg-gradient-to-br from-slate-600/10 via-slate-50/50 to-white',
    headerGradient: 'from-slate-600 via-slate-500 to-white',
    button: 'bg-slate-600 hover:bg-slate-700 text-white',
    accentText: 'text-slate-600',
    accentBg: 'bg-slate-100 text-slate-600',
    border: 'border-slate-200 text-slate-600',
    navActive: 'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 shadow-sm',
    navBar: 'bg-slate-500',
    navIcon: 'text-slate-600',
  },
}
