'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { crearAsignacion, eliminarAsignacion } from '@/actions/admin'

type Asignacion = {
  id: string
  anio: number
  docente_id: string
  grupo_id: string
  materia_id: string
  grupos: { nombre: string } | null
  materias: { nombre: string; codigo: string } | null
  profiles: { nombre: string; apellido: string } | null
}
type Docente = { id: string; nombre: string; apellido: string }
type Grupo = { id: string; nombre: string; grados: { nombre: string } | null }
type Materia = { id: string; nombre: string; codigo: string }

const INPUT = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all'
const LABEL = 'text-sm font-medium text-slate-700'

const AÑO = new Date().getFullYear()
const defaultForm = { docente_id: '', grupo_id: '', materia_id: '', anio: AÑO }

interface Props {
  asignaciones: Asignacion[]
  docentes: Docente[]
  grupos: Grupo[]
  materias: Materia[]
}

export function AsignacionesManager({ asignaciones, docentes, grupos, materias }: Props) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const set = (k: keyof typeof defaultForm) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: k === 'anio' ? +e.target.value : e.target.value }))

  function openAdd() { setForm(defaultForm); setFormOpen(true); setError(null) }
  function cancel() { setFormOpen(false); setError(null) }

  function submit() {
    if (!form.docente_id) { setError('Selecciona un docente'); return }
    if (!form.grupo_id) { setError('Selecciona un grupo'); return }
    if (!form.materia_id) { setError('Selecciona una materia'); return }

    const existe = asignaciones.some(
      (a) => a.docente_id === form.docente_id && a.grupo_id === form.grupo_id && a.materia_id === form.materia_id && a.anio === form.anio
    )
    if (existe) { setError('Ya existe esta asignación para el año seleccionado'); return }

    startTransition(async () => {
      try {
        await crearAsignacion({ docente_id: form.docente_id, grupo_id: form.grupo_id, materia_id: form.materia_id, anio: form.anio })
        setFormOpen(false)
        router.refresh()
      } catch (e) { setError((e as Error).message) }
    })
  }

  function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta asignación? Se perderá el historial de asistencia y notas asociado.')) return
    startTransition(async () => {
      try { await eliminarAsignacion(id); router.refresh() }
      catch (e) { setError((e as Error).message) }
    })
  }

  const porAnio = [...new Set(asignaciones.map((a) => a.anio))].sort((a, b) => b - a)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="font-semibold text-slate-800">Asignaciones docente – grupo – materia</h3>
          <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{asignaciones.length}</span>
        </div>
        <Button size="sm" onClick={openAdd}>+ Nueva asignación</Button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">{error}</div>
      )}

      {formOpen && (
        <div className="mb-4 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-800">Nueva asignación</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <label className={LABEL}>Docente</label>
              <select className={INPUT} value={form.docente_id} onChange={set('docente_id')}>
                <option value="">Selecciona…</option>
                {docentes.map((d) => <option key={d.id} value={d.id}>{d.apellido}, {d.nombre}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <label className={LABEL}>Grupo</label>
              <select className={INPUT} value={form.grupo_id} onChange={set('grupo_id')}>
                <option value="">Selecciona…</option>
                {grupos.map((g) => <option key={g.id} value={g.id}>{g.grados?.nombre} — {g.nombre}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <label className={LABEL}>Materia</label>
              <select className={INPUT} value={form.materia_id} onChange={set('materia_id')}>
                <option value="">Selecciona…</option>
                {materias.map((m) => <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
              <label className={LABEL}>Año</label>
              <input type="number" className={INPUT} value={form.anio} min={2020} max={2099} onChange={set('anio')} />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="ghost" size="sm" onClick={cancel} disabled={isPending}>Cancelar</Button>
            <Button size="sm" onClick={submit} loading={isPending}>Guardar asignación</Button>
          </div>
        </div>
      )}

      {asignaciones.length > 0 ? (
        <div className="space-y-4">
          {porAnio.map((anio) => (
            <div key={anio}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 px-1">{anio}</p>
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Docente</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Grupo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Materia</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {asignaciones.filter((a) => a.anio === anio).map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-slate-900">
                          {a.profiles ? `${a.profiles.apellido}, ${a.profiles.nombre}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{a.grupos?.nombre ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {a.materias?.nombre}
                          {a.materias?.codigo && <span className="ml-2 text-xs text-slate-400">({a.materias.codigo})</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDelete(a.id)} className="text-xs font-medium text-red-500 hover:text-red-700 transition-colors">Eliminar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <p className="text-slate-400 text-sm">No hay asignaciones registradas</p>
        </div>
      )}
    </div>
  )
}
