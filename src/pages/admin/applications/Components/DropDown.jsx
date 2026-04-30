import { useEffect, useRef, useState } from "react"
import { MdCheck, MdExpandMore, MdOutlineClear } from "react-icons/md"

const FilterSelect = ({ options = [], value, onChange, label, multiple = false, width = '100%', disabled, error = false }) => {
    const [open, setOpen] = useState(false)
    const [hovered, setHovered] = useState(null)
    const [dropPos, setDropPos] = useState({ top: 0, right: 0, dropUp: false })
    const ref = useRef(null)

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    const handleToggle = () => {
        if (!open && ref.current) {
            const rect = ref.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom
            const isDropUp = spaceBelow < 220
            // dropdown kengligi: container kengligidan kam bo'lmasin, lekin min 200px
            const dropWidth = Math.max(rect.width, 200)
            const rightPos = rect.right + dropWidth > window.innerWidth - 8
                ? window.innerWidth - dropWidth - 8
                : window.innerWidth - rect.right
            setDropPos({ top: isDropUp ? rect.top - 4 : rect.bottom + 4, right: rightPos, dropUp: isDropUp, dropWidth })
        }
        setOpen(o => !o)
    }

    const display = multiple
        ? (Array.isArray(value) && value.length > 0 ? value.join(', ') : label || options[0])
        : (value || label || options[0])
    const isDark = document.documentElement.classList.contains('dark')

    return (
        <div className="relative" ref={ref} style={{ width }}>
            <button
                type="button"
                onClick={handleToggle}
                disabled={disabled}
                className={`flex items-center gap-2 cursor-pointer transition-colors bg-white border ${display === 'Rad etildi' ? 'border-red-500' : display === 'Qabul qilindi' ? 'border-[#526ED3]' : 'border-[#E2E6F2] dark:border-[#292A2A]'} text-[#1A1D2E] dark:bg-[#222323] dark:text-[#FFFFFF] disabled:opacity-50 disabled:cursor-default disabled:bg-[#F1F3F9]`}
                style={{ fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 12, width: '100%' }}
            >
                {display === "Rad etildi" ? <MdOutlineClear className="text-red-500" size={16} /> : display === "Qabul qilindi" ? <MdCheck className="text-[#526ED3]!" size={16} /> : null}
                <span className={`flex-1 text-left truncate ${display === "Rad etildi" ? "text-red-500!" : display === "Qabul qilindi" ? "text-[#526ED3]!" : ""}`}>{display}</span>
                <MdExpandMore
                    size={16}
                    className={`shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                    style={{ color: isDark ? '#FFFFFF' : '#8F95A8' }}
                />
            </button>

            {open && (
                <div
                    className="rounded-2xl shadow-xl bg-white dark:bg-[#1C1D1D]"
                    style={{
                        position: 'fixed',
                        top: dropPos.dropUp ? 'auto' : dropPos.top,
                        bottom: dropPos.dropUp ? window.innerHeight - dropPos.top : 'auto',
                        right: dropPos.right,
                        border: isDark ? '1px solid #292A2A' : '1px solid #EEF1F7',
                        padding: '6px 8px',
                        width: dropPos.dropWidth || width,
                        maxHeight: 260,
                        overflowY: 'auto',
                        animation: 'dropdownIn 0.18s cubic-bezier(0.16,1,0.3,1)',
                        zIndex: 9999,
                    }}
                >
                    {options.map((opt) => {
                        const isSelected = multiple ? (Array.isArray(value) && value.includes(opt)) : value === opt;
                        return (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                    if (multiple) {
                                        const newVal = Array.isArray(value) ? [...value] : [];
                                        if (newVal.includes(opt)) {
                                            onChange(newVal.filter(v => v !== opt));
                                        } else {
                                            onChange([...newVal, opt]);
                                        }
                                    } else {
                                        onChange(opt); setOpen(false);
                                    }
                                }}
                                onMouseEnter={() => setHovered(opt)}
                                onMouseLeave={() => setHovered(null)}
                                className={`w-full text-left px-3 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2 ${opt === "Rad etish" ? "text-red-500!" : opt === "Qabul qilish" ? "text-[#526ED3]!" : ""}`}
                                style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: isDark ? '#FFFFFF' : '#1A1D2E',
                                    background: isSelected
                                        ? (isDark ? '#303131' : '#F1F3F9')
                                        : hovered === opt
                                            ? (isDark ? '#222323' : '#F8F9FC')
                                            : 'transparent',
                                }}
                            >
                                <span
                                    style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                    className="flex items-center gap-2"
                                >
                                    {opt === "Rad etish" ? <MdOutlineClear className="text-red-500" size={16} /> : opt === "Qabul qilish" ? <MdCheck className="text-[#526ED3]!" size={16} /> : null}
                                    {opt}
                                </span>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default FilterSelect