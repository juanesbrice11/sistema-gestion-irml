'use client'

import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { EstadoAsistencia } from '@/types/database'

const estadoConfig: Record<EstadoAsistencia, { label: string; className: string }> = {
  presente:  { label: 'Presente',  className: 'bg-secondary-50 text-secondary-700 border-secondary-200' },
  ausente:   { label: 'Ausente',   className: 'bg-red-50 text-red-700 border-red-200' },
  tarde:     { label: 'Tarde',     className: 'bg-amber-50 text-amber-700 border-amber-200' },
  excusa:    { label: 'Excusa',    className: 'bg-slate-50 text-slate-600 border-slate-200' },
}

interface Fila {
  estudiante_id: string
  nombre: string
  apellido: string
  estado: EstadoAsistencia
}

interface AsistenciaTableProps {
  filas: Fila[]
  fecha: string
  onCambiarEstado: (estudianteId: string, estado: EstadoAsistencia) => void
  readonly?: boolean
}

export function AsistenciaTable({ filas, fecha, onCambiarEstado, readonly }: AsistenciaTableProps) {
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
              <th key={estado} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {estadoConfig[estado].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {filas.map((fila) => (
            <tr key={fila.estudiante_id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-3 font-medium text-slate-900">
                {fila.apellido}, {fila.nombre}
              </td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
