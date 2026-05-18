'use client'

import { useAuth } from '@/hooks/useAuth'
import ProfilePage from '@/components/profile/ProfilePage'

export default function SiswaProfilPage() {
  const { user } = useAuth()
  if (!user) return null
  return <ProfilePage role="siswa" email={user.email} />
}
