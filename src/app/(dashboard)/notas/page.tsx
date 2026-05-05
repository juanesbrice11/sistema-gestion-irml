import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAsignacionesDocente, getAsignacionesTodas } from '@/actions/asistencia'
import { getPeriodos } from '@/actions/notas'
import NotasClient from './NotasClient'
import type { Profile } from '@/types/database'

export default async function NotasPage() {
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

  if (typedProfile.rol === 'administrativo') redirect('/')

  const [asignaciones, periodos] = await Promise.all([
    typedProfile.rol === 'rector'
      ? getAsignacionesTodas()
      : getAsignacionesDocente(typedProfile.id),
    getPeriodos(),
  ])

  return (
    <div>
      <div className="mb-8 pt-2">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <a href="/" className="hover:text-slate-600 transition-colors">Inicio</a>
          <span>/</span>
          <span className="text-slate-600 font-medium">Notas</span>
        </nav>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Registro de Notas</h1>
        <p className="text-slate-500 mt-1.5 text-sm">
          {typedProfile.rol === 'rector'
            ? 'Consulta las calificaciones de todos los grupos'
            : 'Ingresa y actualiza las calificaciones de tus grupos'}
        </p>
      </div>

      <NotasClient
        asignaciones={asignaciones ?? []}
        periodos={periodos}
        esRector={typedProfile.rol === 'rector'}
      />
    </div>
  )
}
