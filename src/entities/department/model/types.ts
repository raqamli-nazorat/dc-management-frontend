export interface Department {
  id: string
  name: string
  description?: string
  managerId?: string
  workerCount?: number
  createdAt: string
  updatedAt: string
}

export interface DepartmentCreatePayload {
  name: string
  description?: string
  managerId?: string
}
