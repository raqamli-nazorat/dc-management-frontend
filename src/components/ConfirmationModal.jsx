import { FaArrowLeft } from "react-icons/fa"
import { FaXmark } from "react-icons/fa6"

export const ConfirmationModal = ({title, description, onClose, onAction, buttonText, confirmIcon, confirmColor, showModal}) => {
    return (
        <>
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-black/60" />
                    <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323] p-7">
                        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer transition-colors z-10">
                            <FaXmark size={14} />
                        </button>
                        <div className="flex items-center gap-3 mb-3">
                            <button
                                onClick={onClose}
                                className="text-[#1A1D2E] dark:text-[#FFFFFF] hover:opacity-70 cursor-pointer"
                            >
                                <FaArrowLeft size={16} />
                            </button>
                            <h2 className="text-lg font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">
                                {title}
                            </h2>
                        </div>
                        <p className="text-sm text-[#8F95A8] dark:text-[#C2C8E0] mb-6">
                            {description}
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-[#4356a0] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]"
                            >
                                <FaXmark size={14} /> Yopish
                            </button>
                            <button
                                onClick={onAction}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${confirmColor} text-white`}
                            >
                                {confirmIcon} {buttonText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}