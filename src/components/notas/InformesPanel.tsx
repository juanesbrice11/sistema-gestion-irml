'use client'

import { useState, useTransition } from 'react'
import { getResumenEstudiante, getResumenGrupo, type ResumenEstudianteData, type ResumenPeriodo } from '@/actions/notas'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { Periodo } from '@/types/database'

interface Props {
  asignacionId: string
  grupoId: string
  grupoNombre: string
  materiaNombre: string
  periodos: Periodo[]
  estudiantes: { id: string; nombre: string; apellido: string }[]
  esRector: boolean
}

function colorNota(n: number | null) {
  if (n === null) return 'text-slate-400'
  return n >= 3.0 ? 'text-secondary-700 font-semibold' : 'text-red-600 font-semibold'
}

function badgeAprobo(aprobo: boolean | null) {
  if (aprobo === null) return null
  return aprobo
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">Aprobó</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Reprobó</span>
}

// ── Vista visual de un estudiante ─────────────────────────────────────────────
function ResumenVisual({ data, periodos }: { data: ResumenEstudianteData; periodos: Periodo[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-900">{data.apellido}, {data.nombre}</h4>
        <div className="flex items-center gap-3">
          {data.definitiva_anio !== null && (
            <span className={`text-sm font-bold ${colorNota(data.definitiva_anio)}`}>
              Definitiva año: {data.definitiva_anio.toFixed(2)}
            </span>
          )}
          {data.definitiva_anio !== null && badgeAprobo(data.aprobo)}
        </div>
      </div>

      {data.periodos.map((rp, i) => {
        const periodo = periodos[i]
        return (
          <div key={rp.periodoId} className="border border-slate-100 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-700 text-sm">Periodo {rp.periodoNumero}</span>
                {periodo && (
                  <span className="text-xs text-slate-400 ml-2">
                    {formatDate(periodo.fecha_inicio)} – {formatDate(periodo.fecha_fin)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Peso: {rp.peso}%</span>
                {rp.definitiva !== null && (
                  <span className={`text-sm font-bold ${colorNota(rp.definitiva)}`}>
                    {rp.definitiva.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            {rp.actividades.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">Actividad</th>
                    <th className="text-center px-3 py-2 text-xs text-slate-500 font-medium">%</th>
                    <th className="text-center px-3 py-2 text-xs text-slate-500 font-medium">Nota</th>
                    <th className="text-center px-3 py-2 text-xs text-slate-500 font-medium">Aporte</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rp.actividades.map((a) => {
                    const aporte = a.valor !== null
                      ? Number(((a.valor * a.porcentaje) / 100).toFixed(3))
                      : null
                    return (
                      <tr key={a.id}>
                        <td className="px-4 py-2 text-slate-700">{a.nombre}</td>
                        <td className="text-center px-3 py-2 text-slate-500">{a.porcentaje}%</td>
                        <td className={`text-center px-3 py-2 ${colorNota(a.valor)}`}>
                          {a.valor !== null ? a.valor.toFixed(1) : '—'}
                        </td>
                        <td className={`text-center px-3 py-2 ${colorNota(aporte)}`}>
                          {aporte !== null ? aporte.toFixed(3) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            ) : (
              <p className="px-4 py-3 text-xs text-slate-400">Sin actividades configuradas.</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Panel principal ───────────────────────────────────────────────────────────
export function InformesPanel({
  asignacionId, grupoId, grupoNombre, materiaNombre, periodos, estudiantes,
}: Props) {
  const [tipo, setTipo] = useState<'individual' | 'grupo'>('individual')
  const [estudianteId, setEstudianteId] = useState('')
  const [resumenIndividual, setResumenIndividual] = useState<ResumenEstudianteData | null>(null)
  const [resumenGrupo, setResumenGrupo] = useState<ResumenEstudianteData[]>([])
  const [consultado, setConsultado] = useState(false)
  const [isPending, startTransition] = useTransition()

  function consultar() {
    startTransition(async () => {
      setConsultado(true)
      if (tipo === 'individual') {
        const periodoResumen = await getResumenEstudiante(asignacionId, estudianteId, periodos)
        const est = estudiantes.find((e) => e.id === estudianteId)
        if (!est) return
        let definitiva_anio: number | null = null
        let sumaP = 0, totalP = 0, algunoConNota = false
        periodoResumen.forEach((p) => {
          if (p.definitiva !== null) {
            sumaP += p.definitiva * (p.peso / 100)
            totalP += p.peso
            algunoConNota = true
          }
        })
        if (algunoConNota && totalP > 0) definitiva_anio = Number((sumaP * (100 / totalP)).toFixed(2))
        setResumenIndividual({
          estudianteId: est.id, nombre: est.nombre, apellido: est.apellido,
          periodos: periodoResumen, definitiva_anio, aprobo: definitiva_anio !== null && definitiva_anio >= 3.0,
        })
      } else {
        const data = await getResumenGrupo(asignacionId, grupoId, periodos)
        setResumenGrupo(data)
      }
    })
  }

  async function descargarPDF() {
    const { generarPDF } = await import('@/lib/pdf/notas-pdf')
    if (tipo === 'individual' && resumenIndividual) {
      generarPDF({
        tipo: 'individual',
        materia: materiaNombre,
        grupo: grupoNombre,
        periodos,
        datos: [resumenIndividual],
      })
    } else if (tipo === 'grupo' && resumenGrupo.length > 0) {
      generarPDF({
        tipo: 'grupo',
        materia: materiaNombre,
        grupo: grupoNombre,
        periodos,
        datos: resumenGrupo,
      })
    }
  }

  const puedeConsultar =
    tipo === 'grupo' || (tipo === 'individual' && estudianteId !== '')
  const hayDatos =
    (tipo === 'individual' && resumenIndividual !== null) ||
    (tipo === 'grupo' && resumenGrupo.length > 0)

  return (
    <div className="space-y-5">
      {/* Opciones */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h3 className="font-semibold text-slate-800 text-sm">Generar informe</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Tipo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Tipo de informe</label>
            <div className="flex gap-2">
              {(['individual', 'grupo'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTipo(t); setConsultado(false); setResumenIndividual(null); setResumenGrupo([]) }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                    tipo === t
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'
                  }`}
                >
                  {t === 'individual' ? 'Individual' : 'Todo el grupo'}
                </button>
              ))}
            </div>
          </div>

          {/* Selector estudiante */}
          {tipo === 'individual' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Estudiante</label>
              <select
                value={estudianteId}
                onChange={(e) => { setEstudianteId(e.target.value); setConsultado(false); setResumenIndividual(null) }}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              >
                <option value="">Selecciona un estudiante…</option>
                {estudiantes.map((e) => (
                  <option key={e.id} value={e.id}>{e.apellido}, {e.nombre}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={consultar} loading={isPending} disabled={!puedeConsultar || isPending}>
            Ver informe
          </Button>
          {hayDatos && (
            <Button size="sm" variant="secondary" onClick={descargarPDF}>
              ↓ Descargar PDF
            </Button>
          )}
        </div>
      </div>

      {/* Vista del informe */}
      {consultado && !isPending && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="pb-3 border-b border-slate-100">
            <p className="text-xs text-slate-400">{grupoNombre} · {materiaNombre}</p>
            <h3 className="font-semibold text-slate-900 mt-1">
              {tipo === 'individual' ? 'Informe individual' : `Informe del grupo (${resumenGrupo.length} estudiantes)`}
            </h3>
          </div>

          {tipo === 'individual' && resumenIndividual && (
            <ResumenVisual data={resumenIndividual} periodos={periodos} />
          )}

          {tipo === 'grupo' && resumenGrupo.length > 0 && (
            <div className="space-y-8 divide-y divide-slate-100">
              {resumenGrupo.map((d) => (
                <div key={d.estudianteId} className="pt-6 first:pt-0">
                  <ResumenVisual data={d} periodos={periodos} />
                </div>
              ))}
            </div>
          )}

          {tipo === 'grupo' && resumenGrupo.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">No hay datos de notas para este grupo.</p>
          )}
        </div>
      )}
    </div>
  )
}
