'use client'

import RoleGuard from '@/components/shared/RoleGuard'

export default function ExamLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['siswa']}>
      {() => <div className="min-h-screen bg-slate-50">{children}</div>}
    </RoleGuard>
  )
}
