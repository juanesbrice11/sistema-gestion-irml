'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { GradosManager } from './GradosManager'
import { GruposManager } from './GruposManager'
import { MateriasManager } from './MateriasManager'
import { EstudiantesManager } from './EstudiantesManager'
import { AsignacionesManager } from './AsignacionesManager'
import { DocentesManager } from './DocentesManager'
import type { DocenteAdmin } from '@/actions/admin'

type Grado = { id: string; nombre: string; nivel: number }
type Grupo = {
  id: string; nombre: string; jornada: 'manana' | 'tarde' | 'unica'
  director_id: string | null; grado_id: string
  grados: { id: string; nombre: string; nivel: number } | null
}
type Materia = { id: string; nombre: string; codigo: string; horas_semana: number }
type Estudiante = {
  id: string; nombre: string; apellido: string; documento: string
  fecha_nacimiento: string; activo: boolean; grupo_id: string
  grupos: { id: string; nombre: string; grados: { nombre: string } | null } | null
}
type Docente = { id: string; nombre: string; apellido: string; rol: string }
type Asignacion = {
  id: string; anio: number; docente_id: string; grupo_id: string; materia_id: string
  grupos: { nombre: string } | null
  materias: { nombre: string; codigo: string } | null
  profiles: { nombre: string; apellido: string } | null
}

export interface AdminData {
  grados: Grado[]
  grupos: Grupo[]
  materias: Materia[]
  estudiantes: Estudiante[]
  docentes: Docente[]
  docentesAdmin: DocenteAdmin[]
  asignaciones: Asignacion[]
}

const TABS = [
  { key: 'grados', label: 'Grados' },
  { key: 'grupos', label: 'Grupos' },
  { key: 'materias', label: 'Materias' },
  { key: 'estudiantes', label: 'Estudiantes' },
  { key: 'asignaciones', label: 'Asignaciones' },
  { key: 'docentes', label: 'Docentes' },
] as const

type Tab = (typeof TABS)[number]['key']

export function AdminPanel({ grados, grupos, materias, estudiantes, docentes, docentesAdmin, asignaciones }: AdminData) {
  const [tab, setTab] = useState<Tab>('grados')

  const soloDocentes = docentes.filter((d) => d.rol === 'docente')

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                tab === t.key
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panel content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        {tab === 'grados' && <GradosManager grados={grados} />}
        {tab === 'grupos' && <GruposManager grupos={grupos} grados={grados} docentes={soloDocentes} />}
        {tab === 'materias' && <MateriasManager materias={materias} />}
        {tab === 'estudiantes' && <EstudiantesManager estudiantes={estudiantes} grupos={grupos} />}
        {tab === 'asignaciones' && (
          <AsignacionesManager
            asignaciones={asignaciones}
            docentes={soloDocentes}
            grupos={grupos}
            materias={materias}
          />
        )}
        {tab === 'docentes' && <DocentesManager docentes={docentesAdmin} />}
      </div>
    </div>
  )
}
