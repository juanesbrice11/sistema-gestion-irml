'use server'

import { createClient } from '@/lib/supabase/server'
import type { Recurso, Prestamo } from '@/types/database'

type RecursoInput = Omit<Recurso, 'id' | 'created_at'>
type PrestamoInput = Omit<Prestamo, 'id' | 'created_at' | 'devuelto_en'>

// Las mutaciones usan `db` sin genérico porque el Database escrito a mano
// no incluye Relationships/Views/Enums que requiere Supabase JS 2.x.
async function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await createClient()) as any
}

export async function getCategorias() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categorias_inventario')
    .select('id, nombre')
    .order('nombre')

  if (error) throw new Error(error.message)
  return (data ?? []) as { id: string; nombre: string }[]
}

export async function getRecursos(categoriaId?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('recursos')
    .select('*, categorias_inventario(*)')
    .order('nombre')

  if (categoriaId) query = query.eq('categoria_id', categoriaId)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function crearRecurso(recurso: RecursoInput) {
  const db = await getDb()

  const { data, error } = await db
    .from('recursos')
    .insert(recurso)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as Recurso
}

export async function actualizarRecurso(id: string, updates: Partial<RecursoInput>) {
  const db = await getDb()

  const { error } = await db
    .from('recursos')
    .update(updates)
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function registrarPrestamo(prestamo: PrestamoInput) {
  const db = await getDb()

  const { error: prestamoError } = await db
    .from('prestamos')
    .insert(prestamo)

  if (prestamoError) throw new Error(prestamoError.message)

  const { error: recursoError } = await db
    .from('recursos')
    .update({ estado: 'prestado' })
    .eq('id', prestamo.recurso_id)

  if (recursoError) throw new Error(recursoError.message)
}

export async function marcarDevuelto(prestamoId: string, recursoId: string) {
  const db = await getDb()
  const hoy = new Date().toISOString().split('T')[0]

  const { error: prestamoError } = await db
    .from('prestamos')
    .update({ devuelto_en: hoy })
    .eq('id', prestamoId)

  if (prestamoError) throw new Error(prestamoError.message)

  const { error: recursoError } = await db
    .from('recursos')
    .update({ estado: 'disponible' })
    .eq('id', recursoId)

  if (recursoError) throw new Error(recursoError.message)
}

export async function getPrestamosActivos() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prestamos')
    .select('*, recursos(*), profiles!solicitante_id(*)')
    .is('devuelto_en', null)
    .order('fecha_prestamo', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}
