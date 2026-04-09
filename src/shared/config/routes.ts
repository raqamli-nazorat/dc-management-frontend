export const ROUTES = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
  WORKERS: '/workers',
  WORKERS_NEW: '/workers/new',
  WORKER_DETAIL: (id: string) => `/workers/${id}`,
  WORKER_EDIT: (id: string) => `/workers/${id}/edit`,
  DEPARTMENTS: '/departments',
  SETTINGS: '/settings',
  EXPENSE_REQUESTS: '/expense-requests',
  EXPENSE_REQUESTS_NEW: '/expense-requests/new',
} as const
