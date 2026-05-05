'use client'

import { create } from 'zustand'
import type { Profile, Rol } from '@/types/database'

interface AuthState {
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
  rol: Rol | null
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  rol: null,
  setProfile: (profile) => set({ profile, rol: profile?.rol ?? null }),
}))
