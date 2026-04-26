import { FaArrowLeft, FaTrash } from "react-icons/fa"
import FilterSelect from "../Components/FilterSelect"
import { usePageAction } from "../../../context/PageActionContext"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { axiosAPI } from "../../../service/axiosAPI"

const Dropdown = FilterSelect

const UserDetail = () => {
    const { id } = useParams()

    const { registerBreadcrumb, clearBreadcrumb } = usePageAction()

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(false)

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
        if (form.viloyat) {
            axiosAPI.get(`/applications/districts/?region=${form.viloyat}`)
                .then(res => setDistricts(res.data.data.results))
                .catch(err => console.error(err))
        }
    }, [form.viloyat])


    const [form, setForm] = useState({})
    const [isDirty, setIsDirty] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    useEffect(() => {
        if (user) {
            setForm({
                name: user.name || user.username || '',
                password: '',
                salary: user.salary ?? '',
                balance: user.balance ?? '',
                region: user.region || '',
                district: user.district || '',
                passportSeria: user.passportSeria || '',
                passport_number: user.passportNumber || '',
                position: user.position || '',
                roles: user.roles?.[0] || '',
                github: user.github || '',
                linkedin: user.linkedin || '',
                telegram: user.telegram || '',
            })
        }
    }, [user])

    useEffect(() => {
        if (user) {
            const displayName = user.name || user.username || 'Foydalanuvchi'
            registerBreadcrumb(displayName)
            return () => clearBreadcrumb()
        }
    }, [user, registerBreadcrumb, clearBreadcrumb])

    const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); setIsDirty(true) }

    const initial = user ? {
        name: user.name || user.username || '',
        password: '',
        salary: user.salary ?? '',
        balance: user.balance ?? '',
        viloyat: user.viloyat || user.region || '',
        tuman: user.tuman || user.district || '',
        passportSeria: user.passportSeria || '',
        passportRaqam: user.passportRaqam || '',
        lavozim: user.position || '',
        rol: user.role || user.roles?.[0] || '',
        github: user.github || '',
        linkedin: user.linkedin || '',
        telegram: user.telegram || '',
    } : {}
    const handleCancel = () => { setForm(initial); setIsDirty(false) }

    if (loading) return <span>Loading...</span>
    if (!user) return <span>User not found</span>

    const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm outline-none border transition-colors
      bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#B6BCCB]
      dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5]`
    const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1'

    return (
        <div className="flex flex-col gap-5">
            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div className="fixed inset-0 bg-black/60" onClick={() => setConfirmDelete(false)} />
                    <div className="relative w-full max-w-[480px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323] p-7">
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
                                onClick={() => { setConfirmDelete(false); onDelete(user.id) }}
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
            <img src="/imgs/userImg.png" alt={user.name || user.username || ''} className="w-[80px] h-[80px] rounded-xl object-cover" />

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
                            value={form.salary === '' ? '' : Number(form.salary).toLocaleString('ru-RU')}
                            onChange={e => {
                                const raw = e.target.value.replace(/\D/g, '')
                                set('salary', raw === '' ? '' : Number(raw))
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
                            options={['Viloyatni tanlang', ...VILOYATLAR]}
                            value={form.viloyat || 'Viloyatni tanlang'}
                            onChange={v => set('viloyat', v === 'Viloyatni tanlang' ? '' : v)}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Tuman</label>
                        <FilterSelect
                            options={['Tuman tanlang', ...TUMANLAR]}
                            value={form.tuman || 'Tuman tanlang'}
                            onChange={v => set('tuman', v === 'Tuman tanlang' ? '' : v)}
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
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm bg-white border-[#E2E6F2] text-[#5B6078] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#C2C8E0]">
                            <FaFileLines size={14} className="shrink-0" />
                            <span className="flex-1 truncate">Ma'lumot.pdf</span>
                            <span className="text-xs text-[#B6BCCB] dark:text-[#8E95B5]">1487 Kb</span>
                        </div>
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
                        <Dropdown width={200} label="Tanlash" options={LAVOZIMLAR} value={form.lavozim} onChange={v => set('lavozim', v)} />
                    </div>
                    <div className="flex items-center gap-2 justify-between w-[50%]">
                        <div className='flex items-center gap-2'>
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            <span className="text-sm font-medium text-[#1A1D2E] dark:text-[#FFFFFF] shrink-0">Rolli</span>
                        </div>

                        <Dropdown width={200} label="Tanlash" options={ROLLAR_LIST} value={form.rol} onChange={v => set('rol', v)} />
                    </div>
                </div>

            </div>
        </div>
    )
}

export default UserDetail