'use client'

import RoleGuard from '@/components/shared/RoleGuard'
import { LevelThemeProvider } from '@/components/shared/LevelTheme'

export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['siswa']}>
      {() => <LevelThemeProvider>{children}</LevelThemeProvider>}
    </RoleGuard>
  )
}
