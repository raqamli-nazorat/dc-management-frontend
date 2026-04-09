import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Mail, Phone, Calendar, Building2 } from 'lucide-react'
import { Heading } from '@/shared/ui/Typography'
import { Button } from '@/shared/ui/Button'
import { Card, CardBody, CardHeader } from '@/shared/ui/Card'
import { Spinner } from '@/shared/ui/Spinner'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge } from '@/shared/ui/Badge'
import { WorkerStatusBadge } from '@/entities/worker/ui/WorkerStatusBadge'
import { workerApi } from '@/entities/worker/api/workerApi'
import { getWorkerFullName, formatSalary } from '@/entities/worker/lib/workerHelpers'
import { WORKER_ROLE_LABELS } from '@/entities/worker/model/types'
import { formatDate } from '@/shared/lib/formatDate'
import { ROUTES } from '@/shared/config/routes'

export function WorkerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: worker, isLoading } = useQuery({
    queryKey: ['worker', id],
    queryFn: () => workerApi.getById(id!),
    enabled: !!id,
  })

  if (isLoading) {
    return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  }

  if (!worker) {
    return <p className="text-center text-silver">Ishchi topilmadi</p>
  }

  const fullName = getWorkerFullName(worker)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <Heading level={2}>Ishchi profili</Heading>
      </div>

      {/* Profile card */}
      <Card>
        <CardBody className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <Avatar name={fullName} src={worker.avatarUrl} size="lg" />
          <div className="flex flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-ivory">{fullName}</h2>
                <p className="text-silver">{worker.position}</p>
              </div>
              <div className="flex items-center gap-2">
                <WorkerStatusBadge status={worker.status} />
                <Badge variant="gold">{WORKER_ROLE_LABELS[worker.role]}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoItem icon={<Mail size={14} />} label="Email" value={worker.email} />
              <InfoItem icon={<Phone size={14} />} label="Telefon" value={worker.phone} />
              <InfoItem icon={<Building2 size={14} />} label="Bo'lim" value={worker.department?.name ?? '—'} />
              <InfoItem icon={<Calendar size={14} />} label="Qabul qilingan" value={formatDate(worker.hireDate)} />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-sm text-silver">Maosh:</span>
              <span className="font-mono text-sm font-medium text-gold">{formatSalary(worker.salary)}</span>
            </div>
          </div>
        </CardBody>
        <div className="flex justify-end border-t border-smoke px-6 py-3">
          <Button onClick={() => navigate(ROUTES.WORKER_EDIT(worker.id))}>
            <Pencil size={15} /> Tahrirlash
          </Button>
        </div>
      </Card>

      {worker.notes && (
        <Card>
          <CardHeader>
            <span className="font-display text-base font-semibold text-ivory">Izohlar</span>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-pearl">{worker.notes}</p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1 text-xs text-silver">
        {icon} {label}
      </div>
      <p className="text-sm font-medium text-ivory">{value}</p>
    </div>
  )
}
