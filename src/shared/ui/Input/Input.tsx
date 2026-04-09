import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-pearl">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-10 w-full rounded border bg-graphite px-3 text-sm text-ivory placeholder:text-silver',
            'border-smoke focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30',
            'transition-colors duration-150',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'border-danger focus:border-danger focus:ring-danger/30',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-silver">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
