import { useState, useEffect, useRef, useCallback } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown } from 'react-icons/fa6'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'
import EmptyState from '../../../components/EmptyState'
import { getErrorMessage } from '../../../service/getErrorMessage'
import { DateTimeBox } from '../Components/DateTimeBox'

// ── Constants ─────────────────────────────────────────────────
const ACTION_OPTIONS = [
  { label: 'Barchasi', value: '' },
  { label: 'Create', value: 'create' },
  { label: 'Update', value: 'update' },
  { label: 'Delete', value: 'delete' },
  { label: 'Confirm', value: 'confirm' },
  { label: 'Restore', value: 'restore' },
]

const EMPTY_FILTER = {
  action: '',
  timestamp__date__gte: '',
  timestamp__time__gte: '',
  timestamp__date__lte: '',
  timestamp__time__lte: '',
}

// ── Helpers ───────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return (
    d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  )
}

function toIsoWithOffset(date, time, isEnd = false) {
  if (!date) return null
  const t = time || (isEnd ? '23:59' : '00:00')
  const secs = isEnd ? '59' : '00'
  const now = new Date()
  const offsetMin = -now.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const absMin = Math.abs(offsetMin)
  const hh = String(Math.floor(absMin / 60)).padStart(2, '0')
  const mm = String(absMin % 60).padStart(2, '0')
  return `${date}T${t}:${secs}.000000${sign}${hh}:${mm}`
}

function buildParams(filters, search) {
  const p = {}
  if (search) p.search = search
  if (filters.action) p.action = filters.action

  const tsGte = toIsoWithOffset(filters.timestamp__date__gte, filters.timestamp__time__gte, false)
  const tsLte = toIsoWithOffset(filters.timestamp__date__lte, filters.timestamp__time__lte, true)
  if (tsGte) p.timestamp__gte = tsGte
  if (tsLte) p.timestamp__lte = tsLte

  return p
}

// ── Action badge ──────────────────────────────────────────────
const ACTION_COLORS = {
  create:  { bg: '#DCFCE7', text: '#15803D', darkBg: '#14532D', darkText: '#86EFAC' },
  update:  { bg: '#DBEAFE', text: '#1D4ED8', darkBg: '#1E3A5F', darkText: '#93C5FD' },
  delete:  { bg: '#FEE2E2', text: '#B91C1C', darkBg: '#450A0A', darkText: '#FCA5A5' },
  confirm: { bg: '#FEF9C3', text: '#92400E', darkBg: '#3B2700', darkText: '#FDE68A' },
  restore: { bg: '#F3E8FF', text: '#7E22CE', darkBg: '#2E1065', darkText: '#D8B4FE' },
}

function ActionBadge({ action }) {
  const c = ACTION_COLORS[action] ?? { bg: '#F1F3F9', text: '#6B7280', darkBg: '#374151', darkText: '#9CA3AF' }
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {action || '—'}
    </span>
  )
}

// ── Dropdown ──────────────────────────────────────────────────
const labelCls = 'block text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1.5'

function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return { open, setOpen, ref }
}

function SimpleDropdown({ label, value, onChange, options, placeholder }) {
  const { open, setOpen, ref } = useDropdown()
  const display = options.find(o => o.value === value)?.label ?? ''
  return (
    <div ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border cursor-pointer
            bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)]
            ${value ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}`}
        >
          <span className="flex-1 text-left truncate">{display || placeholder}</span>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {value && (
              <span
                onMouseDown={e => { e.stopPropagation(); onChange('') }}
                className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"
              >
                <FaXmark size={11} />
              </span>
            )}
            <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden
            bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
            {options.map((o, i) => (
              <button
                key={o.value + i}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full text-left px-4 py-3 text-sm cursor-pointer
                  ${i < options.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''}
                  ${value === o.value
                    ? 'bg-[#EEF1FB] text-[var(--accent-strong)] font-semibold dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]'
                    : 'text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'
                  }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Filter Modal ──────────────────────────────────────────────
function FilterModal({ onClose, onApply, initial }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer z-10
          bg-[#F1F3F9] hover:bg-[var(--stroke-sub)] text-[var(--text-sub)]
          dark:bg-[var(--bg-elevation-2)] dark:hover:bg-[var(--bg-elevation-2)] dark:text-[var(--text-sub)] transition-colors"
      >
        <FaXmark size={14} />
      </button>

      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)]">
        <div className="px-6 pt-6 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="hover:opacity-70 cursor-pointer shrink-0">
              <FaArrowLeft className="dark:text-[var(--text-strong)] text-[var(--text-strong)]" size={16} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Filtrlash</h2>
          </div>
          <p className="text-sm text-[var(--text-sub)] dark:text-[var(--text-sub)]">
            Kerakli filtirlarni tanlang, natijalar shunga qarab saralanadi
          </p>
        </div>

        <div className="px-6 pb-4 flex flex-col gap-4">
          <SimpleDropdown
            label="Harakat"
            value={f.action}
            onChange={v => set('action', v)}
            options={ACTION_OPTIONS}
            placeholder="Harakatni tanlang"
          />

          <div>
            <label className={labelCls}>Vaqt oralig'i</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex gap-1.5 justify-between">
                <div className="w-[170px]">
                  <DateTimeBox
                    type="date"
                    placeholder="dan"
                    value={f.timestamp__date__gte}
                    onChange={v => set('timestamp__date__gte', v)}
                    dropUp
                  />
                </div>
                <div className="w-[90px]">
                  <DateTimeBox
                    type="time"
                    value={f.timestamp__time__gte || '00:00'}
                    onChange={v => set('timestamp__time__gte', v)}
                    dropUp
                  />
                </div>
              </div>
              <div className="flex gap-1.5 justify-between">
                <div className="w-[170px]">
                  <DateTimeBox
                    type="date"
                    placeholder="gacha"
                    value={f.timestamp__date__lte}
                    onChange={v => set('timestamp__date__lte', v)}
                    dropUp
                  />
                </div>
                <div className="w-[90px]">
                  <DateTimeBox
                    type="time"
                    value={f.timestamp__time__lte || '00:00'}
                    onChange={v => set('timestamp__time__lte', v)}
                    dropUp
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={() => setF(EMPTY_FILTER)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
              text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]"
          >
            <FaXmark size={13} /> Tozalash
          </button>
          <button
            onClick={() => onApply(f)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
              bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            Qidirish
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Skeleton rows ─────────────────────────────────────────────
function SkeletonRows() {
  return Array.from({ length: 8 }).map((_, i) => (
    <tr key={i} className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
      {Array.from({ length: 7 }).map((__, j) => (
        <td key={j} className="px-4 py-3">
          <div
            className="h-4 rounded-lg bg-[#EEF1F7] dark:bg-[var(--bg-elevation-2)] animate-pulse"
            style={{ width: j === 0 ? 24 : j === 6 ? '70%' : '80%' }}
          />
        </td>
      ))}
    </tr>
  ))
}

// ── Main Page ─────────────────────────────────────────────────
export default function AuditLogPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState(EMPTY_FILTER)
  const [showFilter, setShowFilter] = useState(false)
  const scrollRef = useRef(null)

  const hasFilter = Object.values(filters).some(v => v)

  const loadData = useCallback(async (f = filters, q = search, pg = 1) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const params = { ...buildParams(f, q), page: pg, page_size: 25 }
      const res = await axiosAPI.get('/auditlog/', { params })
      const payload = res.data?.data ?? res.data
      const results = Array.isArray(payload) ? payload : (payload.results ?? [])
      const next = Array.isArray(payload) ? null : (payload.next ?? null)
      setData(prev => pg === 1 ? results : [...prev, ...results])
      setHasMore(!!next)
      setPage(pg)
    } catch (err) {
      toast.error('Xatolik', getErrorMessage(err))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80 && hasMore && !loadingMore) {
        loadData(filters, search, page + 1)
      }
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, page, filters, search, loadData])

  const runSearch = (val) => {
    const q = val.trim()
    setSearch(q)
    loadData(filters, q, 1)
  }

  const handleApplyFilter = (f) => {
    setFilters(f)
    setShowFilter(false)
    loadData(f, search, 1)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">

      {/* Sticky header */}
      <div className="shrink-0 pb-3">
        <h1 className="text-2xl font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] mb-3">
          Umumiy tarix
        </h1>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)] dark:text-[var(--text-sub)]"
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Qidirish"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') runSearch(searchInput) }}
              className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none w-[240px]
                bg-[#F1F3F9] border border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-soft)] focus:border-[var(--accent-sub)]
                dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-strong)] dark:placeholder-[#C2C8E0]"
            />
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilter(true)}
            className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border cursor-pointer
              bg-[#F1F3F9] border-[var(--stroke-sub)] text-[var(--text-sub)]
              dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-sub)]"
          >
            <img
              src="/imgs/filterIcon.svg"
              alt=""
              className="w-3.5 h-3.5 [filter:brightness(0)_saturate(100%)_invert(38%)_sepia(10%)_saturate(500%)_hue-rotate(190deg)] dark:[filter:brightness(0)_saturate(100%)_invert(70%)_sepia(10%)_saturate(300%)_hue-rotate(190deg)]"
            />
            Filtrlash
            {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-strong)]" />}
          </button>
        </div>
      </div>

      {/* Scrollable table area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-auto">
        {loading ? (
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">
              <tr className="border-b border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]">
                {['№', 'Foydalanuvchi', 'Vaqt', 'Jadval nomi', 'Harakat', 'Yozuv raqami', 'IP manzili'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] ${i === 0 ? 'text-left w-10' : i <= 2 ? 'text-left' : 'text-left'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <SkeletonRows />
            </tbody>
          </table>
        ) : data.length === 0 ? (
          <EmptyState
            icon="/imgs/tarixIcon.svg"
            title="Tarix bo'sh"
            description="Hozircha hech qanday harakat qayd etilmagan"
          />
        ) : (
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] w-10 bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">№</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">Foydalanuvchi</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">Vaqt</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">Jadval nomi</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">Harakat</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">Yozuv raqami</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">IP manzili</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const user = row.user_details ?? {}
                return (
                  <tr
                    key={row.id}
                    className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] last:border-0 hover:bg-black/3 dark:hover:bg-white/3"
                  >
                    <td className="px-4 py-3 text-[var(--text-soft)] dark:text-[var(--text-sub)] text-xs font-medium">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            className="w-7 h-7 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-[var(--accent-sub)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user.username?.[0]?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <span className="font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                          {user.username ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                      {fmtDate(row.created_at)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                      {row.table_name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={row.action} />
                    </td>
                    <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                      {row.record_id ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-soft)] dark:text-[var(--text-sub)] font-mono text-xs">
                      {row.ip_address ?? '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {loadingMore && (
          <div className="py-4 text-center text-sm text-[var(--text-disabled)] dark:text-[var(--text-soft)]">
            <svg className="animate-spin inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Yuklanmoqda...
          </div>
        )}
      </div>

      {showFilter && (
        <FilterModal
          initial={filters}
          onClose={() => setShowFilter(false)}
          onApply={handleApplyFilter}
        />
      )}
    </div>
  )
}
