import { FaArrowLeft, FaCamera, FaTrash, FaUser } from "react-icons/fa"
import FilterSelect from "../Components/FilterSelect"
import { usePageAction } from "../../../context/PageActionContext"
import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { axiosAPI } from "../../../service/axiosAPI"
import { FaArrowsRotate, FaCheck, FaFileLines, FaXmark } from "react-icons/fa6"
import { PiTelegramLogo } from "react-icons/pi"
import { FiPlus } from "react-icons/fi"
import { useAuth } from "../../../context/AuthContext"
import { toast } from "../../../Toast/ToastProvider"
import { useImagePaste } from "../../../hooks/useImagePaste"

const Dropdown = FilterSelect

const Roles = {
    admin: 'Admin',
    manager: 'Menejer',
    employee: 'Xodim',
    auditor: 'Nazoratchi',
    accountant: 'Hisobchi',
}

const formatPhone = (val) => {
    let digits = val.replace(/\D/g, '');
    if (digits.length < 3) return '+998';
    if (!digits.startsWith('998')) digits = '998' + digits;

    digits = digits.slice(0, 12);
    let res = '+' + digits.slice(0, 3);
    if (digits.length > 3) res += ' ' + digits.slice(3, 5);
    if (digits.length > 5) res += ' ' + digits.slice(5, 8);
    if (digits.length > 8) res += ' ' + digits.slice(8, 10);
    if (digits.length > 10) res += ' ' + digits.slice(10, 12);
    return res;
}

const formatNum = (val) => {
    if (!val && val !== 0) return '';

    let cleanVal = val.toString().replace(/[^\d.]/g, '');

    let [integerPart, decimalPart] = cleanVal.split('.');

    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

    if (decimalPart !== undefined) {
        const sliced = decimalPart.slice(0, 2);
        if (sliced === '00') {
            return integerPart === '0' ? '' : integerPart;
        }
        return `${integerPart}.${sliced}`;
    }

    return integerPart === '0' ? '' : integerPart;
}

const formatCard = (val) => {
    if (!val) return '';
    let value = val;
    
    let digits = String(value).replace(/\D/g, '').slice(0, 16);
    return digits.match(/.{1,4}/g)?.join(' ') || digits;
}

const UserDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const { user: userInfo } = useAuth()
    const isAuditor = userInfo?.active_role === "auditor"

    const { registerBreadcrumb, clearBreadcrumb } = usePageAction()

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)
    const [positions, setPositions] = useState([])

    const [form, setForm] = useState({})
    const [confirmDelete, setConfirmDelete] = useState(false)

    const getUser = async (refresh = false) => {
        try {
            if (!refresh) setLoading(true)
            const { data } = await axiosAPI.get(`users/${id}`)
            setUser(data.data)
            if (!refresh) setLoading(false)

            if (refresh) {
                toast.success("Ma'lumotlar yangilandi!")
            }
        } catch (error) {
            console.error(error)
            setLoading(false)
        }
    }

    useEffect(() => {
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
        if (form.region_info?.id) {
            axiosAPI.get(`/applications/districts/?region=${form.region_info.id}`)
                .then(res => setDistricts(res.data.data.results))
                .catch(err => console.error(err))
        }
    }, [form.region_info?.id])

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
                phone_number: formatPhone(userData.phone_number || ''),
                card_number: formatCard(userData.card_number || ''),
                region_info: userData.region_info || null,
                district_info: userData.district_info || null,
                position_info: userData.position_info || null,
                passportSeria: pSeries,
                passportRaqam: pRaqam,
                roles: (userData.roles || []).map(r => Roles[r] || r),
                links: Array.isArray(userData.social_links) ? userData.social_links : (userData.social_links ? Object.values(userData.social_links) : ['']),
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

    useImagePaste((files) => {
        if (!isAuditor && files && files.length > 0) {
            set('avatar', files[0]);
        }
    });

    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    const initial = user ? (() => {
        const userData = user.data || user;
        const pSeries = userData.passport_series ? userData.passport_series.replace(/[^a-zA-Z]/g, '') : '';
        const pRaqam = userData.passport_series ? userData.passport_series.replace(/\D/g, '') : '';
        return {
            name: userData.name || userData.username || '',
            password: '',
            fixed_salary: userData.fixed_salary ?? '',
            balance: userData.balance ?? '',
            phone_number: formatPhone(userData.phone_number || ''),
            card_number: formatCard(userData.card_number || ''),
            region_info: userData.region_info || null,
            district_info: userData.district_info || null,
            position_info: userData.position_info || null,
            passportSeria: pSeries,
            passportRaqam: pRaqam,
            roles: (userData.roles || []).map(r => Roles[r] || r),
            links: Array.isArray(userData.social_links) ? userData.social_links : (userData.social_links ? Object.values(userData.social_links) : ['']),
            avatar: userData.avatar || null,
            passport_image: userData.passport_image?.startsWith('http') ? userData.passport_image : `https://s3.raqamlinazorat.uz${userData.passport_image}`,
        }
    })() : {}


    const handleSave = async () => {
        try {
            const formData = new FormData()

            // Ism o'zgargan bo'lsa
            if (form.name !== initial.name) {
                formData.append('username', form.name)
            }

            // Parol kiritilgan bo'lsa
            if (form.password) {
                formData.append('password', form.password)
                formData.append('confirm_password', form.password)
            }

            // Oylik maosh o'zgargan bo'lsa
            const salary = form.fixed_salary?.toString().replace(/\s/g, '') || ''
            const initialSalary = initial.fixed_salary?.toString().replace(/\s/g, '') || ''
            if (salary !== initialSalary) {
                formData.append('fixed_salary', salary)
            }

            // Viloyat, tuman va lavozim o'zgargan bo'lsa (ID larni jo'natamiz)
            if (form.region_info?.id !== initial.region_info?.id) {
                formData.append('region', form.region_info?.id || '')
            }
            if (form.district_info?.id !== initial.district_info?.id) {
                formData.append('district', form.district_info?.id || '')
            }
            if (form.position_info?.id !== initial.position_info?.id) {
                formData.append('position', form.position_info?.id || '')
            }

            // Rollar o'zgargan bo'lsa
            const rolesChanged = JSON.stringify([...(form.roles || [])].sort()) !== JSON.stringify([...(initial.roles || [])].sort())
            if (rolesChanged) {
                form.roles.map(r => Object.keys(Roles).find(k => Roles[k] === r) || r)
                    .forEach(role => formData.append('roles', role))
            }

            // Rasmlar o'zgargan bo'lsa (yangi fayl tanlangan bo'lsa)
            if (form.avatar instanceof File) {
                formData.append('avatar', form.avatar)
            }
            if (form.passport_image instanceof File) {
                formData.append('passport_image', form.passport_image)
            }

            // Passport seriya va raqami o'zgargan bo'lsa
            if (form.passportSeria !== initial.passportSeria || form.passportRaqam !== initial.passportRaqam) {
                formData.append('passport_series', (form.passportSeria || '') + (form.passportRaqam || ''))
            }

            // Telefon raqami o'zgargan bo'lsa
            if (form.phone_number !== initial.phone_number) {
                formData.append('phone_number', form.phone_number?.replace(/\s/g, ''))
            }

            // Karta raqami o'zgargan bo'lsa
            if (form.card_number !== initial.card_number) {
                if (form.card_number?.replace(/\s/g, '')?.length < 16) {
                    toast.error("Karta raqami 16 xonadan kam bo'lishi mumkin emas!")
                    return
                }
                formData.append('card_number', form.card_number?.replace(/\s/g, ''))
            }

            // Ijtimoiy tarmoqlar o'zgargan bo'lsa
            if (JSON.stringify(form.links) !== JSON.stringify(initial.links)) {
                formData.append("social_links", JSON.stringify(form.links.filter(l => l?.trim())))
            }

            const { data } = await axiosAPI.patch(`users/${id}/`, formData);

            setUser(data);
            toast.success("Ma'lumotlar saqlandi");
        } catch (error) {
            console.error(error)
            const errData = error?.response?.data?.error;

            // Field-level detail xatolarini chiqarish (masalan: password, name ...)
            let errMsg = "Xatolik yuz berdi" || error?.response?.data?.error?.errorMsg;
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 min-h-[70vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[var(--accent-strong)]"></div>
                <p className='text-[var(--text-sub)]'>Yuklanmoqda...</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 text-[var(--text-sub)]">
                <div className="w-20 h-20 rounded-full bg-[var(--bg-elevation-1)] flex items-center justify-center shadow-inner">
                    <FaUser size={40} className="opacity-20" />
                </div>
                <div className="text-center">
                    <p className="text-xl font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] mb-1">Foydalanuvchi topilmadi</p>
                    <p className="text-sm">Qidirilayotgan foydalanuvchi mavjud emas yoki o'chirilgan bo'lishi mumkin.</p>
                </div>
                <button
                    onClick={() => navigate('/admin/users')}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent-strong)] text-white font-medium hover:bg-[#32458C] transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <FaArrowLeft size={14} /> Foydalanuvchilar ro'yxatiga qaytish
                </button>
            </div>
        )
    }

    const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm outline-none border bg-[var(--bg-base)] border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-disabled)] dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)]`

    const labelCls = 'block text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1'

    return (
        <>
            <div className="flex flex-col gap-2.5 pr-4">
                {/* Confirm Delete Modal */}
                {confirmDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="fixed inset-0 bg-black/60" />
                        <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] p-7">
                            <button onClick={() => setConfirmDelete(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)] dark:hover:bg-[var(--bg-elevation-2)] text-[var(--text-sub)] dark:text-[var(--text-sub)] cursor-pointer  z-10">
                                <FaXmark size={14} />
                            </button>
                            <div className="flex items-center gap-3 mb-3">
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-70 cursor-pointer"
                                >
                                    <FaArrowLeft size={16} />
                                </button>
                                <h2 className="text-lg font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Foydalanuvchini o'chirmoqchimisiz?</h2>
                            </div>
                            <p className="text-sm text-[var(--text-soft)] dark:text-[var(--text-sub)] mb-6">
                                Bu foydalanuvchi tizimdan o'chiriladi va unga tegishli ma'lumotlar o'chirish mumkin.
                            </p>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setConfirmDelete(false)}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium  cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]"
                                >
                                    <FaXmark size={14} /> Bekor qilish
                                </button>
                                <button
                                    onClick={handleDelateUser}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold  cursor-pointer bg-[var(--error-strong)] text-white hover:bg-[#c42424]"
                                >
                                    O'chirish
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Foydalanuvchining ma'lumotlari</h1>
                    {!isAuditor && (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setConfirmDelete(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium  cursor-pointer text-[var(--error-strong)] bg-[#FFF2F2] hover:bg-[#fdcaca] dark:text-[var(--error-sub)] dark:hover:bg-[var(--error-strong)]/6 dark:bg-[var(--error-strong)]/10"
                            >
                                <FaTrash size={13} /> O'chirish
                            </button>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                <div className="flex justify-between w-full items-center">
                    <div className="flex items-center gap-5">
                        <div className="relative overflow-hidden avatar w-[80px] h-[80px] rounded-xl">
                            {form.avatar ? (
                                <img
                                    src={typeof form.avatar === 'string' ? form.avatar : URL.createObjectURL(form.avatar)}
                                    alt={form.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div
                                    className={`w-full h-full rounded-xl bg-gradient-to-br from-[#bdc4eb] to-[#a1abf7] flex items-center justify-center ${!isAuditor ? 'cursor-pointer' : ''}`}
                                    onClick={() => !isAuditor && document.getElementById('avatar-input').click()}
                                >
                                    <FaUser color="#fff" size={50} />
                                </div>
                            )}
                            {!isAuditor && (
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
                            )}
                        </div>

                        <h2 className="text-2xl font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                            {form.name}
                        </h2>
                    </div>

                    <FaArrowsRotate onClick={() => getUser(true)} className="text-[var(--text-sub)] cursor-pointer hover:opacity-90" size={20} />
                </div>

                {/* Form */}
                <div className="flex flex-col gap-3">

                    {/* row - 1*/}
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className={labelCls}>Ism Sharifi</label>
                            <input className={inputCls} disabled={isAuditor} value={form.name} onChange={e => set('name', e.target.value)} />
                        </div>

                        <div>
                            <label className={labelCls}>Oylik maosh (UZS)</label>
                            <input
                                className={inputCls + ' text-right'}
                                type="text"
                                inputMode="numeric"
                                placeholder="0.00"
                                disabled={isAuditor}
                                value={formatNum(form.fixed_salary)}
                                onChange={e => set('fixed_salary', formatNum(e.target.value))}
                            />
                        </div>

                        <div>
                            <label className={labelCls}>Balansi (UZS)</label>
                            <input
                                className={inputCls + ' text-right'}
                                type="text"
                                inputMode="numeric"
                                placeholder="0.00"
                                value={form.balance ? formatNum(form.balance) : ''}
                                disabled
                            />
                        </div>

                    </div>

                    {/* row - 2 */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Telefon raqami</label>
                            <input
                                className={inputCls}
                                type="text"
                                inputMode="numeric"
                                placeholder="+998 90 123 45 67"
                                disabled={isAuditor}
                                value={form.phone_number}
                                onChange={e => set('phone_number', formatPhone(e.target.value))}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Karta raqami</label>
                            <input
                                className={inputCls}
                                type="text"
                                inputMode="numeric"
                                placeholder="0000 0000 0000 0000"
                                disabled={isAuditor}
                                value={form.card_number || ''}
                                onChange={e => set('card_number', formatCard(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Viloyat + Tuman */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Viloyat</label>
                            <FilterSelect
                                options={regions.map(r => r.name)}
                                value={form.region_info?.name || ''}
                                onChange={v => {
                                    const selectedRegion = regions.find(r => r.name === v);
                                    set('region_info', selectedRegion || null);
                                    if (!selectedRegion) set('district_info', null);
                                }}
                                placeholder='Viloyatni tanlang'
                                padding="11px 11px"
                                disabled={isAuditor}
                                className="dark:bg-[#0d1117]!"
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Tuman</label>
                            <FilterSelect
                                options={districts.map(d => d.name)}
                                value={form.district_info?.name || ''}
                                onChange={v => {
                                    const selectedDistrict = districts.find(d => d.name === v);
                                    set('district_info', selectedDistrict || null);
                                }}
                                className="dark:bg-[#0d1117]!"
                                padding="11px 11px"
                                disabled={isAuditor || !form.region_info}
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
                                    disabled={isAuditor}
                                    onChange={e => set('passportSeria', e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2))} />
                                <input className={inputCls} placeholder="1234567" maxLength={7}
                                    value={form.passportRaqam}
                                    disabled={isAuditor}
                                    onChange={e => set('passportRaqam', e.target.value.replace(/\D/g, '').slice(0, 7))} />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Passport rasmi</label>
                            {form.passport_image ? (
                                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm bg-[var(--bg-base)] border-[var(--stroke-sub)] text-[var(--text-sub)] dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-sub)]">
                                    <FaFileLines size={14} className="shrink-0" />
                                    <a href={typeof form.passport_image === 'string' ? form.passport_image : URL.createObjectURL(form.passport_image)} target="_blank" rel="noreferrer" className="flex-1 truncate hover:underline text-[var(--accent-strong)]">
                                        Passport rasmini ko'rish
                                    </a>
                                    {!isAuditor && (
                                        <button
                                            onClick={() => set('passport_image', null)}
                                            className="text-[var(--error-strong)] hover:opacity-70 transition-opacity cursor-pointer shrink-0"
                                            title="O'chirish"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-3 pl-3 pr-1.5 py-1.5 rounded-lg border text-sm bg-[var(--bg-elevation-1)] border-[var(--stroke-sub)] text-[var(--text-soft)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-soft)]">
                                    <span className="truncate">Rasm yuklanmagan</span>
                                    {!isAuditor && (
                                        <label className="cursor-pointer bg-[var(--accent-strong)] text-white px-3 py-1.5 rounded-md hover:bg-[#32458C]  text-xs font-medium shrink-0">
                                            Rasm yuklash
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
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Social Links + Lavozim + Rol */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-1 flex flex-col gap-2">
                            {form.links?.map((link, index) => {
                                const isLast = index === form.links.length - 1;
                                return (
                                    <div key={index} className="flex items-end gap-2">
                                        <div className="flex-1 relative">
                                            <label className={labelCls}>{index + 1}.Havola</label>
                                            <input
                                                className={inputCls + " pr-10"}
                                                placeholder="Havola yuklang"
                                                value={link || ''}
                                                disabled={isAuditor}
                                                onChange={e => {
                                                    const newLinks = [...form.links];
                                                    newLinks[index] = e.target.value;
                                                    set('links', newLinks);
                                                }}
                                            />
                                            {!isAuditor && (
                                                <button
                                                    type="button"
                                                    onClick={() => set('links', form.links.filter((_, i) => i !== index))}
                                                    className="absolute right-3 top-[34px] text-[#8F95A8] hover:text-red-500 cursor-pointer transition-colors"
                                                >
                                                    <FaXmark size={14} />
                                                </button>
                                            )}
                                        </div>
                                        {isLast && index < 4 && !isAuditor && (
                                            <button
                                                type="button"
                                                onClick={() => set('links', [...form.links, ''])}
                                                className="h-[42px] w-[42px] rounded-xl border border-[#E2E6F2] dark:border-[var(--stroke-soft)] flex items-center justify-center text-[#1A1D2E] dark:text-[var(--text-strong)] hover:bg-gray-50 dark:hover:bg-[var(--bg-elevation-2)] transition-colors shrink-0 cursor-pointer dark:bg-[#0d1117]"
                                            >
                                                <FiPlus size={20} />
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                            {(!form.links || form.links.length === 0) && !isAuditor && (
                                <button
                                    type="button"
                                    onClick={() => set('links', [''])}
                                    className="flex items-center gap-2 py-1 px-2 w-[180px] cursor-pointer text-[#3F57B3] dark:text-[var(--text-soft)] text-sm font-semibold hover:opacity-80 transition-opacity rounded-xl bg-[#F1F3F9] dark:bg-[var(--bg-elevation-2)]"
                                >
                                    <div className="w-9 h-9 flex items-center justify-center">
                                        <FiPlus size={18} />
                                    </div>
                                    Havola qo'shish
                                </button>
                            )}
                        </div>

                        <div className="flex flex-col gap-5">
                            <div className="flex items-center mb-auto justify-between mt-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F1F3F9] dark:bg-[var(--bg-elevation-2)]">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                    </div>
                                    <span className="text-sm font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Lavozimi</span>
                                </div>

                                <Dropdown
                                    width={200}
                                    options={positions.map(p => p.name)}
                                    value={form.position_info?.name || ''}
                                    onChange={v => {
                                        const selectedPosition = positions.find(p => p.name === v);
                                        set('position_info', selectedPosition || null);
                                    }}
                                    disabled={isAuditor}
                                    placeholder='Lavozimni tanlang'
                                    padding="10px 12px"
                                />
                            </div>

                            <div className="flex items-center mb-auto justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F1F3F9] dark:bg-[var(--bg-elevation-2)]">
                                        <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                                    </div>
                                    <span className="text-sm font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Roli</span>
                                </div>

                                <Dropdown
                                    width={200}
                                    options={Object.values(Roles)}
                                    value={form.roles}
                                    onChange={v => set('roles', v)}
                                    multiple
                                    disabled={isAuditor}
                                    placeholder={form.roles?.length === 0 ? "Rolni tanlang" : "Tanlangan rollar:"}
                                    padding="10px 12px"
                                />
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer / Actions */}
                <div className="flex items-center justify-end gap-3 pt-[3px] border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]">
                    {(() => {
                        const hasChanged = () => {
                            if (!user) return false;
                            if (form.name !== initial.name) return true;
                            if (form.password) return true;
                            if (form.fixed_salary?.toString().replace(/\s/g, '') !== initial.fixed_salary?.toString().replace(/\s/g, '')) return true;
                            if (form.phone_number !== initial.phone_number) return true;
                            if (form.card_number !== initial.card_number) return true;
                            if (form.passportSeria !== initial.passportSeria) return true;
                            if (form.passportRaqam !== initial.passportRaqam) return true;
                            if (form.region_info?.id !== initial.region_info?.id) return true;
                            if (form.district_info?.id !== initial.district_info?.id) return true;
                            if (form.position_info?.id !== initial.position_info?.id) return true;
                            if (JSON.stringify(form.roles) !== JSON.stringify(initial.roles)) return true;
                            if (JSON.stringify(form.links?.filter(l => l?.trim())) !== JSON.stringify(initial.links?.filter(l => l?.trim()))) return true;
                            if (form.avatar instanceof File) return true;
                            if (form.passport_image instanceof File) return true;
                            return false;
                        };

                        const changed = hasChanged();

                        if (isAuditor) return null;

                        return (
                            <button
                                onClick={handleSave}
                                disabled={!changed}
                                className={`px-6 py-2.5 mt-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${changed
                                        ? 'cursor-pointer text-white bg-[var(--accent-strong)] hover:bg-[#32458C] active:scale-95 shadow-md'
                                        : 'cursor-default text-[var(--text-disabled)] bg-[var(--bg-elevation-1)] border border-[var(--stroke-soft)] opacity-80'
                                    }`}
                            >
                                <FaCheck size={14} />
                                Saqlash
                            </button>
                        );
                    })()}
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