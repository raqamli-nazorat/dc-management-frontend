import { useRef } from "react"

export const DateTimeBox = ({ type, placeholder, value, onChange }) => {
    const ref = useRef(null)
    const isEmpty = !value

    const icon = type === 'date'
        ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>

    return (
        <div className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] ">
            {placeholder && isEmpty && (
                <span className="text-xs shrink-0 select-none text-[#B6BCCB] dark:text-[#474848]">
                    {placeholder}:
                </span>
            )}
            <input
                ref={ref}
                type={type}
                value={type === 'time' ? (value || '00:00') : value}
                onChange={e => {
                    if (type === 'time' && e.target.value === '00:00') {
                        onChange('')
                    } else {
                        onChange(e.target.value)
                    }
                }}
                step={type === 'time' ? '60' : undefined}
                className={`flex-1 min-w-0 text-xs outline-none bg-transparent cursor-pointer
                    [&::-webkit-calendar-picker-indicator]:hidden
                    ${type === 'date' && !value
                        ? '[&::-webkit-datetime-edit]:opacity-0'
                        : 'text-[#1A1D2E] dark:text-white'
                    }
                    ${type === 'time' && !value ? 'text-[#B6BCCB] dark:text-[#474848]' : ''}
                `}
            />
            <button
                type="button"
                onClick={() => ref.current?.showPicker?.()}
                className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] "
            >
                {icon}
            </button>
        </div>
    )
}
