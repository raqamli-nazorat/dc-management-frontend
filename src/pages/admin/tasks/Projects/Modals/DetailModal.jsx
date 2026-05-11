import dayjs from "dayjs"
import { useEffect, useState } from "react"
import { FaArrowLeft, FaCheck, FaXmark } from "react-icons/fa6"
import { toast } from "../../../../../Toast/ToastProvider"
import { axiosAPI } from "../../../../../service/axiosAPI"
import { FiPlus } from "react-icons/fi"
import { PiCopyBold } from "react-icons/pi"

const labelCls = 'block text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1.5'

const STATUS_LABEL = {
    planning: 'Rejalashtirilmoqda',
    active: 'Faol',
    overdue: "Muddati o'tgan",
    completed: 'Yakunlangan',
    cancelled: 'Bekor qilingan',
}

const DetailModal = ({ id, onClose }) => {
    const [project, setProject] = useState({});
    const [loading, setLoading] = useState(false)

    const fCls = 'w-full px-3 py-2.5 rounded-xl text-sm border bg-[var(--bg-base)] border-[var(--stroke-sub)] text-[var(--text-strong)] dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)]'
    const tagCls = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#EEF1FB] text-[var(--accent-strong)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]'

    const getProject = async () => {
        setLoading(true)
        try {
            const { data } = await axiosAPI.get(`projects/${id}/`)

            if (data.success && data?.data?.id) {
                const { data: links } = await axiosAPI.get(`project-documents/?project=${id}`)
                setProject({ ...data.data, project_documents: links.data.results || [] })
            } else {
                setProject(data.data)
            }
        } catch (error) {
            console.log(error)
            toast.error("Loyihani yuklashda xatolik.", error?.response?.data?.error?.errorMsg || "Loyihani yuklashda xatolik yuz berdi, iltimos qaytadan urinib ko'ring!")
        } finally {
            setTimeout(() => {
                setLoading(false)
            }, 150);
        }
    }

    useEffect(() => {
        getProject();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const [copyLink, setCopyLink] = useState(null);

    const handleCopyLink = (link, index) => {
        if (!link) return;

        navigator.clipboard.writeText(link).then(() => {
            setCopyLink(index);
            setTimeout(() => {
                setCopyLink(null);
            }, 3000);
        }).catch(err => {
            console.log("Failed to copy:", err);
        });
    };

    const managerName = project.manager_info?.username || project.manager_info?.name || '—'
    const statusLabel = STATUS_LABEL[project.status] || project.status || '—'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="fixed inset-0 bg-black/60" onClick={onClose} />
            {/* X tugmasi */}
            <button onClick={onClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer bg-white/20 text-white hover:bg-white/30">
                <FaXmark size={16} />
            </button>
            <div className="relative w-full max-w-[600px] h-[680px] rounded-3xl shadow-2xl bg-[var(--bg-base)]">


                {/* Header */}
                <div className="px-7 pt-7 pb-4 sticky top-0 z-10 bg-[var(--bg-base)] rounded-t-2xl dark:bg-[var(--bg-base)]">
                    <div className="flex items-center gap-3 mb-1">
                        <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
                            <FaArrowLeft size={17} />
                        </button>
                        <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Batafsil ma'lumot</h2>
                    </div>
                    <p className="text-sm text-[var(--text-sub)] dark:text-[var(--text-sub)]">Loyiha haqida batafsil ma'lumotlar</p>
                </div>

                {/* Body */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center gap-5 h-[500px]">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>

                        <p className="text-sm text-[var(--text-sub)] dark:text-[var(--text-sub)]"> Ma'lumotlar yuklanmoqda...</p>
                    </div>
                ) : (
                    <div className="px-7 pb-4 flex flex-col gap-4 h-[500px] overflow-y-auto">

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

                        {/* Menejer + Loyiha narxi */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Menejer</label>
                                <div className={fCls}>{managerName}</div>
                            </div>
                            <div>
                                <label className={labelCls}>Loyiha narxi (UZS)</label>
                                <div className={fCls + ' text-right font-bold'}>
                                    {project.project_price !== undefined
                                        ? Number(project.project_price).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(',', '.')
                                        : '—'}
                                </div>
                            </div>
                        </div>

                        {/* Titul + Jarima foizi */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Titul</label>
                                <div className={fCls}>{project.prefix || '—'}</div>
                            </div>
                            <div>
                                <label className={labelCls}>Jarima foizi (%)</label>
                                <div className={fCls}>{project.penalty_percentage || '0'}</div>
                            </div>
                        </div>

                        {/* Xodimlar */}
                        <div>
                            <label className={labelCls}>Xodimlar</label>
                            <div className={fCls + ' flex flex-wrap gap-1.5 min-h-[46px] py-2'}>
                                {project.employees_info?.length > 0
                                    ? project.employees_info.map(e => (
                                        <span key={e.id} className={tagCls}>{e.username} | {e?.position}
                                        </span>
                                    ))
                                    : project.employees?.length > 0
                                        ? project.employees.map((e, i) => (
                                            <span key={i} className={tagCls}>{e.username || e.name || e}</span>
                                        ))
                                        : <span className="text-[var(--text-soft)] dark:text-[var(--text-sub)] text-sm self-center"></span>
                                }
                            </div>
                        </div>

                        {/* Sinovchilar */}
                        <div>
                            <label className={labelCls}>Sinovchilar</label>
                            <div className={fCls + ' flex flex-wrap gap-1.5 min-h-[46px] py-2'}>
                                {project.testers_info?.length > 0
                                    ? project.testers_info.map(e => (
                                        <span key={e.id} className={tagCls}>{e.username} | {e?.position}</span>
                                    ))
                                    : project.testers?.length > 0
                                        ? project.testers.map((e, i) => (
                                            <span key={i} className={tagCls}>{e.username || e.name || e}</span>
                                        ))
                                        : <span className="text-[var(--text-soft)] dark:text-[var(--text-sub)] text-sm self-center">—</span>
                                }
                            </div>
                        </div>

                        {/* Muddati split */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Muddat sanasi</label>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-base)]">
                                    <span className="flex-1 text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                                        {project.deadline ? dayjs(project.deadline).format('DD.MM.YYYY') : '—'}
                                    </span>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-soft)] shrink-0">
                                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <label className={labelCls}>Soati</label>
                                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-base)]">
                                    <span className="flex-1 text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                                        {project.deadline ? dayjs(project.deadline).format('HH:mm') : '—'}
                                    </span>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-soft)] shrink-0">
                                        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            {project?.project_documents?.map((item, index) => {
                                return (
                                    <div key={index} className="flex flex-col gap-2.5">
                                        <label className={labelCls}>{index + 1}. Hujjat ma'lumotlari</label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1">
                                                <input
                                                    className={fCls}
                                                    placeholder="Hujjat nomi"
                                                    disabled
                                                    value={item.name || ''}
                                                />
                                            </div>
                                            <div className="flex-1 relative">
                                                <input
                                                    className={fCls + " pr-10"}
                                                    placeholder="Hujjat havolasi"
                                                    disabled
                                                    value={item.url || ''}
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() => handleCopyLink(item.url, index)}
                                                    disabled={copyLink === index}
                                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-[#8F95A8] cursor-pointer transition-colors"
                                                >
                                                    {copyLink === index ?
                                                        <FaCheck size={14} color="green" />
                                                        : <PiCopyBold size={14} />
                                                    }
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                    </div>
                )}


                {/* Footer */}
                <div className="px-7 py-5 flex items-center rounded-b-2xl sticky bottom-0 z-10 bg-[var(--bg-base)]">
                    {!loading &&
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-[#1A1D2E] dark:text-[var(--text-strong)]">Muzlatilganmi ?</span>
                            <div className={`relative w-10 h-5 rounded-full pointer-events-none ${project.is_hidden ? 'bg-[#000000]' : 'bg-[var(--stroke-sub)] dark:bg-[#141414]'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow ${project.is_hidden ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </div>
                        </div>
                    }
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)] ml-auto"
                    >
                        <FaXmark size={13} /> Yopish
                    </button>
                </div>

            </div>
        </div>
    )
}

export default DetailModal;