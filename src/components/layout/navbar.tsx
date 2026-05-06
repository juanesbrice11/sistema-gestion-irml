'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { IconHome, IconClipboard, IconBook, IconPackage, IconLogout } from '@/components/ui/icons'
import type { Rol } from '@/types/database'

interface NavItem {
  href: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  roles: Rol[]
}

const navItems: NavItem[] = [
  { href: '/',            label: 'Inicio',     Icon: IconHome,      roles: ['rector', 'docente', 'administrativo'] },
  { href: '/asistencia',  label: 'Asistencia', Icon: IconClipboard, roles: ['rector', 'docente'] },
  { href: '/notas',       label: 'Notas',      Icon: IconBook,      roles: ['rector', 'docente'] },
  { href: '/inventario',  label: 'Inventario', Icon: IconPackage,   roles: ['rector', 'administrativo'] },
]

interface NavbarProps {
  nombre: string
  apellido: string
  rol: Rol
}

export function Navbar({ nombre, apellido, rol }: NavbarProps) {
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
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
      <nav className="flex items-center justify-between bg-primary-950/95 backdrop-blur-md border border-primary-800/40 rounded-2xl px-5 py-3 shadow-xl shadow-primary-950/30">

        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <Image src="/escudo.jpeg" alt="Escudo IE Ramón Messa Londoño" width={32} height={32} className="rounded-md object-contain" />
          <span className="font-semibold text-white text-sm hidden sm:inline">EduGestión</span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-0.5">
          {allowed.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium',
                  'transition-all duration-200',
                  isActive
                    ? 'bg-primary-700/70 text-white'
                    : 'text-primary-300 hover:text-white hover:bg-primary-800/50'
                )}
              >
                <item.Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-medium text-white leading-tight truncate max-w-[140px]">
              {nombre} {apellido}
            </p>
            <p className="text-[11px] text-primary-400 capitalize leading-tight mt-0.5">{rol}</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-primary-700/50 border border-primary-600/30 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {nombre.charAt(0)}{apellido.charAt(0)}
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="text-primary-400 hover:text-white transition-colors duration-200 p-1.5 rounded-lg hover:bg-primary-800/50 flex-shrink-0"
          >
            <IconLogout className="w-4 h-4" />
          </button>
        </div>

      </nav>
    </div>
  )
}
