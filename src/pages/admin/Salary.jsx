import { useState, useEffect, useRef } from 'react'
import { FaFilter, FaXmark, FaArrowLeft, FaChevronDown, FaCalendarDays, FaClock } from 'react-icons/fa6'

const SALARY_DATA = [
  { id: 1, name: 'Maria Martinez',  position: 'Backend dasturchi',  region: 'Toshkent viloyati', district: 'Toshkent tumani', passport: 'AA 142505', month: 'Yanvar', salary: 15500000, kpi: 250000,  fine: -150000, total: 250000000, created: '15.02.2026  20:00', approved: false },
  { id: 2, name: 'Jing Wei',        position: 'Frontend dasturchi', region: 'Samarqand viloyati', district: 'Samarqand tumani', passport: 'BB 234567', month: 'Fevral', salary: 7250000,  kpi: 75000,   fine: -50000,  total: 100000000, created: '20.03.2026  09:00', approved: false },
  { id: 3, name: 'Alex Chen',       position: 'Dizayner',           region: 'Buxoro viloyati',    district: 'Buxoro tumani',    passport: 'CC 345678', month: 'Mart',   salary: 5500000,  kpi: 60000,   fine: -30000,  total: 90000000,  created: '21.03.2026  10:00', approved: false },
  { id: 4, name: 'Maria Garcia',    position: 'Menejer',            region: 'Andijon viloyati',   district: 'Andijon tumani',   passport: 'DD 456789', month: 'Aprel',  salary: 8200000,  kpi: 85000,   fine: -45000,  total: 110000000, created: '22.03.2026  11:00', approved: false },
  { id: 5, name: 'Maria Gonzalez',  position: 'Tahlilchi',          region: 'Namangan viloyati',  district: 'Namangan tumani',  passport: 'EE 567890', month: 'Avgust', salary: 7800000,  kpi: 90000,   fine: -10000,  total: 105000000, created: '23.03.2026  12:00', approved: false },
  { id: 6, name: 'Samuel Patel',    position: 'DevOps',             region: 'Farg\'ona viloyati', district: 'Farg\'ona tumani', passport: 'FF 678901', month: 'Avgust', salary: 6100000,  kpi: 70000,   fine: -25000,  total: 60000000,  created: '24.03.2026  13:00', approved: false },
  { id: 7, name: 'Emily Johnson',   position: 'QA muhandis',        region: 'Xorazm viloyati',    district: 'Urganch tumani',   passport: 'GG 789012', month: 'Avgust', salary: 4500000,  kpi: 50000,   fine: -15000,  total: 80000000,  created: '25.03.2026  14:00', approved: false },
  { id: 8, name: 'Doston Dostonov', position: 'Loyiha rahbari',     region: 'Toshkent viloyati',  district: 'Toshkent tumani',  passport: 'AA 142505', month: 'Yanvar', salary: 10000000, kpi: 1000000, fine: -500000, total: 150000000, created: '01.01.2026  20:00', approved: true  },
]

const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr']

const EMPTY_FILTER = { month: '', dateFromD: '', dateFromT: '', dateToD: '', dateToT: '', sumFrom: '', sumTo: '', fineFrom: '', fineTo: '', showFine: false }

function fmt(n) { return Math.abs(n).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtMoney(raw) { const d = raw.replace(/\D/g,''); return d.replace(/\B(?=(\d{3})+(?!\d))/g,' ') }

const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'
const iCls = 'w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] focus:border-[#526ED3] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]'

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
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A]
      bg-transparent focus-within:border-[#526ED3] transition-colors cursor-text">
      {placeholder && <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">{placeholder}:</span>}
      <input ref={ref} type={type} value={value} onChange={e=>onChange(e.target.value)}
        className="flex-1 min-w-0 text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-[#FFFFFF] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden"/>
      <button type="button" onClick={()=>ref.current?.showPicker?.()}
        className="shrink-0 cursor-pointer text-[#8F95A8] dark:text-[#C2C8E0] hover:text-[#526ED3] transition-colors">
        {icon}
      </button>
    </div>
  )
}

/* ── Toggle ── */
function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={()=>onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${checked?'bg-[#3F57B3]':'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked?'translate-x-5':'translate-x-0.5'}`}/>
    </button>
  )
}

/* ── SalaryFilterModal ── */
function SalaryFilterModal({ onClose, onApply, initial }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const set = (k,v) => setF(p=>({...p,[k]:v}))
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose}/>
      <div className="relative w-full max-w-[560px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#E2E6F2] dark:border-[#292A2A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-[#5B6078] dark:text-[#C2C8E0] hover:opacity-70 cursor-pointer shrink-0"><FaArrowLeft size={16}/></button>
            <div>
              <h2 className="text-lg font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Filtrlash</h2>
              <p className="text-xs text-[#8F95A8] dark:text-[#C2C8E0] mt-0.5">Kerakli filtirlarni tanlang, natijalar shunga qarab saralanadi</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer transition-colors text-[#8F95A8] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]"><FaXmark size={14}/></button>
        </div>
        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Oy */}
          <div>
            <label className={labelCls}>Oy</label>
            <MonthDropdown value={f.month} onChange={v=>set('month',v)}/>
          </div>
          {/* Yaratilgan vaqt */}
          <div>
            <label className={labelCls}>Yaratilgan vaqt oralig'i</label>
            <div className="grid grid-cols-4 gap-2">
              <DateBox type="date" value={f.dateFromD} onChange={v=>set('dateFromD',v)} placeholder="dan"   icon={<FaCalendarDays size={12}/>}/>
              <DateBox type="time" value={f.dateFromT} onChange={v=>set('dateFromT',v)}                     icon={<FaClock size={12}/>}/>
              <DateBox type="date" value={f.dateToD}   onChange={v=>set('dateToD',v)}   placeholder="gacha" icon={<FaCalendarDays size={12}/>}/>
              <DateBox type="time" value={f.dateToT}   onChange={v=>set('dateToT',v)}                       icon={<FaClock size={12}/>}/>
            </div>
          </div>
          {/* Jami miqdor */}
          <div>
            <label className={labelCls}>Jami miqdori (UZS)</label>
            <div className="flex gap-2">
              <input className={iCls} placeholder="dan: 0"   value={f.sumFrom} onChange={e=>set('sumFrom',fmtMoney(e.target.value))}/>
              <input className={iCls} placeholder="gacha: 0" value={f.sumTo}   onChange={e=>set('sumTo',  fmtMoney(e.target.value))}/>
            </div>
          </div>
          {/* Jarima miqdor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0]">Jarima miqdori</label>
              <Toggle checked={f.showFine} onChange={v=>set('showFine',v)}/>
            </div>
            {f.showFine && (
              <div className="flex gap-2">
                <input className={iCls} placeholder="-100 000,00" value={f.fineFrom} onChange={e=>set('fineFrom',fmtMoney(e.target.value))}/>
                <input className={iCls} placeholder="-1 000 000,00" value={f.fineTo} onChange={e=>set('fineTo',fmtMoney(e.target.value))}/>
              </div>
            )}
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E6F2] dark:border-[#292A2A] flex items-center justify-end gap-3">
          <button onClick={()=>setF(EMPTY_FILTER)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={14}/> Tozalash
          </button>
          <button onClick={()=>onApply(f)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Qidirish
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── UserDetailModal ── */
function UserDetailModal({ user, onClose, onApprove }) {
  const [showConfirm, setShowConfirm] = useState(false)
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
        <div className="fixed inset-0 bg-black/60" onClick={onClose}/>
        <div className="relative w-full max-w-[560px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">
          {/* Header */}
          <div className="px-6 pt-5 pb-4 border-b border-[#E2E6F2] dark:border-[#292A2A] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={onClose} className="text-[#5B6078] dark:text-[#C2C8E0] hover:opacity-70 cursor-pointer shrink-0"><FaArrowLeft size={16}/></button>
              <h2 className="text-lg font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Ish haqi ma'lumotlari</h2>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer transition-colors text-[#8F95A8] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]"><FaXmark size={14}/></button>
          </div>
          {/* User info */}
          <div className="px-6 pt-5 pb-2 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#DADFF0] dark:bg-[#292A2A] flex items-center justify-center shrink-0 text-xl font-bold text-[#3F57B3]">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-base font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">{user.name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]">Viloyat: {user.region}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]">Tuman: {user.district}</span>
              </div>
            </div>
          </div>
          {/* Fields */}
          <div className="px-6 py-4 grid grid-cols-2 gap-3">
            <Field label="Lavozimi"          value={user.position}/>
            <div>
              <label className={labelCls}>Passport ma'lumotlari</label>
              <div className="flex gap-2">
                <div className={iCls + ' w-16 text-center'}>{user.passport.split(' ')[0]}</div>
                <div className={iCls + ' flex-1'}>{user.passport.split(' ')[1]}</div>
              </div>
            </div>
            <Field label="Oylik maosh"       value={fmt(user.salary)}  right/>
            <Field label="KPI bonus"         value={fmt(user.kpi)}     right/>
            <Field label="Yaratilgan vaqti"  value={user.created}/>
            <Field label="Oy"                value={user.month}/>
            <Field label="Jarima miqdori (UZS)" value={`-${fmt(user.fine)}`} red/>
            <Field label="Jami miqdori (UZS)"   value={fmt(user.total)}  right/>
          </div>
          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#E2E6F2] dark:border-[#292A2A] flex items-center justify-end gap-3">
            <button onClick={onClose} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
              Yopish
            </button>
            {!user.approved && (
              <button onClick={()=>setShowConfirm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer bg-green-500 text-white hover:bg-green-600">
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Tasdiqlash
              </button>
            )}
          </div>
        </div>
      </div>
      {showConfirm && (
        <ConfirmModal
          onCancel={()=>setShowConfirm(false)}
          onConfirm={()=>{ onApprove(user.id); setShowConfirm(false); onClose() }}
        />
      )}
    </>
  )
}

/* ── Field helper ── */
function Field({ label, value, right, red }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className={`${iCls} ${right?'text-right':''} ${red?'text-[#E02D2D] dark:text-[#FA5252]':''}`}>{value}</div>
    </div>
  )
}

/* ── ConfirmModal ── */
function ConfirmModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel}/>
      <div className="relative w-full max-w-[420px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">
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
  const [data, setData]               = useState(SALARY_DATA)
  const [selecting, setSelecting]     = useState(false)
  const [selected, setSelected]       = useState(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [showFilter, setShowFilter]   = useState(false)
  const [filters, setFilters]         = useState(EMPTY_FILTER)
  const [detailUser, setDetailUser]   = useState(null)

  const hasFilter = Object.values(filters).some(v => v && v !== false)

  const filtered = data.filter(u => {
    const q = search.toLowerCase()
    if (q && !u.name.toLowerCase().includes(q)) return false
    if (filters.month && u.month !== filters.month) return false
    return true
  })

  const allSelected = filtered.length > 0 && filtered.every(u => selected.has(u.id))
  const toggleAll   = () => {
    if (allSelected) setSelected(prev => { const s = new Set(prev); filtered.forEach(u => s.delete(u.id)); return s })
    else             setSelected(prev => { const s = new Set(prev); filtered.forEach(u => s.add(u.id));    return s })
  }
  const toggleOne = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const handleApprove = (ids) => {
    const idSet = ids instanceof Set ? ids : new Set([ids])
    setData(prev => prev.map(u => idSet.has(u.id) ? { ...u, approved: true } : u))
    setShowConfirm(false)
    setSelecting(false)
    setSelected(new Set())
  }

  const toggleApprove = (id) => {
    setData(prev => prev.map(u => u.id === id ? { ...u, approved: !u.approved } : u))
  }

  const handleRowClick = (u) => {
    if (selecting) { toggleOne(u.id); return }
    setDetailUser(u)
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
          <input type="text" placeholder="Ism Sharifi bo'yicha izlash" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none transition-colors w-[240px]
              bg-[#F1F3F9] border border-[#E2E6F2] text-[#8F95A8] placeholder-[#8F95A8] focus:border-[#526ED3]
              dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#C2C8E0]"/>
        </div>
        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border transition-colors cursor-pointer
            bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078]
            dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
          <FaFilter size={13}/>
          Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]"/>}
        </button>
      </div>

      {/* Table */}
      <div className="border-y border-[#E2E6F2] dark:border-[#292A2A] overflow-x-auto">
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
              <th className="px-4 py-3 text-center font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] sticky right-0 backdrop-blur-sm bg-white/80 dark:bg-black/20 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]">Tasdiqlanish</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, idx) => (
              <tr key={u.id}
                onClick={() => handleRowClick(u)}
                className={`border-b border-[#EEF1F7] dark:border-[#292A2A] transition-colors last:border-0 cursor-pointer
                  ${selected.has(u.id) ? 'bg-[#E9EEFF]/60 dark:bg-[#2A2D3E]/60' : 'hover:bg-black/3 dark:hover:bg-white/3'}`}>
                {selecting && (
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className={`transition-transform duration-200 ${selected.has(u.id) ? 'translate-x-2' : ''}`}>
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} className="cursor-pointer accent-[#3F57B3]"/>
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">
                  <span className={`inline-block transition-transform duration-200 ${selected.has(u.id) ? 'translate-x-2' : ''}`}>{idx + 1}</span>
                </td>
                <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-[#FFFFFF]">{u.name}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{u.month}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(u.salary)}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(u.kpi)}</td>
                <td className="px-4 py-3 text-right font-medium text-[#E02D2D] dark:text-[#FA5252]">-{fmt(u.fine)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(u.total)}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{u.created}</td>
                <td className="px-4 py-3 text-center sticky right-0 backdrop-blur-sm bg-white/80 dark:bg-black/20 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]"
                  onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={u.approved} onChange={() => toggleApprove(u.id)}
                    className="w-4 h-4 cursor-pointer accent-[#3F57B3]"/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">Ma'lumot topilmadi</div>
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
          onApply={f => { setFilters(f); setShowFilter(false) }}
        />
      )}

      {detailUser && (
        <UserDetailModal
          user={detailUser}
          onClose={() => setDetailUser(null)}
          onApprove={id => {
            setData(prev => prev.map(u => u.id === id ? { ...u, approved: true } : u))
            setDetailUser(null)
          }}
        />
      )}
    </div>
  )
}
