import { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { MdCheck } from "react-icons/md";
import { toast } from "../../../../Toast/ToastProvider";
import { axiosAPI } from "../../../../service/axiosAPI";
import DiscardModal from "../../../../components/DiscardModal";

const CreatePosition = ({ onClose, refetch }) => {

    const [form, setForm] = useState({ name: '', is_application: false })
    const [isDirty, setIsDirty] = useState(false)
    const [showDiscard, setShowDiscard] = useState(false)

    const handleClose = () => { if (isDirty) setShowDiscard(true); else onClose() }

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') handleClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isDirty])

    const handleCreate = async () => {
        try {
            await axiosAPI.post('applications/positions/', form)
            toast.success('Lavozim qo\'shildi', "Yangi lavozim muvaffaqiyatli qo'shildi!")
            refetch()
            onClose()
        } catch (error) {
            console.error('Error creating position:', error)
            const errData = error?.response?.data?.error;

            let errMsg = "Xatolik yuz berdi";
            if (errData?.details && typeof errData.details === 'object') {
                const detailMsgs = Object.values(errData.details).flat().join(' ');
                if (detailMsgs) errMsg = detailMsgs;
            } else if (errData?.errorMsg) {
                errMsg = errData.errorMsg;
            } else if (typeof error?.response?.data === 'string') {
                errMsg = error.response.data;
            }

            toast.error(errMsg);
        }
    }

    const inputCls = 'w-full px-3 py-2.5 rounded-lg text-sm outline-none border  bg-[var(--bg-base)] text-[var(--text-strong)] placeholder-[var(--text-disabled)] dark:bg-[var(--bg-base)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)] border-[var(--stroke-sub)] focus:border-[var(--accent-sub)] dark:border-[var(--stroke-soft)]'
    const labelCls = 'block text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1'

    return (
        <>
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto modal-scroll py-8 px-4">
            <div className="fixed inset-0 bg-black/60" />
            <button onClick={handleClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer  bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white">
                <FaXmark size={16} />
            </button>
            <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)]">
                <div className="px-7 pt-7 pb-5">
                    <div className="flex flex-col items-start gap-3">
                        <div className='flex gap-3'>
                            <button
                                onClick={handleClose}
                                className="mt-1 text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-70 cursor-pointer shrink-0"
                            >
                                <FaArrowLeft size={18} />
                            </button>
                            <h2
                                className="text-[var(--text-strong)] dark:text-[var(--text-strong)]"
                                style={{ fontSize: 20, fontWeight: 800 }}
                            >
                                Lavozim qo'shish
                            </h2>
                        </div>
                        <p className="text-sm text-[var(--text-soft)] dark:text-[var(--text-sub)] mt-1">
                            Yangi lavozim qo'shish
                        </p>
                    </div>
                </div>
                <div className="px-7 pb-2 flex flex-col gap-4">
                    <div>
                        <label className={labelCls}>Lavozim</label>
                        <input
                            className={inputCls}
                            placeholder="Lavozim nomi"
                            value={form.name}
                            onChange={e => { setIsDirty(true); setForm({ ...form, name: e.target.value }) }}
                            maxLength={255}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                            Ariza uchun ham ishlatilsinmi?
                        </span>
                        <button
                            type="button"
                            onClick={() => { setIsDirty(true); setForm({ ...form, is_application: !form.is_application }) }}
                            className={`relative w-10 h-5 rounded-full  cursor-pointer ${form.is_application ? 'bg-[var(--accent-strong)]' : 'bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-elevation-2)]'}`}
                        >
                            <span
                                className={`absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white bg-[var(--bg-base)] shadow transition-transform duration-200 ${form.is_application ? ' translate-x-5' : 'translate-x-0.5 '}`}
                            />
                        </button>
                    </div>
                </div>
                <div className="px-7 py-5 flex items-center justify-end gap-3">
                    <button onClick={handleClose} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium  cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
                        <FaXmark size={14} />
                        Yopish
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold  cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]"
                    >
                        <MdCheck size={16} />
                        Qo'shish
                    </button>
                </div>
            </div>
        </div>
        {showDiscard && (
            <DiscardModal onCancel={() => setShowDiscard(false)} onConfirm={onClose} />
        )}
        </>
    )
}

export default CreatePosition