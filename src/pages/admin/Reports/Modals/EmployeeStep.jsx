import { useState, useEffect, useMemo } from "react";
import { axiosAPI } from "../../../../service/axiosAPI";
import { toast } from "../../../../Toast/ToastProvider";
import {
    IoSearchOutline,
    IoClose,
    IoCheckmarkOutline,
} from "react-icons/io5";
import { FaArrowLeft } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { LuCheckCheck } from "react-icons/lu";
import { useAuth } from "../../../../context/AuthContext";

const EmployeeStep = ({ selectedList = [], onConfirm, onClose, employee_role = "all", title = "Boshqaruvchi tanlang", param = {} }) => {
    const { user } = useAuth();

    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const normalizeSelectedList = (list) => {
        if (!Array.isArray(list)) return [];
        return list
            .map((item) => (typeof item === 'string' ? Number(item) : item))
            .filter((id) => id !== null && id !== undefined && id !== '' && !Number.isNaN(id));
    };
    const [selectedIds, setSelectedIds] = useState(normalizeSelectedList(selectedList));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setSelectedIds(normalizeSelectedList(selectedList));
    }, [selectedList]);

    // Ma'lumotlarni yuklash
    const getEmployee = async ({ search }) => {

        const params = { ...param, search };

        if (employee_role !== "all" && employee_role !== "tester" && user.active_role !== "employee") {
            params.roles = employee_role;
        }

        setLoading(true);
        try {
            if (user.active_role === "employee" && employee_role === "employee") {
                setEmployees([user]);
                return;
            }

            const { data } = await axiosAPI.get(employee_role === "tester" ? "reports/projects/all-testers/" : "users/all/", { params });

            const response = employee_role === "tester" ? data.data : data?.data?.results || [];

            setEmployees(response);
        } catch (error) {
            console.error(error);
            toast.error(error?.response?.data?.error?.errorMsg || "Xodimlarni yuklashda xatolik yuz berdi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            getEmployee({ search: searchTerm });
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Bitta tanlash/bekor qilish
    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    // Hammasini tanlash
    const toggleAll = () => {
        if (selectedIds.length === employees?.length && employees?.length > 0) {
            setSelectedIds([]);
        } else if (employees?.length > 0) {
            setSelectedIds(employees?.map(emp => emp.id));
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        >
            <div
                className="w-full h-[600px] flex flex-col max-w-[600px] bg-[var(--bg-base)] rounded-[24px] shadow-2xl overflow-hidden"
            >

                <button onClick={onClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer bg-white/20 text-white hover:bg-white/30">
                    <FaXmark size={16} />
                </button>

                {/* Modal Header */}
                <div className="flex items-center px-6 py-5 ">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-[#2c2d2d] rounded-full text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                        <FaArrowLeft size={18} />
                    </button>
                    <h2 className="ml-2 text-[17px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">{title}</h2>
                </div>

                <div className="p-6 pt-0 flex flex-col flex-1">
                    {/* Controls: Select All & Search */}
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={toggleAll}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] border border-gray-100 dark:border-[var(--stroke-soft)] rounded-xl text-gray-600 dark:text-[var(--text-soft)] hover:bg-gray-50 dark:hover:bg-[var(--bg-elevation-2)] cursor-pointer whitespace-nowrap text-sm font-medium h-10 shadow-sm"
                        >
                            <LuCheckCheck size={18} />
                            Barchasini tanlash
                        </button>
                        <div className="relative flex-1">
                            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[var(--text-soft)]" size={18} />
                            <input
                                type="text"
                                placeholder="Ism Sharifi bo'yicha izlash..."
                                className="w-full h-10 pl-10 pr-4 py-2 bg-[#F8F9FD] dark:bg-[var(--bg-base)] border border-gray-100 dark:border-[var(--stroke-soft)] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:text-[var(--text-strong)] placeholder:text-gray-400 dark:placeholder:text-[#8E95B5] text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Employee List */}
                    <div className="space-y-3 flex-1 h-[340px] max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
                        {employees?.map((emp) => {
                            const isSelected = selectedIds.includes(emp.id);
                            return (
                                <div
                                    key={emp.id}
                                    onClick={() => toggleSelect(emp.id)}
                                    className={`flex items-center px-4 py-3.5 rounded-[16px] border cursor-pointer ${isSelected
                                        ? "border-[#4F5ECE] bg-[#F5F7FF] dark:bg-[#252836] dark:border-[#4F5ECE]"
                                        : "border-[#F1F5F9] bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] hover:border-gray-200 dark:hover:border-[#3a3b3b]"
                                        }`}
                                >
                                    {/* Selection Indicator */}
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-4 border ${isSelected
                                        ? "bg-[#4F5ECE] border-[#4F5ECE]"
                                        : "bg-[#EBEFFF] dark:bg-[#2A2D2E] border-gray-200 dark:border-[#3a3b3b]"
                                        }`}>
                                        {isSelected && (
                                            <IoCheckmarkOutline size={12} className="text-white" />
                                        )}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-[#94A3B8] dark:bg-[#323539] flex items-center justify-center text-white text-[13px] font-bold mr-4 shadow-sm">
                                        {emp.username?.substring(0, 2).toUpperCase()}
                                    </div>

                                    {/* Text Info */}
                                    <div className="flex-1 overflow-hidden">
                                        <h4 className="text-[15px] font-bold text-[#1F2937] dark:text-[var(--text-strong)] leading-tight truncate">
                                            {emp.username}
                                        </h4>
                                        <p className="text-[13px] text-[#9CA3AF] dark:text-[var(--text-soft)] mt-0.5 truncate">
                                            {emp.position_info?.name || emp.position || "Lavozim ko'rsatilmadi"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {employees?.length === 0 && (
                            <div className="flex justify-center items-center h-[300px]">
                                <p className="text-gray-400 dark:text-[var(--text-soft)]">{loading ? "Yuklanmoqda..." : `Hech qanday ${title.toLowerCase()?.split(" ")[0] || "ma'lumot"} topilmadi.`}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex  items-center justify-between mt-8 pt-6">
                        <span className="text-gray-500 dark:text-[var(--text-soft)] font-medium text-sm">
                            {selectedIds.length} ta tanlangan
                        </span>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedIds([])}
                                className="flex items-center gap-2 px-6 py-2.5 text-gray-700 dark:text-[var(--text-strong)] font-semibold hover:bg-gray-100 dark:hover:bg-[var(--bg-elevation-2)] cursor-pointer rounded-xl text-sm"
                            >
                                <IoClose size={20} />
                                Tozalash
                            </button>
                            <button
                                onClick={() => onConfirm(selectedIds)}
                                className="flex items-center gap-2 px-8 py-2.5 bg-[#4F5ECE] text-white font-semibold rounded-2xl hover:bg-[#4351b5] cursor-pointer shadow-lg shadow-indigo-200 dark:shadow-none text-sm"
                            >
                                <IoCheckmarkOutline size={20} />
                                Qo'shish
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeStep;