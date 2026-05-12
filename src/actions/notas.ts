'use server'

import { createClient } from '@/lib/supabase/server'
import type { Periodo } from '@/types/database'

async function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (await createClient()) as any
}

// ─── TIPOS EXPORTADOS ────────────────────────────────────────────────────────

export type Actividad = {
  id: string
  asignacion_id: string
  periodo_id: string
  nombre: string
  porcentaje: number
}

export type Calificacion = {
  actividad_id: string
  estudiante_id: string
  valor: number
}

export type PesoPeriodo = {
  periodo_id: string
  peso: number
}

export type ResumenPeriodo = {
  periodoId: string
  periodoNumero: number
  peso: number
  actividades: {
    id: string
    nombre: string
    porcentaje: number
    valor: number | null
  }[]
  definitiva: number | null
}

export type ResumenEstudianteData = {
  estudianteId: string
  nombre: string
  apellido: string
  periodos: ResumenPeriodo[]
  definitiva_anio: number | null
  aprobo: boolean
}

// ─── PERIODOS ────────────────────────────────────────────────────────────────

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

// ─── ACTIVIDADES ─────────────────────────────────────────────────────────────

export async function getActividades(asignacionId: string, periodoId: string): Promise<Actividad[]> {
  const db = await getDb()
  const { data, error } = await db
    .from('actividades_nota')
    .select('id, asignacion_id, periodo_id, nombre, porcentaje')
    .eq('asignacion_id', asignacionId)
    .eq('periodo_id', periodoId)
    .order('created_at')
  if (error) throw new Error(error.message)
  return (data ?? []) as Actividad[]
}

export async function crearActividad(
  asignacionId: string,
  periodoId: string,
  nombre: string,
  porcentaje: number
): Promise<void> {
  const db = await getDb()
  // Validar suma total
  const existentes = await getActividades(asignacionId, periodoId)
  const sumaActual = existentes.reduce((acc, a) => acc + Number(a.porcentaje), 0)
  if (sumaActual + porcentaje > 100) {
    throw new Error(`La suma de porcentajes supera 100%. Disponible: ${(100 - sumaActual).toFixed(1)}%`)
  }
  const { error } = await db
    .from('actividades_nota')
    .insert({ asignacion_id: asignacionId, periodo_id: periodoId, nombre, porcentaje })
  if (error) throw new Error(error.message)
}

export async function actualizarActividad(
  id: string,
  asignacionId: string,
  periodoId: string,
  nombre: string,
  porcentaje: number
): Promise<void> {
  const db = await getDb()
  const existentes = await getActividades(asignacionId, periodoId)
  const sumaOtras = existentes
    .filter((a) => a.id !== id)
    .reduce((acc, a) => acc + Number(a.porcentaje), 0)
  if (sumaOtras + porcentaje > 100) {
    throw new Error(`La suma de porcentajes supera 100%. Disponible: ${(100 - sumaOtras).toFixed(1)}%`)
  }
  const { error } = await db
    .from('actividades_nota')
    .update({ nombre, porcentaje })
    .eq('id', id)
  if (error) throw new Error(error.message)
}

export async function eliminarActividad(id: string): Promise<void> {
  const db = await getDb()
  const { error } = await db.from('actividades_nota').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// ─── CALIFICACIONES ──────────────────────────────────────────────────────────

export async function getCalificacionesPorActividad(
  actividadId: string
): Promise<Calificacion[]> {
  const db = await getDb()
  const { data, error } = await db
    .from('calificaciones')
    .select('actividad_id, estudiante_id, valor')
    .eq('actividad_id', actividadId)
  if (error) throw new Error(error.message)
  return (data ?? []) as Calificacion[]
}

export async function getCalificacionesPorPeriodo(
  asignacionId: string,
  periodoId: string
): Promise<Calificacion[]> {
  const db = await getDb()
  // Obtener ids de actividades del periodo
  const { data: acts, error: aErr } = await db
    .from('actividades_nota')
    .select('id')
    .eq('asignacion_id', asignacionId)
    .eq('periodo_id', periodoId)
  if (aErr) throw new Error(aErr.message)
  const ids = (acts ?? []).map((a: { id: string }) => a.id)
  if (ids.length === 0) return []

  const { data, error } = await db
    .from('calificaciones')
    .select('actividad_id, estudiante_id, valor')
    .in('actividad_id', ids)
  if (error) throw new Error(error.message)
  return (data ?? []) as Calificacion[]
}

export async function guardarCalificaciones(
  calificaciones: Calificacion[]
): Promise<void> {
  if (calificaciones.length === 0) return
  const db = await getDb()
  const { error } = await db
    .from('calificaciones')
    .upsert(calificaciones, { onConflict: 'actividad_id,estudiante_id' })
  if (error) throw new Error(error.message)
}

// ─── PESOS PERIODO ───────────────────────────────────────────────────────────

export async function getPesosPeriodo(
  asignacionId: string,
  periodos: Periodo[]
): Promise<PesoPeriodo[]> {
  const db = await getDb()
  const { data, error } = await db
    .from('pesos_periodo')
    .select('periodo_id, peso')
    .eq('asignacion_id', asignacionId)
  if (error) throw new Error(error.message)
  const guardados = (data ?? []) as PesoPeriodo[]
  const guardadosMap = new Map(guardados.map((p) => [p.periodo_id, p.peso]))
  const defecto = periodos.length > 0 ? Number((100 / periodos.length).toFixed(2)) : 25
  return periodos.map((p) => ({
    periodo_id: p.id,
    peso: guardadosMap.get(p.id) ?? defecto,
  }))
}

export async function guardarPesosPeriodo(
  asignacionId: string,
  pesos: PesoPeriodo[]
): Promise<void> {
  const total = pesos.reduce((acc, p) => acc + p.peso, 0)
  if (Math.abs(total - 100) > 0.1) {
    throw new Error(`La suma de pesos debe ser 100%. Suma actual: ${total.toFixed(1)}%`)
  }
  const db = await getDb()
  const payload = pesos.map((p) => ({ asignacion_id: asignacionId, ...p }))
  const { error } = await db
    .from('pesos_periodo')
    .upsert(payload, { onConflict: 'asignacion_id,periodo_id' })
  if (error) throw new Error(error.message)
}

// ─── RESUMEN PARA INFORMES ───────────────────────────────────────────────────

export async function getResumenEstudiante(
  asignacionId: string,
  estudianteId: string,
  periodos: Periodo[]
): Promise<ResumenPeriodo[]> {
  const db = await getDb()

  const pesosRaw = await getPesosPeriodo(asignacionId, periodos)
  const pesosMap = new Map(pesosRaw.map((p) => [p.periodo_id, p.peso]))

  const { data: actsData, error: aErr } = await db
    .from('actividades_nota')
    .select('id, periodo_id, nombre, porcentaje')
    .eq('asignacion_id', asignacionId)
    .order('created_at')
  if (aErr) throw new Error(aErr.message)
  const acts = (actsData ?? []) as { id: string; periodo_id: string; nombre: string; porcentaje: number }[]

  const actIds = acts.map((a) => a.id)
  let califMap = new Map<string, number>()
  if (actIds.length > 0) {
    const { data: califData, error: cErr } = await db
      .from('calificaciones')
      .select('actividad_id, valor')
      .in('actividad_id', actIds)
      .eq('estudiante_id', estudianteId)
    if (cErr) throw new Error(cErr.message)
    califMap = new Map((califData ?? []).map((c: { actividad_id: string; valor: number }) => [c.actividad_id, c.valor]))
  }

  return periodos.map((p) => {
    const peso = pesosMap.get(p.id) ?? 25
    const actsDelPeriodo = acts.filter((a) => a.periodo_id === p.id)
    const actConCalif = actsDelPeriodo.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      porcentaje: Number(a.porcentaje),
      valor: califMap.has(a.id) ? Number(califMap.get(a.id)) : null,
    }))
    const sumPct = actsDelPeriodo.reduce((acc, a) => acc + Number(a.porcentaje), 0)
    let definitiva: number | null = null
    if (sumPct > 0 && actConCalif.some((a) => a.valor !== null)) {
      const suma = actConCalif.reduce((acc, a) => {
        if (a.valor === null) return acc
        return acc + (a.valor * a.porcentaje) / 100
      }, 0)
      definitiva = Number((suma * (100 / sumPct)).toFixed(2))
    }
    return { periodoId: p.id, periodoNumero: p.numero, peso, actividades: actConCalif, definitiva }
  })
}

export async function getResumenGrupo(
  asignacionId: string,
  grupoId: string,
  periodos: Periodo[]
): Promise<ResumenEstudianteData[]> {
  const db = await getDb()

  const { data: alumnos, error: eErr } = await db
    .from('estudiantes')
    .select('id, nombre, apellido')
    .eq('grupo_id', grupoId)
    .eq('activo', true)
    .order('apellido')
  if (eErr) throw new Error(eErr.message)

  const estudiantesLista = (alumnos ?? []) as { id: string; nombre: string; apellido: string }[]
  const pesosRaw = await getPesosPeriodo(asignacionId, periodos)
  const pesosMap = new Map(pesosRaw.map((p) => [p.periodo_id, p.peso]))

  const { data: actsData, error: aErr } = await db
    .from('actividades_nota')
    .select('id, periodo_id, nombre, porcentaje')
    .eq('asignacion_id', asignacionId)
    .order('created_at')
  if (aErr) throw new Error(aErr.message)
  const acts = (actsData ?? []) as { id: string; periodo_id: string; nombre: string; porcentaje: number }[]

  const actIds = acts.map((a) => a.id)
  let todasCalif: { actividad_id: string; estudiante_id: string; valor: number }[] = []
  if (actIds.length > 0) {
    const { data: califData, error: cErr } = await db
      .from('calificaciones')
      .select('actividad_id, estudiante_id, valor')
      .in('actividad_id', actIds)
    if (cErr) throw new Error(cErr.message)
    todasCalif = (califData ?? []) as typeof todasCalif
  }

  return estudiantesLista.map((e) => {
    const califPorActividad = new Map(
      todasCalif.filter((c) => c.estudiante_id === e.id).map((c) => [c.actividad_id, c.valor])
    )

    let definitiva_anio: number | null = null
    let totalPeso = 0
    let sumaAnio = 0
    let algunoConNota = false

    const periodoResumen: ResumenPeriodo[] = periodos.map((p) => {
      const peso = pesosMap.get(p.id) ?? 25
      const actsDelPeriodo = acts.filter((a) => a.periodo_id === p.id)
      const actConCalif = actsDelPeriodo.map((a) => ({
        id: a.id, nombre: a.nombre, porcentaje: Number(a.porcentaje),
        valor: califPorActividad.has(a.id) ? Number(califPorActividad.get(a.id)) : null,
      }))
      const sumPct = actsDelPeriodo.reduce((acc, a) => acc + Number(a.porcentaje), 0)
      let definitiva: number | null = null
      if (sumPct > 0 && actConCalif.some((a) => a.valor !== null)) {
        const suma = actConCalif.reduce((acc, a) => {
          if (a.valor === null) return acc
          return acc + (a.valor * a.porcentaje) / 100
        }, 0)
        definitiva = Number((suma * (100 / sumPct)).toFixed(2))
        sumaAnio += definitiva * (peso / 100)
        totalPeso += peso
        algunoConNota = true
      }
      return { periodoId: p.id, periodoNumero: p.numero, peso, actividades: actConCalif, definitiva }
    })

    if (algunoConNota && totalPeso > 0) {
      definitiva_anio = Number((sumaAnio * (100 / totalPeso)).toFixed(2))
    }

    return {
      estudianteId: e.id,
      nombre: e.nombre,
      apellido: e.apellido,
      periodos: periodoResumen,
      definitiva_anio,
      aprobo: definitiva_anio !== null && definitiva_anio >= 3.0,
    }
  })
}
