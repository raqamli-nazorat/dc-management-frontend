import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getRouteRole } from '../components/ProtectedRoute'
import { LuEye, LuEyeClosed } from 'react-icons/lu'

const THROTTLE_KEY = 'login_throttle_until'

function getThrottleSeconds() {
  const until = localStorage.getItem(THROTTLE_KEY)
  if (!until) return 0
  const remaining = Math.ceil((Number(until) - Date.now()) / 1000)
  return remaining > 0 ? remaining : 0
}

function setThrottleUntil(seconds) {
  localStorage.setItem(THROTTLE_KEY, String(Date.now() + seconds * 1000))
}

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')
  return `${m}:${s}`
}

export default function Login() {
  const [loginVal, setLoginVal] = useState('')
  const [parolVal, setParolVal] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [throttleSecs, setThrottleSecs] = useState(() => getThrottleSeconds())
  const timerRef = useRef(null)

  const { login } = useAuth()
  const navigate = useNavigate()

  // Countdown timer
  useEffect(() => {
    if (throttleSecs <= 0) return
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const remaining = getThrottleSeconds()
      setThrottleSecs(remaining)
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        setError('')
      }
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [throttleSecs > 0])

  const isThrottled = throttleSecs > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isThrottled || loading) return
    setError('')
    if (!loginVal || !parolVal) { setError("Login va parolni to'ldiring."); return }
    setLoading(true)
    setTimeout(async () => {
      const result = await login(loginVal, parolVal)
      setLoading(false)
      if (result.success) {
        navigate(`/${getRouteRole({ roles: result.roles })}/dashboard`)
      } else {
        // 429 throttle xatosini tekshirish
        const raw = result.error
        const errorId = raw?.errorId ?? raw?.error?.errorId
        const errorMsg = String(raw?.errorMsg ?? raw?.error?.errorMsg ?? '')

        if (errorId === 429 || errorMsg.toLowerCase().includes('throttled')) {
          const match = errorMsg.match(/(\d+)\s*second/i)
          const secs = match ? parseInt(match[1], 10) : 60
          setThrottleUntil(secs)
          setThrottleSecs(secs)
        } else {
          setError("Login yo'li yoki parol noto'g'ri kiritilgan. Iltimos, to'g'ri kiritilganiga ishonch hosil qiling.")
        }
      }
    }, 600)
  }

  const filled = loginVal && parolVal

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#F1F3F9] dark:bg-[#111111]"
      style={{ fontFamily: '"Manrope", sans-serif' }}
    >
      <div className="flex w-[1200px] items-center justify-between gap-10">

        {/* Chap panel */}
        <div
          className="hidden md:flex flex-col justify-end overflow-hidden relative rounded-3xl shrink-0"
          style={{
            width: 600,
            height: 680,
            background: 'linear-gradient(135deg, #E6ECFF 0%, #A5B4FC 40%, #526ED3 100%)',
          }}
        >
          <div className="absolute top-10 left-10 right-10 z-10">
            <h2
              className="leading-tight text-[#1a1a2e] dark:text-white"
              style={{ fontWeight: 800, fontSize: 36, fontFamily: '"Manrope", sans-serif' }}
            >
              Raqamli boshqaruv tizimiga<br />xush kelibsiz
            </h2>
            <p
              className="mt-4 text-[rgba(30,30,60,0.72)] dark:text-white/80"
              style={{ fontWeight: 500, fontSize: 17, fontFamily: '"Manrope", sans-serif' }}
            >
              Loyihalar, vazifalar va moliyani bitta platformada boshqaring
            </p>
          </div>
          <img
            src="/imgs/loginImg.png"
            alt="login illustration"
            className="w-full object-contain object-bottom"
          />
        </div>

        {/* O'ng panel */}
        <div
          className="rounded-2xl bg-white dark:bg-[#191A1A] border border-[#EEF1F7] dark:border-[#474848] shadow-[0_4px_32px_rgba(0,0,0,0.06)] shrink-0"
          style={{ width: 440, padding: 40, fontFamily: '"Manrope", sans-serif' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#526ED3] flex items-center justify-center shrink-0">
              <img src="/imgs/Logo.png" alt="logo" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-semibold text-base text-[#1a1a2e] dark:text-white" style={{ fontFamily: '"Manrope", sans-serif' }}>
              Raqamli Nazorat
            </span>
          </div>

          {/* Sarlavha */}
          <h1
            className="mb-7 text-[#1A1D2E] dark:text-white"
            style={{ fontWeight: 800, fontSize: 28, fontFamily: '"Manrope", sans-serif' }}
          >
            Kirish
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Login */}
            <input
              type="text"
              placeholder="Login"
              value={loginVal}
              onChange={e => { setLoginVal(e.target.value); if (!isThrottled) setError('') }}
              disabled={isThrottled}
              className="w-full px-4 py-3.5 rounded-xl text-sm outline-none
                bg-[#F8F9FC] border border-[#EEF1F7] text-[#1A1D2E] placeholder-[#B6BCCB]
                focus:border-[#EEF1F7] dark:focus:border-[#474848]
                dark:bg-[#222323] dark:border-[#292A2A] dark:text-white dark:placeholder-[#757575]
                disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ fontFamily: '"Manrope", sans-serif' }}
            />

            {/* Parol */}
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Parol"
                value={parolVal}
                onChange={e => { setParolVal(e.target.value); if (!isThrottled) setError('') }}
                disabled={isThrottled}
                className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm outline-none
                  bg-[#F8F9FC] border border-[#EEF1F7] text-[#1A1D2E] placeholder-[#B6BCCB]
                  focus:border-[#EEF1F7] dark:focus:border-[#474848]
                  dark:bg-[#222323] dark:border-[#292A2A] dark:text-white dark:placeholder-[#757575]
                  disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: '"Manrope", sans-serif' }}
              />
              {parolVal.length > 0 && !isThrottled && (
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer flex items-center
                    text-[#9AA1B5] hover:text-[#5B6078] dark:text-[#757575] dark:hover:text-[#8E95B5]"
                >
                  {showPass ? <LuEyeClosed size={20} /> : <LuEye size={20} />}
                </button>
              )}
            </div>

            {/* Throttle xabari */}
            {isThrottled && (
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-semibold text-[#FA5252]" style={{ fontFamily: '"Manrope", sans-serif' }}>
                  Kirish vaqtincha bloklandi
                </p>
                <p className="text-sm text-[#5B6078] dark:text-[#8E95B5]" style={{ fontFamily: '"Manrope", sans-serif' }}>
                  Qayta urinish uchun: <span className="font-bold text-[#1A1D2E] dark:text-white">{formatTime(throttleSecs)}</span>
                </p>
              </div>
            )}

            {/* Oddiy xato */}
            {!isThrottled && error && (
              <p className="text-sm text-[#FA5252]" style={{ fontFamily: '"Manrope", sans-serif' }}>{error}</p>
            )}

            {/* Tugma */}
            <button
              type="submit"
              disabled={loading || !filled || isThrottled}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm duration-200 mt-1
                ${filled && !isThrottled
                  ? 'bg-[#3F57B3] text-white hover:bg-[#526ED3] cursor-pointer'
                  : 'bg-[#E9ECF5] text-[#B6BCCB] cursor-not-allowed dark:bg-[#F2F1F0] dark:text-[#757575]'
                }`}
              style={{ fontFamily: '"Manrope", sans-serif' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Kirish...
                </span>
              ) : isThrottled ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  {formatTime(throttleSecs)}
                </span>
              ) : 'Kirish'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
