import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Calendar,
  FileText,
  Receipt,
  FolderOpen,
  Users,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react'
import type { Company, UserProfile } from '../../types'

interface SidebarProps {
  company: Company | null
  profile: UserProfile | null
  onSignOut: () => void
}

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Inventario', path: '/inventario', icon: Package },
  { label: 'Eventos', path: '/eventos', icon: Calendar },
  { label: 'Riders', path: '/riders', icon: FileText },
  { label: 'Presupuestos', path: '/presupuestos', icon: Receipt },
  { label: 'Documentos', path: '/documentos', icon: FolderOpen },
  { label: 'Personal', path: '/personal', icon: Users },
]

export function Sidebar({ company, profile, onSignOut }: SidebarProps) {
  const navigate = useNavigate()

  return (
    <aside className="sidebar w-64 min-h-screen flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-lg">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Event.ia
            </h1>
            <p className="text-blue-300 text-xs leading-none">Gestión Audiovisual</p>
          </div>
        </div>
        {company && (
          <div className="mt-3 px-3 py-2 bg-white/5 rounded-lg">
            <p className="text-white/80 text-xs font-medium truncate">{company.name}</p>
            {company.website && (
              <p className="text-blue-400 text-xs truncate">{company.website}</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-150
              ${isActive
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-blue-200/80 hover:bg-white/8 hover:text-white'
              }
            `}
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        <NavLink
          to="/configuracion"
          className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            transition-all duration-150
            ${isActive ? 'bg-white/15 text-white' : 'text-blue-200/80 hover:bg-white/8 hover:text-white'}
          `}
        >
          <Settings size={17} />
          Configuración
        </NavLink>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-7 h-7 rounded-full bg-primary-mid flex items-center justify-center text-white text-xs font-bold">
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">{profile?.full_name || 'Usuario'}</p>
          </div>
          <button
            onClick={() => { onSignOut(); navigate('/login') }}
            className="text-blue-300 hover:text-red-400 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
