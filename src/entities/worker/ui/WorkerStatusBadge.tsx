import { Badge } from '@/shared/ui/Badge'
import type { WorkerStatus } from '../model/types'
import { WORKER_STATUS_LABELS } from '../model/types'
import type { ComponentProps } from 'react'

const statusVariant: Record<WorkerStatus, ComponentProps<typeof Badge>['variant']> = {
  active: 'success',
  inactive: 'default',
  on_leave: 'warning',
  probation: 'info',
}

export function WorkerStatusBadge({ status }: { status: WorkerStatus }) {
  return (
    <Badge variant={statusVariant[status]}>
      {WORKER_STATUS_LABELS[status]}
    </Badge>
  )
}
