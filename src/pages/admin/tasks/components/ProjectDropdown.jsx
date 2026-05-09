import { FaXmark, FaChevronDown } from 'react-icons/fa6'
import useDropdown from './useDropdown'
import { labelCls, PROJECTS_LIST } from './constants'

export default function ProjectDropdown({ value, onChange, error }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref}>
      <label className={labelCls}>Loyiha</label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer
            bg-white dark:bg-[#191A1A]
            ${error ? 'border-red-400 dark:border-red-500' : 'border-[var(--stroke-sub)] dark:border-[#292A2A]'}
            ${value ? 'text-[var(--text-strong)] dark:text-white' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}`}>
          <span className="flex-1 text-left truncate">{value || 'Loyiha tanlang'}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {value
              ? <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"><FaXmark size={11} /></span>
              : <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${open ? 'rotate-180' : ''}`} />
            }
          </div>
        </button>
        {error && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-white border-[var(--stroke-sub)] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
            {PROJECTS_LIST.map((p, i) => (
              <button key={p.id} type="button" onClick={() => { onChange(p.name); setOpen(false) }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left  cursor-pointer
                  ${i < PROJECTS_LIST.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                  ${value === p.name ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[#292A2A]'}`}>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${value === p.name ? 'text-[var(--accent-strong)] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-white'}`}>{p.name}</p>
                  <p className="text-xs text-[var(--text-soft)] dark:text-[var(--text-sub)] truncate mt-0.5">{p.desc}</p>
                </div>
                <span className="text-xs text-[var(--text-soft)] dark:text-[var(--text-sub)] shrink-0 ml-3">{p.date}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
