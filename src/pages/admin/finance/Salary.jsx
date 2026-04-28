import { useState, useEffect, useRef } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown, FaCalendarDays, FaClock } from 'react-icons/fa6'
import { LuFilter } from 'react-icons/lu'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']

const EMPTY_FILTER = { month: '', dateFromD: '', dateFromT: '', dateToD: '', dateToT: '', sumFrom: '', sumTo: '', fineFrom: '', fineTo: '', showFine: false }

function fmt(n) { 
  const num = parseFloat(n)
  if (isNaN(num)) return '—'
  return Math.abs(num).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtMoney(raw) { const d = raw.replace(/\D/g,''); return d.replace(/\B(?=(\d{3})+(?!\d))/g,' ') }

const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'
const iCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] focus:border-[#526ED3] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]'

// ── API ──────────────────────────────────────────────────────
async function apiGetPayrolls(params = {}) {
  const res = await axiosAPI.get('/payroll/', { params })
  const payload = res.data?.data ?? res.data
  return Array.isArray(payload) ? payload : (payload.results ?? [])
}

async function apiGetPayrollDetail(id) {
  const res = await axiosAPI.get(`/payroll/${id}/`)
  return res.data?.data ?? res.data
}

async function apiConfirmPayrolls(payroll_ids) {
  const res = await axiosAPI.post('/payroll/confirm/', { payroll_ids })
  return res.data?.data ?? res.data
}

/* ── useDropdown ── */
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

/* ── MonthDropdown ── */
function MonthDropdown({ value, onChange }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
          bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
          ${value ? 'text-[#1A1D2E] dark:text-[#FFFFFF]' : 'text-[#8F95A8] dark:text-[#C2C8E0]'}`}>
        <span className="flex-1 text-left truncate">{value || 'Xarajat turini tanlang'}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && <span onMouseDown={e=>{e.stopPropagation();onChange('')}} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11}/></span>}
          <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open?'rotate-180':''}`}/>
        </div>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
          bg-white border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
          {MONTHS.map((m,i) => (
            <button key={m} type="button" onClick={()=>{onChange(m);setOpen(false)}}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
                ${i<MONTHS.length-1?'border-b border-[#F1F3F9] dark:border-[#292A2A]':''}
                ${value===m?'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]':'text-[#1A1D2E] dark:text-[#FFFFFF] hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── DateBox ── */
function DateBox({ type, value, onChange, icon, placeholder }) {
  const ref = useRef(null)
  return (
    <div className="flex items-center gap-2 px-3 py-3 rounded-2xl border border-[#E2E6F2] dark:border-[#2A2B2B]
      bg-white dark:bg-[#111111] focus-within:border-[#526ED3] transition-colors cursor-text">
      {placeholder && <span className="text-xs text-[#8F95A8] dark:text-[#5B6078] shrink-0 select-none">{placeholder}:</span>}
      <input ref={ref} type={type} value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 min-w-0 text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-[#FFFFFF] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" />
      <button type="button" onClick={() => ref.current?.showPicker?.()}
        className="shrink-0 cursor-pointer text-[#8F95A8] dark:text-[#5B6078] hover:text-[#526ED3] transition-colors">
        {icon}
      </button>
    </div>
  )
}

/* ── Toggle ── */
function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={()=>onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${checked?'bg-[#000000]':'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
      <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked?'translate-x-5':'translate-x-0.5'}`}/>
    </button>
  )
}

/* ── SalaryFilterModal ── */
function SalaryFilterModal({ onClose, onApply, initial }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const inputCls =
    'w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors ' +
    'bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] focus:border-[#526ED3] ' +
    'dark:bg-[#1C1D1D] dark:border-[#2A2B2B] dark:text-[#FFFFFF] dark:placeholder-[#5B6078]'

  const fineCls =
    'w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors ' +
    'bg-white border-[#E2E6F2] text-[#E02D2D] placeholder-[#E02D2D]/50 focus:border-[#526ED3] ' +
    'dark:bg-[#1C1D1D] dark:border-[#2A2B2B] dark:text-[#FA5252] dark:placeholder-[#FA5252]/50'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
       <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer transition-colors z-10">
          <FaXmark size={14} />
        </button>
      <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
       

        {/* Header */}
        <div className="px-7 pt-7 pb-3">
          <div className="flex items-center gap-3 mb-1.5">
            <button onClick={onClose}
              className="text-[#1A1D2E] dark:text-[#C2C8E0] hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#C2C8E0]">Filtrlash</h2>
          </div>
          <p className="text-sm text-[#5B6078] dark:text-[#C2C8E0] ">
            Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi
          </p>
        </div>

        {/* Body */}
        <div className="px-7 pb-5 pt-2 flex flex-col gap-4">

          {/* Oy */}
          <div>
            <label className={labelCls}>Oy</label>
            <MonthDropdownFull value={f.month} onChange={v => set('month', v)} />
          </div>

          {/* Yaratilgan vaqti oralig'i */}
          <div>
            <label className={labelCls}>Yaratilgan vaqti oralig'i</label>
            <div className="grid grid-cols-4 gap-2">
              <DateBox type="date" value={f.dateFromD} onChange={v => set('dateFromD', v)} placeholder="dan"   icon={<FaCalendarDays size={12}/>} />
              <DateBox type="time" value={f.dateFromT} onChange={v => set('dateFromT', v)}                     icon={<FaClock size={12}/>} />
              <DateBox type="date" value={f.dateToD}   onChange={v => set('dateToD', v)}   placeholder="gacha" icon={<FaCalendarDays size={12}/>} />
              <DateBox type="time" value={f.dateToT}   onChange={v => set('dateToT', v)}                       icon={<FaClock size={12}/>} />
            </div>
          </div>

          {/* Jami miqdori + Jarima miqdori */}
          <div className="grid grid-cols-2 gap-5 ">
            {/* Jami */}
            <div>
              <label className={`${labelCls } mb-3`}>Jami miqdori</label>
              <div className="flex gap-2">
                <input className={inputCls} placeholder="dan: 0"   value={f.sumFrom} onChange={e => set('sumFrom', fmtMoney(e.target.value))} />
                <input className={inputCls} placeholder="gacha: 0" value={f.sumTo}   onChange={e => set('sumTo',   fmtMoney(e.target.value))} />
              </div>
            </div>
            {/* Jarima */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls + ' mb-0'}>Jarima miqdori</label>
                <Toggle checked={f.showFine} onChange={v => set('showFine', v)} />
              </div>
              <div className="flex gap-2">
                {f.showFine ? (
                  <>
                    <input className={fineCls} placeholder="-100 000" value={f.fineFrom} onChange={e => set('fineFrom', fmtMoney(e.target.value))} />
                    <input className={fineCls} placeholder="-1 000 000" value={f.fineTo} onChange={e => set('fineTo',   fmtMoney(e.target.value))} />
                  </>
                ) : (
                  <>
                   
                  </>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-7 py-5 flex items-center justify-end gap-3">
          <button onClick={() => setF(EMPTY_FILTER)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Tozalash
          </button>
          <button onClick={() => onApply(f)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer
              bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            Qidirish
          </button>
        </div>

      </div>
    </div>
  )
}

/* ── SalaryDateBox (filter uchun, placeholder yo'q) ── */
function SalaryDateBox({ value, onChange, icon }) {
  const ref = useRef(null)
  return (
    <div className="flex items-center gap-2 px-3 py-3 rounded-2xl border border-[#E2E6F2] dark:border-[#2A2B2B]
      bg-white dark:bg-[#1C1D1D] focus-within:border-[#526ED3] transition-colors">
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 min-w-0 text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-[#FFFFFF] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"
      />
      <button type="button" onClick={() => ref.current?.showPicker?.()}
        className="shrink-0 cursor-pointer text-[#8F95A8] dark:text-[#5B6078] hover:text-[#526ED3] transition-colors">
        {icon}
      </button>
    </div>
  )
}

/* ── MonthDropdownFull (to'liq kenglik, X bilan tozalash) ── */
function MonthDropdownFull({ value, onChange }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm border transition-colors cursor-pointer
          bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]
          ${value ? 'text-[#1A1D2E] dark:text-[#FFFFFF]' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
        <span className="flex-1 text-left truncate">{value || 'Xarajat turini tanlang'}</span>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {value
            ? <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer transition-colors"><FaXmark size={13} /></span>
            : <FaChevronDown size={12} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
          }
        </div>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-[60] w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
          bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
          {MONTHS.map((m, i) => (
            <button key={m} type="button" onClick={() => { onChange(m); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
                ${i < MONTHS.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                ${value === m
                  ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]'
                  : 'text-[#1A1D2E] dark:text-[#FFFFFF] hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
              {m}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── UserDetailModal ── */
function UserDetailModal({ user, onClose, onApprove }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const u = user.user_info ?? {}

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" onClick={onClose} />

        <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323] max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex items-center gap-3">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-[#FFFFFF] hover:opacity-70 cursor-pointer shrink-0">
              <FaArrowLeft size={16}/>
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF]">Ish haqi ma'lumotlari</h2>
          </div>

          {/* User info */}
          <div className="px-6 pb-5 flex items-center gap-4">
            {u.avatar
              ? <img src={u.avatar} alt="avatar" className="w-[80px] h-[80px] rounded-[20px] object-cover shrink-0"/>
              : <div className="w-[80px] h-[80px] rounded-[20px] bg-[#526ED3] flex items-center justify-center text-white text-3xl font-bold shrink-0">
                  {u.username?.[0]?.toUpperCase() ?? '?'}
                </div>
            }
            <div>
              <p className="text-[18px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF] leading-tight">{u.username ?? '—'}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs px-3 py-1 rounded-lg font-medium bg-[#F1F3F9] text-[#1A1D2E] dark:bg-[#292A2A] dark:text-[#FFFFFF]">
                  Viloyat: <span className="font-bold">{u.region ?? '—'}</span>
                </span>
                <span className="text-xs px-3 py-1 rounded-lg font-medium bg-[#F1F3F9] text-[#1A1D2E] dark:bg-[#292A2A] dark:text-[#FFFFFF]">
                  Tuman: <span className="font-bold">{u.district ?? '—'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="px-6 pb-4 grid grid-cols-2 gap-3">

            {/* Lavozimi + Passport */}
            <Field label="Lavozimi" value={u.position ?? '—'}/>
            <div>
              <label className="block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5">Passport ma'lumotlari</label>
              <div className="flex gap-2">
                <div className="w-16 shrink-0 px-3 py-2.5 rounded-xl text-sm text-center border
                  bg-white border-[#E2E6F2] text-[#1A1D2E]
                  dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF]">
                  {u.passport_series ?? ''}
                </div>
                <div className="flex-1 px-3 py-2.5 rounded-xl text-sm border
                  bg-white border-[#E2E6F2] text-[#1A1D2E]
                  dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF]">
                  {u.passport_number ?? ''}
                </div>
              </div>
            </div>

            <Field label="Oylik maosh" value={fmt(user.fixed_salary)}/>
            <Field label="KPI bonus" value={fmt(user.kpi_bonus)}/>
            <Field label="Yaratilgan vaqti" value={fmtDate(user.created_at)}/>
            <Field label="Oy" value={user.month_display ?? '—'}/>
            <Field label="Jarima miqdori (UZS)" value={`-${fmt(user.penalty_amount)}`} red right/>
            <Field label="Jami miqdori (UZS)" value={fmt(user.total_amount)} right/>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex items-center justify-end gap-3 border-t border-[#EEF1F7] dark:border-[#292A2A]">
            <button onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
                text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
              <FaXmark size={13}/> Bekor qilish
            </button>
            {!user.is_confirmed && (
              <button onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer
                  bg-green-500 text-white hover:bg-green-600">
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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

/* ── Field helper ── */
function Field({ label, value, right, red }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5">{label}</label>
      <div className={`w-full px-3 py-2.5 rounded-xl text-sm border
        bg-white border-[#E2E6F2] text-[#1A1D2E]
        dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF]
        ${right ? 'text-right' : ''}
        ${red ? '!text-[#E02D2D] dark:!text-[#FA5252]' : ''}`}>
        {value}
      </div>
    </div>
  )
}

/* ── ConfirmModal ── */
function ConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
       <button onClick={onCancel} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer transition-colors z-10">
          <FaXmark size={14} />
        </button>
      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">
       
        <div className="px-6 pt-5 dark:border-[#292A2A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onCancel} className="text-[#5B6078] dark:text-[#C2C8E0] hover:opacity-70 cursor-pointer shrink-0"><FaArrowLeft size={16}/></button>
            <h2 className="text-base font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Ish haqini tasdiqlaysizmi?</h2>
          </div>
          <button onClick={onCancel} className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer transition-colors text-[#8F95A8] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]"><FaXmark size={14}/></button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-[#5B6078] dark:text-[#C2C8E0]">Tasdiqlangandan so'ng, bu amaini bekor qilib bo'lmaydi.</p>
        </div>
        <div className="px-6 pb-4  dark:border-[#292A2A] flex items-center justify-end gap-3">
          <button onClick={onCancel} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={13}/> Bekor qilish
          </button>
          <button onClick={onConfirm} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer bg-green-500 text-white hover:bg-green-600">
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Tasdiqlash
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function SalaryPage() {
  const [search, setSearch]           = useState('')
  const [data, setData]               = useState([])
  const [loading, setLoading]         = useState(false)
  const [selecting, setSelecting]     = useState(false)
  const [selected, setSelected]       = useState(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [showFilter, setShowFilter]   = useState(false)
  const [filters, setFilters]         = useState(EMPTY_FILTER)
  const [detailUser, setDetailUser]   = useState(null)

  const hasFilter = Object.values(filters).some(v => v && v !== false)

  const loadPayrolls = async () => {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (filters.month) params.month = filters.month
      const result = await apiGetPayrolls(params)
      setData(result)
    } catch (err) {
      console.error(err)
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayrolls()
  }, [])

  const allSelected = data.length > 0 && data.every(u => selected.has(u.id))
  const toggleAll   = () => {
    if (allSelected) setSelected(prev => { const s = new Set(prev); data.forEach(u => s.delete(u.id)); return s })
    else             setSelected(prev => { const s = new Set(prev); data.forEach(u => s.add(u.id));    return s })
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
      toast.error("Tasdiqlashda xatolik yuz berdi.")
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
      toast.error("Ma'lumotlarni yuklashda xatolik yuz berdi.")
    }
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter') loadPayrolls()
  }

  const handleApplyFilter = (f) => {
    setFilters(f)
    setShowFilter(false)
    loadPayrolls()
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Ish haqi</h1>
        {selecting ? (
          <button onClick={() => { setSelecting(false); setSelected(new Set()) }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-extrabold transition-colors cursor-pointer
              bg-[#DADFF0] text-[#1A1D2E]
              dark:bg-[#3A3B3B] dark:text-white">
            <FaXmark size={13}/>
            Bekor qilish
          </button>
        ) : (
          <button onClick={() => setSelecting(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-extrabold transition-colors cursor-pointer
              bg-[#DADFF0] text-[#1A1D2E]
              dark:bg-[#3A3B3B] dark:text-white">
            <img src="/imgs/checkIcon.svg" alt="" className="w-4 h-4 dark:brightness-0 dark:invert"/>
            Tanlash
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#C2C8E0]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Ism Sharifi bo'yicha izlash (Enter)" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={handleSearch}
            className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none transition-colors w-[280px]
              bg-[#F1F3F9] border border-[#E2E6F2] text-[#8F95A8] placeholder-[#8F95A8] focus:border-[#526ED3]
              dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#C2C8E0]"/>
        </div>
        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border transition-colors cursor-pointer
            bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078]
            dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
          <LuFilter size={13}/>
          Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]"/>}
        </button>
      </div>

      {/* Table */}
      <div className="border-y border-[#E2E6F2] dark:border-[#292A2A] overflow-x-auto">
        {loading ? (
          <div className="py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">Yuklanmoqda...</div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">Ma'lumot topilmadi</div>
        ) : (
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
                {selecting && (
                  <th className="w-10 px-4 py-3 text-left">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="cursor-pointer accent-[#3F57B3]"/>
                  </th>
                )}
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] w-10">№</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Ism sharifi</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Oy</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Oylik maosh (UZS)</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">KPI bonus (UZS)</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Jarima miqdori (UZS)</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Jami miqdori (UZS)</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Yaratilgan vaqt</th>
                <th className="px-4 py-3 text-center font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] sticky right-0 bg-[#F8F9FC] dark:bg-[#191A1A] shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]">Tasdiqlanish</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u, idx) => (
                <tr key={u.id}
                  onClick={() => handleRowClick(u)}
                  className="border-b border-[#EEF1F7] dark:border-[#292A2A] transition-colors last:border-0 cursor-pointer hover:bg-black/3 dark:hover:bg-white/3">
                  {selecting && (
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} className="cursor-pointer accent-[#3F57B3]"/>
                    </td>
                  )}
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-[#FFFFFF]">{u.user_info?.username ?? '—'}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{u.month_display ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(u.fixed_salary)}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(u.kpi_bonus)}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#E02D2D] dark:text-[#FA5252]">-{fmt(u.penalty_amount)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(u.total_amount)}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{fmtDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-center sticky right-0 bg-[#F8F9FC] dark:bg-[#191A1A] shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]"
                    onClick={e => e.stopPropagation()}>
                    {u.is_confirmed ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-green-500">
                        <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#E9ECF5] dark:bg-[#292A2A]" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Selection bar */}
      {selecting && selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl
          bg-white border border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
          <span className="text-sm text-[#5B6078] dark:text-[#C2C8E0] mr-1">{selected.size} ta tanlandi</span>
          <button onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer bg-green-500 text-white hover:bg-green-600">
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Tasdiqlash
          </button>
        </div>
      )}

      {/* Modals */}
      {showConfirm && (
        <ConfirmModal
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => handleApprove(selected)}
        />
      )}

      {showFilter && (
        <SalaryFilterModal
          initial={filters}
          onClose={() => setShowFilter(false)}
          onApply={handleApplyFilter}
        />
      )}

      {detailUser && (
        <UserDetailModal
          user={detailUser}
          onClose={() => setDetailUser(null)}
          onApprove={handleApprove}
        />
      )}
    </div>
  )
}
