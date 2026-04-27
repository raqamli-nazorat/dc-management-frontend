import { useEffect, useRef, useState } from "react"
import { MdCancel, MdCheck, MdExpandMore } from "react-icons/md"

const FilterSelect = ({ options = [], value, onChange, label, multiple = false, width = '100%', disabled, title, error = false }) => {
    const [open, setOpen] = useState(false)
    const [hovered, setHovered] = useState(null)
    const [dropPos, setDropPos] = useState({ top: 0, left: 0, dropUp: false })
    const ref = useRef(null)

    // Asosiy tugma uchun hover holati
    const [isBtnHovered, setIsBtnHovered] = useState(false)

    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', h)
        return () => document.removeEventListener('mousedown', h)
    }, [])

    const handleToggle = () => {
        if (disabled) return
        if (!open && ref.current) {
            const rect = ref.current.getBoundingClientRect()
            const spaceBelow = window.innerHeight - rect.bottom
            const isDropUp = spaceBelow < 220
            const dropWidth = Math.max(rect.width, 200)
            const leftPos = rect.left + dropWidth > window.innerWidth - 8
                ? window.innerWidth - dropWidth - 8
                : rect.left
            setDropPos({ top: isDropUp ? rect.top - 4 : rect.bottom + 4, left: leftPos, dropUp: isDropUp, dropWidth })
        }
        setOpen(o => !o)
    }

    // Qiymatni tozalash funksiyasi
    const handleClear = (e) => {
        e.stopPropagation()
        onChange(multiple ? [] : null)
    }

    // Qiymat mavjudligini tekshirish
    const hasValue = multiple ? (Array.isArray(value) && value.length > 0) : (value && value !== options[0])

    const display = multiple
        ? (Array.isArray(value) && value.length > 0 ? value.join(', ') : label || options[0])
        : (value || label || options[0])

    const isDark = document.documentElement.classList.contains('dark')

    return (
        <div className="relative" ref={ref} style={{ width }}>
            <button
                type="button"
                onClick={handleToggle}
                onMouseEnter={() => setIsBtnHovered(true)}
                onMouseLeave={() => setIsBtnHovered(false)}
                disabled={disabled}
                className={`flex items-center gap-2 cursor-pointer transition-colors bg-white border ${error ? 'border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'} text-[#1A1D2E] dark:bg-[#191a1a] dark:text-[#FFFFFF] disabled:opacity-50 disabled:cursor-default dark:disabled:bg-[#222223]`}
                style={{ fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 12, width: '100%' }}
                title={title}
            >
                <span className="flex-1 text-left truncate">{display}</span>

                {/* Ant Design uslubidagi krestik logikasi */}
                <div className="flex items-center justify-center w-4 h-4 shrink-0">
                    <MdExpandMore
                        size={16}
                        className={`absolute transition-all duration-300 ease-in-out ${(hasValue && isBtnHovered) ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                            } ${open ? 'rotate-180' : ''}`}
                        style={{ color: isDark ? '#FFFFFF' : '#8F95A8' }}
                    />

                    <MdCancel
                        size={16}
                        onClick={handleClear}
                        className={`absolute cursor-pointer transition-all duration-300 ease-in-out hover:text-red-500 ${(hasValue && isBtnHovered) ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
                            }`}
                        style={{ color: isDark ? '#FFFFFF' : '#8F95A8' }}
                    />
                </div>
            </button>

            {open && (
                <div
                    className="rounded-2xl shadow-xl bg-white dark:bg-[#1C1D1D]"
                    style={{
                        position: 'fixed',
                        top: dropPos.dropUp ? 'auto' : dropPos.top,
                        bottom: dropPos.dropUp ? window.innerHeight - dropPos.top : 'auto',
                        left: dropPos.left,
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
                                className="w-full text-left px-3 py-2.5 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2"
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
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt}</span>
                                {multiple && isSelected && <MdCheck size={16} className="text-[#3F57B3]" />}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export default FilterSelect