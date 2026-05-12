'use client'

import { useState, useEffect } from 'react'
import { getHistorialEstudiante } from '@/actions/asistencia'
import { formatDate } from '@/lib/utils'
import type { EstadoAsistencia } from '@/types/database'

const estadoBadge: Record<EstadoAsistencia, string> = {
  presente: 'bg-secondary-100 text-secondary-700',
  ausente:  'bg-red-100 text-red-700',
  tarde:    'bg-amber-100 text-amber-700',
  excusa:   'bg-slate-100 text-slate-600',
}

const estadoLabel: Record<EstadoAsistencia, string> = {
  presente: 'Presente',
  ausente:  'Ausente',
  tarde:    'Tarde',
  excusa:   'Excusa',
}

interface Props {
  asignacionId: string
  estudiante: { id: string; nombre: string; apellido: string }
  onClose: () => void
}

export function HistorialModal({ asignacionId, estudiante, onClose }: Props) {
  const [registros, setRegistros] = useState<
    { fecha: string; estado: EstadoAsistencia; observacion: string | null }[]
  >([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    getHistorialEstudiante(asignacionId, estudiante.id)
      .then(setRegistros)
      .finally(() => setCargando(false))
  }, [asignacionId, estudiante.id])

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900 text-base">
              {estudiante.nombre} {estudiante.apellido}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Historial de asistencia</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {cargando ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm">Cargando historial…</p>
            </div>
          ) : registros.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-400 text-sm">No hay registros de asistencia para este estudiante.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {registros.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3 text-slate-700 font-medium">{formatDate(r.fecha)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoBadge[r.estado]}`}>
                        {estadoLabel[r.estado]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs italic">
                      {r.observacion || <span className="text-slate-300 not-italic">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!cargando && registros.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            <p className="text-xs text-slate-400">{registros.length} registro(s) encontrado(s)</p>
          </div>
        )}
      </div>
    </div>
  )
}
