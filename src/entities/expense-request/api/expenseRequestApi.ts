import { apiClient } from '@/shared/api/client'
import { API } from '@/shared/api/endpoints'
import type { PaginatedResponse } from '@/shared/api/types'
import type { ExpenseRequest, ExpenseRequestCreatePayload } from '../model/types'

export const expenseRequestApi = {
  getAll: async (params?: {
    page?: number
    limit?: number
    status?: string
  }): Promise<PaginatedResponse<ExpenseRequest>> => {
    const { data } = await apiClient.get(API.EXPENSE_REQUESTS.BASE, { params })
    return data
  },

  getById: async (id: string): Promise<ExpenseRequest> => {
    const { data } = await apiClient.get(API.EXPENSE_REQUESTS.BY_ID(id))
    return data.data
  },

  create: async (payload: ExpenseRequestCreatePayload): Promise<ExpenseRequest> => {
    const { data } = await apiClient.post(API.EXPENSE_REQUESTS.BASE, payload)
    return data.data
  },

  updateStatus: async (
    id: string,
    payload: { status: 'approved' | 'rejected'; reviewNote?: string }
  ): Promise<ExpenseRequest> => {
    const { data } = await apiClient.patch(API.EXPENSE_REQUESTS.BY_ID(id), payload)
    return data.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(API.EXPENSE_REQUESTS.BY_ID(id))
  },
}
