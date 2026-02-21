import { forwardRef, type InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={`flex h-10 w-full rounded-lg border bg-slate-800/50 px-3 py-2 text-sm text-slate-100
            placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950
            disabled:cursor-not-allowed disabled:opacity-50
            ${error
              ? 'border-red-500/50 focus:ring-red-500'
              : 'border-slate-700 focus:ring-primary-500'}
            ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-400">{error}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
