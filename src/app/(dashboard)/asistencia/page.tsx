import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAsignacionesDocente, getAsignacionesTodas } from '@/actions/asistencia'
import { getGrados, getGruposAdmin, getMateriasAdmin, getEstudiantesAdmin, getDocentes, getAsignacionesAdmin } from '@/actions/admin'
import AsistenciaClient from './AsistenciaClient'
import type { Profile } from '@/types/database'
import type { AdminData } from './admin/AdminPanel'

export default async function AsistenciaPage() {
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
  const esRector = typedProfile.rol === 'rector'

  if (!esRector) {
    const asignaciones = await getAsignacionesDocente(typedProfile.id)
    return (
      <div>
        <PageHeader subtitle="Registra la asistencia de tus grupos" />
        <AsistenciaClient asignaciones={(asignaciones ?? []) as any} esRector={false} adminData={null} />
      </div>
    )
  }

  const [asignaciones, grados, grupos, materias, estudiantes, docentes, asignacionesAdmin] = await Promise.all([
    getAsignacionesTodas(),
    getGrados(),
    getGruposAdmin(),
    getMateriasAdmin(),
    getEstudiantesAdmin(),
    getDocentes(),
    getAsignacionesAdmin(),
  ])

  const adminData: AdminData = {
    grados,
    grupos: grupos as AdminData['grupos'],
    materias,
    estudiantes: estudiantes as AdminData['estudiantes'],
    docentes,
    asignaciones: asignacionesAdmin as AdminData['asignaciones'],
  }

  return (
    <div>
      <PageHeader subtitle="Consulta la asistencia y administra grupos, materias y estudiantes" />
      <AsistenciaClient asignaciones={(asignaciones ?? []) as any} esRector adminData={adminData} />
    </div>
  )
}

function PageHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="mb-8 pt-2">
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
        <a href="/" className="hover:text-slate-600 transition-colors">Inicio</a>
        <span>/</span>
        <span className="text-slate-600 font-medium">Asistencia</span>
      </nav>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Control de Asistencia</h1>
      <p className="text-slate-500 mt-1.5 text-sm">{subtitle}</p>
    </div>
  )
}
