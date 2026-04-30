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
      <div className="px-4 py-3 text-sm text-[#8F95A8] dark:text-[#C2C8E0]">
        Loyihalar topilmadi
      </div>
    )
  }
  return projects.map((p, i) => (
    <button
      key={p.id}
      type="button"
      onClick={() => { onChange(String(p.id)); setOpen(false) }}
      className={`w-full text-left px-4 py-3 transition-colors cursor-pointer
        ${i < projects.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#292A2A]' : ''}
        ${String(value) === String(p.id) ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${String(value) === String(p.id) ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-[#FFFFFF]'}`}>
            {p.title}
          </p>
          {p.description && (
            <p className="text-xs text-[#8F95A8] dark:text-[#C2C8E0] truncate mt-0.5">{p.description}</p>
          )}
        </div>
        {p.deadline && (
          <span className="text-xs text-[#8F95A8] dark:text-[#C2C8E0] shrink-0 mt-0.5">
            {fmtDate(p.deadline).split(',')[0]}
          </span>
        )}
      </div>
    </button>
  ))
}

/* Filter modal uchun */
export function LoyihaDropdown({ value, onChange, projects = [] }) {
  const { open, setOpen, ref } = useDropdown()
  const selected = projects.find(p => String(p.id) === String(value))

  return (
    <div ref={ref}>
      <label className={labelCls}>Loyiha</label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full h-[42px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
            bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
            ${value ? 'text-[#1A1D2E] dark:text-[#FFFFFF]' : 'text-[#5B6078] dark:text-[#C2C8E0]'}`}>
          <span className="truncate flex-1 text-left">{selected?.title || 'Loyiha tanlang'}</span>
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
          <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden max-h-60 overflow-y-auto
            bg-white border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
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
        className={`w-full h-[42px] flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors
          bg-white dark:bg-[#191A1A]
          ${error ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
          ${value ? 'text-[#1A1D2E] dark:text-[#FFFFFF]' : 'text-[#8F95A8] dark:text-[#C2C8E0]'}
          ${disabled ? 'opacity-60 cursor-not-allowed bg-[#F8F9FC] dark:bg-[#1A1B1B]' : 'cursor-pointer'}`}>
        <span className="truncate flex-1 text-left">{selected?.title || 'Loyiha tanlang'}</span>
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
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {open && !disabled && (
        <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden max-h-60 overflow-y-auto
          bg-white border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
          <ProjectList projects={projects} value={value} onChange={onChange} setOpen={setOpen} />
        </div>
      )}
    </div>
  )
}
