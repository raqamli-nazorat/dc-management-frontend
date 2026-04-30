import { useState, useEffect, useMemo } from "react";
import { axiosAPI } from "../../../../service/axiosAPI";
import { toast } from "../../../../Toast/ToastProvider";
import {
    IoSearchOutline,
    IoClose,
    IoChevronBack,
    IoCheckmarkOutline,
    IoCheckmark
} from "react-icons/io5";
import { MdOutlinePlaylistAddCheck } from "react-icons/md";
import { FaArrowLeft } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";

const EmployeeStep = ({ selectedList = [], onConfirm, onClose }) => {
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState(selectedList.map(emp => emp.id));
    const [loading, setLoading] = useState(true );

    // Ma'lumotlarni yuklash
    const getEmployee = async ({ search }) => {
        setLoading(true);
        try {
            const { data } = await axiosAPI.get("users/", { params: { search } });
            setEmployees(data?.data?.results || []);
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error?.errorMgs || "Xodimlarni yuklashda xatolik yuz berdi.");
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
                <button onClick={onClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors bg-white/20 text-white hover:bg-white/30">
                    <FaXmark size={16} />
                </button>
                {/* Modal Header */}
                <div className="flex items-center px-6 py-4 border-b border-b-gray-100">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <FaArrowLeft size={18} />
                    </button>
                    <h2 className="ml-2 text-[17px] font-bold text-[#1A1D2E]">Boshqaruvchi tanlang</h2>
                </div>

                <div className="p-6">
                    {/* Controls: Select All & Search */}
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <button
                            onClick={toggleAll}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
                        >
                            <MdOutlinePlaylistAddCheck size={20} />
                            <span className="text-sm font-medium">Barchasini tanlash</span>
                        </button>

                        <div className="relative w-[300px]">
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
                                className={`flex items-center p-3 rounded-[16px] border cursor-pointer transition-all ${selectedIds.includes(emp.id)
                                        ? "border-indigo-500 bg-indigo-50/30"
                                        : "border-gray-100 bg-[#F8F9FD] hover:border-gray-300"
                                    }`}
                            >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-4 transition-all ${selectedIds.includes(emp.id) ? "bg-indigo-600 border-indigo-600" : "bg-white border-gray-300"
                                    }`}>
                                    {selectedIds.includes(emp.id) && <IoCheckmark className="text-white" size={14} />}
                                </div>

                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium mr-3">
                                    {emp.username?.substring(0, 2).toUpperCase()}
                                </div>

                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{emp.username}</h4>
                                    <p className="text-sm text-gray-500">{emp.position_info?.name || "Lavozim ko'rsatilmadi"}</p>
                                </div>
                            </div>
                        ))}

                        {employees?.length === 0 && (
                            <div className="flex justify-center items-center h-[400px]">
                                <p className="text-gray-500">{loading ? "Yuklanmoqda..." : "Hech qanday boshqaruvchi topilmadi."}</p>
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
                                className="flex items-center gap-2 px-6 py-2.5 text-gray-700 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
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