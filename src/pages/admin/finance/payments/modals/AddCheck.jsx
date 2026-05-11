import { FiArrowRight, FiX } from "react-icons/fi"
import { useState, useEffect } from "react"
import { FaArrowLeft } from "react-icons/fa"
import { FaArrowUp, FaXmark } from "react-icons/fa6"
import { useTheme } from "../../../../../context/ThemeContext"
import { useRef } from "react"
import { axiosAPI } from "../../../../../service/axiosAPI"
import { toast } from "../../../../../Toast/ToastProvider"

const AddCheck = ({ onClose, paymentId, projectId, onConfirm }) => {
    const { isDark } = useTheme()
    const [existingReceipts, setExistingReceipts] = useState([])
    const [newImages, setNewImages] = useState([])
    const [previewImg, setPreviewImg] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        if (!paymentId) return
        axiosAPI.get('/expense-receipt/', { params: { expense: paymentId } })
            .then(res => {
                const payload = res.data?.data ?? res.data
                setExistingReceipts(Array.isArray(payload) ? payload : (payload.results ?? []))
            })
            .catch(() => {})
    }, [paymentId])

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files)
        const mapped = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            url: URL.createObjectURL(file),
            file,
        }))
        setNewImages(prev => [...prev, ...mapped])
    }

    const removeNew = (id) => {
        setNewImages(prev => prev.filter(img => img.id !== id))
    }

    const removeExisting = async (receiptId) => {
        try {
            await axiosAPI.delete(`/expense-receipt/${receiptId}/`)
            setExistingReceipts(prev => prev.filter(r => r.id !== receiptId))
        } catch {
            toast.error("Chekni o'chirishda xatolik yuz berdi.")
        }
    }

    const handleSaveChecks = async () => {
        if (newImages.length === 0) {
            onClose()
            return
        }
        try {
            const formData = new FormData()
            formData.append("expense", paymentId)
            newImages.forEach(image => {
                formData.append("file", image.file)
            })
            const { data } = await axiosAPI.post("expense-receipt/", formData)
            if (data.success) {
                toast.success("Cheklar muvaffaqiyatli yuklandi!")
                onClose()
            }
        } catch (error) {
            console.error(error)
            toast.error(error?.response?.data?.error?.errorMsg || "Cheklarni yuklashda xatolik yuz berdi.")
        }
    }

    const totalCount = existingReceipts.length + newImages.length

    return (
        <>
            <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">
                <div className="w-[620px] bg-[var(--bg-base)] rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden py-6 px-4 flex flex-col gap-6">

                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-3 pl-4 border-b border-b-gray-100 dark:border-[var(--stroke-soft)] pb-3 flex-1">
                            <div className="flex items-center">
                                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2c2d2d] rounded-full text-[#1A1D2E] dark:text-[var(--text-strong)]">
                                    <FaArrowLeft size={18} />
                                </button>
                                <h2 className="ml-2 text-[20px] font-bold text-[#1A1D2E] dark:text-[var(--text-strong)]">To'lov chekini yuklang.</h2>
                            </div>
                            <p className="font-medium text-[13px] text-[#5B6078]">
                                To'lov tasdiqlanishi uchun chek yoki kvitansiyani yuklang.
                            </p>
                        </div>

                        <div className="relative group flex items-center gap-2">
                            <div className="absolute right-13 top-1/2 -translate-y-1/2 z-20 w-[220px] px-4 py-3 rounded-2xl shadow-xl text-[12px] text-[#1A1D2E] dark:text-[var(--text-strong)] bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] border border-[#E2E6F2] dark:border-[var(--stroke-soft)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                                Chek faylini hozir yuklamasangiz ham bo'ladi. Uni keyinroq qo'shishingiz mumkin.
                            </div>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1A1D2E] dark:bg-[var(--bg-base)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            <button className="w-7 h-7 flex items-center justify-center cursor-pointer shrink-0">
                                <img src="/imgs/LeftIcon.svg" alt="info" className="w-5 h-5 dark:brightness-0 dark:invert" />
                            </button>
                        </div>
                    </div>

                    {/* Cheklar grid */}
                    <div className="flex items-center gap-4 h-[240px] overflow-x-auto custom-scrollbar px-1">

                        {/* Mavjud cheklar */}
                        {existingReceipts.map(receipt => (
                            <div key={receipt.id} className="w-[180px] h-full flex-shrink-0 relative group">
                                <img
                                    src={receipt.file}
                                    alt="chek"
                                    onClick={() => setPreviewImg(receipt.file)}
                                    className="w-full h-full object-cover rounded-[28px] border border-gray-200 dark:border-gray-800 cursor-pointer hover:opacity-90 transition-opacity"
                                />
                                <button
                                    onClick={() => removeExisting(receipt.id)}
                                    className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all cursor-pointer"
                                >
                                    <FiX size={18} className="text-red-500" />
                                </button>
                            </div>
                        ))}

                        {/* Yangi qo'shilgan cheklar */}
                        {newImages.map(image => (
                            <div key={image.id} className="w-[180px] h-full flex-shrink-0 relative group">
                                <img
                                    src={image.url}
                                    alt="chek"
                                    onClick={() => setPreviewImg(image.url)}
                                    className="w-full h-full object-cover rounded-[28px] border border-gray-200 dark:border-gray-800 cursor-pointer hover:opacity-90 transition-opacity"
                                />
                                <button
                                    onClick={() => removeNew(image.id)}
                                    className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all cursor-pointer"
                                >
                                    <FiX size={18} className="text-red-500" />
                                </button>
                            </div>
                        ))}

                        {/* Yuklash tugmasi */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-[180px] h-full flex-shrink-0 bg-[#F1F5F9] dark:bg-[#2c2d2d] border-2 border-dashed border-[#CBD5E1] dark:border-gray-700 rounded-[28px] flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#4451FE] dark:hover:border-[#4451FE] hover:bg-[#F8FAFC] dark:hover:bg-[#343535] transition-all group"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleFileChange}
                            />
                            <img src={isDark ? "/imgs/check_night.svg" : "/imgs/check_light.svg"} alt="info" />
                            <span className="text-[15px] font-medium text-[#64748B] dark:text-gray-400 text-center px-6 leading-tight">
                                Ta'lov chekini yuklang
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-10">
                        <button onClick={onClose} className="flex items-center gap-2 text-[#526ED3] font-extrabold text-[15px] cursor-pointer">
                            <FiArrowRight size={16} />
                            O'tkazib yuborish
                        </button>
                        <button
                            onClick={handleSaveChecks}
                            disabled={newImages.length === 0}
                            className="flex items-center gap-2 bg-[#3F57B3] text-white rounded-xl px-5 py-3 font-bold text-[15px] cursor-pointer disabled:opacity-50 disabled:cursor-default"
                        >
                            <FaArrowUp className="rotate-[40deg]" size={16} />
                            Yuborish {newImages.length > 0 && `(${newImages.length})`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Rasm preview */}
            {previewImg && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85"
                    onClick={() => setPreviewImg(null)}
                >
                    <button
                        onClick={() => setPreviewImg(null)}
                        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
                    >
                        <FaXmark size={15} />
                    </button>
                    <img
                        src={previewImg}
                        alt="chek"
                        className="max-w-[90vw] max-h-[90vh] rounded-2xl object-contain shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    )
}

export default AddCheck
