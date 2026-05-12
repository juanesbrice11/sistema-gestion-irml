'use client'

import { useState, useTransition, useMemo } from 'react'
import { AsistenciaTable } from '@/components/asistencia/AsistenciaTable'
import { ResumenTable } from '@/components/asistencia/ResumenTable'
import {
  getEstudiantesPorGrupo,
  getAsistencia,
  registrarAsistencia,
  getResumenAsistencia,
  type ResumenFila,
} from '@/actions/asistencia'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AdminPanel } from './admin/AdminPanel'
import type { AdminData } from './admin/AdminPanel'
import type { EstadoAsistencia } from '@/types/database'

// ─── tipos ───────────────────────────────────────────────────────────────────

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
type ObservacionMap = Record<string, string>

interface Props {
  asignaciones: (Asignacion | AsignacionRector)[]
  esRector: boolean
  adminData: AdminData | null
}

// ─── utilidades ──────────────────────────────────────────────────────────────

function esDiaSemana(fecha: string): boolean {
  const dia = new Date(fecha + 'T00:00:00').getDay() // 0=dom, 6=sáb
  return dia !== 0 && dia !== 6
}

function primerDiaDelMes(): string {
  const hoy = new Date()
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
}

// ─── componente ──────────────────────────────────────────────────────────────

export default function AsistenciaClient({ asignaciones, esRector, adminData }: Props) {
  const hoy = new Date().toISOString().split('T')[0]

  // tabs de nivel superior (rector)
  const [mainTab, setMainTab] = useState<'asistencia' | 'admin'>('asistencia')
  // sub-tabs de consulta (rector)
  const [vistaRector, setVistaRector] = useState<'dia' | 'resumen'>('dia')

  // selector día a día
  const [asignacionId, setAsignacionId] = useState<string>('')
  const [fecha, setFecha] = useState(hoy)
  const [esFinDeSemana, setEsFinDeSemana] = useState(false)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [estados, setEstados] = useState<EstadoMap>({})
  const [observaciones, setObservaciones] = useState<ObservacionMap>({})
  const [hayRegistros, setHayRegistros] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [isPending, startTransition] = useTransition()

  // resumen
  const [resumenAsignacionId, setResumenAsignacionId] = useState<string>('')
  const [desde, setDesde] = useState(primerDiaDelMes())
  const [hasta, setHasta] = useState(hoy)
  const [resumenData, setResumenData] = useState<ResumenFila[]>([])
  const [cargandoResumen, setCargandoResumen] = useState(false)
  const [resumenConsultado, setResumenConsultado] = useState(false)

  // ── conteo en tiempo real ─────────────────────────────────────────────────

  const conteo = useMemo(() => {
    const c = { presente: 0, ausente: 0, tarde: 0, excusa: 0 }
    estudiantes.forEach((e) => { c[estados[e.id] ?? 'presente']++ })
    return c
  }, [estudiantes, estados])

  // ── carga de asistencia diaria ────────────────────────────────────────────

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
    const obsMap: ObservacionMap = {}
    alumnos?.forEach((e) => { mapa[e.id] = 'presente' })
    registros?.forEach((r) => {
      mapa[r.estudiante_id] = r.estado
      if (r.observacion) obsMap[r.estudiante_id] = r.observacion
    })

    setEstudiantes(alumnos ?? [])
    setEstados(mapa)
    setObservaciones(obsMap)
    setCargando(false)
  }

  function onSeleccionarAsignacion(id: string) {
    setAsignacionId(id)
    if (id && !esFinDeSemana) cargarAsistencia(id, fecha)
  }

  function onCambiarFecha(nuevaFecha: string) {
    setFecha(nuevaFecha)
    const fds = !esDiaSemana(nuevaFecha)
    setEsFinDeSemana(fds)
    if (!fds && asignacionId) cargarAsistencia(asignacionId, nuevaFecha)
    else if (fds) {
      setEstudiantes([])
      setEstados({})
      setObservaciones({})
      setHayRegistros(false)
    }
  }

  function onCambiarEstado(estudianteId: string, estado: EstadoAsistencia) {
    setEstados((prev) => ({ ...prev, [estudianteId]: estado }))
    if (estado === 'presente') {
      setObservaciones((prev) => { const next = { ...prev }; delete next[estudianteId]; return next })
    }
  }

  function onCambiarObservacion(estudianteId: string, observacion: string) {
    setObservaciones((prev) => ({ ...prev, [estudianteId]: observacion }))
  }

  function marcarTodosPresente() {
    const mapa: EstadoMap = {}
    estudiantes.forEach((e) => { mapa[e.id] = 'presente' })
    setEstados(mapa)
    setObservaciones({})
    setGuardado(false)
  }

  function guardar() {
    startTransition(async () => {
      const registros = estudiantes.map((e) => ({
        estudiante_id: e.id,
        estado: estados[e.id] ?? 'presente',
        observacion: observaciones[e.id] ?? '',
      }))
      await registrarAsistencia(asignacionId, fecha, registros)
      setGuardado(true)
      setHayRegistros(true)
    })
  }

  // ── resumen ───────────────────────────────────────────────────────────────

  function consultarResumen() {
    if (!resumenAsignacionId) return
    setCargandoResumen(true)
    setResumenConsultado(true)
    getResumenAsistencia(resumenAsignacionId, desde, hasta)
      .then(setResumenData)
      .finally(() => setCargandoResumen(false))
  }

  // ── filas tabla ───────────────────────────────────────────────────────────

  const filas = estudiantes.map((e) => ({
    estudiante_id: e.id,
    nombre: e.nombre,
    apellido: e.apellido,
    estado: estados[e.id] ?? 'presente',
    observacion: observaciones[e.id] ?? '',
  }))

  const asigSeleccionada = asignaciones.find((a) => a.id === asignacionId)

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Tabs nivel superior (rector) ── */}
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
          {/* Sub-tabs rector: Día a día / Resumen */}
          {esRector && (
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
              <button
                onClick={() => setVistaRector('dia')}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  vistaRector === 'dia' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Día a día
              </button>
              <button
                onClick={() => setVistaRector('resumen')}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  vistaRector === 'resumen' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                Resumen
              </button>
            </div>
          )}

          {/* ══ VISTA: RESUMEN (rector) ══ */}
          {esRector && vistaRector === 'resumen' && (
            <>
              {/* Filtros resumen */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Grupo / Materia / Docente</label>
                    <select
                      value={resumenAsignacionId}
                      onChange={(e) => setResumenAsignacionId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    >
                      <option value="">Selecciona una asignación…</option>
                      {asignaciones.map((a) => {
                        const rector = a as AsignacionRector
                        const docente = rector.profiles ? ` · ${rector.profiles.nombre} ${rector.profiles.apellido}` : ''
                        return (
                          <option key={a.id} value={a.id}>
                            {a.grupos?.nombre} — {a.materias?.nombre}{docente}
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Desde</label>
                    <input
                      type="date"
                      value={desde}
                      max={hasta}
                      onChange={(e) => setDesde(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Hasta</label>
                    <input
                      type="date"
                      value={hasta}
                      min={desde}
                      max={hoy}
                      onChange={(e) => setHasta(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    onClick={consultarResumen}
                    disabled={!resumenAsignacionId || cargandoResumen}
                    loading={cargandoResumen}
                  >
                    Consultar
                  </Button>
                </div>
              </div>

              {/* Resultado resumen */}
              {cargandoResumen && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
                  <p className="text-slate-400 text-sm">Calculando resumen…</p>
                </div>
              )}
              {!cargandoResumen && resumenConsultado && (
                <ResumenTable filas={resumenData} asignacionId={resumenAsignacionId} />
              )}
              {!resumenConsultado && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
                  <p className="text-slate-400 text-sm">Selecciona una asignación y un rango de fechas para ver el resumen.</p>
                </div>
              )}
            </>
          )}

          {/* ══ VISTA: DÍA A DÍA (rector y docente) ══ */}
          {(!esRector || vistaRector === 'dia') && (
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
                      className={cn(
                        'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 transition-all',
                        esFinDeSemana
                          ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-500/20'
                          : 'border-slate-200 focus:border-primary-400 focus:ring-primary-500/20'
                      )}
                    />
                  </div>
                </div>

                {/* Banner fin de semana */}
                {esFinDeSemana && (
                  <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2 text-sm text-amber-700">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    Esta fecha es fin de semana — no se registra asistencia en días no hábiles.
                  </div>
                )}

                {asigSeleccionada && !esFinDeSemana && (
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

              {/* Estado vacío */}
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
              {asignacionId && !cargando && !esFinDeSemana && esRector && estudiantes.length > 0 && !hayRegistros && (
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

              {/* Contador en tiempo real + tabla */}
              {asignacionId && !cargando && !esFinDeSemana && estudiantes.length > 0 && (!esRector || hayRegistros) && (
                <>
                  {/* Contador */}
                  <div className="flex items-center gap-4 px-1 text-sm flex-wrap">
                    <span className="flex items-center gap-1.5 font-medium text-secondary-700">
                      <span className="w-2 h-2 rounded-full bg-secondary-500 inline-block" />
                      {conteo.presente} presente{conteo.presente !== 1 ? 's' : ''}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1.5 font-medium text-red-600">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      {conteo.ausente} ausente{conteo.ausente !== 1 ? 's' : ''}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1.5 font-medium text-amber-600">
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                      {conteo.tarde} tarde{conteo.tarde !== 1 ? 's' : ''}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-500">
                      <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                      {conteo.excusa} excusa{conteo.excusa !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <AsistenciaTable
                    filas={filas}
                    fecha={fecha}
                    onCambiarEstado={onCambiarEstado}
                    onCambiarObservacion={onCambiarObservacion}
                    readonly={esRector}
                  />

                  {!esRector && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={marcarTodosPresente} disabled={isPending}>
                          Marcar todos presente
                        </Button>
                        {guardado && (
                          <p className="text-sm text-secondary-600 font-medium">✓ Asistencia guardada correctamente</p>
                        )}
                      </div>
                      <Button onClick={guardar} loading={isPending} disabled={isPending}>
                        Guardar asistencia
                      </Button>
                    </div>
                  )}
                </>
              )}

              {asignacionId && !cargando && estudiantes.length === 0 && !esFinDeSemana && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
                  <p className="text-slate-400 text-sm">No hay estudiantes en este grupo</p>
                </div>
              )}
            </>
          )}
        </>
      )}

    </div>
  )
}
