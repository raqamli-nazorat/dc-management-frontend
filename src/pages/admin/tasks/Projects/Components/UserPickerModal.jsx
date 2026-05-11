import { useEffect, useState } from "react"
import { FaArrowLeft, FaCheck, FaChevronDown, FaXmark } from "react-icons/fa6"
import { Roles } from "../../../../../MostUsesDates"

const labelCls = 'block text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1.5'

export const UserPickerModal = ({ title, selected, onConfirm, onClose, users = [], onSearch }) => {
    const [search, setSearch] = useState('')
    const [temp, setTemp] = useState(selected.map(u => u.id))

    const toggle = (id) => setTemp(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

    const toggleAll = () => {
        if (temp.length === users.length) setTemp([])
        else setTemp(users.map(u => u.id))
    }

    const handleConfirm = () => {
        onConfirm(users.filter(u => temp.includes(u.id)))
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                e.stopImmediatePropagation();
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown, true);
        return () => window.removeEventListener("keydown", handleKeyDown, true);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-black/10" />
            <button onClick={onClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer bg-white/20 text-white hover:bg-white/30">
                <FaXmark size={16} />
            </button>
            <div className="relative w-full min-h-[90vh]! max-w-[600px] rounded-3xl shadow-2xl bg-[var(--bg-base)] flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer">
                            <FaArrowLeft size={16} />
                        </button>
                        <h2 className="text-lg font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">{title}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border  cursor-pointer border-[var(--stroke-sub)] text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                            </svg>
                            Barchini tanlash
                        </button>
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Ism Sharifi bo'yicha izlash"
                                value={search}
                                onChange={e => {
                                    if (e.target.value.length > 0) {
                                        setSearch(e.target.value)
                                    } else {
                                        setSearch("");
                                        onSearch("");
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        onSearch(search);
                                    }
                                }}
                                className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none border bg-[var(--bg-base)] border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-sub)] dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)] focus:border-[var(--accent-sub)]"
                            />
                        </div>
                    </div>
                </div>
                {/* List */}
                <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-2">
                    {users.length === 0 && (
                        <p className="text-sm text-[var(--text-soft)] text-center py-8">Foydalanuvchi topilmadi</p>
                    )}
                    {users.map(u => {
                        const isSelected = temp.includes(u.id)
                        return (
                            <button
                                key={u.id}
                                onClick={() => toggle(u.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border  cursor-pointer text-left 
                                    ${isSelected ?
                                        'bg-[#EEF1FB] border-[#C7D0F5] dark:bg-[var(--bg-elevation-2)] dark:border-[var(--accent-strong)]' :
                                        'bg-[var(--bg-base)] border-[var(--stroke-soft)] hover:bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)] dark:hover:bg-[var(--bg-elevation-1)]'
                                    }
                                `}
                            >
                                {/* Checkbox */}
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                    ${isSelected ?
                                        'bg-[var(--accent-strong)] border-[var(--accent-strong)]' :
                                        'border-[var(--stroke-strong)] dark:border-[var(--stroke-sub)]'
                                    }
                                `}>
                                    {isSelected && <FaCheck size={9} className="text-white" />}
                                </div>

                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-[var(--accent-sub)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent-sub)] shrink-0">
                                    {u.username?.slice(0, 2).toUpperCase()}
                                </div>
                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-[var(--text-strong)] dark:text-[var(--text-strong)] truncate">{u.username}</p>
                                    <p className="text-xs text-[var(--text-soft)] dark:text-[var(--text-sub)] truncate">
                                        {
                                            console.log(u)

                                        }
                                        {u?.position_info?.name || '—'}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] flex items-center justify-between shrink-0">
                    <span className="text-sm text-[var(--text-sub)] dark:text-[var(--text-sub)]">{temp.length} ta tanlangan</span>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setTemp([])}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium  cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]">
                            <FaXmark size={12} /> Tozalash
                        </button>
                        <button onClick={handleConfirm}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold  cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]">
                            <FaCheck size={12} /> Qo'shish
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const SelectedUsersField = ({ label, selected, onOpen, onRemove }) => {
    console.log(selected);
    return (
        <div>
            <label className={labelCls}>{label}</label>
            <div
                onClick={onOpen}
                className="w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer text-left bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)]"
            >
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                    {selected.length === 0 ? (
                        <span className="text-sm text-[var(--text-soft)] dark:text-[var(--text-sub)]">{label}</span>
                    ) : (
                        selected.map(u => (
                            <span
                                key={u.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#EEF1FB] text-[var(--accent-strong)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]"
                            >

                                {u?.username} | {u?.position_info?.name || u?.position}
                                <span
                                    onMouseDown={e => { e.stopPropagation(); onRemove(u.id) }}
                                    className="hover:opacity-70 cursor-pointer ml-0.5 flex items-center">
                                    <FaXmark size={9} />
                                </span>
                            </span>
                        ))
                    )}
                </div>
                <FaChevronDown size={11} className="text-[var(--text-soft)] shrink-0 ml-2" />
            </div>
        </div>
    )
}