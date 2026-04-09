import type { LucideIcon } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label: string }
  accent?: boolean
}

export function StatCard({ label, value, icon: Icon, trend, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-lg border p-5 transition-shadow hover:shadow-card-hover',
        accent
          ? 'border-gold/20 bg-charcoal shadow-luxury'
          : 'border-smoke bg-charcoal shadow-card'
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-md',
            accent ? 'bg-gold/15 text-gold' : 'bg-graphite text-silver'
          )}
        >
          <Icon size={20} />
        </div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium',
              trend.value >= 0 ? 'text-success' : 'text-danger'
            )}
          >
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div>
        <p className="font-display text-2xl font-bold text-ivory">{value}</p>
        <p className="mt-0.5 text-sm text-silver">{label}</p>
      </div>
    </div>
  )
}
