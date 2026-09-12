import { FaCheck, FaXmark, FaUserPlus } from 'react-icons/fa6'

export default function KnockBanner({ requests = [], onAdmit, onReject }) {
  if (!requests || requests.length === 0) return null

  // Show the latest request
  const current = requests[0]

  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#1C1F26]/95 backdrop-blur-xl border border-amber-500/40 text-white shadow-2xl max-w-sm">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold shrink-0 shadow-md">
          {current.username ? current.username.slice(0, 2).toUpperCase() : <FaUserPlus size={16} />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate text-white">
            {current.username || `Foydalanuvchi #${current.user_id}`}
          </p>
          <p className="text-xs text-amber-300">Yig'ilishga kirishni so'ramoqda</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onAdmit(current.user_id)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
            
          >
            <FaCheck size={12} />
            <span>Qabul</span>
          </button>
          <button
            type="button"
            onClick={() => onReject(current.user_id)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer transition-colors"
            title="Rad etish"
          >
            <FaXmark size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
