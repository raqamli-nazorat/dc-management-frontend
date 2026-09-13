import { useRef, useEffect, useState } from 'react'
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaArrowLeft,
  FaCheck,
  FaCircleXmark,
} from 'react-icons/fa6'
import { TbClockHour4, TbVideo } from 'react-icons/tb'

export default function WaitingRoom({
  title = "Yig'ilish",
  meetingDetails,
  meetingState,
  isRejected = false,
  rejectedMessage = "Tashkilotchi yig'ilishga kirishingizni rad etdi.",
  waitingState = 'lobby', // 'lobby' | 'connecting' | 'waiting_organizer' | 'waiting_approval' | 'rejected'
  localStream = null,
  isCameraEnabled = true,
  onToggleCamera,
  isMicEnabled = true,
  onToggleMic,
  onJoinMeeting,
  isJoining = false,
  onCancelWait,
  onLeave,
  user,
}) {
  const videoRef = useRef(null)
  const [audioLevel, setAudioLevel] = useState(0)

  // Attach local camera stream to video element
  useEffect(() => {
    if (videoRef.current && localStream && isCameraEnabled && localStream.getVideoTracks().length > 0) {
      videoRef.current.srcObject = localStream
    } else if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [localStream, isCameraEnabled])

  // Simple mic activity detection for preview visualizer
  useEffect(() => {
    if (!localStream || !isMicEnabled) {
      setAudioLevel(0)
      return
    }

    let audioContext = null
    let analyser = null
    let source = null
    let animId = null

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        audioContext = new AudioCtx()
        const audioTracks = localStream.getAudioTracks()
        if (audioTracks.length > 0) {
          source = audioContext.createMediaStreamSource(localStream)
          analyser = audioContext.createAnalyser()
          analyser.fftSize = 64
          source.connect(analyser)

          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          const checkVolume = () => {
            if (!analyser) return
            analyser.getByteFrequencyData(dataArray)
            let sum = 0
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i]
            }
            const avg = sum / dataArray.length
            setAudioLevel(Math.min(100, Math.round(avg * 1.5)))
            animId = requestAnimationFrame(checkVolume)
          }
          checkVolume()
        }
      }
    } catch {
      // AudioContext fallback
    }

    return () => {
      if (animId) cancelAnimationFrame(animId)
      if (source) source.disconnect()
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(() => {})
      }
    }
  }, [localStream, isMicEnabled])

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username || 'Foydalanuvchi'

  const initials = displayName
    ? displayName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : 'U'

  // Determine status message when in waiting states
  let statusTitle = "Kutish zali"
  let statusDesc = "Yig'ilishga ulanish kutilmoqda..."

  if (isRejected || waitingState === 'rejected') {
    statusTitle = "Kirish rad etildi"
    statusDesc = rejectedMessage
  } else if (waitingState === 'waiting_organizer' || (!meetingState?.organizer_joined && waitingState !== 'lobby')) {
    statusTitle = "Tashkilotchi kutilmoqda"
    statusDesc = "Tashkilotchi hali yig'ilishga kirmagan. U kirishi bilanoq tizim avtomatik ulaydi."
  } else if (waitingState === 'waiting_approval' || (meetingState?.requires_approval && !meetingState?.is_approved && waitingState !== 'lobby')) {
    statusTitle = "Tasdiqlash kutilmoqda"
    statusDesc = "Kirish so'rovingiz tashkilotchiga yuborildi. Tashkilotchi qabul qilishini kuting..."
  } else if (waitingState === 'connecting' || isJoining) {
    statusTitle = "Ulanmoqda..."
    statusDesc = "Yig'ilish xonasiga ulanish o'rnatilmoqda..."
  }

  const isWaitingPhase = waitingState !== 'lobby'

  return (
    <div className="fixed inset-0 w-full h-full bg-[#111317] text-white flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto select-none z-50">
      {/* Google Meet inspired dark ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center my-auto">
        {/* Top Meeting Title Badge */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 mb-2.5 shadow-sm">
            <TbClockHour4 size={15} className="text-blue-400" />
            <span>Onlayn Yig'ilish</span>
            {meetingDetails?.uid && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span className="font-mono text-slate-400">{meetingDetails.uid}</span>
              </>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            {meetingDetails?.title || meetingState?.title || title}
          </h1>
        </div>

        {/* Main Grid: Left is Video Preview, Right is Action / Status Panel */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Camera Preview Box */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="relative w-full h-[380px]! aspect-video rounded-3xl overflow-hidden bg-[#1C1F26] border border-white/10 shadow-2xl flex items-center justify-center ring-1 ring-white/5 group">
              {isCameraEnabled && localStream && localStream.getVideoTracks().length > 0 ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-xl">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={displayName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-400">Kamera o'chirilgan</p>
                </div>
              )}

              {/* Audio activity visualizer pill (top left) */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs">
                {isMicEnabled ? (
                  <>
                    <div className="flex items-center gap-0.5 h-3">
                      <span
                        className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, audioLevel * 0.25)}px` }}
                      />
                      <span
                        className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, audioLevel * 0.4)}px` }}
                      />
                      <span
                        className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, audioLevel * 0.2)}px` }}
                      />
                    </div>
                    <span className="text-emerald-400 font-medium text-[11px]">Mikrofon tayyor</span>
                  </>
                ) : (
                  <span className="text-red-400 font-medium text-[11px] flex items-center gap-1.5">
                    <FaMicrophoneSlash size={11} /> Mikrofon o'chiq
                  </span>
                )}
              </div>

              {/* Video Controls Overlay (Bottom Center) */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3.5 px-5 py-2.5 rounded-2xl bg-[#202124]/85 backdrop-blur-xl border border-white/15 shadow-2xl">
                <button
                  type="button"
                  onClick={onToggleMic}
                  title={isMicEnabled ? "Mikrofonni o'chirish" : "Mikrofonni yoqish"}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md active:scale-95
                    ${isMicEnabled
                      ? 'bg-white/15 hover:bg-white/25 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                    }`}
                >
                  {isMicEnabled ? <FaMicrophone size={16} /> : <FaMicrophoneSlash size={16} />}
                </button>

                <button
                  type="button"
                  onClick={onToggleCamera}
                  title={isCameraEnabled ? "Kamerani o'chirish" : "Kamerani yoqish"}
                  className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md active:scale-95
                    ${isCameraEnabled
                      ? 'bg-white/15 hover:bg-white/25 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
                    }`}
                >
                  {isCameraEnabled ? <FaVideo size={16} /> : <FaVideoSlash size={16} />}
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-3 text-center">
              Kirishdan oldin mikrofon va kamerangizni sozlab oling
            </p>
          </div>

          {/* Right Column: Google Meet Style Action / Waiting Card */}
          <div className="col-span-5 flex flex-col justify-center">
            <div className="w-full p-6 sm:p-8 rounded-3xl bg-[#1C1F26]/90 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col">
              {!isWaitingPhase ? (
                /* 1. Lobby: "Ready to join" screen */
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Qo'shilishga tayyormisiz?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Kamerangiz va mikrofoningiz sozlanganidan so'ng yig'ilishga kiring
                    </p>
                  </div>

                  {/* Logged in User Pill */}
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                      {user?.avatar ? (
                        <img src={user.avatar} alt={displayName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-bold text-white truncate">{displayName}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {user?.position || user?.roles?.[0] || 'Qatnashuvchi'} sifatida
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onJoinMeeting}
                      disabled={isJoining}
                      className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-base shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 cursor-pointer"
                    >
                      {isJoining ? (
                        <>
                          <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          <span>Ulanmoqda...</span>
                        </>
                      ) : (
                        <>
                          <TbVideo size={20} />
                          <span>Yig'ilishga kirish</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={onLeave}
                      className="w-full py-3.5 px-6 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/5"
                    >
                      <FaArrowLeft size={13} />
                      <span>Orqaga qaytish</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* 2. Waiting Room State (Connecting / Waiting Approval / Rejected) */
                <div className="flex flex-col items-center text-center py-2">
                  {!isRejected && waitingState !== 'rejected' ? (
                    <div className="relative mb-5">
                      <div className="w-14 h-14 rounded-full border-3 border-blue-500/20 border-t-blue-500 animate-spin flex items-center justify-center" />
                      <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-5">
                      <FaCircleXmark size={28} />
                    </div>
                  )}

                  <h3 className="text-xl font-extrabold text-white">{statusTitle}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-sm leading-relaxed">
                    {statusDesc}
                  </p>

                  <div className="mt-8 w-full flex flex-col gap-2.5">
                    {/* If waiting for approval or organizer, user can cancel back to lobby */}
                    {(waitingState === 'waiting_approval' || waitingState === 'waiting_organizer') && onCancelWait && (
                      <button
                        type="button"
                        onClick={onCancelWait}
                        className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-colors cursor-pointer"
                      >
                        Kutishni bekor qilish
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={onLeave}
                      className="w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      {isRejected || waitingState === 'rejected' ? "Orqaga qaytish" : "Chiqish"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
