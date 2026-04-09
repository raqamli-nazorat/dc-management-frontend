import { apiClient } from '@/shared/api/client'
import { API } from '@/shared/api/endpoints'
import type { ApiResponse, PaginatedResponse } from '@/shared/api/types'
import type { Worker, WorkerCreatePayload, WorkerUpdatePayload } from '../model/types'

export interface WorkerFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  departmentId?: string
}

export const workerApi = {
  getAll: (filters: WorkerFilters = {}) =>
    apiClient
      .get<PaginatedResponse<Worker>>(API.WORKERS.BASE, { params: filters })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<ApiResponse<Worker>>(API.WORKERS.BY_ID(id))
      .then((r) => r.data.data),

  create: (payload: WorkerCreatePayload) =>
    apiClient
      .post<ApiResponse<Worker>>(API.WORKERS.BASE, payload)
      .then((r) => r.data.data),

  update: (id: string, payload: WorkerUpdatePayload) =>
    apiClient
      .put<ApiResponse<Worker>>(API.WORKERS.BY_ID(id), payload)
      .then((r) => r.data.data),

  delete: (id: string) =>
    apiClient.delete(API.WORKERS.BY_ID(id)),
}
