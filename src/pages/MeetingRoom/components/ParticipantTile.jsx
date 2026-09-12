import { useEffect, useRef } from 'react'
import { FaMicrophone, FaMicrophoneSlash, FaCrown } from 'react-icons/fa6'
import { TbHandStop } from 'react-icons/tb'

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
      }
    }
  }, [videoTrack, isCameraEnabled, isScreenShare])

  // Attach audio track for remote participants
  useEffect(() => {
    const el = audioRef.current
    if (!el || isLocal || isScreenShare) return

    if (audioTrack) {
      audioTrack.attach(el)
      el.play?.().catch(() => {})
      return () => {
        try {
          audioTrack.detach(el)
        } catch (e) {
          // ignore cleanup errors
        }
      }
    }
  }, [audioTrack, isLocal, isScreenShare])

  const initials = displayName
    ? displayName.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : 'U'

  return (
    <div
      className={`relative w-full h-full min-h-[160px] rounded-2xl overflow-hidden bg-[#1E2024] border transition-all duration-300 flex items-center justify-center select-none shadow-lg
        ${isScreenShare
          ? 'border-blue-500/80 ring-2 ring-blue-500/40 shadow-[0_0_25px_rgba(59,130,246,0.3)] bg-black'
          : isSpeaking
          ? 'border-emerald-500 ring-2 ring-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
          : 'border-[#2D3139] hover:border-[#3E434E]'
        }`}
    >
      {/* Remote audio player (hidden) */}
      {!isLocal && !isScreenShare && <audio ref={audioRef} autoPlay playsInline />}

      {/* Video element */}
      {(isCameraEnabled || isScreenShare) && videoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full ${
            isScreenShare
              ? 'object-contain bg-black'
              : isLocal
              ? 'object-cover scale-x-[-1]'
              : 'object-cover'
          }`}
        />
      ) : (
        /* Avatar fallback when camera is off */
        <div className="flex flex-col items-center justify-center gap-3 p-4">
          <div
            className={`relative flex items-center justify-center rounded-full transition-all duration-300 shadow-xl
              ${isSpeaking ? 'ring-4 ring-emerald-400 ring-offset-4 ring-offset-[#1E2024] scale-105' : ''}
              w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] text-white`}
          >
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            ) : (
              <span className="text-2xl sm:text-3xl font-extrabold tracking-wider">{initials}</span>
            )}

            {/* Speaking audio wave pulse */}
            {isSpeaking && (
              <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none" />
            )}
          </div>
          <p className="text-sm font-semibold text-slate-300 max-w-[180px] truncate text-center">
            {displayName} {isLocal && <span className="text-xs text-slate-400">(Siz)</span>}
          </p>
        </div>
      )}

      {/* Top right badges: Hand Raised */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        {hasHandRaised && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/90 text-white backdrop-blur-md shadow-lg animate-bounce text-xs font-bold">
            <TbHandStop size={15} />
            <span>Qo'l ko'tardi</span>
          </div>
        )}
      </div>

      {/* Top left badge: Host / Mezbon */}
      {isHost && (
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white backdrop-blur-md text-[11px] font-extrabold shadow-lg z-20 border border-amber-300/40">
          <FaCrown size={12} className="text-yellow-200 drop-shadow-sm" />
          <span>Mezbon</span>
        </div>
      )}

      {/* Bottom overlay: Name & Mic Status */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/65 backdrop-blur-md text-white text-xs font-medium max-w-[80%] shadow-md border border-white/10">
          {isScreenShare && <span className="text-blue-400 font-bold">🖥️ Ekran</span>}
          <span className="truncate">{displayName} {isLocal && '(Siz)'}</span>
        </div>

        {!isScreenShare && (
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-xl backdrop-blur-md border shadow-md transition-colors
              ${isMicEnabled
                ? 'bg-black/65 border-white/10 text-emerald-400'
                : 'bg-red-500/85 border-red-400/30 text-white'
              }`}
          >
            {isMicEnabled ? <FaMicrophone size={13} /> : <FaMicrophoneSlash size={13} />}
          </div>
        )}
      </div>
    </div>
  )
}
