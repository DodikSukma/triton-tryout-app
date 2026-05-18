'use client'

import { useAuth } from '@/hooks/useAuth'
import ProfilePage from '@/components/profile/ProfilePage'

export default function GuruProfilPage() {
  const { user } = useAuth()
  if (!user) return null
  return <ProfilePage role="guru" email={user.email} />
}
