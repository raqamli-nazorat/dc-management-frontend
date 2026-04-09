import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  type ExpenseRequest,
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_BADGE_VARIANT,
} from '@/entities/expense-request/model/types'
import { expenseRequestApi } from '@/entities/expense-request/api/expenseRequestApi'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/shared/ui/Modal'
import { formatDate } from '@/shared/lib/formatDate'

interface ExpenseRequestsTableProps {
  items: ExpenseRequest[]
  isLoading?: boolean
  total?: number
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS'
}

function maskCard(card: string): string {
  const digits = card.replace(/\D/g, '')
  if (digits.length < 4) return card
  return '*'.repeat(digits.length - 4) + digits.slice(-4)
}

export function ExpenseRequestsTable({
  items,
  isLoading,
  total,
  page = 1,
  totalPages = 1,
  onPageChange,
}: ExpenseRequestsTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<ExpenseRequest | null>(null)
  const queryClient = useQueryClient()

  const { mutate: deleteRequest, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => expenseRequestApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-requests'] })
      toast.success("So'rov o'chirildi")
      setDeleteTarget(null)
    },
    onError: () => toast.error('Xatolik yuz berdi'),
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg border border-smoke bg-charcoal" />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-smoke bg-charcoal py-16 text-center">
        <p className="font-display text-lg font-semibold text-ivory">
          Xarajat so'rovlari topilmadi
        </p>
        <p className="text-sm text-silver">Yangi so'rov yaratish uchun yuqoridagi tugmani bosing.</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-smoke">
        <table className="w-full text-sm">
          <thead className="border-b border-smoke bg-graphite">
            <tr>
              {[
                'Xodim',
                'Miqdor',
                'Sabab',
                'Karta',
                'Status',
                'Sana',
                '',
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-silver"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-smoke bg-charcoal">
            {items.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-graphite">
                <td className="px-4 py-3">
                  {item.worker ? (
                    <div>
                      <p className="font-medium text-ivory">
                        {item.worker.firstName} {item.worker.lastName}
                      </p>
                      <p className="text-xs text-silver">{item.worker.position}</p>
                    </div>
                  ) : (
                    <span className="text-silver">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono font-medium text-ivory">
                  {formatAmount(item.amount)}
                </td>
                <td className="max-w-[200px] px-4 py-3 text-pearl">
                  <p className="truncate" title={item.reason}>
                    {item.reason}
                  </p>
                </td>
                <td className="px-4 py-3 font-mono text-silver">
                  {maskCard(item.cardNumber)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={EXPENSE_STATUS_BADGE_VARIANT[item.status]}>
                    {EXPENSE_STATUS_LABELS[item.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-silver">
                  {formatDate(item.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {item.status === 'pending' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="O'chirish"
                      className="hover:text-danger"
                      onClick={() => setDeleteTarget(item)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between">
          {total !== undefined && (
            <p className="text-sm text-silver">Jami: {total} ta so'rov</p>
          )}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={[
                  'flex h-8 w-8 items-center justify-center rounded text-sm transition-colors',
                  p === page
                    ? 'bg-gold text-obsidian font-medium'
                    : 'text-silver hover:bg-graphite hover:text-ivory',
                ].join(' ')}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <ModalHeader onClose={() => setDeleteTarget(null)}>
          So'rovni o'chirish
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-pearl">
            Bu xarajat so'rovini o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
            Bekor qilish
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={isDeleting}
            onClick={() => deleteTarget && deleteRequest(deleteTarget.id)}
          >
            O'chirish
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
