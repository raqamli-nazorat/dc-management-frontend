import { useState } from "react"
import { FaArrowLeft, FaCheck, FaChevronDown, FaXmark } from "react-icons/fa6"
import { Roles } from "../../../../../MostUsesDates"

const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'

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

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-black/10" />
            <button onClick={onClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer bg-white/20 text-white hover:bg-white/30">
                <FaXmark size={16} />
            </button>
            <div className="relative w-full min-h-[90vh]! max-w-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111] flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 shrink-0">
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer">
                            <FaArrowLeft size={16} />
                        </button>
                        <h2 className="text-lg font-extrabold text-[#1A1D2E] dark:text-white">{title}</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={toggleAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border  cursor-pointer border-[#E2E6F2] text-[#5B6078] hover:bg-[#F1F3F9] dark:border-[#292A2A] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                            </svg>
                            Barchini tanlash
                        </button>
                        <div className="relative flex-1">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none border bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white dark:placeholder-[#5B6078] focus:border-[#526ED3]"
                            />
                        </div>
                    </div>
                </div>
                {/* List */}
                <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-2">
                    {users.length === 0 && (
                        <p className="text-sm text-[#8F95A8] text-center py-8">Foydalanuvchi topilmadi</p>
                    )}
                    {users.map(u => {
                        const isSelected = temp.includes(u.id)
                        return (
                            <button
                                key={u.id}
                                onClick={() => toggle(u.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border  cursor-pointer text-left 
                                    ${isSelected ?
                                        'bg-[#EEF1FB] border-[#C7D0F5] dark:bg-[#292A2A] dark:border-[#3F57B3]' :
                                        'bg-white border-[#EEF1F7] hover:bg-[#F8F9FC] dark:bg-[#191A1A] dark:border-[#292A2A] dark:hover:bg-[#222323]'
                                    }
                                `}
                            >
                                {/* Checkbox */}
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                                    ${isSelected ?
                                        'bg-[#3F57B3] border-[#3F57B3]' :
                                        'border-[#D0D5E2] dark:border-[#474848]'
                                    }
                                `}>
                                    {isSelected && <FaCheck size={9} className="text-white" />}
                                </div>

                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                                    {u.username?.slice(0, 2).toUpperCase()}
                                </div>
                                {/* Info */}
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-[#1A1D2E] dark:text-white truncate">{u.username}</p>
                                    <p className="text-xs text-[#8F95A8] dark:text-[#5B6078] truncate">
                                        {u?.position_info?.name || '—'}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#EEF1F7] dark:border-[#292A2A] flex items-center justify-between shrink-0">
                    <span className="text-sm text-[#5B6078] dark:text-[#C2C8E0]">{temp.length} ta tanlangan</span>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setTemp([])}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium  cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
                            <FaXmark size={12} /> Tozalash
                        </button>
                        <button onClick={handleConfirm}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold  cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
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
                className="w-full min-h-[42px] flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer text-left bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A] hover:border-[#526ED3]"
            >
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                    {selected.length === 0 ? (
                        <span className="text-sm text-[#8F95A8] dark:text-[#5B6078]">{label}</span>
                    ) : (
                        selected.map(u => (
                            <span
                                key={u.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]"
                            >
                                {u.username} | {u?.position_info?.name || u?.position}
                                <span
                                    onMouseDown={e => { e.stopPropagation(); onRemove(u.id) }}
                                    className="hover:opacity-70 cursor-pointer ml-0.5 flex items-center">
                                    <FaXmark size={9} />
                                </span>
                            </span>
                        ))
                    )}
                </div>
                <FaChevronDown size={11} className="text-[#8F95A8] shrink-0 ml-2" />
            </div>
        </div>
    )
}