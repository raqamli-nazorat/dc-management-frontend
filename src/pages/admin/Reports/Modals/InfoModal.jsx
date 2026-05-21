import { useEffect } from "react"
import { FaXmark } from "react-icons/fa6";

export const InfoModal = ({ isOpen, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 transition-opacity duration-300"
                onClick={onClose}
            />

            <button onClick={onClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer bg-white/20 text-white hover:bg-white/30">
                <FaXmark size={16} />
            </button>


            {/* Modal Card */}
            <div
                className="relative w-full max-w-[520px] rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white dark:bg-[var(--bg-base)] p-6 flex  items-center gap-1 transform transition-all duration-300 scale-100 opacity-100 animate-in fade-in zoom-in-95 duration-200 "
                onClick={(e) => e.stopPropagation()}
            >
                {/* Info Icon with Premium Background */}
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevation-1-alt)] flex items-center justify-center text-[#3F67FF] shrink-0 shadow-inner">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                </div>

                {/* Modal Text */}
                <div className="text-[20px] font-bold text-[var(--text-strong)]">
                    Ma'lumotlar shakllantirildi.
                </div>
            </div>
        </div>
    )
}