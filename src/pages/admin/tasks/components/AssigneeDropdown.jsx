import { FaXmark, FaChevronDown } from 'react-icons/fa6'
import useDropdown from './useDropdown'
import { labelCls, EMPLOYEES_LIST } from './constants'

export default function AssigneeDropdown({ value, onChange }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref}>
      <label className={labelCls}>Topshiruvchi</label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer
            bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
            ${value ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
          <span className="flex-1 text-left truncate">{value || 'Topshiruvchi'}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {value
              ? <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
              : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
            }
          </div>
        </button>
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
            {EMPLOYEES_LIST.map((e, i) => (
              <button key={e.name} type="button" onClick={() => { onChange(e.name); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left  cursor-pointer
                  ${i < EMPLOYEES_LIST.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                  ${value === e.name ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                <div className="w-7 h-7 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                  {e.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${value === e.name ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white'}`}>{e.name}</p>
                  <p className="text-xs text-[#8F95A8] dark:text-[#5B6078]">{e.role}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
