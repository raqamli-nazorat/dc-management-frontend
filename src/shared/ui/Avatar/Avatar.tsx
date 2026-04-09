import { cn } from '@/shared/lib/cn'

interface AvatarProps {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name)
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-graphite border border-smoke font-medium text-pearl',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}
