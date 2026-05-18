'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Role, SessionUser } from '@/types'

interface RoleGuardProps {
  allowedRoles: Role[]
  children: (user: SessionUser) => React.ReactNode
}

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<{ success: boolean; data: SessionUser }>('/auth/me')
      .then((res) => {
        const data = res.data.data
        if (!allowedRoles.includes(data.role)) {
          router.replace(`/${data.role}/dashboard`)
          return
        }
        setUser(data)
      })
      .catch(() => {
        router.replace('/login')
      })
      .finally(() => setLoading(false))
  }, [allowedRoles, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-triton-neutral-50">
        <div className="w-8 h-8 border-2 border-triton-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null
  return <>{children(user)}</>
}
