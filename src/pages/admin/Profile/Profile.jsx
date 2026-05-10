import { useState, useEffect, useRef } from 'react'
import { FaXmark, FaArrowLeft, FaEye, FaEyeSlash, FaPencil, FaChevronDown, FaCheck, FaCamera, FaUser } from 'react-icons/fa6'
import { useAuth } from '../../../context/AuthContext'
import { axiosAPI } from '../../../service/axiosAPI'
import { getErrorMessage } from '../../../service/getErrorMessage'
import { toast } from '../../../Toast/ToastProvider'
import { FiPlus } from 'react-icons/fi'

/* ── Change Password Modal ── */
function ChangePasswordModal({ onClose }) {
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' })
  const [show, setShow] = useState({ current: false, newPass: false, confirm: false })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.current) e.current = 'Joriy parolni kiriting'
    if (!form.newPass) e.newPass = 'Yangi parolni kiriting'
    if (!form.confirm) e.confirm = 'Parolni tasdiqlang'
    if (form.newPass && form.confirm && form.newPass !== form.confirm) {
      e.newPass = 'Parollar mos kelmadi'
      e.confirm = 'Parollar mos kelmadi'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await axiosAPI.put('/users/me/change-password/', {
        old_password: form.current,
        new_password: form.newPass,
        confirm_new_password: form.confirm,
      })

      // Backend { data: { new_password: [...] }, success: true } — xato bor
      const resData = res.data?.data ?? res.data
      if (resData && typeof resData === 'object') {
        const fieldMap = {
          old_password: 'current',
          new_password: 'newPass',
          confirm_new_password: 'confirm',
        }
        const newErrors = {}
        Object.entries(fieldMap).forEach(([apiKey, formKey]) => {
          if (resData[apiKey]) {
            const val = resData[apiKey]
            newErrors[formKey] = Array.isArray(val) ? val[0] : val
          }
        })
        if (Object.keys(newErrors).length) {
          setErrors(newErrors)
          setLoading(false)
          return
        }
      }

      toast.success("Parol o'zgartirildi", 'Yangi parol muvaffaqiyatli saqlandi')
      onClose()
    } catch (err) {
      const errData = err?.response?.data?.data ?? err?.response?.data
      if (errData && typeof errData === 'object') {
        const fieldMap = {
          old_password: 'current',
          new_password: 'newPass',
          confirm_new_password: 'confirm',
        }
        const newErrors = {}
        Object.entries(fieldMap).forEach(([apiKey, formKey]) => {
          if (errData[apiKey]) {
            const val = errData[apiKey]
            newErrors[formKey] = Array.isArray(val) ? val[0] : val
          }
        })
        if (Object.keys(newErrors).length) {
          setErrors(newErrors)
        } else {
          toast.error('Xatolik', getErrorMessage(err))
        }
      } else {
        toast.error('Xatolik', getErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = (err) => [
    'w-full px-4 py-3 rounded-xl text-sm outline-none border  pr-11',
    'bg-white text-[var(--text-strong)] placeholder-[var(--text-soft)]',
    'dark:bg-[#191A1A] dark:text-white dark:placeholder-[var(--text-sub)]',
    err ? 'border-red-400 dark:border-red-500'
      : 'border-[var(--stroke-sub)] dark:border-[#292A2A] focus:border-[var(--accent-sub)]',
  ].join(' ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <button onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full z-10 cursor-pointer 
          bg-[#F1F3F9] hover:bg-[var(--stroke-sub)] text-[var(--text-sub)] dark:bg-[#292A2A] dark:hover:bg-[#333435] dark:text-[#C2C8E0]">
        <FaXmark size={14} />
      </button>
      <div className="relative w-full max-w-[520px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111] p-7">
        <div className="flex items-center gap-3 mb-1.5">
          <button onClick={onClose} className="text-[var(--text-strong)] dark:text-white hover:opacity-60 cursor-pointer transition-opacity">
            <FaArrowLeft size={16} />
          </button>
          <h2 className="text-xl font-extrabold text-[var(--text-strong)] dark:text-white">Parolni o'zgartirish</h2>
        </div>
        <p className="text-sm text-[var(--text-sub)] dark:text-[var(--text-soft)] mb-6">
          Xavfsizlik uchun joriy parolingizni kiriting va yangi parol o'rnating
        </p>
        <div className="flex flex-col gap-4">
          {[
            { key: 'current', label: 'Joriy parol', placeholder: 'Joriy parolni kiriting' },
            { key: 'newPass', label: 'Yangi parol', placeholder: 'Yangi parolni kiriting' },
            { key: 'confirm', label: 'Parolni tasdiqlash', placeholder: 'Yangi parolni qayta kiriting' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-[var(--text-sub)] dark:text-[#C2C8E0] mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show[key] ? 'text' : 'password'}
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  placeholder={placeholder}
                  className={inputCls(errors[key])}
                />
                <button type="button" onClick={() => setShow(p => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)] hover:text-[var(--text-sub)] cursor-pointer">
                  {show[key] ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                </button>
              </div>
              {errors[key] && <p className="text-xs text-red-500 mt-1">*{errors[key]}</p>}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 mt-7">
          <button onClick={onClose} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
              text-[var(--text-sub)] hover:bg-[#F1F3F9] dark:text-[var(--text-soft)] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Bekor qilish
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer
              bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)] disabled:opacity-60">
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            Saqlash
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Passport Image Viewer Modal ── */
function PassportViewer({ url, onClose }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(url)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/80" />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full z-10 cursor-pointer 
          bg-white/20 hover:bg-white/30 text-white"
      >
        <FaXmark size={16} />
      </button>

      <div
        className="relative z-10 max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={e => e.stopPropagation()}
      >
        {isImage ? (
          <img
            src={url}
            alt="Passport"
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain"
          />
        ) : (
          <div className="bg-white dark:bg-[#1C1D1D] rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent-sub)]">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <p className="text-[var(--text-strong)] dark:text-white font-semibold text-sm">Fayl brauzerda ochiladi</p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]  cursor-pointer"
            >
              Ochish
            </a>
          </div>
        )}
      </div>
    </div>
  )
}


const boxCls = 'w-full px-4 py-2.5 rounded-xl text-sm border bg-[#E2E6F2] opacity-90 border-[#E2E6F2] text-[#1A1D2E] dark:bg-[#1c1d1d] dark:border-[#292A2A] dark:text-white'

function Field({ label, value, children, align = 'right', rightIcon }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-soft)]">{label}</span>
      {children ?? (
        <div className={boxCls + ` min-h-[42px] flex items-center ${align === 'left' ? 'justify-between text-left' : 'justify-end text-right'}`}>
          <span>{value ?? ''}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </div>
      )}
    </div>
  )
}

/* ── Format helpers ── */
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

/* ── Skeleton ── */
function Skeleton() {
  const bar = 'h-9 rounded-xl bg-[#EEF1F7] dark:bg-[#292A2A] animate-pulse'
  const lbl = 'h-3 w-24 rounded bg-[#EEF1F7] dark:bg-[#292A2A] animate-pulse mb-1.5'
  const row = (
    <div className="grid grid-cols-2 gap-4">
      {[0, 1].map(i => (
        <div key={i}>
          <div className={lbl} />
          <div className={bar} />
        </div>
      ))}
    </div>
  )
  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="h-7 w-48 rounded-lg bg-[#EEF1F7] dark:bg-[#292A2A] animate-pulse" />
      <div className="flex items-center gap-4">
        <div className="w-[72px] h-[72px] rounded-2xl bg-[#EEF1F7] dark:bg-[#292A2A] animate-pulse shrink-0" />
        <div className="flex flex-col gap-2">
          <div className="h-5 w-48 rounded bg-[#EEF1F7] dark:bg-[#292A2A] animate-pulse" />
          <div className="h-7 w-32 rounded-lg bg-[#EEF1F7] dark:bg-[#292A2A] animate-pulse" />
        </div>
      </div>
      {row}{row}{row}
    </div>
  )
}

/* ── Format number ── */
const fmtNum = (v) => {
  if (!v) return '—'
  const n = parseFloat(v)
  if (isNaN(n)) return v
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/* ── Role Labels ── */
const ROLE_LABELS = {
  admin: 'Administrator',
  superadmin: 'Administrator',
  manager: 'Menejer',
  menager: 'Menejer',
  employee: 'Xodim',
  xodim: 'Xodim',
  auditor: 'Nazoratchi',
  nazoratchi: 'Nazoratchi',
  accountant: 'Hisobchi',
  hisobchi: 'Hisobchi',
}

/* ── Role Dropdown ── */
function RoleDropdown({ roles, activeRole, onChangeRole }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const h = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleChange = async (role) => {
    if (role === activeRole) { setOpen(false); return }
    setLoading(true)
    try {
      await axiosAPI.patch('users/me/', { active_role: role })
      const saved = localStorage.getItem('user')
      if (saved) {
        const u = JSON.parse(saved)
        u.active_role = role
        localStorage.setItem('user', JSON.stringify(u))
      }
      onChangeRole(role)
      toast.success("Rol o'zgartirildi", `Faol rol: ${ROLE_LABELS[role] || role}`)
      setOpen(false)
      setTimeout(() => window.location.reload(), 800)
    } catch (err) {
      toast.error('Xatolik', getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative" ref={dropRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        className="px-3 py-2.5 w-[200px] rounded-lg border border-[var(--stroke-sub)] dark:border-[#474848] flex items-center justify-between gap-2 bg-white dark:bg-[#191A1A] cursor-pointer hover:border-[var(--accent-sub)] transition-colors"
      >
        <span className="text-xs font-semibold text-[var(--text-strong)] dark:text-white">
          {ROLE_LABELS[activeRole] || activeRole || 'Tanlash'}
        </span>
        {loading
          ? <svg className="animate-spin w-2.5 h-2.5 text-[var(--text-soft)] shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          : <FaChevronDown className={`w-2.5 h-2.5 text-[var(--text-soft)] transition-transform ${open ? 'rotate-180' : ''}`} />
        }
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-1 z-50 w-48 rounded-2xl shadow-xl border overflow-hidden
          bg-white border-[var(--stroke-sub)] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
          {roles.map((r, i) => (
            <button
              key={r}
              type="button"
              onClick={() => handleChange(r)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors
                ${i < roles.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                ${r === activeRole
                  ? 'bg-[#EEF1FB] text-[var(--accent-strong)] font-semibold dark:bg-[#292A2A] dark:text-[var(--accent-soft)]'
                  : 'text-[var(--text-strong)] dark:text-white hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[#292A2A]'
                }`}
            >
              <span>{ROLE_LABELS[r] || r}</span>
              {r === activeRole && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
/* ── Main Page ── */
export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passportOpen, setPassportOpen] = useState(false)
  const [openImg, setOpenImg] = useState(false)

  const [data, setData] = useState({})

  const set = (k, v) => setData(prev => ({ ...prev, [k]: v }))

  const getProfile = async () => {
    try {
      const { data } = await axiosAPI.get('/users/me/')
      setProfile(data?.data ?? data)
      setData(data?.data ?? data)
    } catch (error) {
      console.error(error)
      toast.error("Ma'lumotlarni yuklashda xatolik!", error?.response?.data?.error?.errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const getUserSts = async () => {
    try {
      const { data } = await axiosAPI.get('users/me/efficiency/')

      console.log(data);
    } catch (error) {
      console.error(error)
      toast.error("Ma'lumotlarni yuklashda xatolik!", error?.response?.data?.error?.errorMsg)
    }
  }

  useEffect(() => {
    if (authUser?.active_role === "employee" || authUser?.active_role === "manager") {
      getUserSts()
    }
    getProfile()
  }, [])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setOpenImg(false)
        setShowPasswordModal(false)
        setPassportOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  if (loading) return <Skeleton />

  const fullName = data.full_name || data.username || authUser?.username || 'Foydalanuvchi'
  const role = (data.roles?.[0] || authUser?.roles?.[0] || 'admin')

  let social = {}
  // Social links — string yoki object bo'lishi mumkin
  if (typeof data?.social_links === 'object' && data?.social_links) {
    social = data?.social_links
  } else if (typeof data.social_links === 'string' && data?.social_links) {
    try { social = JSON.parse(data?.social_links) } catch { social = {} }
  }

  const isAvatarChanged = data?.avatar instanceof File;
  const isPhoneChanged = (data?.phone_number?.replace(/\s/g, '') || '') !== (profile?.phone_number?.replace(/\s/g, '') || '');
  const isCardChanged = (data?.card_number?.replace(/\s/g, '') || '') !== (profile?.card_number?.replace(/\s/g, '') || '');
  const isSocialChanged = JSON.stringify(data?.social_links || []) !== JSON.stringify(profile?.social_links || []);

  const isChanged = isAvatarChanged || isPhoneChanged || isCardChanged || isSocialChanged;

  const handleSave = async () => {
    try {
      const formData = new FormData()
      let hasChanges = false

      // Avatar (File object bo'lsa)
      if (data.avatar instanceof File) {
        formData.append('avatar', data.avatar)
        hasChanges = true
      }

      // Telefon raqami (faqat raqamlarni solishtiramiz)
      const cleanPhone = (val) => String(val || '').replace(/\s/g, '')
      if (cleanPhone(data.phone_number) !== cleanPhone(profile.phone_number)) {
        formData.append('phone_number', cleanPhone(data.phone_number))
        hasChanges = true
      }

      // Karta raqami (bo'shliqlarni olib tashlab solishtiramiz)
      const cleanCard = (val) => String(val || '').replace(/\s/g, '')
      if (cleanCard(data.card_number) !== cleanCard(profile.card_number)) {
        formData.append('card_number', cleanCard(data.card_number))
        hasChanges = true
      }

      // Social Links (JSON holatida solishtiramiz)
      const currentLinks = JSON.stringify(data.social_links || [])
      const initialLinks = JSON.stringify(profile.social_links || [])
      if (currentLinks !== initialLinks) {
        // Backend ijtimoiy tarmoqlarni JSON string ko'rinishida kutishi mumkin
        formData.append('social_links', JSON.stringify(data.social_links))
        hasChanges = true
      }

      if (!hasChanges) {
        toast.info("O'zgarish yo'q")
        return
      }

      const res = await axiosAPI.patch("users/me/", formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const resData = res.data?.data ?? res.data
      toast.success("Ma'lumotlar yangilandi!", resData?.message || "O'zgarishlar saqlandi")
      getProfile()
    } catch (error) {
      const errData = error?.response?.data?.error;
      let errMsg = error?.response?.data?.error?.errorMsg || "Xatolik yuz berdi";

      if (errData?.details && typeof errData.details === 'object') {
        const detailMsgs = Object.values(errData.details).flat().join(', ');
        if (detailMsgs) errMsg = detailMsgs;
      } else if (typeof error?.response?.data === 'string') {
        errMsg = error.response.data;
      }
      toast.error("Xatolik yuz berdi.", errMsg)
    }
  }

  const rowCls = 'grid grid-cols-2 gap-4'

  const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1'
  const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm outline-none border bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#B6BCCB] dark:bg-[#222323] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5]`


  return (
    <div className="flex flex-col gap-2.5 w-full">
      <h1 className="text-2xl font-bold text-[var(--text-strong)] dark:text-white">Shaxsiy kabinet</h1>

      {/* Avatar + Name */}
      <div className="flex items-center gap-2.5">
        <div className="relative overflow-hidden avatar w-[80px] h-[80px] rounded-xl">
          {data.avatar ? (
            <img
              src={typeof data.avatar === 'string' ? data.avatar : URL.createObjectURL(data.avatar)}
              alt={data.name}
              className="w-full h-full object-cover"
              onClick={() => setOpenImg(true)}
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
        <div>
          <p className="text-lg font-bold text-[var(--text-strong)] dark:text-white">{fullName}</p>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border  cursor-pointer
              border-[var(--stroke-sub)] text-[var(--text-sub)] hover:bg-[#F1F3F9]
              dark:border-[#292A2A] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]"
          >
            <FaPencil size={10} /> Parol o'zgartish
          </button>
        </div>
      </div>

      {/* Oylik maosh + Balans */}
      <div className={rowCls}>
        <Field label="Oylik maosh (UZS)" value={fmtNum(data.fixed_salary)} />
        <Field label="Balansi (UZS)" value={fmtNum(data.balance)} />
      </div>

      <div className={rowCls}>
        <div>
          <label className={labelCls}>Telefon raqami</label>
          <input
            className={inputCls}
            type="text"
            inputMode="numeric"
            placeholder="+998 90 123 45 67"
            value={formatPhone(data.phone_number) || ''}
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
            value={formatCard(data.card_number) || ''}
            onChange={e => set('card_number', formatCard(e.target.value))}
          />
        </div>
      </div>

      {/* Viloyat + Tuman */}
      <div className={rowCls}>
        <Field label="Viloyat" value={data.region || 'Viloyat tanlang'} align="left" rightIcon={<FaChevronDown className="w-3.5 h-3.5 text-[var(--text-soft)]" />} />
        <Field label="Tuman" value={data.district || 'Tuman tanlang'} align="left" rightIcon={<FaChevronDown className="w-3.5 h-3.5 text-[var(--text-soft)]" />} />
      </div>

      {/* Passport + Passport rasmi */}
      <div className={rowCls}>
        <Field label="Passport ma'lumotlari">
          <div className="flex items-center gap-2">
            <div className={boxCls + ' font-bold flex-1 text-center min-h-[42px] flex items-center justify-center'}>
              {data.passport_series?.slice(0, 2) ?? ''}
            </div>
            <div className={boxCls + ' flex-5 min-h-[42px] flex items-center'}>
              {data.passport_series?.slice(2) ?? ''}
            </div>
          </div>
        </Field>
        <Field label="Passport rasmi">
          {data.passport_image ? (
            <div className="w-full px-4 py-2.5 rounded-xl text-sm border border-dashed border-[var(--stroke-sub)] dark:border-[#292A2A] bg-[#E2E6F2]  dark:bg-[#1c1d1d] flex items-center justify-start gap-2 min-h-[42px]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-sub)" strokeWidth="2" className="shrink-0 dark:stroke-[var(--text-soft)]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <a
                href={data.passport_image}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-[var(--text-sub)] dark:text-[var(--text-soft)] hover:underline truncate max-w-[200px]"
              >
                {data.passport_image.split('/').pop().split("?")[0] || "Ma'lumot.pdf"}
              </a>
              <span className="text-xs text-[var(--text-disabled)] shrink-0 ml-1">1487 KB</span>
            </div>
          ) : (
            <div className="w-full px-4 py-2.5 rounded-xl text-sm border border-dashed border-[var(--stroke-sub)] dark:border-[#292A2A] bg-[#E2E6F2] dark:bg-[#1c1d1d] min-h-[42px] flex items-center justify-start gap-2 text-[var(--text-disabled)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>Ma'lumot.pdf</span>
              <span className="text-xs ml-1 shrink-0">1487 KB</span>
            </div>
          )}
        </Field>
      </div>

      <div className={rowCls}>
        {/* Social Links */}
        <div className="col-span-1 flex flex-col gap-2">
          {data.social_links?.map((link, index) => {
            const isLast = index === data.social_links.length - 1;
            return (
              <div key={index} className="flex items-end gap-2.5">
                <div className="flex-1 relative">
                  <label className={labelCls}>{index + 1}.Havola</label>
                  <input
                    className={inputCls + " pr-10"}
                    placeholder="Havola yuklang"
                    value={link || ''}
                    onChange={e => {
                      const newLinks = [...data.social_links];
                      newLinks[index] = e.target.value;
                      set('social_links', newLinks);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => set('social_links', data.social_links.filter((_, i) => i !== index))}
                    className="absolute right-3 top-[34px] text-[#8F95A8] hover:text-red-500 cursor-pointer transition-colors"
                  >
                    <FaXmark size={14} />
                  </button>
                </div>
                {isLast && index < 4 && (
                  <button
                    type="button"
                    onClick={() => set('social_links', [...data.social_links, ''])}
                    className="h-[42px] w-[42px] rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] flex items-center justify-center text-[#1A1D2E] dark:text-white hover:bg-gray-50 dark:hover:bg-[#292A2A] transition-colors shrink-0 cursor-pointer dark:bg-[#191a1a]"
                  >
                    <FiPlus size={20} />
                  </button>
                )}
              </div>
            )
          })}
          {(!data.social_links || data.social_links.length === 0) && (
            <button
              type="button"
              onClick={() => set('social_links', [''])}
              className="flex items-center gap-2 py-1 px-2 w-[180px] cursor-pointer text-[#3F57B3] dark:text-[#8E95B5] text-sm font-semibold hover:opacity-80 transition-opacity rounded-xl bg-[#F1F3F9] dark:bg-[#292A2A]"
            >
              <div className="w-9 h-9 flex items-center justify-center">
                <FiPlus size={18} />
              </div>
              Havola qo'shish
            </button>
          )}
        </div>

        {/* Lavozim + Rol */}
        <div className="flex flex-col gap-2">
          <div className="w-full py-2.5 mt-3 rounded-xl flex items-center justify-between min-h-[42px]">
            <div className="flex items-center gap-2.5">
              <div className='w-[32px] h-[32px] bg-[#e9ecf5] dark:bg-[#21262d] rounded-lg flex justify-center items-center'>
                <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
              </div>
              <span className="text-sm font-bold text-[var(--text-strong)] dark:text-white">Lavozimi</span>
            </div>
            <div className="px-3 py-2.5 w-[200px] rounded-lg border border-[var(--stroke-sub)] dark:border-[#474848] flex items-center justify-between bg-white dark:bg-[#191A1A]">
              <span className="text-xs font-semibold text-[var(--text-strong)] dark:text-white">{data.position || 'Admin'}</span>
              <FaChevronDown className="w-2.5 h-2.5 text-[var(--text-soft)]" />
            </div>
          </div>

          <div className="w-full py-2.5 mt-1 rounded-xl flex items-center justify-between min-h-[42px]">
            <div className="flex items-center gap-2.5">
              <div className='w-[32px] h-[32px] bg-[#e9ecf5] dark:bg-[#21262d] rounded-lg flex justify-center items-center'>
                <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
              </div>
              <span className="text-sm font-bold text-[var(--text-strong)] dark:text-white">Roli</span>
            </div>
            {data.roles?.length > 1 ? (
              <RoleDropdown
                roles={data.roles}
                activeRole={data.active_role || data.roles[0]}
                onChangeRole={(newRole) => setProfile(p => ({ ...p, active_role: newRole }))}
              />
            ) : (
              <div className="px-3 py-1.5 rounded-lg border border-[var(--stroke-sub)] dark:border-[#474848] flex items-center gap-2 bg-white dark:bg-[#191A1A]">
                <span className="text-xs font-semibold text-[var(--text-strong)] dark:text-white">
                  {ROLE_LABELS[data.active_role || data.roles?.[0]] || data.active_role || data.roles?.[0] || role || 'Tanlash'}
                </span>
                <FaChevronDown className="w-2.5 h-2.5 text-[var(--text-soft)]" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--stroke-sub)] dark:border-[#292A2A]">
        <button
          onClick={handleSave}
          disabled={!isChanged}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold  cursor-pointer text-white bg-[#3F57B3] hover:bg-[#32458C] flex items-center gap-2 disabled:hover:bg-[#3F57B3] disabled:opacity-50 disabled:cursor-default"
        >
          <FaCheck size={15} />
          Saqlash
        </button>
      </div>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      {passportOpen && data?.passport_image && (
        <PassportViewer url={data?.passport_image} onClose={() => setPassportOpen(false)} />
      )}

      {openImg && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4 transition-opacity duration-200"
          onClick={() => setOpenImg(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpenImg(false)}
              className="absolute top-7 right-7 cursor-pointer p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all z-10"
            >
              <FaXmark size={15} />
            </button>

            <img
              src={typeof data.avatar === 'string' ? data.avatar : data.avatar ? URL.createObjectURL(data.avatar) : ''}
              alt="Avatar"
              className="w-[300px] h-[300px] object-contain"
            />
          </div>
        </div>
      )}


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
    </div>
  )
}
