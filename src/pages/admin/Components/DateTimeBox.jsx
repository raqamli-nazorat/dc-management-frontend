import { useState, useEffect, useRef } from 'react'

/**
 * DateTimeBox — qo'lda kiritish + calendar/time picker popover
 *
 * type="date"  → DD/MM/YYYY format, value: "YYYY-MM-DD" (ISO)
 * type="time"  → HH:MM format, 24 soatlik, value: "HH:MM"
 */

// ── Calendar Popover ──────────────────────────────────────────
const MONTH_NAMES = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
]
const DAY_NAMES = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

function CalendarPopover({ value, onChange, onClose, anchorRef, dropUp }) {
  const today = new Date()
  const initDate = value ? new Date(value) : today
  const [viewYear, setViewYear]   = useState(initDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(initDate.getMonth())
  const [showYearMonth, setShowYearMonth] = useState(false)
  const popRef = useRef(null)

  // Outside click
  useEffect(() => {
    const h = (e) => {
      if (
        popRef.current && !popRef.current.contains(e.target) &&
        anchorRef?.current && !anchorRef.current.contains(e.target)
      ) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose, anchorRef])

  const selected = value ? new Date(value) : null

  // Days in month grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
  const startOffset = firstDay === 0 ? 6 : firstDay - 1     // Mon=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const selectDay = (d) => {
    const mm = String(viewMonth + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    onChange(`${viewYear}-${mm}-${dd}`)
    onClose()
  }

  const isSelected = (d) => {
    if (!selected) return false
    return selected.getFullYear() === viewYear &&
           selected.getMonth() === viewMonth &&
           selected.getDate() === d
  }
  const isToday = (d) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === d

  // Year/month selector
  const years = []
  for (let y = today.getFullYear() - 10; y <= today.getFullYear() + 10; y++) years.push(y)

  return (
    <div
      ref={popRef}
      className="absolute z-[9999] rounded-2xl shadow-2xl border bg-white dark:bg-[#1C1D1D] border-[#E2E6F2] dark:border-[#2A2B2B] p-3 select-none"
      style={{ minWidth: 260, ...(dropUp ? { bottom: '100%', marginBottom: 4 } : { top: '100%', marginTop: 4 }) }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          type="button"
          onClick={prevMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>

        <button
          type="button"
          onClick={() => setShowYearMonth(s => !s)}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A] cursor-pointer"
        >
          <span className="text-sm font-bold text-[#1A1D2E] dark:text-white">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-[#8F95A8] transition-transform ${showYearMonth ? 'rotate-180' : ''}`}><path d="M6 9l6 6 6-6"/></svg>
        </button>

        <button
          type="button"
          onClick={nextMonth}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Year/Month dropdown */}
      {showYearMonth && (
        <div className="mb-2 flex gap-2">
          {/* Month list */}
          <div className="flex-1 max-h-40 overflow-y-auto rounded-xl border border-[#E2E6F2] dark:border-[#292A2A]">
            {MONTH_NAMES.map((mn, i) => (
              <button
                key={mn}
                type="button"
                onClick={() => { setViewMonth(i); setShowYearMonth(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs cursor-pointer
                  ${i === viewMonth
                    ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]'
                    : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}
              >
                {mn}
              </button>
            ))}
          </div>
          {/* Year list */}
          <div className="w-20 max-h-40 overflow-y-auto rounded-xl border border-[#E2E6F2] dark:border-[#292A2A]">
            {years.map(y => (
              <button
                key={y}
                type="button"
                onClick={() => { setViewYear(y); setShowYearMonth(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs cursor-pointer
                  ${y === viewYear
                    ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]'
                    : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Day names */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#8F95A8] py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => (
          <div key={i} className="aspect-square flex items-center justify-center">
            {d ? (
              <button
                type="button"
                onClick={() => selectDay(d)}
                className={`w-8 h-8 rounded-full text-xs font-medium cursor-pointer transition-colors
                  ${isSelected(d)
                    ? 'bg-[#3F57B3] text-white'
                    : isToday(d)
                    ? 'border-2 border-[#3F57B3] text-[#3F57B3] dark:text-[#7F95E6] hover:bg-[#EEF1FB] dark:hover:bg-[#292A2A]'
                    : 'text-[#1A1D2E] dark:text-white hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A]'}`}
              >
                {d}
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F1F3F9] dark:border-[#292A2A]">
        <button
          type="button"
          onClick={() => { onChange(''); onClose() }}
          className="text-xs text-[#8F95A8] hover:text-[#526ED3] cursor-pointer px-2 py-1 rounded-lg hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A]"
        >
          Tozalash
        </button>
        <button
          type="button"
          onClick={() => {
            const t = new Date()
            const mm = String(t.getMonth() + 1).padStart(2, '0')
            const dd = String(t.getDate()).padStart(2, '0')
            onChange(`${t.getFullYear()}-${mm}-${dd}`)
            onClose()
          }}
          className="text-xs text-[#3F57B3] dark:text-[#7F95E6] hover:text-[#526ED3] cursor-pointer px-2 py-1 rounded-lg hover:bg-[#EEF1FB] dark:hover:bg-[#292A2A] font-semibold"
        >
          Bugun
        </button>
      </div>
    </div>
  )
}

// ── Time Picker Popover ───────────────────────────────────────
function TimePopover({ value, onChange, onClose, anchorRef, dropUp }) {
  const popRef = useRef(null)
  const hourRef = useRef(null)
  const minRef  = useRef(null)

  const initH = value ? parseInt(value.split(':')[0], 10) : 0
  const initM = value ? parseInt(value.split(':')[1], 10) : 0
  const [hour, setHour] = useState(isNaN(initH) ? 0 : initH)
  const [min,  setMin]  = useState(isNaN(initM) ? 0 : initM)

  // Scroll selected item into view
  useEffect(() => {
    hourRef.current?.children[hour]?.scrollIntoView({ block: 'center' })
    minRef.current?.children[min]?.scrollIntoView({ block: 'center' })
  }, [])

  // Outside click
  useEffect(() => {
    const h = (e) => {
      if (
        popRef.current && !popRef.current.contains(e.target) &&
        anchorRef?.current && !anchorRef.current.contains(e.target)
      ) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose, anchorRef])

  const apply = (h, m) => {
    const hh = String(h).padStart(2, '0')
    const mm = String(m).padStart(2, '0')
    onChange(`${hh}:${mm}`)
  }

  const selectHour = (h) => {
    setHour(h)
    apply(h, min)
  }
  const selectMin = (m) => {
    setMin(m)
    apply(hour, m)
  }

  return (
    <div
      ref={popRef}
      className="absolute z-[9999] rounded-2xl shadow-2xl border bg-white dark:bg-[#1C1D1D] border-[#E2E6F2] dark:border-[#2A2B2B] p-3 select-none"
      style={{ minWidth: 160, ...(dropUp ? { bottom: '100%', marginBottom: 4 } : { top: '100%', marginTop: 4 }) }}
    >
      <p className="text-xs font-semibold text-[#5B6078] dark:text-[#C2C8E0] mb-2 text-center">Vaqt tanlang</p>

      <div className="flex gap-2">
        {/* Hours */}
        <div className="flex-1">
          <p className="text-[10px] text-center text-[#8F95A8] mb-1 font-medium">Soat</p>
          <div ref={hourRef} className="h-44 overflow-y-auto rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] scroll-smooth">
            {Array.from({ length: 24 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectHour(i)}
                className={`w-full text-center py-1.5 text-sm cursor-pointer transition-colors
                  ${i === hour
                    ? 'bg-[#3F57B3] text-white font-bold'
                    : 'text-[#1A1D2E] dark:text-white hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A]'}`}
              >
                {String(i).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>

        {/* Minutes */}
        <div className="flex-1">
          <p className="text-[10px] text-center text-[#8F95A8] mb-1 font-medium">Daqiqa</p>
          <div ref={minRef} className="h-44 overflow-y-auto rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] scroll-smooth">
            {Array.from({ length: 60 }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => selectMin(i)}
                className={`w-full text-center py-1.5 text-sm cursor-pointer transition-colors
                  ${i === min
                    ? 'bg-[#3F57B3] text-white font-bold'
                    : 'text-[#1A1D2E] dark:text-white hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A]'}`}
              >
                {String(i).padStart(2, '0')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F1F3F9] dark:border-[#292A2A]">
        <button
          type="button"
          onClick={() => { setHour(0); setMin(0); onChange('00:00'); onClose() }}
          className="text-xs text-[#8F95A8] hover:text-[#526ED3] cursor-pointer px-2 py-1 rounded-lg hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A]"
        >
          Tozalash
        </button>
        <button
          type="button"
          onClick={() => {
            const now = new Date()
            const h = now.getHours()
            const m = now.getMinutes()
            setHour(h)
            setMin(m)
            apply(h, m)
            onClose()
          }}
          className="text-xs text-[#3F57B3] dark:text-[#7F95E6] cursor-pointer px-2 py-1 rounded-lg hover:bg-[#EEF1FB] dark:hover:bg-[#292A2A] font-semibold"
        >
          Hozir
        </button>
      </div>
    </div>
  )
}

// ── Main DateTimeBox ──────────────────────────────────────────
export const DateTimeBox = ({ type, placeholder, value, onChange, disabled, error, dropUp }) => {
  const inputRef  = useRef(null)
  const iconRef   = useRef(null)
  const wrapRef   = useRef(null)
  const [open, setOpen] = useState(false)

  // ── DATE helpers ──────────────────────────────────────────
  const isoToDisplay = (iso) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    if (!y || !m || !d) return iso
    return `${d}/${m}/${y}`
  }

  const [dateDisplay, setDateDisplay] = useState(isoToDisplay(value))
  const [timeDisplay, setTimeDisplay] = useState(value || (type === 'time' ? '00:00' : ''))

  useEffect(() => {
    if (type === 'date') setDateDisplay(isoToDisplay(value))
    else setTimeDisplay(value || '00:00')
  }, [value, type])

  // ── DATE INPUT HANDLER ────────────────────────────────────
  const handleDateInput = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8)
    let formatted = digits
    if (digits.length > 2) formatted = digits.slice(0, 2) + '/' + digits.slice(2)
    if (digits.length > 4) formatted = digits.slice(0, 2) + '/' + digits.slice(2, 4) + '/' + digits.slice(4)
    setDateDisplay(formatted)

    if (digits.length === 8) {
      let d = parseInt(digits.slice(0, 2), 10)
      let m = parseInt(digits.slice(2, 4), 10)
      let y = parseInt(digits.slice(4, 8), 10)
      if (m < 1) m = 1
      if (m > 12) m = 12
      const daysInMonth = new Date(y, m, 0).getDate()
      if (d < 1) d = 1
      if (d > daysInMonth) d = daysInMonth
      const dd = String(d).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const yyyy = String(y).padStart(4, '0')
      setDateDisplay(`${dd}/${mm}/${yyyy}`)
      onChange(`${yyyy}-${mm}-${dd}`)
    } else if (digits.length === 0) {
      onChange('')
    }
  }

  const handleDateBlur = () => {
    const digits = dateDisplay.replace(/\D/g, '')
    if (digits.length > 0 && digits.length < 8) {
      setDateDisplay('')
      onChange('')
    }
  }

  // ── TIME INPUT HANDLER ────────────────────────────────────
  const handleTimeInput = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4)
    let formatted = digits
    if (digits.length > 2) formatted = digits.slice(0, 2) + ':' + digits.slice(2)
    setTimeDisplay(formatted)

    if (digits.length === 4) {
      let h = parseInt(digits.slice(0, 2), 10)
      let m = parseInt(digits.slice(2, 4), 10)
      if (h > 23) h = 23
      if (h < 0) h = 0
      if (m > 59) m = 59
      if (m < 0) m = 0
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      setTimeDisplay(`${hh}:${mm}`)
      onChange(`${hh}:${mm}`)
    } else if (digits.length === 0) {
      onChange('')
    }
  }

  const handleTimeBlur = () => {
    const digits = timeDisplay.replace(/\D/g, '')
    if (digits.length > 0 && digits.length < 4) {
      setTimeDisplay('00:00')
      onChange('00:00')
    } else if (digits.length === 0) {
      setTimeDisplay('00:00')
    }
  }

  // ── STYLES ────────────────────────────────────────────────
  const wrapCls = `
    relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl border
    bg-white dark:bg-[#191A1A]
    ${error ? 'border-red-400' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
    ${!error && !disabled ? 'focus-within:border-[#526ED3] dark:focus-within:border-[#526ED3]' : ''}
    transition-colors
    ${disabled ? 'opacity-60 cursor-not-allowed' : ''}
  `

  const inputCls = `
    flex-1 min-w-0 text-sm outline-none bg-transparent
    text-[#1A1D2E] dark:text-white
    placeholder-[#B6BCCB] dark:placeholder-[#474848]
    ${disabled ? 'cursor-not-allowed' : ''}
  `

  // ── RENDER ────────────────────────────────────────────────
  if (type === 'time') {
    return (
      <div ref={wrapRef} className={wrapCls} style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={timeDisplay}
          onChange={e => handleTimeInput(e.target.value)}
          onBlur={handleTimeBlur}
          placeholder={placeholder || 'SS:DD'}
          disabled={disabled}
          maxLength={5}
          className={inputCls}
        />
        <button
          ref={iconRef}
          type="button"
          disabled={disabled}
          onClick={() => setOpen(o => !o)}
          className="shrink-0 cursor-pointer text-[#B6BCCB] dark:text-[#474848] hover:text-[#526ED3] transition-colors"
        >
          {/* Clock icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
        </button>
        {open && (
          <TimePopover
            value={value}
            onChange={(v) => { onChange(v); setTimeDisplay(v) }}
            onClose={() => setOpen(false)}
            anchorRef={wrapRef}
            dropUp={dropUp}
          />
        )}
      </div>
    )
  }

  // date
  return (
    <div ref={wrapRef} className={wrapCls} style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={dateDisplay}
        onChange={e => handleDateInput(e.target.value)}
        onBlur={handleDateBlur}
        placeholder={placeholder || 'KK/OO/YYYY'}
        disabled={disabled}
        maxLength={10}
        className={inputCls}
      />
      <button
        ref={iconRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="shrink-0 cursor-pointer text-[#B6BCCB] dark:text-[#474848] hover:text-[#526ED3] transition-colors"
      >
        {/* Calendar icon */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
      </button>
      {open && (
        <CalendarPopover
          value={value}
          onChange={(v) => { onChange(v); setOpen(false) }}
          onClose={() => setOpen(false)}
          anchorRef={wrapRef}
          dropUp={dropUp}
        />
      )}
    </div>
  )
}
