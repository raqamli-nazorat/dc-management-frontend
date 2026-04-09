import { create } from 'zustand'

interface WorkerFiltersState {
  search: string
  status: string
  departmentId: string
  page: number
  setSearch: (v: string) => void
  setStatus: (v: string) => void
  setDepartmentId: (v: string) => void
  setPage: (v: number) => void
  reset: () => void
}

export const useWorkerFilters = create<WorkerFiltersState>((set) => ({
  search: '',
  status: '',
  departmentId: '',
  page: 1,
  setSearch: (search) => set({ search, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setDepartmentId: (departmentId) => set({ departmentId, page: 1 }),
  setPage: (page) => set({ page }),
  reset: () => set({ search: '', status: '', departmentId: '', page: 1 }),
}))
