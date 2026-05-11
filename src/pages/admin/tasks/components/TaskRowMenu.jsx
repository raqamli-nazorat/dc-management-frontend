import { useState, useEffect, useRef } from 'react'
import { FaEllipsisVertical } from 'react-icons/fa6'

export default function TaskRowMenu({ onDelete, onEdit }) {
  const [open, setOpen]   = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const ref    = useRef(null)
  const btnRef = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropUp(window.innerHeight - rect.bottom < 140)
    }
    setOpen(o => !o)
  }

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button ref={btnRef} onClick={handleOpen}
        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer  text-[var(--text-soft)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
        <FaEllipsisVertical size={14} />
      </button>
      {open && (
        <div className={`absolute right-0 z-50 w-40 rounded-2xl shadow-2xl border overflow-hidden
          bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]
          ${dropUp ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
          <button onClick={() => { onEdit?.(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] cursor-pointer ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[var(--text-sub)] dark:text-[var(--text-sub)]"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            Tahrirlash
          </button>
          <button onClick={() => { onDelete?.(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--error-strong)] hover:bg-[#FFF5F5] dark:hover:bg-[#2A1A1A] cursor-pointer ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            O'chirish
          </button>
        </div>
      )}
    </div>
  )
}
