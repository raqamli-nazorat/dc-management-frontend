import { useState } from "react"
import { FaArrowLeft, FaChevronDown, FaXmark } from "react-icons/fa6"
import { DatePicker, TimePicker, ConfigProvider, theme } from "antd"
import dayjs from "dayjs"
import { useTheme } from "../../../../../context/ThemeContext"

const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'

const ProjectFilterModal = ({ onClose, onApply, initial, users = [], empty_filter = {}, useDropdown }) => {
    const [f, setF] = useState({ ...empty_filter, ...initial })
    const set = (k, v) => setF(p => ({ ...p, [k]: v }))

    const { isDark } = useTheme()

    const mgrDd = useDropdown()
    const empDd = useDropdown()
    const stsDd = useDropdown()

    const managers = users.filter(u => u.roles?.includes('manager'))

    const STATUS_API = [
        { label: 'Rejalashtirilmoqda', value: 'planning' },
        { label: 'Faol', value: 'active' },
        { label: 'Yakunlangan', value: 'completed' },
        { label: 'Bekor qilingan', value: 'cancelled' },
    ]

    const ddBtn = (val) => `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer bg-white dark:bg-[#191A1A] border-[#E2E6F2] dark:border-[#292A2A] ${val ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`
    const ddList = 'absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52 bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]'
    const inputBox = 'flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] '

    const selectedMgr = users.find(u => u.id === f.manager)
    const selectedEmp = users.find(u => u.id === f.employee)

    return (
        <ConfigProvider theme={{ algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="fixed inset-0 bg-black/60" />
                <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer  z-[200]">
                    <FaXmark size={14} />
                </button>
                <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">

                    {/* Header */}
                    <div className="px-7 pt-7 pb-3">
                        <div className="flex items-center gap-3 mb-1.5">
                            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
                                <FaArrowLeft size={17} />
                            </button>
                            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Filtrlash</h2>
                        </div>
                        <p className="text-sm text-[#5B6078]">Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi</p>
                    </div>

                    {/* Body */}
                    <div className="px-7 pb-5 pt-2 flex flex-col gap-4">

                        {/* Menejer + Holati + Xodim */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Menejer */}
                            <div ref={mgrDd.ref}>
                                <label className={labelCls}>Menejer</label>
                                <div className="relative">
                                    <button type="button" onClick={() => mgrDd.setOpen(o => !o)} className={ddBtn(f.manager)}>
                                        <span className="flex-1 text-left truncate">{selectedMgr?.username || 'Tanlang'}</span>
                                        <div className="flex items-center gap-1 shrink-0 ml-1">
                                            {f.manager
                                                ? <span onMouseDown={e => { e.stopPropagation(); set('manager', '') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                                                : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${mgrDd.open ? 'rotate-180' : ''}`} />}
                                        </div>
                                    </button>
                                    {mgrDd.open && (
                                        <div className={ddList}>
                                            {managers.map((u, i) => (
                                                <button key={u.id} type="button" onClick={() => { set('manager', u.id); mgrDd.setOpen(false) }}
                                                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left  cursor-pointer ${i < users.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${f.manager === u.id ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                                                    <div className="w-6 h-6 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-[10px] font-bold text-[#526ED3] shrink-0">
                                                        {(u.username ?? '?').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <p className={`text-sm truncate ${f.manager === u.id ? 'text-[#3F57B3] dark:text-[#7F95E6] font-semibold' : 'text-[#1A1D2E] dark:text-white'}`}>{u.username}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Holati */}
                            <div ref={stsDd.ref}>
                                <label className={labelCls}>Holati</label>
                                <div className="relative">
                                    <button type="button" onClick={() => stsDd.setOpen(o => !o)} className={ddBtn(f.status)}>
                                        <span className="flex-1 text-left truncate">{STATUS_API.find(s => s.value === f.status)?.label || 'Tanlang'}</span>
                                        <div className="flex items-center gap-1 shrink-0 ml-1">
                                            {f.status
                                                ? <span onMouseDown={e => { e.stopPropagation(); set('status', '') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                                                : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${stsDd.open ? 'rotate-180' : ''}`} />}
                                        </div>
                                    </button>
                                    {stsDd.open && (
                                        <div className={ddList}>
                                            {STATUS_API.map((s, i) => (
                                                <button key={s.value} type="button" onClick={() => { set('status', s.value); stsDd.setOpen(false) }}
                                                    className={`w-full px-4 py-2.5 text-left text-sm  cursor-pointer ${i < STATUS_API.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${f.status === s.value ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                                                    {s.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Xodim */}
                            <div ref={empDd.ref}>
                                <label className={labelCls}>Xodim</label>
                                <div className="relative">
                                    <button type="button" onClick={() => empDd.setOpen(o => !o)} className={ddBtn(f.employee)}>
                                        <span className="flex-1 text-left truncate">{selectedEmp?.username || 'Tanlang'}</span>
                                        <div className="flex items-center gap-1 shrink-0 ml-1">
                                            {f.employee
                                                ? <span onMouseDown={e => { e.stopPropagation(); set('employee', '') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                                                : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${empDd.open ? 'rotate-180' : ''}`} />}
                                        </div>
                                    </button>
                                    {empDd.open && (
                                        <div className={ddList}>
                                            {users.map((u, i) => (
                                                <button key={u.id} type="button" onClick={() => { set('employee', u.id); empDd.setOpen(false) }}
                                                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left  cursor-pointer ${i < users.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${f.employee === u.id ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                                                    <div className="w-6 h-6 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-[10px] font-bold text-[#526ED3] shrink-0">
                                                        {(u.username ?? '?').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <p className={`text-sm truncate ${f.employee === u.id ? 'text-[#3F57B3] dark:text-[#7F95E6] font-semibold' : 'text-[#1A1D2E] dark:text-white'}`}>{u.username}</p>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Boshlanish sanasi oralig'i */}
                        <div>
                            <label className={labelCls}>Boshlanish sanasi oralig'i</label>
                            <div className="flex items-center gap-2">
                                <div className={`${inputBox} flex-1 min-w-0`}>
                                    <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">dan:</span>
                                    <DatePicker
                                        format="YYYY-MM-DD"
                                        placeholder="Sana"
                                        value={f.startFromD ? dayjs(f.startFromD) : null}
                                        onChange={(v) => set('startFromD', v ? v.format('YYYY-MM-DD') : '')}
                                        variant="borderless"
                                        className="flex-1 text-xs p-0 bg-transparent text-[#1A1D2E] dark:text-white"
                                        suffixIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
                                    />
                                </div>
                                <div className={`${inputBox} shrink-0`}>
                                    <TimePicker
                                        format="HH:mm"
                                        placeholder="Vaqt"
                                        value={f.startFromT ? dayjs(f.startFromT, 'HH:mm') : null}
                                        onChange={(v) => set('startFromT', v ? v.format('HH:mm') : '')}
                                        variant="borderless"
                                        className="w-[70px] text-xs p-0 bg-transparent text-[#1A1D2E] dark:text-white"
                                        suffixIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                                        showNow={false}
                                    />
                                </div>
                                <div className={`${inputBox} flex-1 min-w-0`}>
                                    <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">gacha:</span>
                                    <DatePicker
                                        format="YYYY-MM-DD"
                                        placeholder="Sana"
                                        value={f.startToD ? dayjs(f.startToD) : null}
                                        onChange={(v) => set('startToD', v ? v.format('YYYY-MM-DD') : '')}
                                        variant="borderless"
                                        className="flex-1 text-xs p-0 bg-transparent text-[#1A1D2E] dark:text-white"
                                        suffixIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
                                    />
                                </div>
                                <div className={`${inputBox} shrink-0`}>
                                    <TimePicker
                                        format="HH:mm"
                                        placeholder="Vaqt"
                                        value={f.startToT ? dayjs(f.startToT, 'HH:mm') : null}
                                        onChange={(v) => set('startToT', v ? v.format('HH:mm') : '')}
                                        variant="borderless"
                                        className="w-[70px] text-xs p-0 bg-transparent text-[#1A1D2E] dark:text-white"
                                        suffixIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                                        showNow={false}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Muddat oralig'i */}
                        <div>
                            <label className={labelCls}>Muddat oralig'i</label>
                            <div className="flex items-center gap-2">
                                <div className={`${inputBox} flex-1 min-w-0`}>
                                    <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">dan:</span>
                                    <DatePicker
                                        format="YYYY-MM-DD"
                                        placeholder="Sana"
                                        value={f.deadFromD ? dayjs(f.deadFromD) : null}
                                        onChange={(v) => set('deadFromD', v ? v.format('YYYY-MM-DD') : '')}
                                        variant="borderless"
                                        className="flex-1 text-xs p-0 bg-transparent text-[#1A1D2E] dark:text-white"
                                        suffixIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
                                    />
                                </div>
                                <div className={`${inputBox} shrink-0`}>
                                    <TimePicker
                                        format="HH:mm"
                                        placeholder="Vaqt"
                                        value={f.deadFromT ? dayjs(f.deadFromT, 'HH:mm') : null}
                                        onChange={(v) => set('deadFromT', v ? v.format('HH:mm') : '')}
                                        variant="borderless"
                                        className="w-[70px] text-xs p-0 bg-transparent text-[#1A1D2E] dark:text-white"
                                        suffixIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                                        showNow={false}
                                    />
                                </div>
                                <div className={`${inputBox} flex-1 min-w-0`}>
                                    <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">gacha:</span>
                                    <DatePicker
                                        format="YYYY-MM-DD"
                                        placeholder="Sana"
                                        value={f.deadToD ? dayjs(f.deadToD) : null}
                                        onChange={(v) => set('deadToD', v ? v.format('YYYY-MM-DD') : '')}
                                        variant="borderless"
                                        className="flex-1 text-xs p-0 bg-transparent text-[#1A1D2E] dark:text-white"
                                        suffixIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
                                    />
                                </div>
                                <div className={`${inputBox} shrink-0`}>
                                    <TimePicker
                                        format="HH:mm"
                                        placeholder="Vaqt"
                                        value={f.deadToT ? dayjs(f.deadToT, 'HH:mm') : null}
                                        onChange={(v) => set('deadToT', v ? v.format('HH:mm') : '')}
                                        variant="borderless"
                                        className="w-[70px] text-xs p-0 bg-transparent text-[#1A1D2E] dark:text-white"
                                        suffixIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                                        showNow={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-7 py-5 flex items-center justify-end gap-3 border-t border-[#F1F3F9] dark:border-[#292A2A]">
                        <button onClick={() => setF(empty_filter)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
                            <FaXmark size={13} /> Tozalash
                        </button>
                        <button onClick={() => onApply(f)}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            Qidirish
                        </button>
                    </div>
                </div>
            </div>
        </ConfigProvider>
    )
}

export default ProjectFilterModal