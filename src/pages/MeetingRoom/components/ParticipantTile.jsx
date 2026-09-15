import { useEffect, useRef } from 'react'
import {
  MicOff01Icon,
  HandIcon,
  PinIcon,
  CrownIcon,
  Minimize01Icon,
  ScreenShareIcon,
  ArrowExpandDiagonal01Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

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
  isFullScreenFocus = false,
  onToggleFullScreenFocus = null,
}) {
  const videoRef = useRef(null)

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

  const initials = displayName
    ? displayName.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : 'U'

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
    <div
      onDoubleClick={() => {
        if (isScreenShare && onToggleFullScreenFocus) {
          onToggleFullScreenFocus()
        } else {
          onTogglePin?.()
        }
      }}
      className={`relative w-full h-full ${
        isFullScreenFocus
          ? 'rounded-none bg-black border-0'
          : 'rounded-2xl sm:rounded-3xl shadow-md'
      } overflow-hidden ${
        isScreenShare
          ? isFullScreenFocus
            ? 'bg-black border-0'
            : 'bg-[#121212] border border-slate-700/60 dark:border-white/10 shadow-2xl'
          : `bg-[#DEE5ED] dark:bg-[#1D2230] ${
              hasHandRaised
                ? 'border-2 border-[#5B7BF0] shadow-[0_0_25px_rgba(91,123,240,0.35)]'
                : isSpeaking
                ? 'border-2 border-[#5B7BF0] shadow-[0_0_25px_rgba(91,123,240,0.35)]'
                : isPinned
                ? 'border-2 border-[#5B7BF0] shadow-[0_0_20px_rgba(91,123,240,0.25)]'
                : 'border border-black/5 dark:border-white/5'
            }`
      } transition-all duration-300 ease-out flex items-center justify-center select-none group`}
    >
      {/* Video element */}
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
        /* Circular Avatar View */
        <div className="flex items-center justify-center w-full h-full p-4 relative">
          {/* Active Speaking Halo Glow */}
          {isSpeaking && (
            <div className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-blue-500/25 dark:bg-blue-500/35 blur-2xl pointer-events-none -z-0 animate-pulse" />
          )}

          <div
            className={`relative flex items-center justify-center rounded-full transition-all duration-300 shadow-xl select-none z-10
              ${isSpeaking ? 'ring-4 ring-[#5B7BF0]/60 scale-105' : 'ring-2 ring-white/20'}
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
          </div>
        </div>
      )}

      {/* Top right badges: Hand Raised / Live Screen / Pin Button */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 z-20">
        {hasHandRaised && (
          <div
            className="w-8 h-8 rounded-full bg-[#3B59BA] dark:bg-[#344879] text-white flex items-center justify-center shadow-md animate-in fade-in zoom-in-90 duration-200"
            title="Qo'l ko'tardi"
          >
            <HugeiconsIcon icon={HandIcon} size={16} strokeWidth={2} />
          </div>
        )}
        {isScreenShare && !hasHandRaised && (
          <div className="flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-blue-600/90 text-white backdrop-blur-md shadow-lg text-xs font-semibold border border-blue-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline">Jonli Taqdimot</span>
          </div>
        )}

        {/* Pin / Unpin Button */}
        {onTogglePin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin()
            }}
            title={isPinned ? "Qadashni bekor qilish" : "Asosiy oynaga qadash"}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 cursor-pointer shadow-md active:scale-90
              ${isPinned
                ? 'bg-[#5B7BF0] text-white shadow-md shadow-blue-500/30 scale-105'
                : 'bg-black/40 hover:bg-black/70 text-white/80 hover:text-white border border-white/10 opacity-70 group-hover:opacity-100 hover:scale-105'
              }`}
          >
            <HugeiconsIcon icon={PinIcon} size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      {/* Top left badge: Host / Mezbon */}
      {isHost && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[#FDD663] text-xs font-semibold shadow-md z-10 border border-white/10">
          <HugeiconsIcon icon={CrownIcon} size={13} strokeWidth={2.2} />
          <span>Tashkilotchi</span>
        </div>
      )}

      {/* Bottom Left Pill: Signature Name Tag + Speaking Voice Wave or Muted Mic */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#202530]/85 dark:bg-black/65 backdrop-blur-md text-white text-xs sm:text-sm font-medium max-w-[85%] shadow-lg border border-white/10 pointer-events-none z-10">
        {isPinned && (
          <span className="text-blue-400 shrink-0" title="Qadalgan">
            <HugeiconsIcon icon={PinIcon} size={12} strokeWidth={2.2} />
          </span>
        )}
        {isScreenShare ? (
          <span className="text-blue-400 font-bold flex items-center gap-1.5 truncate">
            <HugeiconsIcon icon={ScreenShareIcon} size={14} strokeWidth={2} className="shrink-0" />
            <span className="truncate">{displayName || 'Ekran'}</span>
          </span>
        ) : (
          <span className="truncate">
            {displayName} {isLocal && '(siz)'}
          </span>
        )}

        {!isScreenShare && (
          <div className="flex items-center shrink-0 ml-0.5">
            {isMicEnabled ? (
              isSpeaking ? (
                /* Animated voice wave bars when speaking */
                <span className="flex items-center gap-0.5 ml-1 h-4.5" title="Gapirmoqda">
                  <span className="w-1 bg-blue-400 rounded-full animate-voice-wave-1 min-h-[4px]" />
                  <span className="w-1 bg-blue-400 rounded-full animate-voice-wave-2 min-h-[4px]" />
                  <span className="w-1 bg-blue-400 rounded-full animate-voice-wave-3 min-h-[4px]" />
                </span>
              ) : null
            ) : (
              /* Red mic icon when muted */
              <span className="text-[#EA3323] ml-1 flex items-center" title="Mikrofon o'chiq">
                <HugeiconsIcon icon={MicOff01Icon} size={14} strokeWidth={2.2} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Right: Full Screen Focus Mode toggle for Screen Share (matching screenshot) */}
      {isScreenShare && onToggleFullScreenFocus && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onToggleFullScreenFocus()
          }}
          title={isFullScreenFocus ? "Kichiklashtirish" : "To'liq ekran"}
          className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#181a20]/80 hover:bg-[#181a20] text-white border border-white/15 backdrop-blur-md flex items-center justify-center cursor-pointer shadow-lg transition-all duration-200 active:scale-90 hover:scale-105 z-20"
        >
          <HugeiconsIcon
            icon={isFullScreenFocus ? Minimize01Icon : ArrowExpandDiagonal01Icon}
            size={18}
            strokeWidth={2.2}
          />
        </button>
      )}
    </div>
  )
}
