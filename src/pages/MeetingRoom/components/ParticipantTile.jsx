import { useEffect, useRef } from 'react'
import { FaMicrophone, FaMicrophoneSlash, FaCrown } from 'react-icons/fa6'
import { TbHandStop, TbPin, TbPinFilled, TbScreenShare } from 'react-icons/tb'

export default function ParticipantTile({
  participant,
  isLocal = false,
  isScreenShare = false,
  isSpeaking = false,
  hasHandRaised = false,
  isHost = false,
  videoTrack = null,
  audioTrack = null,
  isCameraEnabled = false,
  isMicEnabled = false,
  displayName = '',
  avatar = '',
  version = 0,
  isPinned = false,
  onTogglePin = null,
}) {
  const videoRef = useRef(null)
  const audioRef = useRef(null)

  // Attach video track to <video> element
  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    if (videoTrack && (isCameraEnabled || isScreenShare)) {
      videoTrack.attach(el)
      el.play?.().catch(() => {})
      return () => {
        try {
          videoTrack.detach(el)
        } catch (e) {
          // ignore cleanup errors
        }
        if (el) {
          el.srcObject = null
        }
      }
    } else {
      if (el) {
        el.srcObject = null
      }
    }
  }, [videoTrack, isCameraEnabled, isScreenShare, version])

  // Attach audio track for remote participants
  useEffect(() => {
    const el = audioRef.current
    if (!el || isLocal || isScreenShare) return

    if (audioTrack && isMicEnabled) {
      audioTrack.attach(el)
      el.play?.().catch(() => {})
      return () => {
        try {
          audioTrack.detach(el)
        } catch (e) {}
        if (el) {
          el.srcObject = null
        }
      }
    } else {
      if (el) {
        try {
          audioTrack?.detach(el)
        } catch (e) {}
        el.srcObject = null
      }
    }
  }, [audioTrack, isLocal, isScreenShare, isMicEnabled])

  const initials = displayName
    ? displayName.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : 'U'

  // Google Meet signature material avatar colors
  const getAvatarGradient = (name = '') => {
    const gradients = [
      'bg-[#1a73e8]', // Google Blue
      'bg-[#1e8e3e]', // Google Green
      'bg-[#9334e6]', // Google Purple
      'bg-[#007b83]', // Google Teal
      'bg-[#e37400]', // Google Orange
      'bg-[#d93025]', // Google Red
      'bg-[#d01884]', // Google Magenta
      'bg-[#3949ab]', // Google Indigo
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return gradients[Math.abs(hash) % gradients.length]
  }

  return (
    <div
      onDoubleClick={() => onTogglePin?.()}
      className={`relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#3c4043] transition-all duration-300 ease-out flex items-center justify-center select-none shadow-lg group
        ${hasHandRaised
          ? 'ring-[3px] ring-[#fdd663] shadow-[0_0_25px_rgba(253,214,99,0.35)]'
          : isSpeaking
          ? 'ring-[3px] ring-[#8ab4f8] shadow-[0_0_25px_rgba(138,180,248,0.35)]'
          : isPinned
          ? 'ring-2 ring-[#8ab4f8] shadow-[0_0_20px_rgba(138,180,248,0.3)]'
          : isScreenShare
          ? 'bg-[#121212] border border-white/10'
          : 'border border-white/5'
        }`}
    >
      {/* Remote audio player (hidden) */}
      {!isLocal && !isScreenShare && <audio ref={audioRef} autoPlay playsInline />}

      {/* Video element (always muted to prevent acoustic echo & conflict with audio element) */}
      {(isCameraEnabled || isScreenShare) && videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full ${
            isScreenShare
              ? 'object-contain bg-[#121212]'
              : isLocal
              ? 'object-cover scale-x-[-1]'
              : 'object-cover'
          }`}
        />
      ) : (
        /* Google Meet Avatar fallback */
        <div className="flex items-center justify-center w-full h-full p-4">
          <div
            className={`relative flex items-center justify-center rounded-full transition-all duration-300 shadow-xl select-none
              ${isSpeaking ? 'ring-4 ring-[#8ab4f8]/50 ring-offset-4 ring-offset-[#3c4043] scale-105' : ''}
              w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 ${getAvatarGradient(displayName)} text-white`}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider">{initials}</span>
            )}

            {/* Speaking animated ripple */}
            {isSpeaking && (
              <span className="absolute -inset-2 rounded-full border-2 border-[#8ab4f8] animate-ping opacity-60 pointer-events-none" />
            )}
          </div>
        </div>
      )}

      {/* Top right badges: Hand Raised / Live Screen / Pin Button */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 z-20">
        {hasHandRaised && (
          <div className="flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#fdd663] text-[#202124] shadow-lg animate-bounce text-xs font-bold">
            <TbHandStop size={15} />
            <span className="hidden sm:inline">Qo'l ko'tardi</span>
          </div>
        )}
        {isScreenShare && !hasHandRaised && (
          <div className="flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-600/90 text-white backdrop-blur-md shadow-lg text-xs font-semibold border border-blue-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Jonli Taqdimot</span>
          </div>
        )}

        {/* Pin / Unpin Button (Client-side toggle) */}
        {onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin()
            }}
            title={isPinned ? "Qadashni bekor qilish (Unpin)" : "Asosiy oynaga qadash (Pin)"}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 cursor-pointer shadow-md active:scale-90
              ${isPinned
                ? 'bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa] ring-2 ring-blue-300 shadow-blue-400/40 scale-105'
                : 'bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/15 opacity-80 group-hover:opacity-100 hover:scale-105'
              }`}
          >
            {isPinned ? <TbPinFilled size={15} /> : <TbPin size={15} />}
          </button>
        )}
      </div>

      {/* Top left badge: Host / Mezbon */}
      {isHost && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#fdd663] text-xs font-semibold shadow-md z-10 border border-white/10">
          <FaCrown size={12} className="text-yellow-300" />
          <span>Tashkilotchi</span>
        </div>
      )}

      {/* Bottom Left Pill: Google Meet Signature Name Tag + Mic Indicator + Pin Indicator */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-[#202124]/85 backdrop-blur-md text-white text-xs sm:text-sm font-medium max-w-[85%] shadow-lg border border-white/10 pointer-events-none z-10">
        {isPinned && (
          <span className="text-[#8ab4f8] shrink-0" title="Asosiy ekranga qadalgan">
            <TbPinFilled size={12} />
          </span>
        )}
        {isScreenShare ? (
          <span className="text-blue-400 font-bold flex items-center gap-1.5 truncate">
            <TbScreenShare size={14} className="shrink-0" />
            <span className="truncate">{displayName || 'Ekran'}</span>
          </span>
        ) : (
          <span className="truncate">{displayName} {isLocal && '(Siz)'}</span>
        )}

        {!isScreenShare && (
          <div className="flex items-center shrink-0 ml-0.5">
            {isMicEnabled ? (
              isSpeaking ? (
                /* Animated voice wave bars when speaking */
                <span className="flex items-center gap-0.5 ml-0.5" title="Gapirmoqda">
                  <span className="w-1 h-3 bg-[#8ab4f8] rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-[#8ab4f8] rounded-full animate-pulse delay-75" />
                  <span className="w-1 h-2.5 bg-[#8ab4f8] rounded-full animate-pulse delay-150" />
                </span>
              ) : (
                <span className="text-white/70 ml-0.5" title="Mikrofon yoniq">
                  <FaMicrophone size={11} />
                </span>
              )
            ) : (
              <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#ea4335] text-white flex items-center justify-center text-[8px] sm:text-[9px] shadow-sm ml-0.5" title="Mikrofon o'chiq">
                <FaMicrophoneSlash size={9} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
