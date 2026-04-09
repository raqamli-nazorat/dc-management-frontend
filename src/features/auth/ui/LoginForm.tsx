import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useState } from 'react'
import { useLoginForm } from '../model/useLoginForm'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

export function LoginForm() {
  const { form, onSubmit, isLoading } = useLoginForm()
  const [showPassword, setShowPassword] = useState(false)
  const { register, formState: { errors } } = form

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <Input
        label="Email"
        type="email"
        placeholder="admin@dcmanagement.uz"
        error={errors.email?.message}
        {...register('email')}
      />

      <div className="relative flex flex-col gap-1.5">
        <label className="text-sm font-medium text-pearl">Parol</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className={[
              'h-10 w-full rounded border bg-graphite px-3 pr-10 text-sm text-ivory placeholder:text-silver',
              'border-smoke focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30',
              'transition-colors duration-150',
              errors.password ? 'border-danger focus:border-danger focus:ring-danger/30' : '',
            ].join(' ')}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-silver hover:text-pearl transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-danger">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" loading={isLoading} className="mt-2 w-full gap-2">
        <LogIn size={16} />
        Kirish
      </Button>
    </form>
  )
}
