import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  footer?: React.ReactNode
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
}

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`
        relative bg-white rounded-2xl shadow-2xl w-full ${sizeClasses[size]}
        max-h-[90vh] flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Form field helpers
export function FormField({
  label,
  required,
  children,
  hint,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  )
}

export function Input({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`
        w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
        placeholder:text-gray-400 transition-colors
        ${className}
      `}
    />
  )
}

export function Select({
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`
        w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
        bg-white transition-colors
        ${className}
      `}
    >
      {children}
    </select>
  )
}

export function Textarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`
        w-full px-3 py-2 text-sm border border-gray-300 rounded-lg
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
        placeholder:text-gray-400 resize-y transition-colors
        ${className}
      `}
    />
  )
}
