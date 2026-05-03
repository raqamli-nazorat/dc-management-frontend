import { useEffect, useRef, useState } from "react"
import { MdCancel, MdCheck, MdExpandMore } from "react-icons/md"

const FilterSelect = ({
    options = [],
    value,
    onChange,
    multiple = false,
    width = '100%',
    disabled,
    title,
    error = false,
    padding = '6px 12px',
    radius = '12px',
    placeholder
}) => {
    const [open, setOpen] = useState(false)
    const [hovered, setHovered] = useState(null)
    const [dropPos, setDropPos] = useState({ top: 0, left: 0, dropUp: false })
    const ref = useRef(null)
    const dropdownRef = useRef(null)

    // Standardize options to [{label, value}]
    const standardizedOptions = options.map(opt =>
        typeof opt === 'object' ? opt : { label: opt, value: opt }
    )

    // Normalize value for logic (always an array of values)
    const getNormalizedValue = () => {
        if (multiple) {
            if (Array.isArray(value)) return value.map(v => String(v));
            if (typeof value === 'string' && value) return value.split(',').filter(Boolean);
            if (value === null || value === undefined) return [];
            return [String(value)];
        }
        return value !== null && value !== undefined ? [String(value)] : [];
    }

    const normalizedValue = getNormalizedValue();

    // Find selected labels for display
    const selectedOptions = standardizedOptions.filter(opt =>
        normalizedValue.includes(String(opt.value))
    )

    const hasValue = multiple ? selectedOptions.length > 0 : !!selectedOptions[0]

    // Asosiy tugma uchun hover holati
    const [isBtnHovered, setIsBtnHovered] = useState(false)

    useEffect(() => {
        const h = (e) => {
            if (ref.current && dropdownRef.current && !ref.current.contains(e.target) && !dropdownRef.current.contains(e.target)) {
                setOpen(false)
            }
        }
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

    const isDark = document.documentElement.classList.contains('dark')

    return (
        <div className="relative" ref={ref} style={{ width }}>
            <button
                type="button"
                onClick={handleToggle}
                onMouseEnter={() => setIsBtnHovered(true)}
                onMouseLeave={() => setIsBtnHovered(false)}
                disabled={disabled}
                className={`flex items-center gap-2 cursor-pointer  bg-white border ${error ? 'border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'} text-[#1A1D2E] dark:bg-[#191a1a] dark:text-[#FFFFFF] disabled:opacity-50 disabled:cursor-default dark:disabled:bg-[#222223]`}
                style={{ fontSize: 13, fontWeight: 500, padding: padding, borderRadius: radius, width: '100%' }}
                title={title}
            >
                {multiple && hasValue ? (
                    <div className="flex items-center gap-2 flex-1 overflow-hidden">
                        <span className="text-[#1A1D2E] dark:text-[#FFFFFF] truncate">{placeholder}</span>
                        <span className="flex items-center justify-center bg-[#F1F3F9] dark:bg-[#303131] text-[#3F57B3] dark:text-[#FFFFFF] rounded-full min-w-[20px] h-5 px-1.5 text-[11px] font-bold">
                            {selectedOptions.length}
                        </span>
                    </div>
                ) : (
                    <>
                        {!hasValue && <span className="text-slate-500 dark:text-slate-400 flex-1 text-left truncate">{placeholder}</span>}
                        {hasValue && <span className="flex-1 text-left truncate">
                            {multiple ? selectedOptions.map(o => o.label).join(', ') : selectedOptions[0]?.label}
                        </span>}
                    </>
                )}

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
                    ref={dropdownRef}
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
                    {standardizedOptions.map((opt) => {
                        const isSelected = normalizedValue.includes(String(opt.value));
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                    if (multiple) {
                                        let newValue;
                                        if (isSelected) {
                                            newValue = normalizedValue.filter(v => v !== String(opt.value));
                                        } else {
                                            newValue = [...normalizedValue, String(opt.value)];
                                        }
                                        // If original value was string (comma-separated), return string
                                        if (typeof value === 'string') {
                                            onChange(newValue.join(','));
                                        } else {
                                            onChange(newValue);
                                        }
                                    } else {
                                        onChange(opt.value);
                                        setOpen(false);
                                    }
                                }}
                                onMouseEnter={() => setHovered(opt.value)}
                                onMouseLeave={() => setHovered(null)}
                                className="w-full text-left px-3 py-2.5 rounded-xl cursor-pointer  flex items-center justify-between gap-2"
                                style={{
                                    fontSize: 13,
                                    fontWeight: 500,
                                    color: isDark ? '#FFFFFF' : '#1A1D2E',
                                    background: isSelected
                                        ? (isDark ? '#303131' : '#F1F3F9')
                                        : hovered === opt.value
                                            ? (isDark ? '#222323' : '#F8F9FC')
                                            : 'transparent',
                                }}
                            >
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt.label}</span>
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