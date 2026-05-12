'use client'

import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { EstadoAsistencia } from '@/types/database'

const estadoConfig: Record<EstadoAsistencia, { label: string; className: string }> = {
  presente: { label: 'Presente', className: 'bg-secondary-50 text-secondary-700 border-secondary-200' },
  ausente:  { label: 'Ausente',  className: 'bg-red-50 text-red-700 border-red-200' },
  tarde:    { label: 'Tarde',    className: 'bg-amber-50 text-amber-700 border-amber-200' },
  excusa:   { label: 'Excusa',   className: 'bg-slate-50 text-slate-600 border-slate-200' },
}

const CON_MOTIVO: EstadoAsistencia[] = ['ausente', 'tarde', 'excusa']

interface Fila {
  estudiante_id: string
  nombre: string
  apellido: string
  estado: EstadoAsistencia
  observacion: string
}

interface AsistenciaTableProps {
  filas: Fila[]
  fecha: string
  onCambiarEstado: (estudianteId: string, estado: EstadoAsistencia) => void
  onCambiarObservacion: (estudianteId: string, observacion: string) => void
  readonly?: boolean
}

export function AsistenciaTable({
  filas,
  fecha,
  onCambiarEstado,
  onCambiarObservacion,
  readonly,
}: AsistenciaTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">
          {filas.length} estudiantes · {formatDate(fecha)}
        </p>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Estudiante
            </th>
            {(Object.keys(estadoConfig) as EstadoAsistencia[]).map((estado) => (
              <th
                key={estado}
                className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                {estadoConfig[estado].label}
              </th>
            ))}
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Motivo
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {filas.map((fila) => {
            const requiereMotivo = CON_MOTIVO.includes(fila.estado)
            return (
              <tr key={fila.estudiante_id} className="hover:bg-slate-50/50 transition-colors">
                {/* Nombre */}
                <td className="px-5 py-3 font-medium text-slate-900">
                  {fila.apellido}, {fila.nombre}
                </td>

                {/* Radio botones de estado */}
                {(Object.keys(estadoConfig) as EstadoAsistencia[]).map((estado) => (
                  <td key={estado} className="text-center px-3 py-3">
                    <button
                      type="button"
                      disabled={readonly}
                      onClick={() => onCambiarEstado(fila.estudiante_id, estado)}
                      className={cn(
                        'w-6 h-6 rounded-full border-2 mx-auto block transition-all duration-150',
                        fila.estado === estado
                          ? estadoConfig[estado].className + ' border-current scale-110'
                          : 'border-slate-200 hover:border-slate-300',
                        readonly && 'cursor-default'
                      )}
                    />
                  </td>
                ))}

                {/* Motivo */}
                <td className="px-4 py-2">
                  {requiereMotivo ? (
                    readonly ? (
                      <span className="text-slate-600 text-xs italic">
                        {fila.observacion || <span className="text-slate-300">Sin motivo</span>}
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={fila.observacion}
                        onChange={(e) => onCambiarObservacion(fila.estudiante_id, e.target.value)}
                        placeholder="Escribe el motivo…"
                        maxLength={200}
                        className="w-full min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                      />
                    )
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
