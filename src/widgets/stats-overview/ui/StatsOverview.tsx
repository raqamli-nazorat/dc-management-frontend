import { Users, Building2, UserCheck, UserX } from 'lucide-react'
import { StatCard } from './StatCard'

interface StatsData {
  totalWorkers: number
  activeWorkers: number
  inactiveWorkers: number
  departments: number
}

interface StatsOverviewProps {
  data?: StatsData
  isLoading?: boolean
}

const defaultData: StatsData = {
  totalWorkers: 0,
  activeWorkers: 0,
  inactiveWorkers: 0,
  departments: 0,
}

export function StatsOverview({ data = defaultData, isLoading }: StatsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg border border-smoke bg-charcoal" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Jami ishchilar"
        value={data.totalWorkers}
        icon={Users}
        accent
      />
      <StatCard
        label="Faol ishchilar"
        value={data.activeWorkers}
        icon={UserCheck}
        trend={{ value: 8, label: 'bu oy' }}
      />
      <StatCard
        label="Nofaol ishchilar"
        value={data.inactiveWorkers}
        icon={UserX}
      />
      <StatCard
        label="Bo'limlar"
        value={data.departments}
        icon={Building2}
      />
    </div>
  )
}
