import { forwardRef, type ButtonHTMLAttributes } from 'react'

// ----- Variantes -----

const variantStyles = {
  primary:
    'bg-primary-600 text-white shadow-sm hover:bg-primary-500 focus-visible:ring-primary-500',
  secondary:
    'bg-slate-800 text-slate-200 shadow-sm hover:bg-slate-700 focus-visible:ring-slate-500',
  danger:
    'bg-red-600 text-white shadow-sm hover:bg-red-500 focus-visible:ring-red-500',
  ghost:
    'text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus-visible:ring-slate-500',
  outline:
    'border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100 focus-visible:ring-slate-500',
} as const

const sizeStyles = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
} as const

// ----- Props -----

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles
  size?: keyof typeof sizeStyles
  isLoading?: boolean
}

// ----- Componente -----

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950
          disabled:pointer-events-none disabled:opacity-50
          ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
