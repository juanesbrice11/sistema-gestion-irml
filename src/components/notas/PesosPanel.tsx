'use client'

import { useState, useTransition } from 'react'
import { guardarPesosPeriodo, type PesoPeriodo } from '@/actions/notas'
import { Button } from '@/components/ui/button'
import type { Periodo } from '@/types/database'

interface Props {
  asignacionId: string
  periodos: Periodo[]
  pesos: PesoPeriodo[]
  onGuardado: (pesos: PesoPeriodo[]) => void
}

export function PesosPanel({ asignacionId, periodos, pesos: initialPesos, onGuardado }: Props) {
  const [pesos, setPesos] = useState<PesoPeriodo[]>(initialPesos)
  const [error, setError] = useState('')
  const [guardado, setGuardado] = useState(false)
  const [isPending, startTransition] = useTransition()

  const suma = pesos.reduce((acc, p) => acc + Number(p.peso), 0)
  const valida = Math.abs(suma - 100) < 0.1

  function actualizar(periodoId: string, valor: string) {
    const num = parseFloat(valor)
    setPesos((prev) =>
      prev.map((p) => (p.periodo_id === periodoId ? { ...p, peso: isNaN(num) ? 0 : num } : p))
    )
    setGuardado(false)
  }

  function distribuirIgual() {
    const igual = Number((100 / periodos.length).toFixed(2))
    setPesos(periodos.map((p, i) => ({
      periodo_id: p.id,
      peso: i === periodos.length - 1 ? Number((100 - igual * (periodos.length - 1)).toFixed(2)) : igual,
    })))
    setGuardado(false)
  }

  function guardar() {
    if (!valida) { setError(`La suma debe ser exactamente 100%. Suma actual: ${suma.toFixed(1)}%`); return }
    setError('')
    startTransition(async () => {
      try {
        await guardarPesosPeriodo(asignacionId, pesos)
        setGuardado(true)
        onGuardado(pesos)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error al guardar')
      }
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">Pesos de los periodos</h3>
          <p className="text-xs text-slate-400 mt-0.5">Define cuánto vale cada periodo en la nota final del año</p>
        </div>
        <button
          onClick={distribuirIgual}
          className="text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors"
        >
          Distribuir igual
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {periodos.map((p) => {
          const peso = pesos.find((pw) => pw.periodo_id === p.id)?.peso ?? 25
          return (
            <div key={p.id} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-600">Periodo {p.numero}</label>
              <div className="relative">
                <input
                  type="number"
                  min={0.1}
                  max={100}
                  step={0.1}
                  value={peso}
                  onChange={(e) => actualizar(p.id, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-7 text-sm text-slate-900 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Barra total */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${valida ? 'bg-secondary-500' : suma > 100 ? 'bg-red-500' : 'bg-primary-500'}`}
            style={{ width: `${Math.min(suma, 100)}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${valida ? 'text-secondary-600' : 'text-red-600'}`}>
          {suma.toFixed(1)}%
        </span>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center justify-between">
        {guardado && <p className="text-sm text-secondary-600 font-medium">✓ Pesos guardados</p>}
        {!guardado && <span />}
        <Button size="sm" onClick={guardar} loading={isPending} disabled={isPending || !valida}>
          Guardar pesos
        </Button>
      </div>
    </div>
  )
}
