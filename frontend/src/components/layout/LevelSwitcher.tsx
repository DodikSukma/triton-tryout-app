'use client'

import { GraduationCap } from 'lucide-react'
import { LEVELS, LEVEL_LABELS, type Level } from '@/lib/level'
import { useLevel } from '@/hooks/useLevel'

/**
 * Global education-level switcher (SD / SMP / SMA).
 *
 * Selecting a level repoints every tryout/soal/sesi/hasil request at the
 * matching level service. The page is reloaded so already-rendered data is
 * refetched under the newly selected level.
 */
export default function LevelSwitcher() {
  const [level, setLevel] = useLevel()

  function handleSelect(next: Level) {
    if (next === level) return
    setLevel(next)
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className="px-4 pt-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <GraduationCap size={14} className="text-slate-400" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Jenjang
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-100/80">
        {LEVELS.map((lvl) => {
          const active = lvl === level
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => handleSelect(lvl)}
              aria-pressed={active}
              className={`py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                active
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              {LEVEL_LABELS[lvl]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
