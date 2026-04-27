import { useState, useEffect, useRef } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown } from 'react-icons/fa6'
import { LuFilter } from 'react-icons/lu'
import { usePageAction } from '../../../context/PageActionContext'

const PROJECTS_LIST = [
  { id: 1, name: 'Marketing Platform',  desc: 'Marketing platformasi reklama',  date: '15.04.2026' },
  { id: 2, name: 'E-commerce Site',     desc: 'E-commerce sayti mahsulotla',    date: '20.05.2026' },
  { id: 3, name: 'Analytics Dashboard', desc: "Analytics dashboardi ma'lumo",   date: '30.06.2026' },
  { id: 4, name: 'Crm sistema',         desc: 'CRM tizimi',                     date: '01.01.2026' },
  { id: 5, name: 'Dashboard',           desc: 'Boshqaruv paneli',               date: '01.02.2026' },
  { id: 6, name: 'SaaS loyiha',         desc: 'SaaS platforma',                 date: '01.03.2026' },
]

const EMPLOYEES_LIST = [
  { name: 'Марк Леонидов',      role: 'Menejer' },
  { name: 'Марина Иванова',     role: 'Administrator' },
  { name: 'Nodira Xodjayeva',   role: 'Frontend dasturchi' },
  { name: 'Olimjon Isayev',     role: 'UI/UX dizayner' },
  { name: 'Malika Tashkentova', role: 'Mahsulot menejeri' },
  { name: 'Lazizbek Rahimov',   role: 'Mobil dasturchi' },
  { name: "Dudan Turg'unov",    role: 'Menejer' },
  { name: "To'raqul Fozilov",   role: 'Menejer' },
]

const DURATION_UNITS = ['Daqiqa', 'Soat']

const MEETINGS_DATA = [
  {
    id: 1, uid: 'M1223', name: 'Crm sistema', organizer: "Dudan Turg'unov",
    project: 'Crm sistema', startTime: '01.01.2024 20:00', done: false,
    fine: '10', link: 'https://meet.google.com/abc-defg-hij',
    description: 'CRM tizimida yangi funksiyalarni muhokama qilish.',
    durationVal: '40', durationUnit: 'Daqiqa',
    participants: ['Марк Леонидов', 'Nodira Xodjayeva'],
  },
  {
    id: 2, uid: 'M1223', name: 'Crm sistema', organizer: "Dudan Turg'unov",
    project: 'Crm sistema', startTime: '01.01.2024 20:00', done: true,
    fine: '', link: '',
    description: '',
    durationVal: '60', durationUnit: 'Daqiqa',
    participants: ["Dudan Turg'unov"],
  },
]

const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'

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

/* ── SimpleDropdown ── */
function SimpleDropdown({ label, value, onChange, options, placeholder, renderOption, getKey, getLabel }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
            bg-white dark:bg-[#191A1A] border-[#E2E6F2] dark:border-[#292A2A]
            ${value ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
          <span className="flex-1 text-left truncate">{value ? getLabel(value) : placeholder}</span>
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
            {options.map((opt, i) => {
              const key = getKey(opt)
              return (
                <button key={key} type="button" onClick={() => { onChange(key); setOpen(false) }}
                  className={`w-full text-left px-4 py-3 transition-colors cursor-pointer
                    ${i < options.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                    ${value === key ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                  {renderOption(opt, value === key)}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── ProjectDropdown ── */
function ProjectDropdown({ value, onChange, error }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref}>
      <label className={labelCls}>Loyiha</label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
            bg-white dark:bg-[#191A1A]
            ${error ? 'border-red-400' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
            ${value ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
          <span className="flex-1 text-left truncate">{value || 'Loyiha tanlang'}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {value
              ? <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
              : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
            }
          </div>
        </button>
        {error && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
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
                  <p className="text-xs text-[#8F95A8] truncate mt-0.5">{p.desc}</p>
                </div>
                <span className="text-xs text-[#8F95A8] shrink-0 ml-3">{p.date}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── DurationSelect ── */
function DurationSelect({ value, unit, onValueChange, onUnitChange }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref}>
      <label className={labelCls}>Davomiyligi</label>
      <div className="flex gap-2">
        <input type="number" min="1" value={value} onChange={e => onValueChange(e.target.value)}
          placeholder="40"
          className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none border border-[#E2E6F2] dark:border-[#292A2A]
            bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white placeholder-[#8F95A8] focus:border-[#526ED3] transition-colors" />
        <div className="relative w-28">
          <button type="button" onClick={() => setOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
              bg-white dark:bg-[#191A1A] border-[#E2E6F2] dark:border-[#292A2A] text-[#1A1D2E] dark:text-white">
            <span>{unit}</span>
            <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-xl shadow-xl border overflow-hidden
              bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
              {DURATION_UNITS.map((u, i) => (
                <button key={u} type="button" onClick={() => { onUnitChange(u); setOpen(false) }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors cursor-pointer
                    ${i < DURATION_UNITS.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                    ${unit === u ? 'bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                  {u}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── MeetingDetailModal — yig'ilish ma'lumotlari ── */
function MeetingDetailModal({ meeting, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
           <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer transition-colors z-10">
          <FaXmark size={14} />
        </button>

      <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
   
        {/* Header */}
        <div className="px-7 pt-7 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Yig'ilish ma'lumotlari</h2>
          </div>
          <p className="text-sm text-[#8F95A8] ml-8">Yangi yig'ilish yaratish uchun ma'lumotlarni kiriting</p>
        </div>

        {/* Body */}
        <div className="px-7 pb-2 flex flex-col gap-3">

          {/* Loyiha */}
          <div>
            <label className={labelCls}>Loyiha</label>
            <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border
              border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white">
              <span className="flex-1 truncate">{meeting.project || 'Loyiha tanlang'}</span>
              <FaChevronDown size={11} className="text-[#8F95A8] shrink-0 ml-2" />
            </div>
          </div>

          {/* Nomi + Jarima foizi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nomi</label>
              <div className="px-3 py-2.5 rounded-xl text-sm border border-[#E2E6F2] dark:border-[#292A2A]
                bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white">
                {meeting.name || <span className="text-[#8F95A8]">Nomi yozing</span>}
              </div>
            </div>
            <div>
              <label className={labelCls}>Jarima foizi (%)</label>
              <div className="px-3 py-2.5 rounded-xl text-sm border border-[#E2E6F2] dark:border-[#292A2A]
                bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white">
                {meeting.fine ? `${meeting.fine} %` : <span className="text-[#8F95A8]">Jarima foizini kiriting</span>}
              </div>
            </div>
          </div>

          {/* Havolasi */}
          <div>
            <label className={labelCls}>Havolasi</label>
            <div className="px-3 py-2.5 rounded-xl text-sm border border-[#E2E6F2] dark:border-[#292A2A]
              bg-white dark:bg-[#191A1A]">
              {meeting.link
                ? <a href={meeting.link} target="_blank" rel="noreferrer"
                    className="text-[#1A1D2E] dark:text-white hover:text-[#3F57B3] transition-colors truncate block">
                    {meeting.link}
                  </a>
                : <span className="text-[#8F95A8]">Havolasi kiriting: URL manzil</span>
              }
            </div>
          </div>

          {/* Tavsifi */}
          <div>
            <label className={labelCls}>Tavsifi</label>
            <div className="px-3 py-2.5 rounded-xl text-sm border border-[#E2E6F2] dark:border-[#292A2A]
              bg-white dark:bg-[#191A1A] min-h-[80px] whitespace-pre-wrap">
              {meeting.description
                ? <span className="text-[#1A1D2E] dark:text-white">{meeting.description}</span>
                : <span className="text-[#8F95A8]">Tavsifni yozing</span>
              }
            </div>
          </div>

          {/* Boshlanish vaqti + Vaqti + Davomiyligi */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Boshlanish vaqti</label>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border
                border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white">
                <span>{meeting.startTime?.split(' ')[0] || '01.01.2026'}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className="shrink-0 text-[#8F95A8] ml-1">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </div>
            </div>
            <div>
              <label className={labelCls}>Vaqti</label>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border
                border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white">
                <span>{meeting.startTime?.split(' ')[1] || '00:00'}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className="shrink-0 text-[#8F95A8] ml-1">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
            </div>
            <div>
              <label className={labelCls}>Davomiyligi</label>
              <div className="flex rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] overflow-hidden">
                <div className="flex-1 px-3 py-2.5 text-sm text-[#1A1D2E] dark:text-white">
                  {meeting.durationVal || '—'}
                </div>
                <div className="flex items-center gap-1 px-2.5 text-sm text-[#1A1D2E] dark:text-white
                  border-l border-[#E2E6F2] dark:border-[#292A2A]">
                  <span className="whitespace-nowrap">{meeting.durationUnit || 'Daqiqa'}</span>
                  <FaChevronDown size={10} className="text-[#8F95A8]" />
                </div>
              </div>
            </div>
          </div>

          {/* Qatnashchilar */}
          <div className="pb-2">
            <label className={labelCls}>Yig'ilishga qatnashishlar</label>
            <div className="px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A]
              bg-white dark:bg-[#191A1A] flex flex-wrap gap-1.5 min-h-[44px] items-start">
              {meeting.participants?.length > 0
                ? meeting.participants.map(name => {
                    const emp = EMPLOYEES_LIST.find(e => e.name === name)
                    return (
                      <span key={name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium
                        bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#1E2340] dark:text-[#7F95E6]">
                        {name}{emp ? ` | ${emp.role}` : ''}
                      </span>
                    )
                  })
                : <span className="text-sm text-[#8F95A8]">Qatnashchilar yo'q</span>
              }
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-7 py-5 flex items-center justify-between gap-3 border-t border-[#F1F3F9] dark:border-[#292A2A]">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-[#1A1D2E] dark:text-[#C2C8E0]">Tugatildimi?</span>
            <div className={`relative w-10 h-5 rounded-full ${meeting.done ? 'bg-black dark:bg-white' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#111111] shadow transition-transform duration-200
                ${meeting.done ? 'translate-x-5 left-0.5' : 'translate-x-0.5 left-0'}`} />
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

/* ── FilterModal ── */
function FilterModal({ onClose, onApply, initial }) {
  const [organizer, setOrganizer] = useState(initial.organizer || '')
  const [project,   setProject]   = useState(initial.project   || '')
  const [dateFrom,  setDateFrom]  = useState(initial.dateFrom  || '')
  const [timeFrom,  setTimeFrom]  = useState(initial.timeFrom  || '00:00')
  const [dateTo,    setDateTo]    = useState(initial.dateTo    || '')
  const [timeTo,    setTimeTo]    = useState(initial.timeTo    || '00:00')

  const dateFromRef = useRef(null)
  const timeFromRef = useRef(null)
  const dateToRef   = useRef(null)
  const timeToRef   = useRef(null)

  const reset = () => {
    setOrganizer(''); setProject('')
    setDateFrom(''); setTimeFrom('00:00')
    setDateTo('');   setTimeTo('00:00')
  }

  const orgDd = useDropdown()
  const prjDd = useDropdown()

  const inputBox = 'flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors'
  const ddBtn = (val, open) => `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer bg-white dark:bg-[#191A1A] border-[#E2E6F2] dark:border-[#292A2A] ${val ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`

  const ddList = 'absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52 bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]'

  return (
    <div className="fixed inset-0 z-50  flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer transition-colors z-10">
          <FaXmark size={14} />
        </button>
      <div className="relative w-full max-w-[600px] max-h-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
      

        {/* Header */}
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0">
              <FaArrowLeft size={16} />
            </button>
            <h2 className="text-[18px] font-extrabold text-[#1A1D2E] dark:text-white">Filtrlash</h2>
          </div>
          <p className="text-sm text-[#5B6078]  ">Kerakli filtrllarni tanlang, natijalar shunga qarab saralanadi</p>
        </div>

        {/* Body */}
        <div className="px-6 pb-4 flex flex-col gap-4">

          {/* Tashkilotchi + Holati — 2 ustun */}
          <div className="grid grid-cols-2 gap-3">

            {/* Tashkilotchi */}
            <div ref={orgDd.ref}>
              <label className={labelCls}>Tashkilotchi</label>
              <div className="relative">
                <button type="button" onClick={() => orgDd.setOpen(o => !o)} className={ddBtn(organizer, orgDd.open)}>
                  <span className="flex-1 text-left truncate">{organizer || 'Menejer tanlang'}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {organizer
                      ? <span onMouseDown={e => { e.stopPropagation(); setOrganizer('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                      : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${orgDd.open ? 'rotate-180' : ''}`} />
                    }
                  </div>
                </button>
                {orgDd.open && (
                  <div className={ddList}>
                    {EMPLOYEES_LIST.map((emp, i) => (
                      <button key={emp.name} type="button"
                        onClick={() => { setOrganizer(emp.name); orgDd.setOpen(false) }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors cursor-pointer
                          ${i < EMPLOYEES_LIST.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                          ${organizer === emp.name ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                        <div className="w-7 h-7 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                          {emp.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${organizer === emp.name ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white'}`}>{emp.name}</p>
                          <p className="text-xs text-[#8F95A8]">{emp.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Holati */}
            <div ref={prjDd.ref}>
              <label className={labelCls}>Holati</label>
              <div className="relative">
                <button type="button" onClick={() => prjDd.setOpen(o => !o)} className={ddBtn(project, prjDd.open)}>
                  <span className="flex-1 text-left truncate">{project || 'Loyiha tanlang'}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {project
                      ? <span onMouseDown={e => { e.stopPropagation(); setProject('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                      : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${prjDd.open ? 'rotate-180' : ''}`} />
                    }
                  </div>
                </button>
                {prjDd.open && (
                  <div className={ddList}>
                    {PROJECTS_LIST.map((p, i) => (
                      <button key={p.id} type="button"
                        onClick={() => { setProject(p.name); prjDd.setOpen(false) }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors cursor-pointer
                          ${i < PROJECTS_LIST.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                          ${project === p.name ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${project === p.name ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white'}`}>{p.name}</p>
                          <p className="text-xs text-[#8F95A8] truncate">{p.desc}</p>
                        </div>
                        <span className="text-xs text-[#8F95A8] shrink-0 ml-2">{p.date}</span>
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

              {/* dan: sana */}
              <div className={`${inputBox} flex-1 min-w-0`}>
                {!dateFrom && <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">dan:</span>}
                <input ref={dateFromRef} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className={`text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${dateFrom ? 'flex-1 min-w-0' : 'w-0 opacity-0 pointer-events-none'}`} />
                <button type="button" onClick={() => dateFromRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors ml-auto">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </button>
              </div>

              {/* dan: vaqt */}
              <div className={`${inputBox} shrink-0`}>
                <input ref={timeFromRef} type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)}
                  className="w-[52px] text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" />
                <button type="button" onClick={() => timeFromRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </button>
              </div>

              {/* gacha: sana */}
              <div className={`${inputBox} flex-1 min-w-0`}>
                {!dateTo && <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">gacha:</span>}
                <input ref={dateToRef} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className={`text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${dateTo ? 'flex-1 min-w-0' : 'w-0 opacity-0 pointer-events-none'}`} />
                <button type="button" onClick={() => dateToRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors ml-auto">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </button>
              </div>

              {/* gacha: vaqt */}
              <div className={`${inputBox} shrink-0`}>
                <input ref={timeToRef} type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)}
                  className="w-[52px] text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" />
                <button type="button" onClick={() => timeToRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-5 flex items-center justify-end gap-3">
          <button onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Tozalash
          </button>
          <button onClick={() => onApply({ organizer, project, dateFrom, timeFrom, dateTo, timeTo })}
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
/* ── ParticipantsModal ── */
function ParticipantsModal({ selected, onClose, onApply }) {
  const [search, setSearch] = useState('')
  const [sel, setSel] = useState(new Set(selected))
  const filtered = EMPLOYEES_LIST.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
  const allSelected = filtered.length > 0 && filtered.every(e => sel.has(e.name))
  const toggle = name => setSel(prev => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s })
  const toggleAll = () => {
    if (allSelected) setSel(prev => { const s = new Set(prev); filtered.forEach(e => s.delete(e.name)); return s })
    else setSel(prev => { const s = new Set(prev); filtered.forEach(e => s.add(e.name)); return s })
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />  <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer transition-colors z-10">
          <FaXmark size={14} />
        </button>
      <div className="relative w-full max-w-[520px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111] flex flex-col max-h-[80vh]">
      
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer"><FaArrowLeft size={16} /></button>
            <h2 className="text-[18px] font-extrabold text-[#1A1D2E] dark:text-white">Yig'ilishga qatnashishlar</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#E2E6F2] dark:border-[#292A2A]
                text-[#5B6078] dark:text-[#C2C8E0] hover:bg-[#F1F3F9] dark:hover:bg-[#1C1D1D] cursor-pointer transition-colors shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
              Barchsini tanlash
            </button>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism Sharifi bo'yicha izlash"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none border border-[#E2E6F2] dark:border-[#292A2A]
                  bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white placeholder-[#8F95A8]" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-2 flex flex-col gap-2">
          {filtered.map(emp => {
            const checked = sel.has(emp.name)
            return (
              <button key={emp.name} type="button" onClick={() => toggle(emp.name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors cursor-pointer text-left
                  ${checked ? 'border-[#526ED3] bg-[#EEF1FB] dark:bg-[#1E2340] dark:border-[#526ED3]'
                    : 'border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] hover:bg-[#F8F9FC] dark:hover:bg-[#222323]'}`}>
                <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border-2 transition-colors
                  ${checked ? 'bg-[#526ED3] border-[#526ED3]' : 'border-[#C2C8E0] dark:border-[#474848]'}`}>
                  {checked && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                  {emp.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${checked ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white'}`}>{emp.name}</p>
                  <p className="text-xs text-[#8F95A8]">{emp.role}</p>
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-3 shrink-0 border-t border-[#F1F3F9] dark:border-[#292A2A]">
          <span className="text-sm text-[#8F95A8]">{sel.size} ta tanlangan</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setSel(new Set())}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-[#5B6078] dark:text-[#C2C8E0]
                hover:bg-[#F1F3F9] dark:hover:bg-[#1C1D1D] cursor-pointer transition-colors">
              <FaXmark size={12} /> Tozalash
            </button>
            <button onClick={() => onApply([...sel])}
              className="flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-bold bg-[#3F57B3] text-white hover:bg-[#526ED3] cursor-pointer transition-colors">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── AddMeetingModal ── */
function AddMeetingModal({ onClose, onAdd }) {
  const dateRef  = useRef(null)
  const timeRef  = useRef(null)
  const durRef   = useDropdown()
  const [showParticipants, setShowParticipants] = useState(false)
  const [form, setForm] = useState({
    project: '', name: '', fine: '', link: '', description: '',
    date: '', time: '', durationVal: '', durationUnit: 'Daqiqa',
    participants: [], done: false,
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const validate = () => {
    const e = {}
    if (!form.project)     e.project = true
    if (!form.name.trim()) e.name    = true
    setErrors(e)
    return Object.keys(e).length === 0
  }
  const inputCls = err =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white placeholder-[#8F95A8] dark:placeholder-[#5B6078] ${err ? 'border-red-400' : 'border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]'}`
  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer transition-colors z-10">
            <FaXmark size={14} />
          </button>
        <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
        
          <div className="px-7 pt-7 pb-3">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0"><FaArrowLeft size={17} /></button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Yig'ilish qo'shish</h2>
            </div>
            <p className="text-sm text-[#8F95A8] ml-8">Yangi yig'ilish yaratish uchun ma'lumotlarni kiriting</p>
          </div>
          <div className="px-7 pb-2 flex flex-col gap-3">

            {/* Loyiha */}
            <ProjectDropdown
              value={form.project}
              onChange={v => { set('project', v); setErrors(p => ({ ...p, project: false })) }}
              error={errors.project}
            />

            {/* Nomi + Jarima foizi */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nomi</label>
                <input value={form.name}
                  onChange={e => { set('name', e.target.value); setErrors(p => ({ ...p, name: false })) }}
                  placeholder="Nomi yozing"
                  className={inputCls(errors.name)} />
                {errors.name && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
              </div>
              <div>
                <label className={labelCls}>Jarima foizi (%)</label>
                <input value={form.fine}
                  onChange={e => set('fine', e.target.value.replace(/\D/g, ''))}
                  placeholder="Jarima foizini kiriting"
                  className={inputCls(false)} />
              </div>
            </div>

            {/* Havolasi */}
            <div>
              <label className={labelCls}>Havolasi</label>
              <input value={form.link}
                onChange={e => set('link', e.target.value)}
                placeholder="Havolasi kiriting: URL manzil"
                className={inputCls(false)} />
            </div>

            {/* Tavsifi */}
            <div>
              <label className={labelCls}>Tavsifi</label>
              <div className="relative">
                <textarea value={form.description}
                  onChange={e => set('description', e.target.value)}
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

            {/* Boshlanish vaqti + Vaqti + Davomiyligi */}
            <div className="grid grid-cols-3 gap-3">
              {/* Boshlanish sanasi */}
              <div>
                <label className={labelCls}>Boshlanish vaqti</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A]
                  bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                  <input ref={dateRef} type="date" value={form.date} onChange={e => set('date', e.target.value)}
                    className="flex-1 min-w-0 text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" />
                  <button type="button" onClick={() => dateRef.current?.showPicker?.()}
                    className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  </button>
                </div>
              </div>
              {/* Vaqti */}
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
              {/* Davomiyligi — input + select birlashgan */}
              <div ref={durRef.ref}>
                <label className={labelCls}>Davomiyligi</label>
                <div className="flex rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] overflow-hidden focus-within:border-[#526ED3] transition-colors">
                  <input type="number" min="1" value={form.durationVal}
                    onChange={e => set('durationVal', e.target.value)}
                    placeholder="40"
                    className="flex-1 min-w-0 px-3 py-2.5 text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white placeholder-[#8F95A8]" />
                  <div className="relative shrink-0">
                    <button type="button" onClick={() => durRef.setOpen(o => !o)}
                      className="h-full flex items-center gap-1 px-2.5 text-sm text-[#1A1D2E] dark:text-white border-l border-[#E2E6F2] dark:border-[#292A2A] cursor-pointer hover:bg-[#F8F9FC] dark:hover:bg-[#222323] transition-colors">
                      <span className="whitespace-nowrap">{form.durationUnit}</span>
                      <FaChevronDown size={10} className={`text-[#8F95A8] transition-transform ${durRef.open ? 'rotate-180' : ''}`} />
                    </button>
                    {durRef.open && (
                      <div className="absolute top-full right-0 mt-1 z-50 w-24 rounded-xl shadow-xl border overflow-hidden
                        bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
                        {DURATION_UNITS.map((u, i) => (
                          <button key={u} type="button" onClick={() => { set('durationUnit', u); durRef.setOpen(false) }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors cursor-pointer
                              ${i < DURATION_UNITS.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                              ${form.durationUnit === u ? 'bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                            {u}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Qatnashchilar */}
            <div>
              <label className={labelCls}>Yig'ilish qatnashishlar</label>
              {form.participants.length > 0 && (
                <div className="px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A]
                  bg-white dark:bg-[#191A1A] flex flex-wrap gap-1.5 mb-2">
                  {form.participants.map(name => {
                    const emp = EMPLOYEES_LIST.find(e => e.name === name)
                    return (
                      <span key={name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium
                        bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#1E2340] dark:text-[#7F95E6]">
                        {name}{emp ? ` | ${emp.role}` : ''}
                        <button type="button"
                          onMouseDown={ev => { ev.stopPropagation(); set('participants', form.participants.filter(p => p !== name)) }}
                          className="hover:opacity-70 cursor-pointer ml-0.5">
                          <FaXmark size={9} />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
              <button type="button" onClick={() => setShowParticipants(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#C2C8E0] dark:border-[#474848]
                  text-sm text-[#8F95A8] dark:text-[#C2C8E0] hover:border-[#526ED3] hover:text-[#526ED3] cursor-pointer transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Qatnashchilarni qo'shish
              </button>
            </div>

          </div>
          <div className="px-7 py-5 flex items-center justify-between gap-3 border-t border-[#F1F3F9] dark:border-[#292A2A]">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium text-[#1A1D2E] dark:text-[#C2C8E0]">Tugatildimi?</span>
              <button type="button" onClick={() => set('done', !form.done)}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.done ? 'bg-black' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
                <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.done ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
                <FaXmark size={13} /> Yopish
              </button>
              <button onClick={() => {
                if (!validate()) return
                const startTime = [form.date, form.time].filter(Boolean).join(' ') || '—'
                onAdd({ id: Date.now(), uid: 'M' + Math.floor(1000 + Math.random() * 9000), name: form.name, project: form.project, organizer: form.participants[0] || '—', startTime, done: form.done, fine: form.fine, link: form.link, description: form.description, durationVal: form.durationVal, durationUnit: form.durationUnit, participants: form.participants })
                onClose()
              }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
                <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      </div>
      {showParticipants && (
        <ParticipantsModal selected={form.participants} onClose={() => setShowParticipants(false)}
          onApply={vals => { set('participants', vals); setShowParticipants(false) }} />
      )}
    </>
  )
}

/* ── Main Page ── */
export default function MeetingsPage() {
  const { registerAction, clearAction } = usePageAction()
  const [data, setData]             = useState(MEETINGS_DATA)
  const [search, setSearch]         = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters]       = useState({})
  const [detail, setDetail]         = useState(null)
  const [toast, setToast]           = useState(null)

  const showToast = (title, msg) => { setToast({ title, msg }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    registerAction({
      label: "Yig'ilish qo'shish",
      icon: <img src="/imgs/addmeetingIcon.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowAdd(true),
    })
    return () => clearAction()
  }, [])

  const hasFilter = Object.values(filters).some(v => v)

  const filtered = data.filter(m => {
    const q = search.toLowerCase()
    if (q && !m.name.toLowerCase().includes(q) && !m.organizer.toLowerCase().includes(q)) return false
    if (filters.organizer && m.organizer !== filters.organizer) return false
    if (filters.project   && m.project   !== filters.project)   return false
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      {toast && (
        <div className="fixed top-5 right-5 z-[100] flex items-start gap-3 p-4 rounded-2xl shadow-xl w-[340px] bg-white border border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2"/>
            <path d="M8 12l3 3 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#1A1D2E] dark:text-white">{toast.title}</p>
            <p className="text-[13px] text-[#8F95A8] dark:text-[#8E95B5] mt-0.5 leading-snug">{toast.msg}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer shrink-0"><FaXmark size={14} /></button>
        </div>
      )}

      <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-white">Yig'ilishlar</h1>

      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Nomi bo'yicha izlash" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-[5px] rounded-xl text-[13px] font-medium outline-none transition-colors w-[220px] bg-[#F1F3F9] border border-[#E2E6F2] text-[#8F95A8] placeholder-[#8F95A8] focus:border-[#526ED3] dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#C2C8E0]" />
        </div>
        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[5px] rounded-xl text-[13px] font-extrabold border transition-colors cursor-pointer bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078] dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
          <LuFilter size={13} /> Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] w-10">Nr</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">UID</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Nomi</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Tashkilotchi</span>
              </th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Loyiha</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Boshlanish vaqti</th>
              <th className="px-4 py-3 text-center font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Tugatildimi?</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, idx) => (
              <tr key={m.id} onClick={() => setDetail(m)}
                className="border-b border-[#EEF1F7] dark:border-[#292A2A] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
                <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0] text-xs font-medium">{idx + 1}</td>
                <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0] text-xs font-medium">{m.uid}</td>
                <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{m.name}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{m.organizer}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{m.project}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{m.startTime}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${m.done ? 'bg-[#22c55e]' : 'bg-[#EF4444]'}`}>
                    {m.done
                      ? <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    }
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]"
            style={{ minHeight: 'calc(100vh - 280px)' }}>
            Ma'lumot topilmadi
          </div>
        )}
      </div>

      {detail     && <MeetingDetailModal meeting={detail} onClose={() => setDetail(null)} />}
      {showFilter && <FilterModal initial={filters} onClose={() => setShowFilter(false)} onApply={f => { setFilters(f); setShowFilter(false) }} />}
      {showAdd    && <AddMeetingModal onClose={() => setShowAdd(false)} onAdd={m => { setData(prev => [...prev, m]); showToast("Yig'ilish yaratildi", `"${m.name}" muvaffaqiyatli qo'shildi`) }} />}
    </div>
  )
}
