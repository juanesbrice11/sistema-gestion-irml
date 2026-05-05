'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">

      {/* Panel izquierdo — marca institucional */}
      <div className="hidden lg:flex lg:w-[42%] bg-primary-950 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(55,88,196,0.3),transparent)]" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-700/30 to-transparent" />

        <div className="relative z-10 text-center select-none">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-800/60 border border-primary-700/40 text-white text-4xl font-bold mb-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.07)]">
            E
          </div>
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">EduGestión</h1>
          <p className="text-primary-300 text-sm leading-relaxed">
            Sistema de gestión escolar<br />
            <span className="text-primary-500">IE Ramón Messa Londoño</span>
          </p>
        </div>

        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-xs text-primary-800">Sede Principal · Sincé, Sucre</p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#f0f4f9]">

        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-primary-700 flex items-center justify-center text-white font-bold">
            E
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm leading-tight">EduGestión</p>
            <p className="text-xs text-slate-500 leading-tight">IE Ramón Messa Londoño</p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bienvenido</h2>
            <p className="text-slate-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              id="email"
              type="email"
              label="Correo electrónico"
              placeholder="docente@iermessa.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <Input
              id="password"
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
              Iniciar sesión
            </Button>
          </form>
        </div>
      </div>

    </div>
  )
}
