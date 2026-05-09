import { useState, useEffect, useRef } from 'react'
import { FaXmark, FaArrowLeft, FaEye, FaEyeSlash, FaPencil, FaChevronDown } from 'react-icons/fa6'
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


const boxCls = 'w-full px-4 py-2.5 rounded-xl text-sm border bg-white border-[var(--stroke-sub)] text-[var(--text-strong)] dark:bg-[#222323] dark:border-[#292A2A] dark:text-white'

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
const formatPhone = (v) => {
  if (!v) return null
  // Faqat raqamlarni olish
  const digits = v.replace(/\D/g, '')
  // +998XXXXXXXXX → +998 XX XXX XX XX
  if (digits.length === 12 && digits.startsWith('998')) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`
  }
  if (digits.length === 9) {
    return `+998 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 7)} ${digits.slice(7, 9)}`
  }
  return v
}

const formatCard = (val) => {
  if (!val) return '';
  let digits = val.replace(/\D/g, '').slice(0, 16);
  return digits.match(/.{1,4}/g)?.join(' ') || digits;
}
/* ── Social Field with copy ── */
function SocialField({ label, value, icon, placeholder }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!value) return
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-soft)] flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <div className={boxCls + ' min-h-[42px] flex items-center justify-between gap-2 group'}>
        <span className={`flex-1 truncate text-sm text-left ${!value ? 'text-[var(--text-disabled)] dark:text-[#474848]' : ''}`}>
          {value || placeholder}
        </span>
        {value && (
          <button
            onClick={handleCopy}
            title="Nusxa olish"
            className="shrink-0 cursor-pointer text-[var(--text-soft)] hover:text-[var(--accent-sub)]"
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[#22c55e]">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  )
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
      await axiosAPI.put('/users/me/change-role/', { active_role: role })
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
        className="px-3 py-1.5 rounded-lg border border-[var(--stroke-sub)] dark:border-[#474848] flex items-center gap-2 bg-white dark:bg-[#191A1A] cursor-pointer hover:border-[var(--accent-sub)] transition-colors"
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

  const [data, setData] = useState({})

  const set = (k, v) => setData(prev => ({ ...prev, [k]: v }))

  const getProfile = async () => {
    try {
      const { data } = await axiosAPI.get('/users/me/')
      setProfile(data?.data ?? data)
      setData(data?.data ?? data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getProfile()
  }, [])

  if (loading) return <Skeleton />

  const fullName = data.full_name || data.username || authUser?.username || 'Foydalanuvchi'
  const initials = fullName.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
  const role = (data.roles?.[0] || authUser?.roles?.[0] || 'admin')

  // Social links — string yoki object bo'lishi mumkin
  let social = {}
  if (typeof data.social_links === 'object' && data.social_links) {
    social = data.social_links
  } else if (typeof data.social_links === 'string' && data.social_links) {
    try { social = JSON.parse(data.social_links) } catch { social = {} }
  }

  const handleSave = async () => {
    const isCardChanged = data.card_number !== profile.card_number && data.card_number.trim() !== "";
    const isSocialChanged = JSON.stringify(data.social_links || "") !== JSON.stringify(profile.social_links || "");

    try {
      if (isCardChanged && isSocialChanged) {
        const resCard = await axiosAPI.put("users/me/card-number/", {
          card_number: data.card_number.replace(/\s/g, '')
        })
        const resLinks = await axiosAPI.put("users/me/social-links/", {
          social_links: data.social_links
        })

        getProfile()
        
        toast.success("Ma'lumotlar yangilandi!", `${resCard.data.data.message}, ${resLinks.data.data.message}`)
      } else if (isCardChanged) {
        const resCard = await axiosAPI.put("users/me/card-number/", {
          card_number: data.card_number.replace(/\s/g, '')
        })
        console.log(resCard);

        getProfile()
        toast.success("Ma'lumotlar yangilandi!", resCard.data.data.message)
      } else if (isSocialChanged) {
        const resLinks = await axiosAPI.put("users/me/social-links/", {
          social_links: data.social_links.map((item, index) => ({havola: item}))
        })

        getProfile()
        toast.success("Ma'lumotlar yangilandi!", resLinks.data.data.message)
      }
    } catch (error) {

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
      toast.error("Xatolik yuz berdi.", errMsg)
    }
  }

  const rowCls = 'grid grid-cols-2 gap-4'

  const labelCls = 'block text-xs font-medium text-[var(--text-sub)] dark:text-[#C2C8E0] mb-1'
  const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm outline-none border bg-white border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-disabled)] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-[#FFFFFF] dark:placeholder-[#8E95B5]`


  return (
    <div className="flex flex-col gap-3 w-full">
      <h1 className="text-2xl font-bold text-[var(--text-strong)] dark:text-white">Shaxsiy kabinet</h1>

      {/* Avatar + Name */}
      <div className="flex items-center gap-2.5">
        {data.avatar ? (
          <img src={data.avatar} alt="avatar"
            className="w-[72px] h-[72px] rounded-2xl object-cover shrink-0" />
        ) : (
          <div className="w-[72px] h-[72px] rounded-2xl bg-[var(--accent-sub)] flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {initials}
          </div>
        )}
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
        <SocialField label="Telifon raqami" value={formatCard(data.phone_number)} />

        <div>
          <label className={labelCls}>Karta raqami</label>

          <input
            className={inputCls}
            type="text"
            inputMode="numeric"
            placeholder="0000 0000 0000 0000"
            value={data.card_number || ''}
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
            <div className="w-full px-4 py-2.5 rounded-xl text-sm border border-dashed border-[var(--stroke-sub)] dark:border-[#292A2A] bg-white dark:bg-[#222323] flex items-center justify-start gap-2 min-h-[42px]">
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
                {data.passport_image.split('/').pop() || "Ma'lumot.pdf"}
              </a>
              <span className="text-xs text-[var(--text-disabled)] shrink-0 ml-1">1487 KB</span>
            </div>
          ) : (
            <div className="w-full px-4 py-2.5 rounded-xl text-sm border border-dashed border-[var(--stroke-sub)] dark:border-[#292A2A] bg-white dark:bg-[#222323] min-h-[42px] flex items-center justify-start gap-2 text-[var(--text-disabled)]">
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

      {/* Social Links */}
      <div className="grid grid-cols-3 gap-3">
        {data.social_links?.map((link, index) => (
          <div key={index} className="flex items-end gap-3">
            <div className="flex-1">
              <label className={labelCls}>{index + 1}.Havola qo'shish</label>
              <input
                className={inputCls}
                placeholder="Havola yuklang"
                value={link}
                onChange={e => {
                  const newLinks = [...data.social_links];
                  newLinks[index] = e.target.value;
                  set('social_links', newLinks);
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (index === data.social_links?.length - 1 && index < 4) {
                  set('social_links', [...data.social_links, '']);
                } else {
                  set('social_links', data.social_links?.filter((_, i) => i !== index))
                }
              }}
              className="h-[42px] w-[42px] rounded-xl border border-[var(--stroke-sub)] dark:border-[#292A2A] flex items-center justify-center text-[var(--text-strong)] dark:text-white hover:bg-gray-50 dark:hover:bg-[#292A2A] transition-colors shrink-0 cursor-pointer dark:bg-[#191a1a]"
            >
              {index === data.social_links?.length - 1 && index < 4 ? <FiPlus size={20} /> : <FaXmark size={20} />}
            </button>
          </div>
        ))}
      </div>

      {/* Lavozim + Rol */}
      <div className={rowCls}>
        <div className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-elevation-1)]  dark:bg-[#1C1D1D]  flex items-center justify-between min-h-[42px]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
            <span className="text-sm font-bold text-[var(--text-strong)] dark:text-white">Lavozimi</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg border border-[var(--stroke-sub)] dark:border-[#474848] flex items-center gap-2 bg-white dark:bg-[#191A1A]">
            <span className="text-xs font-semibold text-[var(--text-strong)] dark:text-white">{data.position || 'Admin'}</span>
            <FaChevronDown className="w-2.5 h-2.5 text-[var(--text-soft)]" />
          </div>
        </div>

        <div className="w-full px-4 py-2.5 rounded-xl  bg-[var(--bg-elevation-1)]  dark:bg-[#1C1D1D]  flex items-center justify-between min-h-[42px]">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
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

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--stroke-sub)] dark:border-[#292A2A]">
        <button
          onClick={() => setData(profile)}
          className="px-6 py-2.5 rounded-lg text-sm font-medium  cursor-pointer text-[var(--text-sub)] bg-[#F1F3F9] hover:bg-[var(--stroke-sub)] dark:text-[#C2C8E0] dark:bg-[#292A2A] dark:hover:bg-[#363737]"
        >
          Tozalash
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2.5 rounded-lg text-sm font-semibold  cursor-pointer text-white bg-[var(--accent-strong)] hover:bg-[#32458C]"
        >
          Saqlash
        </button>
      </div>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      {passportOpen && data.passport_image && (
        <PassportViewer url={data.passport_image} onClose={() => setPassportOpen(false)} />
      )}
    </div>
  )
}
