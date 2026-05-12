'use client'

import { useState, useTransition } from 'react'
import { AsistenciaTable } from '@/components/asistencia/AsistenciaTable'
import { getEstudiantesPorGrupo, getAsistencia, registrarAsistencia } from '@/actions/asistencia'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AdminPanel } from './admin/AdminPanel'
import type { AdminData } from './admin/AdminPanel'
import type { EstadoAsistencia } from '@/types/database'

type Asignacion = {
  id: string
  anio: number
  grupos: { id: string; nombre: string; grados: { nombre: string } | null } | null
  materias: { id: string; nombre: string; codigo: string } | null
}

type AsignacionRector = Asignacion & {
  profiles?: { nombre: string; apellido: string } | null
}

type Estudiante = { id: string; nombre: string; apellido: string }
type EstadoMap = Record<string, EstadoAsistencia>

interface Props {
  asignaciones: (Asignacion | AsignacionRector)[]
  esRector: boolean
  adminData: AdminData | null
}

export default function AsistenciaClient({ asignaciones, esRector, adminData }: Props) {
  const hoy = new Date().toISOString().split('T')[0]
  const [mainTab, setMainTab] = useState<'asistencia' | 'admin'>('asistencia')

  const [asignacionId, setAsignacionId] = useState<string>('')
  const [fecha, setFecha] = useState(hoy)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [estados, setEstados] = useState<EstadoMap>({})
  const [hayRegistros, setHayRegistros] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function cargarAsistencia(asigId: string, nuevaFecha: string) {
    if (!asigId) return
    setCargando(true)
    setGuardado(false)
    setHayRegistros(false)

    const asig = asignaciones.find((a) => a.id === asigId)
    const grupoId = asig?.grupos?.id
    if (!grupoId) { setCargando(false); return }

    const [alumnos, registros] = await Promise.all([
      getEstudiantesPorGrupo(grupoId),
      getAsistencia(asigId, nuevaFecha),
    ])

    const tieneRegistros = (registros?.length ?? 0) > 0
    setHayRegistros(tieneRegistros)

    const mapa: EstadoMap = {}
    alumnos?.forEach((e) => { mapa[e.id] = 'presente' })
    registros?.forEach((r) => { mapa[r.estudiante_id] = r.estado })

    setEstudiantes(alumnos ?? [])
    setEstados(mapa)
    setCargando(false)
  }

  function onSeleccionarAsignacion(id: string) {
    setAsignacionId(id)
    cargarAsistencia(id, fecha)
  }

  function onCambiarFecha(nuevaFecha: string) {
    setFecha(nuevaFecha)
    if (asignacionId) cargarAsistencia(asignacionId, nuevaFecha)
  }

  function onCambiarEstado(estudianteId: string, estado: EstadoAsistencia) {
    setEstados((prev) => ({ ...prev, [estudianteId]: estado }))
  }

  function guardar() {
    startTransition(async () => {
      const registros = estudiantes.map((e) => ({
        estudiante_id: e.id,
        estado: estados[e.id] ?? 'presente',
      }))
      await registrarAsistencia(asignacionId, fecha, registros)
      setGuardado(true)
    })
  }

  const filas = estudiantes.map((e) => ({
    estudiante_id: e.id,
    nombre: e.nombre,
    apellido: e.apellido,
    estado: estados[e.id] ?? 'presente',
  }))

  const asigSeleccionada = asignaciones.find((a) => a.id === asignacionId)

  return (
    <div className="space-y-5">

      {/* Top-level tabs — solo rector */}
      {esRector && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setMainTab('asistencia')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-medium transition-all',
              mainTab === 'asistencia' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            Consultar asistencia
          </button>
          <button
            onClick={() => setMainTab('admin')}
            className={cn(
              'px-5 py-2 rounded-lg text-sm font-medium transition-all',
              mainTab === 'admin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            Administrar
          </button>
        </div>
      )}

      {/* ── Panel de administración ── */}
      {esRector && mainTab === 'admin' && adminData && (
        <AdminPanel {...adminData} />
      )}

      {/* ── Vista de asistencia ── */}
      {(!esRector || mainTab === 'asistencia') && (
        <>
          {/* Selectores */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">
                  {esRector ? 'Grupo / Materia / Docente' : 'Grupo y materia'}
                </label>
                <select
                  value={asignacionId}
                  onChange={(e) => onSeleccionarAsignacion(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                >
                  <option value="">Selecciona una asignación…</option>
                  {asignaciones.map((a) => {
                    const rector = a as AsignacionRector
                    const docente = rector.profiles
                      ? ` · ${rector.profiles.nombre} ${rector.profiles.apellido}`
                      : ''
                    return (
                      <option key={a.id} value={a.id}>
                        {a.grupos?.nombre} — {a.materias?.nombre}{docente}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  max={hoy}
                  onChange={(e) => onCambiarFecha(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>
            </div>

            {asigSeleccionada && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
                <span>
                  <span className="font-medium text-slate-700">{asigSeleccionada.grupos?.grados?.nombre}</span>
                  {' '}{asigSeleccionada.grupos?.nombre}
                </span>
                <span>·</span>
                <span>{asigSeleccionada.materias?.nombre}</span>
                <span>·</span>
                <span>{estudiantes.length} estudiantes</span>
              </div>
            )}
          </div>

          {!asignacionId && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <p className="text-slate-400 text-sm">Selecciona un grupo y materia para comenzar</p>
            </div>
          )}

          {asignacionId && cargando && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <p className="text-slate-400 text-sm">Cargando estudiantes…</p>
            </div>
          )}

          {/* Rector: sin registros para esa fecha */}
          {asignacionId && !cargando && esRector && estudiantes.length > 0 && !hayRegistros && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center space-y-2">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 mb-1">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                </svg>
              </div>
              <p className="text-slate-700 text-sm font-medium">No se realizó registro de asistencia</p>
              <p className="text-slate-400 text-xs">El docente no registró asistencia para esta fecha.</p>
            </div>
          )}

          {/* Tabla visible: rector con registros, o docente siempre */}
          {asignacionId && !cargando && estudiantes.length > 0 && (!esRector || hayRegistros) && (
            <>
              <AsistenciaTable
                filas={filas}
                fecha={fecha}
                onCambiarEstado={onCambiarEstado}
                readonly={esRector}
              />

              {!esRector && (
                <div className="flex items-center justify-between">
                  {guardado && (
                    <p className="text-sm text-secondary-600 font-medium">✓ Asistencia guardada correctamente</p>
                  )}
                  {!guardado && <span />}
                  <Button onClick={guardar} loading={isPending} disabled={isPending}>
                    Guardar asistencia
                  </Button>
                </div>
              )}
            </>
          )}

          {asignacionId && !cargando && estudiantes.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <p className="text-slate-400 text-sm">No hay estudiantes en este grupo</p>
            </div>
          )}
        </>
      )}

    </div>
  )
}
