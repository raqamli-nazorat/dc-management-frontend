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
              bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
              ${open ? 'border-[#526ED3] dark:border-[#526ED3]' : ''}`}>
                {selected.map(s => (
                    <span key={s.username}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium
                  bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]">
                        {s?.username} | {Roles[s?.roles[0]]}
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
                        className="flex-1 min-w-[80px] text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white placeholder-[#8F95A8]" />
                ) : selected.length === 0 && (
                    <span className="text-sm text-[#8F95A8] dark:text-[#5B6078] select-none">{placeholder}</span>
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
                        className="rounded-2xl shadow-xl border overflow-y-auto max-h-48 bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B] dark:text-white"
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
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer border-b border-[#F1F3F9] dark:border-[#2A2B2B] last:border-0 transition-colors
                      ${isSelected ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#222323]'}`}>
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                      ${isSelected ? 'bg-[#3F57B3] text-white' : 'bg-[#526ED3]/20 text-[#526ED3]'}`}>
                                        {isSelected ? <FaCheck size={10} /> : o?.username?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium leading-tight truncate ${isSelected ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white'}`}>{o?.username}</p>
                                        <p className="text-xs text-[#8F95A8] dark:text-[#5B6078] truncate">{o?.roles?.map(r => Roles[r])?.join(', ')}</p>
                                    </div>
                                    {isSelected && (
                                        <div className="text-[#3F57B3] dark:text-[#7F95E6]">
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