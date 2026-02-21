import { forwardRef, type SelectHTMLAttributes } from 'react'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <div className="w-full">
        <select
          ref={ref}
          className={`flex h-10 w-full appearance-none rounded-lg border bg-slate-800/50 px-3 py-2 text-sm text-slate-100
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950
            disabled:cursor-not-allowed disabled:opacity-50
            ${error
              ? 'border-red-500/50 focus:ring-red-500'
              : 'border-slate-700 focus:ring-primary-500'}
            ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1 text-xs text-red-400">{error}</p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
