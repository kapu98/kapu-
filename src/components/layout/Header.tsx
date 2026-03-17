import React from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/inventario': 'Inventario',
  '/eventos': 'Eventos',
  '/riders': 'Riders',
  '/presupuestos': 'Presupuestos',
  '/documentos': 'Documentos',
  '/personal': 'Personal',
  '/configuracion': 'Configuración',
}

interface HeaderProps {
  title?: string
  actions?: React.ReactNode
  subtitle?: string
}

export function Header({ title, actions, subtitle }: HeaderProps) {
  const location = useLocation()

  // Build breadcrumb
  const segments = location.pathname.split('/').filter(Boolean)
  const crumbs = [{ label: 'Event.ia', path: '/' }]

  if (segments.length > 0) {
    const basePath = `/${segments[0]}`
    crumbs.push({ label: routeNames[basePath] || segments[0], path: basePath })
    if (segments.length > 1) {
      crumbs.push({ label: title || segments[1], path: location.pathname })
    }
  }

  const pageTitle = title || routeNames[location.pathname] || 'Event.ia'

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path}>
            {i > 0 && <ChevronRight size={12} />}
            <span className={i === crumbs.length - 1 ? 'text-gray-600' : ''}>{crumb.label}</span>
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {pageTitle}
          </h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
