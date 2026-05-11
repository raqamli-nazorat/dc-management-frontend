import { FaXmark, FaChevronDown } from 'react-icons/fa6'
import { useDropdown } from '../useDropdown'
import { labelCls, fmtDate } from '../constants'

/**
 * projects: API dan kelgan massiv — [{ id, title, description, deadline, ... }]
 * value: tanlangan project id (string yoki number)
 * onChange: (id: string) => void
 */
function ProjectList({ projects, value, onChange, setOpen }) {
  if (!projects.length) {
    return (
      <div className="px-4 py-3 text-sm text-[var(--text-soft)] dark:text-[var(--text-sub)]">
        Loyihalar topilmadi
      </div>
    )
  }
  return projects.map((p, i) => (
    <button
      key={p.id}
      type="button"
      onClick={() => { onChange(String(p.id)); setOpen(false) }}
      className={`w-full text-left px-4 py-3  cursor-pointer
        ${i < projects.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''}
        ${String(value) === String(p.id) ? 'bg-[#EEF1FB] dark:bg-[var(--bg-elevation-2)]' : 'hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${String(value) === String(p.id) ? 'text-[var(--accent-strong)] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)]'}`}>
            {p.title}
          </p>
          {p.description && (
            <p className="text-xs text-[var(--text-soft)] dark:text-[var(--text-sub)] truncate mt-0.5">{p.description}</p>
          )}
        </div>
        {p.deadline && (
          <span className="text-xs text-[var(--text-soft)] dark:text-[var(--text-sub)] shrink-0 mt-0.5">
            {fmtDate(p.deadline).split(',')[0]}
          </span>
        )}
      </div>
    </button>
  ))
}

/* Filter modal uchun */
export function LoyihaDropdown({ value, onChange, projects = [], disabled = false }) {
  const { open, setOpen, ref } = useDropdown()
  const selected = projects.find(p => String(p.id) === String(value))

  return (
    <div ref={ref}>
      <label className={labelCls}>Loyiha</label>
      <div className="relative">
        <button type="button" onClick={() => !disabled && setOpen(o => !o)}
          disabled={disabled}
          className={`w-full h-[42px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border
            bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)]
            ${value ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-sub)] dark:text-[var(--text-sub)]'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] pointer-events-none' : 'cursor-pointer'}`}>
          <span className="truncate flex-1 text-left">{selected?.title || 'Loyiha tanlang'}</span>
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
        {open && !disabled && (
          <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden max-h-60 overflow-y-auto
            bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
            <ProjectList projects={projects} value={value} onChange={onChange} setOpen={setOpen} />
          </div>
        )}
      </div>
    </div>
  )
}

/* So'rov modal form uchun (error support) */
export function LoyihaDropdownForm({ value, onChange, error, projects = [], disabled = false }) {
  const { open, setOpen, ref } = useDropdown()
  const selected = projects.find(p => String(p.id) === String(value))

  return (
    <div ref={ref} className="relative">
      <button type="button"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        className={`w-full h-[42px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border 
          bg-[var(--bg-base)]
          ${error ? 'border-red-400 dark:border-red-500' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]'}
          ${value ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}
          ${disabled ? 'opacity-60 cursor-not-allowed bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]' : 'cursor-pointer'}`}>
        <span className="truncate flex-1 text-left">{selected?.title || 'Loyiha tanlang'}</span>
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
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {open && !disabled && (
        <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden max-h-60 overflow-y-auto
          bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
          <ProjectList projects={projects} value={value} onChange={onChange} setOpen={setOpen} />
        </div>
      )}
    </div>
  )
}
