export type Rol = 'rector' | 'docente' | 'administrativo'
export type EstadoAsistencia = 'presente' | 'ausente' | 'tarde' | 'excusa'

export interface Profile {
  id: string
  auth_user_id: string
  nombre: string
  apellido: string
  rol: Rol
  created_at: string
}

export interface Grado {
  id: string
  nombre: string
  nivel: number
}

export interface Grupo {
  id: string
  grado_id: string
  nombre: string
  jornada: 'manana' | 'tarde' | 'unica'
  director_id?: string
}

export interface Estudiante {
  id: string
  nombre: string
  apellido: string
  documento: string
  fecha_nacimiento: string
  grupo_id: string
  activo: boolean
  created_at: string
}

export interface Materia {
  id: string
  nombre: string
  codigo: string
  horas_semana: number
}

export interface Periodo {
  id: string
  numero: number
  anio: number
  fecha_inicio: string
  fecha_fin: string
}

export interface Asignacion {
  id: string
  docente_id: string
  grupo_id: string
  materia_id: string
  anio: number
}

export interface Asistencia {
  id: string
  asignacion_id: string
  estudiante_id: string
  fecha: string
  estado: EstadoAsistencia
  observacion?: string
  created_at: string
}

export interface Nota {
  id: string
  asignacion_id: string
  estudiante_id: string
  periodo_id: string
  nota1?: number
  nota2?: number
  nota3?: number
  definitiva?: number
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'id' | 'created_at'>; Update: Partial<Profile> }
      grados: { Row: Grado; Insert: Omit<Grado, 'id'>; Update: Partial<Grado> }
      grupos: { Row: Grupo; Insert: Omit<Grupo, 'id'>; Update: Partial<Grupo> }
      estudiantes: { Row: Estudiante; Insert: Omit<Estudiante, 'id' | 'created_at'>; Update: Partial<Estudiante> }
      materias: { Row: Materia; Insert: Omit<Materia, 'id'>; Update: Partial<Materia> }
      periodos: { Row: Periodo; Insert: Omit<Periodo, 'id'>; Update: Partial<Periodo> }
      asignaciones: { Row: Asignacion; Insert: Omit<Asignacion, 'id'>; Update: Partial<Asignacion> }
      asistencia: { Row: Asistencia; Insert: Omit<Asistencia, 'id' | 'created_at'>; Update: Partial<Asistencia> }
      notas: { Row: Nota; Insert: Omit<Nota, 'id' | 'created_at'>; Update: Partial<Nota> }
    }
  }
}
