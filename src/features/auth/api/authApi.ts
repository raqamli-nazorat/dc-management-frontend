import { apiClient } from '@/shared/api/client'
import { API } from '@/shared/api/endpoints'
import type { ApiResponse } from '@/shared/api/types'
import type { AuthUser } from '@/entities/session/model/types'

interface LoginPayload {
  email: string
  password: string
}

interface LoginResponse {
  token: string
  user: AuthUser
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<ApiResponse<LoginResponse>>(API.AUTH.LOGIN, payload).then((r) => r.data.data),

  logout: () =>
    apiClient.post(API.AUTH.LOGOUT),

  me: () =>
    apiClient.get<ApiResponse<AuthUser>>(API.AUTH.ME).then((r) => r.data.data),
}
