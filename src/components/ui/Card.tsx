import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  title?: string
  actions?: React.ReactNode
  border?: boolean
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({ children, className = '', padding = 'md', title, actions, border = false }: CardProps) {
  return (
    <div className={`
      bg-white rounded-xl shadow-sm
      ${border ? 'border border-gray-200' : ''}
      ${className}
    `}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          {title && (
            <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              {title}
            </h3>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={paddingClasses[padding]}>{children}</div>
    </div>
  )
}

export function StatCard({
  label,
  value,
  icon,
  color = 'blue',
  subtitle,
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  subtitle?: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {value}
          </p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
