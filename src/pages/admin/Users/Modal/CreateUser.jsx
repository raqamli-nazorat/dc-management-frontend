import { useState, useRef, useEffect } from "react"
import { FaXmark, FaFileLines, FaCamera, FaEye, FaRegEyeSlash, FaRegEye } from "react-icons/fa6"
import { MdCheck, MdOutlineFileUpload, MdOutlineRemoveRedEye } from "react-icons/md"
import { PiTelegramLogo } from "react-icons/pi"
import { FiGithub, FiPlus } from "react-icons/fi"
import { axiosAPI } from "../../../../service/axiosAPI"
import FilterSelect from "../../Components/FilterSelect"
import { FaArrowLeft } from "react-icons/fa"
import { toast } from "../../../../Toast/ToastProvider"
import { IoIosCamera } from "react-icons/io"

const Dropdown = FilterSelect;

const EMPTY_FORM = {
    username: '',
    password: '',
    confirm_password: '',
    salary: '',
    position: '',
    roles: [],
    region: '',
    district: '',
    passportSeria: '',
    passport_number: '',
    phone_number: '',
    card_number: '',
    links: [''],
    avatar: null
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

const formatCard = (val) => {
    if (!val) return '';
    let digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.match(/.{1,4}/g)?.join(' ') || digits;
}

const CreateUser = ({ onClose, setUsers, positions, Roles }) => {
    const [form, setForm] = useState(EMPTY_FORM)
    const [errors, setErrors] = useState({})
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [showPassword, setShowPassword] = useState(false);

    const [regions, setRegions] = useState([])
    const [districts, setDistricts] = useState([])

    const fileRef = useRef(null)
    const set = (k, v) => {
        setForm(prev => ({ ...prev, [k]: v }))
        if (errors[k]) setErrors(prev => ({ ...prev, [k]: false }))
    }

    const getRegions = async () => {
        try {
            const res = await axiosAPI.get('applications/regions/')

            setRegions(res.data.data.results)
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        getRegions()
    }, [])

    useEffect(() => {
        if (form.region) {
            axiosAPI.get(`/applications/districts/?region=${form.region}`)
                .then(res => setDistricts(res.data.data.results))
                .catch(err => console.error(err))
        }
    }, [form.region])

    const handlePassportUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return
        set('passport_image', file)
    }

    const handleAvatar = (e) => {
        const file = e.target.files[0]
        if (!file) return
        set('avatar', file)
        setAvatarPreview(URL.createObjectURL(file))
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

    const handleSubmit = async () => {
        try {
            const newErrs = {}
            if (!form.username?.trim()) newErrs.username = "*Bu maydon majburiy"
            if (!form.password?.trim()) newErrs.password = "*Bu maydon majburiy"
            const cleanSalary = form.salary.toString().replace(/\s/g, '')
            if (!cleanSalary || parseFloat(cleanSalary) <= 0) newErrs.salary = "*Maosh noto'g'ri kiritildi"
            if (!form.position) newErrs.position = "*Bu maydon majburiy"
            if (!form.roles || form.roles.length === 0) newErrs.roles = "*Bu maydon majburiy"
            if (!form.phone_number) newErrs.phone_number = "*Bu maydon majburiy"
            if (!form.card_number) newErrs.card_number = "*Bu maydon majburiy"
            if (form.card_number && form.card_number.replace(/\s/g, '').length !== 16) newErrs.card_number = "*Karta raqami 16 ta raqamdan iborat bo'lishi shart!"
            if (form.passportSeria && !form.passport_number) newErrs.passport_number = "*Passport raqami majburiy"
            if (!form.passportSeria && form.passport_number) newErrs.passportSeria = "*Passport seriyasi majburiy"

            if (Object.keys(newErrs).length > 0) {
                setErrors(newErrs)
                return
            }

            // --- FormData yaratish ---
            const formData = new FormData()

            // Hamma oddiy maydonlarni qo'shamiz
            Object.keys(form).forEach(key => {
                if (key === 'roles') {
                    form.roles.forEach(role => formData.append('roles', role))
                }
                else if ((key === 'avatar' || key === 'passport_image')) {
                    // Agar rasm tanlangan bo'lsa (null bo'lmasa) qo'shadi
                    if (form[key]) {
                        formData.append(key, form[key])
                    }
                } else if (key === 'salary') {
                    formData.append('fixed_salary', form.salary.toString().replace(/\s/g, ''))
                } else if (key === 'links') {
                    // Skip links here, handled as social_links
                } else if (key === "phone_number") {
                    const clean = form.phone_number.replace(/\s/g, '');
                    formData.append(key, clean)
                } else if (key === "card_number") {
                    const clean = form.card_number.replace(/\s/g, '');
                    formData.append(key, clean)
                } else if (form[key] !== null && form[key] !== '') {
                    formData.append(key, form[key])
                }
            })


            formData.append('passport_series', (form.passportSeria || '') + (form.passport_number || ''))

            formData.append("social_links", JSON.stringify(form.links.filter(l => l?.trim())))

            const res = await axiosAPI.post('users/', formData)

            setUsers(prev => [res.data.data, ...prev])
            toast.success("Ma'lumotlar muvaffaqiyatli qo'shildi")
            onClose()
        } catch (error) {
            console.error(error);

            const errData = error?.response?.data?.error;

            // Field-level detail xatolarini chiqarish (masalan: password, name ...)
            let errMsg = "Xatolik yuz berdi" || error?.response?.data?.error?.errorMsg;

            if (errData?.details && typeof errData.details === 'object') {
                const serverErrors = {};
                Object.entries(errData.details).forEach(([key, messages]) => {
                    let field = key;
                    if (key === 'fixed_salary') field = 'salary';
                    if (key === 'passport_series') field = 'passportSeria';
                    serverErrors[field] = Array.isArray(messages) ? messages[0] : messages;
                });
                setErrors(serverErrors);

                const detailMsgs = Object.values(errData.details).flat().join(' ');
                if (detailMsgs) errMsg = detailMsgs;
            } else if (errData?.errorMsg) {
                errMsg = errData.errorMsg;
            } else if (typeof error?.response?.data === 'string') {
                errMsg = error.response.data;
            }

            toast.error(errMsg)
        }
    }

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const getInputCls = (err) => `w-full px-3 py-2.5 rounded-lg text-sm outline-none border  bg-white text-[#1A1D2E] placeholder-[#B6BCCB] dark:bg-[#191A1A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5] ${err ? 'border-[#FF5B5B] focus:border-[#FF5B5B] dark:border-[#FF5B5B]' : 'border-[#E2E6F2] focus:border-[#526ED3] dark:border-[#292A2A]'}`
    const inputCls = getInputCls(false)
    const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1'

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto modal-scroll py-8 px-4">
            <div className="fixed inset-0 bg-black/60" />
            <button onClick={onClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer  bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white">
                <FaXmark size={16} />
            </button>
            <div className="relative w-full max-w-[600px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">
                <div className="px-7 pt-7 pb-5">
                    <div className="flex flex-col items-start gap-3">
                        <div className='flex gap-3'>
                            <button
                                onClick={onClose}
                                className="mt-1 text-[#1A1D2E] dark:text-[#FFFFFF] hover:opacity-70 cursor-pointer shrink-0"
                            >
                                <FaArrowLeft size={18} />
                            </button>
                            <h2
                                className="text-[#1A1D2E] dark:text-[#FFFFFF]"
                                style={{ fontSize: 20, fontWeight: 800 }}
                            >
                                Yangi xodim qo'shish
                            </h2>
                        </div>
                        <p className="text-sm text-[#8F95A8] dark:text-[#C2C8E0] mt-1">
                            Yangi xodimni tizimga qo'shing va unga tegishli rol hamda maoshni belgilang
                        </p>
                    </div>
                </div>
                <div className="px-7 pb-2 flex flex-col gap-4 max-h-[480px] overflow-y-auto">
                    <div>
                        <label className={labelCls}>Ism Sharifi</label>
                        <input
                            className={getInputCls(errors.username)}
                            placeholder="F.I.O"
                            value={form.username}
                            onChange={e => set('username', e.target.value)}
                            maxLength={150}
                        />
                        {errors.username && <p className="text-[13px] text-[#FF5B5B] mt-1.5">{errors.username}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Parol</label>
                            <div className="relative">
                                <input
                                    className={getInputCls(errors.password)}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Parol"
                                    value={form.password}
                                    onChange={e => { set('password', e.target.value); set('confirm_password', e.target.value) }}
                                />
                                <span
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-[#8F95A8] dark:text-[#]"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                                </span>
                            </div>
                            {errors.password && <p className="text-[13px] text-[#FF5B5B] mt-1.5">{errors.password}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Oylik maosh (UZS)</label>
                            <input
                                className={getInputCls(errors.salary)}
                                placeholder="0.0"
                                value={form.salary}
                                onChange={e => set('salary', formatNum(e.target.value))}
                            />
                            {errors.salary && <p className="text-[13px] text-[#FF5B5B] mt-1.5">{errors.salary}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Telifon raqami</label>
                            <input
                                className={getInputCls(errors.phone_number)}
                                type="text"
                                placeholder="+998 90 123 45 67"
                                value={form.phone_number}
                                onChange={e => set('phone_number', formatPhone(e.target.value))}
                            />
                            {errors.phone_number && <p className="text-[13px] text-[#FF5B5B] mt-1.5">{errors.phone_number}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Karta raqami</label>
                            <input
                                className={getInputCls(errors.card_number)}
                                placeholder="0000 0000 0000 0000"
                                value={form.card_number}
                                onChange={e => set('card_number', formatCard(e.target.value))}
                            />
                            {errors.card_number && <p className="text-[13px] text-[#FF5B5B] mt-1.5">{errors.card_number}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Viloyat</label>
                            <FilterSelect
                                options={regions.map(region => region.name)}
                                placeholder="Viloyatni tanlang"
                                value={regions.find(r => r.id === form.region)?.name || ''}
                                className="dark:bg-[#191a1a]!"
                                padding="11px 11px"
                                error={errors.region}
                                onChange={v => {
                                    set('region', regions.find(r => r.name === v)?.id);
                                    if (districts.length === 1) {
                                        set('district', districts[0].id)
                                    } else {
                                        set('district', '')
                                    }
                                }}
                            />
                            {errors.region && <p className="text-[13px] text-[#FF5B5B] mt-1.5">{errors.region}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Tuman</label>
                            <FilterSelect
                                options={districts.map(district => district.name)}
                                placeholder="Tuman tanlang"
                                value={districts.find(d => d.id === form.district)?.name || ''}
                                onChange={v => set('district', districts.find(d => d.name === v)?.id)}
                                className="dark:bg-[#191a1a]!"
                                padding="11px 11px"
                                disabled={!form.region}
                                error={errors.district}
                                title={!form.region && 'Viloyatni tanlang'}
                            />
                            {errors.district && <p className="text-[13px] text-[#FF5B5B] mt-1.5">{errors.district}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Passport ma'lumotlari</label>
                            <div className="flex gap-2">
                                <div className="flex flex-col items-start relative gap-3" style={errors.passportSeria ? { paddingBottom: 10 } : {}}>
                                    <input
                                        className={getInputCls(errors.passportSeria)}
                                        placeholder="AA"
                                        maxLength={2}
                                        value={form.passportSeria}
                                        onChange={e => set('passportSeria', e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2))}
                                        style={{ width: 64 }}
                                    />
                                    {errors.passportSeria && <p className="text-[13px] absolute bottom-[-10px] left-0 text-[#FF5B5B] w-[180px]">{errors.passportSeria}</p>}
                                </div>
                                <div className="flex flex-col items-end!">
                                    <input
                                        className={getInputCls(errors.passport_number)}
                                        placeholder="1234567"
                                        maxLength={7}
                                        value={form.passport_number}
                                        onChange={e => set('passport_number', e.target.value.replace(/\D/g, '').slice(0, 7))}
                                    />
                                    {errors.passport_number && <p className="text-[13px] text-[#FF5B5B] mt-1.5">{errors.passport_number}</p>}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Passport rasmi</label>
                            <button
                                type="button"
                                onClick={() => document.getElementById('pasport').click()}
                                className={`w-full h-[42px] px-3 rounded-lg border flex items-center justify-center gap-2 cursor-pointer transition-all text-sm border-[#D0D5E2] bg-white text-[#8F95A8] hover:bg-[#F8F9FC] dark:border-[#292A2A] dark:bg-[#191A1A] dark:text-[#8E95B5] dark:hover:bg-[#292A2A] ${form.passport_image ? 'border-solid text-gray-800 dark:text-gray-100 font-medium' : 'border-dashed'}`}
                            >
                                <MdOutlineFileUpload size={18} />
                                <span className="truncate text-sm">
                                    {form.passport_image ? form.passport_image.name : "Rasm yuklash"}
                                </span>
                            </button>
                            <input type="file" id="pasport" className="hidden" onChange={handlePassportUpload} accept="image/*" />
                            {errors.passport_image && <p className="text-[13px] text-[#FF5B5B] mt-1.5">{errors.passport_image}</p>}
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Avatar yuklash</label>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="w-[100px] h-[80px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer  shrink-0 border-[#D0D5E2] bg-[#F8F9FC] hover:bg-[#F1F3F9] dark:border-[#292A2A] dark:bg-[#191A1A] dark:hover:bg-[#292A2A]">
                                {avatarPreview
                                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover rounded-xl" />
                                    : <>
                                        <IoIosCamera size={18} className="text-[#B6BCCB] dark:text-[#8E95B5]" />
                                        <span className="text-[10px] text-[#B6BCCB] dark:text-[#8E95B5] text-center leading-tight">
                                            Rasm yuklash
                                        </span>
                                    </>
                                }
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                            <div className="grid grid-cols-2 gap-3 flex-1">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                        <span className="text-sm font-semibold text-[#1A1D2E] dark:text-[#FFFFFF] shrink-0">Lavozimi</span>
                                        <Dropdown
                                            label="Tanlash"
                                            options={positions.map(pos => pos.name)}
                                            value={positions.find(p => p.id === form.position)?.name || ''}
                                            onChange={v => { set('position', positions.find(p => p.name === v)?.id); setErrors(prev => ({ ...prev, position: false })) }}
                                            width={130}
                                            className="dark:bg-[#191a1a]!"
                                            placeholder="Tanlash"
                                            error={errors.position}
                                        />
                                    </div>
                                    {errors.position && <p className="text-[13px] text-[#FF5B5B] mt-1.5 pl-4">{errors.position}</p>}
                                </div>
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                            <span className="text-sm font-semibold text-[#1A1D2E] dark:text-[#FFFFFF] shrink-0">Roli</span>
                                        </div>
                                        <Dropdown
                                            label="Tanlash"
                                            multiple={true}
                                            options={Object.values(Roles)}
                                            value={form.roles?.map(r => Roles[r]) || []}
                                            onChange={v => {
                                                const newRoles = v.map(label => Object.keys(Roles).find(k => Roles[k] === label)).filter(Boolean);
                                                set('roles', newRoles);
                                                setErrors(prev => ({ ...prev, roles: false }));
                                            }}
                                            className="dark:bg-[#191a1a]!"
                                            placeholder={form.roles?.length > 0 ? "Tanlangan" : "Tanlash"}
                                            width={130}
                                            error={errors.roles}
                                        />
                                    </div>
                                    {errors.roles && <p className="text-[13px] text-[#FF5B5B] mt-1.5 pl-4">{errors.roles}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social links */}
                    <div className="grid grid-cols-2 gap-3">
                        {form.links.map((link, index) => (
                            <div key={index} className="flex items-end gap-3">
                                <div className="flex-1">
                                    <label className={labelCls}>{index + 1}.Havola qo'shish</label>
                                    <input
                                        className={inputCls}
                                        placeholder="Havola yuklang"
                                        value={link}
                                        onChange={e => {
                                            const newLinks = [...form.links];
                                            newLinks[index] = e.target.value;
                                            set('links', newLinks);
                                        }}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (index === form.links.length - 1 && index < 4) {
                                            set('links', [...form.links, '']);
                                        } else {
                                            set('links', form.links.filter((_, i) => i !== index))
                                        }
                                    }}
                                    className="h-[42px] w-[42px] rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] flex items-center justify-center text-[#1A1D2E] dark:text-white hover:bg-gray-50 dark:hover:bg-[#292A2A] transition-colors shrink-0 cursor-pointer dark:bg-[#191a1a]"
                                >
                                    {index === form.links.length - 1 && index < 4 ? <FiPlus size={20} /> : <FaXmark size={20} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="px-7 py-5 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium  cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
                        <FaXmark size={14} />
                        Yopish
                    </button>
                    <button onClick={handleSubmit} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold  cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
                        <MdCheck size={16} />
                        Qo'shish
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CreateUser