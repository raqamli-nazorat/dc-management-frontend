export type ExpenseStatus = 'pending' | 'approved' | 'rejected'

export interface ExpenseRequest {
  id: string
  workerId: string
  worker?: {
    id: string
    firstName: string
    lastName: string
    position: string
  }
  amount: number
  reason: string
  cardNumber: string
  status: ExpenseStatus
  reviewNote?: string
  createdAt: string
  updatedAt: string
}

export interface ExpenseRequestCreatePayload {
  amount: number
  reason: string
  cardNumber: string
}

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  pending: 'Kutilmoqda',
  approved: 'Tasdiqlangan',
  rejected: 'Rad etilgan',
}

export const EXPENSE_STATUS_BADGE_VARIANT: Record<
  ExpenseStatus,
  'warning' | 'success' | 'danger'
> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
}
