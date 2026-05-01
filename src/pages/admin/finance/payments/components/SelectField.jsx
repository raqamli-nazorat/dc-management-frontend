import { FaXmark, FaChevronDown } from 'react-icons/fa6'
import { useDropdown } from '../useDropdown'
import { labelCls } from '../constants'

const triggerCls = (hasVal, error) =>
  `w-full h-[42px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer
   bg-white dark:bg-[#191A1A]
   ${error ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
   ${hasVal ? 'text-[#1A1D2E] dark:text-[#FFFFFF]' : 'text-[#8F95A8] dark:text-[#C2C8E0]'}`

/**
 * options: [{ label, value }] yoki ['string', ...]
 * value: tanlangan value (string)
 */
export function SelectField({ label, value, onChange, options = [], placeholder, error, disabled = false }) {
  const { open, setOpen, ref } = useDropdown()

  const normalized = options.map(o =>
    typeof o === 'string' ? { label: o, value: o } : o
  )
  const displayLabel = normalized.find(o => o.value === value)?.label ?? ''

  const disabledCls = disabled
    ? 'opacity-50 cursor-not-allowed bg-[#F8F9FC] dark:bg-[#1A1B1B] pointer-events-none'
    : ''

  return (
    <div ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <div className={`relative ${disabledCls}`}>
        <button
          type="button"
          onClick={() => !disabled && setOpen(o => !o)}
          disabled={disabled}
          className={triggerCls(!!value, error) + (disabled ? ' cursor-not-allowed opacity-60' : '')}
        >
          <span className="truncate flex-1 text-left">{displayLabel || placeholder}</span>
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {value && !disabled && (
              <span className="text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] cursor-pointer"
                onMouseDown={e => { e.stopPropagation(); onChange('') }}>
                <FaXmark size={11} />
              </span>
            )}
            <FaChevronDown size={11} className={`text-[#8F95A8] dark:text-[#C2C8E0] transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {error && <p className="text-xs text-red-500 mt-1">*{error}</p>}
        {open && !disabled && (
          <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden
            bg-white border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
            {normalized.map((o, i) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full text-left px-4 py-3 text-sm  cursor-pointer
                  ${i < normalized.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#292A2A]' : ''}
                  ${value === o.value
                    ? 'bg-[#EEF1FB] dark:bg-[#292A2A] text-[#3F57B3] dark:text-[#7F95E6] font-semibold'
                    : 'text-[#1A1D2E] dark:text-[#FFFFFF] hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'
                  }`}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
