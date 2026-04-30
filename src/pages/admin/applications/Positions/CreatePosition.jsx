import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { MdCheck } from "react-icons/md";
import { toast } from "../../../../Toast/ToastProvider";
import { axiosAPI } from "../../../../service/axiosAPI";

const CreatePosition = ({ onClose, refetch }) => {

    const [form, setForm] = useState({
        name: '',
        is_application: false
    })

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

    const inputCls = 'w-full px-3 py-2.5 rounded-lg text-sm outline-none border transition-colors bg-white text-[#1A1D2E] placeholder-[#B6BCCB] dark:bg-[#191A1A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5] border-[#E2E6F2] focus:border-[#526ED3] dark:border-[#292A2A]'
    const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto modal-scroll py-8 px-4">
            <div className="fixed inset-0 bg-black/60" />
            <button onClick={onClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white">
                <FaXmark size={16} />
            </button>
            <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">
                <div className="px-7 pt-7 pb-5">
                    <div className="flex flex-col items-start gap-3">
                        <div className='flex gap-3'>
                            <button
                                onClick={onClose}
                                className="mt-1 text-[#1A1D2E] dark:text-[#FFFFFF] hover:opacity-70 cursor-pointer shrink-0"
                            >
                                <FaArrowLeft size={18} />
                            </button>
                            <h2
                                className="text-[#1A1D2E] dark:text-[#FFFFFF]"
                                style={{ fontSize: 20, fontWeight: 800 }}
                            >
                                Lavozim qo'shish
                            </h2>
                        </div>
                        <p className="text-sm text-[#8F95A8] dark:text-[#C2C8E0] mt-1">
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
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            maxLength={255}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-[#1A1D2E] dark:text-[#FFFFFF]">
                            Ariza uchun ham ishlatilsinmi?
                        </span>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, is_application: !form.is_application })}
                            className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.is_application ? 'bg-[#3F57B3]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}
                        >
                            <span
                                className={`absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${form.is_application ? 'translate-x-5' : 'translate-x-0.5'}`}
                            />
                        </button>
                    </div>
                </div>
                <div className="px-7 py-5 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
                        <FaXmark size={14} />
                        Yopish
                    </button>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]"
                    >
                        <MdCheck size={16} />
                        Qo'shish
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CreatePosition