export const API = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  WORKERS: {
    BASE: '/workers',
    BY_ID: (id: string) => `/workers/${id}`,
  },
  DEPARTMENTS: {
    BASE: '/departments',
    BY_ID: (id: string) => `/departments/${id}`,
  },
  EXPENSE_REQUESTS: {
    BASE: '/expense-requests',
    BY_ID: (id: string) => `/expense-requests/${id}`,
  },
} as const
