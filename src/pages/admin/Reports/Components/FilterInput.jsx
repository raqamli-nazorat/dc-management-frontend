import { useState } from "react"

export const FilterInput = ({ label, value, onChange, isFine, className = '' }) => {
  const [focused, setFocused] = useState(false)
  const hasValue = value !== '' && value !== null && value !== undefined && value !== 0
  const isActive = focused || hasValue

  const getFontSize = () => {
    if (!isActive) return 14
    const strValue = value?.toString() || ''
    const length = strValue.length
    if (length <= 10) return 14
    if (length <= 12) return 12
    if (length <= 14) return 11
    return 10
  }

  const fontSize = getFontSize()
  const labelWidth = label === 'dan' ? 38 : 52

  return (
    <div
      className={`flex-1 dark:bg-[var(--bg-elevation-1)] border border-slate-200 dark:border-[var(--stroke-soft)] rounded-xl flex flex-col justify-center px-4 h-11 relative cursor-text group ${className}`}
      onClick={() => setFocused(true)}
    >
      <span
        className={`absolute left-4 transition-all duration-200 pointer-events-none font-semibold
          ${isActive
            ? 'top-1.5 text-[10px] text-slate-400'
            : 'top-1/2 -translate-y-1/2 text-sm text-slate-400'
          }`}
      >
        {label}{!isActive && ':'}
      </span>

      <div
        className={`flex items-center transition-all duration-200
          ${isActive
            ? 'translate-y-2'
            : ''
          }`}
        style={{ paddingLeft: isActive ? 0 : `${labelWidth}px` }}
      >
        {isFine && (hasValue || value === 0) && (
          <span className="text-red-500 font-bold mr-0.5" style={{ fontSize: `${fontSize}px` }}>-</span>
        )}

        {!isActive && !focused ? (
          <span className="text-slate-900 dark:text-[var(--text-strong)] text-sm font-medium">0</span>
        ) : (
          <input
            value={value === 0 ? '' : value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={`w-full bg-transparent outline-none font-bold ${isFine ? 'text-red-500!' : 'text-slate-900! dark:text-[var(--text-strong)]!'}`}
            style={{ fontSize: `${fontSize}px` }}
            autoFocus={focused}
            placeholder={focused ? "0" : ""}
          />
        )}
      </div>
    </div>
  )
}