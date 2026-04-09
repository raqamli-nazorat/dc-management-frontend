import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSidebar } from '../model/useSidebar'
import { navItems } from '../lib/navConfig'
import { SidebarItem } from './SidebarItem'
import { cn } from '@/shared/lib/cn'

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebar()

  return (
    <aside
      className={cn(
        'relative flex h-screen flex-col border-r border-smoke bg-graphite transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Brand */}
      <div className={cn(
        'flex h-16 items-center border-b border-smoke px-4',
        isCollapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gold/30 bg-charcoal">
          <span className="font-display text-sm font-bold text-gold">DC</span>
        </div>
        {!isCollapsed && (
          <span className="font-display text-base font-semibold text-ivory truncate">
            DC Management
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <SidebarItem key={item.path} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-smoke p-3">
        <button
          onClick={toggle}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-silver hover:bg-charcoal hover:text-ivory transition-all',
            isCollapsed ? 'justify-center px-2' : ''
          )}
          title={isCollapsed ? 'Kengaytirish' : 'Yig\'ish'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : (
            <>
              <ChevronLeft size={18} />
              <span>Yig'ish</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
