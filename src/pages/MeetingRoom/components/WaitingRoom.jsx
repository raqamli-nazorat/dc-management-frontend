import { ComputerVideoCallIcon, Copy01Icon, Mic01Icon, Video01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { useRef, useEffect, useState } from 'react'
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaArrowLeft,
  FaXmark,
  FaCheck,
  FaCircleXmark,
} from 'react-icons/fa6'
import { IoCopyOutline } from 'react-icons/io5'
import { formatAvatarUrl } from '../utils/meetingCode'

export default function WaitingRoom({
  title = "Yig'ilish",
  meetingDetails,
  meetingState,
  meetingId,
  isRejected = false,
  rejectedMessage = "Tashkilotchi yig'ilishga kirishingizni rad etdi.",
  waitingState = 'lobby', // 'lobby' | 'connecting' | 'waiting_organizer' | 'waiting_approval' | 'rejected'
  localStream = null,
  isCameraEnabled = false,
  onToggleCamera,
  isMicEnabled = false,
  onToggleMic,
  onJoinMeeting,
  isJoining = false,
  onCancelWait,
  onLeave,
  user,
}) {
  const videoRef = useRef(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [copied, setCopied] = useState(false)
  const [lobbyImgError, setLobbyImgError] = useState(false)

  // Attach or cleanly detach local camera stream from video element
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    const videoTrack = localStream?.getVideoTracks()?.[0]
    const hasLiveVideoTrack = Boolean(videoTrack && videoTrack.readyState === 'live')

    if (isCameraEnabled && hasLiveVideoTrack) {
      if (videoEl.srcObject !== localStream) {
        videoEl.srcObject = localStream
      }
      videoEl.play().catch(() => {})
    } else {
      try {
        videoEl.pause()
        videoEl.srcObject = null
      } catch (e) {}
    }
  }, [localStream, isCameraEnabled])

  // Cleanly detach video stream on unmount
  useEffect(() => {
    return () => {
      const videoEl = videoRef.current
      if (videoEl) {
        try {
          videoEl.pause()
          videoEl.srcObject = null
        } catch (e) {}
      }
    }
  }, [])

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
        audioContext.close().catch(() => { })
      }
    }
  }, [localStream, isMicEnabled])

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.username || 'Foydalanuvchi'

  const initials = displayName
    ? displayName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : 'U'

  const meetingUid = meetingDetails?.uid || meetingId || meetingState?.uid || ''

  const handleCopyUid = () => {
    if (!meetingUid) return
    navigator.clipboard?.writeText(meetingUid)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Determine status message when in waiting states
  let statusTitle = "Ruxsat kutilmoqda"
  let statusDesc = "So'rov tashkilotchiga yuborildi. U tasdiqlagach siz avtomatik qo'shilasiz."

  if (isRejected || waitingState === 'rejected') {
    statusTitle = "Kirish rad etildi"
    statusDesc = rejectedMessage
  } else if (waitingState === 'waiting_organizer' || (!meetingState?.organizer_joined && waitingState !== 'lobby')) {
    statusTitle = "Tashkilotchi kutilmoqda"
    statusDesc = "Tashkilotchi hali yig'ilishga kirmagan. U kirishi bilanoq tizim avtomatik ulaydi."
  } else if (waitingState === 'waiting_approval' || (meetingState?.requires_approval && !meetingState?.is_approved && waitingState !== 'lobby')) {
    statusTitle = "Ruxsat kutilmoqda"
    statusDesc = "So'rov tashkilotchiga yuborildi. U tasdiqlagach siz avtomatik qo'shilasiz."
  } else if (waitingState === 'connecting' || isJoining) {
    statusTitle = "Ulanmoqda..."
    statusDesc = "Yig'ilish xonasiga ulanish o'rnatilmoqda..."
  }

  const isWaitingPhase = waitingState !== 'lobby'

  // Hardware toggle helper to immediately stop tracks and sever video element
  const handleToggleCamera = () => {
    if (isCameraEnabled) {
      if (videoRef.current) {
        try {
          videoRef.current.pause()
          videoRef.current.srcObject = null
        } catch (e) {}
      }
      if (localStream) {
        localStream.getVideoTracks().forEach((track) => {
          try {
            track.stop()
            track.enabled = false
          } catch (e) {}
        })
      }
    }
    onToggleCamera?.()
  }

  const handleToggleMic = () => {
    if (isMicEnabled && localStream) {
      localStream.getAudioTracks().forEach((track) => {
        try {
          track.stop()
          track.enabled = false
        } catch (e) {}
      })
    }
    onToggleMic?.()
  }

  const hasLiveVideo = Boolean(
    isCameraEnabled &&
    localStream &&
    localStream.getVideoTracks().some(t => t.readyState === 'live')
  )

  return (
    <div className="fixed inset-0 w-full h-full bg-white dark:bg-[#11141A] text-slate-800 dark:text-white flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-y-auto select-none z-50">
      <div className="w-full flex flex-col md:flex-row items-center justify-center gap-10 lg:gap-16 my-auto">
        {/* Left Column: Camera Preview Box */}
        <div className="w-[740px] aspect-[16/10] bg-[#E8EDF2] dark:bg-[#181A24] rounded-[28px] overflow-hidden relative flex flex-col items-center justify-center shadow-xl shrink-0">
          {/* Always maintain video element in DOM so srcObject can be cleanly attached/detached without unmount leaks */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-200 ${
              hasLiveVideo ? 'block opacity-100' : 'hidden opacity-0 pointer-events-none'
            }`}
          />

          {!hasLiveVideo && (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 dark:from-slate-300 dark:to-slate-400 border border-white/10 dark:border-black/5 flex items-center justify-center text-white dark:text-slate-800 text-2xl font-bold overflow-hidden shadow-lg">
                {user?.avatar && !lobbyImgError ? (
                  <img
                    src={formatAvatarUrl(user.avatar)}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={() => setLobbyImgError(true)}
                  />
                ) : (
                  initials
                )}
              </div>
              <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-600 font-normal mt-1">
                Kamera o'chirilgan
              </p>
            </div>
          )}

          {/* Bottom Center Media Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3.5 z-20">
            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={handleToggleMic}
              title={isMicEnabled ? "Mikrofonni o'chirish" : "Mikrofonni yoqish"}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md active:scale-95 ${
                isMicEnabled
                  ? 'bg-white text-slate-800 dark:bg-black dark:text-white hover:bg-slate-100 dark:hover:bg-neutral-900'
                  : 'bg-[#E02D2D] text-white hover:bg-red-600'
              }`}
            >
              <HugeiconsIcon icon={Mic01Icon} strokeWidth={2.5} size={18} />
            </button>

            {/* Camera Toggle Button */}
            <button
              type="button"
              onClick={handleToggleCamera}
              title={isCameraEnabled ? "Kamerani o'chirish" : "Kamerani yoqish"}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-md active:scale-95 ${
                isCameraEnabled
                  ? 'bg-white text-slate-800 dark:bg-black dark:text-white hover:bg-slate-100 dark:hover:bg-neutral-900'
                  : 'bg-[#E02D2D] text-white hover:bg-red-600'
              }`}
            >
              <HugeiconsIcon icon={Video01Icon} strokeWidth={2.5} size={18} />
            </button>
          </div>
        </div>

        {/* Right Column: Information & Actions */}
        <div className="w-full max-w-[340px] flex flex-col items-start text-left">
          {!isWaitingPhase ? (
            /* 1. Lobby: "Ready to join" screen */
            <div className="w-full flex flex-col items-start">
              <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                Uchrashuvga qo'shilish
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 line-clamp-2">
                {meetingDetails?.title || meetingState?.title || title}
              </p>

              {/* Meeting UID badge with copy */}
              {meetingUid && (
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="mt-4 px-3 py-1.5 rounded-lg bg-[#F1F3F7] dark:bg-[#181C24] hover:bg-slate-200/80 dark:hover:bg-[#202530] text-slate-700 dark:text-slate-300 border border-transparent dark:border-white/5 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                  title="UID nusxalash"
                >
                  {copied ? (
                    <FaCheck size={12} className="text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <HugeiconsIcon icon={Copy01Icon} size={14} className="text-slate-400 dark:text-[#8E95B5]" />
                  )}
                  <span className="test-[13px] text-[#1A1D2E] dark:text-[#E6EDF3]">{meetingUid}</span>
                  {copied && <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-sans">Nusxalandi</span>}
                </button>
              )}

              {/* Join Button */}
              <button
                type="button"
                onClick={onJoinMeeting}
                disabled={isJoining}
                className="w-full mt-6 py-3 px-5 rounded-xl bg-[#3956B7] dark:bg-[#2A344A] hover:bg-[#314AA0] dark:hover:bg-[#34405C] active:scale-[0.99] disabled:opacity-60 text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {isJoining ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Ulanmoqda...</span>
                  </>
                ) : (
                  <>
                    {/* Badge / Video icon from design */}
                    <HugeiconsIcon icon={ComputerVideoCallIcon} size={18} strokeWidth={2.5} />
                    <span>Qo'shilish</span>
                  </>
                )}
              </button>

              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 leading-relaxed">
                Tashkilotchi ruxsat bergach uchrashuvga kirasiz.
              </p>
            </div>
          ) : (
            /* 2. Waiting Room State (Connecting / Waiting Approval / Rejected) */
            <div className="w-full flex flex-col items-start">
              {isRejected || waitingState === 'rejected' ? (
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 flex items-center justify-center mb-3">
                  <FaCircleXmark size={22} />
                </div>
              ) : null}

              <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                {statusTitle}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
                {statusDesc}
              </p>

              {/* Waiting Actions */}
              <div className="w-full mt-6 flex flex-col gap-2.5">
                {isRejected || waitingState === 'rejected' ? (
                  <button
                    type="button"
                    onClick={onLeave}
                    className="w-full py-3 px-5 rounded-xl border border-gray-200 dark:border-transparent hover:border-gray-300 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-neutral-900 text-slate-700 dark:text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
                  >
                    <FaArrowLeft size={12} />
                    <span>Orqaga qaytish</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onCancelWait || onLeave}
                    className="w-full py-3 px-5 rounded-xl border border-gray-200 dark:border-transparent! hover:border-gray-300 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-neutral-900 text-slate-700 dark:text-white dark:hover:border-transparent! font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
                  >
                    <FaXmark size={14} />
                    <span>Bekor qilish</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

