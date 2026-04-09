export type WorkerStatus = 'active' | 'inactive' | 'on_leave' | 'probation'
export type WorkerRole = 'admin' | 'manager' | 'worker' | 'intern'

export interface Worker {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  departmentId: string
  department?: { id: string; name: string }
  role: WorkerRole
  status: WorkerStatus
  salary: number
  hireDate: string
  avatarUrl?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface WorkerCreatePayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  departmentId: string
  role: WorkerRole
  salary: number
  hireDate: string
}

export type WorkerUpdatePayload = Partial<WorkerCreatePayload> & { status?: WorkerStatus }

export const WORKER_STATUS_LABELS: Record<WorkerStatus, string> = {
  active: 'Faol',
  inactive: 'Nofaol',
  on_leave: 'Ta\'tilda',
  probation: 'Sinov muddatida',
}

export const WORKER_ROLE_LABELS: Record<WorkerRole, string> = {
  admin: 'Admin',
  manager: 'Menejer',
  worker: 'Ishchi',
  intern: 'Stajyor',
}
