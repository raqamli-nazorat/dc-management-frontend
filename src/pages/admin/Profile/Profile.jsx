import { useState, useEffect } from 'react'
import { FaXmark, FaArrowLeft, FaEye, FaEyeSlash, FaPencil } from 'react-icons/fa6'
import { useAuth } from '../../../context/AuthContext'
import { axiosAPI } from '../../../service/axiosAPI'
import { getErrorMessage } from '../../../service/getErrorMessage'
import { toast } from '../../../Toast/ToastProvider'

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
    'bg-white text-[#1A1D2E] placeholder-[#8F95A8]',
    'dark:bg-[#191A1A] dark:text-white dark:placeholder-[#5B6078]',
    err ? 'border-red-400 dark:border-red-500'
      : 'border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]',
  ].join(' ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <button onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full z-10 cursor-pointer 
          bg-[#F1F3F9] hover:bg-[#E2E6F2] text-[#5B6078] dark:bg-[#292A2A] dark:hover:bg-[#333435] dark:text-[#C2C8E0]">
        <FaXmark size={14} />
      </button>
      <div className="relative w-full max-w-[520px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111] p-7">
        <div className="flex items-center gap-3 mb-1.5">
          <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer transition-opacity">
            <FaArrowLeft size={16} />
          </button>
          <h2 className="text-xl font-extrabold text-[#1A1D2E] dark:text-white">Parolni o'zgartirish</h2>
        </div>
        <p className="text-sm text-[#5B6078] dark:text-[#8F95A8] mb-6">
          Xavfsizlik uchun joriy parolingizni kiriting va yangi parol o'rnating
        </p>
        <div className="flex flex-col gap-4">
          {[
            { key: 'current', label: 'Joriy parol', placeholder: 'Joriy parolni kiriting' },
            { key: 'newPass', label: 'Yangi parol', placeholder: 'Yangi parolni kiriting' },
            { key: 'confirm', label: 'Parolni tasdiqlash', placeholder: 'Yangi parolni qayta kiriting' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show[key] ? 'text' : 'password'}
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  placeholder={placeholder}
                  className={inputCls(errors[key])}
                />
                <button type="button" onClick={() => setShow(p => ({ ...p, [key]: !p[key] }))}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] hover:text-[#5B6078] cursor-pointer">
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
              text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Bekor qilish
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer
              bg-[#3F57B3] text-white hover:bg-[#526ED3] disabled:opacity-60">
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
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#526ED3]">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p className="text-[#1A1D2E] dark:text-white font-semibold text-sm">Fayl brauzerda ochiladi</p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#3F57B3] text-white hover:bg-[#526ED3]  cursor-pointer"
            >
              Ochish
            </a>
          </div>
        )}
      </div>
    </div>
  )
}


const boxCls = 'w-full px-4 py-2.5 rounded-xl text-sm border bg-white border-[#E2E6F2] text-[#1A1D2E] dark:bg-[#222323] dark:border-[#292A2A] dark:text-white'

function Field({ label, value, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[#5B6078] dark:text-[#8F95A8]">{label}</span>
      {children ?? (
        <div className={boxCls + ' text-right min-h-[42px] flex items-center justify-end'}>
          {value ?? ''}
        </div>
      )}
    </div>
  )
}

/* ── Social Field with copy ── */
function SocialField({ label, value, icon }) {
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
      <span className="text-xs font-medium text-[#5B6078] dark:text-[#8F95A8] flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <div className={boxCls + ' min-h-[42px] flex items-center justify-between gap-2 group'}>
        <span className="flex-1 truncate text-sm">{value ?? ''}</span>
        {value && (
          <button
            onClick={handleCopy}
            title="Nusxa olish"
            className="shrink-0 cursor-pointer  text-[#8F95A8] hover:text-[#526ED3]"
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

/* ── Main Page ── */
export default function ProfilePage() {
  const { user: authUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passportOpen, setPassportOpen] = useState(false)

  useEffect(() => {
    axiosAPI.get('/users/me/')
      .then(res => setProfile(res.data?.data ?? res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Skeleton />

  const data = profile || {}
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

  const rowCls = 'grid grid-cols-2 gap-4'

  return (
    <div className="flex flex-col gap-5 w-full">
      <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-white">Shaxsiy kabinet</h1>

      {/* Avatar + Name */}
      <div className="flex items-center gap-4">
        {data.avatar ? (
          <img src={data.avatar} alt="avatar"
            className="w-[72px] h-[72px] rounded-2xl object-cover shrink-0" />
        ) : (
          <div className="w-[72px] h-[72px] rounded-2xl bg-[#526ED3] flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {initials}
          </div>
        )}
        <div>
          <p className="text-lg font-bold text-[#1A1D2E] dark:text-white">{fullName}</p>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border  cursor-pointer
              border-[#E2E6F2] text-[#5B6078] hover:bg-[#F1F3F9]
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

      {/* Viloyat + Tuman */}
      <div className={rowCls}>
        <Field label="Viloyat" value={data.region} />
        <Field label="Tuman" value={data.district} />
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
            <button
              onClick={() => setPassportOpen(true)}
              className={boxCls + ' flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity min-h-[42px] w-full text-left'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#526ED3] shrink-0">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span className="flex-1 truncate text-sm">Passport fayli</span>
            </button>
          ) : (
            <div className={boxCls + ' min-h-[42px]'} />
          )}
        </Field>
      </div>

      {/* Telefon + Karta */}

      {/* GitHub + LinkedIn + Telegram */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            key: 'github', label: 'GitHub', value: social.github,
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-[#1A1D2E] dark:text-white shrink-0"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
          },
          {
            key: 'linkedin', label: 'LinkedIn', value: social.linkedin,
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-[#0077B5] shrink-0"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          },
          {
            key: 'telegram', label: 'Telegram', value: social.telegram,
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-[#229ED9] shrink-0"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          },
        ].map(({ key, label, value, icon }) => (
          <SocialField key={key} label={label} value={value} icon={icon} />
        ))}
      </div>

      {/* Lavozim + Rol */}
      <div className="flex items-end gap-4">
        <div className="flex w-[50%] justify-between gap-1.5">
          <span className="text-xs font-medium text-[#5B6078] dark:text-[#8F95A8] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Lavozimi
          </span>
          <div className={boxCls + ' min-h-[42px]  items-center'} style={{ minWidth: 120, maxWidth:200}}>
            {data.position ?? ''}
          </div>
        </div>
        <div className="flex w-[50%] justify-between gap-1.5">
          <span className="text-xs font-medium text-[#5B6078] dark:text-[#8F95A8] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Rolli
          </span>
          <div className={boxCls + ' min-h-[42px] flex items-center'} style={{ width: 120 }}>
            {role ?? ''}
          </div>
        </div>
      </div>

      {showPasswordModal && <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />}
      {passportOpen && data.passport_image && (
        <PassportViewer url={data.passport_image} onClose={() => setPassportOpen(false)} />
      )}
    </div>
  )
}
