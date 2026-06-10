import type { ReactNode } from 'react'

/**
 * Small uppercase eyebrow label with a blue→red gradient accent line.
 * `light` switches the text to the red-orange gradient (for dark sections).
 */
export default function SectionLabel({
  children,
  align = 'center',
  light = false,
}: {
  children: ReactNode
  align?: 'left' | 'center'
  light?: boolean
}) {
  const text = light
    ? 'bg-gradient-to-r from-primary-red to-orange-500 bg-clip-text text-transparent'
    : 'text-primary-blue'

  return (
    <div className={`flex items-center gap-2.5 ${align === 'center' ? 'justify-center' : 'justify-start'}`}>
      <span className="h-0.5 w-7 rounded-full bg-gradient-to-r from-primary-blue to-primary-red" />
      <span className={`text-xs font-bold uppercase tracking-[0.2em] ${text}`}>{children}</span>
      {align === 'center' && <span className="h-0.5 w-7 rounded-full bg-gradient-to-l from-primary-blue to-primary-red" />}
    </div>
  )
}
