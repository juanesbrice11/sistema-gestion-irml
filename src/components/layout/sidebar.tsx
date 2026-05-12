'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Rol } from '@/types/database'

interface NavItem {
  href: string
  label: string
  icon: string
  roles: Rol[]
}

const navItems: NavItem[] = [
  { href: '/', label: 'Inicio', icon: '🏠', roles: ['rector', 'docente', 'administrativo'] },
  { href: '/asistencia', label: 'Asistencia', icon: '📋', roles: ['rector', 'docente'] },
  { href: '/notas', label: 'Notas', icon: '📝', roles: ['rector', 'docente'] },
]

interface SidebarProps {
  nombre: string
  apellido: string
  rol: Rol
}

export function Sidebar({ nombre, apellido, rol }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const allowed = navItems.filter((item) => item.roles.includes(rol))

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-primary-900 text-white">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center font-bold text-lg">
            E
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">EduGestión</p>
            <p className="text-xs text-primary-300 leading-tight">IE Ramón Messa</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {allowed.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-primary-200 hover:bg-primary-800 hover:text-white'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Usuario */}
      <div className="px-4 py-4 border-t border-primary-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold">
            {nombre.charAt(0)}{apellido.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{nombre} {apellido}</p>
            <p className="text-xs text-primary-400 capitalize">{rol}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs text-primary-400 hover:text-white transition-colors px-1"
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  )
}
