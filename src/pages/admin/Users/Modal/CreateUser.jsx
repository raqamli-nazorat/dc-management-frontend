import { useState, useRef, useEffect } from "react"
import { FaXmark, FaFileLines, FaCamera } from "react-icons/fa6"
import { MdCheck } from "react-icons/md"
import { FiGithub } from "react-icons/fi"
import { CiLinkedin } from "react-icons/ci"
import { PiTelegramLogo } from "react-icons/pi"
import { axiosAPI } from "../../../../service/axiosAPI"
import FilterSelect from "../../Components/FilterSelect"
import { FaArrowLeft } from "react-icons/fa"
import { toast } from "../../../../Toast/ToastProvider"

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
    github: '',
    linkedin: '',
    telegram: '',
    avatar: null
}

const CreateUser = ({ onClose, setUsers, positions, Roles }) => {
    const [form, setForm] = useState(EMPTY_FORM)
    const [errors, setErrors] = useState({})
    const [avatarPreview, setAvatarPreview] = useState(null)

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
            if (!form.username?.trim()) newErrs.username = true
            if (!form.password?.trim()) newErrs.password = true
            const cleanSalary = form.salary.toString().replace(/\s/g, '')
            if (!cleanSalary || parseFloat(cleanSalary) <= 0) newErrs.salary = true
            if (!form.position) newErrs.position = true
            if (!form.roles || form.roles.length === 0) newErrs.roles = true

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
                } else if (form[key] !== null && form[key] !== '') {
                    formData.append(key, form[key])
                }
            })

            formData.append("social_links", JSON.stringify({
                "github": form.github,
                "linkedin": form.linkedin,
                "telegram": form.telegram,
            }))

            const res = await axiosAPI.post('users/', formData)

            setUsers(prev => [res.data.data, ...prev])
            toast.success("Ma'lumotlar muvaffaqiyatli qo'shildi")
            onClose()
        } catch (error) {
            console.error('Error adding user:', error)
            const msg = error.response?.data?.message || 'Xatolik yuz berdi'
            toast.error(msg)
        }
    }

    const getInputCls = (err) => `w-full px-3 py-2.5 rounded-lg text-sm outline-none border transition-colors bg-white text-[#1A1D2E] placeholder-[#B6BCCB] dark:bg-[#191A1A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5] ${err ? 'border-[#FF5B5B] focus:border-[#FF5B5B] dark:border-[#FF5B5B]' : 'border-[#E2E6F2] focus:border-[#526ED3] dark:border-[#292A2A]'}`
    const inputCls = getInputCls(false)
    const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1'

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto modal-scroll py-8 px-4">
            <div className="fixed inset-0 bg-black/60" />
            <button onClick={onClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-colors bg-white/20 text-white hover:bg-white/30">
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
                <div className="px-7 pb-2 flex flex-col gap-4">
                    <div>
                        <label className={labelCls}>Ism Sharifi</label>
                        <input
                            className={getInputCls(errors.username)}
                            placeholder="F.I.O"
                            value={form.username}
                            onChange={e => set('username', e.target.value)}
                            maxLength={150}
                        />
                        {errors.username && <p className="text-[13px] text-[#FF5B5B] mt-1.5">*Bu maydon majburiy</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Parol</label>
                            <input
                                className={getInputCls(errors.password)}
                                type="password"
                                placeholder="Parol"
                                value={form.password}
                                onChange={e => { set('password', e.target.value); set('confirm_password', e.target.value) }}
                            />
                            {errors.password && <p className="text-[13px] text-[#FF5B5B] mt-1.5">*Bu maydon majburiy</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Oylik maosh (UZS)</label>
                            <input
                                className={getInputCls(errors.salary)}
                                placeholder="0.0"
                                value={form.salary}
                                onChange={e => set('salary', formatNum(e.target.value))}
                            />
                            {errors.salary && <p className="text-[13px] text-[#FF5B5B] mt-1.5">*Bu maydon majburiy</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Viloyat</label>
                            <FilterSelect
                                options={['Viloyatni tanlang', ...regions.map(region => region.name)]}
                                value={regions.find(r => r.id === form.region)?.name || 'Viloyatni tanlang'}
                                onChange={v => set('region', v === 'Viloyatni tanlang' ? '' : regions.find(r => r.name === v)?.id)}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Tuman</label>
                            <FilterSelect
                                options={['Tuman tanlang', ...districts.map(district => district.name)]}
                                value={districts.find(d => d.id === form.district)?.name || 'Tuman tanlang'}
                                onChange={v => set('district', v === 'Tuman tanlang' ? '' : districts.find(d => d.name === v)?.id)}
                                disabled={!form.region}
                                title={!form.region && 'Viloyatni tanlang'}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Passport ma'lumotlari</label>
                            <div className="flex gap-2">
                                <input
                                    className={inputCls}
                                    placeholder="AA"
                                    maxLength={2}
                                    value={form.passportSeria}
                                    onChange={e => set('passportSeria', e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2))}
                                    style={{ width: 64 }}
                                />
                                <input
                                    className={inputCls}
                                    placeholder="1234567"
                                    maxLength={7}
                                    value={form.passport_number}
                                    onChange={e => set('passport_number', e.target.value.replace(/\D/g, '').slice(0, 7))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Passport rasmi</label>
                            <button
                                type="button"
                                onClick={() => document.getElementById('pasport').click()}
                                className={`w-full h-[42px] px-3 rounded-lg border flex items-center justify-center gap-2 cursor-pointer transition-all text-sm border-[#D0D5E2] bg-white text-[#8F95A8] hover:bg-[#F8F9FC] dark:border-[#292A2A] dark:bg-[#191A1A] dark:text-[#8E95B5] dark:hover:bg-[#292A2A] ${form.passport_image ? 'border-solid text-gray-800 dark:text-gray-100 font-medium' : 'border-dashed'}`}
                            >
                                <FaFileLines size={14} />
                                <span className="truncate">
                                    {form.passport_image ? form.passport_image.name : "Fayl yuklash"}
                                </span>
                            </button>
                            <input type="file" id="pasport" className="hidden" onChange={handlePassportUpload} accept="image/*" />
                        </div>
                    </div>
                    <div>
                        <label className={labelCls}>Avatar yuklash</label>
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                className="w-[80px] h-[80px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors shrink-0 border-[#D0D5E2] bg-[#F8F9FC] hover:bg-[#F1F3F9] dark:border-[#292A2A] dark:bg-[#191A1A] dark:hover:bg-[#292A2A]">
                                {avatarPreview
                                    ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover rounded-xl" />
                                    : <>
                                        <FaCamera size={18} className="text-[#B6BCCB] dark:text-[#8E95B5]" />
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
                                            error={errors.position}
                                        />
                                    </div>
                                    {errors.position && <p className="text-[13px] text-[#FF5B5B] mt-1.5 pl-4">*Bu maydon majburiy</p>}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                        <span className="text-sm font-semibold text-[#1A1D2E] dark:text-[#FFFFFF] shrink-0">Roli</span>
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
                                            width={130}
                                            error={errors.roles}
                                        />
                                    </div>
                                    {errors.roles && <p className="text-[13px] text-[#FF5B5B] mt-1.5 pl-4">*Bu maydon majburiy</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Social links */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { key: 'github', label: 'GitHub', Icon: FiGithub, placeholder: 'Github havola ' },
                            { key: 'linkedin', label: 'Linkedin', Icon: CiLinkedin, placeholder: 'Linkedin havola ' },
                            { key: 'telegram', label: 'Telegram', Icon: PiTelegramLogo, placeholder: 'Telegram havola ' },
                        ].map(({ key, label, Icon, placeholder }) => (
                            <div key={key}>
                                <label className={labelCls + ' flex items-center gap-1.5'}>
                                    {label} <Icon size={14} className="text-[#5B6078] dark:text-[#C2C8E0]" />
                                </label>
                                <input
                                    className={inputCls}
                                    placeholder={placeholder}
                                    value={form[key]}
                                    onChange={e => set(key, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="px-7 py-5 flex items-center justify-end gap-3">
                    <button onClick={onClose} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
                        <FaXmark size={14} />
                        Yopish
                    </button>
                    <button onClick={handleSubmit} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
                        <MdCheck size={16} />
                        Qo'shish
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CreateUser