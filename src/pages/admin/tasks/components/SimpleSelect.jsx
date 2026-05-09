import { FaXmark, FaChevronDown } from 'react-icons/fa6'
import useDropdown from './useDropdown'
import { labelCls } from './constants'

export default function SimpleSelect({ value, onChange, options, placeholder, label }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer
            bg-white border-[var(--stroke-sub)] dark:bg-[#191A1A] dark:border-[#292A2A]
            ${value ? 'text-[var(--text-strong)] dark:text-white' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}`}>
          <span className="flex-1 text-left truncate">{value || placeholder}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {value && <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"><FaXmark size={11} /></span>}
            <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-48
            bg-white border-[var(--stroke-sub)] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
            {options.map((o, i) => (
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm  cursor-pointer
                  ${i < options.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                  ${value === o ? 'bg-[#EEF1FB] text-[var(--accent-strong)] font-semibold dark:bg-[#292A2A] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-white hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[#292A2A]'}`}>
                {o}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
