import dayjs from "dayjs"
import { FaArrowLeft, FaXmark } from "react-icons/fa6"

const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'

const STATUS_LABEL = {
    planning: 'Rejalashtirilmoqda',
    active: 'Faol',
    overdue: "Muddati o'tgan",
    completed: 'Yakunlangan',
    cancelled: 'Bekor qilingan',
}

const DetailModal = ({ project, onClose }) => {
    const fCls = 'w-full px-3 py-2.5 rounded-xl text-sm border bg-white border-[#E2E6F2] text-[#1A1D2E] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white'
    const tagCls = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]'

    const managerName = project.manager_info?.username || project.manager_info?.name || '—'
    const statusLabel = STATUS_LABEL[project.status] || project.status || '—'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-black/60" onClick={onClose} />
            {/* X tugmasi */}
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer z-10">
                <FaXmark size={14} />
            </button>
            <div className="relative w-full max-w-[600px] h-[90vh] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">


                {/* Header */}
                <div className="px-7 pt-7 pb-4 sticky top-0 z-10 bg-white rounded-t-2xl dark:bg-[#111111]">
                    <div className="flex items-center gap-3 mb-1">
                        <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
                            <FaArrowLeft size={17} />
                        </button>
                        <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Batafsil ma'lumot</h2>
                    </div>
                    <p className="text-sm text-[#5B6078] dark:text-[#C2C8E0]">Loyiha haqida batafsil ma'lumotlar</p>
                </div>

                {/* Body */}
                <div className="px-7 pb-4 flex flex-col gap-4 max-h-[500px] overflow-y-auto">

                    {/* Nomi + Holati */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Nomi</label>
                            <div className={fCls}>{project.title || project.name || '—'}</div>
                        </div>
                        <div>
                            <label className={labelCls}>Holati</label>
                            <div className={fCls}>{statusLabel}</div>
                        </div>
                    </div>

                    {/* Tavsifi */}
                    <div>
                        <label className={labelCls}>Tavsifi</label>
                        <div className={fCls + ' min-h-[80px] whitespace-pre-wrap leading-relaxed'}>
                            {project.description || '—'}
                        </div>
                    </div>

                    {/* Menejer + Menejer bonusi */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Menejer</label>
                            <div className={fCls}>{managerName}</div>
                        </div>
                        <div>
                            <label className={labelCls}>Loyiha narxi (UZS)</label>
                            <div className={fCls + ' text-right'}>
                                {project.project_price !== undefined
                                    ? Number(project.project_price).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(',', '.')
                                    : '—'}
                            </div>
                        </div>
                    </div>

                    {/* Xodimlar */}
                    <div>
                        <label className={labelCls}>Xodimlar</label>
                        <div className={fCls + ' flex flex-wrap gap-1.5 min-h-[46px] py-2'}>
                            {project.employees_info?.length > 0
                                ? project.employees_info.map(e => (
                                    <span key={e.id} className={tagCls}>{e.username}</span>
                                ))
                                : project.employees?.length > 0
                                    ? project.employees.map((e, i) => (
                                        <span key={i} className={tagCls}>{e.username || e.name || e}</span>
                                    ))
                                    : <span className="text-[#8F95A8] dark:text-[#5B6078] text-sm self-center">—</span>
                            }
                        </div>
                    </div>

                    {/* Sinovchilar */}
                    <div>
                        <label className={labelCls}>Sinovchilar</label>
                        <div className={fCls + ' flex flex-wrap gap-1.5 min-h-[46px] py-2'}>
                            {project.testers_info?.length > 0
                                ? project.testers_info.map(e => (
                                    <span key={e.id} className={tagCls}>{e.username}</span>
                                ))
                                : project.testers?.length > 0
                                    ? project.testers.map((e, i) => (
                                        <span key={i} className={tagCls}>{e.username || e.name || e}</span>
                                    ))
                                    : <span className="text-[#8F95A8] dark:text-[#5B6078] text-sm self-center">—</span>
                            }
                        </div>
                    </div>

                    {/* Muddati */}
                    <div>
                        <label className={labelCls}>Muddati</label>
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A]">
                            <span className="flex-1 text-sm text-[#1A1D2E] dark:text-white">{dayjs(project.deadline).format('DD.MM.YYYY HH:mm')}</span>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#8F95A8] shrink-0">
                                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-7 py-5 flex items-center justify-between rounded-b-2xl border-t border-[#F1F3F9] dark:border-[#292A2A] sticky bottom-0 z-10 bg-white dark:bg-[#111111]">
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[#1A1D2E] dark:text-white">Faolmi?</span>
                        <div className={`relative w-10 h-5 rounded-full pointer-events-none ${project.is_active !== false ? 'bg-[#000000]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow ${project.is_active !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
                        <FaXmark size={13} /> Yopish
                    </button>
                </div>

            </div>
        </div>
    )
}

export default DetailModal;