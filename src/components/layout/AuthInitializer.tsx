'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import type { Profile } from '@/types/database'

export function AuthInitializer({ profile }: { profile: Profile }) {
  const setProfile = useAuthStore((s) => s.setProfile)

  useEffect(() => {
    setProfile(profile)
    return () => setProfile(null)
  }, [profile, setProfile])

  return null
}
