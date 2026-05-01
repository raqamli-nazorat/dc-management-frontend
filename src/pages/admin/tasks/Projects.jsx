import { useState, useEffect, useRef, useCallback } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown, FaEllipsisVertical, FaCheck } from 'react-icons/fa6'
import { LuFilter } from 'react-icons/lu'
import { usePageAction } from '../../../context/PageActionContext'
import { useAuth } from '../../../context/AuthContext'
import { DateTimeBox } from '../Components/DateTimeBox'
import EmptyState from '../../../components/EmptyState'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'

const STATUSES = ['Faol', 'Rejalashtirilmoqda', 'Yakunlangan']
const EMPTY_FILTER = { manager: '', status: '', employee: '', startFromD: '', startFromT: '', startToD: '', startToT: '', deadFromD: '', deadFromT: '', deadToD: '', deadToT: '' }
const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'

const STATUS_LABEL = {
  planning:  'Rejalashtirilmoqda',
  active:    'Faol',
  overdue:   "Muddati o'tgan",
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
}

const fmtDt = (iso) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

const MANAGERS = [
  'Mira Patel', 'Liam Johnson', 'Sofia Martinez', 'Aisha Khatun', 'Rajiv Menon',
  "Dudan Turg'unov", "To'raqul Fozilov", 'Davron Turdiyev',
]

const EMPLOYEES = [
  { name: 'Nodira Xodjayeva', role: 'Frontend dasturchi' },
  { name: 'Olimjon Isayev', role: 'UI/UX dizayner' },
  { name: 'Malika Tashkentova', role: 'Mahsulot menejeri' },
  { name: 'Lazizbek Rahimov', role: 'Mobil dasturchi' },
  { name: 'Марк Леонидов', role: 'Dizayner' },
  { name: 'Марина Иванова', role: 'Dasturchi' },
  { name: 'Jasur Karimov', role: 'PM' },
  { name: 'Nilufar Yusupova', role: 'Dasturchi' },
]

const statusStyle = {
  'Faol': { dot: 'bg-green-500', text: 'text-green-600 dark:text-green-400' },
  'Rejalashtirilmoqda': { dot: 'bg-[#8F95A8]', text: 'text-[#5B6078] dark:text-[#C2C8E0]' },
  'Yakunlangan': { dot: 'bg-[#526ED3]', text: 'text-[#526ED3] dark:text-[#7F95E6]' },
}

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

/* ── SimpleSelect (filter uchun) ── */
function SimpleSelect({ value, onChange, options, placeholder }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer
          bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
          ${value ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
        <span className="flex-1 text-left truncate">{value || placeholder}</span>
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {value && <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>}
          <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-48
          bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
          {options.map((o, i) => (
            <button key={o} type="button" onClick={() => { onChange(o); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm  cursor-pointer
                ${i < options.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                ${value === o ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── FilterModal ── */
function ProjectFilterModal({ onClose, onApply, initial, users = [] }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  const dateFromRef = useRef(null)
  const timeFromRef = useRef(null)
  const dateToRef   = useRef(null)
  const timeToRef   = useRef(null)
  const deadFromRef = useRef(null)
  const deadFromTRef = useRef(null)
  const deadToRef   = useRef(null)
  const deadToTRef  = useRef(null)

  const mgrDd = useDropdown()
  const empDd = useDropdown()
  const stsDd = useDropdown()

  const STATUS_API = [
    { label: 'Rejalashtirilmoqda', value: 'planning' },
    { label: 'Faol',               value: 'active' },
    { label: 'Yakunlangan',        value: 'completed' },
    { label: 'Bekor qilingan',     value: 'cancelled' },
  ]

  const ddBtn = (val) => `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer bg-white dark:bg-[#191A1A] border-[#E2E6F2] dark:border-[#292A2A] ${val ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`
  const ddList = 'absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52 bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]'
  const inputBox = 'flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] '

  const selectedMgr = users.find(u => u.id === f.manager)
  const selectedEmp = users.find(u => u.id === f.employee)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer  z-[200]">
        <FaXmark size={14} />
      </button>
      <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">

        {/* Header */}
        <div className="px-7 pt-7 pb-3">
          <div className="flex items-center gap-3 mb-1.5">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Filtrlash</h2>
          </div>
          <p className="text-sm text-[#5B6078]">Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi</p>
        </div>

        {/* Body */}
        <div className="px-7 pb-5 pt-2 flex flex-col gap-4">

          {/* Menejer + Holati + Xodim */}
          <div className="grid grid-cols-3 gap-3">
            {/* Menejer */}
            <div ref={mgrDd.ref}>
              <label className={labelCls}>Menejer</label>
              <div className="relative">
                <button type="button" onClick={() => mgrDd.setOpen(o => !o)} className={ddBtn(f.manager)}>
                  <span className="flex-1 text-left truncate">{selectedMgr?.username || 'Tanlang'}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {f.manager
                      ? <span onMouseDown={e => { e.stopPropagation(); set('manager', '') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                      : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${mgrDd.open ? 'rotate-180' : ''}`} />}
                  </div>
                </button>
                {mgrDd.open && (
                  <div className={ddList}>
                    {users.map((u, i) => (
                      <button key={u.id} type="button" onClick={() => { set('manager', u.id); mgrDd.setOpen(false) }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left  cursor-pointer ${i < users.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${f.manager === u.id ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                        <div className="w-6 h-6 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-[10px] font-bold text-[#526ED3] shrink-0">
                          {(u.username ?? '?').slice(0, 2).toUpperCase()}
                        </div>
                        <p className={`text-sm truncate ${f.manager === u.id ? 'text-[#3F57B3] dark:text-[#7F95E6] font-semibold' : 'text-[#1A1D2E] dark:text-white'}`}>{u.username}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Holati */}
            <div ref={stsDd.ref}>
              <label className={labelCls}>Holati</label>
              <div className="relative">
                <button type="button" onClick={() => stsDd.setOpen(o => !o)} className={ddBtn(f.status)}>
                  <span className="flex-1 text-left truncate">{STATUS_API.find(s => s.value === f.status)?.label || 'Tanlang'}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {f.status
                      ? <span onMouseDown={e => { e.stopPropagation(); set('status', '') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                      : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${stsDd.open ? 'rotate-180' : ''}`} />}
                  </div>
                </button>
                {stsDd.open && (
                  <div className={ddList}>
                    {STATUS_API.map((s, i) => (
                      <button key={s.value} type="button" onClick={() => { set('status', s.value); stsDd.setOpen(false) }}
                        className={`w-full px-4 py-2.5 text-left text-sm  cursor-pointer ${i < STATUS_API.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${f.status === s.value ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Xodim */}
            <div ref={empDd.ref}>
              <label className={labelCls}>Xodim</label>
              <div className="relative">
                <button type="button" onClick={() => empDd.setOpen(o => !o)} className={ddBtn(f.employee)}>
                  <span className="flex-1 text-left truncate">{selectedEmp?.username || 'Tanlang'}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {f.employee
                      ? <span onMouseDown={e => { e.stopPropagation(); set('employee', '') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                      : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${empDd.open ? 'rotate-180' : ''}`} />}
                  </div>
                </button>
                {empDd.open && (
                  <div className={ddList}>
                    {users.map((u, i) => (
                      <button key={u.id} type="button" onClick={() => { set('employee', u.id); empDd.setOpen(false) }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-left  cursor-pointer ${i < users.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${f.employee === u.id ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                        <div className="w-6 h-6 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-[10px] font-bold text-[#526ED3] shrink-0">
                          {(u.username ?? '?').slice(0, 2).toUpperCase()}
                        </div>
                        <p className={`text-sm truncate ${f.employee === u.id ? 'text-[#3F57B3] dark:text-[#7F95E6] font-semibold' : 'text-[#1A1D2E] dark:text-white'}`}>{u.username}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Boshlanish sanasi oralig'i */}
          <div>
            <label className={labelCls}>Boshlanish sanasi oralig'i</label>
            <div className="flex items-center gap-2">
              <div className={`${inputBox} flex-1 min-w-0`}>
                {!f.startFromD && <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">dan:</span>}
                <input ref={dateFromRef} type="date" value={f.startFromD} onChange={e => set('startFromD', e.target.value)}
                  className={`text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${f.startFromD ? 'flex-1 min-w-0' : 'w-0 opacity-0 pointer-events-none'}`} />
                <button type="button" onClick={() => dateFromRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3]  ml-auto">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </button>
              </div>
              <div className={`${inputBox} shrink-0`}>
                <input ref={timeFromRef} type="time" value={f.startFromT || '00:00'} onChange={e => set('startFromT', e.target.value === '00:00' ? '' : e.target.value)}
                  step="60"
                  className={`w-[52px] text-xs outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${!f.startFromT ? 'text-[#B6BCCB] dark:text-[#474848]' : 'text-[#1A1D2E] dark:text-white'}`} />
                <button type="button" onClick={() => timeFromRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] ">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </button>
              </div>
              <div className={`${inputBox} flex-1 min-w-0`}>
                {!f.startToD && <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">gacha:</span>}
                <input ref={dateToRef} type="date" value={f.startToD} onChange={e => set('startToD', e.target.value)}
                  className={`text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${f.startToD ? 'flex-1 min-w-0' : 'w-0 opacity-0 pointer-events-none'}`} />
                <button type="button" onClick={() => dateToRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3]  ml-auto">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </button>
              </div>
              <div className={`${inputBox} shrink-0`}>
                <input ref={timeToRef} type="time" value={f.startToT || '00:00'} onChange={e => set('startToT', e.target.value === '00:00' ? '' : e.target.value)}
                  step="60"
                  className={`w-[52px] text-xs outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${!f.startToT ? 'text-[#B6BCCB] dark:text-[#474848]' : 'text-[#1A1D2E] dark:text-white'}`} />
                <button type="button" onClick={() => timeToRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] ">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Muddat oralig'i */}
          <div>
            <label className={labelCls}>Muddat oralig'i</label>
            <div className="flex items-center gap-2">
              <div className={`${inputBox} flex-1 min-w-0`}>
                {!f.deadFromD && <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">dan:</span>}
                <input ref={deadFromRef} type="date" value={f.deadFromD} onChange={e => set('deadFromD', e.target.value)}
                  className={`text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${f.deadFromD ? 'flex-1 min-w-0' : 'w-0 opacity-0 pointer-events-none'}`} />
                <button type="button" onClick={() => deadFromRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3]  ml-auto">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </button>
              </div>
              <div className={`${inputBox} shrink-0`}>
                <input ref={deadFromTRef} type="time" value={f.deadFromT || '00:00'} onChange={e => set('deadFromT', e.target.value === '00:00' ? '' : e.target.value)}
                  step="60"
                  className={`w-[52px] text-xs outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${!f.deadFromT ? 'text-[#B6BCCB] dark:text-[#474848]' : 'text-[#1A1D2E] dark:text-white'}`} />
                <button type="button" onClick={() => deadFromTRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] ">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </button>
              </div>
              <div className={`${inputBox} flex-1 min-w-0`}>
                {!f.deadToD && <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">gacha:</span>}
                <input ref={deadToRef} type="date" value={f.deadToD} onChange={e => set('deadToD', e.target.value)}
                  className={`text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${f.deadToD ? 'flex-1 min-w-0' : 'w-0 opacity-0 pointer-events-none'}`} />
                <button type="button" onClick={() => deadToRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3]  ml-auto">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </button>
              </div>
              <div className={`${inputBox} shrink-0`}>
                <input ref={deadToTRef} type="time" value={f.deadToT || '00:00'} onChange={e => set('deadToT', e.target.value === '00:00' ? '' : e.target.value)}
                  step="60"
                  className={`w-[52px] text-xs outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${!f.deadToT ? 'text-[#B6BCCB] dark:text-[#474848]' : 'text-[#1A1D2E] dark:text-white'}`} />
                <button type="button" onClick={() => deadToTRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] ">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 flex items-center justify-end gap-3 border-t border-[#F1F3F9] dark:border-[#292A2A]">
          <button onClick={() => setF(EMPTY_FILTER)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Tozalash
          </button>
          <button onClick={() => onApply(f)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
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

/* ── UserPickerModal — figmadagi xodim tanlash modali ── */
function UserPickerModal({ title, selected, onConfirm, onClose, users = [] }) {
  const [search, setSearch] = useState('')
  const [temp, setTemp] = useState(selected.map(u => u.id))

  const filtered = users.filter(u =>
    (u.username ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.position ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (id) => setTemp(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  )

  const toggleAll = () => {
    if (temp.length === filtered.length) setTemp([])
    else setTemp(filtered.map(u => u.id))
  }

  const handleConfirm = () => {
    onConfirm(users.filter(u => temp.includes(u.id)))
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-full max-w-[520px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111] flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer">
              <FaArrowLeft size={16} />
            </button>
            <h2 className="text-lg font-extrabold text-[#1A1D2E] dark:text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border  cursor-pointer
                border-[#E2E6F2] text-[#5B6078] hover:bg-[#F1F3F9] dark:border-[#292A2A] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
              </svg>
              Barchini tanlash
            </button>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Ism Sharifi bo'yicha izlash"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none border 
                  bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8]
                  dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white dark:placeholder-[#5B6078]
                  focus:border-[#526ED3]"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-2">
          {filtered.length === 0 && (
            <p className="text-sm text-[#8F95A8] text-center py-8">Foydalanuvchi topilmadi</p>
          )}
          {filtered.map(u => {
            const isSelected = temp.includes(u.id)
            return (
              <button
                key={u.id}
                onClick={() => toggle(u.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border  cursor-pointer text-left
                  ${isSelected
                    ? 'bg-[#EEF1FB] border-[#C7D0F5] dark:bg-[#292A2A] dark:border-[#3F57B3]'
                    : 'bg-white border-[#EEF1F7] hover:bg-[#F8F9FC] dark:bg-[#191A1A] dark:border-[#292A2A] dark:hover:bg-[#222323]'
                  }`}
              >
                {/* Checkbox */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 
                  ${isSelected ? 'bg-[#3F57B3] border-[#3F57B3]' : 'border-[#D0D5E2] dark:border-[#474848]'}`}>
                  {isSelected && <FaCheck size={9} className="text-white" />}
                </div>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                  {u.username?.slice(0, 2).toUpperCase()}
                </div>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1A1D2E] dark:text-white truncate">{u.username}</p>
                  <p className="text-xs text-[#8F95A8] dark:text-[#5B6078] truncate">{u.position || u.roles?.[0] || '—'}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#EEF1F7] dark:border-[#292A2A] flex items-center justify-between shrink-0">
          <span className="text-sm text-[#5B6078] dark:text-[#C2C8E0]">{temp.length} ta tanlangan</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setTemp([])}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium  cursor-pointer
                text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
              <FaXmark size={12} /> Tozalash
            </button>
            <button onClick={handleConfirm}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold  cursor-pointer
                bg-[#3F57B3] text-white hover:bg-[#526ED3]">
              <FaCheck size={12} /> Qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── SelectedUsersField — tanlangan xodimlarni ko'rsatish ── */
function SelectedUsersField({ label, selected, onOpen, onRemove }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div
        onClick={onOpen}
        className="w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer text-left
          bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A] hover:border-[#526ED3]"
      >
        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {selected.length === 0 ? (
            <span className="text-sm text-[#8F95A8] dark:text-[#5B6078]">{label}</span>
          ) : (
            selected.map(u => (
              <span key={u.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium
                  bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]">
                {u.username}
                <span
                  onMouseDown={e => { e.stopPropagation(); onRemove(u.id) }}
                  className="hover:opacity-70 cursor-pointer ml-0.5 flex items-center">
                  <FaXmark size={9} />
                </span>
              </span>
            ))
          )}
        </div>
        <FaChevronDown size={11} className="text-[#8F95A8] shrink-0 ml-2" />
      </div>
    </div>
  )
}

/* ── MultiSelect ── */
function MultiSelect({ placeholder, options, selected, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const filtered = options.filter(o =>
    !selected.find(s => s.name === o.name) &&
    (o.name.toLowerCase().includes(query.toLowerCase()) || o.role.toLowerCase().includes(query.toLowerCase()))
  )

  const remove = (name) => onChange(selected.filter(s => s.name !== name))
  const add = (item) => { onChange([...selected, item]); setQuery(''); }

  const iCls = 'w-full px-3 py-2 text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white placeholder-[#8F95A8] dark:placeholder-[#5B6078]'

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(true)}
        className={`min-h-[42px] w-full flex flex-wrap gap-1.5 px-3 py-2 rounded-xl border  cursor-text
          bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
          ${open ? 'border-[#526ED3] dark:border-[#526ED3]' : ''}`}>
        {selected.map(s => (
          <span key={s.name}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium
              bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]">
            {s.name} | {s.role}
            <button type="button" onMouseDown={e => { e.stopPropagation(); remove(s.name) }}
              className="hover:opacity-70 cursor-pointer ml-0.5">
              <FaXmark size={9} />
            </button>
          </span>
        ))}
        {open ? (
          <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
            placeholder={selected.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[80px] text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white placeholder-[#8F95A8]" />
        ) : selected.length === 0 && (
          <span className="text-sm text-[#8F95A8] dark:text-[#5B6078] select-none">{placeholder}</span>
        )}
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-48
          bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
          {filtered.map(o => (
            <button key={o.name} type="button" onMouseDown={() => add(o)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]  cursor-pointer border-b border-[#F1F3F9] dark:border-[#2A2B2B] last:border-0">
              <div className="w-7 h-7 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                {o.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1D2E] dark:text-white leading-tight">{o.name}</p>
                <p className="text-xs text-[#8F95A8] dark:text-[#5B6078]">{o.role}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── AddProjectModal ── */
function AddProjectModal({ onClose, onAdd }) {
  const dateRef = useRef(null)
  const timeRef = useRef(null)
  const { open: statusOpen, setOpen: setStatusOpen, ref: statusRef } = useDropdown()
  const { open: mgrOpen, setOpen: setMgrOpen, ref: mgrRef } = useDropdown()

  const [users, setUsers] = useState([])
  useEffect(() => {
    axiosAPI.get('/users/', { params: { page_size: 100 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setUsers(Array.isArray(list) ? list : [])
      })
      .catch(() => {})
  }, [])

  const [form, setForm] = useState({
    title: '', prefix: '', status: '', description: '', manager: null,
    manager_bonus: '', employees: [], testers: [],
    deadline: '', time: '', is_active: true,
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(null)

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const fmtBonus = (raw) => {
    const d = raw.replace(/\D/g, '')
    return d.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim())       e.title       = true
    if (!form.prefix.trim())      e.prefix      = true
    if (!form.status)             e.status      = true
    if (!form.description.trim()) e.description = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const body = {
        title:       form.title.trim(),
        prefix:      form.prefix.trim().toUpperCase(),
        status:      form.status,
        description: form.description.trim(),
        is_active:   form.is_active,
      }
      if (form.manager)          body.manager       = form.manager.id
      if (form.manager_bonus)    body.manager_bonus = form.manager_bonus.replace(/\s/g, '')
      if (form.employees.length) body.employees     = form.employees.map(u => u.id)
      if (form.testers.length)   body.testers       = form.testers.map(u => u.id)
      if (form.deadline) {
        const dt = form.time ? `${form.deadline}T${form.time}:00` : `${form.deadline}T00:00:00`
        body.deadline = dt
      }
      const res = await axiosAPI.post('/projects/', body)
      const created = res.data?.data ?? res.data
      onAdd(created)
      toast.success('Loyiha yaratildi.', "Yangi loyiha muvaffaqiyatli qo'shildi.")
      onClose()
    } catch (err) {
      const details = err?.response?.data?.error?.details
      const errorMsg = err?.response?.data?.error?.errorMsg || 'Loyiha yaratishda xatolik yuz berdi'

      if (details && typeof details === 'object') {
        // Input fieldlarni qizil qilish va xato matnini saqlash
        const newErrors = {}
        if (details.title)       newErrors.title       = Array.isArray(details.title) ? details.title[0] : true
        if (details.prefix)      newErrors.prefix      = Array.isArray(details.prefix) ? details.prefix[0] : true
        if (details.status)      newErrors.status      = Array.isArray(details.status) ? details.status[0] : true
        if (details.description) newErrors.description = Array.isArray(details.description) ? details.description[0] : true
        if (Object.keys(newErrors).length) setErrors(newErrors)

        // Har bir xato uchun toast chiqarish
        const msgs = Object.entries(details)
          .map(([, v]) => Array.isArray(v) ? v[0] : v)
          .filter(Boolean)
          .join('\n')
        toast.error('Xatolik', msgs || errorMsg)
      } else {
        toast.error('Xatolik', errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (err) =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border 
    bg-white text-[#1A1D2E] placeholder-[#8F95A8]
    dark:bg-[#191A1A] dark:text-white dark:placeholder-[#5B6078]
    ${err ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]'}`

  const STATUS_API = [
    { label: 'Rejalashtirilmoqda', value: 'planning' },
    { label: 'Faol',               value: 'active' },
    { label: 'Yakunlangan',        value: 'completed' },
    { label: 'Bekor qilingan',     value: 'cancelled' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer  z-[200]">
          <FaXmark size={14} />
        </button>
        <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
          <div className="px-7 pt-7 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
                <FaArrowLeft size={17} />
              </button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Loyiha qo'shish</h2>
            </div>
            <p className="text-sm text-[#5B6078]">Loyiha nomi va asosiy ma'lumotlarni to'ldiring</p>
          </div>

          <div className="px-7 pb-4 flex flex-col gap-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={labelCls}>Nomi</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Nomi kiriting" className={inputCls(errors.title)} />
                {errors.title && <p className="text-xs text-red-500 mt-1">{typeof errors.title === 'string' ? errors.title : '*Bu maydon majburiy'}</p>}
              </div>
              <div>
                <label className={labelCls}>Prefiks</label>
                <input value={form.prefix} onChange={e => set('prefix', e.target.value.toUpperCase().slice(0, 5))}
                  placeholder="PRJ" className={inputCls(errors.prefix)} />
                {errors.prefix && (
                  <p className="text-xs text-red-500 mt-1">
                    {typeof errors.prefix === 'string' ? errors.prefix : '*Bu maydon majburiy'}
                  </p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div ref={statusRef}>
                <label className={labelCls}>Holati</label>
                <div className="relative">
                  <button type="button" onClick={() => setStatusOpen(o => !o)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer bg-white dark:bg-[#191A1A] ${errors.status ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'} ${form.status ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
                    <span>{STATUS_API.find(s => s.value === form.status)?.label || 'Holati tanlang'}</span>
                    <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {errors.status && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
                  {statusOpen && (
                    <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
                      {STATUS_API.map((s, i) => (
                        <button key={s.value} type="button" onClick={() => { set('status', s.value); setStatusOpen(false) }}
                          className={`w-full text-left px-4 py-2.5 text-sm  cursor-pointer ${i < STATUS_API.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${form.status === s.value ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Tavsifi</label>
              <div className="relative">
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Tavsifni yozing" rows={3}
                  className={inputCls(errors.description) + ' resize-none'} />
                {form.description && (
                  <button type="button" onClick={() => set('description', '')}
                    className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                    <FaXmark size={12} />
                  </button>
                )}
              </div>
              {errors.description && <p className="text-xs text-red-500 mt-1">{typeof errors.description === 'string' ? errors.description : '*Bu maydon majburiy'}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div ref={mgrRef}>
                <label className={labelCls}>Menejer</label>
                <div className="relative">
                  <button type="button" onClick={() => setMgrOpen(o => !o)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]">
                    <span className={form.manager ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}>
                      {form.manager?.username || 'Menejer tanlang'}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {form.manager && (
                        <span onMouseDown={e => { e.stopPropagation(); set('manager', null) }}
                          className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                      )}
                      <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${mgrOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  {mgrOpen && (
                    <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-48 bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
                      {users.filter(u => u.roles?.includes('manager')).map((u, i, arr) => (
                        <button key={u.id} type="button" onClick={() => { set('manager', u); setMgrOpen(false) }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer ${i < arr.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${form.manager?.id === u.id ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                          <div className="w-6 h-6 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-[10px] font-bold text-[#526ED3] shrink-0">
                            {u.username?.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate">{u.username}</p>
                            {u.position && <p className="text-xs text-[#8F95A8] truncate">{u.position}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>Menejer bonusi (UZS)</label>
                <input value={form.manager_bonus} onChange={e => set('manager_bonus', fmtBonus(e.target.value))}
                  placeholder="Loyiha uchun: 0,0"
                  className={inputCls(false) + ' text-right'} />
              </div>
            </div>

            <SelectedUsersField
              label="Xodimlar"
              selected={form.employees}
              onOpen={() => setPickerOpen('employees')}
              onRemove={id => set('employees', form.employees.filter(u => u.id !== id))}
            />

            <SelectedUsersField
              label="Sinovchilar"
              selected={form.testers}
              onOpen={() => setPickerOpen('testers')}
              onRemove={id => set('testers', form.testers.filter(u => u.id !== id))}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Muddat sanasi</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] ">
                  <input ref={dateRef} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                    className={`flex-1 min-w-0 text-sm outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${!form.deadline ? '[&::-webkit-datetime-edit]:opacity-0' : 'text-[#1A1D2E] dark:text-white'}`} />
                  <button type="button" onClick={() => dateRef.current?.showPicker?.()}
                    className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] ">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Soati</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] ">
                  <input ref={timeRef} type="time" value={form.time || '00:00'} onChange={e => set('time', e.target.value === '00:00' ? '' : e.target.value)}
                    step="60"
                    className={`flex-1 min-w-0 text-sm outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${!form.time ? 'text-[#B6BCCB] dark:text-[#474848]' : 'text-[#1A1D2E] dark:text-white'}`} />
                  <button type="button" onClick={() => timeRef.current?.showPicker?.()}
                    className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] ">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="px-7 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#1A1D2E] dark:text-white">Faolmi?</span>
              <button type="button" onClick={() => set('is_active', !form.is_active)}
                className={`relative w-10 h-5 rounded-full  cursor-pointer ${form.is_active ? 'bg-[#3F57B3]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
                <span className={`absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
                <FaXmark size={13} /> Yopish
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3] disabled:opacity-60">
                {loading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      </div>

      {pickerOpen === 'employees' && (
        <UserPickerModal title="Xodim tanlang"
          selected={form.employees}
          users={users.filter(u => u.roles?.includes('employee'))}
          onClose={() => setPickerOpen(null)}
          onConfirm={list => { set('employees', list); setPickerOpen(null) }} />
      )}
      {pickerOpen === 'testers' && (
        <UserPickerModal title="Sinovchi tanlang"
          selected={form.testers}
          users={users.filter(u => u.roles?.includes('manager') || u.roles?.includes('employee'))}
          onClose={() => setPickerOpen(null)}
          onConfirm={list => { set('testers', list); setPickerOpen(null) }} />
      )}
    </>
  )
}

/* ── DeleteConfirmModal ── */
function DeleteConfirmModal({ project, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer  z-10">
          <FaXmark size={14} />
        </button>
      <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
      
        <div className="px-7 pt-7 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Loyihani o'chirish</h2>
          </div>
          <p className="text-sm text-[#5B6078] dark:text-[#8F95A8] ">
            Haqiqatan ham ushbu loyihani o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi
          </p>
        </div>
        <div className="px-7 py-5 flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Bekor qilish
          </button>
          <button onClick={() => { onConfirm(project.id); onClose() }}
            className="px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[#E02D2D] text-white hover:bg-red-600">
            O'chirish
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── DetailModal ── */
function DetailModal({ project, onClose }) {
  const fCls = 'w-full px-3 py-2.5 rounded-xl text-sm border bg-white border-[#E2E6F2] text-[#1A1D2E] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white'
  const tagCls = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]'

  const fmtDeadline = (iso) => {
    if (!iso) return '—'
    try { return new Date(iso).toLocaleDateString('ru-RU') } catch { return iso }
  }

  const managerName = project.manager_info?.username || project.manager_info?.name || '—'
  const statusLabel = STATUS_LABEL[project.status] || project.status || '—'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">

        {/* X tugmasi */}
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer z-10">
          <FaXmark size={14} />
        </button>

        {/* Header */}
        <div className="px-7 pt-7 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Batafsil ma'lumot</h2>
          </div>
          <p className="text-sm text-[#5B6078] dark:text-[#C2C8E0]">Loyiha haqida batafsil ma'lumotlar</p>
        </div>

        {/* Body */}
        <div className="px-7 pb-4 flex flex-col gap-4">

          {/* Nomi + Holati */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nomi</label>
              <div className={fCls}>{project.title || project.name || '—'}</div>
            </div>
            <div>
              <label className={labelCls}>Holati</label>
              <div className={fCls}>{statusLabel}</div>
            </div>
          </div>

          {/* Tavsifi */}
          <div>
            <label className={labelCls}>Tavsifi</label>
            <div className={fCls + ' min-h-[80px] whitespace-pre-wrap leading-relaxed'}>
              {project.description || '—'}
            </div>
          </div>

          {/* Menejer + Menejer bonusi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Menejer</label>
              <div className={fCls}>{managerName}</div>
            </div>
            <div>
              <label className={labelCls}>Menejer bonusi (UZS)</label>
              <div className={fCls + ' text-right'}>{project.manager_bonus || '—'}</div>
            </div>
          </div>

          {/* Xodimlar */}
          <div>
            <label className={labelCls}>Xodimlar</label>
            <div className={fCls + ' flex flex-wrap gap-1.5 min-h-[46px] py-2'}>
              {project.employees_info?.length > 0
                ? project.employees_info.map(e => (
                    <span key={e.id} className={tagCls}>{e.username}</span>
                  ))
                : project.employees?.length > 0
                  ? project.employees.map((e, i) => (
                      <span key={i} className={tagCls}>{e.username || e.name || e}</span>
                    ))
                  : <span className="text-[#8F95A8] dark:text-[#5B6078] text-sm self-center">—</span>
              }
            </div>
          </div>

          {/* Sinovchilar */}
          <div>
            <label className={labelCls}>Sinovchilar</label>
            <div className={fCls + ' flex flex-wrap gap-1.5 min-h-[46px] py-2'}>
              {project.testers_info?.length > 0
                ? project.testers_info.map(e => (
                    <span key={e.id} className={tagCls}>{e.username}</span>
                  ))
                : project.testers?.length > 0
                  ? project.testers.map((e, i) => (
                      <span key={i} className={tagCls}>{e.username || e.name || e}</span>
                    ))
                  : <span className="text-[#8F95A8] dark:text-[#5B6078] text-sm self-center">—</span>
              }
            </div>
          </div>

          {/* Muddati */}
          <div>
            <label className={labelCls}>Muddati</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A]">
              <span className="flex-1 text-sm text-[#1A1D2E] dark:text-white">{fmtDeadline(project.deadline)}</span>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8F95A8] shrink-0">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-7 py-5 flex items-center justify-between border-t border-[#F1F3F9] dark:border-[#292A2A]">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#1A1D2E] dark:text-white">Faolmi?</span>
            <div className={`relative w-10 h-5 rounded-full pointer-events-none ${project.is_active !== false ? 'bg-[#000000]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow ${project.is_active !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Yopish
          </button>
        </div>

      </div>
    </div>
  )
}
/* ── EditProjectModal ── */
function EditProjectModal({ project, onClose, onSave }) {
  const dateRef = useRef(null)
  const timeRef = useRef(null)
  const { open: statusOpen, setOpen: setStatusOpen, ref: statusRef } = useDropdown()
  const { open: mgrOpen, setOpen: setMgrOpen, ref: mgrRef } = useDropdown()

  const fmtBonus = (raw) => raw.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  const [form, setForm] = useState({
    title:       project.title       || project.name  || '',
    prefix:      project.prefix      || '',
    status:      project.status      || '',
    description: project.description || '',
    manager:     project.manager_info?.username || project.manager || '',
    bonus:       project.manager_bonus || '',
    employees:   project.employees   || [],
    testers:     project.testers     || [],
    deadline:    project.deadline ? project.deadline.slice(0, 10) : '',
    time:        project.deadline ? project.deadline.slice(11, 16) : '',
    active:      project.is_active !== undefined ? project.is_active : true,
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = true
    if (!form.status) e.status = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputCls = (err) =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border 
    bg-white text-[#1A1D2E] placeholder-[#8F95A8]
    dark:bg-[#191A1A] dark:text-white dark:placeholder-[#5B6078]
    ${err ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer  z-10">
          <FaXmark size={14} />
        </button>
      <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
      

        <div className="px-7 pt-7 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Loyiha tahrirlash</h2>
          </div>
          <p className="text-sm text-[#1A1D2E] ">Loyiha ma'lumotlarini yangilash uchun o'zgartirishlar kiriting</p>
        </div>

        <div className="px-7 pb-4 flex flex-col gap-4">
          {/* Nomi + Holati */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nomi</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Nomi kiriting" className={inputCls(errors.name)} />
            </div>
            <div ref={statusRef}>
              <label className={labelCls}>Holati</label>
              <div className="relative">
                <button type="button" onClick={() => setStatusOpen(o => !o)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer
                    bg-white dark:bg-[#191A1A]
                    ${errors.status ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
                    ${form.status ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
                  <span>{form.status || 'Holati tanlang'}</span>
                  <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
                </button>
                {statusOpen && (
                  <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden
                    bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
                    {STATUSES.map((s, i) => (
                      <button key={s} type="button" onClick={() => { set('status', s); setStatusOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm  cursor-pointer
                          ${i < STATUSES.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                          ${form.status === s ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tavsifi */}
          <div>
            <label className={labelCls}>Tavsifi</label>
            <div className="relative">
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Tavsifni yozing" rows={3}
                className={inputCls(false) + ' resize-none'} />
              {form.description && (
                <button type="button" onClick={() => set('description', '')}
                  className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                  <FaXmark size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Menejer + Bonus */}
          <div className="grid grid-cols-2 gap-4">
            <div ref={mgrRef}>
              <label className={labelCls}>Menejer</label>
              <div className="relative">
                <button type="button" onClick={() => setMgrOpen(o => !o)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer
                    bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]">
                  <span className={form.manager ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}>
                    {form.manager || 'Menejer tanlang'}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {form.manager && (
                      <span onMouseDown={e => { e.stopPropagation(); set('manager', '') }}
                        className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                    )}
                    <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${mgrOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {mgrOpen && (
                  <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-44
                    bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
                    {MANAGERS.map((m, i) => (
                      <button key={m} type="button" onClick={() => { set('manager', m); setMgrOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm  cursor-pointer
                          ${i < MANAGERS.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                          ${form.manager === m ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className={labelCls}>Menejer bonusi (UZS)</label>
              <input value={form.bonus} onChange={e => set('bonus', fmtBonus(e.target.value))}
                placeholder="Loyiha uchun: 0,0"
                className={inputCls(false) + ' text-right'} />
            </div>
          </div>

          {/* Xodimlar */}
          <div>
            <label className={labelCls}>Xodimlar</label>
            <MultiSelect placeholder="Xodim tanlang" options={EMPLOYEES} selected={form.employees} onChange={v => set('employees', v)} />
          </div>

          {/* Sinovchilar */}
          <div>
            <label className={labelCls}>Sinovchilar</label>
            <MultiSelect placeholder="Sinovchilar tanlang" options={EMPLOYEES} selected={form.testers} onChange={v => set('testers', v)} />
          </div>

          {/* Muddati + Vaqti */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Muddati</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A]
                bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] ">
                <input ref={dateRef} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                  className={`flex-1 min-w-0 text-sm outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden
                    ${!form.deadline ? '[&::-webkit-datetime-edit]:opacity-0' : 'text-[#1A1D2E] dark:text-white'}`} />
                <button type="button" onClick={() => dateRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] ">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Vaqti</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A]
                bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] ">
                <input ref={timeRef} type="time" value={form.time || '00:00'} onChange={e => set('time', e.target.value === '00:00' ? '' : e.target.value)}
                  step="60"
                  className={`flex-1 min-w-0 text-sm outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden
                    ${!form.time ? 'text-[#B6BCCB] dark:text-[#474848]' : 'text-[#1A1D2E] dark:text-white'}`} />
                <button type="button" onClick={() => timeRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] ">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#1A1D2E] dark:text-white">Faolmi?</span>
            <button type="button" onClick={() => set('active', !form.active)}
              className={`relative w-10 h-5 rounded-full  cursor-pointer ${form.active ? 'bg-[#000000]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
              <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
                text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
              <FaXmark size={13} /> Yopish
            </button>
            <button onClick={() => {
              if (!validate()) return
              const body = {
                title:       form.title.trim(),
                status:      form.status,
                description: form.description.trim(),
                is_active:   form.active,
              }
              if (form.prefix)   body.prefix        = form.prefix.trim().toUpperCase()
              if (form.manager)  body.manager_name  = form.manager
              if (form.bonus)    body.manager_bonus = form.bonus.replace(/\s/g, '')
              if (form.deadline) {
                const dt = form.time ? `${form.deadline}T${form.time}:00` : `${form.deadline}T00:00:00`
                body.deadline = dt
              }
              onSave(project.id, body)
              onClose()
            }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Tahrirlash
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── RowMenu ── */
function RowMenu({ onEdit, onDetail, onDelete, canEdit = false }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors
          text-[#8F95A8] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
        <FaEllipsisVertical size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-2xl shadow-2xl border overflow-hidden
          bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
          {/* Batafsil — hammaga */}
          <button onClick={() => { onDetail?.(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#1A1D2E] dark:text-white
              hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A] border-b border-[#F1F3F9] dark:border-[#2A2B2B] cursor-pointer transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#5B6078] dark:text-[#C2C8E0]">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Batafsil
          </button>
          {/* Tahrirlash + O'chirish — faqat admin */}
          {canEdit && (
            <>
              <button onClick={() => { onEdit?.(); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#1A1D2E] dark:text-white
                  hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A] border-b border-[#F1F3F9] dark:border-[#2A2B2B] cursor-pointer transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#5B6078] dark:text-[#C2C8E0]">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
                Tahrirlash
              </button>
              <button onClick={() => { onDelete?.(); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#E02D2D]
                  hover:bg-[#FFF5F5] dark:hover:bg-[#2A1A1A] cursor-pointer transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
                O'chirish
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main Page ── */
export default function ProjectsPage() {
  const { registerAction, clearAction } = usePageAction()
  const { user } = useAuth()
  const roles = user?.roles ?? []
  const canEdit = roles.includes('admin') || roles.includes('superadmin')
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [detailProject, setDetailProject] = useState(null)
  const [deleteProject, setDeleteProject] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTER)
  const [viewMode, setViewMode] = useState('table')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState([])
  const scrollRef = useRef(null)

  // ── API funksiyalari ──
  const buildParams = useCallback((f = filters, q = search, pg = 1) => {
    const p = { page: pg, page_size: 20 }
    if (q) p.search = q
    if (f.status)    p.status              = f.status
    if (f.manager)   p.manager             = f.manager
    if (f.employee)  p.employee            = f.employee
    if (f.deadFromD) p.deadline__date__gte = f.deadFromD
    if (f.deadToD)   p.deadline__date__lte = f.deadToD
    if (f.startFromD) p.created_at__date__gte = f.startFromD
    if (f.startToD)   p.created_at__date__lte = f.startToD
    return p
  }, [filters, search])

  const loadProjects = useCallback(async (f = filters, q = search, pg = 1) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await axiosAPI.get('/projects/', { params: buildParams(f, q, pg) })
      const payload = res.data?.data ?? res.data
      const results = Array.isArray(payload) ? payload : (payload.results ?? [])
      const next = Array.isArray(payload) ? null : (payload.next ?? null)
      setData(prev => pg === 1 ? results : [...prev, ...results])
      setHasMore(!!next)
      setPage(pg)
    } catch (err) {
      toast.error('Xatolik', err?.response?.data?.detail || "Ma'lumotlarni yuklashda xatolik")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildParams])

  // Users yuklash (menejer va xodim tanlash uchun)
  useEffect(() => {
    axiosAPI.get('/users/', { params: { page_size: 100 } })
      .then(res => {
        const payload = res.data?.data ?? res.data
        const list = Array.isArray(payload) ? payload : (payload.results ?? [])
        setUsers(list)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    loadProjects()
  }, [])

  // Scroll pagination
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60 && hasMore && !loadingMore) {
        loadProjects(filters, search, page + 1)
      }
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, page, filters, search])

  useEffect(() => {
    registerAction({
      label: "Loyiha qo'shish",
      icon: <img src="/imgs/addProjectIcon.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowAdd(true),
    })
    return () => clearAction()
  }, [])

  const hasFilter = Object.values(filters).some(v => v)

  const handleSearch = (val) => {
    setSearch(val)
    loadProjects(filters, val, 1)
  }

  const handleApplyFilter = (f) => {
    setFilters(f)
    setShowFilter(false)
    loadProjects(f, search, 1)
  }

  const handleAdd = async (body) => {
    try {
      const res = await axiosAPI.post('/projects/', body)
      const created = res.data?.data ?? res.data
      setData(prev => [created, ...prev])
      toast.success('Loyiha yaratildi.', "Yangi loyiha muvaffaqiyatli qo'shildi.")
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.title?.[0] || "Loyiha yaratishda xatolik"
      toast.error('Xatolik', msg)
    }
  }

  const handleEdit = async (id, body) => {
    try {
      const res = await axiosAPI.put(`/projects/${id}/`, body)
      const updated = res.data?.data ?? res.data
      setData(prev => prev.map(p => p.id === id ? updated : p))
      toast.success("Loyiha yangilandi", "O'zgarishlar saqlandi.")
    } catch (err) {
      toast.error('Xatolik', err?.response?.data?.detail || "Yangilashda xatolik")
    }
  }

  const handleDelete = async (id) => {
    try {
      await axiosAPI.delete(`/projects/${id}/`)
      setData(prev => prev.filter(p => p.id !== id))
      toast.delete("Loyiha o'chirildi", "Loyiha chiqindi qutisiga yuborildi.")
    } catch (err) {
      const msg = err?.response?.data?.error?.errorMsg
        || err?.response?.data?.detail
        || "O'chirishda xatolik yuz berdi"
      toast.error('Xatolik', msg)
    }
  }

  return (
    <div className="flex flex-col h-full gap-4">

      <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-white shrink-0">Loyihalar</h1>

      {/* Toolbar */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#C2C8E0]"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Ism Sharifi bo'yicha izlash" value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none  w-[240px]
              bg-[#F1F3F9] border border-[#E2E6F2] text-[#1A1D2E] placeholder-[#5B6078] focus:border-[#526ED3]
              dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#5B6078]" />
        </div>

        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border  cursor-pointer
            bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078]
            dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
          <LuFilter size={13} />
          Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
        </button>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 p-1 rounded-xl bg-[#F1F3F9] dark:bg-[#222323] border border-[#E2E6F2] dark:border-[#474848]">
          <button onClick={() => setViewMode('table')}
            className={`w-7 h-7 flex items-center justify-center rounded-lg  cursor-pointer
              ${viewMode === 'table' ? 'bg-white dark:bg-[#3A3B3B] shadow-sm text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
            </svg>
          </button>
          <button onClick={() => setViewMode('grid')}
            className={`w-7 h-7 flex items-center justify-center rounded-lg  cursor-pointer
              ${viewMode === 'grid' ? 'bg-white dark:bg-[#3A3B3B] shadow-sm text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
              <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      {viewMode === 'table' && (
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] w-10">№</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Nomi</th>
                <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Menejer</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Holati</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Boshlanish sanasi</th>
                <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Muddati</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#EEF1F7] dark:border-[#292A2A]">
                    {[1,2,3,4,5,6,7].map(j => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded-lg bg-[#EEF1F7] dark:bg-[#292A2A] animate-pulse" style={{ width: j === 1 ? 24 : '80%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                data.map((p, idx) => (
                  <tr key={p.id}
                    onClick={() => setDetailProject(p)}
                    className="border-b border-[#EEF1F7] dark:border-[#292A2A] last:border-0 hover:bg-black/3 dark:hover:bg-white/3  cursor-pointer">
                    <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{p.title || p.name}</td>
                    <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{p.manager_info?.username || p.manager || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-[#1A1D2E] dark:text-white">{STATUS_LABEL[p.status] || p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{fmtDt(p.created_at)}</td>
                    <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{fmtDt(p.deadline)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <RowMenu onEdit={() => setEditProject(p)} onDetail={() => setDetailProject(p)} onDelete={() => setDeleteProject(p)} canEdit={canEdit} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && data.length === 0 && (
            <EmptyState
              icon="/imgs/loyhalarIcon.svg"
              title="Hozircha loyihalar yo'q"
              description="Yangi loyiha qo'shish orqali ishni boshlang"
            />
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
      )}

      {/* Grid */}
      {viewMode === 'grid' && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map(p => {
            const statusMap = {
              'Faol':               { label: 'Faol',               bg: 'bg-[#22c55e]',  text: 'text-white' },
              'active':             { label: 'Faol',               bg: 'bg-[#22c55e]',  text: 'text-white' },
              'Rejalashtirilmoqda': { label: 'Rejalashtirilmoqda', bg: 'bg-[#E2E6F2]',  text: 'text-[#5B6078]' },
              'planning':           { label: 'Rejalashtirilmoqda', bg: 'bg-[#E2E6F2]',  text: 'text-[#5B6078]' },
              'Yakunlangan':        { label: 'Yakunlangan',        bg: 'bg-[#526ED3]',  text: 'text-white' },
              'completed':          { label: 'Yakunlangan',        bg: 'bg-[#526ED3]',  text: 'text-white' },
              'cancelled':          { label: 'Bekor qilingan',     bg: 'bg-[#E02D2D]',  text: 'text-white' },
            }
            const st = statusMap[p.status] || statusMap['Rejalashtirilmoqda']
            const managerName = p.manager_info?.username || p.manager || '—'
            const managerRole = p.manager_info?.position || 'Menejer'
            const managerInitials = managerName.slice(0, 2).toUpperCase()
            const fmtDt = (iso) => {
              if (!iso) return '—'
              if (iso.includes('T')) {
                const d = new Date(iso)
                return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
              }
              return iso
            }
            return (
              <div key={p.id}
                onClick={() => setDetailProject(p)}
                className="rounded-2xl border p-4 cursor-pointer transition-all
                  bg-white border-[#E2E6F2] hover:border-[#C2C8E0] hover:shadow-sm
                  dark:bg-[#1C1D1D] dark:border-[#292A2A] dark:hover:border-[#474848]">

                {/* Title + Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-[14px] font-bold text-[#1A1D2E] dark:text-white leading-snug truncate flex-1">{p.title || p.name}</h3>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.bg} ${st.text}`}>
                    {st.label}
                  </span>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-1.5 text-[11px] text-[#5B6078] dark:text-[#8F95A8] mb-3">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  <span className="truncate">{fmtDt(p.created_at || p.startDate)}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mx-0.5">
                    <path d="m9 18 6-6-6-6"/>
                    <path d="m15 18 6-6-6-6"/>
                  </svg>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                  <span className="truncate">{fmtDt(p.deadline)}</span>
                </div>

                {/* Manager + Menu */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-[10px] font-bold text-[#526ED3] shrink-0">
                      {managerInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-[#1A1D2E] dark:text-white truncate">{managerName}</p>
                      <p className="text-[10px] text-[#8F95A8] dark:text-[#5B6078]">{managerRole}</p>
                    </div>
                  </div>
                  <div onClick={e => e.stopPropagation()}>
                    <RowMenu onEdit={() => setEditProject(p)} onDetail={() => setDetailProject(p)} onDelete={() => setDeleteProject(p)} canEdit={canEdit} />
                  </div>
                </div>
              </div>
            )
          })}
          {!loading && data.length === 0 && (
            <div className="col-span-3">
              <EmptyState
                icon="/imgs/loyhalarIcon.svg"
                title="Hozircha loyihalar yo'q"
                description="Yangi loyiha qo'shish orqali ishni boshlang"
              />
            </div>
          )}
        </div>
        </div>
      )}

      {showFilter && (
        <ProjectFilterModal initial={filters} onClose={() => setShowFilter(false)} onApply={handleApplyFilter} users={users} />
      )}

      {showAdd && (
        <AddProjectModal
          onClose={() => setShowAdd(false)}
          onAdd={handleAdd}
          users={users}
        />
      )}

      {editProject && (
        <EditProjectModal
          project={editProject}
          onClose={() => setEditProject(null)}
          onSave={(id, body) => handleEdit(id, body)}
          users={users}
        />
      )}

      {detailProject && (
        <DetailModal
          project={detailProject}
          onClose={() => setDetailProject(null)}
        />
      )}

      {deleteProject && (
        <DeleteConfirmModal
          project={deleteProject}
          onClose={() => setDeleteProject(null)}
          onConfirm={id => handleDelete(id)}
        />
      )}
    </div>
  )
}
