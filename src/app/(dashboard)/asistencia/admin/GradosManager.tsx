'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { crearGrado, actualizarGrado, eliminarGrado } from '@/actions/admin'

type Grado = { id: string; nombre: string; nivel: number }

const INPUT = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all'
const LABEL = 'text-sm font-medium text-slate-700'

interface Props { grados: Grado[] }

export function GradosManager({ grados }: Props) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [nivel, setNivel] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditingId(null); setNombre(''); setNivel(''); setFormOpen(true); setError(null)
  }

  function openEdit(g: Grado) {
    setEditingId(g.id); setNombre(g.nombre); setNivel(g.nivel); setFormOpen(true); setError(null)
  }

  function cancel() { setFormOpen(false); setError(null) }

  function submit() {
    if (!nombre.trim()) { setError('El nombre es requerido'); return }
    if (!nivel || nivel < 1 || nivel > 13) { setError('El nivel debe ser un número entre 1 y 13'); return }
    startTransition(async () => {
      try {
        if (editingId) await actualizarGrado(editingId, nombre.trim(), Number(nivel))
        else await crearGrado(nombre.trim(), Number(nivel))
        setFormOpen(false)
        router.refresh()
      } catch (e) { setError((e as Error).message) }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este grado? Se eliminará junto con sus grupos.')) return
    startTransition(async () => {
      try { await eliminarGrado(id); router.refresh() }
      catch (e) { setError((e as Error).message) }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="font-semibold text-slate-800">Grados</h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{grados.length}</span>
        </div>
        <Button size="sm" onClick={openAdd}>+ Agregar grado</Button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {formOpen && (
        <div className="mb-4 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-800">{editingId ? 'Editar grado' : 'Nuevo grado'}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Nombre</label>
              <input className={INPUT} value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Sexto" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Nivel (año escolar)</label>
              <input className={INPUT} type="number" min={1} max={13} value={nivel} onChange={(e) => setNivel(e.target.value ? +e.target.value : '')} placeholder="6" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" size="sm" onClick={cancel} disabled={isPending}>Cancelar</Button>
            <Button size="sm" onClick={submit} loading={isPending}>{editingId ? 'Guardar cambios' : 'Agregar'}</Button>
          </div>
        </div>
      )}

      {grados.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nivel</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {grados.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">{g.nombre}</td>
                  <td className="px-4 py-3 text-slate-600">{g.nivel}°</td>
                  <td className="px-4 py-3 text-right space-x-4">
                    <button onClick={() => openEdit(g)} className="text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors">Editar</button>
                    <button onClick={() => handleDelete(g.id)} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <p className="text-slate-400 text-sm">No hay grados registrados</p>
        </div>
      )}
    </div>
  )
}
