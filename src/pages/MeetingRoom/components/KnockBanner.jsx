import { useState, useEffect } from 'react'
import { FaCheck, FaXmark } from 'react-icons/fa6'
import { playKnockRequestSound } from '../utils/meetingSounds'

const formatAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed
  }
  const rawBase = import.meta.env.VITE_BASE_URL || ''
  const cleanBase = rawBase.replace(/\/+$/, '')
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return cleanBase ? `${cleanBase}${cleanPath}` : cleanPath
}

export default function KnockBanner({ requests = [], onAdmit, onReject }) {
  const current = requests && requests.length > 0 ? requests[0] : null
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    if (current) {
      playKnockRequestSound()
      setImgError(false)
    }
  }, [current?.user_id, current?.avatar])

  if (!current) return null

  const initials = current?.username
    ? current.username.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : 'U'

  const avatarUrl = formatAvatarUrl(current.avatar)
  const showImg = Boolean(avatarUrl && !imgError)

  const getAvatarGradient = (name = '') => {
    const gradients = [
      'bg-[#1a73e8]',
      'bg-[#1e8e3e]',
      'bg-[#9334e6]',
      'bg-[#007b83]',
      'bg-[#e37400]',
      'bg-[#d93025]',
      'bg-[#d01884]',
      'bg-[#3949ab]',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return gradients[Math.abs(hash) % gradients.length]
  }

  return (
    <div className="fixed top-16 right-4 sm:right-6 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
      <div className="w-72 sm:w-80 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#0B0D11] border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-white shadow-[0_10px_35px_rgba(0,0,0,0.1)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] select-none transition-all">
        {/* User Info Row */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full overflow-hidden shrink-0 ${getAvatarGradient(
              current.username || ''
            )} text-white flex items-center justify-center font-bold text-sm shadow-xs`}
          >
            {showImg ? (
              <img
                src={avatarUrl}
                alt={current.username || ''}
                className="w-full h-full object-cover rounded-full"
                onError={() => setImgError(true)}
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {current.username || `Foydalanuvchi #${current.user_id}`}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-normal">
              uchrashuvga qo'shilmoqchi
            </p>
          </div>

          {requests.length > 1 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[10px] font-bold shrink-0">
              +{requests.length - 1}
            </span>
          )}
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2.5 mt-3.5">
          <button
            type="button"
            onClick={() => onReject(current.user_id)}
            className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-slate-800 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 active:scale-95"
          >
            <FaXmark size={12} className="text-slate-700 dark:text-slate-200" />
            <span>Rad etish</span>
          </button>

          <button
            type="button"
            onClick={() => onAdmit(current.user_id)}
            className="flex-1 h-9 px-3 rounded-xl bg-[#5B7BF0] hover:bg-blue-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 active:scale-95 shadow-sm"
          >
            <FaCheck size={11} className="text-white" />
            <span>Ruxsat berish</span>
          </button>
        </div>
      </div>
    </div>
  )
}
