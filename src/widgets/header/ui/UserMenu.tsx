import { useState, useRef, useEffect } from 'react'
import { LogOut, User, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useSessionStore } from '@/entities/session/model/sessionStore'
import { authApi } from '@/features/auth/api/authApi'
import { Avatar } from '@/shared/ui/Avatar'
import { ROUTES } from '@/shared/config/routes'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { user, clearSession } = useSessionStore()
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    clearSession()
    navigate(ROUTES.AUTH)
    toast.success('Tizimdan chiqildi')
  }

  if (!user) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-silver hover:bg-graphite hover:text-ivory transition-colors"
      >
        <Avatar name={user.name} src={user.avatarUrl} size="sm" />
        <span className="hidden sm:block">{user.name}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-lg border border-smoke bg-charcoal shadow-luxury">
          <div className="border-b border-smoke px-4 py-3">
            <p className="text-sm font-medium text-ivory">{user.name}</p>
            <p className="text-xs text-silver">{user.email}</p>
          </div>
          <div className="p-1">
            <button className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-silver hover:bg-graphite hover:text-ivory transition-colors">
              <User size={14} /> Profil
            </button>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors"
            >
              <LogOut size={14} /> Chiqish
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
