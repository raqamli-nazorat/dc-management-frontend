import { useEffect, useState } from "react"
import { FaXmark, FaArrowLeft, FaChevronDown } from 'react-icons/fa6'
import dayjs from 'dayjs'
import { DatePicker, TimePicker } from 'antd'
import { MultiSelect } from "../Components/MultiSelect"
import { axiosAPI } from "../../../../../service/axiosAPI"
import { toast } from "../../../../../Toast/ToastProvider"

const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'

const EditProjectModal = ({ project, onClose, refreshData, useDropdown, STATUS_LABEL }) => {
    const [employees, setEmployees] = useState([])
    const [testers, setTesters] = useState([])
    const [mgrQuery, setMgrQuery] = useState('')

    const [errors, setErrors] = useState({})

    const { open: statusOpen, setOpen: setStatusOpen, ref: statusRef } = useDropdown()
    const { open: mgrOpen, setOpen: setMgrOpen, ref: mgrRef } = useDropdown()

    const fmtBonus = (raw) => {
        if (!raw) return ""
        let val = raw.toString().replace(/[^0-9.]/g, "")
        const dots = val.split(".")
        if (dots.length > 2) {
            val = dots[0] + "." + dots.slice(1).join("")
        }
        const [int, dec] = val.split(".")
        const fmtInt = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
        return dec !== undefined ? `${fmtInt}.${dec.slice(0, 2)}` : fmtInt
    }

    const [form, setForm] = useState({
        title: project.title || '',
        prefix: project.prefix || '',
        status: project.status || '',
        description: project.description || '',
        manager: project.manager_info?.username || '',
        bonus: project.bonus || '',
        employees: project.employees_info || [],
        testers: project.testers_info || [],
        deadline: project.deadline ? project.deadline.slice(0, 10) : '',
        time: project.deadline ? project.deadline.slice(11, 16) : '',
        active: project.is_active !== undefined ? project.is_active : true,
    })
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

    const validate = () => {
        const e = {}
        if (!form.title.trim()) e.title = true
        if (!form.status) e.status = true
        if (!form.manager) e.manager = true
        if (!form.deadline) e.deadline = true
        if (!form.time) e.time = true
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
                manager: employees.find(item => item.username === form.manager)?.id || null,
                project_price: Number(form.bonus.replace(/\s/g, '')) || 0,
                employees: form.employees?.map((emp) => emp.id),
                testers: form.testers?.map((tst) => tst.id),
                deadline: form.deadline && form.time ? dayjs(dayjs(form.deadline).format('YYYY-MM-DD') + ' ' + form.time).toISOString() : form.deadline,
                active: form.active,
            }

            const res = await axiosAPI.patch(`projects/${project.id}/`, payload)
            if (res.status === 200) {
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

    const getEmployee = async ({ search }) => {
        try {
            const { data } = await axiosAPI.get("users/", { params: { search, page_size: 100 } })

            setEmployees(data.data.results)
        } catch (error) {
            console.log(error)
            toast.error(error?.response?.data?.error?.errorMsg || "Xodimlar olinmadi")
        }
    }

    const getTesters = async ({ search }) => {
        try {
            const { data } = await axiosAPI.get("reports/projects/all-testers/", { params: { search } })

            setTesters(data?.data || [])
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.error?.errorMsg || "Testerlar olinmadi")
        }
    }

    useEffect(() => {
        getEmployee({ search: '' })
        getTesters({ search: '' })
    }, [])

    const inputCls = (err) =>
        `w-full px-3 py-2.5 rounded-xl text-sm outline-none border 
    bg-white text-[#1A1D2E] placeholder-[#8F95A8]
    dark:bg-[#191A1A] dark:text-white dark:placeholder-[#5B6078]
    ${err ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]'}`

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-black/60" />
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer  z-10">
                <FaXmark size={14} />
            </button>
            <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#111111]">

                {/* Header */}
                <div className="px-7 pt-7 pb-4 sticky top-0 z-20 rounded-t-2xl bg-white dark:bg-[#111111]">
                    <div className="flex items-center gap-3 mb-1">
                        <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
                            <FaArrowLeft size={17} />
                        </button>
                        <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Loyiha tahrirlash</h2>
                    </div>
                    <p className="text-sm text-[#1A1D2E] dark:text-white">Loyiha ma'lumotlarini yangilash uchun o'zgartirishlar kiriting</p>
                </div>

                <div className="px-7 pb-4 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
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
                    bg-white dark:bg-[#191A1A]
                    ${errors.status ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
                    ${form.status ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
                                    <span>{STATUS_LABEL[form.status] || 'Holati tanlang'}</span>
                                    <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${statusOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {statusOpen && (
                                    <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-hidden bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
                                        {Object.values(STATUS_LABEL).map((s, i) => (
                                            <button key={s} type="button" onClick={() => { set('status', Object.keys(STATUS_LABEL).find(key => STATUS_LABEL[key] === s)); setStatusOpen(false) }}
                                                className={`w-full text-left px-4 py-2.5 text-sm  cursor-pointer
                          ${i < Object.values(STATUS_LABEL).length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                          ${form.status === s ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
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
                                    className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
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
                    bg-white dark:bg-[#191A1A]
                    ${errors.manager ? 'border-red-400 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#2A2B2B]'} ${mgrOpen ? 'border-[#526ED3]' : ''}`}>
                                    {mgrOpen ? (
                                        <input
                                            autoFocus
                                            placeholder="Menejer qidirish..."
                                            value={mgrQuery}
                                            onChange={e => {
                                                setMgrQuery(e.target.value)
                                                getEmployee({ search: e.target.value })
                                            }}
                                            className="flex-1 outline-none bg-transparent text-[#1A1D2E] dark:text-white placeholder-[#8F95A8]"
                                        />
                                    ) : (
                                        <span className={form.manager ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}>
                                            {form.manager || 'Menejer tanlang'}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        {form.manager && !mgrOpen && (
                                            <span onMouseDown={e => { e.stopPropagation(); set('manager', '') }}
                                                className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                                        )}
                                        <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${mgrOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                                {mgrOpen && (
                                    <div className="absolute top-full left-0 mt-1 z-60 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-44
                    bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
                                        {employees.filter(e => e.roles?.includes('manager')).map((u, i) => (
                                            <button key={u.id} type="button" onClick={() => { set('manager', u.username); setMgrOpen(false); setMgrQuery('') }}
                                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer ${i < employees.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${form.manager === u.username ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                                                <div className="w-6 h-6 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-[10px] font-bold text-[#526ED3] shrink-0">
                                                    {u.username?.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 text-left">
                                                    <p className="truncate">{u.username}</p>
                                                    {u.position && <p className="text-xs text-[#8F95A8] truncate">{u.position}</p>}
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
                                className={inputCls(false) + ' text-right'} />
                        </div>
                    </div>

                    {/* Xodimlar */}
                    <div>
                        <label className={labelCls}>Xodimlar</label>
                        <MultiSelect
                            placeholder="Xodim tanlang"
                            options={employees}
                            selected={form.employees}
                            onChange={v => set('employees', v)}
                            onSearch={getEmployee}
                        />
                    </div>

                    {/* Sinovchilar */}
                    <div>
                        <label className={labelCls}>Sinovchilar</label>
                        <MultiSelect
                            placeholder="Sinovchilar tanlang"
                            options={testers}
                            selected={form.testers}
                            onChange={v => set('testers', v)}
                            onSearch={getTesters}
                        />
                    </div>

                    {/* Muddati + Vaqti */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Muddati</label>
                            <DatePicker
                                placeholder="Muddati tanlang"
                                value={form.deadline ? dayjs(form.deadline) : null}
                                onChange={(date) => set('deadline', date ? dayjs(date).toISOString() : '')}
                                format="DD.MM.YYYY"
                                allowClear
                                className={`w-full py-2! rounded-xl! border! border-[#E2E6F2]! dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] ${errors.deadline ? 'border-red-400! dark:border-red-500!' : ''}`}
                            />
                            {errors.deadline && <p className="text-red-500 text-xs mt-1 ml-1">* Ushbu maydonni to'ldirish majburiy</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Vaqti</label>
                            <TimePicker
                                placeholder="Muddati tanlang"
                                value={form.time ? dayjs(form.time, 'HH:mm') : null}
                                onChange={(date) => set('time', date ? date.format('HH:mm') : '')}
                                format="HH:mm"
                                allowClear
                                className={`w-full py-2! rounded-xl! border! border-[#E2E6F2]! dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] ${errors.time ? 'border-red-400! dark:border-red-500!' : ''}`}
                            />
                            {errors.time && <p className="text-red-500 text-xs mt-1 ml-1">* Ushbu maydonni to'ldirish majburiy</p>}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-7 py-5 flex items-center justify-between sticky bottom-0 z-10! rounded-b-2xl bg-white dark:bg-[#111111]">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[#1A1D2E] dark:text-white">Faolmi?</span>
                        <button type="button" onClick={() => set('active', !form.active)}
                            className={`relative w-10 h-5 rounded-full  cursor-pointer ${form.active ? 'bg-[#000000]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
                            <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
                text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
                            <FaXmark size={13} /> Yopish
                        </button>
                        <button onClick={saveChanges}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
                            <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Tahrirlash
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EditProjectModal