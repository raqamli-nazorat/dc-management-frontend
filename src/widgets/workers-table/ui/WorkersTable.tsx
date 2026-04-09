import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import type { Worker } from '@/entities/worker/model/types'
import { WorkerStatusBadge } from '@/entities/worker/ui/WorkerStatusBadge'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { DeleteWorkerModal } from '@/features/worker-delete/ui/DeleteWorkerModal'
import { getWorkerFullName, formatSalary } from '@/entities/worker/lib/workerHelpers'
import { formatDate } from '@/shared/lib/formatDate'
import { ROUTES } from '@/shared/config/routes'

interface WorkersTableProps {
  workers: Worker[]
  isLoading?: boolean
}

export function WorkersTable({ workers, isLoading }: WorkersTableProps) {
  const navigate = useNavigate()
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg border border-smoke bg-charcoal" />
        ))}
      </div>
    )
  }

  if (!workers.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <p className="font-display text-lg font-semibold text-ivory">Ishchilar topilmadi</p>
        <p className="text-sm text-silver">Filtrlarni o'zgartiring yoki yangi ishchi qo'shing.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-smoke">
        <table className="w-full text-sm">
          <thead className="border-b border-smoke bg-graphite">
            <tr>
              {['Ishchi', 'Lavozim', 'Bo\'lim', 'Status', 'Maosh', 'Qabul qilingan', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-silver">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-smoke bg-charcoal">
            {workers.map((worker) => {
              const fullName = getWorkerFullName(worker)
              return (
                <tr key={worker.id} className="hover:bg-graphite transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={fullName} src={worker.avatarUrl} size="sm" />
                      <div>
                        <p className="font-medium text-ivory">{fullName}</p>
                        <p className="text-xs text-silver">{worker.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-pearl">{worker.position}</td>
                  <td className="px-4 py-3 text-silver">{worker.department?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <WorkerStatusBadge status={worker.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-pearl">{formatSalary(worker.salary)}</td>
                  <td className="px-4 py-3 text-silver">{formatDate(worker.hireDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Ko'rish"
                        onClick={() => navigate(ROUTES.WORKER_DETAIL(worker.id))}
                      >
                        <Eye size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Tahrirlash"
                        onClick={() => navigate(ROUTES.WORKER_EDIT(worker.id))}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="O'chirish"
                        className="hover:text-danger"
                        onClick={() => setDeleteTarget(worker)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <DeleteWorkerModal
          workerId={deleteTarget.id}
          workerName={getWorkerFullName(deleteTarget)}
          open
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  )
}
