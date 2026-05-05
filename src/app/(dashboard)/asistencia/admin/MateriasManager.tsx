'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { crearMateria, actualizarMateria, eliminarMateria } from '@/actions/admin'

type Materia = { id: string; nombre: string; codigo: string; horas_semana: number }

const INPUT = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all'
const LABEL = 'text-sm font-medium text-slate-700'

const defaultForm = { nombre: '', codigo: '', horas_semana: '' as number | '' }

interface Props { materias: Materia[] }

export function MateriasManager({ materias }: Props) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function openAdd() {
    setEditingId(null); setForm(defaultForm); setFormOpen(true); setError(null)
  }

  function openEdit(m: Materia) {
    setEditingId(m.id); setForm({ nombre: m.nombre, codigo: m.codigo, horas_semana: m.horas_semana }); setFormOpen(true); setError(null)
  }

  function cancel() { setFormOpen(false); setError(null) }

  function submit() {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    if (!form.codigo.trim()) { setError('El código es requerido'); return }
    if (!form.horas_semana || form.horas_semana < 1) { setError('Las horas deben ser al menos 1'); return }
    startTransition(async () => {
      try {
        const payload = { nombre: form.nombre.trim(), codigo: form.codigo.trim().toUpperCase(), horas_semana: Number(form.horas_semana) }
        if (editingId) await actualizarMateria(editingId, payload)
        else await crearMateria(payload)
        setFormOpen(false)
        router.refresh()
      } catch (e) { setError((e as Error).message) }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta materia?')) return
    startTransition(async () => {
      try { await eliminarMateria(id); router.refresh() }
      catch (e) { setError((e as Error).message) }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="font-semibold text-slate-800">Materias</h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{materias.length}</span>
        </div>
        <Button size="sm" onClick={openAdd}>+ Agregar materia</Button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {formOpen && (
        <div className="mb-4 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-800">{editingId ? 'Editar materia' : 'Nueva materia'}</p>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5 col-span-1">
              <label className={LABEL}>Nombre</label>
              <input className={INPUT} value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} placeholder="Ej: Matemáticas" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Código</label>
              <input className={INPUT} value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} placeholder="Ej: MAT" maxLength={6} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Horas / semana</label>
              <input className={INPUT} type="number" min={1} max={10} value={form.horas_semana} onChange={(e) => setForm((p) => ({ ...p, horas_semana: e.target.value ? +e.target.value : '' }))} placeholder="5" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" size="sm" onClick={cancel} disabled={isPending}>Cancelar</Button>
            <Button size="sm" onClick={submit} loading={isPending}>{editingId ? 'Guardar cambios' : 'Agregar'}</Button>
          </div>
        </div>
      )}

      {materias.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Código</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hrs/sem</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {materias.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900">{m.nombre}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">{m.codigo}</span></td>
                  <td className="px-4 py-3 text-center text-slate-600">{m.horas_semana}</td>
                  <td className="px-4 py-3 text-right space-x-4">
                    <button onClick={() => openEdit(m)} className="text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors">Editar</button>
                    <button onClick={() => handleDelete(m.id)} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <p className="text-slate-400 text-sm">No hay materias registradas</p>
        </div>
      )}
    </div>
  )
}
