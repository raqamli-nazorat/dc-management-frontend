import { useState } from 'react'
import {
  FaXmark,
  FaCheck,
  FaCrown,
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaMagnifyingGlass,
  FaUsers,
} from 'react-icons/fa6'
import { TbHandStop, TbPin, TbPinnedOff } from 'react-icons/tb'

export default function ParticipantsDrawer({
  isOpen,
  onClose,
  participants = [],
  knockRequests = [],
  isHost = false,
  isLocalHost = false,
  onMuteParticipant,
  onMuteAll,
  onAskUnmuteParticipant,
  onTurnOffCamera,
  onAdmitUser,
  onRejectUser,
  currentUserId,
  pinnedId,
  onTogglePin,
}) {
  const [search, setSearch] = useState('')

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

  const filteredParticipants = participants.filter((p) => {
    const name = p.name || p.identity || ''
    return name.toLowerCase().includes(search.toLowerCase())
  })

  // Boshqa qatnashchilardan kamida bittasining mikrofoni yoniq ekanligini aniqlash
  const hasUnmutedGuests = participants.some(
    (p) => !p.isLocal && String(p.identity) !== String(currentUserId) && p.isMicEnabled
  )

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-30 sm:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed sm:relative top-0 right-0 bottom-0 h-full flex flex-col bg-[#202124] shadow-2xl z-40 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] ${
          isOpen
            ? 'w-full sm:w-[380px] translate-x-0 opacity-100 pointer-events-auto border-l border-[#3c4043]'
            : 'w-0 translate-x-full sm:translate-x-0 sm:w-0 opacity-0 pointer-events-none border-l-0'
        }`}
      >
        <div className="w-full sm:w-[380px] h-full flex flex-col shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#3c4043] bg-[#202124] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                <FaUsers size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white leading-tight">Qatnashchilar</h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs font-mono font-bold">
                    {participants.length}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Yig'ilishdagi faol ishtirokchilar</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition-all active:scale-90"
              title="Yopish"
            >
              <FaXmark size={14} />
            </button>
          </div>

          {/* Search bar */}
          {(participants.length > 3 || search) && (
            <div className="px-4 py-2.5 border-b border-[#3c4043] bg-[#1a1b1e]/60 shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#303134] border border-[#5f6368]/30 text-xs text-slate-300 focus-within:border-[#8ab4f8] focus-within:ring-2 focus-within:ring-[#8ab4f8]/20 transition-all">
                <FaMagnifyingGlass size={12} className="text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ism bo'yicha qidirish..."
                  className="w-full bg-transparent text-white placeholder-slate-400 outline-none text-xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <FaXmark size={11} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Body */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#18191c]/50"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#3c4043 transparent' }}
          >
            {/* Pending Knock Requests (Host only) */}
            {isHost && knockRequests.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-in fade-in slide-in-from-top-2 duration-300 shadow-md">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Kirishni so'raganlar ({knockRequests.length})
                  </span>
                </div>

                <div className="space-y-2">
                  {knockRequests.map((req) => (
                    <div
                      key={req.user_id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#202124] border border-white/10 shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow">
                          {req.avatar ? (
                            <img
                              src={req.avatar}
                              alt={req.username || ''}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          ) : (
                            req.username?.slice(0, 2).toUpperCase() || 'U'
                          )}
                        </div>
                        <span className="text-xs font-semibold text-white truncate">
                          {req.username || `Foydalanuvchi #${req.user_id}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => onAdmitUser(req.user_id)}
                          title="Ruxsat berish"
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                        >
                          <FaCheck size={11} />
                          <span className="hidden sm:inline">Qabul</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onRejectUser(req.user_id)}
                          title="Rad etish"
                          className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-700 text-white cursor-pointer transition-all active:scale-95 shadow-sm"
                        >
                          <FaXmark size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Participants List */}
            <div>
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Qo'ng'iroqda ({filteredParticipants.length})
                </span>
                {isLocalHost && hasUnmutedGuests && onMuteAll && (
                  <button
                    type="button"
                    onClick={onMuteAll}
                    title="Barcha ishtirokchilar mikrofonini o'chirish"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-[11px] font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <FaMicrophoneSlash size={11} />
                    <span>Barchani o'chirish</span>
                  </button>
                )}
              </div>

              {filteredParticipants.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Qidiruv bo'yicha qatnashuvchi topilmadi
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredParticipants.map((p) => {
                    const isMe = p.isLocal || String(p.identity) === String(currentUserId)
                    const initials = p.name
                      ? p.name.trim().split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                      : 'U'
                    const isItemPinned = pinnedId === p.identity

                    return (
                      <div
                        key={p.identity || p.sid}
                        className="flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-2xl bg-[#282a2d]/80 hover:bg-[#35383c] border border-white/5 transition-all duration-200 group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar with speaking ring indicator */}
                          <div
                            className={`w-9 h-9 rounded-full overflow-hidden ${getAvatarGradient(
                              p.name || ''
                            )} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-md transition-all ${
                              p.isSpeaking
                                ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-[#282a2d] animate-pulse'
                                : ''
                            }`}
                          >
                            {p.avatar ? (
                              <img
                                src={p.avatar}
                                alt={p.name || ''}
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => { e.target.style.display = 'none' }}
                              />
                            ) : (
                              initials
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[130px] sm:max-w-[150px]">
                                {p.name || 'Ishtirokchi'}
                              </span>
                              {isMe && (
                                <span className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-500/20">
                                  Siz
                                </span>
                              )}
                            </div>
                            {p.isHost && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[10px] font-bold mt-0.5">
                                <FaCrown size={9} className="text-amber-400" /> Tashkilotchi
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Controls & Indicators */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Pin shortcut toggle */}
                          {onTogglePin && (
                            <button
                              type="button"
                              onClick={() => onTogglePin(p.identity)}
                              title={isItemPinned ? "Pinni olib tashlash" : "Ekranni pin qilish"}
                              className={`p-1.5 rounded-lg cursor-pointer transition-all duration-150 ${
                                isItemPinned
                                  ? 'bg-blue-600 text-white opacity-100 shadow-sm'
                                  : 'text-slate-400 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100'
                              }`}
                            >
                              {isItemPinned ? <TbPinnedOff size={14} /> : <TbPin size={14} />}
                            </button>
                          )}

                          {/* Hand raise indicator */}
                          {p.hasHandRaised && (
                            <span
                              className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 animate-bounce"
                              title="Qo'l ko'targan"
                            >
                              <TbHandStop size={14} />
                            </span>
                          )}

                          {/* Mic indicator or Host Mute Control */}
                          {isLocalHost && !isMe ? (
                            p.isMicEnabled ? (
                              <button
                                type="button"
                                onClick={() => onMuteParticipant && onMuteParticipant(p.identity)}
                                title={`${p.name || 'Ishtirokchi'} ovozini o'chirish (Mute)`}
                                className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20 hover:bg-red-600 text-red-400 hover:text-white transition-all cursor-pointer shadow-sm active:scale-90"
                              >
                                <FaMicrophoneSlash size={11} />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onAskUnmuteParticipant && onAskUnmuteParticipant(p.identity)}
                                title={`${p.name || 'Ishtirokchi'}dan mikrofonni yoqishni so'rash`}
                                className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 hover:bg-emerald-600/30 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer active:scale-90"
                              >
                                <FaMicrophoneSlash size={11} />
                              </button>
                            )
                          ) : (
                            <span
                              className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                                p.isMicEnabled
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-red-500/15 text-red-400'
                              }`}
                              title={p.isMicEnabled ? 'Mikrofon yoniq' : "Mikrofon o'chiq"}
                            >
                              {p.isMicEnabled ? <FaMicrophone size={11} /> : <FaMicrophoneSlash size={11} />}
                            </span>
                          )}

                          {/* Camera indicator or Host Turn Off Control */}
                          {isLocalHost && !isMe && p.isCameraEnabled ? (
                            <button
                              type="button"
                              onClick={() => onTurnOffCamera && onTurnOffCamera(p.identity)}
                              title={`${p.name || 'Ishtirokchi'} kamerasini o'chirish`}
                              className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20 hover:bg-red-600 text-red-400 hover:text-white transition-all cursor-pointer shadow-sm active:scale-90"
                            >
                              <FaVideoSlash size={11} />
                            </button>
                          ) : (
                            <span
                              className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                                p.isCameraEnabled
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-white/5 text-slate-500'
                              }`}
                              title={p.isCameraEnabled ? 'Kamera yoniq' : "Kamera o'chiq"}
                            >
                              {p.isCameraEnabled ? <FaVideo size={11} /> : <FaVideoSlash size={11} />}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
