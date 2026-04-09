import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import type { NavItem } from '../lib/navConfig'

interface SidebarItemProps {
  item: NavItem
  isCollapsed: boolean
}

export function SidebarItem({ item, isCollapsed }: SidebarItemProps) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.path}
      end={item.path === '/dashboard'}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all duration-150',
          isCollapsed ? 'justify-center px-2' : '',
          isActive
            ? 'bg-gold/10 text-gold border border-gold/20'
            : 'text-silver hover:bg-graphite hover:text-ivory'
        )
      }
      title={isCollapsed ? item.label : undefined}
    >
      <Icon size={18} className="shrink-0" />
      {!isCollapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  )
}
