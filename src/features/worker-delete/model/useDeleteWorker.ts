import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { workerApi } from '@/entities/worker/api/workerApi'

export function useDeleteWorker(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: workerApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] })
      toast.success('Ishchi o\'chirildi')
      onSuccess?.()
    },
    onError: () => toast.error('O\'chirishda xatolik yuz berdi'),
  })
}
