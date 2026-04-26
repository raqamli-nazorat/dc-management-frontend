import { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaTrash, FaInfoCircle } from "react-icons/fa";

// Global listener
let toastListener = null;

const parseArgs = (type, arg1, arg2) => {
    if (arg2) return { title: arg1, msg: arg2 };
    
    let defaultTitle = '';
    switch(type) {
        case 'success': defaultTitle = 'Muvaffaqiyatli'; break;
        case 'error': defaultTitle = 'Xatolik'; break;
        case 'delete': defaultTitle = "O'chirildi"; break;
        case 'info': defaultTitle = "Ma'lumot"; break;
        default: defaultTitle = 'Xabarnoma';
    }
    return { title: defaultTitle, msg: arg1 };
};

// Bu obyektni har qanday faylga import qilib ishlatish mumkin
export const toast = {
    success: (arg1, arg2) => {
        if (toastListener) toastListener({ type: 'success', ...parseArgs('success', arg1, arg2) });
    },
    error: (arg1, arg2) => {
        if (toastListener) toastListener({ type: 'error', ...parseArgs('error', arg1, arg2) });
    },
    delete: (arg1, arg2) => {
        if (toastListener) toastListener({ type: 'delete', ...parseArgs('delete', arg1, arg2) });
    },
    info: (arg1, arg2) => {
        if (toastListener) toastListener({ type: 'info', ...parseArgs('info', arg1, arg2) });
    }
};

const getToastConfig = (type) => {
    switch (type) {
        case 'success':
            return { icon: <FaCheckCircle size={18} />, bg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' };
        case 'error':
            return { icon: <FaExclamationCircle size={18} />, bg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' };
        case 'delete':
            return { icon: <FaTrash size={16} />, bg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' };
        case 'info':
            return { icon: <FaInfoCircle size={18} />, bg: 'bg-[#EEF1F7] dark:bg-[#303131] text-[#3F57B3] dark:text-[#526ED3]' };
        default:
            return { icon: <FaInfoCircle size={18} />, bg: 'bg-gray-100 dark:bg-gray-800 text-gray-500' };
    }
};

export const ToastProvider = ({ children }) => {
    const [currentToast, setCurrentToast] = useState(null);

    useEffect(() => {
        let timeout;

        toastListener = (t) => {
            setCurrentToast(t);
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                setCurrentToast(null);
            }, 3000);
        };

        return () => {
            toastListener = null;
            if (timeout) clearTimeout(timeout);
        };
    }, []);

    const config = currentToast ? getToastConfig(currentToast.type) : null;

    return (
        <>
            {children}
            {currentToast && (
                <div className="fixed top-5 right-5 z-[1000] flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-lg w-[320px] bg-white border border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A] transition-all duration-300 ease-in-out animate-in fade-in slide-in-from-top-5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${config.bg}`}>
                        {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">{currentToast.title}</p>
                        {currentToast.msg && (
                            <p className="text-[13px] text-[#8F95A8] dark:text-[#8E95B5] mt-0.5 leading-snug">{currentToast.msg}</p>
                        )}
                    </div>
                    <button onClick={() => setCurrentToast(null)} className="text-[#B6BCCB] hover:text-[#5B6078] dark:text-[#8E95B5] dark:hover:text-[#C2C8E0] shrink-0 cursor-pointer transition-colors mt-0.5">
                        <FaTimes size={14} />
                    </button>
                </div>
            )}
        </>
    );
};