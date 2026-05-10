import { FaArrowLeft } from "react-icons/fa"
import { FaXmark } from "react-icons/fa6"

export const ConfirmationModal = ({title, description, onClose, onAction, buttonText, confirmIcon, confirmColor, showModal}) => {
    return (
        <>
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-black/60" />
                    <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] p-7">
                        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)] dark:hover:bg-[var(--bg-elevation-2)] text-[var(--text-sub)] dark:text-[var(--text-sub)] cursor-pointer  z-10">
                            <FaXmark size={14} />
                        </button>
                        <div className="flex items-center gap-3 mb-3">
                            <button
                                onClick={onClose}
                                className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-70 cursor-pointer"
                            >
                                <FaArrowLeft size={16} />
                            </button>
                            <h2 className="text-lg font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                                {title}
                            </h2>
                        </div>
                        <p className="text-sm text-[var(--text-soft)] dark:text-[var(--text-sub)] mb-6">
                            {description}
                        </p>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium  cursor-pointer text-[#4356a0] hover:bg-[var(--bg-elevation-1-alt)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]"
                            >
                                <FaXmark size={14} /> Yopish
                            </button>
                            <button
                                onClick={onAction}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold  cursor-pointer ${confirmColor} text-white`}
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