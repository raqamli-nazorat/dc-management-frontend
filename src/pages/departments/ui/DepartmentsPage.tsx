import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Building2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Heading } from '@/shared/ui/Typography'
import { Button } from '@/shared/ui/Button'
import { Card, CardBody } from '@/shared/ui/Card'
import { Spinner } from '@/shared/ui/Spinner'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/shared/ui/Modal'
import { Input } from '@/shared/ui/Input'
import { departmentApi } from '@/entities/department/api/departmentApi'
import type { DepartmentCreatePayload } from '@/entities/department/model/types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({ name: z.string().min(2, 'Kamida 2 ta belgi'), description: z.string().optional() })
type FormValues = z.infer<typeof schema>

export function DepartmentsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentApi.getAll(),
  })

  const deleteMutation = useMutation({
    mutationFn: departmentApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Bo\'lim o\'chirildi')
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  })

  const createMutation = useMutation({
    mutationFn: (payload: DepartmentCreatePayload) => departmentApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] })
      toast.success('Bo\'lim qo\'shildi')
      setShowCreate(false)
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  })

  const form = useForm<FormValues>({ resolver: zodResolver(schema) })
  const { register, handleSubmit, formState: { errors }, reset } = form

  const onSubmit = handleSubmit((values) => {
    createMutation.mutate(values)
    reset()
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Heading level={2}>Bo'limlar</Heading>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Yangi bo'lim
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.data.map((dept) => (
            <Card key={dept.id} className="hover:border-ash transition-colors">
              <CardBody className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gold/10">
                    <Building2 size={18} className="text-gold" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-ivory">{dept.name}</p>
                    {dept.description && (
                      <p className="mt-0.5 text-xs text-silver">{dept.description}</p>
                    )}
                    {dept.workerCount !== undefined && (
                      <p className="mt-1 text-xs text-silver">{dept.workerCount} ta ishchi</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hover:text-danger shrink-0"
                  onClick={() => deleteMutation.mutate(dept.id)}
                >
                  <Trash2 size={15} />
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)}>
        <ModalHeader onClose={() => setShowCreate(false)}>Yangi bo'lim</ModalHeader>
        <ModalBody>
          <form id="dept-form" onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input label="Bo'lim nomi" error={errors.name?.message} {...register('name')} placeholder="IT bo'limi" />
            <Input label="Tavsif (ixtiyoriy)" {...register('description')} placeholder="Qisqacha tavsif" />
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setShowCreate(false)}>Bekor qilish</Button>
          <Button form="dept-form" type="submit" loading={createMutation.isPending}>Qo'shish</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
