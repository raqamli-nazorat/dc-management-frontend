import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {icon && <div className="text-silver">{icon}</div>}
      <div>
        <p className="font-display text-lg font-semibold text-ivory">{title}</p>
        {description && <p className="mt-1 text-sm text-silver">{description}</p>}
      </div>
      {action}
    </div>
  )
}
