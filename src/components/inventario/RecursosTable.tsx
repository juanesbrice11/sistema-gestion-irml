'use client'

import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { EstadoRecurso } from '@/types/database'

const estadoConfig: Record<EstadoRecurso, { label: string; className: string }> = {
  disponible:    { label: 'Disponible',    className: 'bg-secondary-50 text-secondary-700' },
  prestado:      { label: 'Prestado',      className: 'bg-amber-50 text-amber-700' },
  mantenimiento: { label: 'Mantenimiento', className: 'bg-blue-50 text-blue-700' },
  dado_de_baja:  { label: 'Dado de baja',  className: 'bg-slate-100 text-slate-500' },
}

interface Recurso {
  id: string
  nombre: string
  codigo: string
  estado: EstadoRecurso
  cantidad: number
  ubicacion?: string
  categoria: string
  created_at: string
}

interface RecursosTableProps {
  recursos: Recurso[]
  onPrestar?: (id: string) => void
  onDevolver?: (id: string) => void
}

export function RecursosTable({ recursos, onPrestar, onDevolver }: RecursosTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Recurso</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Categoría</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cantidad</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ubicación</th>
            <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {recursos.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-5 py-3">
                <p className="font-medium text-slate-900">{r.nombre}</p>
                <p className="text-xs text-slate-400 mt-0.5">{r.codigo}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">{r.categoria}</td>
              <td className="px-4 py-3 text-center text-slate-700 font-medium">{r.cantidad}</td>
              <td className="px-4 py-3 text-slate-500">{r.ubicacion ?? '—'}</td>
              <td className="px-4 py-3 text-center">
                <span className={cn(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
                  estadoConfig[r.estado].className
                )}>
                  {estadoConfig[r.estado].label}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {r.estado === 'disponible' && onPrestar && (
                  <button
                    onClick={() => onPrestar(r.id)}
                    className="text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors"
                  >
                    Prestar
                  </button>
                )}
                {r.estado === 'prestado' && onDevolver && (
                  <button
                    onClick={() => onDevolver(r.id)}
                    className="text-xs font-medium text-secondary-600 hover:text-secondary-800 transition-colors"
                  >
                    Devolver
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
