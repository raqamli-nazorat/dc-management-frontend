import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@/shared/ui/Typography'
import { Button } from '@/shared/ui/Button'
import { Card, CardBody, CardHeader } from '@/shared/ui/Card'
import { WorkerCreateForm } from '@/features/worker-create/ui/WorkerCreateForm'

export function WorkerCreatePage() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <Heading level={2}>Yangi ishchi qo'shish</Heading>
      </div>
      <Card>
        <CardHeader>
          <span className="font-display text-base font-semibold text-ivory">Ishchi ma'lumotlari</span>
        </CardHeader>
        <CardBody>
          <WorkerCreateForm />
        </CardBody>
      </Card>
    </div>
  )
}
