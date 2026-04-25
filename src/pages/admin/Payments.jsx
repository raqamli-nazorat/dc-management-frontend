import { useState, useEffect, useRef } from 'react'
import { FaFilter, FaXmark, FaArrowLeft, FaCalendarDays, FaChevronDown, FaClock } from 'react-icons/fa6'
import { MdCheck } from 'react-icons/md'
import { usePageAction } from '../../context/PageActionContext'

const PAYMENTS_DATA = [
  { id: 1, name: 'Doston Dostonov Dostonovich', type: 'Kompaniya xarajatlari', toifa: 'Sayohat uchun', loyiha: 'Ishlab chiqarish', amount: 10000000, created: '01.01.2026', approved: '01.01.2026', completed: '01.01.2026', active: true },
  { id: 2, name: 'Asadullo Muxtarov', type: 'Kompaniya xarajatlari', toifa: "Yo'l kira uchun", loyiha: 'Qurilish', amount: 5500000, created: '15.05.2025', approved: '10.01.2025', completed: '05.01.2025', active: true },
  { id: 3, name: 'Abror Zakirov', type: 'Boshqa xarajatlar', toifa: 'Ovqatlanish uchun', loyiha: 'Ishlab chiqarish', amount: 7250000, created: '22.08.2024', approved: '18.02.2024', completed: '12.02.2024', active: true },
  { id: 4, name: 'Dina Sharifova', type: 'Boshqa xarajatlar', toifa: 'Mukofotlar', loyiha: 'Rivojlantirish', amount: 10500000, created: '15.09.2024', approved: '25.07.2024', completed: '20.07.2024', active: true },
  { id: 5, name: 'Mansur Karimov', type: 'Boshqa xarajatlar', toifa: "Yo'l kira uchun", loyiha: 'Ilgari surish', amount: 5750000, created: '30.10.2024', approved: '10.09.2024', completed: '05.09.2024', active: true },
  { id: 6, name: 'Laylo Azizova', type: 'Boshqa xarajatlar', toifa: "Yo'l kira uchun", loyiha: 'Tashkiliy', amount: 8300000, created: '01.11.2024', approved: '12.08.2024', completed: '08.08.2024', active: true },
  { id: 7, name: 'Rustam Salimov', type: 'Boshqa xarajatlar', toifa: "Yo'l kira uchun", loyiha: 'Tarqatish', amount: 9100000, created: '17.12.2024', approved: '22.10.2024', completed: '18.10.2024', active: true },
  { id: 8, name: 'Nilufar Tursunova', type: 'Boshqa xarajatlar', toifa: "Yo'l kira uchun", loyiha: 'Boshqarish', amount: 11200000, created: '12.01.2025', approved: '15.11.2024', completed: '10.11.2024', active: true },
  { id: 9, name: 'Otabek Qodirov', type: 'Boshqa xarajatlar', toifa: "Yo'l kira uchun", loyiha: 'Tahlil', amount: 6800000, created: '05.02.2025', approved: '28.12.2024', completed: '23.12.2024', active: true },
  { id: 10, name: 'Shohjanon Sultonov', type: 'Boshqa xarajatlar', toifa: "Yo'l kira uchun", loyiha: 'Savdolar', amount: 12400000, created: '28.02.2025', approved: '02.01.2025', completed: '28.12.2024', active: true },
  { id: 11, name: 'Malika Xolmatova', type: 'Moliyaviy', toifa: "Yo'l kira uchun", loyiha: 'Hujjatlar', amount: 4600000, created: '20.03.2025', approved: '10.02.2025', completed: '05.02.2025', active: true },
]

const XARAJAT_TURLARI = ['Kompaniya xarajatlari', "Mablag' chiqarish", 'Boshqa xarajatlar', 'Moliyaviy']
const TOIFALAR = ['Sayohat uchun', "Yo'l kira uchun", 'Ovqatlanish uchun', 'Mukofotlar']
const LOYIHALAR = [
  { name: 'Marketing Platform', desc: 'Marketing platformasi reklama', date: '15.04.2026' },
  { name: 'E-commerce Site', desc: 'E-commerce sayti mahsulotla', date: '20.05.2026' },
  { name: 'Analytics Dashboard', desc: "Analytics dashboardi ma'lumo", date: '30.06.2026' },
  { name: 'Social Media Manager', desc: 'Ijtimoiy tarmoqlarni boshqarish', date: '15.07.2026' },
  { name: 'Email Marketing Tool', desc: 'Email marketing vositalari mijo', date: '10.09.2026' },
  { name: 'Customer Relationship Management', desc: 'Mijozlar bilan aloqalarni boshqa', date: '25.10.2026' },
]

const EMPTY_FILTER = {
  type: '', toifa: '', loyiha: '', sumFrom: '', sumTo: '',
  dateFromD: '', dateFromT: '', dateToD: '', dateToT: '',
  approvedFromD: '', approvedFromT: '', approvedToD: '', approvedToT: '',
  completedFromD: '', completedFromT: '', completedToD: '', completedToT: '',
}

function fmt(n) {
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtMoney(raw) {
  const digits = raw.replace(/\D/g, '')
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'
const dropdownTriggerCls = (hasVal) =>
  `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
   bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
   ${hasVal ? 'text-[#1A1D2E] dark:text-[#FFFFFF]' : 'text-[#5B6078] dark:text-[#C2C8E0]'}`

/* ── useDropdown hook ── */
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

/* ── DropdownShell ── */
function DropdownShell({ label, value, onChange, placeholder, open, setOpen, dropRef, children }) {
  return (
    <div ref={dropRef}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)} className={dropdownTriggerCls(!!value)}>
          <span className="truncate flex-1 text-left">{value || placeholder}</span>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {value && (
              <span className="text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer"
                onMouseDown={e => { e.stopPropagation(); onChange('') }}>
                <FaXmark size={11} />
              </span>
            )}
            <FaChevronDown size={11} className={`text-[#8F95A8] dark:text-[#C2C8E0] transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden
            bg-white border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── SelectField ── */
function SelectField({ label, value, onChange, options, placeholder }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <DropdownShell label={label} value={value} onChange={onChange} placeholder={placeholder} open={open} setOpen={setOpen} dropRef={ref}>
      {options.map((o, i) => (
        <button key={o} type="button" onClick={() => { onChange(o); setOpen(false) }}
          className={`w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer
            ${i < options.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#292A2A]' : ''}
            ${value === o
              ? 'bg-[#EEF1FB] dark:bg-[#292A2A] text-[#3F57B3] dark:text-[#7F95E6] font-semibold'
              : 'text-[#1A1D2E] dark:text-[#FFFFFF] hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'
            }`}>
          {o}
        </button>
      ))}
    </DropdownShell>
  )
}

/* ── LoyihaDropdown ── */
function LoyihaDropdown({ value, onChange }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <DropdownShell label="Loyiha" value={value} onChange={onChange} placeholder="Loyiha tanlang" open={open} setOpen={setOpen} dropRef={ref}>
      {LOYIHALAR.map((l, i) => (
        <button key={l.name} type="button" onClick={() => { onChange(l.name); setOpen(false) }}
          className={`w-full text-left px-4 py-3 transition-colors cursor-pointer
            ${i < LOYIHALAR.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#292A2A]' : ''}
            ${value === l.name ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${value === l.name ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-[#FFFFFF]'}`}>{l.name}</p>
              <p className="text-xs text-[#8F95A8] dark:text-[#C2C8E0] truncate mt-0.5">{l.desc}</p>
            </div>
            <span className="text-xs text-[#8F95A8] dark:text-[#C2C8E0] shrink-0 mt-0.5">{l.date}</span>
          </div>
        </button>
      ))}
    </DropdownShell>
  )
}

/* ── DateBox — bitta input qutisi (sana yoki vaqt) ── */
function DateBox({ type, value, onChange, icon, placeholder }) {
  const ref = useRef(null)
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 border border-[#E2E6F2] dark:border-[#292A2A]
      rounded-xl bg-transparent focus-within:border-[#526ED3] transition-colors cursor-text">
      {placeholder && (
        <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">{placeholder}:</span>
      )}
      <input
        ref={ref}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="flex-1 min-w-0 text-xs outline-none bg-transparent
          text-[#1A1D2E] dark:text-[#FFFFFF] cursor-pointer
          [&::-webkit-calendar-picker-indicator]:hidden"
      />
      <button
        type="button"
        onClick={() => ref.current?.showPicker?.()}
        className="shrink-0 cursor-pointer text-[#8F95A8] dark:text-[#C2C8E0] hover:text-[#526ED3] transition-colors"
      >
        {icon}
      </button>
    </div>
  )
}

/* ── DateTimeRangeRow — 4 ta alohida input ── */
function DateTimeRangeRow({ label, dateFromD, dateFromT, dateToD, dateToT, onDateFromD, onTimeFromD, onDateToD, onTimeToD }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="grid grid-cols-4 gap-2">
        <DateBox type="date" value={dateFromD} onChange={onDateFromD} placeholder="dan" icon={<FaCalendarDays size={12} />} />
        <DateBox type="time" value={dateFromT} onChange={onTimeFromD} icon={<FaClock size={12} />} />
        <DateBox type="date" value={dateToD} onChange={onDateToD} placeholder="gacha" icon={<FaCalendarDays size={12} />} />
        <DateBox type="time" value={dateToT} onChange={onTimeToD} icon={<FaClock size={12} />} />
      </div>
    </div>
  )
}

/* ── To'lov turlari ── */
const TOLOV_TURLARI = ["Naqd pulda", "Karta orqali", "Bank o'tkazmasi", "Elektron to'lov"]

/* ── Karta raqam formatlash: 0000 0000 0000 0000 ── */
function fmtCard(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

/* ── SorovModal ── */
function SorovModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({
    loyiha: '', type: '', toifa: '', amount: '', sabab: '', tolovTuri: '', karta: ''
  })
  const [errors, setErrors] = useState({})
  const setF = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const showKarta = form.tolovTuri === 'Karta orqali'

  const validate = () => {
    const e = {}
    if (!form.loyiha) e.loyiha = 'Loyiha tanlanmagan'
    if (!form.type) e.type = 'Xarajat turi tanlanmagan'
    if (!form.toifa) e.toifa = 'Toifa tanlanmagan'
    if (!form.amount) e.amount = 'Miqdor kiritilmagan'
    if (!form.tolovTuri) e.tolovTuri = "To'lov turi tanlanmagan"
    if (showKarta && form.karta.replace(/\s/g, '').length < 16) e.karta = 'Karta raqami to\'liq emas'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSubmit(form)
  }

  const iCls = (k) => `w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors
    bg-white text-[#1A1D2E] placeholder-[#8F95A8] focus:border-[#526ED3]
    dark:bg-[#191A1A] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]
    ${errors[k] ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'}`

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[560px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">

        {/* Header */}
        <div className="px-6 pt-7  ">
          <div className="flex items-center justify-between">
            <div className="">
             
              <div className='flex items-center gap-3 mb-2'>
                 <button onClick={onClose} className="text-[#5B6078] dark:text-[#C2C8E0] hover:opacity-70 cursor-pointer shrink-0">
                <FaArrowLeft  size={16} className='dark:text-white text-[#1A1D2E]' />
              </button>
                <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF]">So'rov yuborish</h2>
              
              </div>
                <p className="text-[15px] text-[#5B6078] dark:text-[#C2C8E0] mt-0.5">So'rov uchun kerakli ma'lumotlarni kiriting</p>
            </div>
           
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Loyiha */}
          <div>
            <label className={labelCls}>Loyiha uchun</label>
            <LoyihaDropdownForm value={form.loyiha} onChange={v => setF('loyiha', v)} error={errors.loyiha} />
          </div>

          {/* Xarajat turi + Toifa */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Xarajat turi</label>
              <SelectFieldForm label="" value={form.type} onChange={v => setF('type', v)} options={XARAJAT_TURLARI} placeholder="Xarajat turini tanlang" error={errors.type} />
            </div>
            <div>
              <label className={labelCls}>Toifa</label>
              <SelectFieldForm label="" value={form.toifa} onChange={v => setF('toifa', v)} options={TOIFALAR} placeholder="Toifani tanlang" error={errors.toifa} />
            </div>
          </div>

          {/* Miqdor */}
          <div>
            <label className={labelCls}>Miqdor (UZS)</label>
            <input
              className={iCls('amount') + ' text-right'}
              placeholder="Summani kiriting: 0.00"
              value={form.amount}
              onChange={e => setF('amount', fmtMoney(e.target.value))}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          {/* Sabab */}
          <div>
            <label className={labelCls}>Sabab</label>
            <div className="relative">
              <textarea
                rows={3}
                className={iCls('sabab') + ' resize-none pr-8'}
                placeholder="Sababni yozing..."
                value={form.sabab}
                onChange={e => setF('sabab', e.target.value)}
              />
              {form.sabab && (
                <button type="button" onClick={() => setF('sabab', '')}
                  className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer">
                  <FaXmark size={12} />
                </button>
              )}
            </div>
          </div>

          {/* To'lov turi */}
          <div className={showKarta ? 'grid grid-cols-2 gap-4' : ''}>
            <div>
              <label className={labelCls}>To'lov turi</label>
              <SelectFieldForm label="" value={form.tolovTuri} onChange={v => setF('tolovTuri', v)} options={TOLOV_TURLARI} placeholder="To'lov turini tanlang" error={errors.tolovTuri} />
            </div>
            {showKarta && (
              <div>
                <label className={labelCls}>Karta raqami</label>
                <div className="relative">
                  <input
                    className={iCls('karta')}
                    placeholder="0000 0000 0000 0000"
                    value={form.karta}
                    onChange={e => setF('karta', fmtCard(e.target.value))}
                    maxLength={19}
                  />
                  {form.karta && (
                    <button type="button" onClick={() => setF('karta', '')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer">
                      <FaXmark size={12} />
                    </button>
                  )}
                </div>
                {errors.karta && <p className="text-xs text-red-500 mt-1">{errors.karta}</p>}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E6F2] dark:border-[#292A2A] flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={14} />
            Yopish
          </button>
          <button onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
              bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <img src="/imgs/checkIcon.svg" alt="" className="w-3.5 h-3.5 brightness-0 invert" />
            So'rov yuborish
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── SelectFieldForm — error support bilan ── */
function SelectFieldForm({ value, onChange, options, placeholder, error }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
          bg-white dark:bg-[#191A1A]
          ${error ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
          ${value ? 'text-[#1A1D2E] dark:text-[#FFFFFF]' : 'text-[#8F95A8] dark:text-[#C2C8E0]'}`}>
        <span className="truncate flex-1 text-left">{value || placeholder}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && (
            <span className="text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer"
              onMouseDown={e => { e.stopPropagation(); onChange('') }}>
              <FaXmark size={11} />
            </span>
          )}
          <FaChevronDown size={11} className={`text-[#8F95A8] dark:text-[#C2C8E0] transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden
          bg-white border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
          {options.map((o, i) => (
            <button key={o} type="button" onClick={() => { onChange(o); setOpen(false) }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer
                ${i < options.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#292A2A]' : ''}
                ${value === o
                  ? 'bg-[#EEF1FB] dark:bg-[#292A2A] text-[#3F57B3] dark:text-[#7F95E6] font-semibold'
                  : 'text-[#1A1D2E] dark:text-[#FFFFFF] hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'
                }`}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── LoyihaDropdownForm — error support bilan ── */
function LoyihaDropdownForm({ value, onChange, error }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
          bg-white dark:bg-[#191A1A]
          ${error ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
          ${value ? 'text-[#1A1D2E] dark:text-[#FFFFFF]' : 'text-[#8F95A8] dark:text-[#C2C8E0]'}`}>
        <span className="truncate flex-1 text-left">{value || 'Loyiha tanlang'}</span>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {value && (
            <span className="text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer"
              onMouseDown={e => { e.stopPropagation(); onChange('') }}>
              <FaXmark size={11} />
            </span>
          )}
          <FaChevronDown size={11} className={`text-[#8F95A8] dark:text-[#C2C8E0] transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {open && (
        <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden
          bg-white border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
          {LOYIHALAR.map((l, i) => (
            <button key={l.name} type="button" onClick={() => { onChange(l.name); setOpen(false) }}
              className={`w-full text-left px-4 py-3 transition-colors cursor-pointer
                ${i < LOYIHALAR.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#292A2A]' : ''}
                ${value === l.name ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${value === l.name ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-[#FFFFFF]'}`}>{l.name}</p>
                  <p className="text-xs text-[#8F95A8] dark:text-[#C2C8E0] truncate mt-0.5">{l.desc}</p>
                </div>
                <span className="text-xs text-[#8F95A8] dark:text-[#C2C8E0] shrink-0 mt-0.5">{l.date}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
function FilterModal({ onClose, onApply, initial }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const set = (k, v) => setF(prev => ({ ...prev, [k]: v }))

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">

        {/* Header */}
        <div className="px-6 pt-5 dark:border-[#292A2A]">
          <div className="">
           
             <div className="flex px-2 items-center gap-3 mb-2">
              <button onClick={onClose} className="text-[#5B6078] dark:text-[#C2C8E0] hover:opacity-70 cursor-pointer shrink-0">
                <FaArrowLeft className='dark:text-white text-[#1A1D2E]' fontWeight={800} size={16} />
              </button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF]">Filtrlash</h2>

            </div>
            <p className="text-[15px] text-[#5B6078] dark:text-[#C2C8E0] mt-0.5">Kerakli filtirlarni tanlang, natijalar shunga qarab saralanadi</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">

          {/* Loyiha + Summa */}
          <div className="grid grid-cols-2 gap-4">
            <LoyihaDropdown value={f.loyiha} onChange={v => set('loyiha', v)} />
            <div>
              <label className={labelCls}>Summa (UZS)</label>
              <div className="flex gap-2">
                <input
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors
                    bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#5B6078] focus:border-[#526ED3]
                    dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]"
                  placeholder="dan: 0"
                  value={f.sumFrom}
                  onChange={e => set('sumFrom', fmtMoney(e.target.value))}
                />
                <input
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors
                    bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#5B6078] focus:border-[#526ED3]
                    dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#C2C8E0]"
                  placeholder="gacha: 0"
                  value={f.sumTo}
                  onChange={e => set('sumTo', fmtMoney(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Xarajat turi + Toifa */}
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Xarajat turi" value={f.type} onChange={v => set('type', v)} options={XARAJAT_TURLARI} placeholder="Xarajat turini tanlang" />
            <SelectField label="Toifa" value={f.toifa} onChange={v => set('toifa', v)} options={TOIFALAR} placeholder="Toifani tanlang" />
          </div>

          {/* Vaqt oraliqlar */}
          <DateTimeRangeRow
            label="Yaratilgan vaqt oralig'i"
            dateFromD={f.dateFromD} dateFromT={f.dateFromT}
            dateToD={f.dateToD} dateToT={f.dateToT}
            onDateFromD={v => set('dateFromD', v)} onTimeFromD={v => set('dateFromT', v)}
            onDateToD={v => set('dateToD', v)} onTimeToD={v => set('dateToT', v)}
          />
          <DateTimeRangeRow
            label="To'langan vaqt oralig'i"
            dateFromD={f.approvedFromD} dateFromT={f.approvedFromT}
            dateToD={f.approvedToD} dateToT={f.approvedToT}
            onDateFromD={v => set('approvedFromD', v)} onTimeFromD={v => set('approvedFromT', v)}
            onDateToD={v => set('approvedToD', v)} onTimeToD={v => set('approvedToT', v)}
          />
          <DateTimeRangeRow
            label="Tasdiqlangan vaqt oralig'i"
            dateFromD={f.completedFromD} dateFromT={f.completedFromT}
            dateToD={f.completedToD} dateToT={f.completedToT}
            onDateFromD={v => set('completedFromD', v)} onTimeFromD={v => set('completedFromT', v)}
            onDateToD={v => set('completedToD', v)} onTimeToD={v => set('completedToT', v)}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end gap-3">
          <button onClick={() => setF(EMPTY_FILTER)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[15px] font-extrabold transition-colors cursor-pointer
              text-[#1A1D2E] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={14} />
            Tozalash
          </button>
          <button onClick={() => onApply(f)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer
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

/* ── Main Page ── */
export default function PaymentsPage() {
  const { registerAction, clearAction } = usePageAction()

  const [payments, setPayments] = useState(PAYMENTS_DATA)
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [showSorov, setShowSorov] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTER)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [toast, setToast] = useState(null)

  const hasFilter = Object.values(filters).some(v => v)

  useEffect(() => {
    registerAction({
      label: "So'rov",
      icon: <img src="/imgs/moneysendflow.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowSorov(true),
    })
    return () => clearAction()
  }, [registerAction, clearAction])

  const filtered = payments.filter(p => {
    const q = search.toLowerCase()
    if (q && !p.name.toLowerCase().includes(q)) return false
    if (filters.type && p.type !== filters.type) return false
    if (filters.toifa && p.toifa !== filters.toifa) return false
    if (filters.loyiha && p.loyiha !== filters.loyiha) return false
    return true
  })

  const allSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id))
  const toggleAll = () => {
    if (allSelected) setSelected(prev => { const s = new Set(prev); filtered.forEach(p => s.delete(p.id)); return s })
    else setSelected(prev => { const s = new Set(prev); filtered.forEach(p => s.add(p.id)); return s })
  }
  const toggleOne = (id) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const showToast = (title, msg) => { setToast({ title, msg }); setTimeout(() => setToast(null), 3000) }

  const handleDelete = () => {
    setPayments(prev => prev.filter(p => !selected.has(p.id)))
    showToast("O'chirildi", "Tanlangan so'rovlar o'chirildi")
    setSelecting(false); setSelected(new Set())
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-2xl shadow-xl w-[340px]
          bg-white border border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
          <img src="/imgs/Union.svg" alt="" className="w-6 h-6 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">{toast.title}</p>
            <p className="text-[13px] text-[#8F95A8] dark:text-[#8E95B5] mt-1 leading-snug">{toast.msg}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer shrink-0">
            <FaXmark size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Xarajat so'rovlari</h1>
        {selecting ? (
          <button onClick={() => { setSelecting(false); setSelected(new Set()) }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-extrabold transition-colors cursor-pointer
              bg-[#DADFF0] text-[#1A1D2E]
              dark:bg-[#3A3B3B] dark:text-white">
            <FaXmark size={13} />
            Bekor qilish
          </button>
        ) : (
          <button onClick={() => setSelecting(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-[13px] font-extrabold transition-colors cursor-pointer
              bg-[#DADFF0] text-[#1A1D2E]
              dark:bg-[#3A3B3B] dark:text-white">
            <img src="/imgs/checkIcon.svg" alt="" className="w-4 h-4 dark:brightness-0 dark:invert" />
            Tanlash
          </button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#C2C8E0]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Ism Sharifi bo'yicha izlash" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none transition-colors w-[240px]
              bg-[#F1F3F9] border border-[#E2E6F2] text-[#8F95A8] placeholder-[#8F95A8] focus:border-[#526ED3]
              dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#C2C8E0]" />
        </div>
        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border transition-colors cursor-pointer
            bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078]
            dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
          <FaFilter size={13} />
          Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
        </button>
      </div>

      {/* Table */}
      <div className="border-y border-[#E2E6F2] dark:border-[#292A2A] overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
              {selecting && <th className="w-10 px-4 py-3 text-left"><input type="checkbox" checked={allSelected} onChange={toggleAll} className="cursor-pointer accent-[#3F57B3]" /></th>}
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] w-10">№</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Ism Sharifi</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Xarajat turi</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Toifa</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Loyiha</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Summa (UZS)</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Yaratilgan vaqt</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">To'langan vaqt</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Tasdiqlangan vaqt</th>
              <th className="px-4 py-3 text-center font-medium text-[#5B6078] sticky right-0 bg-[#F8F9FC] border-[#E2E6F2] 
            dark:bg-[#191A1A] dark:border-[#474848] dark:text-[#C2C8E0]">Xolat</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, idx) => (
              <tr key={p.id} onClick={() => selecting && toggleOne(p.id)}
                className={`border-b border-[#EEF1F7] dark:border-[#292A2A] transition-colors last:border-0
                  ${selecting ? 'cursor-pointer' : ''}
                  ${'hover:bg-black/3 dark:hover:bg-white/3'}`}>
                {selecting && (
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className={`transition-transform duration-200 ${selected.has(p.id) ? 'translate-x-2' : ''}`}>
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} className="cursor-pointer accent-[#3F57B3]" />
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">
                  <span className={`inline-block transition-transform duration-200 ${selected.has(p.id) ? 'translate-x-2' : ''}`}>{idx + 1}</span>
                </td>
                <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-[#FFFFFF]">{p.name}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{p.type}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{p.toifa}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{p.loyiha}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(p.amount)}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{p.created}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{p.approved}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{p.completed}</td>
                <td className="px-4 py-3 text-center sticky right-0 bg-[#F8F9FC] border-[#E2E6F2] 
            dark:bg-[#191A1A] dark:border-[#474848]  ">
                  {p.active
                    ? <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-500"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
                    : <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[#E02D2D]"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
                  }
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
          <button onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer
              bg-[#FFF2F2] text-[#E02D2D] hover:bg-[#F8D7DA]
              dark:bg-[#E02D2D]/10 dark:text-[#FA5252] dark:hover:bg-[#E02D2D]/20">
            O'chirish
          </button>
        </div>
      )}

      {showFilter && (
        <FilterModal
          onClose={() => setShowFilter(false)}
          onApply={(f) => { setFilters(f); setShowFilter(false) }}
          initial={filters}
        />
      )}

      {showSorov && (
        <SorovModal
          onClose={() => setShowSorov(false)}
          onSubmit={(data) => {
            setShowSorov(false)
            showToast("So‘rov yuborildi", "So'So‘rovingiz muvaffaqiyatli yuborildi va ko‘rib chiqish uchun qabul qilindi")
          }}
        />
      )}
    </div>
  )
}
