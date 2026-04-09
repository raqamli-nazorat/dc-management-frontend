import { Navigate, Outlet } from 'react-router-dom'
import { useSessionStore } from '@/entities/session/model/sessionStore'
import { ROUTES } from '@/shared/config/routes'

export function ProtectedRoute() {
  const token = useSessionStore((s) => s.token)
  if (!token) return <Navigate to={ROUTES.AUTH} replace />
  return <Outlet />
}
