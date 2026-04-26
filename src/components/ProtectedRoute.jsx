import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_MAP = {
  superadmin: 'admin',
  admin: 'admin',
  menager: 'menager',
  xodim: 'xodim',
  au: 'xodim',
  auditor: 'nazoratchi',
}

export function getRouteRole(user) {
  const rawRole = Array.isArray(user?.roles) ? user?.roles[0] : user?.roles[0]
  return ROLE_MAP[rawRole] || rawRole
}

export default function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth()

  if (!user) return <Navigate to="/login" replace />

  const routeRole = getRouteRole(user)

  if (allowedRole && routeRole !== allowedRole) {
    return <Navigate to={`/${routeRole}/dashboard`} replace />
  }

  return children
}
