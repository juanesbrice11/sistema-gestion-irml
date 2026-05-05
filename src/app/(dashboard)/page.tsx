import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { IconClipboard, IconBook, IconPackage, IconChevronRight } from '@/components/ui/icons'

const roleLabel: Record<string, string> = {
  rector: 'Rector',
  docente: 'Docente',
  administrativo: 'Administrativo',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', user!.id)
    .single()

  const typedProfile = profile as Profile | null

  return (
    <div>
      {/* Encabezado */}
      <div className="mb-10 pt-2">
        <p className="text-xs font-semibold text-primary-500 uppercase tracking-widest mb-2">
          {typedProfile?.rol ? roleLabel[typedProfile.rol] : ''} — IE Ramón Messa Londoño
        </p>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Hola, {typedProfile?.nombre}
        </h1>
        <p className="text-slate-500 mt-1.5 text-sm">¿Qué módulo quieres gestionar hoy?</p>
      </div>

      {/* Tarjetas de módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(typedProfile?.rol === 'rector' || typedProfile?.rol === 'docente') && (
          <>
            <StatCard
              title="Asistencia"
              description="Registra y consulta la asistencia por grupo y materia."
              href="/asistencia"
              Icon={IconClipboard}
              colorClass="bg-primary-50 text-primary-600"
            />
            <StatCard
              title="Notas"
              description="Gestiona calificaciones y genera boletines en PDF."
              href="/notas"
              Icon={IconBook}
              colorClass="bg-secondary-50 text-secondary-700"
            />
          </>
        )}
        {(typedProfile?.rol === 'rector' || typedProfile?.rol === 'administrativo') && (
          <StatCard
            title="Inventario"
            description="Controla recursos y préstamos del colegio."
            href="/inventario"
            Icon={IconPackage}
            colorClass="bg-amber-50 text-amber-700"
          />
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  description,
  href,
  Icon,
  colorClass,
}: {
  title: string
  description: string
  href: string
  Icon: React.ComponentType<{ className?: string }>
  colorClass: string
}) {
  return (
    <a
      href={href}
      className="group block bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 border border-slate-100/80"
    >
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${colorClass} mb-5`}>
        <Icon className="w-5 h-5" />
      </div>
      <h2 className="font-semibold text-slate-900 mb-2">{title}</h2>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
      <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        Abrir módulo
        <IconChevronRight className="w-3 h-3 translate-x-0 group-hover:translate-x-0.5 transition-transform duration-200" />
      </div>
    </a>
  )
}
