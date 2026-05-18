'use client'

import { useAuth } from '@/hooks/useAuth'
import ProfilePage from '@/components/profile/ProfilePage'

export default function AdminProfilPage() {
  const { user } = useAuth()
  if (!user) return null
  return <ProfilePage role="admin" email={user.email} />
}
