import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@/shared/ui/Typography'
import { Button } from '@/shared/ui/Button'
import { WorkerFilters } from '@/features/worker-filter/ui/WorkerFilters'
import { useWorkerFilters } from '@/features/worker-filter/model/useWorkerFilters'
import { WorkersTable } from '@/widgets/workers-table/ui/WorkersTable'
import { workerApi } from '@/entities/worker/api/workerApi'
import { ROUTES } from '@/shared/config/routes'

export function WorkersPage() {
  const navigate = useNavigate()
  const { search, status, departmentId, page } = useWorkerFilters()

  const { data, isLoading } = useQuery({
    queryKey: ['workers', { search, status, departmentId, page }],
    queryFn: () => workerApi.getAll({ search, status, departmentId, page, limit: 20 }),
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={2}>Ishchilar</Heading>
          {data && (
            <p className="mt-1 text-sm text-silver">Jami: {data.total} ta ishchi</p>
          )}
        </div>
        <Button onClick={() => navigate(ROUTES.WORKERS_NEW)}>
          <Plus size={16} /> Yangi ishchi
        </Button>
      </div>

      <WorkerFilters />

      <WorkersTable workers={data?.data ?? []} isLoading={isLoading} />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => useWorkerFilters.getState().setPage(p)}
              className={[
                'flex h-8 w-8 items-center justify-center rounded text-sm transition-colors',
                p === page
                  ? 'bg-gold text-obsidian font-medium'
                  : 'text-silver hover:bg-graphite hover:text-ivory',
              ].join(' ')}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
