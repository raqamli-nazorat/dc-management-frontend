import { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaTrash, FaInfoCircle } from "react-icons/fa";

let toastListener = null;

const parseArgs = (type, arg1, arg2) => {
    if (arg2) return { title: arg1, msg: arg2 };
    let defaultTitle = '';
    switch (type) {
        case 'success': defaultTitle = 'Muvaffaqiyatli'; break;
        case 'error': defaultTitle = 'Xatolik'; break;
        case 'delete': defaultTitle = "O'chirildi"; break;
        case 'info': defaultTitle = "Ma'lumot"; break;
        default: defaultTitle = 'Xabarnoma';
    }
    return { title: defaultTitle, msg: arg1 };
};

export const toast = {
    success: (a, b) => toastListener?.({ type: 'success', ...parseArgs('success', a, b) }),
    error: (a, b) => toastListener?.({ type: 'error', ...parseArgs('error', a, b) }),
    delete: (a, b) => toastListener?.({ type: 'delete', ...parseArgs('delete', a, b) }),
    info: (a, b) => toastListener?.({ type: 'info', ...parseArgs('info', a, b) })
};

const getToastConfig = (type) => {
    switch (type) {
        case 'success': return { icon: <FaCheckCircle size={18} />, bg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' };
        case 'error': return { icon: <FaExclamationCircle size={18} />, bg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' };
        case 'delete': return { icon: <FaTrash size={16} />, bg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' };
        case 'info': return { icon: <FaInfoCircle size={18} />, bg: 'bg-[#EEF1F7] dark:bg-[#303131] text-[#3F57B3] dark:text-[#526ED3]' };
        default: return { icon: <FaInfoCircle size={18} />, bg: 'bg-gray-100 dark:bg-gray-800 text-gray-500' };
    }
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]); // Endi massiv ishlatamiz

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        toastListener = (t) => {
            const id = Date.now(); // Har bir toast uchun unikal ID
            setToasts((prev) => [...prev, { ...t, id }]);

            // 3 soniyadan keyin avtomatik o'chirish
            setTimeout(() => {
                removeToast(id);
            }, 3000);
        };

        return () => { toastListener = null; };
    }, [removeToast]);

    return (
        <>
            {children}
            {/* Toastlar konteyneri */}
            <div className="fixed top-5 right-5 z-[1000] flex flex-col gap-3 pointer-events-none">
                {toasts.map((t) => {
                    const config = getToastConfig(t.type);
                    return (
                        <div
                            key={t.id}
                            className="pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-lg w-[320px] bg-white border border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A] transition-all duration-300 animate-in fade-in slide-in-from-right-5"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${config.bg}`}>
                                {config.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">{t.title}</p>
                                {t.msg && (
                                    <p className="text-[13px] text-[#8F95A8] dark:text-[#8E95B5] mt-0.5 leading-snug">{t.msg}</p>
                                )}
                            </div>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] dark:hover:text-[#C2C8E0] shrink-0 cursor-pointer  mt-0.5"
                            >
                                <FaTimes size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </>
    );
};