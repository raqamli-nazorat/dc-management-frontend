import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { axiosAPI } from "../../../../service/axiosAPI";
import { toast } from "../../../../Toast/ToastProvider";
import { IoSearchOutline, IoClose, IoCheckmarkOutline } from "react-icons/io5";
import { FaArrowLeft } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";

const ProjectsStep = ({ selectedList = [], onConfirm, onClose }) => {
     const [Projects, setProjects] = useState([]);
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

     const getProjects = async ({ search }) => {
          setLoading(true);
          try {
               const { data } = await axiosAPI.get("projects/", { params: { search } });
               setProjects(data?.data?.results || []);
          } catch (error) {
               console.error(error);
               toast.error(error.response?.data?.error?.errorMgs || "Loyihalarni yuklashda xatolik yuz berdi.");
          } finally {
               setLoading(false);
          }
     };

     useEffect(() => {
          const timer = setTimeout(() => {
               getProjects({ search: searchTerm });
          }, 300);
          return () => clearTimeout(timer);
     }, [searchTerm]);

     const toggleSelect = (id) => {
          setSelectedIds(prev =>
               prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
          );
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
                         <h2 className="ml-2 text-[17px] font-bold text-[#1A1D2E]">Loyiha tanlang</h2>
                    </div>

                    <div className="p-6">
                         {/* Search */}
                         <div className="relative mb-6">
                              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                              <input
                                   type="text"
                                   placeholder="Izlash..."
                                   className="w-full pl-10 pr-4 py-2 bg-[#F8F9FD] border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                                   value={searchTerm}
                                   onChange={(e) => setSearchTerm(e.target.value)}
                              />
                         </div>

                         {/* Project List */}
                         <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                              {Projects?.map((project) => {
                                   const projectDate = project.created_at ? dayjs(project.created_at).format('DD.MM.YYYY') : '';
                                   const initials = project.title ? project.title.substring(0, 2).toUpperCase() : project.uid?.substring(0, 2)?.toUpperCase() || 'PR';
                                   const isSelected = selectedIds.includes(project.id);

                                   return (
                                        <div
                                             key={project.id}
                                             onClick={() => toggleSelect(project.id)}
                                             className={`flex items-center px-4 py-3.5 rounded-[16px] border cursor-pointer transition-all ${isSelected
                                                       ? "border-[#4F5ECE] bg-[#F5F7FF]"
                                                       : "border-[#F1F5F9] bg-white hover:border-gray-200"
                                                  }`}
                                        >
                                             <div className="flex items-center flex-1 min-w-0">
                                                  {/* Selection Indicator */}
                                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center mr-4 transition-all shrink-0 ${isSelected
                                                            ? "bg-[#4F5ECE]"
                                                            : "bg-[#EBEFFF]"
                                                       }`}>
                                                       {isSelected && (
                                                            <IoCheckmarkOutline size={14} className="text-white" />
                                                       )}
                                                  </div>

                                                  {/* Avatar */}
                                                  <div className="w-10 h-10 rounded-full bg-[#94A3B8] flex items-center justify-center text-white text-[13px] font-bold mr-4 shrink-0 shadow-sm">
                                                       {initials}
                                                  </div>

                                                  {/* Text Info */}
                                                  <div className="flex-1 min-w-0">
                                                       <h4 className="text-[15px] font-bold text-[#1F2937] leading-tight truncate">
                                                            {project.title || project.uid}
                                                       </h4>
                                                       <p className="text-[13px] text-[#9CA3AF] mt-0.5 truncate">
                                                            {project.description || project.manager_info?.username || "Loyiha haqida ma'lumot yo'q"}
                                                       </p>
                                                  </div>
                                             </div>
                                             <span className="text-[13px] whitespace-nowrap text-[#9CA3AF] ml-2">
                                                  {projectDate}
                                             </span>
                                        </div>
                                   );
                              })}

                              {Projects?.length === 0 && (
                                   <div className="flex justify-center items-center h-[400px]">
                                        <p className="text-gray-500">{loading ? "Yuklanmoqda..." : "Hech qanday loyiha topilmadi."}</p>
                                   </div>
                              )}
                         </div>

                         {/* Footer */}
                         <div className="flex items-center justify-between mt-8 pt-2">
                              <span className="text-gray-500 font-medium">{selectedIds.length} ta tanlangan</span>
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

export default ProjectsStep;
