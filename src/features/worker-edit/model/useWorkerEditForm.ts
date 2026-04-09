import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { workerApi } from '@/entities/worker/api/workerApi'
import { ROUTES } from '@/shared/config/routes'
import type { Worker } from '@/entities/worker/model/types'

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(9),
  position: z.string().min(2),
  departmentId: z.string().min(1),
  role: z.enum(['admin', 'manager', 'worker', 'intern']),
  salary: z.coerce.number().min(0),
  hireDate: z.string().min(1),
  status: z.enum(['active', 'inactive', 'on_leave', 'probation']),
})

export type WorkerEditFormValues = z.infer<typeof schema>

export function useWorkerEditForm(worker: Worker) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useForm<WorkerEditFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
  })

  useEffect(() => {
    form.reset({
      firstName: worker.firstName,
      lastName: worker.lastName,
      email: worker.email,
      phone: worker.phone,
      position: worker.position,
      departmentId: worker.departmentId,
      role: worker.role,
      salary: worker.salary,
      hireDate: worker.hireDate.split('T')[0],
      status: worker.status,
    })
  }, [worker, form])

  const { mutate, isPending } = useMutation({
    mutationFn: (values: WorkerEditFormValues) => workerApi.update(worker.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      queryClient.invalidateQueries({ queryKey: ['worker', worker.id] })
      toast.success('Ishchi ma\'lumotlari yangilandi')
      navigate(ROUTES.WORKER_DETAIL(worker.id))
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  })

  const onSubmit = form.handleSubmit((values) => mutate(values as WorkerEditFormValues))

  return { form, onSubmit, isPending }
}
