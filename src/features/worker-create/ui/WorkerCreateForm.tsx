import { useQuery } from '@tanstack/react-query'
import { useWorkerCreateForm } from '../model/useWorkerCreateForm'
import { Input } from '@/shared/ui/Input'
import { Button } from '@/shared/ui/Button'
import { departmentApi } from '@/entities/department/api/departmentApi'

export function WorkerCreateForm() {
  const { form, onSubmit, isPending } = useWorkerCreateForm()
  const { register, formState: { errors } } = form

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAll(),
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Ism" error={errors.firstName?.message} {...register('firstName')} placeholder="Ali" />
        <Input label="Familiya" error={errors.lastName?.message} {...register('lastName')} placeholder="Valiyev" />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} placeholder="ali@example.com" />
        <Input label="Telefon" error={errors.phone?.message} {...register('phone')} placeholder="+998901234567" />
        <Input label="Lavozim" error={errors.position?.message} {...register('position')} placeholder="Frontend dasturchi" />
        <Input label="Maosh (UZS)" type="number" error={errors.salary?.message} {...register('salary')} placeholder="5000000" />
        <Input label="Qabul qilingan sana" type="date" error={errors.hireDate?.message} {...register('hireDate')} />

        {/* Department select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-pearl">Bo'lim</label>
          <select
            {...register('departmentId')}
            className="h-10 rounded border border-smoke bg-graphite px-3 text-sm text-ivory focus:border-gold focus:outline-none transition-colors"
          >
            <option value="">Bo'limni tanlang</option>
            {departments?.data.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          {errors.departmentId && <p className="text-xs text-danger">{errors.departmentId.message}</p>}
        </div>

        {/* Role select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-pearl">Rol</label>
          <select
            {...register('role')}
            className="h-10 rounded border border-smoke bg-graphite px-3 text-sm text-ivory focus:border-gold focus:outline-none transition-colors"
          >
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
