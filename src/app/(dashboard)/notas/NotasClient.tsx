'use client'

import { useState, useTransition } from 'react'
import { NotasTable } from '@/components/notas/NotasTable'
import { getEstudiantesPorGrupo } from '@/actions/asistencia'
import { getNotasByAsignacion, guardarNota } from '@/actions/notas'
import { Button } from '@/components/ui/button'
import type { Periodo } from '@/types/database'

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
type NotaState = { nota1?: number; nota2?: number; nota3?: number; definitiva?: number }
type NotasMap = Record<string, NotaState>

interface Props {
  asignaciones: (Asignacion | AsignacionRector)[]
  periodos: Periodo[]
  esRector: boolean
}

export default function NotasClient({ asignaciones, periodos, esRector }: Props) {
  const [asignacionId, setAsignacionId] = useState('')
  const [periodoId, setPeriodoId] = useState('')
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [notasMap, setNotasMap] = useState<NotasMap>({})
  const [cargando, setCargando] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [tableKey, setTableKey] = useState(0)

  async function cargarNotas(asigId: string, perId: string) {
    if (!asigId || !perId) return
    setCargando(true)
    setGuardado(false)

    const asig = asignaciones.find((a) => a.id === asigId)
    const grupoId = asig?.grupos?.id
    if (!grupoId) { setCargando(false); return }

    const [alumnos, notasData] = await Promise.all([
      getEstudiantesPorGrupo(grupoId),
      getNotasByAsignacion(asigId, perId),
    ])

    const mapa: NotasMap = {}
    alumnos?.forEach((e) => { mapa[e.id] = {} })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    notasData?.forEach((n: any) => {
      mapa[n.estudiante_id] = {
        nota1: n.nota1,
        nota2: n.nota2,
        nota3: n.nota3,
        definitiva: n.definitiva,
      }
    })

    setEstudiantes(alumnos ?? [])
    setNotasMap(mapa)
    setTableKey((k) => k + 1)
    setCargando(false)
  }

  function onSeleccionarAsignacion(id: string) {
    setAsignacionId(id)
    if (periodoId) cargarNotas(id, periodoId)
    else { setEstudiantes([]); setNotasMap({}) }
  }

  function onSeleccionarPeriodo(id: string) {
    setPeriodoId(id)
    if (asignacionId) cargarNotas(asignacionId, id)
    else { setEstudiantes([]); setNotasMap({}) }
  }

  function onCambiarNota(estudianteId: string, campo: 'nota1' | 'nota2' | 'nota3', valor: number) {
    setNotasMap((prev) => {
      const actual = prev[estudianteId] ?? {}
      const nuevas = { ...actual, [campo]: valor }
      const vals = [nuevas.nota1, nuevas.nota2, nuevas.nota3].filter((v): v is number => v !== undefined)
      const definitiva = vals.length > 0
        ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1))
        : undefined
      return { ...prev, [estudianteId]: { ...nuevas, definitiva } }
    })
    setGuardado(false)
  }

  function guardarTodas() {
    startTransition(async () => {
      await Promise.all(
        estudiantes.map((e) => {
          const n = notasMap[e.id] ?? {}
          return guardarNota({
            asignacion_id: asignacionId,
            estudiante_id: e.id,
            periodo_id: periodoId,
            nota1: n.nota1,
            nota2: n.nota2,
            nota3: n.nota3,
          })
        })
      )
      setGuardado(true)
    })
  }

  const filas = estudiantes.map((e) => ({
    estudiante_id: e.id,
    nombre: e.nombre,
    apellido: e.apellido,
    ...(notasMap[e.id] ?? {}),
  }))

  const asigSeleccionada = asignaciones.find((a) => a.id === asignacionId)
  const listo = asignacionId && periodoId && !cargando

  return (
    <div className="space-y-5">

      {/* Selectores */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Asignación */}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
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

          {/* Periodo */}
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
      {(!asignacionId || !periodoId) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <p className="text-slate-400 text-sm">Selecciona un grupo, materia y periodo para comenzar</p>
        </div>
      )}

      {/* Cargando */}
      {asignacionId && periodoId && cargando && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <p className="text-slate-400 text-sm">Cargando notas…</p>
        </div>
      )}

      {/* Tabla */}
      {listo && estudiantes.length > 0 && (
        <>
          <NotasTable
            key={tableKey}
            filas={filas}
            onCambiarNota={onCambiarNota}
            readonly={esRector}
          />

          {!esRector && (
            <div className="flex items-center justify-between">
              {guardado ? (
                <p className="text-sm text-secondary-600 font-medium">✓ Notas guardadas correctamente</p>
              ) : <span />}
              <Button onClick={guardarTodas} loading={isPending} disabled={isPending}>
                Guardar notas
              </Button>
            </div>
          )}
        </>
      )}

      {/* Sin estudiantes */}
      {listo && estudiantes.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <p className="text-slate-400 text-sm">No hay estudiantes en este grupo</p>
        </div>
      )}

    </div>
  )
}
