import { useState, useEffect, useRef } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown } from 'react-icons/fa6'
import { LuFilter } from 'react-icons/lu'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'
import EmptyState from '../../../components/EmptyState'
import { getErrorMessage } from '../../../service/getErrorMessage'
import { DateTimeBox } from '../Components/DateTimeBox'

// ── Constants ────────────────────────────────────────────────
const TRANSACTION_TYPE_OPTIONS = [
  { label: 'Chiqim', value: 'debit' },
  { label: 'Kirim', value: 'credit' },
]

const EMPTY_FILTER = {
  transaction_type: '',
  created_at__date__gte: '',
  created_at__time__gte: '',
  created_at__date__lte: '',
  created_at__time__lte: '',
  amount__gte: '',
  amount__lte: '',
}

function fmt(n) {
  const num = parseFloat(n)
  if (isNaN(num)) return ''
  return Math.abs(num).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  return `${date} ${time}`
}

const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'
const iCls = 'w-full h-[42px] px-3 py-2.5 rounded-xl text-sm outline-none border  bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] focus:border-[#526ED3] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]'

// ── Timezone offset helper ───────────────────────────────────
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

// ── API ──────────────────────────────────────────────────────
async function apiGetLedger(params = {}) {
  const res = await axiosAPI.get('/ledger/', { params })
  const payload = res.data?.data ?? res.data
  if (Array.isArray(payload)) return { results: payload, next: null }
  return { results: payload.results ?? [], next: payload.next ?? null }
}

function buildParams(filters, search) {
  const p = {}
  if (search) p.search = search
  if (filters.transaction_type) p.transaction_type = filters.transaction_type
  if (filters.amount__gte) p.amount__gte = filters.amount__gte
  if (filters.amount__lte) p.amount__lte = filters.amount__lte

  const cGte = toIsoWithOffset(filters.created_at__date__gte, filters.created_at__time__gte, false)
  const cLte = toIsoWithOffset(filters.created_at__date__lte, filters.created_at__time__lte, true)
  if (cGte) p.created_at__gte = cGte
  if (cLte) p.created_at__lte = cLte

  return p
}

// ── useDropdown ──────────────────────────────────────────────
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

// ── SimpleDropdown ───────────────────────────────────────────
function SimpleDropdown({ label, value, onChange, options, placeholder }) {
  const { open, setOpen, ref } = useDropdown()
  const display = options.find(o => o.value === value)?.label ?? ''
  return (
    <div ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer
            bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
            ${value ? 'text-[#1A1D2E] dark:text-[#FFFFFF]' : 'text-[#8F95A8] dark:text-[#C2C8E0]'}`}>
          <span className="flex-1 text-left truncate">{display || placeholder}</span>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {value && <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>}
            <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden
            bg-white border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
            {options.map((o, i) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full text-left px-4 py-3 text-sm  cursor-pointer
                  ${i < options.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#292A2A]' : ''}
                  ${value === o.value ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-[#FFFFFF] hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HistoryFilterModal({ onClose, onApply, initial }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      {/* X tugmasi */}
      <button onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer z-10
            bg-[#F1F3F9] hover:bg-[#E2E6F2] text-[#5B6078] dark:bg-[#292A2A] dark:hover:bg-[#333435] dark:text-[#C2C8E0] transition-colors">
        <FaXmark size={14} />
      </button>
      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">



        <div className="px-6 pt-6 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="hover:opacity-70 cursor-pointer shrink-0">
              <FaArrowLeft className="dark:text-white text-[#1A1D2E]" size={16} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF]">Filtrlash</h2>
          </div>
          <p className="text-sm text-[#5B6078] dark:text-[#C2C8E0]">
            Kerakli filtirlarni tanlang, natijalar shunga qarab saralanadi
          </p>
        </div>
        <div className="px-6 pb-4 flex flex-col gap-4">
          <SimpleDropdown
            label="Turi"
            value={f.transaction_type}
            onChange={v => set('transaction_type', v)}
            options={TRANSACTION_TYPE_OPTIONS}
            placeholder="Turini tanlang"
          />
          <div>
            <label className={labelCls}>Sana oralig'i</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex gap-1.5 justify-between  ">
                <div className="w-[170px]">
                  <DateTimeBox type="date" placeholder="dan" value={f.created_at__date__gte} onChange={v => set('created_at__date__gte', v)} dropUp />
                </div>
                <div className="w-[90px]">
                  <DateTimeBox type="time" value={f.created_at__time__gte || '00:00'} onChange={v => set('created_at__time__gte', v)} dropUp />
                </div>
              </div>
              <div className="flex gap-1.5 justify-between">
                <div className="w-[170px]">
                  <DateTimeBox type="date" placeholder="gacha" value={f.created_at__date__lte} onChange={v => set('created_at__date__lte', v)} dropUp />
                </div>
                <div className="w-[90px]">
                  <DateTimeBox type="time" value={f.created_at__time__lte || '00:00'} onChange={v => set('created_at__time__lte', v)} dropUp />
                </div>
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Miqdor (UZS)</label>
            <div className="grid grid-cols-2 gap-2">
              <input className={iCls} placeholder="dan: 0" value={f.amount__gte}
                onChange={e => set('amount__gte', e.target.value.replace(/[^\d.]/g, ''))} />
              <input className={iCls} placeholder="gacha: 0" value={f.amount__lte}
                onChange={e => set('amount__lte', e.target.value.replace(/[^\d.]/g, ''))} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 flex items-center justify-end gap-3 ">
          <button onClick={() => setF(EMPTY_FILTER)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={13} /> Tozalash
          </button>
          <button onClick={() => onApply(f)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
              bg-[#3F57B3] text-white hover:bg-[#526ED3]">
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

// ── HistoryDetailModal ───────────────────────────────────────
function HistoryDetailModal({ item, userInfo, onClose }) {
  const u = userInfo ?? {}
  const typeLabel = item.transaction_type === 'debit' ? 'Chiqim' : item.transaction_type === 'credit' ? 'Kirim' : item.transaction_type ?? ''
  const fieldCls = 'w-full h-[42px] px-3 py-2.5 rounded-xl text-sm border flex items-center bg-white border-[#E2E6F2] text-[#1A1D2E] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <button onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer z-10
            bg-[#F1F3F9] hover:bg-[#E2E6F2] text-[#5B6078] dark:bg-[#292A2A] dark:hover:bg-[#333435] dark:text-[#C2C8E0] transition-colors">
        <FaXmark size={14} />
      </button>

      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323] max-h-[90vh] overflow-y-auto">

        {/* X tugmasi */}

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="hover:opacity-70 cursor-pointer shrink-0">
              <FaArrowLeft className="dark:text-white text-[#1A1D2E]" size={16} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF]">Tarix ma'lumotlari</h2>
          </div>
        </div>

        {/* User info */}
        <div className="px-6 pb-5 flex items-center gap-4">
          {u.avatar
            ? <img src={u.avatar} alt="avatar" className="w-[80px] h-[80px] rounded-[20px] object-cover shrink-0" />
            : <div className="w-[80px] h-[80px] rounded-[20px] bg-[#526ED3] flex items-center justify-center text-white text-3xl font-bold shrink-0">
              {u.username?.[0]?.toUpperCase() ?? ''}
            </div>
          }
          <div>
            <p className="text-[18px] h-6 font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF] leading-tight">{u.username ?? ''}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs  px-3 py-1 rounded-lg font-medium bg-[#F1F3F9] text-[#1A1D2E] dark:bg-[#292A2A] dark:text-[#FFFFFF]">
                Viloyat: <span className="font-bold">{u.region ?? ''}</span>
              </span>
              <span className="text-xs px-3 py-1 rounded-lg font-medium bg-[#F1F3F9] text-[#1A1D2E] dark:bg-[#292A2A] dark:text-[#FFFFFF]">
                Tuman: <span className="font-bold">{u.district ?? ''}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="px-6 pb-4 flex flex-col gap-3">

          {/* Lavozimi + Passport */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Lavozimi</label>
              <div className={fieldCls}>{u.position ?? ''}</div>
            </div>
            <div>
              <label className={labelCls}>Passport ma'lumotlari</label>
              <div className="flex gap-2">
                <div className="w-16 shrink-0 h-[42px] px-3 py-2.5 rounded-xl text-sm text-center border flex items-center justify-center bg-white border-[#E2E6F2] text-[#1A1D2E] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF]">
                  {u.passport_series?.slice(0, 2) ?? ''}
                </div>
                <div className="flex-1 h-[42px] px-3 py-2.5 rounded-xl text-sm border flex items-center bg-white border-[#E2E6F2] text-[#1A1D2E] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF]">
                  {u.passport_series?.slice(2)?.trim() ?? ''}
                </div>
              </div>
            </div>
          </div>

          {/* Xarajat + Turi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Xarajat</label>
              <div className="w-full min-h-[42px] max-h-[100px] overflow-y-auto px-3 py-2.5 rounded-xl text-sm border flex items-start bg-white border-[#E2E6F2] text-[#1A1D2E] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] whitespace-pre-wrap break-words leading-relaxed">
                {item.description || ''}
              </div>
            </div>
            <div>
              <label className={labelCls}>Turi</label>
              <div className={`${fieldCls} justify-between`}>
                <span>{typeLabel}</span>
              </div>
            </div>
          </div>

          {/* Oylik maosh */}
          <div>
            <label className={labelCls}>Oylik maosh (UZS)</label>
            <div className={`${fieldCls} justify-end font-semibold`}>{fmt(u.fixed_salary)}</div>
          </div>

          {/* Sana + Miqdor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Sana</label>
              <div className={fieldCls}>{fmtDate(item.created_at)}</div>
            </div>
            <div>
              <label className={labelCls}>Miqdor (UZS)</label>
              <div className={`${fieldCls} justify-end font-semibold`}>{fmt(item.amount)}</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end ">
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold  cursor-pointer
              text-[#3F57B3] hover:bg-[#EEF1FB] dark:text-[#7F95E6] dark:hover:bg-[#292A2A]">
            <FaXmark size={13} /> Yopish
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function FinanceHistoryPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTER)
  const [detailItem, setDetailItem] = useState(null)
  const scrollRef = useRef(null)

  const hasFilter = Object.values(filters).some(v => v)

  const loadData = async (f = filters, q = search, pg = 1) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const { results, next } = await apiGetLedger({ ...buildParams(f, q), page: pg, page_size: 20 })
      setData(prev => pg === 1 ? results : [...prev, ...results])
      setHasMore(!!next)
      setPage(pg)
    } catch (err) {
      console.error(err)
      toast.error(getErrorMessage(err, "Ma'lumotlarni yuklashda xatolik yuz berdi."))
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Scroll listener
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60 && hasMore && !loadingMore) {
        loadData(filters, search, page + 1)
      }
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, page, filters, search])

  useEffect(() => { loadData() }, [])

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

  const handleRowClick = (item) => {
    setDetailItem(item)
  }

  const typeLabel = (t) => t === 'debit' ? 'Chiqim' : t === 'credit' ? 'Kirim' : t ?? ''

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">

      {/* Sticky yuqori qism */}
      <div className="shrink-0 bg-[#F8F9FC] dark:bg-[#191A1A] pb-3">
        <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-[#FFFFFF] mb-3">Tarix</h1>
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#C2C8E0]"
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Qidirish" value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') runSearch(searchInput) }}
                className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none  w-[240px]
                bg-[#F1F3F9] border border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] focus:border-[#526ED3]
                dark:bg-[#222323] dark:border-[#474848] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]" />
            </div>
            <button onClick={() => setShowFilter(true)}
              className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border  cursor-pointer
              bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078]
              dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
              <LuFilter size={13} />
              Filtrlash
              {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
            </button>
          </div>


          {/* Info tooltip */}
          <div className="relative group flex items-center gap-2">
            <div className="absolute right-13 top-1/2 -translate-y-1/2 z-20 w-[220px] px-4 py-3 rounded-2xl shadow-xl text-[12px] text-[#1A1D2E] dark:text-[#FFFFFF]
            bg-white dark:bg-[#222323] border border-[#E2E6F2] dark:border-[#292A2A]
            opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
              Tasdiqlash orqali ish haqi yakuniy hisob bo‘yicha hisoblanadi.    </div>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A1D2E] dark:bg-white opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            <button className="w-7 h-7 flex items-center justify-center cursor-pointer shrink-0">
              <img src="/imgs/LeftIcon.svg" alt="info" className="w-5 h-5 dark:brightness-0 dark:invert" />
            </button>
          </div>

        </div>


      </div>

      {/* Scroll bo'ladigan qism */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-auto  dark:border-[#292A2A]">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">Yuklanmoqda...</div>
        ) : data.length === 0 ? (
          <EmptyState
            icon="/imgs/tarixIcon.svg"
            title="Tarix bo'sh"
            description="Hozircha hech qanday operatsiya amalga oshirilmagan"
          />
        ) : (
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] dark:bg-[#191A1A]">
              <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] w-10 bg-[#F8F9FC] dark:bg-[#191A1A]">№</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] bg-[#F8F9FC] dark:bg-[#191A1A]">Ism sharifi</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] bg-[#F8F9FC] dark:bg-[#191A1A]">Xarajat</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] bg-[#F8F9FC] dark:bg-[#191A1A]">Miqdor (UZS)</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] bg-[#F8F9FC] dark:bg-[#191A1A]">Turi</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] bg-[#F8F9FC] dark:bg-[#191A1A]">Sana</th>

              </tr>
            </thead>
            <tbody>
              {data.map((h, idx) => (
                <tr key={h.id} onClick={() => handleRowClick(h)}
                  className="border-b border-[#EEF1F7] dark:border-[#292A2A]  last:border-0 cursor-pointer hover:bg-black/3 dark:hover:bg-white/3">
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-[#FFFFFF]">{h.user_info?.username ?? ''}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{h.description || ''}</td>
                  <td className="px-4 py-3 text-right font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(h.amount)}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{typeLabel(h.transaction_type)}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{fmtDate(h.created_at)}</td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
        {loadingMore && (
          <div className="py-4 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">
            <svg className="animate-spin inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Yuklanmoqda...
          </div>
        )}
      </div>

      {showFilter && (
        <HistoryFilterModal
          initial={filters}
          onClose={() => setShowFilter(false)}
          onApply={handleApplyFilter}
        />
      )}

      {detailItem && (
        <HistoryDetailModal
          item={detailItem}
          userInfo={detailItem.user_info}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  )
}
