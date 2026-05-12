'use client'

import { cn } from '@/lib/utils'
import type { Actividad } from '@/actions/notas'

interface Fila {
  estudiante_id: string
  nombre: string
  apellido: string
  notas: Record<string, number | undefined>   // actividadId → valor
  definitiva: number | null
}

interface Props {
  filas: Fila[]
  actividades: Actividad[]
  onCambiarNota: (estudianteId: string, actividadId: string, valor: number | undefined) => void
  readonly?: boolean
}

function colorNota(n: number | null | undefined) {
  if (n === null || n === undefined) return 'text-slate-400'
  if (n >= 3.0) return 'text-secondary-700 font-semibold'
  return 'text-red-600 font-semibold'
}

export function NotasTabla({ filas, actividades, onCambiarNota, readonly }: Props) {
  if (actividades.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
        <p className="text-slate-400 text-sm">Crea al menos una actividad para ingresar notas.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
      <table className="w-full text-sm min-w-max">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide sticky left-0 bg-slate-50">
              Estudiante
            </th>
            {actividades.map((a) => (
              <th key={a.id} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide min-w-[100px]">
                <div>{a.nombre}</div>
                <div className="text-primary-500 font-normal normal-case">{Number(a.porcentaje).toFixed(0)}%</div>
              </th>
            ))}
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Definitiva
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {filas.map((fila) => (
            <tr key={fila.estudiante_id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-2.5 font-medium text-slate-900 sticky left-0 bg-white">
                {fila.apellido}, {fila.nombre}
              </td>
              {actividades.map((a) => (
                <td key={a.id} className="text-center px-3 py-2">
                  {readonly ? (
                    <span className={cn('text-sm', colorNota(fila.notas[a.id] ?? null))}>
                      {fila.notas[a.id] !== undefined ? Number(fila.notas[a.id]).toFixed(1) : '—'}
                    </span>
                  ) : (
                    <input
                      type="number"
                      min={0}
                      max={5}
                      step={0.1}
                      value={fila.notas[a.id] !== undefined ? fila.notas[a.id] : ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? undefined : parseFloat(e.target.value)
                        if (val === undefined || (val >= 0 && val <= 5)) {
                          onCambiarNota(fila.estudiante_id, a.id, val)
                        }
                      }}
                      placeholder="—"
                      className={cn(
                        'w-16 text-center rounded-lg border px-2 py-1 text-sm focus:outline-none focus:ring-2 transition-all',
                        fila.notas[a.id] !== undefined && fila.notas[a.id]! < 3.0
                          ? 'border-red-200 text-red-700 focus:border-red-400 focus:ring-red-500/20'
                          : 'border-slate-200 text-slate-900 focus:border-primary-400 focus:ring-primary-500/20'
                      )}
                    />
                  )}
                </td>
              ))}
              <td className="text-center px-4 py-2.5">
                <span className={cn('text-sm px-2.5 py-1 rounded-lg',
                  fila.definitiva === null
                    ? 'text-slate-400'
                    : fila.definitiva >= 3.0
                    ? 'bg-secondary-50 text-secondary-700 font-semibold'
                    : 'bg-red-50 text-red-700 font-semibold'
                )}>
                  {fila.definitiva !== null ? fila.definitiva.toFixed(2) : '—'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
