'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  getDocentesAdmin,
  crearDocente,
  actualizarDocente,
  eliminarDocente,
  type DocenteAdmin,
} from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Props {
  docentes: DocenteAdmin[]
}

const ROL_LABELS: Record<string, string> = {
  docente: 'Docente',
  administrativo: 'Administrativo',
}

type FormState = {
  nombre: string
  apellido: string
  email: string
  password: string
  rol: 'docente' | 'administrativo'
}

const EMPTY_FORM: FormState = { nombre: '', apellido: '', email: '', password: '', rol: 'docente' }

export function DocentesManager({ docentes: initial }: Props) {
  const router = useRouter()
  const [docentes, setDocentes] = useState<DocenteAdmin[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<DocenteAdmin | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(d: DocenteAdmin) {
    setEditing(d)
    setForm({
      nombre: d.nombre,
      apellido: d.apellido,
      email: d.email,
      password: '',
      rol: d.rol,
    })
    setError('')
    setShowForm(true)
  }

  function cancel() {
    setShowForm(false)
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  async function refreshList() {
    try {
      const updated = await getDocentesAdmin()
      setDocentes(updated)
    } catch {
      router.refresh()
    }
  }

  function submit() {
    setError('')
    startTransition(async () => {
      try {
        if (editing) {
          await actualizarDocente(editing.id, editing.auth_user_id, {
            nombre: form.nombre,
            apellido: form.apellido,
            rol: form.rol,
            email: form.email || undefined,
            password: form.password || undefined,
          })
        } else {
          if (!form.password) { setError('La contraseña es obligatoria.'); return }
          await crearDocente({
            nombre: form.nombre,
            apellido: form.apellido,
            email: form.email,
            password: form.password,
            rol: form.rol,
          })
        }
        cancel()
        await refreshList()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error desconocido')
      }
    })
  }

  function handleDelete(d: DocenteAdmin) {
    if (!confirm(`¿Eliminar a ${d.nombre} ${d.apellido}? Esta acción no se puede deshacer.`)) return
    startTransition(async () => {
      try {
        await eliminarDocente(d.id, d.auth_user_id)
        await refreshList()
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : 'Error al eliminar')
      }
    })
  }

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{docentes.length} usuario(s) registrado(s)</p>
        {!showForm && (
          <Button size="sm" onClick={openCreate}>
            + Nuevo docente
          </Button>
        )}
      </div>

      {/* ── Formulario ── */}
      {showForm && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm">
            {editing ? 'Editar usuario' : 'Nuevo usuario'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nombre"
              value={form.nombre}
              onChange={set('nombre')}
              placeholder="Juan"
              required
            />
            <Input
              label="Apellido"
              value={form.apellido}
              onChange={set('apellido')}
              placeholder="Pérez"
              required
            />
            <Input
              label="Correo electrónico"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="docente@iermessa.edu.co"
              required={!editing}
            />
            <Input
              label={editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              required={!editing}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Rol</label>
              <select
                value={form.rol}
                onChange={set('rol')}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
              >
                <option value="docente">Docente</option>
                <option value="administrativo">Administrativo</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={submit} loading={isPending} disabled={isPending} size="sm">
              {editing ? 'Guardar cambios' : 'Crear usuario'}
            </Button>
            <Button variant="ghost" size="sm" onClick={cancel} disabled={isPending}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* ── Tabla ── */}
      {docentes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <p className="text-slate-400 text-sm">No hay docentes registrados aún</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Correo</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Rol</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {docentes.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {d.nombre} {d.apellido}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{d.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      d.rol === 'administrativo'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {ROL_LABELS[d.rol] ?? d.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEdit(d)}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(d)}
                        disabled={isPending}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-40"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
