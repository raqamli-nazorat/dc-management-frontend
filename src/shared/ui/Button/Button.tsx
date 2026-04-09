import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/cn'
import type { ButtonHTMLAttributes } from 'react'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-sans font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        primary: 'bg-gold text-obsidian hover:bg-gold-light active:bg-gold-dark',
        secondary: 'border border-smoke bg-graphite text-ivory hover:bg-smoke hover:border-ash',
        ghost: 'text-silver hover:text-ivory hover:bg-graphite',
        danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
        outline: 'border border-gold text-gold hover:bg-gold/10',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded',
        md: 'h-10 px-4 text-sm rounded',
        lg: 'h-12 px-6 text-base rounded',
        icon: 'h-9 w-9 rounded',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

export function Button({ className, variant, size, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
