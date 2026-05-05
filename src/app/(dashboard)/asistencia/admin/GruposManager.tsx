'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { crearGrupo, actualizarGrupo, eliminarGrupo } from '@/actions/admin'

type Grado = { id: string; nombre: string; nivel: number }
type Docente = { id: string; nombre: string; apellido: string }
type Grupo = {
  id: string
  nombre: string
  jornada: 'manana' | 'tarde' | 'unica'
  director_id: string | null
  grado_id: string
  grados: { id: string; nombre: string; nivel: number } | null
}

const INPUT = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all'
const LABEL = 'text-sm font-medium text-slate-700'

const JORNADA = { manana: 'Mañana', tarde: 'Tarde', unica: 'Única' }

interface Props {
  grupos: Grupo[]
  grados: Grado[]
  docentes: Docente[]
}

type Form = { nombre: string; grado_id: string; jornada: 'manana' | 'tarde' | 'unica'; director_id: string }
const defaultForm: Form = { nombre: '', grado_id: '', jornada: 'manana', director_id: '' }

export function GruposManager({ grupos, grados, docentes }: Props) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(defaultForm)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  function openAdd() {
    setEditingId(null); setForm(defaultForm); setFormOpen(true); setError(null)
  }

  function openEdit(g: Grupo) {
    setEditingId(g.id)
    setForm({ nombre: g.nombre, grado_id: g.grado_id, jornada: g.jornada, director_id: g.director_id ?? '' })
    setFormOpen(true); setError(null)
  }

  function cancel() { setFormOpen(false); setError(null) }

  function submit() {
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    if (!form.grado_id) { setError('Selecciona un grado'); return }
    startTransition(async () => {
      try {
        const payload = { nombre: form.nombre.trim(), grado_id: form.grado_id, jornada: form.jornada, director_id: form.director_id || null }
        if (editingId) await actualizarGrupo(editingId, payload)
        else await crearGrupo(payload)
        setFormOpen(false)
        router.refresh()
      } catch (e) { setError((e as Error).message) }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar este grupo? Se eliminarán sus estudiantes y asignaciones.')) return
    startTransition(async () => {
      try { await eliminarGrupo(id); router.refresh() }
      catch (e) { setError((e as Error).message) }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="font-semibold text-slate-800">Grupos</h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{grupos.length}</span>
        </div>
        <Button size="sm" onClick={openAdd}>+ Agregar grupo</Button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {formOpen && (
        <div className="mb-4 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-800">{editingId ? 'Editar grupo' : 'Nuevo grupo'}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Nombre del grupo</label>
              <input className={INPUT} value={form.nombre} onChange={set('nombre')} placeholder="Ej: 6°A" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Grado</label>
              <select className={INPUT} value={form.grado_id} onChange={set('grado_id')}>
                <option value="">Selecciona…</option>
                {grados.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Jornada</label>
              <select className={INPUT} value={form.jornada} onChange={set('jornada')}>
                <option value="manana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="unica">Única</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Director de grupo (opcional)</label>
              <select className={INPUT} value={form.director_id} onChange={set('director_id')}>
                <option value="">Sin asignar</option>
                {docentes.map((d) => <option key={d.id} value={d.id}>{d.apellido}, {d.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" size="sm" onClick={cancel} disabled={isPending}>Cancelar</Button>
            <Button size="sm" onClick={submit} loading={isPending}>{editingId ? 'Guardar cambios' : 'Agregar'}</Button>
          </div>
        </div>
      )}

      {grupos.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Grupo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Grado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Jornada</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Director</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {grupos.map((g) => {
                const director = docentes.find((d) => d.id === g.director_id)
                return (
                  <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-900">{g.nombre}</td>
                    <td className="px-4 py-3 text-slate-600">{g.grados?.nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{JORNADA[g.jornada]}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {director ? `${director.apellido}, ${director.nombre}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right space-x-4">
                      <button onClick={() => openEdit(g)} className="text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors">Editar</button>
                      <button onClick={() => handleDelete(g.id)} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">Eliminar</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <p className="text-slate-400 text-sm">No hay grupos registrados</p>
        </div>
      )}
    </div>
  )
}
