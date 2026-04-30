import { useState, useEffect, useRef } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown, FaCalendarDays, FaClock } from 'react-icons/fa6'
import { LuFilter } from 'react-icons/lu'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'
import EmptyState from '../../../components/EmptyState'
import { getErrorMessage } from '../../../service/getErrorMessage'

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']

const EMPTY_FILTER = {
  month: '',
  created_at__date__gte: '', created_at__time__gte: '',
  created_at__date__lte: '', created_at__time__lte: '',
  total_amount__gte: '', total_amount__lte: '',
  penalty_amount__gte: '', penalty_amount__lte: '',
  showFine: false,
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
const iCls = 'w-full h-[42px] px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] focus:border-[#526ED3] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]'

// -- API ------------------------------------------------------
async function apiGetPayrolls(params = {}) {
  const res = await axiosAPI.get('/payroll/', { params })
  const payload = res.data?.data ?? res.data
  if (Array.isArray(payload)) return { results: payload, next: null }
  return { results: payload.results ?? [], next: payload.next ?? null }
}

async function apiGetPayrollDetail(id) {
  const res = await axiosAPI.get(`/payroll/${id}/`)
  return res.data?.data ?? res.data
}

async function apiConfirmPayrolls(payroll_ids) {
  const res = await axiosAPI.post('/payroll/confirm/', { payroll_ids })
  return res.data?.data ?? res.data
}

// -- useDropdown ----------------------------------------------
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

// -- DateBox --------------------------------------------------
function DateBox({ type, value, onChange, icon, placeholder }) {
  const ref = useRef(null)
  const isEmpty = !value
  return (
    <div className="flex items-center gap-1.5 px-3 py-2.5 border border-[#E2E6F2] dark:border-[#292A2A]
      rounded-xl bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors cursor-text">
      {placeholder && (
        <span className={`text-xs shrink-0 select-none ${isEmpty ? 'text-[#B6BCCB] dark:text-[#474848]' : 'text-[#5B6078] dark:text-[#C2C8E0]'}`}>
          {placeholder}:
        </span>
      )}
      <input ref={ref} type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={type === 'time' ? '00:00' : ''}
        step={type === 'time' ? '60' : undefined}
        className={`flex-1 min-w-0 text-xs outline-none bg-transparent cursor-pointer
          placeholder-[#B6BCCB] dark:placeholder-[#474848]
          [&::-webkit-calendar-picker-indicator]:hidden
          ${type === 'date' && !value ? '[&::-webkit-datetime-edit]:opacity-0' : 'text-[#1A1D2E] dark:text-[#FFFFFF]'}
        `}
      />
      <button type="button" onClick={() => ref.current?.showPicker?.()}
        className="shrink-0 cursor-pointer text-[#B6BCCB] dark:text-[#474848] hover:text-[#526ED3] transition-colors">
        {icon}
      </button>
    </div>
  )
}

// -- Toggle ---------------------------------------------------
function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${checked ? 'bg-[#3F57B3]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
      <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// -- MonthDropdownFull -----------------------------------------
function MonthDropdownFull({ value, onChange }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
          bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
          ${value ? 'text-[#1A1D2E] dark:text-[#FFFFFF]' : 'text-[#8F95A8] dark:text-[#C2C8E0]'}`}>
        <span className="flex-1 text-left truncate">{value || 'Oy tanlang'}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>}
          <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
          bg-white border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
          {MONTHS.map((m, i) => (
            <button key={m} type="button" onClick={() => { onChange(m); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
                ${i < MONTHS.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#292A2A]' : ''}
                ${value === m ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-[#FFFFFF] hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// -- SalaryFilterModal -----------------------------------------
function SalaryFilterModal({ onClose, onApply, initial }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/60 " />
      <button onClick={onClose} className="w-8 absolute top-5 right-5 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors
              bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white">
        <FaXmark size={14} />
      </button>
      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">

        {/* Header */}
        <div className="px-6 pt-6 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="hover:opacity-70 cursor-pointer shrink-0">
                <FaArrowLeft className="dark:text-white text-[#1A1D2E]" size={16} />
              </button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF]">Filtrlash</h2>
            </div>

          </div>
          <p className="text-sm text-[#5B6078] dark:text-[#C2C8E0] ">
            Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 flex flex-col gap-4">

          {/* Oy */}
          <div>
            <label className={labelCls}>Oy</label>
            <MonthDropdownFull value={f.month} onChange={v => set('month', v)} />
          </div>

          {/* Yaratilgan vaqti oralig'i */}
          <div>
            <label className={labelCls}>Yaratilgan vaqti oralig'i</label>
            <div className=" grid grid-cols-2 gap-2">
              <div className="flex gap-1.5">
                <div className="flex-1">
                  <DateBox type="date" value={f.created_at__date__gte} onChange={v => set('created_at__date__gte', v)} placeholder="dan" icon={<FaCalendarDays size={11} />} />
                </div>
                <div className="w-[90px]">
                  <DateBox type="time" value={f.created_at__time__gte || '00:00'} onChange={v => set('created_at__time__gte', v)} icon={<FaClock size={11} />} />
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="flex-1">
                  <DateBox type="date" value={f.created_at__date__lte} onChange={v => set('created_at__date__lte', v)} placeholder="gacha" icon={<FaCalendarDays size={11} />} />
                </div>
                <div className="w-[90px]">
                  <DateBox type="time" value={f.created_at__time__lte || '00:00'} onChange={v => set('created_at__time__lte', v)} icon={<FaClock size={11} />} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Jami miqdori */}
            <div className=' h-20'>
              <label className={`${labelCls} mb-3`}>Jami miqdori</label>
              <div className="grid grid-cols-2 gap-2">
                <input className={iCls} placeholder="dan: 0" value={f.total_amount__gte}
                  onChange={e => set('total_amount__gte', e.target.value.replace(/[^\d]/g, ''))} />
                <input className={iCls} placeholder="gacha: 0" value={f.total_amount__lte}
                  onChange={e => set('total_amount__lte', e.target.value.replace(/[^\d]/g, ''))} />
              </div>
            </div>

            {/* Jarima miqdori */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls + ' mb-0'}>Jarima miqdori</label>
                <Toggle checked={f.showFine} onChange={v => set('showFine', v)} />
              </div>
              {f.showFine && (
                <div className="grid grid-cols-2 gap-2">
                  <input className={`${iCls} text-[#E02D2D] dark:text-[#FA5252]`} placeholder="-100 000"
                    value={f.penalty_amount__gte} onChange={e => set('penalty_amount__gte', e.target.value.replace(/[^\d]/g, ''))} />
                  <input className={`${iCls} text-[#E02D2D] dark:text-[#FA5252]`} placeholder="-1 000 000"
                    value={f.penalty_amount__lte} onChange={e => set('penalty_amount__lte', e.target.value.replace(/[^\d]/g, ''))} />
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3 ">
          <button onClick={() => setF(EMPTY_FILTER)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={13} /> Tozalash
          </button>
          <button onClick={() => onApply(f)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
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

// -- Field helper ----------------------------------------------
function Field({ label, value, right, red }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5">{label}</label>
      <div className={`w-full h-[42px] px-3 py-2.5 rounded-xl text-sm border flex items-center
        bg-white border-[#E2E6F2] text-[#1A1D2E]
        dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF]
        ${right ? 'justify-end' : ''}
        ${red ? 'text-[#E02D2D]! dark:text-[#FA5252]!' : ''}`}>
        {value}
      </div>
    </div>
  )
}

// -- ConfirmModal ----------------------------------------------
function ConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-full max-w-[500px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">
        <div className="px-6 pt-6 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="text-[#5B6078] dark:text-[#C2C8E0] hover:opacity-70 cursor-pointer shrink-0">
              <FaArrowLeft size={16} />
            </button>
            <h2 className="text-base font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Ish haqini tasdiqlaysizmi?</h2>
          </div>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors
            bg-[#F1F3F9] hover:bg-[#E2E6F2] text-[#5B6078] dark:bg-[#292A2A] dark:hover:bg-[#333435] dark:text-[#C2C8E0]">
            <FaXmark size={14} />
          </button>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-[#5B6078] dark:text-[#C2C8E0]">Tasdiqlangandan so'ng, bu amalni bekor qilib bo'lmaydi.</p>
        </div>
        <div className="px-6 pb-5 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
            text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={13} /> Bekor qilish
          </button>
          <button onClick={onConfirm} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
            bg-green-500 text-white hover:bg-green-600">
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  )
}

// -- UserDetailModal -------------------------------------------
function UserDetailModal({ user, onClose, onApprove }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const u = user.user_info ?? {}

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors
              bg-[#FFFFFF29] absolute top-7 right-7 hover:bg-[#FFFFFF40] text-white">
          <FaXmark size={14} />
        </button>
        <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323] max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="text-[#1A1D2E] dark:text-[#FFFFFF] hover:opacity-70 cursor-pointer shrink-0">
                <FaArrowLeft size={16} />
              </button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF]">Ish haqi ma'lumotlari</h2>
            </div>

          </div>

          {/* User info */}
          <div className="px-6 pb-5 flex items-center gap-4">
            {u.avatar
              ? <img src={u.avatar} alt="avatar" className="w-[80px] h-[80px] rounded-[20px] object-cover shrink-0" />
              : <div className="w-[80px] h-[80px] rounded-[20px] bg-[#526ED3] flex items-center justify-center text-white text-3xl font-bold shrink-0">
                {u.username?.[0]?.toUpperCase() ?? '?'}
              </div>
            }
            <div>
              <p className="text-[18px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF] leading-tight">{u.username ?? ''}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-lg font-medium bg-[#F1F3F9] text-[#1A1D2E] dark:bg-[#292A2A] dark:text-[#FFFFFF]">
                  Viloyat: <span className="font-bold">{u.region ?? ''}</span>
                </span>
                <span className="text-xs px-3 py-1 rounded-lg font-medium bg-[#F1F3F9] text-[#1A1D2E] dark:bg-[#292A2A] dark:text-[#FFFFFF]">
                  Tuman: <span className="font-bold">{u.district ?? ''}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="px-6 pb-4 grid grid-cols-2 gap-3">
            <Field label="Lavozimi" value={u.position ?? ''} />
            <div>
              <label className="block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5">Passport ma'lumotlari</label>
              <div className="flex gap-2">
                <div className="w-16 shrink-0 h-[42px] px-3 py-2.5 rounded-xl text-sm text-center border flex items-center justify-center bg-white border-[#E2E6F2] text-[#1A1D2E] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF]">
                  {u.passport_series?.slice(0, 2) ?? ''}
                </div>
                <div className="flex-1 h-[42px] px-3 py-2.5 rounded-xl text-sm border flex items-center bg-white border-[#E2E6F2] text-[#1A1D2E] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF]">
                  {u.passport_series?.slice(2)?.trim() ?? ''}
                </div>
              </div>
            </div>
            <Field label="Oylik maosh" value={fmt(user.fixed_salary)} />
            <Field label="KPI bonus" value={fmt(user.kpi_bonus)} />
            <Field label="Yaratilgan vaqti" value={fmtDate(user.created_at)} />
            <Field label="Oy" value={user.month_display ?? ''} />
            <Field label="Jarima miqdori (UZS)" value={`-${fmt(user.penalty_amount)}`} red right />
            <Field label="Jami miqdori (UZS)" value={fmt(user.total_amount)} right />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-end gap-3 ">
            <button onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
                text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
              <FaXmark size={13} /> {user.is_confirmed ? 'Yopish' : 'Bekor qilish'}
            </button>
            {!user.is_confirmed && (
              <button onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer
                  bg-green-500 text-white hover:bg-green-600">
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Tasdiqlash
              </button>
            )}
          </div>
        </div>
      </div>
      {showConfirm && (
        <ConfirmModal
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => { onApprove(user.id); setShowConfirm(false); onClose() }}
        />
      )}
    </>
  )
}

// -- Main Page -------------------------------------------------
export default function SalaryPage() {
  const [search, setSearch] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTER)
  const [detailUser, setDetailUser] = useState(null)
  const scrollRef = useRef(null)

  const hasFilter = Object.values(filters).some(v => v && v !== false)

  const loadPayrolls = async (f = filters, q = search, pg = 1) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const params = { page: pg, page_size: 20 }
      if (q) params.search = q
      if (f.month) params.month = f.month
      if (f.created_at__date__gte) {
        const t = f.created_at__time__gte || '00:00'
        params.created_at__gte = `${f.created_at__date__gte}T${t}:00`
      }
      if (f.created_at__date__lte) {
        const t = f.created_at__time__lte || '00:00'
        params.created_at__lte = `${f.created_at__date__lte}T${t}:59`
      }
      if (f.total_amount__gte) params.total_amount__gte = f.total_amount__gte
      if (f.total_amount__lte) params.total_amount__lte = f.total_amount__lte
      if (f.penalty_amount__gte) params.penalty_amount__gte = f.penalty_amount__gte
      if (f.penalty_amount__lte) params.penalty_amount__lte = f.penalty_amount__lte
      const { results, next } = await apiGetPayrolls(params)
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
        loadPayrolls(filters, search, page + 1)
      }
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, page, filters, search])

  useEffect(() => { loadPayrolls() }, [])

  const allSelected = data.length > 0 && data.every(u => selected.has(u.id))
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const s = new Set(prev); data.forEach(u => s.delete(u.id)); return s })
    else setSelected(prev => { const s = new Set(prev); data.forEach(u => s.add(u.id)); return s })
  }
  const toggleOne = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const handleApprove = async (ids) => {
    const idArray = ids instanceof Set ? Array.from(ids) : [ids]
    try {
      await apiConfirmPayrolls(idArray)
      setData(prev => prev.map(u => idArray.includes(u.id) ? { ...u, is_confirmed: true } : u))
      setShowConfirm(false)
      setSelecting(false)
      setSelected(new Set())
      toast.success("Tasdiqlandi", "Ish haqi muvaffaqiyatli tasdiqlandi.")
    } catch (err) {
      console.error(err)
      toast.error(getErrorMessage(err, "Tasdiqlashda xatolik yuz berdi."))
    }
  }

  const handleRowClick = async (u) => {
    if (selecting) { toggleOne(u.id); return }
    try {
      const detail = await apiGetPayrollDetail(u.id)
      console.log('Payroll detail:', detail)
      setDetailUser(detail)
    } catch (err) {
      console.error(err)
      toast.error(getErrorMessage(err, "Ma'lumotlarni yuklashda xatolik yuz berdi."))
    }
  }

  const handleSearch = (val) => {
    setSearch(val)
    loadPayrolls(filters, val, 1)
  }

  const handleApplyFilter = (f) => {
    setFilters(f)
    setShowFilter(false)
    loadPayrolls(f, search, 1)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">

      {/* Yuqori qism — qotib turadi */}
      <div className="shrink-0 bg-[#F8F9FC] dark:bg-[#191A1A]">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Ish haqi</h1>
          {selecting ? (
            <button onClick={() => { setSelecting(false); setSelected(new Set()) }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-extrabold transition-colors cursor-pointer
              bg-[#DADFF0] text-[#1A1D2E] dark:bg-[#3A3B3B] dark:text-white">
              <FaXmark size={13} /> Bekor qilish
            </button>
          ) : (
            <button onClick={() => setSelecting(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-extrabold transition-colors cursor-pointer
              bg-[#DADFF0] text-[#1A1D2E] dark:bg-[#3A3B3B] dark:text-white">
              <img src="/imgs/checkIcon.svg" alt="" className="w-4 h-4 dark:brightness-0 dark:invert" />
              Tanlash
            </button>
          )}
        </div>

        {/* Filters + Tooltip */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#C2C8E0]"
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Ism Sharifi bo'yicha izlash" value={search}
                onChange={e => handleSearch(e.target.value)}
                className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none transition-colors w-[280px]
                bg-[#F1F3F9] border border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] focus:border-[#526ED3]
                dark:bg-[#222323] dark:border-[#474848] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]"/>
            </div>
            <button onClick={() => setShowFilter(true)}
              className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border transition-colors cursor-pointer
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
              Ish haqi har oyning 4-sanasidan boshlab tasdiqlanadi.
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A1D2E] dark:bg-white opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            <button className="w-7 h-7 flex items-center justify-center cursor-pointer shrink-0">
              <img src="/imgs/LeftIcon.svg" alt="info" className="w-5 h-5 dark:brightness-0 dark:invert" />
            </button>
          </div>
        </div>

      </div>{/* /shrink-0 */}

      {/* Table — scroll bo'ladigan qism */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">Yuklanmoqda...</div>
        ) : data.length === 0 ? (
          <EmptyState
            icon="/imgs/ishhaqiIcon.svg"
            title="Ish haqi ma'lumotlari topilmadi"
            description="Ma'lumotlar keyinroq paydo bo'ladi yoki filtrlarni tekshiring"
          />
        ) : (
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-[#F8F9FC] dark:bg-[#191A1A]">
              <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
                {selecting && (
                  <th className="w-10 px-4 py-3 text-left bg-[#F8F9FC] dark:bg-[#191A1A]">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="cursor-pointer accent-[#3F57B3]" />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] w-10 bg-[#F8F9FC] dark:bg-[#191A1A]">№</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] bg-[#F8F9FC] dark:bg-[#191A1A]">Ism sharifi</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] bg-[#F8F9FC] dark:bg-[#191A1A]">Oy</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] bg-[#F8F9FC] dark:bg-[#191A1A]">Oylik maosh (UZS)</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] bg-[#F8F9FC] dark:bg-[#191A1A]">KPI bonus (UZS)</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] bg-[#F8F9FC] dark:bg-[#191A1A]">Jarima miqdori (UZS)</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] bg-[#F8F9FC] dark:bg-[#191A1A]">Jami miqdori (UZS)</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] bg-[#F8F9FC] dark:bg-[#191A1A]">Yaratilgan vaqt</th>
                <th className="px-4 py-3 text-center font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] sticky right-0 bg-[#F8F9FC] dark:bg-[#191A1A]">Tasdiqlanish</th>
              </tr> 
            </thead>
            <tbody>
              {data.map((u, idx) => (
                <tr key={u.id} onClick={() => handleRowClick(u)}
                  className="group border-b border-[#EEF1F7] dark:border-[#292A2A] transition-colors last:border-0 cursor-pointer hover:bg-black/3 dark:hover:bg-white/3">
                  {selecting && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} className="cursor-pointer accent-[#3F57B3]" />
                    </td>
                  )}
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-[#FFFFFF]">{u.user_info?.username ?? ''}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{u.month_display ?? ''}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(u.fixed_salary)}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(u.kpi_bonus)}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#E02D2D] dark:text-[#FA5252]">-{fmt(u.penalty_amount)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(u.total_amount)}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{fmtDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-center sticky right-0 bg-[#F8F9FC] dark:bg-[#191A1A] group-hover:bg-[#F0F1F5] dark:group-hover:bg-[#202221] transition-colors" onClick={e => e.stopPropagation()}>
                    {u.is_confirmed
                      ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-green-500">
                        <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                      : <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#E9ECF5] dark:bg-[#292A2A]" />
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {loadingMore && (
          <div className="py-4 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">
            <svg className="animate-spin inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Yuklanmoqda...
          </div>
        )}
      </div>

      {/* Selection bar */}
      {selecting && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl
          bg-white border border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
          <span className="text-sm text-[#5B6078] dark:text-[#C2C8E0] mr-1">{selected.size} ta tanlandi</span>
          <button onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer bg-green-500 text-white hover:bg-green-600">
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Tasdiqlash
          </button>
        </div>
      )}

      {/* Modals */}
      {showConfirm && <ConfirmModal onCancel={() => setShowConfirm(false)} onConfirm={() => handleApprove(selected)} />}
      {showFilter && <SalaryFilterModal initial={filters} onClose={() => setShowFilter(false)} onApply={handleApplyFilter} />}
      {detailUser && <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} onApprove={handleApprove} />}
    </div>
  )
}
