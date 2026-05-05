'use server'

import { createClient } from '@/lib/supabase/server'
import type { Nota, Periodo } from '@/types/database'

type NotaInput = Omit<Nota, 'id' | 'created_at'>

async function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await createClient()) as any
}

export async function guardarNota(nota: NotaInput) {
  const db = await getDb()
  const definitiva = calcularDefinitiva(nota.nota1, nota.nota2, nota.nota3)

  const { error } = await db
    .from('notas')
    .upsert(
      { ...nota, definitiva },
      { onConflict: 'asignacion_id,estudiante_id,periodo_id' }
    )

  if (error) throw new Error(error.message)
}

export async function getNotasByAsignacion(asignacionId: string, periodoId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notas')
    .select('*, estudiantes(*)')
    .eq('asignacion_id', asignacionId)
    .eq('periodo_id', periodoId)

  if (error) throw new Error(error.message)
  return data
}

export async function getNotasByEstudiante(estudianteId: string, periodoId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notas')
    .select('*, asignaciones(*, materias(*))')
    .eq('estudiante_id', estudianteId)
    .eq('periodo_id', periodoId)

  if (error) throw new Error(error.message)
  return data
}

export async function getPeriodos(): Promise<Periodo[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('periodos')
    .select('id, numero, anio, fecha_inicio, fecha_fin')
    .eq('anio', new Date().getFullYear())
    .order('numero')

  if (error) throw new Error(error.message)
  return (data ?? []) as Periodo[]
}

// Escala colombiana: 0–10, aprobatorio >= 6
function calcularDefinitiva(
  nota1?: number,
  nota2?: number,
  nota3?: number
): number | undefined {
  const valores = [nota1, nota2, nota3].filter((n): n is number => n !== undefined)
  if (valores.length === 0) return undefined
  return Number((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1))
}
