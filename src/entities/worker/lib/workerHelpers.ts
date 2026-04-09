import type { Worker } from '../model/types'

export function getWorkerFullName(worker: Pick<Worker, 'firstName' | 'lastName'>): string {
  return `${worker.firstName} ${worker.lastName}`
}

export function formatSalary(amount: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'currency',
    currency: 'UZS',
    maximumFractionDigits: 0,
  }).format(amount)
}
