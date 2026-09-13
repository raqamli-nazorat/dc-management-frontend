import { useEffect } from 'react'
import { FaCheck, FaXmark, FaUserPlus, FaBell } from 'react-icons/fa6'
import { playKnockRequestSound } from '../utils/meetingSounds'

export default function KnockBanner({ requests = [], onAdmit, onReject }) {
  const current = requests && requests.length > 0 ? requests[0] : null

  useEffect(() => {
    if (current) {
      playKnockRequestSound()
    }
  }, [current?.user_id])

  if (!current) return null

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="flex items-center gap-4 p-4 rounded-3xl bg-[#1C1F26]/95 backdrop-blur-xl border border-amber-500/50 text-white shadow-2xl shadow-amber-500/20 max-w-sm ring-1 ring-amber-400/30">
        <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-amber-500/30">
          {current.avatar ? (
            <img
              src={current.avatar}
              alt={current.username || ''}
              className="w-full h-full object-cover rounded-2xl"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : current.username ? (
            current.username.slice(0, 2).toUpperCase()
          ) : (
            <FaUserPlus size={18} />
          )}
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center text-[10px] animate-bounce shadow-md z-10">
            <FaBell size={10} />
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate text-white">
            {current.username || `Foydalanuvchi #${current.user_id}`}
          </p>
          <p className="text-xs text-amber-300 font-medium flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            Yig'ilishga kirishni so'ramoqda
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onAdmit(current.user_id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-all duration-200 shadow-md shadow-emerald-600/40 hover:scale-105 active:scale-95"
          >
            <FaCheck size={12} />
            <span>Qabul</span>
          </button>
          <button
            type="button"
            onClick={() => onReject(current.user_id)}
            className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-300 text-slate-300 cursor-pointer transition-all duration-200"
            title="Rad etish"
          >
            <FaXmark size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
