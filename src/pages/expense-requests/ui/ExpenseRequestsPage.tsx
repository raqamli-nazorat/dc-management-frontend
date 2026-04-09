import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Heading } from '@/shared/ui/Typography'
import { Button } from '@/shared/ui/Button'
import { Select } from '@/shared/ui/Select'
import { ExpenseRequestsTable } from '@/widgets/expense-requests-table/ui/ExpenseRequestsTable'
import { expenseRequestApi } from '@/entities/expense-request/api/expenseRequestApi'
import type { ExpenseStatus } from '@/entities/expense-request/model/types'
import { ROUTES } from '@/shared/config/routes'

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Barcha statuslar' },
  { value: 'pending', label: 'Kutilmoqda' },
  { value: 'approved', label: 'Tasdiqlangan' },
  { value: 'rejected', label: 'Rad etilgan' },
]

const PAGE_SIZE = 20

export function ExpenseRequestsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<ExpenseStatus | ''>('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['expense-requests', { status, page }],
    queryFn: () =>
      expenseRequestApi.getAll({
        status: status || undefined,
        page,
        limit: PAGE_SIZE,
      }),
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level={2}>Xarajat so'rovlari</Heading>
          {data && (
            <p className="mt-1 text-sm text-silver">Jami: {data.total} ta so'rov</p>
          )}
        </div>
        <Button onClick={() => navigate(ROUTES.EXPENSE_REQUESTS_NEW)}>
          <Plus size={16} /> Yangi so'rov
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="w-52">
          <Select
            options={STATUS_FILTER_OPTIONS}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as ExpenseStatus | '')
              setPage(1)
            }}
          />
        </div>
      </div>

      {/* Table */}
      <ExpenseRequestsTable
        items={data?.data ?? []}
        isLoading={isLoading}
        total={data?.total}
        page={page}
        totalPages={data?.totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}
