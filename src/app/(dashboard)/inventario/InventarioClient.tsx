'use client'

import { useState, useTransition } from 'react'
import { RecursosTable } from '@/components/inventario/RecursosTable'
import { registrarPrestamo, marcarDevuelto } from '@/actions/inventario'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EstadoRecurso } from '@/types/database'

interface Categoria { id: string; nombre: string }

interface RecursoRaw {
  id: string
  nombre: string
  codigo: string
  estado: EstadoRecurso
  cantidad: number
  ubicacion?: string
  created_at: string
  categorias_inventario: { nombre: string } | null
}

interface PrestamoActivo {
  id: string
  fecha_prestamo: string
  fecha_devolucion: string
  observacion?: string
  recursos: { id: string; nombre: string; codigo: string } | null
  profiles: { nombre: string; apellido: string } | null
}

interface Props {
  recursosRaw: RecursoRaw[]
  categorias: Categoria[]
  prestamosActivos: PrestamoActivo[]
  perfilId: string
  esAdmin: boolean
}

export default function InventarioClient({ recursosRaw, categorias, prestamosActivos, perfilId, esAdmin }: Props) {
  const [tab, setTab] = useState<'recursos' | 'prestamos'>('recursos')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [prestandoId, setPrestandoId] = useState<string | null>(null)
  const [fechaDev, setFechaDev] = useState('')
  const [observacion, setObservacion] = useState('')
  const [isPending, startTransition] = useTransition()
  const [recursos, setRecursos] = useState<RecursoRaw[]>(recursosRaw)
  const [prestamos, setPrestamos] = useState<PrestamoActivo[]>(prestamosActivos)

  const hoy = new Date().toISOString().split('T')[0]

  const recursosFiltrados = filtroCategoria
    ? recursos.filter((r) => r.categorias_inventario?.nombre === filtroCategoria)
    : recursos

  const filas = recursosFiltrados.map((r) => ({
    id: r.id,
    nombre: r.nombre,
    codigo: r.codigo,
    estado: r.estado,
    cantidad: r.cantidad,
    ubicacion: r.ubicacion,
    categoria: r.categorias_inventario?.nombre ?? '—',
    created_at: r.created_at,
  }))

  function abrirFormPrestar(id: string) {
    setPrestandoId(id)
    setFechaDev('')
    setObservacion('')
  }

  function cancelarPrestar() {
    setPrestandoId(null)
  }

  function confirmarPrestar() {
    if (!fechaDev || !prestandoId) return
    startTransition(async () => {
      await registrarPrestamo({
        recurso_id: prestandoId,
        solicitante_id: perfilId,
        fecha_prestamo: hoy,
        fecha_devolucion: fechaDev,
        ...(observacion ? { observacion } : {}),
      })
      setRecursos((prev) =>
        prev.map((r) => r.id === prestandoId ? { ...r, estado: 'prestado' } : r)
      )
      setPrestandoId(null)
    })
  }

  function devolver(recursoId: string) {
    const prestamo = prestamos.find((p) => p.recursos?.id === recursoId)
    if (!prestamo) return
    startTransition(async () => {
      await marcarDevuelto(prestamo.id, recursoId)
      setRecursos((prev) =>
        prev.map((r) => r.id === recursoId ? { ...r, estado: 'disponible' } : r)
      )
      setPrestamos((prev) => prev.filter((p) => p.id !== prestamo.id))
    })
  }

  return (
    <div className="space-y-5">

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['recursos', 'prestamos'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
              tab === t
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t === 'recursos' ? 'Recursos' : `Préstamos activos ${prestamos.length > 0 ? `(${prestamos.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* Tab: Recursos */}
      {tab === 'recursos' && (
        <>
          {/* Filtro por categoría */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-700">Categoría</label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="ml-auto text-xs text-slate-400">
                {recursosFiltrados.length} recursos
              </div>
            </div>
          </div>

          {/* Formulario de préstamo */}
          {prestandoId && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-amber-900 mb-4">
                Registrar préstamo — {recursos.find((r) => r.id === prestandoId)?.nombre}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-amber-800">Fecha de devolución</label>
                  <input
                    type="date"
                    value={fechaDev}
                    min={hoy}
                    onChange={(e) => setFechaDev(e.target.value)}
                    className="rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-amber-800">Observación (opcional)</label>
                  <input
                    type="text"
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    placeholder="Ej: para salida de campo"
                    className="rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button
                  variant="ghost"
                  onClick={cancelarPrestar}
                  disabled={isPending}
                  className="text-slate-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={confirmarPrestar}
                  loading={isPending}
                  disabled={!fechaDev || isPending}
                >
                  Confirmar préstamo
                </Button>
              </div>
            </div>
          )}

          {filas.length > 0 ? (
            <RecursosTable
              recursos={filas}
              onPrestar={esAdmin ? abrirFormPrestar : undefined}
              onDevolver={esAdmin ? devolver : undefined}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <p className="text-slate-400 text-sm">No hay recursos en esta categoría</p>
            </div>
          )}
        </>
      )}

      {/* Tab: Préstamos activos */}
      {tab === 'prestamos' && (
        <>
          {prestamos.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
              <p className="text-slate-400 text-sm">No hay préstamos activos</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Recurso</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Solicitante</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Préstamo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Devolución</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {prestamos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{p.recursos?.nombre}</p>
                        <p className="text-xs text-slate-400">{p.recursos?.codigo}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.profiles ? `${p.profiles.nombre} ${p.profiles.apellido}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{p.fecha_prestamo}</td>
                      <td className="px-4 py-3 text-slate-500">{p.fecha_devolucion}</td>
                      <td className="px-4 py-3 text-right">
                        {esAdmin && p.recursos && (
                          <button
                            onClick={() => devolver(p.recursos!.id)}
                            disabled={isPending}
                            className="text-xs font-medium text-secondary-600 hover:text-secondary-800 transition-colors disabled:opacity-50"
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
          )}
        </>
      )}

    </div>
  )
}
