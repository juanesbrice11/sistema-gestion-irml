'use client'

import { useState } from 'react'
import { HistorialModal } from './HistorialModal'
import type { ResumenFila } from '@/actions/asistencia'

interface Props {
  filas: ResumenFila[]
  asignacionId: string
}

export function ResumenTable({ filas, asignacionId }: Props) {
  const [seleccionado, setSeleccionado] = useState<{
    id: string; nombre: string; apellido: string
  } | null>(null)

  if (filas.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
        <p className="text-slate-400 text-sm">No hay registros en el rango de fechas seleccionado.</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estudiante</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-secondary-600 uppercase tracking-wide">Presente</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-red-500 uppercase tracking-wide">Ausente</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-amber-500 uppercase tracking-wide">Tarde</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Excusa</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">% Asist.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filas.map((fila) => {
              const alerta = fila.pct_asistencia < 75
              return (
                <tr
                  key={fila.estudianteId}
                  onClick={() => setSeleccionado({ id: fila.estudianteId, nombre: fila.nombre, apellido: fila.apellido })}
                  className="hover:bg-primary-50/40 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      {alerta && (
                        <span title="Menos del 75% de asistencia" className="inline-flex w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                      )}
                      {fila.apellido}, {fila.nombre}
                    </div>
                  </td>
                  <td className="text-center px-3 py-3 text-secondary-700 font-medium">{fila.presente}</td>
                  <td className="text-center px-3 py-3 text-red-600 font-medium">{fila.ausente}</td>
                  <td className="text-center px-3 py-3 text-amber-600 font-medium">{fila.tarde}</td>
                  <td className="text-center px-3 py-3 text-slate-500">{fila.excusa}</td>
                  <td className="text-center px-3 py-3 text-slate-600">{fila.total}</td>
                  <td className="text-center px-3 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      alerta
                        ? 'bg-red-100 text-red-700'
                        : fila.pct_asistencia >= 90
                        ? 'bg-secondary-100 text-secondary-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {fila.pct_asistencia}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Leyenda */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Menos del 75% de asistencia
          </span>
          <span>· Haz clic en un estudiante para ver su historial</span>
        </div>
      </div>

      {seleccionado && (
        <HistorialModal
          asignacionId={asignacionId}
          estudiante={seleccionado}
          onClose={() => setSeleccionado(null)}
        />
      )}
    </>
  )
}
