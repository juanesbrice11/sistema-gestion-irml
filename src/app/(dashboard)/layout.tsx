import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { AuthInitializer } from '@/components/layout/AuthInitializer'
import type { Profile } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile) redirect('/login')

  const typedProfile = profile as Profile

  return (
    <div className="min-h-screen bg-[#f0f4f9]">
      <AuthInitializer profile={typedProfile} />
      <Navbar
        nombre={typedProfile.nombre}
        apellido={typedProfile.apellido}
        rol={typedProfile.rol}
      />
      <main className="pt-24 px-6 pb-10 max-w-5xl mx-auto">
        {children}
      </main>
    </div>
  )
}
