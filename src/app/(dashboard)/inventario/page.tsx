import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getRecursos, getCategorias, getPrestamosActivos } from '@/actions/inventario'
import InventarioClient from './InventarioClient'
import type { Profile } from '@/types/database'

export default async function InventarioPage() {
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

  if (typedProfile.rol === 'docente') redirect('/')

  const [recursosRaw, categorias, prestamosActivos] = await Promise.all([
    getRecursos(),
    getCategorias(),
    getPrestamosActivos(),
  ])

  return (
    <div>
      <div className="mb-8 pt-2">
        <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-3">
          <a href="/" className="hover:text-slate-600 transition-colors">Inicio</a>
          <span>/</span>
          <span className="text-slate-600 font-medium">Inventario</span>
        </nav>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Inventario de Recursos</h1>
        <p className="text-slate-500 mt-1.5 text-sm">
          {typedProfile.rol === 'rector'
            ? 'Consulta el inventario y préstamos del colegio'
            : 'Gestiona los recursos y préstamos del colegio'}
        </p>
      </div>

      <InventarioClient
        recursosRaw={(recursosRaw ?? []) as any}
        categorias={categorias}
        prestamosActivos={(prestamosActivos ?? []) as any}
        perfilId={typedProfile.id}
        esAdmin={typedProfile.rol === 'administrativo'}
      />
    </div>
  )
}
