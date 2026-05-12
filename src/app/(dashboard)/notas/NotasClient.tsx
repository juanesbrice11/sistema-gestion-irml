'use client'

import { useState, useTransition, useMemo } from 'react'
import { ActividadesPanel } from '@/components/notas/ActividadesPanel'
import { NotasTabla } from '@/components/notas/NotasTabla'
import { PesosPanel } from '@/components/notas/PesosPanel'
import { InformesPanel } from '@/components/notas/InformesPanel'
import {
  getActividades,
  getCalificacionesPorPeriodo,
  guardarCalificaciones,
  getPesosPeriodo,
  type Actividad,
  type Calificacion,
  type PesoPeriodo,
} from '@/actions/notas'
import { getEstudiantesPorGrupo } from '@/actions/asistencia'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Periodo } from '@/types/database'

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

// notasMap: estudianteId → actividadId → valor
type NotasMap = Record<string, Record<string, number | undefined>>

interface Props {
  asignaciones: (Asignacion | AsignacionRector)[]
  periodos: Periodo[]
  esRector: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcularDefinitiva(notas: Record<string, number | undefined>, actividades: Actividad[]): number | null {
  const sumPct = actividades.reduce((acc, a) => acc + Number(a.porcentaje), 0)
  if (sumPct === 0) return null
  const hayAlguna = actividades.some((a) => notas[a.id] !== undefined)
  if (!hayAlguna) return null
  const suma = actividades.reduce((acc, a) => {
    const v = notas[a.id]
    return acc + (v !== undefined ? (v * Number(a.porcentaje)) / 100 : 0)
  }, 0)
  return Number((suma * (100 / sumPct)).toFixed(2))
}

// ─── Componente ──────────────────────────────────────────────────────────────

type Tab = 'notas' | 'pesos' | 'informes'

export default function NotasClient({ asignaciones, periodos, esRector }: Props) {
  const [tab, setTab] = useState<Tab>(esRector ? 'informes' : 'notas')
  const [asignacionId, setAsignacionId] = useState('')
  const [periodoId, setPeriodoId] = useState('')
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [notasMap, setNotasMap] = useState<NotasMap>({})
  const [pesos, setPesos] = useState<PesoPeriodo[]>([])
  const [cargando, setCargando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [isPending, startTransition] = useTransition()

  const asigSeleccionada = asignaciones.find((a) => a.id === asignacionId)

  // ── Carga de datos ────────────────────────────────────────────────────────

  async function cargar(asigId: string, perId: string) {
    if (!asigId || !perId) return
    setCargando(true)
    setGuardado(false)

    const asig = asignaciones.find((a) => a.id === asigId)
    const grupoId = asig?.grupos?.id
    if (!grupoId) { setCargando(false); return }

    const [alumnos, acts, califs, pesosData] = await Promise.all([
      getEstudiantesPorGrupo(grupoId),
      getActividades(asigId, perId),
      getCalificacionesPorPeriodo(asigId, perId),
      getPesosPeriodo(asigId, periodos),
    ])

    setEstudiantes(alumnos ?? [])
    setActividades(acts)
    setPesos(pesosData)

    const mapa: NotasMap = {}
    alumnos?.forEach((e) => { mapa[e.id] = {} })
    califs.forEach((c: Calificacion) => {
      if (!mapa[c.estudiante_id]) mapa[c.estudiante_id] = {}
      mapa[c.estudiante_id][c.actividad_id] = Number(c.valor)
    })
    setNotasMap(mapa)
    setCargando(false)
  }

  function onSeleccionarAsignacion(id: string) {
    setAsignacionId(id)
    setEstudiantes([])
    setActividades([])
    setNotasMap({})
    if (id && periodoId) cargar(id, periodoId)
  }

  function onSeleccionarPeriodo(id: string) {
    setPeriodoId(id)
    setEstudiantes([])
    setActividades([])
    setNotasMap({})
    if (asignacionId && id) cargar(asignacionId, id)
  }

  function onActividadesActualizadas(acts: Actividad[]) {
    setActividades(acts)
  }

  function onCambiarNota(estudianteId: string, actividadId: string, valor: number | undefined) {
    setNotasMap((prev) => ({
      ...prev,
      [estudianteId]: { ...prev[estudianteId], [actividadId]: valor },
    }))
    setGuardado(false)
  }

  function guardarTodas() {
    startTransition(async () => {
      const payload: Calificacion[] = []
      for (const e of estudiantes) {
        for (const a of actividades) {
          const v = notasMap[e.id]?.[a.id]
          if (v !== undefined) {
            payload.push({ actividad_id: a.id, estudiante_id: e.id, valor: v })
          }
        }
      }
      await guardarCalificaciones(payload)
      setGuardado(true)
    })
  }

  // ── Filas de la tabla ─────────────────────────────────────────────────────

  const filas = useMemo(() =>
    estudiantes.map((e) => ({
      estudiante_id: e.id,
      nombre: e.nombre,
      apellido: e.apellido,
      notas: notasMap[e.id] ?? {},
      definitiva: calcularDefinitiva(notasMap[e.id] ?? {}, actividades),
    })),
    [estudiantes, notasMap, actividades]
  )

  // ── Render ────────────────────────────────────────────────────────────────

  const TABS: { key: Tab; label: string }[] = esRector
    ? [{ key: 'informes', label: 'Informes' }]
    : [
        { key: 'notas', label: 'Ingreso de notas' },
        { key: 'pesos', label: 'Pesos periodos' },
        { key: 'informes', label: 'Informes' },
      ]

  const listo = asignacionId && periodoId && !cargando

  return (
    <div className="space-y-5">

      {/* Tabs */}
      {!esRector && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ══ Informes ══ */}
      {tab === 'informes' && (
        <>
          {/* Selector asignación */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
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
                  const r = a as AsignacionRector
                  const d = r.profiles ? ` · ${r.profiles.nombre} ${r.profiles.apellido}` : ''
                  return <option key={a.id} value={a.id}>{a.grupos?.nombre} — {a.materias?.nombre}{d}</option>
                })}
              </select>
            </div>
          </div>

          {!asignacionId && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <p className="text-slate-400 text-sm">Selecciona una asignación para generar informes</p>
            </div>
          )}

          {asignacionId && cargando && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <p className="text-slate-400 text-sm">Cargando…</p>
            </div>
          )}

          {asignacionId && !cargando && asigSeleccionada && (
            <InformesPanel
              asignacionId={asignacionId}
              grupoId={asigSeleccionada.grupos?.id ?? ''}
              grupoNombre={asigSeleccionada.grupos?.nombre ?? ''}
              materiaNombre={asigSeleccionada.materias?.nombre ?? ''}
              periodos={periodos}
              estudiantes={estudiantes}
              esRector={esRector}
            />
          )}
        </>
      )}

      {/* ══ Ingreso de notas ══ */}
      {tab === 'notas' && (
        <>
          {/* Selectores */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">Grupo y materia</label>
                <select
                  value={asignacionId}
                  onChange={(e) => onSeleccionarAsignacion(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                >
                  <option value="">Selecciona una asignación…</option>
                  {asignaciones.map((a) => (
                    <option key={a.id} value={a.id}>{a.grupos?.nombre} — {a.materias?.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Periodo</label>
                <select
                  value={periodoId}
                  onChange={(e) => onSeleccionarPeriodo(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                >
                  <option value="">Selecciona periodo…</option>
                  {periodos.map((p) => (
                    <option key={p.id} value={p.id}>Periodo {p.numero}</option>
                  ))}
                </select>
              </div>
            </div>

            {asigSeleccionada && periodoId && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500">
                <span><span className="font-medium text-slate-700">{asigSeleccionada.grupos?.grados?.nombre}</span> {asigSeleccionada.grupos?.nombre}</span>
                <span>·</span>
                <span>{asigSeleccionada.materias?.nombre}</span>
                <span>·</span>
                <span>{estudiantes.length} estudiantes</span>
              </div>
            )}
          </div>

          {(!asignacionId || !periodoId) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <p className="text-slate-400 text-sm">Selecciona un grupo, materia y periodo para comenzar</p>
            </div>
          )}

          {asignacionId && periodoId && cargando && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <p className="text-slate-400 text-sm">Cargando…</p>
            </div>
          )}

          {listo && (
            <>
              <ActividadesPanel
                actividades={actividades}
                asignacionId={asignacionId}
                periodoId={periodoId}
                onActualizadas={onActividadesActualizadas}
                readonly={esRector}
              />

              {estudiantes.length > 0 && (
                <>
                  <NotasTabla
                    filas={filas}
                    actividades={actividades}
                    onCambiarNota={onCambiarNota}
                    readonly={esRector}
                  />

                  {!esRector && actividades.length > 0 && (
                    <div className="flex items-center justify-between">
                      {guardado
                        ? <p className="text-sm text-secondary-600 font-medium">✓ Notas guardadas correctamente</p>
                        : <span />}
                      <Button onClick={guardarTodas} loading={isPending} disabled={isPending}>
                        Guardar notas
                      </Button>
                    </div>
                  )}
                </>
              )}

              {estudiantes.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
                  <p className="text-slate-400 text-sm">No hay estudiantes en este grupo</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══ Pesos periodos ══ */}
      {tab === 'pesos' && (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Grupo y materia</label>
              <select
                value={asignacionId}
                onChange={(e) => onSeleccionarAsignacion(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              >
                <option value="">Selecciona una asignación…</option>
                {asignaciones.map((a) => (
                  <option key={a.id} value={a.id}>{a.grupos?.nombre} — {a.materias?.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {!asignacionId && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <p className="text-slate-400 text-sm">Selecciona una asignación para configurar los pesos</p>
            </div>
          )}

          {asignacionId && pesos.length > 0 && (
            <PesosPanel
              asignacionId={asignacionId}
              periodos={periodos}
              pesos={pesos}
              onGuardado={setPesos}
            />
          )}

          {asignacionId && pesos.length === 0 && cargando && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <p className="text-slate-400 text-sm">Cargando…</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
