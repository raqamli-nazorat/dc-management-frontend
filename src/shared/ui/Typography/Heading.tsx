import { cn } from '@/shared/lib/cn'
import type { HTMLAttributes } from 'react'

type Level = 1 | 2 | 3 | 4

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: Level
}

const styles: Record<Level, string> = {
  1: 'text-3xl font-bold',
  2: 'text-2xl font-semibold',
  3: 'text-xl font-semibold',
  4: 'text-lg font-medium',
}

export function Heading({ level = 2, className, ...props }: HeadingProps) {
  const Tag = `h${level}` as const
  return (
    <Tag
      className={cn('font-display text-ivory', styles[level], className)}
      {...props}
    />
  )
}
