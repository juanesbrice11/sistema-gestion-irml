'use server'

import { createClient } from '@/lib/supabase/server'

async function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await createClient()) as any
}

// ===== GRADOS =====

export async function getGrados() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('grados')
    .select('id, nombre, nivel')
    .order('nivel')
  if (error) throw new Error(error.message)
  return (data ?? []) as { id: string; nombre: string; nivel: number }[]
}

export async function crearGrado(nombre: string, nivel: number) {
  const db = await getDb()
  const { error } = await db.from('grados').insert({ nombre, nivel })
  if (error) throw new Error(error.message)
}

export async function actualizarGrado(id: string, nombre: string, nivel: number) {
  const db = await getDb()
  const { error } = await db.from('grados').update({ nombre, nivel }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarGrado(id: string) {
  const db = await getDb()
  const { error } = await db.from('grados').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ===== GRUPOS =====

export async function getGruposAdmin() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('grupos')
    .select('id, nombre, jornada, director_id, grado_id, grados(id, nombre, nivel)')
    .order('nombre')
  if (error) throw new Error(error.message)
  return (data ?? []) as {
    id: string
    nombre: string
    jornada: 'manana' | 'tarde' | 'unica'
    director_id: string | null
    grado_id: string
    grados: { id: string; nombre: string; nivel: number } | null
  }[]
}

export async function crearGrupo(data: {
  nombre: string
  grado_id: string
  jornada: 'manana' | 'tarde' | 'unica'
  director_id: string | null
}) {
  const db = await getDb()
  const { error } = await db.from('grupos').insert(data)
  if (error) throw new Error(error.message)
}

export async function actualizarGrupo(id: string, data: {
  nombre: string
  grado_id: string
  jornada: 'manana' | 'tarde' | 'unica'
  director_id: string | null
}) {
  const db = await getDb()
  const { error } = await db.from('grupos').update(data).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarGrupo(id: string) {
  const db = await getDb()
  const { error } = await db.from('grupos').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ===== MATERIAS =====

export async function getMateriasAdmin() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('materias')
    .select('id, nombre, codigo, horas_semana')
    .order('nombre')
  if (error) throw new Error(error.message)
  return (data ?? []) as { id: string; nombre: string; codigo: string; horas_semana: number }[]
}

export async function crearMateria(data: { nombre: string; codigo: string; horas_semana: number }) {
  const db = await getDb()
  const { error } = await db.from('materias').insert(data)
  if (error) throw new Error(error.message)
}

export async function actualizarMateria(id: string, data: { nombre: string; codigo: string; horas_semana: number }) {
  const db = await getDb()
  const { error } = await db.from('materias').update(data).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarMateria(id: string) {
  const db = await getDb()
  const { error } = await db.from('materias').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ===== ESTUDIANTES =====

export async function getEstudiantesAdmin() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('estudiantes')
    .select('id, nombre, apellido, documento, fecha_nacimiento, activo, grupo_id, grupos(id, nombre, grados(nombre))')
    .order('apellido')
  if (error) throw new Error(error.message)
  return (data ?? []) as {
    id: string
    nombre: string
    apellido: string
    documento: string
    fecha_nacimiento: string
    activo: boolean
    grupo_id: string
    grupos: { id: string; nombre: string; grados: { nombre: string } | null } | null
  }[]
}

export async function crearEstudiante(data: {
  nombre: string
  apellido: string
  documento: string
  fecha_nacimiento: string
  grupo_id: string
}) {
  const db = await getDb()
  const { error } = await db.from('estudiantes').insert({ ...data, activo: true })
  if (error) throw new Error(error.message)
}

export async function actualizarEstudiante(id: string, data: {
  nombre: string
  apellido: string
  documento: string
  fecha_nacimiento: string
  grupo_id: string
}) {
  const db = await getDb()
  const { error } = await db.from('estudiantes').update(data).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function toggleEstudiante(id: string, activo: boolean) {
  const db = await getDb()
  const { error } = await db.from('estudiantes').update({ activo }).eq('id', id)
  if (error) throw new Error(error.message)
}

// ===== ASIGNACIONES =====

export async function getAsignacionesAdmin() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('asignaciones')
    .select('id, anio, docente_id, grupo_id, materia_id, grupos(nombre), materias(nombre, codigo), profiles!docente_id(nombre, apellido)')
    .order('anio', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as {
    id: string
    anio: number
    docente_id: string
    grupo_id: string
    materia_id: string
    grupos: { nombre: string } | null
    materias: { nombre: string; codigo: string } | null
    profiles: { nombre: string; apellido: string } | null
  }[]
}

export async function crearAsignacion(data: {
  docente_id: string
  grupo_id: string
  materia_id: string
  anio: number
}) {
  const db = await getDb()
  const { error } = await db.from('asignaciones').insert(data)
  if (error) throw new Error(error.message)
}

export async function eliminarAsignacion(id: string) {
  const db = await getDb()
  const { error } = await db.from('asignaciones').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ===== DOCENTES (para selects) =====

export async function getDocentes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, rol')
    .in('rol', ['docente', 'administrativo'])
    .order('apellido')
  if (error) throw new Error(error.message)
  return (data ?? []) as { id: string; nombre: string; apellido: string; rol: string }[]
}
