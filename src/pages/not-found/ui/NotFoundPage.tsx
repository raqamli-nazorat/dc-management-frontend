import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/Button'
import { ROUTES } from '@/shared/config/routes'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-obsidian text-center">
      <p className="font-display text-7xl font-bold text-smoke">404</p>
      <div>
        <h1 className="font-display text-2xl font-semibold text-ivory">Sahifa topilmadi</h1>
        <p className="mt-2 text-silver">Siz qidirayotgan sahifa mavjud emas.</p>
      </div>
      <Button onClick={() => navigate(ROUTES.DASHBOARD)}>Bosh sahifaga qaytish</Button>
    </div>
  )
}
