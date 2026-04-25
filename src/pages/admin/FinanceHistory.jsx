import { useState, useEffect, useRef } from 'react'
import { FaFilter, FaXmark, FaArrowLeft, FaChevronDown, FaCalendarDays, FaClock } from 'react-icons/fa6'

const HISTORY_DATA = [
  { id: 1, name: 'Doston Dostonov Dostonovich', position: 'Backend dasturchi', region: 'Toshkent viloyati', district: 'Toshkent tumani', passport: 'AA 142505', expense: 'Ishlab chiqarish', amount: 10000000, type: 'Chiqim', date: '01.01.2000 20:00', approved: true },
  { id: 2, name: 'Alyona Sokolova', position: 'Frontend dasturchi', region: 'Samarqand viloyati', district: 'Samarqand tumani', passport: 'BB 234567', expense: 'Maosh', amount: 8575000, type: 'Chiqim', date: '01.01.2025 10:00', approved: true },
  { id: 3, name: "Mijoz to'lovi", position: 'Menejer', region: 'Buxoro viloyati', district: 'Buxoro tumani', passport: 'CC 345678', expense: 'Kirim', amount: 25000000, type: 'Kirim', date: '10.01.2025 14:30', approved: true },
  { id: 4, name: 'Timur Akhmedov', position: 'Tahlilchi', region: 'Andijon viloyati', district: 'Andijon tumani', passport: 'DD 456789', expense: 'Bonus', amount: 2000000, type: 'Chiqim', date: '15.01.2025 09:00', approved: false },
  { id: 5, name: 'Kompaniya', position: 'DevOps', region: 'Namangan viloyati', district: 'Namangan tumani', passport: 'EE 567890', expense: 'Xarajat', amount: 7250000, type: 'Chiqim', date: '22.01.2025 11:00', approved: true },
  { id: 6, name: 'Laylo Azizova', position: 'Dizayner', region: 'Farg\'ona viloyati', district: 'Farg\'ona tumani', passport: 'FF 678901', expense: 'Maosh', amount: 5100000, type: 'Chiqim', date: '05.02.2025 08:00', approved: true },
  { id: 7, name: 'Rustam Salimov', position: 'QA muhandis', region: 'Xorazm viloyati', district: 'Urganch tumani', passport: 'GG 789012', expense: 'Bonus', amount: 3200000, type: 'Kirim', date: '12.02.2025 15:00', approved: false },
  { id: 8, name: 'Nilufar Tursunova', position: 'Loyiha rahbari', region: 'Toshkent viloyati', district: 'Toshkent tumani', passport: 'HH 890123', expense: 'Xarajat', amount: 9800000, type: 'Chiqim', date: '20.02.2025 10:30', approved: true },
]

const XARAJAT_TURLARI = ['Kompaniya uchun', "Mablag' chiqarish", 'Boshqa']
const TURLAR = ['Kirim', 'Chiqim']

const EMPTY_FILTER = { expense: '', type: '', dateFromD: '', dateFromT: '', dateToD: '', dateToT: '', sumFrom: '', sumTo: '' }

function fmt(n) { return Math.abs(n).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtMoney(raw) { const d = raw.replace(/\D/g, ''); return d.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') }

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

/* ── SimpleDropdown ── */
function SimpleDropdown({ label, value, onChange, options, placeholder }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
            bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
            ${value ? 'text-[#1A1D2E] dark:text-[#FFFFFF]' : 'text-[#8F95A8] dark:text-[#C2C8E0]'}`}>
          <span className="flex-1 text-left truncate">{value || placeholder}</span>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {value && <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>}
            <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden
            bg-white border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
            {options.map((o, i) => (
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false) }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors cursor-pointer
                  ${i < options.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#292A2A]' : ''}
                  ${value === o ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-[#FFFFFF] hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                {o}
              </button>
            ))}
          </div>
        )}
      </div>
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
      <input ref={ref} type={type} value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 min-w-0 text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-[#FFFFFF] cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden" />
      <button type="button" onClick={() => ref.current?.showPicker?.()}
        className="shrink-0 cursor-pointer text-[#8F95A8] dark:text-[#C2C8E0] hover:text-[#526ED3] transition-colors">
        {icon}
      </button>
    </div>
  )
}

/* ── HistoryFilterModal ── */
function HistoryFilterModal({ onClose, onApply, initial }) {
  const [f, setF] = useState({ ...EMPTY_FILTER, ...initial })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[520px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">
        {/* Header */}
        <div className="px-6 pt-5 ">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-[#5B6078] dark:text-[#C2C8E0] hover:opacity-70 cursor-pointer shrink-0"><FaArrowLeft size={16} /></button>
            <h2 className="text-lg font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Filtrlash</h2>

          </div>
          <p className="text-xs text-[#8F95A8] dark:text-[#C2C8E0] mt-0.5">Kerakli filtirlarni tanlang, natijalar shunga qarab saralanadi</p>

        </div>
        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Xarajat turi + Turi */}
          <div className="grid grid-cols-2 gap-4">
            <SimpleDropdown label="Xarajat turi" value={f.expense} onChange={v => set('expense', v)} options={XARAJAT_TURLARI} placeholder="Xarajat turini tanlang" />
            <SimpleDropdown label="Turi" value={f.type} onChange={v => set('type', v)} options={TURLAR} placeholder="Toifani tanlang" />
          </div>
          {/* Sana oralig'i */}
          <div>
            <label className={labelCls}>Sana oralig'i</label>
            <div className="grid grid-cols-4 gap-2">
              <DateBox type="date" value={f.dateFromD} onChange={v => set('dateFromD', v)} placeholder="dan" icon={<FaCalendarDays size={12} />} />
              <DateBox type="time" value={f.dateFromT} onChange={v => set('dateFromT', v)} icon={<FaClock size={12} />} />
              <DateBox type="date" value={f.dateToD} onChange={v => set('dateToD', v)} placeholder="gacha" icon={<FaCalendarDays size={12} />} />
              <DateBox type="time" value={f.dateToT} onChange={v => set('dateToT', v)} icon={<FaClock size={12} />} />
            </div>
          </div>
          {/* Miqdor */}
          <div>
            <label className={labelCls}>Miqdor</label>
            <div className="flex gap-2">
              <input className={iCls} placeholder="dan: 0" value={f.sumFrom} onChange={e => set('sumFrom', fmtMoney(e.target.value))} />
              <input className={iCls} placeholder="gacha: 0" value={f.sumTo} onChange={e => set('sumTo', fmtMoney(e.target.value))} />
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 py-4  flex items-center justify-end gap-3">
          <button onClick={() => setF(EMPTY_FILTER)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={14} /> Tozalash
          </button>
          <button onClick={() => onApply(f)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            Qidirish
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── HistoryDetailModal ── */
function HistoryDetailModal({ item, onClose }) {
  const fCls =
    'w-full px-4 py-3 rounded-2xl text-sm border ' +
    'bg-white border-[#E2E6F2] text-[#1A1D2E] ' +
    'dark:bg-[#111111] dark:border-[#292A2A] dark:text-[#FFFFFF]'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">

        {/* Header */}
        <div className="px-7 pt-7 pb-4 flex items-center gap-3">
          <button onClick={onClose}
            className="text-[#1A1D2E] dark:text-[#FFFFFF] hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
            <FaArrowLeft size={17} />
          </button>
          <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF]">Tarix ma'lumotlari</h2>
        </div>

        {/* User info */}
        <div className="px-7 pb-5 flex items-center gap-4">
          <img src="/imgs/userImg.png" alt="avatar"
            className="w-[80px] h-[80px] rounded-[20px] object-cover shrink-0" />
          <div>
            <p className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-[#FFFFFF] leading-tight">{item.name}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs px-3 py-1 rounded-lg font-medium
                bg-[#F1F3F9] text-[#1A1D2E]
                dark:bg-[#222323] dark:text-[#FFFFFF] dark:border dark:border-[#474848]">
                Viloyat: <span className="font-bold">{item.region}</span>
              </span>
              <span className="text-xs px-3 py-1 rounded-lg font-medium
                bg-[#F1F3F9] text-[#1A1D2E]
                dark:bg-[#222323] dark:text-[#FFFFFF] dark:border dark:border-[#474848]">
                Tuman: <span className="font-bold">{item.district}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="px-7 pb-5 flex flex-col gap-4">

          {/* Lavozimi + Passport */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Lavozimi</label>
              <div className={fCls}>{item.position}</div>
            </div>
            <div>
              <label className={labelCls}>Passport ma'lumotlari</label>
              <div className="flex gap-2">
                <div className={fCls + ' !w-[60px] !px-2 shrink-0 text-center'}>{item.passport.split(' ')[0]}</div>
                <div className={fCls + ' flex-1'}>{item.passport.split(' ')[1]}</div>
              </div>
            </div>
          </div>

          {/* Xarajat + Turi */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Xarajat</label>
              <div className={fCls + ' flex items-center justify-between'}>
                <span>{item.expense}</span>
                <FaChevronDown size={11} className="text-[#8F95A8] shrink-0" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Turi</label>
              <div className={fCls + ' flex items-center justify-between'}>
                <span>{item.type}</span>
                <FaChevronDown size={11} className="text-[#8F95A8] shrink-0" />
              </div>
            </div>
          </div>

          {/* Oylik maosh */}
          <div>
            <label className={labelCls}>Oylik maosh (UZS)</label>
            <div className={fCls + ' text-right'}>{fmt(item.amount)}</div>
          </div>

          {/* Sana + Miqdor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Sana</label>
              <div className={fCls}>{item.date}</div>
            </div>
            <div>
              <label className={labelCls}>Miqdor (UZS)</label>
              <div className={fCls + ' text-right'}>{fmt(item.amount)}</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-7 py-5 flex items-center justify-end">
          <button onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer
              text-[#3F57B3] hover:bg-[#EEF1FB] dark:text-[#7F95E6] dark:hover:bg-[#1C1D1D]">
            Yopish
          </button>
        </div>

      </div>
    </div>
  )
}

/* ── Main Page ── */
export default function FinanceHistoryPage() {
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTER)
  const [detailItem, setDetailItem] = useState(null)

  const hasFilter = Object.values(filters).some(v => v)

  const filtered = HISTORY_DATA.filter(h => {
    const q = search.toLowerCase()
    if (q && !h.name.toLowerCase().includes(q)) return false
    if (filters.expense && h.expense !== filters.expense) return false
    if (filters.type && h.type !== filters.type) return false
    return true
  })

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Tarix</h1>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#C2C8E0]" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
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
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] w-10">№</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Ism sharifi</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Xarajat</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Miqdor (UZS)</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Turi</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Sana</th>
              <th className="px-4 py-3 text-center font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] sticky right-0 bg-[#F8F9FC] dark:bg-[#191A1A] shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]">Tasdiqlanish</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((h, idx) => (
              <tr key={h.id}
                onClick={() => setDetailItem(h)}
                className="border-b border-[#EEF1F7] dark:border-[#292A2A] transition-colors last:border-0 cursor-pointer hover:bg-black/3 dark:hover:bg-white/3">
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-[#FFFFFF]">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-[#FFFFFF]">{h.name}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{h.expense}</td>
                <td className="px-4 py-3 text-right font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">{fmt(h.amount)}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{h.type}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-[#FFFFFF]">{h.date}</td>
                <td className="px-4 py-3 text-center sticky right-0 bg-[#F8F9FC] dark:bg-[#191A1A] shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.06)]"
                  onClick={e => e.stopPropagation()}>
                  {h.approved
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

      {/* Modals */}
      {showFilter && (
        <HistoryFilterModal
          initial={filters}
          onClose={() => setShowFilter(false)}
          onApply={f => { setFilters(f); setShowFilter(false) }}
        />
      )}

      {detailItem && (
        <HistoryDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
        />
      )}
    </div>
  )
}
