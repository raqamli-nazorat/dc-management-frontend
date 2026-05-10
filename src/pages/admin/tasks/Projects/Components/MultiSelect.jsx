import { useEffect, useRef, useState } from "react"
import { FaCheck, FaXmark } from "react-icons/fa6"
import { Roles } from "../../../../../MostUsesDates"
import { createPortal } from "react-dom"

export const MultiSelect = ({ placeholder, options, selected, onChange, onSearch }) => {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    const toggleItem = (item) => {
        if (selected.find(s => s.username === item.username)) {
            onChange(selected.filter(s => s.username !== item.username))
        } else {
            onChange([...selected, item])
        }
        setQuery('')
    }

    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

    useEffect(() => {
        if (open && ref.current) {
            const update = () => {
                const rect = ref.current.getBoundingClientRect()
                setCoords({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width
                })
            }
            update()
            window.addEventListener('scroll', update, true)
            window.addEventListener('resize', update)
            return () => {
                window.removeEventListener('scroll', update, true)
                window.removeEventListener('resize', update)
            }
        }
    }, [open])

    const remove = (name) => onChange(selected.filter(s => s.username !== name))

    return (
        <div ref={ref}>
            <div
                onClick={() => setOpen(!open)}
                className={`min-h-[42px] w-full relative flex flex-wrap gap-1.5 px-3 py-2 rounded-xl border  cursor-text
              bg-[var(--bg-elevation-1-alt)] border-[var(--stroke-sub)] dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)]
              ${open ? 'border-[var(--accent-sub)] dark:border-[var(--accent-sub)]' : ''}`}>
                {selected.map(s => (
                    <span key={s.username || Math.random()}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium
                  bg-[#EEF1FB] text-[var(--accent-strong)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]">
                        {s?.username || '—'} | {Roles[s?.roles?.[0]] || '—'}
                        <button type="button" onMouseDown={e => { e.stopPropagation(); remove(s.username) }}
                            className="hover:opacity-70 cursor-pointer ml-0.5">
                            <FaXmark size={9} />
                        </button>
                    </span>
                ))}
                {open ? (
                    <input
                        autoFocus
                        value={query}
                        onChange={e => { onSearch(e.target.value); setQuery(e.target.value) }}
                        placeholder={selected.length === 0 ? placeholder : ''}
                        className="flex-1 min-w-[80px] text-sm outline-none bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-soft)]" />
                ) : selected.length === 0 && (
                    <span className="text-sm text-[var(--text-soft)] dark:text-[var(--text-sub)] select-none">{placeholder}</span>
                )}
                {open && options.length > 0 && createPortal(
                    <div
                        style={{
                            position: 'fixed',
                            top: coords.top,
                            left: coords.left,
                            width: coords.width,
                            zIndex: 9999
                        }}
                        className="rounded-2xl shadow-xl border overflow-y-auto max-h-48 bg-[var(--bg-elevation-1-alt)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)]"
                    >
                        {options.map(o => {
                            const isSelected = selected.some(s => s.username === o?.username)
                            return (
                                <button
                                    key={o?.username}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        toggleItem(o)
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] last:border-0 transition-colors
                      ${isSelected ? 'bg-[#EEF1FB] dark:bg-[var(--bg-elevation-2)]' : 'hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-1)]'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                      ${isSelected ? 'bg-[var(--accent-strong)] text-white' : 'bg-[var(--accent-sub)]/20 text-[var(--accent-sub)]'}`}>
                                        {isSelected ? <FaCheck size={10} /> : (o?.username || '??').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium leading-tight truncate ${isSelected ? 'text-[var(--accent-strong)] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)]'}`}>{o?.username || '—'}</p>
                                        <p className="text-xs text-[var(--text-soft)] dark:text-[var(--text-sub)] truncate">{Array.isArray(o?.roles) ? o.roles.map(r => Roles[r] || r).join(', ') : '—'}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="text-[var(--accent-strong)] dark:text-[var(--accent-soft)]">
                                            <FaCheck size={12} />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>,
                    document.body
                )}
            </div>
        </div>
    )
}