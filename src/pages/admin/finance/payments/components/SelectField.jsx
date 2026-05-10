import { FaXmark, FaChevronDown } from 'react-icons/fa6'
import { useDropdown } from '../useDropdown'
import { labelCls } from '../constants'

const triggerCls = (hasVal, error) =>
  `w-full h-[42px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer
   bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-base)]
   ${error ? 'border-red-400 dark:border-red-500' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]'}
   ${hasVal ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}`

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
    ? 'opacity-50 cursor-not-allowed bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] pointer-events-none'
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
              <span className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] dark:text-[var(--text-soft)] cursor-pointer"
                onMouseDown={e => { e.stopPropagation(); onChange('') }}>
                <FaXmark size={11} />
              </span>
            )}
            <FaChevronDown size={11} className={`text-[var(--text-soft)] dark:text-[var(--text-sub)] transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {error && <p className="text-xs text-red-500 mt-1">*{error}</p>}
        {open && !disabled && (
          <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden
            bg-[var(--bg-elevation-1-alt)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
            {normalized.map((o, i) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full text-left px-4 py-3 text-sm  cursor-pointer
                  ${i < normalized.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''}
                  ${value === o.value
                    ? 'bg-[#EEF1FB] dark:bg-[var(--bg-elevation-2)] text-[var(--accent-strong)] dark:text-[var(--accent-soft)] font-semibold'
                    : 'text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'
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
