'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'
import { SessionUser } from '@/types'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export function useAuth() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .get<ApiResponse<SessionUser>>('/auth/me')
      .then((res) => {
        if (!cancelled) setUser(res.data.data)
      })
      .catch(() => {
        if (!cancelled) setIsError(true)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { user, isLoading, isError }
}

export interface Profile {
  id: string
  user_id: string
  nama_lengkap: string
  no_telepon?: string | null
  kelas?: string | null
  mata_pelajaran?: string | null
  avatar_url?: string | null
  bio?: string | null
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api
      .get<ApiResponse<Profile>>('/users/profile/me')
      .then((res) => {
        if (!cancelled) setProfile(res.data.data)
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { profile, setProfile, isLoading }
}
