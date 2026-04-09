import axios from 'axios'
import { env } from '@/shared/config/env'

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem('session-store')
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as { state?: { token?: string } }
      const token = parsed?.state?.token
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    } catch {
      // ignore parse errors
    }
  }
  return config
})

// Response interceptor: handle 401 globally
apiClient.interceptors.response.use(
  (res) => res,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401
    ) {
      localStorage.removeItem('session-store')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
)
