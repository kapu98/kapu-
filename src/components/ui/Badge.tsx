import React from 'react'
import type { CoverageStatus, EventStatus, BudgetStatus } from '../../types'

interface BadgeProps {
  children: React.ReactNode
  color?: 'green' | 'yellow' | 'red' | 'blue' | 'gray' | 'orange' | 'purple'
  size?: 'sm' | 'md'
  dot?: boolean
}

const colorClasses = {
  green: 'bg-green-100 text-green-800 border border-green-200',
  yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  red: 'bg-red-100 text-red-800 border border-red-200',
  blue: 'bg-blue-100 text-blue-800 border border-blue-200',
  gray: 'bg-gray-100 text-gray-600 border border-gray-200',
  orange: 'bg-orange-100 text-orange-800 border border-orange-200',
  purple: 'bg-purple-100 text-purple-800 border border-purple-200',
}

const dotColors = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  gray: 'bg-gray-400',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
}

export function Badge({ children, color = 'gray', size = 'sm', dot = false }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 font-medium rounded-full
      ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}
      ${colorClasses[color]}
    `}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />}
      {children}
    </span>
  )
}

// Semáforo para análisis de rider
export function CoverageBadge({ status }: { status: CoverageStatus }) {
  const config = {
    covered: { color: 'green' as const, label: '✓ Cubierto' },
    partial: { color: 'yellow' as const, label: '~ Parcial' },
    pending: { color: 'red' as const, label: '✗ Pendiente' },
    not_applicable: { color: 'gray' as const, label: '— N/A' },
  }
  const { color, label } = config[status] || config.not_applicable
  return <Badge color={color} dot>{label}</Badge>
}

// Badge para estado de evento
export function EventStatusBadge({ status }: { status: EventStatus }) {
  const config: Record<EventStatus, { color: BadgeProps['color']; label: string }> = {
    pendiente: { color: 'gray', label: 'Pendiente' },
    presupuestado: { color: 'blue', label: 'Presupuestado' },
    confirmado: { color: 'green', label: 'Confirmado' },
    completado: { color: 'purple', label: 'Completado' },
    cancelado: { color: 'red', label: 'Cancelado' },
  }
  const { color, label } = config[status] || config.pendiente
  return <Badge color={color} dot>{label}</Badge>
}

// Badge para estado de presupuesto
export function BudgetStatusBadge({ status }: { status: BudgetStatus }) {
  const config: Record<BudgetStatus, { color: BadgeProps['color']; label: string }> = {
    borrador: { color: 'gray', label: 'Borrador' },
    enviado: { color: 'blue', label: 'Enviado' },
    aceptado: { color: 'green', label: 'Aceptado' },
    rechazado: { color: 'red', label: 'Rechazado' },
  }
  const { color, label } = config[status] || config.borrador
  return <Badge color={color} dot>{label}</Badge>
}
