'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { crearEstudiante, actualizarEstudiante, toggleEstudiante } from '@/actions/admin'

type Grupo = { id: string; nombre: string; grados: { nombre: string } | null }
type Estudiante = {
  id: string
  nombre: string
  apellido: string
  documento: string
  fecha_nacimiento: string
  activo: boolean
  grupo_id: string
  grupos: { id: string; nombre: string; grados: { nombre: string } | null } | null
}

const INPUT = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all'
const LABEL = 'text-sm font-medium text-slate-700'

const defaultForm = { nombre: '', apellido: '', documento: '', fecha_nacimiento: '', grupo_id: '' }

interface Props { estudiantes: Estudiante[]; grupos: Grupo[] }

export function EstudiantesManager({ estudiantes, grupos }: Props) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  const set = (k: keyof typeof defaultForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  function openAdd() {
    setEditingId(null); setForm(defaultForm); setFormOpen(true); setError(null)
  }

  function openEdit(e: Estudiante) {
    setEditingId(e.id)
    setForm({ nombre: e.nombre, apellido: e.apellido, documento: e.documento, fecha_nacimiento: e.fecha_nacimiento, grupo_id: e.grupo_id })
    setFormOpen(true); setError(null)
  }

  function cancel() { setFormOpen(false); setError(null) }

  function submit() {
    if (!form.nombre.trim() || !form.apellido.trim()) { setError('Nombre y apellido son requeridos'); return }
    if (!form.documento.trim()) { setError('El documento es requerido'); return }
    if (!form.grupo_id) { setError('Selecciona un grupo'); return }
    if (!form.fecha_nacimiento) { setError('La fecha de nacimiento es requerida'); return }
    startTransition(async () => {
      try {
        const payload = { nombre: form.nombre.trim(), apellido: form.apellido.trim(), documento: form.documento.trim(), fecha_nacimiento: form.fecha_nacimiento, grupo_id: form.grupo_id }
        if (editingId) await actualizarEstudiante(editingId, payload)
        else await crearEstudiante(payload)
        setFormOpen(false)
        router.refresh()
      } catch (e) { setError((e as Error).message) }
    })
  }

  function handleToggle(id: string, activo: boolean) {
    const msg = activo ? '¿Desactivar este estudiante?' : '¿Reactivar este estudiante?'
    if (!confirm(msg)) return
    startTransition(async () => {
      try { await toggleEstudiante(id, !activo); router.refresh() }
      catch (e) { setError((e as Error).message) }
    })
  }

  const filtrados = estudiantes
    .filter((e) => mostrarInactivos || e.activo)
    .filter((e) => !filtroGrupo || e.grupo_id === filtroGrupo)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="font-semibold text-slate-800">Estudiantes</h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{filtrados.length}</span>
        </div>
        <Button size="sm" onClick={openAdd}>+ Agregar estudiante</Button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-4 mb-4">
        <select value={filtroGrupo} onChange={(e) => setFiltroGrupo(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary-400 focus:outline-none">
          <option value="">Todos los grupos</option>
          {grupos.map((g) => <option key={g.id} value={g.id}>{g.grados?.nombre} — {g.nombre}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} className="rounded" />
          Mostrar inactivos
        </label>
      </div>

      {formOpen && (
        <div className="mb-4 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-800">{editingId ? 'Editar estudiante' : 'Nuevo estudiante'}</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Apellido(s)</label>
              <input className={INPUT} value={form.apellido} onChange={set('apellido')} placeholder="García Pérez" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Nombre(s)</label>
              <input className={INPUT} value={form.nombre} onChange={set('nombre')} placeholder="Andrés" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Documento</label>
              <input className={INPUT} value={form.documento} onChange={set('documento')} placeholder="1001000001" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={LABEL}>Fecha de nacimiento</label>
              <input type="date" className={INPUT} value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} />
            </div>
            <div className="flex flex-col gap-1.5 col-span-2">
              <label className={LABEL}>Grupo</label>
              <select className={INPUT} value={form.grupo_id} onChange={set('grupo_id')}>
                <option value="">Selecciona un grupo…</option>
                {grupos.map((g) => <option key={g.id} value={g.id}>{g.grados?.nombre} — {g.nombre}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" size="sm" onClick={cancel} disabled={isPending}>Cancelar</Button>
            <Button size="sm" onClick={submit} loading={isPending}>{editingId ? 'Guardar cambios' : 'Agregar'}</Button>
          </div>
        </div>
      )}

      {filtrados.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estudiante</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Documento</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Grupo</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtrados.map((e) => (
                <tr key={e.id} className={cn('hover:bg-slate-50/50 transition-colors', !e.activo && 'opacity-50')}>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-900">{e.apellido}, {e.nombre}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{e.fecha_nacimiento}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs font-mono">{e.documento}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {e.grupos ? `${e.grupos.grados?.nombre} — ${e.grupos.nombre}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', e.activo ? 'bg-secondary-50 text-secondary-700' : 'bg-slate-100 text-slate-500')}>
                      {e.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-4">
                    <button onClick={() => openEdit(e)} className="text-xs font-medium text-primary-600 hover:text-primary-800 transition-colors">Editar</button>
                    <button onClick={() => handleToggle(e.id, e.activo)} className={cn('text-xs font-medium transition-colors', e.activo ? 'text-amber-500 hover:text-amber-700' : 'text-secondary-600 hover:text-secondary-800')}>
                      {e.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <p className="text-slate-400 text-sm">No hay estudiantes{filtroGrupo ? ' en este grupo' : ''}</p>
        </div>
      )}
    </div>
  )
}
