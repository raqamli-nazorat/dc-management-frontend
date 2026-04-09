import { useEffect, type HTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative w-full max-w-lg rounded-lg border border-smoke bg-charcoal shadow-luxury',
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export function ModalHeader({ className, children, onClose, ...props }: HTMLAttributes<HTMLDivElement> & { onClose?: () => void }) {
  return (
    <div className={cn('flex items-center justify-between border-b border-smoke px-6 py-4', className)} {...props}>
      <div className="font-display text-lg font-semibold text-ivory">{children}</div>
      {onClose && (
        <button onClick={onClose} className="text-silver hover:text-ivory transition-colors">
          <X size={18} />
        </button>
      )}
    </div>
  )
}

export function ModalBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-4', className)} {...props} />
}

export function ModalFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-end gap-3 border-t border-smoke px-6 py-4', className)} {...props} />
}
