import { useState } from 'react'
import { FaXmark, FaCheck } from 'react-icons/fa6'
import {
  UserGroupIcon,
  Search01Icon,
  Mic01Icon,
  MicOff01Icon,
  Video01Icon,
  VideoOffIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

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
  onAskTurnOnCamera,
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

  const hasUnmutedGuests = participants.some(
    (p) => !p.isLocal && String(p.identity) !== String(currentUserId) && p.isMicEnabled
  )

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-30 sm:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Participants Panel matching Figma design */}
      <div
        className={`fixed sm:relative top-0 right-0 bottom-0 sm:top-auto sm:right-auto sm:bottom-auto h-full rounded-none sm:rounded-3xl bg-white dark:bg-[#0B0D11] shadow-[0_10px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col shrink-0 z-40 sm:z-auto overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] ${
          isOpen
            ? 'w-full sm:w-[340px] md:w-[360px] opacity-100 pointer-events-auto sm:ml-3 md:ml-4 p-4 sm:p-5 translate-x-0 border-l sm:border border-slate-200/90 dark:border-white/10'
            : 'w-0 opacity-0 pointer-events-none sm:ml-0 p-0 translate-x-full sm:translate-x-0 border-0'
        }`}
      >
        <div className="w-full sm:w-[308px] md:w-[320px] h-full flex flex-col shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 pb-1">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white select-none">
            Ishtirokchilar
          </h3>
          <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
            <HugeiconsIcon icon={UserGroupIcon} size={20} strokeWidth={2} />
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition-colors sm:hidden"
              title="Yopish"
            >
              <FaXmark size={14} />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-3.5 mb-4 shrink-0">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[#F0F3F7] dark:bg-[#181C24] text-xs sm:text-sm text-slate-800 dark:text-white focus-within:ring-2 focus-within:ring-blue-500/30 transition-all">
            <HugeiconsIcon icon={Search01Icon} size={17} strokeWidth={2} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ishtirokchini qidirish"
              className="w-full bg-transparent placeholder:text-slate-400 outline-none text-xs sm:text-sm text-slate-900 dark:text-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <FaXmark size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Section Header: UCHRASHUVDA */}
        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-1 mb-3 shrink-0">
          <span>Uchrashuvda</span>
          {isLocalHost && hasUnmutedGuests && onMuteAll && (
            <button
              type="button"
              onClick={onMuteAll}
              title="Barcha ishtirokchilar mikrofonini o'chirish"
              className="text-[10px] font-bold text-red-500 hover:text-red-600 cursor-pointer lowercase"
            >
              Hammasini o'chirish
            </button>
          )}
        </div>

        {/* Participants List */}
        <div
          className="flex-1 overflow-y-auto space-y-3.5 pr-1 select-none"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#94A3B8 transparent' }}
        >
          {filteredParticipants.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Ishtirokchi topilmadi
            </div>
          ) : (
            filteredParticipants.map((p) => {
              const isMe = p.isLocal || String(p.identity) === String(currentUserId)
              const displayName = p.name ? `${p.name}${isMe ? ' (siz)' : ''}` : (isMe ? 'Siz' : 'Ishtirokchi')
              const roleText = p.isHost ? 'Tashkilotchi' : 'Ishtirokchi'
              const initials = p.name
                ? p.name.trim().split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                : 'U'

              return (
                <div
                  key={p.identity || p.sid}
                  className="flex items-center justify-between gap-3 group"
                >
                  {/* Left: Avatar + Name and Role */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full overflow-hidden shrink-0 ${getAvatarGradient(
                        p.name || ''
                      )} text-white font-bold flex items-center justify-center text-sm shadow-xs`}
                    >
                      {p.avatar ? (
                        <img
                          src={p.avatar}
                          alt={p.name || ''}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-normal truncate mt-0.5">
                        {roleText}
                      </p>
                    </div>
                  </div>

                  {/* Right: Controls & Status (Mic & Camera) */}
                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    {/* Microphone control / indicator */}
                    {isLocalHost && !isMe ? (
                      p.isMicEnabled ? (
                        <button
                          type="button"
                          onClick={() => onMuteParticipant && onMuteParticipant(p.identity)}
                          title={`${p.name || 'Ishtirokchi'} ovozini o'chirish`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/15 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors cursor-pointer active:scale-90"
                        >
                          <HugeiconsIcon icon={Mic01Icon} size={18} strokeWidth={2} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAskUnmuteParticipant && onAskUnmuteParticipant(p.identity)}
                          title={`${p.name || 'Ishtirokchi'}dan mikrofonni yoqishni so'rash`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-[#EA3323] transition-colors cursor-pointer active:scale-90"
                        >
                          <HugeiconsIcon icon={MicOff01Icon} size={18} strokeWidth={2} />
                        </button>
                      )
                    ) : (
                      <span
                        className={`w-7 h-7 flex items-center justify-center rounded-lg ${
                          p.isMicEnabled
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-[#EA3323]'
                        }`}
                        title={p.isMicEnabled ? 'Mikrofon yoniq' : "Mikrofon o'chiq"}
                      >
                        <HugeiconsIcon icon={p.isMicEnabled ? Mic01Icon : MicOff01Icon} size={18} strokeWidth={2} />
                      </span>
                    )}

                    {/* Camera control / indicator */}
                    {isLocalHost && !isMe ? (
                      p.isCameraEnabled ? (
                        <button
                          type="button"
                          onClick={() => onTurnOffCamera && onTurnOffCamera(p.identity)}
                          title={`${p.name || 'Ishtirokchi'} kamerasini o'chirish`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/15 text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors cursor-pointer active:scale-90"
                        >
                          <HugeiconsIcon icon={Video01Icon} size={18} strokeWidth={2} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onAskTurnOnCamera && onAskTurnOnCamera(p.identity)}
                          title={`${p.name || 'Ishtirokchi'}dan kamerani yoqishni so'rash`}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-[#EA3323] transition-colors cursor-pointer active:scale-90"
                        >
                          <HugeiconsIcon icon={VideoOffIcon} size={18} strokeWidth={2} />
                        </button>
                      )
                    ) : (
                      <span
                        className={`w-7 h-7 flex items-center justify-center rounded-lg ${
                          p.isCameraEnabled
                            ? 'text-slate-400 dark:text-slate-500'
                            : 'text-[#EA3323]'
                        }`}
                        title={p.isCameraEnabled ? 'Kamera yoniq' : "Kamera o'chiq"}
                      >
                        <HugeiconsIcon icon={p.isCameraEnabled ? Video01Icon : VideoOffIcon} size={18} strokeWidth={2} />
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
        </div>
      </div>
    </>
  )
}
