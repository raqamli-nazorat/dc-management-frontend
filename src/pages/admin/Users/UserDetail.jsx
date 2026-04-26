import { FaArrowLeft, FaCamera, FaTrash, FaUser } from "react-icons/fa"
import FilterSelect from "../Components/FilterSelect"
import { usePageAction } from "../../../context/PageActionContext"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { axiosAPI } from "../../../service/axiosAPI"
import { FaFileLines, FaXmark } from "react-icons/fa6"
import { FiGithub } from "react-icons/fi"
import { CiLinkedin } from "react-icons/ci"
import { PiTelegramLogo } from "react-icons/pi"
import { toast } from "../../../Toast/ToastProvider"

const Dropdown = FilterSelect

const Roles = {
    superadmin: 'Bosh administrator',
    admin: 'Admin',
    manager: 'Menejer',
    employee: 'Xodim',
    auditor: 'Nazoratchi',
    accountant: 'Hisobchi',
}

const UserDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const { registerBreadcrumb, clearBreadcrumb } = usePageAction()

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [positions, setPositions] = useState([])

    const [form, setForm] = useState({})
    const [isDirty, setIsDirty] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    useEffect(() => {
        const getUser = async () => {
            try {
                setLoading(true)
                const res = await axiosAPI.get(`users/${id}`)
                setUser(res.data)
                setLoading(false)
            } catch (error) {
                console.error(error)
                setLoading(false)
            }
        }

        getUser()
    }, [id])

    const [regions, setRegions] = useState([])
    const [districts, setDistricts] = useState([])

    const getDetails = async () => {
        try {
            const regions = await axiosAPI.get('applications/regions/')

            const positions = await axiosAPI.get('applications/positions/')

            setRegions(regions.data.data.results)
            setPositions(positions.data.data.results)
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        getDetails()
    }, [])

    useEffect(() => {
        if (form.region) {
            axiosAPI.get(`/applications/districts/?region=${form.region}`)
                .then(res => setDistricts(res.data.data.results))
                .catch(err => console.error(err))
        }
    }, [form.region])

    useEffect(() => {
        if (user) {
            const userData = user.data || user;
            const pSeries = userData.passport_series ? userData.passport_series.replace(/[^a-zA-Z]/g, '') : '';
            const pRaqam = userData.passport_series ? userData.passport_series.replace(/\D/g, '') : '';

            setForm({
                name: userData.name || userData.username || '',
                password: '',
                fixed_salary: userData.fixed_salary ?? '',
                balance: userData.balance ?? '',
                region: userData.region || '',
                district: userData.district || '',
                passportSeria: pSeries,
                passportRaqam: pRaqam,
                position: userData.position || '',
                roles: (userData.roles || []).map(r => Roles[r] || r),
                github: userData.social_links?.github || '',
                linkedin: userData.social_links?.linkedin || '',
                telegram: userData.social_links?.telegram || '',
                avatar: userData.avatar || null,
                passport_image: userData.passport_image || null,
            })
        }
    }, [user])

    useEffect(() => {
        if (user) {
            const userData = user.data || user;
            const displayName = userData.name || userData.username || 'Foydalanuvchi'
            registerBreadcrumb(displayName)
            return () => clearBreadcrumb()
        }
    }, [user, registerBreadcrumb, clearBreadcrumb])

    const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); setIsDirty(true) }

    const initial = user ? (() => {
        const userData = user.data || user;
        const pSeries = userData.passport_series ? userData.passport_series.replace(/[^a-zA-Z]/g, '') : '';
        const pRaqam = userData.passport_series ? userData.passport_series.replace(/\D/g, '') : '';
        return {
            name: userData.name || userData.username || '',
            password: '',
            fixed_salary: userData.fixed_salary ?? '',
            balance: userData.balance ?? '',
            region: userData.region || '',
            district: userData.district || '',
            passportSeria: pSeries,
            passportRaqam: pRaqam,
            position: userData.position || '',
            roles: (userData.roles || []).map(r => Roles[r] || r),
            github: userData.social_links?.github || '',
            linkedin: userData.social_links?.linkedin || '',
            telegram: userData.social_links?.telegram || '',
            avatar: userData.avatar || null,
            passport_image: userData.passport_image?.startsWith('http') ? userData.passport_image : `https://s3.raqamlinazorat.uz${userData.passport_image}`,
        }
    })() : {}

    const handleCancel = () => { setForm(initial); setIsDirty(false) }

    const handleSave = async () => {
        try {
            const formData = new FormData();

            Object.keys(form).forEach(key => {
                const value = form[key];
                if (!(value instanceof File) && key !== 'roles' && key !== 'avatar' && key !== 'passport_image') {
                    formData.append(key, value || '');
                }
            });

            if (form.avatar instanceof File) formData.append('avatar', form.avatar);
            if (form.passport_image instanceof File) formData.append('passport_image', form.passport_image);

            const roleKeys = form.roles.map(r => Object.keys(Roles).find(k => Roles[k] === r));
            roleKeys.forEach(role => formData.append('roles', role));

            formData.append('position', positions.find(item => item.name === form.position)?.id || '');
            formData.append('passport_series', form.passportSeria + form.passportRaqam);

            const { data } = await axiosAPI.patch(`users/${id}/`, formData);

            setUser(data);
            setIsDirty(false);
            toast.success("Ma'lumotlar saqlandi");
        } catch (error) {
            console.error(error)
            const errData = error?.response?.data?.error;

            // Field-level detail xatolarini chiqarish (masalan: password, name ...)
            let errMsg = "Xatolik yuz berdi";
            if (errData?.details && typeof errData.details === 'object') {
                const detailMsgs = Object.values(errData.details).flat().join(' ');
                if (detailMsgs) errMsg = detailMsgs;
            } else if (errData?.errorMsg) {
                errMsg = errData.errorMsg;
            } else if (typeof error?.response?.data === 'string') {
                errMsg = error.response.data;
            }

            toast.error(errMsg);
        }
    };

    const handleDelateUser = () => {
        try {
            axiosAPI.delete(`users/${id}/`);
            toast.success("Foydalanuvchi o'chirildi");
            navigate('/admin/users');
        } catch (error) {
            console.error(error)
            toast.error("Foydalanuvchi o'chirilmadi");
        }
    }

    if (loading) return <span>Loading...</span>
    if (!user) return <span>User not found</span>

    const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm outline-none border transition-colors
      bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#B6BCCB]
      dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5]`
    const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1'

    return (
        <>
            <div className="flex flex-col gap-5">
                {/* Confirm Delete Modal */}
                {confirmDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="fixed inset-0 bg-black/60" />
                        <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323] p-7">
                            <button onClick={() => setConfirmDelete(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:bg-[#292A2A] dark:hover:bg-[#333435] text-[#5B6078] dark:text-[#C2C8E0] cursor-pointer transition-colors z-10">
                                <FaXmark size={14} />
                            </button>
                            <div className="flex items-center gap-3 mb-3">
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    className="text-[#1A1D2E] dark:text-[#FFFFFF] hover:opacity-70 cursor-pointer"
                                >
                                    <FaArrowLeft size={16} />
                                </button>
                                <h2 className="text-lg font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Foydalanuvchini o'chirmoqchimisiz?</h2>
                            </div>
                            <p className="text-sm text-[#8F95A8] dark:text-[#C2C8E0] mb-6">
                                Bu foydalanuvchi tizimdan o'chiriladi va unga tegishli ma'lumotlar o'chirish mumkin.
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]"
                                >
                                    <FaXmark size={14} /> Bekor qilish
                                </button>
                                <button
                                    onClick={handleDelateUser}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer bg-[#E02D2D] text-white hover:bg-[#c42424]"
                                >
                                    O'chirish
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-[#FFFFFF]">Foydalanuvchining ma'lumotlari</h1>
                    <div className="flex items-center gap-2">
                        {isDirty && (
                            <button
                                onClick={handleCancel}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer bg-white border-[#E2E6F2] text-[#1A1D2E] hover:bg-[#F1F3F9] dark:bg-[#222323] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:hover:bg-[#292A2A]"
                            >
                                <FaArrowLeft size={13} /> Bekor qilish
                            </button>
                        )}
                        <button
                            onClick={() => setConfirmDelete(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer text-[#E02D2D] bg-[#FFF2F2] hover:bg-[#fdcaca] dark:text-[#FA5252] dark:hover:bg-[#E02D2D]/6 dark:bg-[#E02D2D]/10"
                        >
                            <FaTrash size={13} /> O'chirish
                        </button>
                    </div>
                </div>

                {/* Avatar */}
                <div className="relative overflow-hidden avatar w-[80px] h-[80px] rounded-xl">
                    {form.avatar ? (
                        <img
                            src={typeof form.avatar === 'string' ? form.avatar : URL.createObjectURL(form.avatar)}
                            alt={form.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div
                            className="w-full h-full rounded-xl bg-gradient-to-br from-[#bdc4eb] to-[#a1abf7] flex items-center justify-center  cursor-pointer"
                            onClick={() => document.getElementById('avatar-input').click()}
                        >
                            <FaUser color="#fff" size={50} />
                        </div>
                    )}
                    <label>
                        <span className="bg-[#3F67FF] rounded-full p-1.5 absolute left-[55px] bottom-0 cursor-pointer cam">
                            <FaCamera className="text-white" size={13} />
                        </span>
                        <input
                            type="file"
                            hidden
                            accept="image/*"
                            id='avatar-input'
                            onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    set('avatar', file)
                                }
                            }}
                        />
                    </label>
                </div>

                {/* Form */}
                <div className="flex flex-col gap-4">

                    {/* Ism */}
                    <div>
                        <label className={labelCls}>Ism Sharifi</label>
                        <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} />
                    </div>

                    {/* Parol + Maosh + Balans */}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className={labelCls}>Parol</label>
                            <input
                                className={inputCls}
                                type="password"
                                placeholder="Yangi parol"
                                value={form.password}
                                onChange={e => set('password', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Oylik maosh (UZS)</label>
                            <input
                                className={inputCls + ' text-right'}
                                type="text"
                                inputMode="numeric"
                                value={form.fixed_salary === '' ? '' : Number(form.fixed_salary).toLocaleString('ru-RU')}
                                onChange={e => {
                                    const raw = e.target.value.replace(/\D/g, '')
                                    set('fixed_salary', raw === '' ? '' : Number(raw))
                                }}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Balansi (UZS)</label>
                            <input
                                className={inputCls + ' text-right'}
                                type="text"
                                inputMode="numeric"
                                value={form.balance === '' ? '' : Number(form.balance).toLocaleString('ru-RU')}
                                onChange={e => {
                                    const raw = e.target.value.replace(/\D/g, '')
                                    set('balance', raw === '' ? '' : Number(raw))
                                }}
                            />
                        </div>
                    </div>

                    {/* Viloyat + Tuman */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Viloyat</label>
                            <FilterSelect
                                options={['Viloyatni tanlang', ...regions.map(r => r.name)]}
                                value={regions.find(r => r.id === form.region)?.name || 'Viloyatni tanlang'}
                                onChange={v => set('region', v === 'Viloyatni tanlang' ? '' : regions.find(r => r.name === v).id)}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Tuman</label>
                            <FilterSelect
                                options={['Tuman tanlang', ...districts.map(d => d.name)]}
                                value={districts.find(d => d.id === form.district)?.name || 'Tuman tanlang'}
                                onChange={v => set('district', v === 'Tuman tanlang' ? '' : districts.find(d => d.name === v).id)}
                                disabled={!form.region}
                            />
                        </div>
                    </div>

                    {/* Passport */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Passport ma'lumotlari</label>
                            <div className="flex gap-2">
                                <input className={inputCls} style={{ maxWidth: 72 }} placeholder="AA" maxLength={2}
                                    value={form.passportSeria}
                                    onChange={e => set('passportSeria', e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2))} />
                                <input className={inputCls} placeholder="1234567" maxLength={7}
                                    value={form.passportRaqam}
                                    onChange={e => set('passportRaqam', e.target.value.replace(/\D/g, '').slice(0, 7))} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Passport rasmi</label>
                            {form.passport_image ? (
                                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm bg-white border-[#E2E6F2] text-[#5B6078] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#C2C8E0]">
                                    <FaFileLines size={14} className="shrink-0" />
                                    <a href={typeof form.passport_image === 'string' ? form.passport_image : URL.createObjectURL(form.passport_image)} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline text-[#3F57B3]">
                                        Passport faylini ko'rish
                                    </a>
                                    <button
                                        onClick={() => set('passport_image', null)}
                                        className="text-[#E02D2D] hover:opacity-70 transition-opacity cursor-pointer shrink-0"
                                        title="O'chirish"
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-3 pl-3 pr-1.5 py-1.5 rounded-lg border text-sm bg-[#F8F9FC] border-[#E2E6F2] text-[#8F95A8] dark:bg-[#1C1D1D] dark:border-[#292A2A] dark:text-[#8E95B5]">
                                    <span className="truncate">Fayl yuklanmagan</span>
                                    <label className="cursor-pointer bg-[#3F57B3] text-white px-3 py-1.5 rounded-md hover:bg-[#32458C] transition-colors text-xs font-medium shrink-0">
                                        Fayl yuklash
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={e => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                    set('passport_image', file)
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Social links */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { key: 'github', label: 'GitHub', Icon: FiGithub, placeholder: 'Github havola' },
                            { key: 'linkedin', label: 'Linkedin', Icon: CiLinkedin, placeholder: 'Linkedin havola' },
                            { key: 'telegram', label: 'Telegram', Icon: PiTelegramLogo, placeholder: 'Telegram havola' },
                        ].map(({ key, label, Icon, placeholder }) => (
                            <div key={key}>
                                <label className={labelCls + ' flex items-center gap-1.5'}>
                                    {label} <Icon size={14} className="text-[#5B6078] dark:text-[#C2C8E0]" />
                                </label>
                                <input className={inputCls} placeholder={placeholder}
                                    value={form[key] || ''} onChange={e => set(key, e.target.value)} />
                            </div>
                        ))}
                    </div>

                    {/* Lavozim + Rol — space-between */}
                    <div className="flex items-center justify-between gap-5">
                        <div className="flex items-center gap-2 justify-between w-[50%]">
                            <div className='flex items-center gap-2'>
                                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 " />
                                <span className="text-sm font-medium text-[#1A1D2E] dark:text-[#FFFFFF] shrink-0">Lavozimi</span>
                            </div>
                            <Dropdown
                                width={200}
                                label="Tanlash"
                                options={positions.map(p => p.name)}
                                value={positions.find(item => item.id === form.position)?.name || ''}
                                onChange={v => set('position', positions.find(p => p.name === v)?.id || v)}
                            />
                        </div>
                        <div className="flex items-center gap-2 justify-between w-[50%]">
                            <div className='flex items-center gap-2'>
                                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                <span className="text-sm font-medium text-[#1A1D2E] dark:text-[#FFFFFF] shrink-0">Rolli</span>
                            </div>

                            <Dropdown
                                width={200}
                                label="Tanlash"
                                options={Object.values(Roles)}
                                value={form.roles}
                                onChange={v => set('roles', v)}
                                multiple
                            />
                        </div>
                    </div>


                </div>
                {/* Footer / Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2E6F2] dark:border-[#292A2A]">
                    <button
                        onClick={handleCancel}
                        className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-[#5B6078] bg-[#F1F3F9] hover:bg-[#E2E6F2] dark:text-[#C2C8E0] dark:bg-[#292A2A] dark:hover:bg-[#363737]"
                    >
                        Tozalash
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer text-white bg-[#3F57B3] hover:bg-[#32458C]"
                    >
                        Saqlash
                    </button>
                </div>
            </div>
            <style>{
                `
                .cam{
                    transition: all 0.3s;
                    transform: translateY(25px);
                    opacity: 0;
                }
                .avatar:hover .cam{
                    transform: translateY(0) !important;
                    opacity: 1 !important;
                }
                `
            }</style>
        </>
    )
}

export default UserDetail