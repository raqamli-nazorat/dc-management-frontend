import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, options, placeholder, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-pearl">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'h-10 w-full rounded border bg-graphite px-3 text-sm text-ivory',
            'border-smoke focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30',
            'transition-colors duration-150 cursor-pointer',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            error && 'border-danger focus:border-danger focus:ring-danger/30',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="text-silver bg-graphite">
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-graphite text-ivory">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-silver">{hint}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
