import { FiArrowLeft, FiInfo, FiX, FiArrowRight, FiFileText } from "react-icons/fi"
import { useState } from "react"
import { FaArrowLeft } from "react-icons/fa"
import { TbArrowUpRight } from "react-icons/tb"
import { FaArrowUp } from "react-icons/fa6"
import { useTheme } from "../../../../../context/ThemeContext"
import { useRef } from "react"
import { axiosAPI } from "../../../../../service/axiosAPI"
import { toast } from "../../../../../Toast/ToastProvider"

const AddCheck = ({ onClose, paymentId, projectId, onConfirm }) => {
    const { isDark } = useTheme()
    const [images, setImages] = useState([])
    const fileInputRef = useRef(null)

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files)
        const newImages = files.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            url: URL.createObjectURL(file),
            file: file
        }))
        setImages([...images, ...newImages])
    }

    const removeImage = (id) => {
        setImages(images.filter(img => img.id !== id))
    }

    const handleSaveChecks = async () => {
        try {
            const formData = new FormData();
            formData.append("expense", paymentId);
            images.forEach(image => {
                formData.append("file", image.file);
            });
            const { data } = await axiosAPI.post("expense-receipt/", formData)
            if (data.success) {
                toast.success("Cheklar muvaffaqiyatli yuklandi!");
                onClose();
            }
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.error?.errorMsg || "Cheklarni yuklashda xatolik yuz berdi.");
        }
    }

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70">

            <div className="w-[620px] h-[500px] bg-[var(--bg-base)] rounded-[32px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] overflow-hidden py-6 px-4 flex flex-col gap-8">

                {/* Header Section */}
                <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-3 pl-4 border-b border-b-gray-100 dark:border-[var(--stroke-soft)]">
                        <div className="flex items-center">
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2c2d2d] rounded-full text-[#1A1D2E] dark:text-[var(--text-strong)]">
                                <FaArrowLeft size={18} />
                            </button>
                            <h2 className="ml-2 text-[20px] font-bold text-[#1A1D2E] dark:text-[var(--text-strong)]">To'lov chekini yuklang.</h2>
                        </div>
                        <p className="font-medium text-[13px] text-[#5B6078]">
                            To‘lov tasdiqlanishi uchun чек yoki kvitansiyani yuklang.
                        </p>
                    </div>

                    <div className="relative group flex items-center gap-2">
                        <div className="absolute right-13 top-1/2 -translate-y-1/2 z-20 w-[220px] px-4 py-3 rounded-2xl shadow-xl text-[12px] text-[#1A1D2E] dark:text-[var(--text-strong)] bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] border border-[#E2E6F2] dark:border-[var(--stroke-soft)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                            Chek faylini hozir yuklamasangiz ham bo‘ladi. Uni keyinroq qo‘shishingiz mumkin.
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1A1D2E] dark:bg-[var(--bg-base)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        <button className="w-7 h-7 flex items-center justify-center cursor-pointer shrink-0">
                            <img src="/imgs/LeftIcon.svg" alt="info" className="w-5 h-5 dark:brightness-0 dark:invert" />
                        </button>
                    </div>
                </div>

                {/* Upload Content Grid */}
                <div className="flex items-center gap-4 h-[270px] overflow-x-auto custom-scrollbar">
                    {images.map((image) => (
                        <div key={image.id} className="w-[180px] h-full flex-shrink-0 relative group">
                            <img
                                src={image.url}
                                alt="check"
                                className="w-full h-full object-cover rounded-[28px] border border-gray-200 dark:border-gray-800"
                            />
                            <button
                                onClick={() => removeImage(image.id)}
                                className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all cursor-pointer"
                            >
                                <FiX size={18} className="text-red-500" />
                            </button>
                        </div>
                    ))}

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
                            Ta’lov chekini yuklang
                        </span>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-end gap-10">
                    <button onClick={onClose} className="flex items-center gap-2 text-[#526ED3] font-extrabold text-[15px] cursor-pointer">
                        <FiArrowRight size={16} />
                        O'tkazib yuborish
                    </button>
                    <button onClick={handleSaveChecks} disabled={images.length === 0} className="flex items-center gap-2 bg-[#3F57B3] text-white rounded-xl px-5 py-3 font-bold text-[15px] cursor-pointer disabled:opacity-50 disabled:cursor-default">
                        <FaArrowUp className="rotate-[40deg]" size={16} />
                        Yuborish
                    </button>
                </div>
            </div>

        </div>
    )
}

export default AddCheck
