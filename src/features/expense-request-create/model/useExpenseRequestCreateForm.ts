import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { expenseRequestApi } from '@/entities/expense-request/api/expenseRequestApi'
import { ROUTES } from '@/shared/config/routes'

const cardNumberRegex = /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/

const schema = z.object({
  amount: z.coerce
    .number({ invalid_type_error: 'Miqdorni kiriting' })
    .positive('Miqdor 0 dan katta bo\'lishi kerak')
    .max(100_000_000, 'Miqdor juda katta'),
  reason: z.string().min(10, 'Kamida 10 ta belgi kiriting').max(500, 'Ko\'pi bilan 500 ta belgi'),
  cardNumber: z
    .string()
    .min(1, 'Karta raqamini kiriting')
    .refine((v) => cardNumberRegex.test(v.replace(/\s/g, '')), {
      message: 'Karta raqami noto\'g\'ri (16 ta raqam)',
    }),
})

export type ExpenseRequestCreateFormValues = z.infer<typeof schema>

export function useExpenseRequestCreateForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const form = useForm<ExpenseRequestCreateFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      amount: 0,
      reason: '',
      cardNumber: '',
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: expenseRequestApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-requests'] })
      toast.success('Xarajat so\'rovi yuborildi')
      navigate(ROUTES.EXPENSE_REQUESTS)
    },
    onError: () => toast.error('Xatolik yuz berdi. Qaytadan urinib ko\'ring.'),
  })

  const onSubmit = form.handleSubmit((values) => mutate(values))

  return { form, onSubmit, isPending }
}
