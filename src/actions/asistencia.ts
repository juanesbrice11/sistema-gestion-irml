'use server'

import { createClient } from '@/lib/supabase/server'
import type { EstadoAsistencia } from '@/types/database'

async function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await createClient()) as any
}

export async function getAsignacionesDocente(docenteId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('asignaciones')
    .select('id, anio, grupos(id, nombre, grado_id, grados(nombre)), materias(id, nombre, codigo)')
    .eq('docente_id', docenteId)
    .eq('anio', new Date().getFullYear())
    .order('grupos(nombre)')

  if (error) throw new Error(error.message)
  return data
}

export async function getAsignacionesTodas() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('asignaciones')
    .select('id, anio, grupos(id, nombre, grados(nombre)), materias(id, nombre), profiles!docente_id(nombre, apellido)')
    .eq('anio', new Date().getFullYear())
    .order('grupos(nombre)')

  if (error) throw new Error(error.message)
  return data
}

export async function getEstudiantesPorGrupo(
  grupoId: string
): Promise<{ id: string; nombre: string; apellido: string }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('estudiantes')
    .select('id, nombre, apellido')
    .eq('grupo_id', grupoId)
    .eq('activo', true)
    .order('apellido')

  if (error) throw new Error(error.message)
  return (data ?? []) as { id: string; nombre: string; apellido: string }[]
}

export async function getAsistencia(
  asignacionId: string,
  fecha: string
): Promise<{ estudiante_id: string; estado: EstadoAsistencia; observacion: string | null }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('asistencia')
    .select('estudiante_id, estado, observacion')
    .eq('asignacion_id', asignacionId)
    .eq('fecha', fecha)

  if (error) throw new Error(error.message)
  return (data ?? []) as { estudiante_id: string; estado: EstadoAsistencia; observacion: string | null }[]
}

export async function registrarAsistencia(
  asignacionId: string,
  fecha: string,
  registros: { estudiante_id: string; estado: EstadoAsistencia; observacion?: string }[]
) {
  const db = await getDb()

  const payload = registros.map((r) => ({
    asignacion_id: asignacionId,
    fecha,
    estudiante_id: r.estudiante_id,
    estado: r.estado,
    ...(r.observacion ? { observacion: r.observacion } : {}),
  }))

  const { error } = await db
    .from('asistencia')
    .upsert(payload, { onConflict: 'asignacion_id,estudiante_id,fecha' })

  if (error) throw new Error(error.message)
}
