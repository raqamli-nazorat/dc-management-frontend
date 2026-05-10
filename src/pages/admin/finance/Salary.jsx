import { useState, useEffect, useRef } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown } from 'react-icons/fa6'
import { LuFilter } from 'react-icons/lu'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'
import EmptyState from '../../../components/EmptyState'
import { getErrorMessage } from '../../../service/getErrorMessage'
import { DateTimeBox } from '../Components/DateTimeBox'
import { useAuth } from '../../../context/AuthContext'

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

const labelCls = 'block text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1.5'
const iCls = 'w-full h-[42px] px-3 py-2.5 rounded-xl text-sm outline-none border bg-[var(--bg-elevation-1-alt)] border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-soft)] focus:border-[var(--accent-sub)] dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)] dark:placeholder-[#C2C8E0]'

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

// -- Toggle ---------------------------------------------------
function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full cursor-pointer ${checked ? 'bg-[var(--accent-strong)]' : 'bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)]'}`}>
      <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-[var(--bg-elevation-1-alt)] shadow transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

// -- MonthDropdownFull -----------------------------------------
function MonthDropdownFull({ value, onChange }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border cursor-pointer
          bg-[var(--bg-elevation-1-alt)] border-[var(--stroke-sub)] dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)]
          ${value ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}`}>
        <span className="flex-1 text-left truncate">{value || 'Oy tanlang'}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"><FaXmark size={11} /></span>}
          <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
          bg-[var(--bg-elevation-1-alt)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
          {MONTHS.map((m, i) => (
            <button key={m} type="button" onClick={() => { onChange(m); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer
                ${i < MONTHS.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''}
                ${value === m ? 'bg-[#EEF1FB] text-[var(--accent-strong)] font-semibold dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'}`}>
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
      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)]">

        {/* Header */}
        <div className="px-6 pt-6 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="hover:opacity-70 cursor-pointer shrink-0">
                <FaArrowLeft className="dark:text-[var(--text-strong)] text-[var(--text-strong)]" size={16} />
              </button>
              <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Filtrlash</h2>
            </div>

          </div>
          <p className="text-sm text-[var(--text-sub)] dark:text-[var(--text-sub)] ">
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
            <div className="grid grid-cols-2 gap-2">
              <div className="flex gap-1.5">
                <div className="w-[180px]">
                  <DateTimeBox type="date" placeholder="dan" value={f.created_at__date__gte} onChange={v => set('created_at__date__gte', v)} dropUp />
                </div>
                <div className="w-[90px]">
                  <DateTimeBox type="time" value={f.created_at__time__gte || '00:00'} onChange={v => set('created_at__time__gte', v)} dropUp />
                </div>
              </div>
              <div className="flex gap-1.5">
                <div className="w-[180px]">
                  <DateTimeBox type="date" placeholder="gacha" value={f.created_at__date__lte} onChange={v => set('created_at__date__lte', v)} dropUp />
                </div>
                <div className="w-[90px]">
                  <DateTimeBox type="time" value={f.created_at__time__lte || '00:00'} onChange={v => set('created_at__time__lte', v)} dropUp />
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
                  <input className={`${iCls} text-[var(--error-strong)] dark:text-[var(--error-sub)]`} placeholder="-100 000"
                    value={f.penalty_amount__gte} onChange={e => set('penalty_amount__gte', e.target.value.replace(/[^\d]/g, ''))} />
                  <input className={`${iCls} text-[var(--error-strong)] dark:text-[var(--error-sub)]`} placeholder="-1 000 000"
                    value={f.penalty_amount__lte} onChange={e => set('penalty_amount__lte', e.target.value.replace(/[^\d]/g, ''))} />
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3 ">
          <button onClick={() => setF(EMPTY_FILTER)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
              text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1-alt)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
            <FaXmark size={13} /> Tozalash
          </button>
          <button onClick={() => onApply(f)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
              bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]">
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
      <label className="block text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1.5">{label}</label>
      <div className={`w-full h-[42px] px-3 py-2.5 rounded-xl text-sm border flex items-center
        bg-[var(--bg-elevation-1-alt)] border-[var(--stroke-sub)] text-[var(--text-strong)]
        dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)]
        ${right ? 'justify-end' : ''}
        ${red ? 'text-[var(--error-strong)]! dark:text-[var(--error-sub)]!' : ''}`}>
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
      <div className="relative w-full max-w-[500px] rounded-2xl shadow-2xl bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)]">
        <div className="px-6 pt-6 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="text-[var(--text-sub)] dark:text-[var(--text-sub)] hover:opacity-70 cursor-pointer shrink-0">
              <FaArrowLeft size={16} />
            </button>
            <h2 className="text-base font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Ish haqini tasdiqlaysizmi?</h2>
          </div>
          <button onClick={onCancel} className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors
            bg-[#F1F3F9] hover:bg-[var(--stroke-sub)] text-[var(--text-sub)] dark:bg-[var(--bg-elevation-2)] dark:hover:bg-[var(--bg-elevation-2)] dark:text-[var(--text-sub)]">
            <FaXmark size={14} />
          </button>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-[var(--text-sub)] dark:text-[var(--text-sub)]">Tasdiqlangandan so'ng, bu amalni bekor qilib bo'lmaydi.</p>
        </div>
        <div className="px-6 pb-5 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer
            text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1-alt)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
            <FaXmark size={13} /> Bekor qilish
          </button>
          <button onClick={onConfirm} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
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
        <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-70 cursor-pointer shrink-0">
                <FaArrowLeft size={16} />
              </button>
              <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Ish haqi ma'lumotlari</h2>
            </div>

          </div>

          {/* User info */}
          <div className="px-6 pb-5 flex items-center gap-4">
            {u.avatar
              ? <img src={u.avatar} alt="avatar" className="w-[80px] h-[80px] rounded-[20px] object-cover shrink-0" />
              : <div className="w-[80px] h-[80px] rounded-[20px] bg-[var(--accent-sub)] flex items-center justify-center text-white text-3xl font-bold shrink-0">
                {u.username?.[0]?.toUpperCase() ?? '?'}
              </div>
            }
            <div>
              <p className="text-[18px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)] leading-tight">{u.username ?? ''}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-lg font-medium bg-[#F1F3F9] text-[var(--text-strong)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--text-strong)]">
                  Viloyat: <span className="font-bold">{u.region ?? ''}</span>
                </span>
                <span className="text-xs px-3 py-1 rounded-lg font-medium bg-[#F1F3F9] text-[var(--text-strong)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--text-strong)]">
                  Tuman: <span className="font-bold">{u.district ?? ''}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="px-6 pb-4 grid grid-cols-2 gap-3">
            <Field label="Lavozimi" value={u.position ?? ''} />
            <div>
              <label className="block text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1.5">Passport ma'lumotlari</label>
              <div className="flex gap-2">
                <div className="w-16 shrink-0 h-[42px] px-3 py-2.5 rounded-xl text-sm text-center border flex items-center justify-center bg-[var(--bg-elevation-1-alt)] border-[var(--stroke-sub)] text-[var(--text-strong)] dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)]">
                  {u.passport_series?.slice(0, 2) ?? ''}
                </div>
                <div className="flex-1 h-[42px] px-3 py-2.5 rounded-xl text-sm border flex items-center bg-[var(--bg-elevation-1-alt)] border-[var(--stroke-sub)] text-[var(--text-strong)] dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)]">
                  {u.passport_series?.slice(2)?.trim() ?? ''}
                </div>
              </div>
            </div>
            <Field label="Oylik maosh" value={fmt(user.fixed_salary)} />
            <Field label="KPI bonus" value={fmt(user.kpi_bonus)} />
            <Field label="Yaratilgan vaqti" value={fmtDate(user.created_at)} />
            <Field label="Oy" value={user.month_display ?? ''} />
            <Field label="Jarima miqdori (UZS)" value={parseFloat(user.penalty_amount) > 0 ? `-${fmt(user.penalty_amount)}` : fmt(user.penalty_amount)} red right />
            <Field label="Jami miqdori (UZS)" value={fmt(user.total_amount)} right />
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-end gap-3 ">
            <button onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
                text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1-alt)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
              <FaXmark size={13} /> {user.is_confirmed ? 'Yopish' : 'Bekor qilish'}
            </button>
            {!user.is_confirmed && onApprove && (
              <button onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer
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
  const { user } = useAuth()
  const isAccountant = user?.active_role === 'accountant'

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
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
      if (f.month) params.month = monthToApi(f.month)
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

  const runSearch = (val) => {
    const q = val.trim()
    setSearch(q)
    loadPayrolls(filters, q, 1)
  }

  const handleApplyFilter = (f) => {
    setFilters(f)
    setShowFilter(false)
    loadPayrolls(f, search, 1)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">

      {/* Yuqori qism — qotib turadi */}
      <div className="shrink-0 bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Ish haqi</h1>
          {isAccountant && (selecting ? (
            <button onClick={() => { setSelecting(false); setSelected(new Set()) }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-extrabold cursor-pointer
              bg-[#DADFF0] text-[var(--text-strong)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--text-strong)]">
              <FaXmark size={13} /> Bekor qilish
            </button>
          ) : (
            <button onClick={() => setSelecting(true)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-extrabold cursor-pointer
              bg-[#DADFF0] text-[var(--text-strong)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--text-strong)]">
              <img src="/imgs/checkIcon.svg" alt="" className="w-4 h-4 dark:brightness-0 dark:invert" />
              Tanlash
            </button>
          ))}
        </div>

        {/* Filters + Tooltip */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)] dark:text-[var(--text-sub)]"
                width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Ism Sharifi bo'yicha izlash" value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') runSearch(searchInput) }}
                className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none w-[280px]
                bg-[#F1F3F9] border border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-soft)] focus:border-[var(--accent-sub)]
                dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-strong)] dark:placeholder-[#C2C8E0]"/>
            </div>
            <button onClick={() => setShowFilter(true)}
              className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border cursor-pointer
              bg-[#F1F3F9] border-[var(--stroke-sub)] text-[var(--text-sub)]
              dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-sub)]">
              <LuFilter size={13} />
              Filtrlash
              {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-strong)]" />}
            </button>
          </div>

          {/* Info tooltip */}
          <div className="relative group flex items-center gap-2">
            <div className="absolute right-13 top-1/2 -translate-y-1/2 z-20 w-[220px] px-4 py-3 rounded-2xl shadow-xl text-[12px] text-[var(--text-strong)] dark:text-[var(--text-strong)]
            bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]
            opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
              Tasdiqlash orqali ish haqi yakuniy hisob bo‘yicha hisoblanadi.
             </div>
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-strong)] dark:bg-[var(--bg-elevation-1-alt)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            <button className="w-7 h-7 flex items-center justify-center cursor-pointer shrink-0">
              <img src="/imgs/LeftIcon.svg" alt="info" className="w-5 h-5 dark:brightness-0 dark:invert" />
            </button>
          </div>
        </div>

      </div>{/* /shrink-0 */}

      {/* Table — scroll bo'ladigan qism */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-sm text-[var(--text-disabled)] dark:text-[var(--text-soft)]">Yuklanmoqda...</div>
        ) : data.length === 0 ? (
          <EmptyState
            icon="/imgs/ishhaqiIcon.svg"
            title="Ish haqi ma'lumotlari topilmadi"
            description="Ma'lumotlar keyinroq paydo bo'ladi yoki filtrlarni tekshiring"
          />
        ) : (
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">
              <tr className="border-b border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]">
                {selecting && (
                  <th className="w-10 px-4 py-3 text-left bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="cursor-pointer accent-[var(--accent-strong)]" />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] w-10 bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">№</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">Ism sharifi</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">Oy</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">Oylik maosh (UZS)</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">KPI bonus (UZS)</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">Jarima miqdori (UZS)</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">Jami miqdori (UZS)</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">Yaratilgan vaqt</th>
                <th className="px-4 py-3 text-center font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] sticky right-0 bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">Tasdiqlanish</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u, idx) => (
                <tr key={u.id} onClick={() => handleRowClick(u)}
                  className="group border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] last:border-0 cursor-pointer hover:bg-black/3 dark:hover:bg-white/3">
                  {selecting && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} className="cursor-pointer accent-[var(--accent-strong)]" />
                    </td>
                  )}
                  <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">{u.user_info?.username ?? ''}</td>
                  <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{u.month_display ?? ''}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--text-strong)] dark:text-[var(--text-strong)]">{fmt(u.fixed_salary)}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-strong)] dark:text-[var(--text-strong)]">{fmt(u.kpi_bonus)}</td>
                  <td className="px-4 py-3 text-right font-medium text-[var(--error-strong)] dark:text-[var(--error-sub)]">
                    {parseFloat(u.penalty_amount) > 0 ? `-${fmt(u.penalty_amount)}` : fmt(u.penalty_amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--text-strong)] dark:text-[var(--text-strong)]">{fmt(u.total_amount)}</td>
                  <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{fmtDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-center sticky right-0 bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] group-hover:bg-[#F0F1F5] dark:group-hover:bg-[#202221] transition-colors" onClick={e => e.stopPropagation()}>
                    {u.is_confirmed
                      ? <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-green-500">
                        <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                      : <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[var(--bg-elevation-2)] dark:bg-[var(--bg-elevation-2)]" />
                    }
                  </td>
                </tr>
              ))}
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

      {/* Selection bar */}
      {isAccountant && selecting && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl
          bg-[var(--bg-elevation-1-alt)] border border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
          <span className="text-sm text-[var(--text-sub)] dark:text-[var(--text-sub)] mr-1">{selected.size} ta tanlandi</span>
          <button onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer bg-green-500 text-white hover:bg-green-600">
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Tasdiqlash
          </button>
        </div>
      )}

      {/* Modals */}
      {showConfirm && <ConfirmModal onCancel={() => setShowConfirm(false)} onConfirm={() => handleApprove(selected)} />}
      {showFilter && <SalaryFilterModal initial={filters} onClose={() => setShowFilter(false)} onApply={handleApplyFilter} />}
      {detailUser && <UserDetailModal user={detailUser} onClose={() => setDetailUser(null)} onApprove={isAccountant ? handleApprove : null} />}
    </div>
  )
}
