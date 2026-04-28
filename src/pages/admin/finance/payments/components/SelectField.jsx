import { FaXmark, FaChevronDown } from 'react-icons/fa6'
import { useDropdown } from '../useDropdown'
import { labelCls } from '../constants'

const dropdownTriggerCls = (hasVal) =>
  `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
   bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
   ${hasVal ? 'text-[#1A1D2E] dark:text-[#FFFFFF]' : 'text-[#5B6078] dark:text-[#C2C8E0]'}`

/* Shared dropdown shell */
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
          <div className="absolute top-full left-0 mt-1 z-[60] w-full rounded-2xl shadow-xl border overflow-hidden
            bg-white border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}

/* SelectField — filter modal uchun */
export function SelectField({ label, value, onChange, options, placeholder }) {
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

/* SelectFieldForm — modal form uchun (error support) */
export function SelectFieldForm({ value, onChange, options, placeholder, error }) {
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
        <div className="absolute top-full left-0 mt-1 z-[60] w-full rounded-2xl shadow-xl border overflow-hidden
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
