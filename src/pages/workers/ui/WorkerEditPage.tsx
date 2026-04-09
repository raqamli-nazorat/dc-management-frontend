import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { Heading } from '@/shared/ui/Typography'
import { Button } from '@/shared/ui/Button'
import { Card, CardBody, CardHeader } from '@/shared/ui/Card'
import { Spinner } from '@/shared/ui/Spinner'
import { Input } from '@/shared/ui/Input'
import { workerApi } from '@/entities/worker/api/workerApi'
import { departmentApi } from '@/entities/department/api/departmentApi'
import { useWorkerEditForm } from '@/features/worker-edit/model/useWorkerEditForm'

function EditForm({ workerId }: { workerId: string }) {
  const { data: worker, isLoading } = useQuery({
    queryKey: ['worker', workerId],
    queryFn: () => workerApi.getById(workerId),
  })
  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAll(),
  })

  const { form, onSubmit, isPending } = useWorkerEditForm(worker!)
  const { register, formState: { errors } } = form

  if (isLoading || !worker) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Ism" error={errors.firstName?.message} {...register('firstName')} />
        <Input label="Familiya" error={errors.lastName?.message} {...register('lastName')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Telefon" error={errors.phone?.message} {...register('phone')} />
        <Input label="Lavozim" error={errors.position?.message} {...register('position')} />
        <Input label="Maosh (UZS)" type="number" error={errors.salary?.message} {...register('salary')} />
        <Input label="Qabul qilingan sana" type="date" error={errors.hireDate?.message} {...register('hireDate')} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-pearl">Status</label>
          <select {...register('status')} className="h-10 rounded border border-smoke bg-graphite px-3 text-sm text-ivory focus:border-gold focus:outline-none transition-colors">
            <option value="active">Faol</option>
            <option value="inactive">Nofaol</option>
            <option value="on_leave">Ta'tilda</option>
            <option value="probation">Sinov muddatida</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-pearl">Bo'lim</label>
          <select {...register('departmentId')} className="h-10 rounded border border-smoke bg-graphite px-3 text-sm text-ivory focus:border-gold focus:outline-none transition-colors">
            {departments?.data.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-pearl">Rol</label>
          <select {...register('role')} className="h-10 rounded border border-smoke bg-graphite px-3 text-sm text-ivory focus:border-gold focus:outline-none transition-colors">
            <option value="worker">Ishchi</option>
            <option value="intern">Stajyor</option>
            <option value="manager">Menejer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => history.back()}>Bekor qilish</Button>
        <Button type="submit" loading={isPending}>Saqlash</Button>
      </div>
    </form>
  )
}

export function WorkerEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) return null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </Button>
        <Heading level={2}>Ishchini tahrirlash</Heading>
      </div>
      <Card>
        <CardHeader>
          <span className="font-display text-base font-semibold text-ivory">Ma'lumotlarni tahrirlash</span>
        </CardHeader>
        <CardBody>
          <EditForm workerId={id} />
        </CardBody>
      </Card>
    </div>
  )
}
