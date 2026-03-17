import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Package, FileText, Receipt, TrendingUp, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react'
import { Header } from '../components/layout/Header'
import { StatCard } from '../components/ui/Card'
import { EventStatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import type { Event, Company } from '../types'

interface DashboardProps {
  events: Event[]
  company: Company | null
  inventoryCount: number
}

export function Dashboard({ events, company, inventoryCount }: DashboardProps) {
  const navigate = useNavigate()

  const pending = events.filter(e => e.status === 'pendiente').length
  const budgeted = events.filter(e => e.status === 'presupuestado').length
  const confirmed = events.filter(e => e.status === 'confirmado').length
  const completed = events.filter(e => e.status === 'completado').length

  // Upcoming events (next 60 days)
  const now = new Date()
  const in60 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
  const upcoming = events
    .filter(e => {
      if (!e.event_date) return false
      const d = new Date(e.event_date)
      return d >= now && d <= in60 && e.status !== 'cancelado'
    })
    .sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime())
    .slice(0, 8)

  const recentEvents = events.slice(0, 5)

  return (
    <div className="flex-1">
      <Header
        title={`Hola, ${company?.name || 'Event.ia'}`}
        subtitle="Resumen de tu actividad audiovisual"
        actions={
          <Button
            icon={<Plus size={16} />}
            onClick={() => navigate('/eventos?new=1')}
          >
            Nuevo evento
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Eventos activos"
            value={pending + budgeted + confirmed}
            icon={<Calendar size={20} />}
            color="blue"
            subtitle={`${pending} pendientes, ${budgeted} presupuestados`}
          />
          <StatCard
            label="Confirmados"
            value={confirmed}
            icon={<CheckCircle size={20} />}
            color="green"
            subtitle="En producción"
          />
          <StatCard
            label="Completados"
            value={completed}
            icon={<TrendingUp size={20} />}
            color="purple"
            subtitle="Este año"
          />
          <StatCard
            label="Inventario"
            value={inventoryCount}
            icon={<Package size={20} />}
            color="orange"
            subtitle="Equipos activos"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming events */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Próximos eventos
                </h3>
                <Button variant="ghost" size="sm" onClick={() => navigate('/eventos')}>
                  Ver todos
                </Button>
              </div>
              <div className="divide-y divide-gray-50">
                {upcoming.length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar size={36} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400 text-sm">No hay eventos próximos</p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => navigate('/eventos?new=1')}
                    >
                      Crear evento
                    </Button>
                  </div>
                ) : upcoming.map(event => {
                  const date = event.event_date ? new Date(event.event_date) : null
                  const daysUntil = date
                    ? Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : null

                  return (
                    <div
                      key={event.id}
                      className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/eventos/${event.id}`)}
                    >
                      {/* Date block */}
                      <div className="w-12 text-center flex-shrink-0">
                        {date ? (
                          <>
                            <div className="text-xl font-bold text-primary leading-none" style={{ fontFamily: 'Space Grotesk' }}>
                              {date.getDate()}
                            </div>
                            <div className="text-xs text-gray-400 uppercase">
                              {date.toLocaleDateString('es-ES', { month: 'short' })}
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{event.name}</p>
                        {event.artist && (
                          <p className="text-xs text-primary-mid font-medium">{event.artist}</p>
                        )}
                        <p className="text-xs text-gray-400 truncate">
                          {event.venue}{event.city ? ` • ${event.city}` : ''}
                        </p>
                      </div>

                      {/* Right side */}
                      <div className="flex flex-col items-end gap-1.5">
                        <EventStatusBadge status={event.status} />
                        {daysUntil !== null && (
                          <span className={`text-xs font-medium ${daysUntil <= 7 ? 'text-orange-600' : 'text-gray-400'}`}>
                            {daysUntil === 0 ? 'Hoy' : daysUntil === 1 ? 'Mañana' : `En ${daysUntil}d`}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Quick actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Acciones rápidas
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Nuevo evento', icon: Calendar, path: '/eventos?new=1', color: 'text-blue-600 bg-blue-50' },
                  { label: 'Subir rider', icon: FileText, path: '/riders?new=1', color: 'text-purple-600 bg-purple-50' },
                  { label: 'Crear presupuesto', icon: Receipt, path: '/presupuestos?new=1', color: 'text-green-600 bg-green-50' },
                  { label: 'Añadir equipo', icon: Package, path: '/inventario?new=1', color: 'text-orange-600 bg-orange-50' },
                ].map(({ label, icon: Icon, path, color }) => (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <span className={`p-2 rounded-lg ${color}`}>
                      <Icon size={15} />
                    </span>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Pending actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Requieren atención
              </h3>
              {recentEvents.filter(e => e.status === 'pendiente').length === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle size={28} className="mx-auto text-green-400 mb-2" />
                  <p className="text-xs text-gray-400">Todo al día</p>
                </div>
              ) : recentEvents.filter(e => e.status === 'pendiente').map(event => (
                <div
                  key={event.id}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors mb-1"
                  onClick={() => navigate(`/eventos/${event.id}`)}
                >
                  <AlertCircle size={14} className="text-orange-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{event.name}</p>
                    <p className="text-xs text-gray-400">Sin rider ni presupuesto</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Flow reminder */}
            <div className="bg-primary-light border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-2">
                <Clock size={14} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-primary mb-1">Flujo obligatorio</p>
                  <ol className="text-xs text-primary/80 space-y-0.5 list-decimal list-inside">
                    <li>Rider PDF → análisis IA</li>
                    <li>Presupuesto → cliente confirma</li>
                    <li>Contra-rider + lista de carga</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
