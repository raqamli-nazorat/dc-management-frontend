import { useEffect, useState } from "react"
import { FaArrowLeft, FaChevronDown, FaXmark } from "react-icons/fa6"
import { DatePicker, TimePicker, ConfigProvider, theme } from "antd"
import dayjs from "dayjs"
import { useTheme } from "../../../../../context/ThemeContext"
import { useAuth } from "../../../../../context/AuthContext"
import { axiosAPI } from "../../../../../service/axiosAPI"
import { toast } from "../../../../../Toast/ToastProvider"

const labelCls = 'block text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1.5'

const ProjectFilterModal = ({ onClose, onApply, initial, users = [], empty_filter = {}, useDropdown }) => {
    const { user } = useAuth()

    const [f, setF] = useState({ ...empty_filter, ...initial })
    const set = (k, v) => setF(p => ({ ...p, [k]: v }))

    const { isDark } = useTheme()

    const [employees, setEmployees] = useState([])

    useEffect(() => {
        if (user.active_role === "employee") {
            axiosAPI.get(`users/all/?roles=manager`)
                .then(res => {
                    setEmployees(res.data.data.results)
                })
                .catch(err => {
                    console.error(err)
                    toast.error(err.response.data.error.errorMsg)
                })
        } else if (user.active_role === "manager") {
            axiosAPI.get(`users/all/?roles=employee`)
                .then(res => {
                    setEmployees(res.data.data.results)
                })
                .catch(err => {
                    console.error(err)
                    toast.error(err.response.data.error.errorMsg)
                })
        }
    }, [user])


    const mgrDd = useDropdown()
    const empDd = useDropdown()
    const stsDd = useDropdown()

    const managers = user.active_role === "manager" ? users.filter(u => u.id === user.id) || [] : users.filter(u => u.roles?.includes('manager'))

    const STATUS_API = [
        { label: 'Rejalashtirilmoqda', value: 'planning' },
        { label: 'Faol', value: 'active' },
        { label: 'Yakunlangan', value: 'completed' },
        { label: 'Bekor qilingan', value: 'cancelled' },
    ]

    const ddBtn = (val) => `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] ${val ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}`
    const ddList = 'absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52 bg-[var(--bg-elevation-1-alt)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]'
    const inputBox = 'flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-base)] focus-within:border-[var(--accent-sub)] '

    const selectedMgr = users.find(u => u.id === f.manager)
    const selectedEmp = users.find(u => u.id === f.employee)

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);


    return (
        <ConfigProvider
            theme={{
                algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
                token: {
                    borderRadius: 12,
                    colorPrimary: '#7186ED',
                    motion: false,
                    colorTextPlaceholder: isDark ? '#90a1b9' : '#62748e',
                    colorBgContainer: isDark ? '#161b22' : '#ffffff',
                    colorBgElevated: isDark ? '#161b22' : '#ffffff',
                },
                components: {
                    Select: {
                        selectorBg: isDark ? '#161b22' : '#ffffff',
                        optionSelectedBg: isDark ? '#21262d' : '#F1F3F9',
                        optionActiveBg: isDark ? '#1c2128' : 'var(--bg-elevation-1)',
                    },
                    DatePicker: {
                        controlItemBgActive: isDark ? '#21262d' : 'var(--bg-elevation-1)',
                    }
                }
            }}
        >
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="fixed inset-0 bg-black/60" />
                <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer  z-[200]">
                    <FaXmark size={14} />
                </button>
                <div className="relative w-full max-w-[660px] rounded-3xl shadow-2xl bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-base)]">

                    {/* Header */}
                    <div className="px-7 pt-7 pb-3">
                        <div className="flex items-center gap-3 mb-1.5">
                            <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
                                <FaArrowLeft size={17} />
                            </button>
                            <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Filtrlash</h2>
                        </div>
                        <p className="text-sm text-[var(--text-sub)]">Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi</p>
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
                                                ? <span onMouseDown={e => { e.stopPropagation(); set('manager', '') }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"><FaXmark size={11} /></span>
                                                : <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${mgrDd.open ? 'rotate-180' : ''}`} />}
                                        </div>
                                    </button>
                                    {mgrDd.open && (
                                        <div className={ddList}>
                                            {(user.active_role === "manager" ? [user] : user.active_role === "employee" ? employees : managers).map((u, i, arr) => (
                                                <button key={u.id} type="button" onClick={() => { set('manager', u.id); mgrDd.setOpen(false) }}
                                                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left  cursor-pointer ${i < arr.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''} ${f.manager === u.id ? 'bg-[#EEF1FB] dark:bg-[var(--bg-elevation-2)]' : 'hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'}`}>
                                                    <div className="w-6 h-6 rounded-full bg-[var(--accent-sub)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--accent-sub)] shrink-0">
                                                        {(u.username ?? '?').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <p className={`text-sm truncate ${f.manager === u.id ? 'text-[var(--accent-strong)] dark:text-[var(--accent-soft)] font-semibold' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)]'}`}>{u.username}</p>
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
                                                ? <span onMouseDown={e => { e.stopPropagation(); set('status', '') }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"><FaXmark size={11} /></span>
                                                : <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${stsDd.open ? 'rotate-180' : ''}`} />}
                                        </div>
                                    </button>
                                    {stsDd.open && (
                                        <div className={ddList}>
                                            {STATUS_API.map((s, i) => (
                                                <button key={s.value} type="button" onClick={() => { set('status', s.value); stsDd.setOpen(false) }}
                                                    className={`w-full px-4 py-2.5 text-left text-sm  cursor-pointer ${i < STATUS_API.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''} ${f.status === s.value ? 'bg-[#EEF1FB] text-[var(--accent-strong)] font-semibold dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'}`}>
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
                                                ? <span onMouseDown={e => { e.stopPropagation(); set('employee', '') }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"><FaXmark size={11} /></span>
                                                : <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${empDd.open ? 'rotate-180' : ''}`} />}
                                        </div>
                                    </button>
                                    {empDd.open && (
                                        <div className={ddList}>
                                            {(user.active_role === "manager" ? employees : user.active_role === "employee" ? [user] : users).map((u, i, arr) => (
                                                <button key={u.id} type="button" onClick={() => { set('employee', u.id); empDd.setOpen(false) }}
                                                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left  cursor-pointer ${i < arr.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''} ${f.employee === u.id ? 'bg-[#EEF1FB] dark:bg-[var(--bg-elevation-2)]' : 'hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'}`}>
                                                    <div className="w-6 h-6 rounded-full bg-[var(--accent-sub)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--accent-sub)] shrink-0">
                                                        {(u.username ?? '?').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <p className={`text-sm truncate ${f.employee === u.id ? 'text-[var(--accent-strong)] dark:text-[var(--accent-soft)] font-semibold' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)]'}`}>{u.username}</p>
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
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-2">
                                    <div className={`${inputBox} flex-1 min-w-0`}>
                                        <span className="text-xs text-[var(--text-sub)] dark:text-[var(--text-sub)] shrink-0 select-none">dan:</span>
                                        <DatePicker
                                            format="DD.MM.YYYY"
                                            placeholder=""
                                            value={f.startFromD ? dayjs(f.startFromD) : null}
                                            onChange={(v) => set('startFromD', v ? v.format('YYYY-MM-DD') : '')}
                                            variant="borderless"
                                            className="flex-1 text-xs p-0 bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)]"
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
                                            className="w-[85px] text-xs p-0 bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)]"
                                            suffixIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                                            showNow={false}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`${inputBox} flex-1 min-w-0`}>
                                        <span className="text-xs text-[var(--text-sub)] dark:text-[var(--text-sub)] shrink-0 select-none">gacha:</span>
                                        <DatePicker
                                            format="DD.MM.YYYY"
                                            placeholder=""
                                            value={f.startToD ? dayjs(f.startToD) : null}
                                            onChange={(v) => set('startToD', v ? v.format('YYYY-MM-DD') : '')}
                                            variant="borderless"
                                            className="flex-1 text-xs p-0 bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)]"
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
                                            className="w-[85px] text-xs p-0 bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)]"
                                            suffixIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                                            showNow={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Muddat oralig'i */}
                        <div>
                            <label className={labelCls}>Muddat oralig'i</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2">
                                    <div className={`${inputBox} flex-1 min-w-0`}>
                                        <span className="text-xs text-[var(--text-sub)] dark:text-[var(--text-sub)] shrink-0 select-none">dan:</span>
                                        <DatePicker
                                            format="DD.MM.YYYY"
                                            placeholder=""
                                            value={f.deadFromD ? dayjs(f.deadFromD) : null}
                                            onChange={(v) => set('deadFromD', v ? v.format('YYYY-MM-DD') : '')}
                                            variant="borderless"
                                            className="flex-1 text-xs p-0 bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)]"
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
                                            className="w-[85px] text-xs p-0 bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)]"
                                            suffixIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                                            showNow={false}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`${inputBox} flex-1 min-w-0`}>
                                        <span className="text-xs text-[var(--text-sub)] dark:text-[var(--text-sub)] shrink-0 select-none">gacha:</span>
                                        <DatePicker
                                            format="DD.MM.YYYY"
                                            placeholder=""
                                            value={f.deadToD ? dayjs(f.deadToD) : null}
                                            onChange={(v) => set('deadToD', v ? v.format('YYYY-MM-DD') : '')}
                                            variant="borderless"
                                            className="flex-1 text-xs p-0 bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)]"
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
                                            className="w-[85px] text-xs p-0 bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)]"
                                            suffixIcon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
                                            showNow={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-7 py-5 flex items-center justify-end gap-3 ">
                        <button onClick={() => setF(empty_filter)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1-alt)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]">
                            <FaXmark size={13} /> Tozalash
                        </button>
                        <button onClick={() => onApply(f)}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]">
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