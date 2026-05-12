'use client'

import { useState, useTransition } from 'react'
import { crearActividad, actualizarActividad, eliminarActividad, type Actividad } from '@/actions/notas'
import { Button } from '@/components/ui/button'

interface Props {
  actividades: Actividad[]
  asignacionId: string
  periodoId: string
  onActualizadas: (acts: Actividad[]) => void
  readonly?: boolean
}

const NOTA_MIN = 0
const NOTA_MAX = 5

export function ActividadesPanel({ actividades, asignacionId, periodoId, onActualizadas, readonly }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<Actividad | null>(null)
  const [nombre, setNombre] = useState('')
  const [porcentaje, setPorcentaje] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const sumaActual = actividades.reduce((acc, a) => acc + Number(a.porcentaje), 0)
  const disponible = 100 - sumaActual
  const completado = Math.abs(sumaActual - 100) < 0.01

  function openCreate() {
    setEditando(null)
    setNombre('')
    setPorcentaje('')
    setError('')
    setShowForm(true)
  }

  function openEdit(a: Actividad) {
    setEditando(a)
    setNombre(a.nombre)
    setPorcentaje(String(a.porcentaje))
    setError('')
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setEditando(null)
    setError('')
  }

  async function refreshActividades() {
    const { getActividades } = await import('@/actions/notas')
    const updated = await getActividades(asignacionId, periodoId)
    onActualizadas(updated)
  }

  function submit() {
    const pct = parseFloat(porcentaje)
    if (!nombre.trim()) { setError('El nombre es obligatorio.'); return }
    if (isNaN(pct) || pct <= 0 || pct > 100) { setError('El porcentaje debe ser entre 0.1 y 100.'); return }

    setError('')
    startTransition(async () => {
      try {
        if (editando) {
          await actualizarActividad(editando.id, asignacionId, periodoId, nombre.trim(), pct)
        } else {
          await crearActividad(asignacionId, periodoId, nombre.trim(), pct)
        }
        cancel()
        await refreshActividades()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error desconocido')
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta actividad y todas sus calificaciones?')) return
    startTransition(async () => {
      try {
        await eliminarActividad(id)
        await refreshActividades()
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : 'Error al eliminar')
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Actividades del periodo</h3>
          <p className={`text-xs mt-0.5 ${completado ? 'text-secondary-600' : 'text-slate-400'}`}>
            {completado
              ? '✓ 100% distribuido'
              : `${sumaActual.toFixed(1)}% asignado · ${disponible.toFixed(1)}% disponible`}
          </p>
        </div>
        {!readonly && !showForm && (
          <Button size="sm" onClick={openCreate} disabled={completado}>
            + Actividad
          </Button>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            sumaActual > 100 ? 'bg-red-500' : completado ? 'bg-secondary-500' : 'bg-primary-500'
          }`}
          style={{ width: `${Math.min(sumaActual, 100)}%` }}
        />
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-slate-700">{editando ? 'Editar actividad' : 'Nueva actividad'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1 flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Parcial, Taller, Quiz…"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600">
                Porcentaje (máx {editando
                  ? (100 - actividades.filter(a => a.id !== editando.id).reduce((s, a) => s + Number(a.porcentaje), 0)).toFixed(1)
                  : disponible.toFixed(1)}%)
              </label>
              <input
                type="number"
                min={0.1}
                max={100}
                step={0.1}
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
                placeholder="Ej: 30"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={submit} loading={isPending} disabled={isPending}>
              {editando ? 'Guardar' : 'Crear'}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel} disabled={isPending}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Lista */}
      {actividades.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-3">
          {readonly ? 'No hay actividades configuradas para este periodo.' : 'Crea actividades para comenzar a ingresar notas.'}
        </p>
      ) : (
        <div className="space-y-1.5">
          {actividades.map((a) => (
            <div key={a.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary-100 text-primary-700 text-xs font-bold flex-shrink-0">
                  {Number(a.porcentaje).toFixed(0)}%
                </span>
                <span className="text-sm font-medium text-slate-800">{a.nombre}</span>
              </div>
              {!readonly && (
                <div className="flex gap-2">
                  <button onClick={() => openEdit(a)} className="text-xs text-primary-600 hover:text-primary-800 font-medium">Editar</button>
                  <button onClick={() => handleDelete(a.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Eliminar</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!readonly && actividades.length > 0 && !completado && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠ Faltan {disponible.toFixed(1)}% por asignar. Las notas se calcularán sobre el porcentaje configurado.
        </p>
      )}

      {/* Escala */}
      <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 border-t border-slate-100">
        <span>Escala: {NOTA_MIN} – {NOTA_MAX}</span>
        <span>·</span>
        <span className="text-secondary-600 font-medium">Aprobatorio: ≥ 3.0</span>
      </div>
    </div>
  )
}
