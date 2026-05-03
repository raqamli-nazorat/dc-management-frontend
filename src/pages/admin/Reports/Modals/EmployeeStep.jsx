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

const EmployeeStep = ({ selectedList = [], onConfirm, onClose, employee_role = "all", title = "Boshqaruvchi tanlang" }) => {
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

        const params = { search };

        if (employee_role !== "all" && employee_role !== "tester") {
            params.roles = employee_role;
        }

        setLoading(true);
        try {
            const { data } = await axiosAPI.get(employee_role === "tester" ? "reports/projects/all-testers/" : "users/", { params });

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

    // Hammasini tanlash
    const toggleAll = () => {
        if (selectedIds.length === employees?.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(employees?.map(emp => emp.id));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-[600px] bg-white rounded-[24px] shadow-2xl overflow-hidden">
                <button onClick={onClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer  bg-white/20 text-white hover:bg-white/30">
                    <FaXmark size={16} />
                </button>
                {/* Modal Header */}
                <div className="flex items-center px-6 py-4 border-b border-b-gray-100">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full ">
                        <FaArrowLeft size={18} />
                    </button>
                    <h2 className="ml-2 text-[17px] font-bold text-[#1A1D2E]">{title}</h2>
                </div>

                <div className="p-6">
                    {/* Controls: Search */}
                    <div className="flex items-center justify-end gap-4 mb-6">
                        <div className="relative w-full">
                            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Ism Sharifi bo'yicha izlash..."
                                className="w-full pl-10 pr-4 py-2 bg-[#F8F9FD] border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Employee List */}
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {employees?.map((emp) => (
                            <div
                                key={emp.id}
                                onClick={() => toggleSelect(emp.id)}
                                className={`flex items-center px-4 py-3.5 rounded-[16px] border cursor-pointer transition-all ${selectedIds.includes(emp.id)
                                    ? "border-[#4F5ECE] bg-[#F5F7FF]"
                                    : "border-[#F1F5F9] bg-white hover:border-gray-200"
                                    }`}
                            >
                                {/* Selection Indicator */}
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-4 transition-all ${selectedIds.includes(emp.id)
                                    ? "bg-[#4F5ECE]"
                                    : "bg-[#EBEFFF]" 
                                    }`}>
                                    {selectedIds.includes(emp.id) && (
                                        <IoCheckmarkOutline size={14} className="text-white" />
                                    )}
                                </div>

                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-full bg-[#94A3B8] flex items-center justify-center text-white text-[13px] font-bold mr-4 shadow-sm">
                                    {emp.username?.substring(0, 2).toUpperCase()}
                                </div>

                                {/* Text Info */}
                                <div className="flex-1">
                                    <h4 className="text-[15px] font-bold text-[#1F2937] leading-tight">
                                        {emp.username}
                                    </h4>
                                    <p className="text-[13px] text-[#9CA3AF] mt-0.5">
                                        {emp.position_info?.name || "Lavozim ko'rsatilmadi"}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {employees?.length === 0 && (
                            <div className="flex justify-center items-center h-[400px]">
                                <p className="text-gray-500">{loading ? "Yuklanmoqda..." : `Hech qanday ${title.toLowerCase()?.split(" ")[0] || "ma'lumot"} topilmadi.`}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between mt-8 pt-2">
                        <span className="text-gray-500 font-medium">
                            {selectedIds.length} ta tanlangan
                        </span>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedIds([])}
                                className="flex items-center gap-2 px-6 py-2.5 text-gray-700 font-semibold hover:bg-gray-100 rounded-xl "
                            >
                                <IoClose size={20} />
                                Tozalash
                            </button>
                            <button
                                onClick={() => onConfirm(selectedIds)}
                                className="flex items-center gap-2 px-8 py-2.5 bg-[#4F5ECE] text-white font-semibold rounded-xl hover:bg-[#4351b5] shadow-lg shadow-indigo-200 transition-all"
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