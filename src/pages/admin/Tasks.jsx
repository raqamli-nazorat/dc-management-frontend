import { useState, useEffect, useRef } from 'react'
import { FaFilter, FaXmark, FaArrowLeft, FaChevronDown, FaEllipsisVertical } from 'react-icons/fa6'
import { usePageAction } from '../../context/PageActionContext'

const TASKS_DATA = [
  { id: 1, code: 'TASD', name: "Dashboard qo'shish", project: 'Crm sistema', creator: "Dudan Turg'unov", assignee: "Dudan Turg'unov", type: "Qo'shimcha", level: 'Kritik', status: 'Jarayonda', deadline: '01.01.2024 20:00' },
  { id: 2, code: 'TASD', name: 'Login sahifasi',     project: 'Dashboard',    creator: "To'raqul Fozilov", assignee: "To'raqul Fozilov", type: 'Xato',        level: 'Yuqori',  status: 'Bajarildi',  deadline: '15.02.2024 18:00' },
  { id: 3, code: 'TASD', name: 'API integratsiya',   project: 'SaaS loyiha',  creator: 'Davron Turdiyev',  assignee: 'Davron Turdiyev',  type: 'Vazifa',      level: 'O\'rta',  status: 'Kutilmoqda', deadline: '01.03.2024 10:00' },
]

const PROJECTS_LIST = [
  { id: 1, name: 'Marketing Platform',   desc: 'Marketing platformasi reklama',    date: '15.04.2026' },
  { id: 2, name: 'E-commerce Site',      desc: "E-commerce sayti mahsulotla",      date: '20.05.2026' },
  { id: 3, name: 'Analytics Dashboard',  desc: "Analytics dashboardi ma'lumo",     date: '30.06.2026' },
  { id: 4, name: 'Crm sistema',          desc: 'CRM tizimi',                       date: '01.01.2026' },
  { id: 5, name: 'Dashboard',            desc: 'Boshqaruv paneli',                 date: '01.02.2026' },
  { id: 6, name: 'SaaS loyiha',          desc: 'SaaS platforma',                   date: '01.03.2026' },
]
const PROJECTS   = PROJECTS_LIST.map(p => p.name)
const LEVELS     = ['Past', "O'rta", 'Yuqori', 'Kritik']
const TYPES      = ['Xatoli', "Qo'shimcha", 'Tadqiqot', 'Yangi funksiya']
const STATUSES   = ['Jarayonda', 'Bajarildi', 'Kutilmoqda', "Bekor qilindi"]
const EMPLOYEES_LIST = [
  { name: 'Марк Леонидов',      role: 'Dizayner' },
  { name: 'Марина Иванова',     role: 'Dasturchi' },
  { name: 'Nodira Xodjayeva',   role: 'Frontend dasturchi' },
  { name: 'Olimjon Isayev',     role: 'UI/UX dizayner' },
  { name: 'Malika Tashkentova', role: 'Mahsulot menejeri' },
  { name: 'Lazizbek Rahimov',   role: 'Mobil dasturchi' },
  { name: "Dudan Turg'unov",    role: 'Menejer' },
  { name: "To'raqul Fozilov",   role: 'Menejer' },
]
const ASSIGNEES  = EMPLOYEES_LIST.map(e => e.name)

const EMPTY_FILTER = { project: '', level: '', type: '', status: '', assignee: '' }
const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'

const levelColor = {}
const statusColor = {}

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

/* ── SimpleSelect ── */
function SimpleSelect({ value, onChange, options, placeholder, label }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative">
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
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-48
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
    </div>
  )
}

/* ── FilterModal ── */
function TaskFilterModal({ onClose, onApply, initial }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[560px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
        <div className="px-7 pt-7 pb-3">
          <div className="flex items-center gap-3 mb-1.5">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0"><FaArrowLeft size={17} /></button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Filtrlash</h2>
          </div>
          <p className="text-sm text-[#8F95A8] ml-8">Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi</p>
        </div>
        <div className="px-7 pb-5 pt-2 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <SimpleSelect label="Loyiha"   value={f.project}  onChange={v => set('project', v)}  options={PROJECTS}  placeholder="Loyiha tanlang" />
            <SimpleSelect label="Holati"   value={f.status}   onChange={v => set('status', v)}   options={STATUSES}  placeholder="Holat tanlang" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <SimpleSelect label="Darajasi" value={f.level}    onChange={v => set('level', v)}    options={LEVELS}    placeholder="Daraja tanlang" />
            <SimpleSelect label="Turi"     value={f.type}     onChange={v => set('type', v)}     options={TYPES}     placeholder="Tur tanlang" />
          </div>
          <SimpleSelect label="Topshiruvchi" value={f.assignee} onChange={v => set('assignee', v)} options={ASSIGNEES} placeholder="Topshiruvchi tanlang" />
        </div>
        <div className="px-7 py-5 flex items-center justify-end gap-3">
          <button onClick={() => setF(EMPTY_FILTER)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Tozalash
          </button>
          <button onClick={() => onApply(f)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            Qidirish
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── ProjectDropdown (nomi + tavsif + sana) ── */
function ProjectDropdown({ value, onChange, error }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref}>
      <label className={labelCls}>Loyiha</label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
            bg-white dark:bg-[#191A1A]
            ${error ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
            ${value ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
          <span className="flex-1 text-left truncate">{value || 'Loyiha tanlang'}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {value
              ? <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
              : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
            }
          </div>
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
            {PROJECTS_LIST.map((p, i) => (
              <button key={p.id} type="button" onClick={() => { onChange(p.name); setOpen(false) }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer
                  ${i < PROJECTS_LIST.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                  ${value === p.name ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${value === p.name ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white'}`}>{p.name}</p>
                  <p className="text-xs text-[#8F95A8] dark:text-[#5B6078] truncate mt-0.5">{p.desc}</p>
                </div>
                <span className="text-xs text-[#8F95A8] dark:text-[#5B6078] shrink-0 ml-3">{p.date}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── AssigneeDropdown (avatar + ism + lavozim) ── */
function AssigneeDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  const selected = EMPLOYEES_LIST.find(e => e.name === value)
  return (
    <div ref={ref}>
      <label className={labelCls}>Topshiruvchi</label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
            bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
            ${value ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
          <span className="flex-1 text-left truncate">{value || 'Topshiruvchi'}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {value
              ? <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
              : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
            }
          </div>
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
            {EMPLOYEES_LIST.map((e, i) => (
              <button key={e.name} type="button" onClick={() => { onChange(e.name); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer
                  ${i < EMPLOYEES_LIST.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                  ${value === e.name ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                <div className="w-7 h-7 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                  {e.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${value === e.name ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white'}`}>{e.name}</p>
                  <p className="text-xs text-[#8F95A8] dark:text-[#5B6078]">{e.role}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── AddTaskModal ── */
function AddTaskModal({ onClose, onAdd }) {
  const dateRef = useRef(null)
  const timeRef = useRef(null)
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    project: '', name: '', description: '', level: '', type: '',
    assignee: '', price: '', fine: '', deadline: '', time: '', files: [],
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const fmtNum = raw => raw.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  const validate = () => {
    const e = {}
    if (!form.project) e.project = true
    if (!form.name.trim()) e.name = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleFiles = e => {
    const picked = Array.from(e.target.files || [])
    set('files', [...form.files, ...picked])
  }

  const inputCls = err =>
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
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity"><FaArrowLeft size={17} /></button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Vazifa qo'shish</h2>
          </div>
          <p className="text-sm text-[#8F95A8] ml-8">Yangi vazifa yaratish uchun ma'lumotlarni kiriting</p>
        </div>

        <div className="px-7 pb-4 flex flex-col gap-4">

          {/* Loyiha + Nomi */}
          <div className="grid grid-cols-2 gap-4">
            <ProjectDropdown value={form.project} onChange={v => set('project', v)} error={errors.project} />
            <div>
              <label className={labelCls}>Nomi</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Nomi yozing" className={inputCls(errors.name)} />
            </div>
          </div>

          {/* Tavsifi */}
          <div>
            <label className={labelCls}>Tavsifi</label>
            <div className="relative">
              <textarea value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Tavsifni yozing" rows={3}
                className={inputCls(false) + ' resize-none pr-8'} />
              {form.description && (
                <button type="button" onClick={() => set('description', '')}
                  className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                  <FaXmark size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Darajasi + Turi */}
          <div className="grid grid-cols-2 gap-4">
            <SimpleSelect label="Darajasi" value={form.level}  onChange={v => set('level', v)}  options={LEVELS} placeholder="Darajasi tanlang" />
            <SimpleSelect label="Turi"     value={form.type}   onChange={v => set('type', v)}   options={TYPES}  placeholder="Turi tanlang" />
          </div>

          {/* Topshiruvchi */}
          <AssigneeDropdown value={form.assignee} onChange={v => set('assignee', v)} />

          {/* Vazifa narxi + Jarima foizi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Vazifa narxi (UZS)</label>
              <input value={form.price} onChange={e => set('price', fmtNum(e.target.value))}
                placeholder="0.00" className={inputCls(false) + ' text-right'} />
            </div>
            <div>
              <label className={labelCls}>Jarima foizi (%)</label>
              <input value={form.fine} onChange={e => set('fine', e.target.value.replace(/\D/g, ''))}
                placeholder="Jarima" className={inputCls(false)} />
            </div>
          </div>

          {/* Muddati + Taxminiy vaqt */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Muddati</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                <input ref={dateRef} type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)}
                  className="flex-1 min-w-0 text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" />
                <button type="button" onClick={() => dateRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>Taxminiy vaqt</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                <input ref={timeRef} type="time" value={form.time} onChange={e => set('time', e.target.value)}
                  className="flex-1 min-w-0 text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" />
                <button type="button" onClick={() => timeRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Qo'shimcha fayllar */}
          <div>
            <label className={labelCls}>Qo'shimcha fayllar</label>
            <div onClick={() => fileRef.current?.click()}
              className="flex flex-wrap gap-2 min-h-[64px] px-3 py-3 rounded-xl border-2 border-dashed border-[#E2E6F2] dark:border-[#292A2A]
                bg-white dark:bg-[#191A1A] cursor-pointer hover:border-[#526ED3] transition-colors">
              {form.files.length === 0 && (
                <span className="text-sm text-[#8F95A8] dark:text-[#5B6078] select-none m-auto">Fayl yuklash uchun bosing</span>
              )}
              {form.files.map((f, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]">
                  {f.name}
                  <button type="button" onMouseDown={ev => { ev.stopPropagation(); set('files', form.files.filter((_, j) => j !== i)) }}
                    className="hover:opacity-70 cursor-pointer"><FaXmark size={9} /></button>
                </span>
              ))}
            </div>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />
          </div>

        </div>

        <div className="px-7 py-5 flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Yopish
          </button>
          <button onClick={() => { if (!validate()) return; onAdd({ ...form, id: Date.now(), code: 'TASD', creator: 'Admin' }); onClose() }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Qo'shish
          </button>
        </div>

      </div>
    </div>
  )
}

/* ── RowMenu ── */
function TaskRowMenu({ onDelete }) {
  const [open, setOpen] = useState(false)

  const [dropUp, setDropUp] = useState(false)
  const ref    = useRef(null)
  const btnRef = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropUp(window.innerHeight - rect.bottom < 140)
    }
    setOpen(o => !o)
  }

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button ref={btnRef} onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors text-[#8F95A8] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
        <FaEllipsisVertical size={14} />
      </button>
      {open && (
        <div className={`absolute right-0 z-50 w-40 rounded-2xl shadow-2xl border overflow-hidden
          bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]
          ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <button onClick={() => setOpen(false)}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#1A1D2E] dark:text-white hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A] border-b border-[#F1F3F9] dark:border-[#2A2B2B] cursor-pointer transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#5B6078] dark:text-[#C2C8E0]"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            Tahrirlash
          </button>
          <button onClick={() => { onDelete?.(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#E02D2D] hover:bg-[#FFF5F5] dark:hover:bg-[#2A1A1A] cursor-pointer transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            O'chirish
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Main Page ── */
export default function TasksPage() {
  const { registerAction, clearAction } = usePageAction()
  const [search, setSearch]     = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [showAdd, setShowAdd]   = useState(false)
  const [filters, setFilters]   = useState(EMPTY_FILTER)
  const [data, setData]         = useState(TASKS_DATA)
  const [toast, setToast]       = useState(null)

  const showToast = (title, msg) => { setToast({ title, msg }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    registerAction({
      label: "Vazifa qo'shish",
      icon: <img src="/imgs/addProjectIcon.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowAdd(true),
    })
    return () => clearAction()
  }, [])

  const hasFilter = Object.values(filters).some(v => v)

  const filtered = data.filter(t => {
    const q = search.toLowerCase()
    if (q && !t.name.toLowerCase().includes(q) && !t.assignee.toLowerCase().includes(q)) return false
    if (filters.project  && t.project  !== filters.project)  return false
    if (filters.status   && t.status   !== filters.status)   return false
    if (filters.level    && t.level    !== filters.level)     return false
    if (filters.type     && t.type     !== filters.type)      return false
    if (filters.assignee && t.assignee !== filters.assignee)  return false
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

      <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-white">Vazifalar</h1>

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
            bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078] dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
          <FaFilter size={13} /> Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
        </button>
      </div>

      {/* Table */}
      <div className="border-y border-[#E2E6F2] dark:border-[#292A2A] overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">№</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Nomi</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Loyiha</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Yaratuvchi</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Topshiruvchi
                </span>
              </th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Turi</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Darajasi</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Holati</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Muddati</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, idx) => (
              <tr key={t.id}
                className="border-b border-[#EEF1F7] dark:border-[#292A2A] last:border-0 hover:bg-black/3 dark:hover:bg-white/3 transition-colors cursor-pointer">
                <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0] text-xs font-medium">{t.code}</td>
                <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{t.name}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.project}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.creator}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.assignee}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{t.type}</td>
                <td className="px-4 py-3 text-right font-medium text-[#1A1D2E] dark:text-white">{t.level}</td>
                <td className="px-4 py-3 text-right font-medium text-[#1A1D2E] dark:text-white">{t.status}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{t.deadline}</td>
                <td className="px-4 py-3">
                  <TaskRowMenu onDelete={() => setData(prev => prev.filter(x => x.id !== t.id))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">Ma'lumot topilmadi</div>
        )}
      </div>

      {showFilter && (
        <TaskFilterModal initial={filters} onClose={() => setShowFilter(false)}
          onApply={f => { setFilters(f); setShowFilter(false) }} />
      )}

      {showAdd && (
        <AddTaskModal onClose={() => setShowAdd(false)}
          onAdd={t => { setData(prev => [...prev, t]); showToast("Vazifa yaratildi", "Yangi vazifa muvaffaqiyatli qo'shildi") }} />
      )}

    </div>
  )
}
