import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_MAP = {
  superadmin: 'admin',
  admin:      'admin',
  manager:    'manager',
  employee:   'employee',
  auditor:    'auditor',
  accountant: 'accountant',
}

export function getRouteRole(user) {
  // active_role birinchi tekshiriladi
  const activeRole = user?.active_role
  if (activeRole && ROLE_MAP[activeRole]) return ROLE_MAP[activeRole]

  const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles]
  if (!roles || roles.length === 0) return null

  const PRIORITY = { superadmin: 1, admin: 2, manager: 3, auditor: 4, accountant: 5, employee: 6 }
  const topRole = roles.reduce((h, c) => (PRIORITY[c] || 99) < (PRIORITY[h] || 99) ? c : h)
  return ROLE_MAP[topRole] || topRole
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