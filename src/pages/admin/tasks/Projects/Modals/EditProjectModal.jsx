import { useEffect, useState } from "react"
import { FaXmark, FaArrowLeft, FaChevronDown } from 'react-icons/fa6'
import dayjs from 'dayjs'
import { DatePicker, TimePicker, ConfigProvider, theme } from 'antd'
import { useTheme } from "../../../../../context/ThemeContext"
import { FiCalendar, FiPlus } from "react-icons/fi"
import { IoCloseCircle } from "react-icons/io5"
import { axiosAPI } from "../../../../../service/axiosAPI"
import { toast } from "../../../../../Toast/ToastProvider"
import { SelectedUsersField, UserPickerModal } from "../Components/UserPickerModal"
import { useAuth } from "../../../../../context/AuthContext"

const labelCls = 'block text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1.5'

const EditProjectModal = ({ id, onClose, refreshData, useDropdown, STATUS_LABEL }) => {
    const { user } = useAuth()

    const { isDark } = useTheme()
    const [employees, setEmployees] = useState([])
    const [mgrQuery, setMgrQuery] = useState('')

    const [project, setProject] = useState({})
    const [loading, setLoading] = useState(false)


    const [pickerOpen, setPickerOpen] = useState(null)

    const [errors, setErrors] = useState({})

    const { open: statusOpen, setOpen: setStatusOpen, ref: statusRef } = useDropdown()
    const { open: mgrOpen, setOpen: setMgrOpen, ref: mgrRef } = useDropdown()

    const getProject = async () => {
        setLoading(true)
        try {
            const { data } = await axiosAPI.get(`projects/${id}/`)

            if (data.success && data?.data?.id) {
                const { data: links } = await axiosAPI.get(`project-documents/?project=${id}`)
                setProject({ ...data.data, links: links.data.results || [] })
            } else {
                setProject(data.data)
            }
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.error?.errorMsg || "Xodimlar olinmadi")
        } finally {
            setTimeout(() => {
                setLoading(false)
            }, 150);
        }
    }

    useEffect(() => {
        getProject()
    }, [id])

    const fmtBonus = (raw, key) => {
        if (!raw) return ""

        let val = raw.toString().replace(/[^0-9.]/g, "")
        if (key === "penalty" && Number(val) > 100) {
            val = "100"
        }

        const dots = val.split(".")
        if (dots.length > 2) {
            val = dots[0] + "." + dots.slice(1).join("")
        }
        const [int, dec] = val.split(".")
        const fmtInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
        return dec !== undefined ? `${fmtInt}.${dec.slice(0, 2)}` : fmtInt
    }

    const normalizePercentInput = (raw) => {
        const cleaned = String(raw || '').replace(/,/g, '.').replace(/[^\d.]/g, '')
        if (!cleaned) return ''
        const firstDot = cleaned.indexOf('.')
        const normalized = firstDot === -1
            ? cleaned
            : `${cleaned.slice(0, firstDot)}.${cleaned.slice(firstDot + 1).replace(/\./g, '')}`
        const [intPartRaw = '', decRaw = ''] = normalized.split('.')
        const intPart = intPartRaw.replace(/^0+(?=\d)/, '') || '0'

        if (firstDot === -1) {
            return Number(intPart) > 100 ? '100' : intPart
        } else {
            const limitedDec = decRaw.slice(0, 2)
            const resultStr = `${intPart}.${limitedDec}`
            return Number(resultStr) > 100 ? '100' : resultStr
        }
    }

    const [form, setForm] = useState({
        title: '',
        prefix: '',
        status: '',
        description: '',
        manager: '',
        manager_id: null,
        bonus: '',
        penalty_percentage: '',
        employees: [],
        testers: [],
        deadline: '',
        time: '',
        is_hidden: true,
        links: [{ name: '', value: '' }],
    })
    const [deletedIds, setDeletedIds] = useState([]);

    useEffect(() => {
        if (project && Object.keys(project).length > 0) {
            setForm({
                title: project?.title || '',
                prefix: project?.prefix || '',
                status: project?.status || '',
                description: project?.description || '',
                manager: project?.manager_info?.username || '',
                manager_id: project?.manager_info?.id || null,
                bonus: project?.project_price ? fmtBonus(project.project_price) : '',
                penalty_percentage: project?.penalty_percentage ? fmtBonus(project.penalty_percentage, "penalty") : '',
                employees: project?.employees_info || [],
                testers: project?.testers_info || [],
                deadline: project?.deadline ? project.deadline.slice(0, 10) : '',
                time: project?.deadline ? project.deadline.slice(11, 16) : '',
                is_hidden: project?.is_hidden !== null ? project?.is_hidden : true,
                links: project?.links?.length > 0
                    ? project.links.map(d => ({ name: d.name, value: d.value, id: d.id }))
                    : [{ name: '', value: '' }],
            })
        }
    }, [project])

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

    const validate = () => {
        const e = {}
        if (!form.title.trim()) e.title = true
        if (!form.prefix?.trim()) e.prefix = true
        if (!form.status) e.status = true
        if (!form.manager) e.manager = true
        if (!form.bonus) e.bonus = true
        if (!form.penalty_percentage) e.penalty_percentage = true
        if (!form.deadline) e.deadline = true
        if (!form.time) e.time = true

        const linkErrors = form.links.map(item => {
            const hasName = !!item.name?.trim();
            const hasLink = !!item.value?.trim();

            if ((hasName && !hasLink) || (!hasName && hasLink)) {
                return {
                    name: !hasName,
                    value: !hasLink
                };
            }
            return null;
        });
        if (linkErrors.some(el => el)) e.links = linkErrors;

        setErrors(e)
        return Object.keys(e).length === 0
    }

    const saveChanges = async () => {
        if (!validate()) return
        try {
            const payload = {
                title: form.title,
                prefix: form.prefix,
                status: form.status,
                description: form.description,
                manager: form.manager_id,
                project_price: Number(form.bonus.toString().replace(/\s/g, '')) || 0,
                penalty_percentage: Number(form.penalty_percentage.toString().replace(/\s/g, '')) || 0,
                employees: form.employees?.map((emp) => emp.id),
                testers: form.testers?.map((tst) => tst.id),
                deadline: form.deadline && form.time ? dayjs(dayjs(form.deadline).format('YYYY-MM-DD') + ' ' + (typeof form.time === 'string' ? form.time : form.time.format('HH:mm'))).toISOString() : form.deadline,
                is_hidden: form.is_hidden,
            }

            const res = await axiosAPI.patch(`projects/${project.id}/`, payload)
            if (res.status === 200) {

                const projectId = res?.data?.data?.id || project.id;

                if (deletedIds.length > 0) {
                    const deletePromises = deletedIds.map(docId => axiosAPI.delete(`project-documents/${docId}/`));
                    await Promise.all(deletePromises);
                }

                const linkPromises = form.links
                    .filter(item => item.name.trim() || item.link.trim())
                    .map((item, index) => {
                        const docId = item.id;
                        const docData = {
                            project: projectId,
                            name: item.name || `Hujjat ${index + 1}`,
                            value: item.value
                        };

                        if (docId) {
                            return axiosAPI.patch(`project-documents/${docId}/`, docData);
                        } else {
                            return axiosAPI.post(`project-documents/`, docData);
                        }
                    });

                await Promise.all(linkPromises);

                toast.success('Malumotlar saqlandi');
                onClose();
                refreshData();
            }
        } catch (error) {
            console.error(error)
            const errData = error?.response?.data?.error;

            let errMsg = errData?.errorMsg || "Xatolik yuz berdi";
            if (errData?.details && typeof errData.details === 'object') {
                const detailMsgs = Object.values(errData.details).flat().join(' ');
                if (detailMsgs) errMsg = detailMsgs;
            } else if (errData?.errorMsg) {
                errMsg = errData.errorMsg;
            } else if (typeof error?.response?.data === 'string') {
                errMsg = error.response.data;
            }

            toast.error('Malumotlar o\'zgartirilmadi', errMsg);
        }
    }

    const getEmployee = async (search) => {
        const searchTerm = typeof search === 'object' ? search.search : search
        try {
            const { data } = await axiosAPI.get("users/", { params: { search: searchTerm, roles: "employee" } })

            setEmployees(data.data.results || [])
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.error?.errorMsg || "Xodimlar olinmadi")
        }
    }

    useEffect(() => {
        getEmployee({ search: '' })
    }, [])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const inputCls = (err) =>
        `w-full px-3 py-2.5 rounded-xl text-sm outline-none border 
    bg-[var(--bg-base)] text-[var(--text-strong)] placeholder-[var(--text-sub)]
    dark:bg-[var(--bg-base)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)]
    ${err ? 'border-red-400 dark:border-red-500' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] focus:border-[var(--accent-sub)]'}`

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="fixed inset-0 bg-black/60" />
                <button onClick={onClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer bg-white/20 text-white hover:bg-white/30">
                    <FaXmark size={16} />
                </button>
                <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-[var(--bg-base)]">

                    {/* Header */}
                    <div className="px-7 pt-7 pb-4 sticky top-0 z-20 rounded-t-2xl bg-[var(--bg-base)]">
                        <div className="flex items-center gap-3 mb-1">
                            <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
                                <FaArrowLeft size={17} />
                            </button>
                            <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Loyiha tahrirlash</h2>
                        </div>
                        <p className="text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)]">Loyiha ma'lumotlarini yangilash uchun o'zgartirishlar kiriting</p>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center gap-5 h-[500px]">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <p className="text-sm text-[var(--text-sub)] dark:text-[var(--text-sub)]"> Ma'lumotlar yuklanmoqda...</p>
                        </div>
                    ) : (
                        <div className="px-7 pb-4 flex flex-col gap-4 h-[500px] max-h-[70vh] overflow-y-auto">
                            {/* Nomi + Holati */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Nomi</label>
                                    <input value={form.title} onChange={e => set('title', e.target.value)}
                                        placeholder="Nomi kiriting" className={inputCls(errors.title)} />
                                    {errors.title && <p className="text-red-500 text-xs mt-1 ml-1">* Ushbu maydonni to'ldirish majburiy</p>}
                                </div>
                                <div ref={statusRef}>
                                    <label className={labelCls}>Holati</label>
                                    <div className="relative">
                                        <button type="button" onClick={() => setStatusOpen(o => !o)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer
                    bg-[var(--bg-base)]
                    ${errors.status ? 'border-red-400 dark:border-red-500' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]'}
                    ${form.status ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}`}>
                                            <span>{STATUS_LABEL[form.status] || 'Holati tanlang'}</span>
                                            <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {statusOpen && (
                                            <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
                                                {Object.values(STATUS_LABEL).filter(s => s !== "Muddati o'tgan").map((s, i) => (
                                                    <button key={s} type="button" onClick={() => { set('status', Object.keys(STATUS_LABEL).find(key => STATUS_LABEL[key] === s)); setStatusOpen(false) }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm  cursor-pointer
                          ${i < Object.values(STATUS_LABEL).length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''}
                          ${form.status === s ? 'bg-[#EEF1FB] text-[var(--accent-strong)] font-semibold dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'}`}>
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {errors.status && <p className="text-red-500 text-xs mt-1 ml-1">* Ushbu maydonni to'ldirish majburiy</p>}
                                </div>
                            </div>

                            {/* Tavsifi */}
                            <div>
                                <label className={labelCls}>Tavsifi</label>
                                <div className="relative">
                                    <textarea value={form.description} onChange={e => set('description', e.target.value)}
                                        placeholder="Tavsifni yozing" rows={3}
                                        className={inputCls(false) + ' resize-none'} />
                                    {form.description && (
                                        <button type="button" onClick={() => set('description', '')}
                                            className="absolute top-2.5 right-2.5 text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer">
                                            <FaXmark size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Menejer + Bonus */}
                            <div className="grid grid-cols-2 gap-4">
                                <div ref={mgrRef}>
                                    <label className={labelCls}>Menejer</label>
                                    <div className="relative">
                                        <div onClick={() => setMgrOpen(!mgrOpen)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border cursor-pointer
                    bg-[var(--bg-base)]
                    ${errors.manager ? 'border-red-400 dark:border-red-500' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]'} ${mgrOpen ? 'border-[var(--accent-sub)]' : ''}`}>
                                            {mgrOpen ? (
                                                <input
                                                    autoFocus
                                                    placeholder="Menejer qidirish..."
                                                    value={mgrQuery}
                                                    onChange={e => {
                                                        setMgrQuery(e.target.value)
                                                        getEmployee({ search: e.target.value })
                                                    }}
                                                    className="flex-1 outline-none bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-sub)]"
                                                />
                                            ) : (
                                                <span className={form.manager ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}>
                                                    {form.manager || 'Menejer tanlang'}
                                                </span>
                                            )}
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                {form.manager && !mgrOpen && (
                                                    <span onMouseDown={e => { e.stopPropagation(); setForm(p => ({ ...p, manager: '', manager_id: null })) }}
                                                        className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"><FaXmark size={11} /></span>
                                                )}
                                                <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${mgrOpen ? 'rotate-180' : ''}`} />
                                            </div>
                                        </div>
                                        {mgrOpen && (
                                            <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-44 bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
                                                {employees.filter(e => e.roles?.includes('manager')).map((u, i) => (
                                                    <button key={u.id} type="button" onClick={() => { setForm(p => ({ ...p, manager: u.username, manager_id: u.id })); setMgrOpen(false); setMgrQuery('') }}
                                                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer ${i < employees.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''} ${form.manager === u.username ? 'bg-[#EEF1FB] text-[var(--accent-strong)] font-semibold dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'}`}>
                                                        <div className="w-6 h-6 rounded-full bg-[var(--accent-sub)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--accent-sub)] shrink-0">
                                                            {u.username?.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0 text-left">
                                                            <p className="truncate">{u.username}</p>
                                                            {u.position && <p className="text-xs text-[var(--text-soft)] truncate">{u.position}</p>}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {errors.manager && <p className="text-red-500 text-xs mt-1 ml-1">* Ushbu maydonni to'ldirish majburiy</p>}
                                </div>
                                <div>
                                    <label className={labelCls}>Loyiha narxi (UZS)</label>
                                    <input value={form.bonus} onChange={e => set('bonus', fmtBonus(e.target.value))}
                                        placeholder="Loyiha uchun: 0,0"
                                        className={inputCls(errors.bonus) + ' text-right font-bold'} />
                                    {errors.bonus && <p className="text-red-500 text-xs mt-1 ml-1">* Ushbu maydonni to'ldirish majburiy</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelCls}>Titul</label>
                                    <input
                                        value={form.prefix}
                                        onChange={e => set('prefix', e.target.value.toUpperCase())}
                                        placeholder="Titul kiriting"
                                        className={inputCls(errors.prefix)}
                                        maxLength={3}
                                    />
                                    {errors.prefix && <p className="text-red-500 text-xs mt-1 ml-1">* Ushbu maydonni to'ldirish majburiy</p>}
                                </div>

                                <div>
                                    <label className={labelCls}>Jarima foizi (%)</label>
                                    <input
                                        inputMode="decimal"
                                        value={form.penalty_percentage}
                                        onChange={e => set('penalty_percentage', normalizePercentInput(e.target.value))}
                                        placeholder="0,0"
                                        className={inputCls(errors.penalty_percentage)}
                                    />
                                    {errors.penalty_percentage && <p className="text-red-500 text-xs mt-1 ml-1">* Ushbu maydonni to'ldirish majburiy</p>}
                                </div>
                            </div>

                            {/* Xodimlar */}
                            <SelectedUsersField
                                label="Xodimlar"
                                selected={form.employees}
                                onOpen={() => setPickerOpen('employees')}
                                onRemove={id => set('employees', form.employees.filter(u => u.id !== id))}
                            />

                            <SelectedUsersField
                                label="Sinovchilar"
                                selected={form.testers}
                                onOpen={() => setPickerOpen('testers')}
                                onRemove={id => set('testers', form.testers.filter(u => u.id !== id))}
                            />


                            {/* Muddati + Vaqti */}
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
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelCls}>Muddati</label>
                                        <DatePicker
                                            value={form.deadline ? dayjs(form.deadline) : null}
                                            onChange={(val) => setForm(p => ({
                                                ...p,
                                                deadline: val,
                                                time: (val && !p.time) ? dayjs('23:59', 'HH:mm') : p.time
                                            }))}
                                            getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                            className="w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[var(--stroke-soft)]! rounded-xl! text-sm dark:text-[var(--text-strong)]! dark:bg-[#0d1117]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]!"
                                            suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[var(--text-soft)]" />}
                                            allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[var(--text-soft)]" /> }}
                                            format="DD.MM.YYYY"
                                            placeholder="Muddati tanlang"
                                        />
                                        {errors.deadline && <p className="text-red-500 text-xs mt-1 ml-1">* Ushbu maydonni to'ldirish majburiy</p>}
                                    </div>
                                    <div>
                                        <label className={labelCls}>Vaqti</label>
                                        <TimePicker
                                            value={form.time ? dayjs(form.time, 'HH:mm') : null}
                                            onChange={(val) => set('time', val)}
                                            getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                            className={`w-full h-11 px-4 bg-slate-50 border border-slate-200! dark:border-[var(--stroke-soft)]! rounded-xl! text-sm dark:text-[var(--text-strong)]! dark:bg-[#0d1117]! outline-none! focus:outline-none! focus:shadow-none! hover:border-slate-200! dark:hover:border-[#292A2A]! ${errors.time ? 'border-red-500!' : ''}`}
                                            suffixIcon={<FiCalendar size={16} className="text-slate-400 dark:text-[var(--text-soft)]" />}
                                            allowClear={{ clearIcon: <IoCloseCircle size={15} className="text-slate-400 dark:text-[var(--text-soft)]" /> }}
                                            format="HH:mm"
                                            placeholder="00:00"
                                            maxLength={5}
                                        />
                                        {errors.time && <p className="text-red-500 text-xs mt-1 ml-1">* Ushbu maydonni to'ldirish majburiy</p>}
                                    </div>
                                </div>
                            </ConfigProvider>

                            <div className="flex flex-col gap-3">
                                <label className={labelCls + "mb-0!"}>Loyiha hujjatlari</label>
                                {form.links?.map((item, index) => {
                                    return (
                                        <div key={index} className="flex flex-col gap-1.5">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1">
                                                    <input
                                                        className={inputCls(errors.links?.[index]?.name)}
                                                        placeholder="Nomini kiriting"
                                                        value={item.name || ''}
                                                        onChange={e => {
                                                            const newLinks = [...form.links];
                                                            newLinks[index] = { ...newLinks[index], name: e.target.value };
                                                            set('links', newLinks);
                                                        }}
                                                    />
                                                    {errors.links?.[index]?.name && <p className="text-red-500 text-[10px] mt-1">* Majburiy</p>}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="relative">
                                                        <input
                                                            className={inputCls(errors.links?.[index]?.value) + (form.links.length > 1 ? " pr-10" : "")}
                                                            placeholder="Havolasi"
                                                            value={item.value || ''}
                                                            onChange={e => {
                                                                const newLinks = [...form.links];
                                                                newLinks[index] = { ...newLinks[index], value: e.target.value };
                                                                set('links', newLinks);
                                                            }}
                                                        />
                                                        {form.links.length > 1 &&
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const itemToRemove = form.links[index];
                                                                    if (itemToRemove.id) {
                                                                        setDeletedIds(prev => [...prev, itemToRemove.id]);
                                                                    }
                                                                    set('links', form.links.filter((_, i) => i !== index));
                                                                }}
                                                                className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8F95A8] hover:text-red-500 cursor-pointer transition-colors"
                                                            >
                                                                <FaXmark size={14} />
                                                            </button>
                                                        }
                                                    </div>
                                                    {errors.links?.[index]?.value && (
                                                        <p className="text-red-500 text-[10px] mt-1">
                                                            {errors.links?.[index]?.value && "* Majburiy"}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                <button
                                    type="button"
                                    onClick={() => set('links', [...form.links, { name: '', value: '' }])}
                                    className="h-[42px] w-full rounded-xl border text-[13px] border-[#E2E6F2] dark:border-[var(--stroke-soft)] bg-[var(--bg-elevation-1)] flex items-center justify-center gap-2 text-[var(--text-sub)] dark:text-[var(--text-strong)] hover:bg-gray-50 dark:hover:bg-[var(--bg-elevation-2)] transition-colors shrink-0 cursor-pointer dark:bg-[var(--bg-elevation-1)]"
                                >
                                    <FiPlus size={16} className="text-[var(--icon-sub)]" />
                                    Hujjat qo'shish
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-7 py-5 flex items-center justify-between sticky bottom-0 z-10! rounded-b-2xl bg-[var(--bg-base)]">
                        {!loading &&
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">Muzlatilganmi ?</span>
                                <button type="button" onClick={() => set('is_hidden', !form.is_hidden)}
                                    className={`relative w-10 h-5 rounded-full  cursor-pointer ${form.is_hidden ? 'bg-[#000000]' : 'bg-[var(--stroke-sub)] dark:bg-[#141414]'}`}>
                                    <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.is_hidden ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                </button>
                            </div>
                        }
                        <div className="flex items-center gap-3">
                            <button onClick={onClose}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
                text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]">
                                <FaXmark size={13} /> Yopish
                            </button>
                            <button onClick={saveChanges}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]">
                                <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Tahrirlash
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {pickerOpen === 'employees' && (
                <UserPickerModal title="Xodim tanlang"
                    selected={form.employees}
                    users={employees}
                    onClose={() => setPickerOpen(null)}
                    onConfirm={list => { set('employees', list); setPickerOpen(null) }}
                    onSearch={getEmployee}
                />
            )}

            {pickerOpen === 'testers' && (
                <UserPickerModal title="Sinovchi tanlang"
                    selected={form.testers}
                    users={employees}
                    onClose={() => setPickerOpen(null)}
                    onConfirm={list => { set('testers', list); setPickerOpen(null) }}
                    onSearch={getEmployee}
                />
            )}
        </>
    )
}

export default EditProjectModal