import { Bell } from 'lucide-react'
import { UserMenu } from './UserMenu'

export function Header() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-smoke bg-charcoal px-6">
      <div />
      <div className="flex items-center gap-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-md text-silver hover:bg-graphite hover:text-ivory transition-colors">
          <Bell size={18} />
        </button>
        <UserMenu />
      </div>
    </header>
  )
}
