// ── API type values ──────────────────────────────────────────
export const TYPE_OPTIONS = [
  { label: "Mablag' chiqarish", value: 'withdrawal' },
  { label: 'Kompaniya xarajatlari', value: 'company' },
  { label: 'Boshqa xarajatlar', value: 'other' },
]

export const STATUS_OPTIONS = [
  { label: 'Kutilmoqda', value: 'pending' },
  { label: "To'landi", value: 'paid' },
  { label: 'Tasdiqlandi', value: 'confirmed' },
  { label: 'Bekor qilindi', value: 'cancelled' },
]

export const PAYMENT_METHOD_OPTIONS = [
  { label: 'Naqd pulda', value: 'cash' },
  { label: 'Karta orqali', value: 'card' },
]

// ── Label helpers ────────────────────────────────────────────
export const typeLabel   = (v) => TYPE_OPTIONS.find(o => o.value === v)?.label   ?? v
export const statusLabel = (v) => STATUS_OPTIONS.find(o => o.value === v)?.label ?? v
export const methodLabel = (v) => PAYMENT_METHOD_OPTIONS.find(o => o.value === v)?.label ?? v

// ── Status badge color ───────────────────────────────────────
export const statusColor = (v) => ({
  pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  paid:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}[v] ?? 'bg-gray-100 text-gray-600')

// ── Filter default state ─────────────────────────────────────
export const EMPTY_FILTER = {
  type: '', status: '', expense_category: '', project: '',
  amount__gte: '', amount__lte: '',
  created_at__date__gte: '',  created_at__date__lte: '',
  created_at__time__gte: '',  created_at__time__lte: '',
  paid_at__date__gte: '',     paid_at__date__lte: '',
  paid_at__time__gte: '',     paid_at__time__lte: '',
  confirmed_at__date__gte: '', confirmed_at__date__lte: '',
  confirmed_at__time__gte: '', confirmed_at__time__lte: '',
  my_requests: false,
}

// ── Formatters ───────────────────────────────────────────────
export function fmt(n) {
  const num = parseFloat(n)
  if (isNaN(num)) return '—'
  return Math.abs(num).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function fmtMoney(raw) {
  const digits = String(raw).replace(/\D/g, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function fmtCard(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

export const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'
