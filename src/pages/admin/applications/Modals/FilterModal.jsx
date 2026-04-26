import { FaXmark } from "react-icons/fa6"
import { DateTimeBox } from "../../Components/DateTimeBox"
import { FaArrowLeft } from "react-icons/fa"
import { useState } from "react"
import { Status, useDistricts, usePositions, useRegions } from "../../../../MostUsesDates"
import FilterSelect from "../../Components/FilterSelect"

const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'

const EMPTY_FILTER = {
    status: '',
    position: '',
    region: '',
    created_at__date__gte: '',
    created_at__date__lte: '',
    is_student: false,
}

export const FilterModal = ({ show, onClose, onSubmit }) => {
    const [f, setF] = useState({ ...EMPTY_FILTER })
    const set = (k, v) => setF(p => ({ ...p, [k]: v }))

    const regions = useRegions()
    const districts = useDistricts()
    const positions = usePositions()

    const handleApply = () => {
        const params = {}

        // status: label → key ("Kutilmoqda" → "pending")
        if (f.status) {
            const key = Object.keys(Status).find(k => Status[k] === f.status)
            if (key) params.status = key
        }

        // position: name → id
        if (f.position) {
            const pos = positions.find(p => p.name === f.position)
            if (pos) params.position = pos.id
        }

        // region: name → id
        if (f.region) {
            const reg = regions.find(r => r.name === f.region)
            if (reg) params.region = reg.id
        }

        // date range
        if (f.created_at__date__gte) params.created_at__date__gte = f.created_at__date__gte
        if (f.created_at__date__lte) params.created_at__date__lte = f.created_at__date__lte

        // is_student
        if (f.is_student) params.is_student = true

        onSubmit(params)
        onClose()
    }

    const handleClear = () => {
        setF({ ...EMPTY_FILTER })
    }

    return (
        <>
            {show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-black/60" onClick={onClose} />
                    <div className="relative w-full max-w-[620px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">

                        {/* Header */}
                        <div className="px-7 pt-7 pb-3">
                            <div className="flex items-center gap-3 mb-1.5">
                                <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
                                    <FaArrowLeft size={17} />
                                </button>
                                <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Filtrlash</h2>
                            </div>
                            <p className="text-sm text-[#5B6078] ">Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi</p>
                        </div>

                        {/* Body */}
                        <div className="px-7 pb-5 pt-2 grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Holati</label>
                                <FilterSelect
                                    value={f.manager}
                                    onChange={v => set('manager', v)}
                                    options={["Holati", ...Object.values(Status)]}
                                    placeholder="Holatini tanlang"
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Lavozimi</label>
                                <FilterSelect
                                    value={f.position}
                                    onChange={v => set('position', v)}
                                    options={["Lavozim", ...positions.map(p => p.name)]}
                                    placeholder="Lavozimini tanlang"
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Viloyat</label>
                                <FilterSelect
                                    value={f.region}
                                    onChange={v => set('region', v)}
                                    options={["Viloyat", ...regions.map(e => e.name)]}
                                    placeholder="Viloyat tanlang"
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Tuman</label>
                                <FilterSelect
                                    value={f.district}
                                    onChange={v => set('district', v)}
                                    options={["Tuman", ...districts.map(e => e.name)]}
                                    placeholder="Tuman tanlang"
                                    disabled={!f.region}
                                />
                            </div>

                            <div>
                                <label className={labelCls}>Yaratilgan vaqt oralig'i</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <DateTimeBox
                                        type="date"
                                        placeholder="dan"
                                        value={f.date_from}
                                        onChange={v => set('date_from', v)}
                                    />
                                    <DateTimeBox
                                        type="time"
                                        value={f.time_from}
                                        onChange={v => set('time_from', v)}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="grid grid-cols-2 gap-2 mt-5">
                                    <DateTimeBox
                                        type="date"
                                        placeholder="gacha"
                                        value={f.date_to}
                                        onChange={v => set('date_to', v)}
                                    />
                                    <DateTimeBox
                                        type="time"
                                        value={f.time_to}
                                        onChange={v => set('time_to', v)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="w-full flex justify-between items-center">
                            <div className="flex items-center gap-3 px-7 py-5">
                                <span className="text-sm font-medium text-[#1A1D2E] dark:text-white">Bu talabami</span>

                                <button
                                    type="button"
                                    onClick={() => set('is_student', !f.is_student)}
                                    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${f.is_student ? 'bg-[#3F57B3]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}
                                >
                                    <span
                                        className={`absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${f.is_student ? 'translate-x-5' : 'translate-x-0.5'}`}
                                    />
                                </button>
                            </div>
                            <div className="px-7 py-5 flex items-center justify-end gap-3">
                                <button
                                    onClick={handleClear}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]"
                                >
                                    <FaXmark size={13} /> Tozalash
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]"
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                                    </svg>
                                    Qidirish
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}