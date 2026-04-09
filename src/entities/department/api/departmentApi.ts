import { apiClient } from '@/shared/api/client'
import { API } from '@/shared/api/endpoints'
import type { ApiResponse, PaginatedResponse } from '@/shared/api/types'
import type { Department, DepartmentCreatePayload } from '../model/types'

export const departmentApi = {
  getAll: () =>
    apiClient
      .get<PaginatedResponse<Department>>(API.DEPARTMENTS.BASE)
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient
      .get<ApiResponse<Department>>(API.DEPARTMENTS.BY_ID(id))
      .then((r) => r.data.data),

  create: (payload: DepartmentCreatePayload) =>
    apiClient
      .post<ApiResponse<Department>>(API.DEPARTMENTS.BASE, payload)
      .then((r) => r.data.data),

  delete: (id: string) =>
    apiClient.delete(API.DEPARTMENTS.BY_ID(id)),
}
