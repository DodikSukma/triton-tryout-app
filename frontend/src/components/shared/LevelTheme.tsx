'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useProfile } from '@/hooks/useAuth'
import {
  getEducationLevel,
  getLevel,
  setLevel,
  LEVEL_THEME,
  type Level,
  type LevelTheme,
} from '@/lib/level'

interface LevelThemeValue {
  level: Level
  theme: LevelTheme
}

const LevelThemeContext = createContext<LevelThemeValue>({
  level: 'sma',
  theme: LEVEL_THEME.sma,
})

/**
 * Resolves the student's education level from their profile (`kelas`) and:
 *  1. Syncs the global API level (so `/tryouts`, `/sesi`, … hit the student's
 *     own level service — this is what keeps exam content partitioned).
 *  2. Exposes the matching visual theme to descendants via `useLevelTheme()`.
 *
 * Children are held back until the level has been synced to the *resolved*
 * level, so a page's first data fetch always targets the correct service
 * (avoids a flash of another level's content on cold load / refresh).
 */
export function LevelThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useProfile()
  const level = getEducationLevel(profile?.kelas)
  const [syncedLevel, setSyncedLevel] = useState<Level | null>(
    typeof window === 'undefined' ? null : getLevel()
  )

  useEffect(() => {
    setLevel(level)
    setSyncedLevel(level)
  }, [level])

  const ready = !isLoading && syncedLevel === level

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <LevelThemeContext.Provider value={{ level, theme: LEVEL_THEME[level] }}>
      <div className={`min-h-screen ${LEVEL_THEME[level].pageBg}`}>{children}</div>
    </LevelThemeContext.Provider>
  )
}

/** Active student level + its theme. Defaults to SMA outside a provider. */
export function useLevelTheme(): LevelThemeValue {
  return useContext(LevelThemeContext)
}
