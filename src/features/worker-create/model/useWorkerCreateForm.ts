import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { workerApi } from '@/entities/worker/api/workerApi'
import { ROUTES } from '@/shared/config/routes'

const schema = z.object({
  firstName: z.string().min(2, 'Kamida 2 ta belgi'),
  lastName: z.string().min(2, 'Kamida 2 ta belgi'),
  email: z.string().email('Noto\'g\'ri email'),
  phone: z.string().min(9, 'Telefon raqami noto\'g\'ri'),
  position: z.string().min(2, 'Lavozimni kiriting'),
  departmentId: z.string().min(1, 'Bo\'limni tanlang'),
  role: z.enum(['admin', 'manager', 'worker', 'intern']),
  salary: z.coerce.number().min(0, 'Maosh 0 dan katta bo\'lishi kerak'),
  hireDate: z.string().min(1, 'Sanani kiriting'),
})

export type WorkerCreateFormValues = z.infer<typeof schema>

export function useWorkerCreateForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useForm<WorkerCreateFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      firstName: '', lastName: '', email: '', phone: '',
      position: '', departmentId: '', role: 'worker', salary: 0,
      hireDate: new Date().toISOString().split('T')[0],
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: workerApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      toast.success('Ishchi muvaffaqiyatli qo\'shildi')
      navigate(ROUTES.WORKERS)
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  })

  const onSubmit = form.handleSubmit((values) => mutate(values as Parameters<typeof workerApi.create>[0]))

  return { form, onSubmit, isPending }
}
