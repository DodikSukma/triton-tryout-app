'use client'

import { useEffect, useState } from 'react'
import { getLevel, setLevel as setLevelStore, subscribeLevel, type Level } from '@/lib/level'

/**
 * React binding for the global education-level store.
 * Returns the active level and a setter that persists + broadcasts the change.
 *
 * Initial render uses the default level (so server and first client render
 * match); the stored value is synced in an effect to avoid hydration mismatch.
 */
export function useLevel(): [Level, (level: Level) => void] {
  const [level, setLevelState] = useState<Level>('sma')

  useEffect(() => {
    setLevelState(getLevel())
    return subscribeLevel(setLevelState)
  }, [])

  return [level, setLevelStore]
}
