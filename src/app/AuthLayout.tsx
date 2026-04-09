import { Navigate, Outlet } from 'react-router-dom'
import { useSessionStore } from '@/entities/session/model/sessionStore'
import { ROUTES } from '@/shared/config/routes'

export function AuthLayout() {
  const token = useSessionStore((s) => s.token)
  if (token) return <Navigate to={ROUTES.DASHBOARD} replace />
  return <Outlet />
}
