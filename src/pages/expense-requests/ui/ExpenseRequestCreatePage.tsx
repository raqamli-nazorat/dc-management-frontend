import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Heading } from '@/shared/ui/Typography'
import { Button } from '@/shared/ui/Button'
import { ExpenseRequestCreateForm } from '@/features/expense-request-create/ui/ExpenseRequestCreateForm'
import { ROUTES } from '@/shared/config/routes'

export function ExpenseRequestCreatePage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(ROUTES.EXPENSE_REQUESTS)}
        >
          <ArrowLeft size={18} />
        </Button>
        <div>
          <Heading level={2}>Yangi xarajat so'rovi</Heading>
          <p className="mt-1 text-sm text-silver">
            To'lov uchun so'rov yuboring
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="mx-auto w-full max-w-2xl rounded-lg border border-smoke bg-charcoal p-6">
        <ExpenseRequestCreateForm />
      </div>
    </div>
  )
}
