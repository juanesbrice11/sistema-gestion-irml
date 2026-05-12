'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

// ===== DOCENTES CRUD (panel administración) =====

export type DocenteAdmin = {
  id: string
  auth_user_id: string
  nombre: string
  apellido: string
  rol: 'docente' | 'administrativo'
  email: string
}

export async function getDocentesAdmin(): Promise<DocenteAdmin[]> {
  const admin = createAdminClient()

  // Fetch profiles with rol docente/administrativo using admin client to avoid type narrowing issues
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any
  const { data: profiles, error } = await db
    .from('profiles')
    .select('id, auth_user_id, nombre, apellido, rol')
    .in('rol', ['docente', 'administrativo'])
    .order('apellido')
  if (error) throw new Error(error.message)

  const profileList = (profiles ?? []) as Array<{
    id: string; auth_user_id: string; nombre: string; apellido: string; rol: string
  }>

  if (profileList.length === 0) return []

  // Fetch auth users to get emails
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (authError) throw new Error(authError.message)

  const emailMap = new Map(authData.users.map((u) => [u.id, u.email ?? '']))

  return profileList.map((p) => ({
    id: p.id,
    auth_user_id: p.auth_user_id,
    nombre: p.nombre,
    apellido: p.apellido,
    rol: p.rol as 'docente' | 'administrativo',
    email: emailMap.get(p.auth_user_id) ?? '',
  }))
}

export async function crearDocente(data: {
  nombre: string
  apellido: string
  email: string
  password: string
  rol: 'docente' | 'administrativo'
}) {
  const admin = createAdminClient()

  // 1. Create auth user
  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  })
  if (authError) throw new Error(authError.message)

  // 2. Create profile (trigger may or may not exist — upsert to be safe)
  const db = admin as any
  const { error: profileError } = await db
    .from('profiles')
    .upsert({
      auth_user_id: authUser.user.id,
      nombre: data.nombre,
      apellido: data.apellido,
      rol: data.rol,
    })
  if (profileError) {
    // Rollback auth user if profile creation fails
    await admin.auth.admin.deleteUser(authUser.user.id)
    throw new Error(profileError.message)
  }
}

export async function actualizarDocente(
  profileId: string,
  authUserId: string,
  data: {
    nombre: string
    apellido: string
    rol: 'docente' | 'administrativo'
    email?: string
    password?: string
  }
) {
  const admin = createAdminClient()
  const db = admin as any

  // Update profile
  const { error: profileError } = await db
    .from('profiles')
    .update({ nombre: data.nombre, apellido: data.apellido, rol: data.rol })
    .eq('id', profileId)
  if (profileError) throw new Error(profileError.message)

  // Optionally update auth user email / password
  const authUpdates: { email?: string; password?: string } = {}
  if (data.email) authUpdates.email = data.email
  if (data.password) authUpdates.password = data.password

  if (Object.keys(authUpdates).length > 0) {
    const { error: authError } = await admin.auth.admin.updateUserById(authUserId, authUpdates)
    if (authError) throw new Error(authError.message)
  }
}

export async function eliminarDocente(profileId: string, authUserId: string) {
  const admin = createAdminClient()
  const db = admin as any

  // 1. Delete profile row
  const { error: profileError } = await db.from('profiles').delete().eq('id', profileId)
  if (profileError) throw new Error(profileError.message)

  // 2. Delete auth user
  const { error: authError } = await admin.auth.admin.deleteUser(authUserId)
  if (authError) throw new Error(authError.message)
}
