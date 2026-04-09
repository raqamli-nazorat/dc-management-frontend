import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  ReceiptText,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/shared/config/routes'

export interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Ishchilar', path: ROUTES.WORKERS, icon: Users },
  { label: 'Bo\'limlar', path: ROUTES.DEPARTMENTS, icon: Building2 },
  { label: 'Xarajatlar', path: ROUTES.EXPENSE_REQUESTS, icon: ReceiptText },
  { label: 'Sozlamalar', path: ROUTES.SETTINGS, icon: Settings },
]
