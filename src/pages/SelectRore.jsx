import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PiBuildingsBold } from "react-icons/pi";
import { SlGlobe } from "react-icons/sl";
import { LuUserRound } from "react-icons/lu";
import { useAuth } from "../context/AuthContext";
import { axiosAPI } from "../service/axiosAPI";
import { toast } from "../Toast/ToastProvider";
import { getRouteRole } from "../components/ProtectedRoute";
import { useTheme } from "../context/ThemeContext";

const roleConfigs = [
    { id: 'admin', label: 'Administrator', icon: PiBuildingsBold, type: 'icon' },
    { id: 'manager', label: 'Menejer', icon: '/imgs/Briefcase ', type: 'svg' },
    { id: 'accountant', label: 'Hisobchi', icon: '/imgs/Database ', type: 'svg' },
    { id: 'auditor', label: 'Nazoratchi', icon: SlGlobe, type: 'icon' },
    { id: 'employee', label: 'Xodim', icon: LuUserRound, type: 'icon' },
];

const SelectRore = () => {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { isDark } = useTheme();
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(false);

    // Login sahifasidan kelgan yoki AuthContext dagi rollarni olish
    const userRoles = location.state?.roles || user?.roles || [];
    const filteredRoles = [];
    const seenLabels = new Set();

    useEffect(() => {
        if (!location.state?.roles && user?.active_role) {
            const route = getRouteRole(user);
            navigate(`/${route}/dashboard`, { replace: true });
        }
    }, [location.state, user, navigate]);

    roleConfigs.forEach(config => {
        if (userRoles.includes(config.id) && !seenLabels.has(config.label)) {
            filteredRoles.push(config);
            seenLabels.add(config.label);
        }
    });

    const handleContinue = async () => {
        if (!selectedRole) return;

        setLoading(true);
        try {
            await axiosAPI.patch("users/me/", { active_role: selectedRole });

            // user yangilash
            const updatedUser = { ...user, active_role: selectedRole };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);

            // Dashboardga yo'naltirish
            const route = getRouteRole({ roles: [selectedRole] });
            navigate(`/${route}/dashboard`);
        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data?.error?.errorMsg || "Role almashtirishda xatolik yuz berdi!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F1F3F9] dark:bg-[#111111]" style={{ fontFamily: '"Manrope", sans-serif' }}>
            <div className="bg-white dark:bg-[#191A1A] rounded-[32px] p-10 shadow-[0_4px_32px_rgba(0,0,0,0.04)] w-full max-w-[480px] border border-[#EEF1F7] dark:border-[#292A2A]">
                <h1 className="text-[28px] font-extrabold text-[#1A1D2E] dark:text-white mb-3 leading-[1.2]">
                    Siz dasturni bir nechta rol bilan foydalanishingiz mumkin
                </h1>
                <p className="text-[#5B6078] dark:text-[#8E95B5] text-sm mb-9 font-medium">
                    Quyidagilardan birini tanlang.
                </p>

                <div className="flex flex-col gap-3 mb-10">
                    {filteredRoles.map((role) => {
                        const isSelected = selectedRole === role.id;
                        return (
                            <button
                                key={role.id}
                                onClick={() => setSelectedRole(role.id)}
                                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-200 border-2 text-left w-full group
                                    ${isSelected
                                        ? 'border-[#526ED3] bg-[#F8F9FC] dark:bg-[#222323] dark:border-[#526ED3]'
                                        : 'border-transparent bg-[#F1F3F9]/50 hover:bg-[#E9ECF5] dark:bg-[#222323] dark:hover:bg-[#2A2B2B]'
                                    }`
                                }
                            >
                                <div className={`flex items-center justify-center w-6 h-6 transition-colors
                                    ${isSelected ? 'text-[#526ED3]' : 'text-[#1A1D2E] dark:text-white opacity-80 group-hover:opacity-100'}`
                                }>
                                    {role.type === 'icon' ? (
                                        <role.icon size={20} />
                                    ) : (
                                        <img
                                            src={(!isDark ? role.icon : role.icon + "(1)") + ".svg"}
                                            alt={role.label}
                                            className={`w-5 h-5 object-contain transition-all ${isSelected ? 'brightness-100' : 'brightness-0 dark:brightness-100 opacity-80 group-hover:opacity-100'}`}
                                            style={isSelected ? { filter: 'invert(44%) sepia(85%) saturate(738%) hue-rotate(198deg) brightness(91%) contrast(93%)' } : {}}
                                        />
                                    )}
                                </div>
                                <span className={`font-bold text-[15px] transition-colors ${isSelected ? 'text-[#526ED3]' : 'text-[#1A1D2E] dark:text-white'}`}>
                                    {role.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={handleContinue}
                    disabled={!selectedRole || loading}
                    className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 
                        ${selectedRole && !loading
                            ? 'bg-[#3F57B3] text-white hover:bg-[#526ED3] cursor-pointer shadow-lg shadow-[#3F57B3]/20 active:scale-[0.98]'
                            : 'bg-[#E9ECF5] text-[#B6BCCB] cursor-not-allowed dark:bg-[#292A2A] dark:text-[#5B6078]'
                        }`
                    }
                >
                    {loading ? "Yuklanmoqda..." : "Davom etish"}
                </button>
            </div>
        </div>
    );
}

export default SelectRore;

