import { useState, useEffect, useRef } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown, FaEllipsisVertical } from 'react-icons/fa6'
import { LuFilter } from 'react-icons/lu'
import { usePageAction } from '../../context/PageActionContext'

const PROJECTS_DATA = [
  { id: 1, name: 'CRM sistema',  manager: "Dudan Turg'unov",  status: 'Rejalashtirilmoqda', startDate: '01.01.2024 20:00', deadline: '01.01.2024 20:00' },
  { id: 2, name: 'Dashboard',    manager: "To'raqul Fozilov", status: 'Yakunlangan',         startDate: '01.01.2024 20:00', deadline: '01.01.2024 20:00' },
  { id: 3, name: 'SaaS loyiha',  manager: 'Davron Turdiyev',  status: 'Faol',                startDate: '01.01.2024 20:00', deadline: '01.01.2024 20:00' },
  { id: 4, name: 'Mobile App',   manager: 'Jasur Karimov',    status: 'Faol',                startDate: '15.02.2024 09:00', deadline: '15.08.2024 18:00' },
  { id: 5, name: 'ERP tizimi',   manager: 'Nilufar Yusupova', status: 'Rejalashtirilmoqda',  startDate: '01.03.2024 10:00', deadline: '01.09.2024 18:00' },
  { id: 6, name: 'HR platforma', manager: 'Bobur Rahimov',    status: 'Yakunlangan',         startDate: '10.01.2024 08:00', deadline: '10.06.2024 18:00' },
]

const STATUSES    = ['Faol', 'Rejalashtirilmoqda', 'Yakunlangan']
const EMPTY_FILTER = { manager: '', status: '', employee: '', startFromD: '', startFromT: '', startToD: '', startToT: '', deadFromD: '', deadFromT: '', deadToD: '', deadToT: '' }
const labelCls     = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'

const MANAGERS = [
  'Mira Patel', 'Liam Johnson', 'Sofia Martinez', 'Aisha Khatun', 'Rajiv Menon',
  "Dudan Turg'unov", "To'raqul Fozilov", 'Davron Turdiyev',
]

const EMPLOYEES = [
  { name: 'Nodira Xodjayeva',   role: 'Frontend dasturchi' },
  { name: 'Olimjon Isayev',     role: 'UI/UX dizayner' },
  { name: 'Malika Tashkentova', role: 'Mahsulot menejeri' },
  { name: 'Lazizbek Rahimov',   role: 'Mobil dasturchi' },
  { name: 'Марк Леонидов',      role: 'Dizayner' },
  { name: 'Марина Иванова',     role: 'Dasturchi' },
  { name: 'Jasur Karimov',      role: 'PM' },
  { name: 'Nilufar Yusupova',   role: 'Dasturchi' },
]

const statusStyle = {
  'Faol':               { dot: 'bg-green-500',  text: 'text-green-600 dark:text-green-400' },
  'Rejalashtirilmoqda': { dot: 'bg-[#8F95A8]',  text: 'text-[#5B6078] dark:text-[#C2C8E0]' },
  'Yakunlangan':        { dot: 'bg-[#526ED3]',  text: 'text-[#526ED3] dark:text-[#7F95E6]' },
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

/* ── StatusDropdown ── */
function StatusDropdown({ value, onChange }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm border transition-colors cursor-pointer
          bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]
          ${value ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
        <span className="flex-1 text-left truncate">{value || 'Holatni tanlang'}</span>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {value
            ? <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={12} /></span>
            : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
          }
        </div>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden
          bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
          {STATUSES.map((s, i) => (
            <button key={s} type="button" onClick={() => { onChange(s); setOpen(false) }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer
                ${i < STATUSES.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                ${value === s
                  ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]'
                  : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── DateBox ── */
function DateBox({ value, onChange }) {
  const ref = useRef(null)
  return (
    <div className="flex items-center gap-2 px-3 py-3 rounded-2xl border border-[#E2E6F2] dark:border-[#2A2B2B]
      bg-white dark:bg-[#1C1D1D] focus-within:border-[#526ED3] transition-colors">
      <input ref={ref} type="date" value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 min-w-0 text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" />
      <button type="button" onClick={() => ref.current?.showPicker?.()}
        className="shrink-0 cursor-pointer text-[#8F95A8] dark:text-[#5B6078] hover:text-[#526ED3] transition-colors">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      </button>
    </div>
  )
}

/* ── SimpleSelect (filter uchun) ── */
function SimpleSelect({ value, onChange, options, placeholder }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
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
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
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

/* ── FilterDateTimeBox ── */
function FilterDateTimeBox({ type, value, onChange, placeholder }) {
  const ref = useRef(null)
  const icon = type === 'date'
    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A]
      bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
      {placeholder && <span className="text-xs text-[#8F95A8] shrink-0 select-none">{placeholder}:</span>}
      <input ref={ref} type={type} value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 min-w-0 text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" />
      <button type="button" onClick={() => ref.current?.showPicker?.()}
        className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">{icon}</button>
    </div>
  )
}

/* ── FilterModal ── */
function ProjectFilterModal({ onClose, onApply, initial }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const employeeNames = EMPLOYEES.map(e => e.name)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[620px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">

        {/* Header */}
        <div className="px-7 pt-7 pb-3">
          <div className="flex items-center gap-3 mb-1.5">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Filtrlash</h2>
          </div>
          <p className="text-sm text-[#5B6078] ">Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi</p>
        </div>

        {/* Body */}
        <div className="px-7 pb-5 pt-2 flex flex-col gap-4">
          {/* Menejer + Holati */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Menejer</label>
              <SimpleSelect value={f.manager} onChange={v => set('manager', v)} options={MANAGERS} placeholder="Menejer tanlang" />
            </div>
            <div>
              <label className={labelCls}>Holati</label>
              <SimpleSelect value={f.status} onChange={v => set('status', v)} options={STATUSES} placeholder="Holatini tanlang" />
            </div>
          </div>

          {/* Xodim */}
          <div>
            <label className={labelCls}>Xodim</label>
            <SimpleSelect value={f.employee} onChange={v => set('employee', v)} options={employeeNames} placeholder="Xodim tanlang" />
          </div>

          {/* Boshlanish sanasi oralig'i */}
          <div>
            <label className={labelCls}>Boshlanish sanasi oralig'i</label>
            <div className="grid grid-cols-4 gap-2">
              <FilterDateTimeBox type="date" value={f.startFromD} onChange={v => set('startFromD', v)} placeholder="dan" />
              <FilterDateTimeBox type="time" value={f.startFromT} onChange={v => set('startFromT', v)} />
              <FilterDateTimeBox type="date" value={f.startToD}   onChange={v => set('startToD', v)}   placeholder="gacha" />
              <FilterDateTimeBox type="time" value={f.startToT}   onChange={v => set('startToT', v)} />
            </div>
          </div>

          {/* Muddat oralig'i */}
          <div>
            <label className={labelCls}>Muddat oralig'i</label>
            <div className="grid grid-cols-4 gap-2">
              <FilterDateTimeBox type="date" value={f.deadFromD} onChange={v => set('deadFromD', v)} placeholder="dan" />
              <FilterDateTimeBox type="time" value={f.deadFromT} onChange={v => set('deadFromT', v)} />
              <FilterDateTimeBox type="date" value={f.deadToD}   onChange={v => set('deadToD', v)}   placeholder="gacha" />
              <FilterDateTimeBox type="time" value={f.deadToT}   onChange={v => set('deadToT', v)} />
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Qidirish
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── MultiSelect ── */
function MultiSelect({ placeholder, options, selected, onChange }) {
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)
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
  const add    = (item) => { onChange([...selected, item]); setQuery(''); }

  const iCls = 'w-full px-3 py-2 text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white placeholder-[#8F95A8] dark:placeholder-[#5B6078]'

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(true)}
        className={`min-h-[42px] w-full flex flex-wrap gap-1.5 px-3 py-2 rounded-xl border transition-colors cursor-text
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
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A] transition-colors cursor-pointer border-b border-[#F1F3F9] dark:border-[#2A2B2B] last:border-0">
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
  const { open: mgrOpen,    setOpen: setMgrOpen,    ref: mgrRef    } = useDropdown()

  const [form, setForm] = useState({
    name: '', status: '', description: '', manager: '',
    bonus: '', employees: [], testers: [],
    deadline: '', time: '', active: true,
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const fmtBonus = (raw) => {
    const d = raw.replace(/\D/g, '')
    return d.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())   e.name   = true
    if (!form.status)        e.status = true
    if (!form.description.trim()) e.description = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    onAdd({ ...form, id: Date.now(), startDate: new Date().toLocaleDateString('ru-RU') })
    onClose()
  }

  const inputCls = (err) =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors
    bg-white text-[#1A1D2E] placeholder-[#8F95A8]
    dark:bg-[#191A1A] dark:text-white dark:placeholder-[#5B6078]
    ${err ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">

        {/* Header */}
        <div className="px-7 pt-7 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Loyiha qo'shish</h2>
          </div>
          <p className="text-sm text-[#5B6078] ">Loyiha nomi va asosiy ma'lumotlarni to'ldiring.</p>
        </div>

        {/* Body */}
        <div className="px-7 pb-4 flex flex-col gap-4">

          {/* Nomi + Holati */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nomi</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Nomi kiriting"
                className={inputCls(errors.name)} />
            </div>
            <div ref={statusRef}>
              <label className={labelCls}>Holati</label>
              <div className="relative">
                <button type="button" onClick={() => setStatusOpen(o => !o)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
                    bg-white dark:bg-[#191A1A]
                    ${errors.status ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
                    ${form.status ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
                  <span>{form.status || 'Holati tanlang'}</span>
                  <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
                </button>
                {errors.status && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
                {statusOpen && (
                  <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden
                    bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
                    {STATUSES.map((s, i) => (
                      <button key={s} type="button" onClick={() => { set('status', s); setStatusOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
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
                className={inputCls(errors.description) + ' resize-none'} />
              {form.description && (
                <button type="button" onClick={() => set('description', '')}
                  className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                  <FaXmark size={12} />
                </button>
              )}
            </div>
            {errors.description && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
          </div>

          {/* Menejer + Bonus */}
          <div className="grid grid-cols-2 gap-4">
            <div ref={mgrRef}>
              <label className={labelCls}>Menejer</label>
              <div className="relative">
                <button type="button" onClick={() => setMgrOpen(o => !o)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
                    bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
                    text-[#1A1D2E] dark:text-white">
                  <span className={form.manager ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}>
                    {form.manager || 'Menejer tanlang'}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {form.manager && (
                      <span onMouseDown={e => { e.stopPropagation(); set('manager', '') }}
                        className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                        <FaXmark size={11} />
                      </span>
                    )}
                    <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${mgrOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {mgrOpen && (
                  <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-44
                    bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
                    {MANAGERS.map((m, i) => (
                      <button key={m} type="button" onClick={() => { set('manager', m); setMgrOpen(false) }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
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
            <MultiSelect
              placeholder="Xodim tanlang"
              options={EMPLOYEES}
              selected={form.employees}
              onChange={v => set('employees', v)}
            />
          </div>

          {/* Sinovchilar */}
          <div>
            <label className={labelCls}>Sinovchilar</label>
            <MultiSelect
              placeholder="Sinovchilar tanlang"
              options={EMPLOYEES}
              selected={form.testers}
              onChange={v => set('testers', v)}
            />
          </div>

          {/* Muddati + Vaqti */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Muddati</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A]
                bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                <input ref={dateRef} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                  className="flex-1 min-w-0 text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" />
                <button type="button" onClick={() => dateRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Vaqti</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A]
                bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                <input ref={timeRef} type="time" value={form.time} onChange={e => set('time', e.target.value)}
                  className="flex-1 min-w-0 text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" />
                <button type="button" onClick={() => timeRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
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
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.active ? 'bg-[#000000]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
              <span className={`absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
                text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
              <FaXmark size={13} /> Yopish
            </button>
            <button onClick={handleSubmit}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Qo'shish
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ── DeleteConfirmModal ── */
function DeleteConfirmModal({ project, onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[480px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Bekor qilish
          </button>
          <button onClick={() => { onConfirm(project.id); onClose() }}
            className="px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#E02D2D] text-white hover:bg-red-600">
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">

        {/* Header */}
        <div className="px-7 pt-7 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Batafsil ma'lumot</h2>
          </div>
          <p className="text-sm text-[#1A1D2E] ">Loyiha haqida batafsil ma'lumotlar</p>
        </div>

        {/* Body */}
        <div className="px-7 pb-4 flex flex-col gap-4">

          {/* Nomi + Holati */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Nomi</label>
              <div className={fCls}>{project.name || '—'}</div>
            </div>
            <div>
              <label className={labelCls}>Holati</label>
              <div className={fCls + ' flex items-center justify-between'}>
                <span>{project.status || '—'}</span>
                <FaChevronDown size={11} className="text-[#8F95A8] shrink-0" />
              </div>
            </div>
          </div>

          {/* Tavsifi */}
          <div>
            <label className={labelCls}>Tavsifi</label>
            <div className="relative">
              <div className={fCls + ' min-h-[80px] pr-8 whitespace-pre-wrap leading-relaxed'}>
                {project.description || '—'}
              </div>
              {project.description && (
                <span className="absolute top-2.5 right-2.5 text-[#B6BCCB]"><FaXmark size={12} /></span>
              )}
            </div>
          </div>

          {/* Menejer + Menejer bonusi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Menejer</label>
              <div className={fCls + ' flex items-center justify-between'}>
                <span>{project.manager || '—'}</span>
                <FaChevronDown size={11} className="text-[#8F95A8] shrink-0" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Menejer bonusi</label>
              <div className={fCls + ' text-right'}>{project.bonus || '0,0'}</div>
            </div>
          </div>

          {/* Xodimlar */}
          <div>
            <label className={labelCls}>Xodimlar</label>
            <div className={fCls + ' flex flex-wrap gap-1.5 min-h-[46px] py-2'}>
              {project.employees?.length > 0
                ? project.employees.map(e => (
                    <span key={e.name} className={tagCls}>{e.name} | {e.role}</span>
                  ))
                : <span className="text-[#8F95A8] dark:text-[#5B6078] text-sm self-center">—</span>
              }
            </div>
          </div>

          {/* Sinovchilar */}
          <div>
            <label className={labelCls}>Sinovchilar</label>
            <div className={fCls + ' flex flex-wrap gap-1.5 min-h-[46px] py-2'}>
              {project.testers?.length > 0
                ? project.testers.map(e => (
                    <span key={e.name} className={tagCls}>{e.name} | {e.role}</span>
                  ))
                : <span className="text-[#8F95A8] dark:text-[#5B6078] text-sm self-center">—</span>
              }
            </div>
          </div>

          {/* Muddati + Vaqti */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Muddati</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A]">
                <span className="flex-1 text-sm text-[#1A1D2E] dark:text-white">{project.deadline || '—'}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8F95A8] shrink-0">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </div>
            </div>
            <div>
              <label className={labelCls}>Vaqti</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A]">
                <span className="flex-1 text-sm text-[#1A1D2E] dark:text-white">{project.time || '—'}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8F95A8] shrink-0">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-7 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#1A1D2E] dark:text-white">Faolmi?</span>
            <div className={`relative w-10 h-5 rounded-full pointer-events-none ${project.active !== false ? 'bg-[#000000]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow ${project.active !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </div>
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
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
  const { open: mgrOpen,    setOpen: setMgrOpen,    ref: mgrRef    } = useDropdown()

  const fmtBonus = (raw) => raw.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  const [form, setForm] = useState({
    name:        project.name        || '',
    status:      project.status      || '',
    description: project.description || '',
    manager:     project.manager     || '',
    bonus:       project.bonus       || '',
    employees:   project.employees   || [],
    testers:     project.testers     || [],
    deadline:    project.deadline    || '',
    time:        project.time        || '',
    active:      project.active !== undefined ? project.active : true,
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = true
    if (!form.status)      e.status = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputCls = (err) =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors
    bg-white text-[#1A1D2E] placeholder-[#8F95A8]
    dark:bg-[#191A1A] dark:text-white dark:placeholder-[#5B6078]
    ${err ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
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
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
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
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
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
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
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
                bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                <input ref={dateRef} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                  className="flex-1 min-w-0 text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" />
                <button type="button" onClick={() => dateRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Vaqti</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A]
                bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                <input ref={timeRef} type="time" value={form.time} onChange={e => set('time', e.target.value)}
                  className="flex-1 min-w-0 text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" />
                <button type="button" onClick={() => timeRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
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
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.active ? 'bg-[#000000]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
              <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
                text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
              <FaXmark size={13} /> Yopish
            </button>
            <button onClick={() => { if (validate()) { onSave({ ...project, ...form }); onClose() } }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
function RowMenu({ onEdit, onDetail, onDelete }) {
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
          {/* Tahrirlash */}
          <button onClick={() => { onEdit?.(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#1A1D2E] dark:text-white
              hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A] border-b border-[#F1F3F9] dark:border-[#2A2B2B] cursor-pointer transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#5B6078] dark:text-[#C2C8E0]">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
            </svg>
            Tahrirlash
          </button>
          {/* Batafsil */}
          <button onClick={() => { onDetail?.(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#1A1D2E] dark:text-white
              hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A] border-b border-[#F1F3F9] dark:border-[#2A2B2B] cursor-pointer transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#5B6078] dark:text-[#C2C8E0]">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Batafsil
          </button>
          {/* O'chirish */}
          <button onClick={() => { onDelete?.(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#E02D2D]
              hover:bg-[#FFF5F5] dark:hover:bg-[#2A1A1A] cursor-pointer transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
            O'chirish
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Main Page ── */
export default function ProjectsPage() {
  const { registerAction, clearAction } = usePageAction()
  const [search, setSearch]         = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [showAdd, setShowAdd]           = useState(false)
  const [editProject, setEditProject]   = useState(null)
  const [detailProject, setDetailProject] = useState(null)
  const [deleteProject, setDeleteProject] = useState(null)
  const [toast, setToast]               = useState(null)

  const showToast = (title, msg) => {
    setToast({ title, msg })
    setTimeout(() => setToast(null), 3000)
  }
  const [filters, setFilters]       = useState(EMPTY_FILTER)
  const [viewMode, setViewMode]     = useState('table')
  const [data, setData]             = useState(PROJECTS_DATA)

  useEffect(() => {
    registerAction({
      label: "Loyiha qo'shish",
      icon: <img src="/imgs/addProjectIcon.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowAdd(true),
    })
    return () => clearAction()
  }, [])

  const hasFilter = Object.values(filters).some(v => v)

  const filtered = data.filter(p => {
    const q = search.toLowerCase()
    if (q && !p.name.toLowerCase().includes(q) && !p.manager.toLowerCase().includes(q)) return false
    if (filters.status && p.status !== filters.status) return false
    return true
  })

  return (
    <div className="flex flex-col gap-4">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] flex items-start gap-3 p-4 rounded-2xl shadow-xl w-[340px]
          bg-white border border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2"/>
            <path d="M8 12l3 3 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#1A1D2E] dark:text-white">{toast.title}</p>
            <p className="text-[13px] text-[#8F95A8] dark:text-[#8E95B5] mt-0.5 leading-snug">{toast.msg}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer shrink-0">
            <FaXmark size={14} />
          </button>
        </div>
      )}

      <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-white">Loyihalar</h1>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#C2C8E0]"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Ism Sharifi bo'yicha izlash" value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none transition-colors w-[240px]
              bg-[#F1F3F9] border border-[#E2E6F2] text-[#8F95A8] placeholder-[#8F95A8] focus:border-[#526ED3]
              dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#C2C8E0]" />
        </div>

        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border transition-colors cursor-pointer
            bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078]
            dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
          <LuFilter size={13} />
          Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
        </button>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 p-1 rounded-xl bg-[#F1F3F9] dark:bg-[#222323] border border-[#E2E6F2] dark:border-[#474848]">
          <button onClick={() => setViewMode('table')}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer
              ${viewMode === 'table' ? 'bg-white dark:bg-[#3A3B3B] shadow-sm text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
            </svg>
          </button>
          <button onClick={() => setViewMode('grid')}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer
              ${viewMode === 'grid' ? 'bg-white dark:bg-[#3A3B3B] shadow-sm text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/>
              <rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      {viewMode === 'table' && (
        <div className="border-y border-[#E2E6F2] dark:border-[#292A2A] overflow-x-auto">
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
              {filtered.map((p, idx) => {
                const st = statusStyle[p.status] || statusStyle['Rejalashtirilmoqda']
                return (
                  <tr key={p.id}
                    onClick={() => setDetailProject(p)}
                    className="border-b border-[#EEF1F7] dark:border-[#292A2A] last:border-0 hover:bg-black/3 dark:hover:bg-white/3 transition-colors cursor-pointer">
                    <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{p.name}</td>
                    <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{p.manager}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-[#1A1D2E] dark:text-white">{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{p.startDate}</td>
                    <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{p.deadline}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <RowMenu onEdit={() => setEditProject(p)} onDetail={() => setDetailProject(p)} onDelete={() => setDeleteProject(p)} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">Ma'lumot topilmadi</div>
          )}
        </div>
      )}

      {/* Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const st = statusStyle[p.status] || statusStyle['Rejalashtirilmoqda']
            return (
              <div key={p.id}
                onClick={() => setDetailProject(p)}
                className="rounded-2xl border p-5 cursor-pointer transition-colors
                  bg-white border-[#E2E6F2] hover:border-[#C2C8E0]
                  dark:bg-[#1C1D1D] dark:border-[#292A2A] dark:hover:border-[#474848]">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-[15px] font-bold text-[#1A1D2E] dark:text-white leading-tight">{p.name}</h3>
                  <div onClick={e => e.stopPropagation()}>
                    <RowMenu onEdit={() => setEditProject(p)} onDetail={() => setDetailProject(p)} onDelete={() => setDeleteProject(p)} />
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium mb-4 text-[#1A1D2E] dark:text-white">
                  {p.status}
                </span>
                <p className="text-xs text-[#8F95A8] dark:text-[#5B6078] mb-1">Menejer</p>
                <p className="text-sm font-medium text-[#1A1D2E] dark:text-white mb-3">{p.manager}</p>
                <div className="flex items-center justify-between text-xs text-[#8F95A8] dark:text-[#5B6078]">
                  <span>{p.startDate}</span>
                  <span>→</span>
                  <span>{p.deadline}</span>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">Ma'lumot topilmadi</div>
          )}
        </div>
      )}

      {showFilter && (
        <ProjectFilterModal
          initial={filters}
          onClose={() => setShowFilter(false)}
          onApply={f => { setFilters(f); setShowFilter(false) }}
        />
      )}

      {showAdd && (
        <AddProjectModal
          onClose={() => setShowAdd(false)}
          onAdd={p => { setData(prev => [...prev, { ...p, manager: p.manager || '—' }]); showToast('Loyiha yaratildi', "Yangi loyiha muvaffaqiyatli qo'shildi.") }}
        />
      )}

      {editProject && (
        <EditProjectModal
          project={editProject}
          onClose={() => setEditProject(null)}
          onSave={updated => setData(prev => prev.map(p => p.id === updated.id ? updated : p))}
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
          onConfirm={id => setData(prev => prev.filter(p => p.id !== id))}
        />
      )}
    </div>
  )
}
