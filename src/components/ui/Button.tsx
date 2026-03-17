import React from 'react'

type Variant = 'primary' | 'secondary' | 'accent' | 'danger' | 'ghost' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-mid border border-primary',
  secondary: 'bg-white text-primary border border-primary hover:bg-primary-light',
  accent: 'bg-accent text-white hover:bg-orange-600 border border-accent',
  danger: 'bg-danger text-white hover:bg-red-700 border border-danger',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 border border-gray-300',
  success: 'bg-success text-white hover:bg-green-700 border border-success',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg transition-all
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
    </button>
  )
}
