'use client'

import { cn } from '@/lib/utils'

interface FilaNota {
  estudiante_id: string
  nombre: string
  apellido: string
  nota1?: number
  nota2?: number
  nota3?: number
  definitiva?: number
}

interface NotasTableProps {
  filas: FilaNota[]
  onCambiarNota: (estudianteId: string, campo: 'nota1' | 'nota2' | 'nota3', valor: number) => void
  readonly?: boolean
}

function colorDefinitiva(nota?: number) {
  if (nota === undefined) return 'text-slate-400'
  if (nota >= 6) return 'text-secondary-700 font-semibold'
  return 'text-red-600 font-semibold'
}

export function NotasTable({ filas, onCambiarNota, readonly }: NotasTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Estudiante
            </th>
            {(['nota1', 'nota2', 'nota3'] as const).map((n, i) => (
              <th key={n} className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Nota {i + 1}
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
              <td className="px-5 py-3 font-medium text-slate-900">
                {fila.apellido}, {fila.nombre}
              </td>
              {(['nota1', 'nota2', 'nota3'] as const).map((campo) => (
                <td key={campo} className="text-center px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    max={10}
                    step={0.1}
                    disabled={readonly}
                    defaultValue={fila[campo]}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value)
                      if (!isNaN(val)) onCambiarNota(fila.estudiante_id, campo, val)
                    }}
                    className={cn(
                      'w-16 text-center rounded-lg border border-slate-200 px-2 py-1.5 text-sm',
                      'focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
                      'disabled:bg-transparent disabled:border-transparent disabled:cursor-default'
                    )}
                  />
                </td>
              ))}
              <td className={cn('text-center px-4 py-3 text-sm', colorDefinitiva(fila.definitiva))}>
                {fila.definitiva?.toFixed(1) ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
