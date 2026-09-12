import { FaXmark, FaCheck, FaCrown, FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash } from 'react-icons/fa6'
import { TbHandStop } from 'react-icons/tb'

export default function ParticipantsDrawer({
  isOpen,
  onClose,
  participants = [],
  knockRequests = [],
  isHost = false,
  onAdmitUser,
  onRejectUser,
  currentUserId,
}) {
  if (!isOpen) return null

  return (
    <div className="w-full sm:w-[360px] h-full flex flex-col bg-[#1A1D24] border-l border-white/10 shadow-2xl z-30 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-bold text-white">Qatnashchilar</h3>
          <p className="text-xs text-slate-400">Jami {participants.length} kishi xonada</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors"
        >
          <FaXmark size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}>
        {/* Pending Knock Requests (Host only) */}
        {isHost && knockRequests.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Kirishni so'raganlar ({knockRequests.length})
              </span>
            </div>

            <div className="space-y-2.5">
              {knockRequests.map((req) => (
                <div
                  key={req.user_id}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#1C1F26] border border-white/10"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {req.username?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-semibold text-white truncate">
                      {req.username || `Foydalanuvchi #${req.user_id}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onAdmitUser(req.user_id)}
                      title="Qabul qilish"
                      className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors"
                    >
                      <FaCheck size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectUser(req.user_id)}
                      title="Rad etish"
                      className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-700 text-white cursor-pointer transition-colors"
                    >
                      <FaXmark size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Participants List */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
            Xonada ({participants.length})
          </h4>

          <div className="space-y-2">
            {participants.map((p) => {
              const isMe = p.isLocal || String(p.identity) === String(currentUserId)
              const initials = p.name ? p.name.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : 'U'

              return (
                <div
                  key={p.identity || p.sid}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#22262E] hover:bg-[#2A2F3A] border border-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-white truncate max-w-[150px]">
                          {p.name || 'Ishtirokchi'}
                        </span>
                        {isMe && <span className="text-[11px] text-blue-400 font-medium">(Siz)</span>}
                      </div>
                      {p.isHost && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-medium">
                          <FaCrown size={9} /> Mezbon
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Hand raise indicator */}
                    {p.hasHandRaised && (
                      <span className="text-amber-400 animate-bounce" title="Qo'l ko'targan">
                        <TbHandStop size={18} />
                      </span>
                    )}

                    {/* Mic indicator */}
                    <span
                      className={`p-1 rounded-md ${p.isMicEnabled ? 'text-emerald-400' : 'text-red-400'}`}
                      title={p.isMicEnabled ? "Mikrofon yoniq" : "Mikrofon o'chiq"}
                    >
                      {p.isMicEnabled ? <FaMicrophone size={13} /> : <FaMicrophoneSlash size={13} />}
                    </span>

                    {/* Camera indicator */}
                    <span
                      className={`p-1 rounded-md ${p.isCameraEnabled ? 'text-emerald-400' : 'text-slate-500'}`}
                      title={p.isCameraEnabled ? "Kamera yoniq" : "Kamera o'chiq"}
                    >
                      {p.isCameraEnabled ? <FaVideo size={13} /> : <FaVideoSlash size={13} />}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
