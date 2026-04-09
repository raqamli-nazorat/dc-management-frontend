import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authApi } from '../api/authApi'
import { useSessionStore } from '@/entities/session/model/sessionStore'
import { ROUTES } from '@/shared/config/routes'

const loginSchema = z.object({
  email: z.string().email('Noto\'g\'ri email format'),
  password: z.string().min(6, 'Parol kamida 6 ta belgi bo\'lishi kerak'),
})

export type LoginFormValues = z.infer<typeof loginSchema>

export function useLoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const setSession = useSessionStore((s) => s.setSession)
  const navigate = useNavigate()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setIsLoading(true)
    try {
      const { token, user } = await authApi.login(values)
      setSession(token, user)
      navigate(ROUTES.DASHBOARD)
    } catch {
      toast.error('Login yoki parol noto\'g\'ri')
    } finally {
      setIsLoading(false)
    }
  })

  return { form, onSubmit, isLoading }
}
