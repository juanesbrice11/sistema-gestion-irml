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

export type ResumenFila = {
  estudianteId: string
  nombre: string
  apellido: string
  presente: number
  ausente: number
  tarde: number
  excusa: number
  total: number
  pct_asistencia: number
}

export async function getResumenAsistencia(
  asignacionId: string,
  desde: string,
  hasta: string
): Promise<ResumenFila[]> {
  const db = await getDb()

  const { data: registros, error } = await db
    .from('asistencia')
    .select('estudiante_id, estado')
    .eq('asignacion_id', asignacionId)
    .gte('fecha', desde)
    .lte('fecha', hasta)

  if (error) throw new Error(error.message)

  const rows = (registros ?? []) as { estudiante_id: string; estado: string }[]
  if (rows.length === 0) return []

  // Obtener nombres de los estudiantes involucrados
  const ids = [...new Set(rows.map((r) => r.estudiante_id))]
  const { data: estudiantes, error: eError } = await db
    .from('estudiantes')
    .select('id, nombre, apellido')
    .in('id', ids)
    .order('apellido')

  if (eError) throw new Error(eError.message)

  const alumnoList = (estudiantes ?? []) as { id: string; nombre: string; apellido: string }[]
  const infoMap = new Map(alumnoList.map((e) => [e.id, { nombre: e.nombre, apellido: e.apellido }]))

  // Agregar conteos por estudiante
  const conteoMap = new Map<string, { presente: number; ausente: number; tarde: number; excusa: number }>()
  for (const r of rows) {
    if (!conteoMap.has(r.estudiante_id)) {
      conteoMap.set(r.estudiante_id, { presente: 0, ausente: 0, tarde: 0, excusa: 0 })
    }
    const c = conteoMap.get(r.estudiante_id)!
    const estado = r.estado as EstadoAsistencia
    c[estado]++
  }

  const filas: ResumenFila[] = []
  for (const [id, c] of conteoMap.entries()) {
    const info = infoMap.get(id)
    if (!info) continue
    const total = c.presente + c.ausente + c.tarde + c.excusa
    const pct_asistencia = total > 0 ? Math.round((c.presente / total) * 100) : 0
    filas.push({ estudianteId: id, nombre: info.nombre, apellido: info.apellido, ...c, total, pct_asistencia })
  }

  return filas.sort((a, b) => a.apellido.localeCompare(b.apellido))
}

export async function getHistorialEstudiante(
  asignacionId: string,
  estudianteId: string
): Promise<{ fecha: string; estado: EstadoAsistencia; observacion: string | null }[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('asistencia')
    .select('fecha, estado, observacion')
    .eq('asignacion_id', asignacionId)
    .eq('estudiante_id', estudianteId)
    .order('fecha', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as { fecha: string; estado: EstadoAsistencia; observacion: string | null }[]
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
