import { useQuery } from '@tanstack/react-query'
import { Heading } from '@/shared/ui/Typography'
import { StatsOverview } from '@/widgets/stats-overview/ui/StatsOverview'
import { workerApi } from '@/entities/worker/api/workerApi'
import { departmentApi } from '@/entities/department/api/departmentApi'
import { formatDate } from '@/shared/lib/formatDate'

export function DashboardPage() {
  const { data: workers, isLoading: loadingWorkers } = useQuery({
    queryKey: ['workers', 'dashboard'],
    queryFn: () => workerApi.getAll({ limit: 1000 }),
  })

  const { data: departments, isLoading: loadingDepts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAll(),
  })

  const stats = workers
    ? {
        totalWorkers: workers.total,
        activeWorkers: workers.data.filter((w) => w.status === 'active').length,
        inactiveWorkers: workers.data.filter((w) => w.status === 'inactive').length,
        departments: departments?.total ?? 0,
      }
    : undefined

  const isLoading = loadingWorkers || loadingDepts

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={2}>Dashboard</Heading>
          <p className="mt-1 text-sm text-silver">{formatDate(new Date())}</p>
        </div>
      </div>

      <StatsOverview data={stats} isLoading={isLoading} />

      {/* Recent workers */}
      {workers && workers.data.length > 0 && (
        <div className="rounded-lg border border-smoke bg-charcoal">
          <div className="border-b border-smoke px-6 py-4">
            <h3 className="font-display text-base font-semibold text-ivory">
              So'nggi qo'shilgan ishchilar
            </h3>
          </div>
          <div className="divide-y divide-smoke">
            {workers.data.slice(0, 5).map((worker) => (
              <div key={worker.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-ivory">
                    {worker.firstName} {worker.lastName}
                  </p>
                  <p className="text-xs text-silver">{worker.position}</p>
                </div>
                <span className="text-xs text-silver">{formatDate(worker.hireDate)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
