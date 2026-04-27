import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_PRIORITY = {
  superadmin: 1,
  admin: 2,
  manager: 3,
  auditor: 4,
  accountant: 5,
  employee: 6,
}

const ROLE_MAP = {
  superadmin: 'admin',
  admin: 'admin',
  manager: 'menager',
  employee: 'xodim',
  auditor: 'nazoratchi',
  accountant: 'hisobchi',
}

export function getRouteRole(user) {
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles];

  if (!roles || roles.length === 0) return null;

  const topRole = roles.reduce((highest, current) => {
    const highestPriority = ROLE_PRIORITY[highest] || 99;
    const currentPriority = ROLE_PRIORITY[current] || 99;

    return currentPriority < highestPriority ? current : highest;
  });

  return ROLE_MAP[topRole] || topRole;
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