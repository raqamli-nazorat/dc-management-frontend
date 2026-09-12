import { useRef, useEffect } from 'react'
import { FaMicrophone, FaMicrophoneSlash, FaVideo, FaVideoSlash, FaArrowLeft } from 'react-icons/fa6'
import { TbClockHour4 } from 'react-icons/tb'

export default function WaitingRoom({
  title = "Yig'ilish",
  meetingState,
  isRejected = false,
  rejectedMessage = "Mezbon yig'ilishga kirishingizni rad etdi.",
  localStream = null,
  isCameraEnabled = true,
  onToggleCamera,
  isMicEnabled = true,
  onToggleMic,
  onLeave,
}) {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && localStream && isCameraEnabled) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream, isCameraEnabled])

  // Waiting reason
  let statusTitle = "Kutish zali"
  let statusDesc = "Yig'ilishga ulanish kutilmoqda..."

  if (isRejected) {
    statusTitle = "Kirish rad etildi"
    statusDesc = rejectedMessage
  } else if (!meetingState?.organizer_joined) {
    statusTitle = "Tashkilotchi kutilmoqda"
    statusDesc = "Tashkilotchi yig'ilishga kirmaguncha kuting. U kirishi bilanoq tizim avtomatik ulanadi."
  } else if (meetingState?.requires_approval && !meetingState?.is_approved) {
    statusTitle = "Tasdiqlash kutilmoqda"
    statusDesc = "Kirish so'rovingiz mezbonga yuborildi. Mezbon tasdiqlashini kuting..."
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-[#111317] text-white flex flex-col items-center justify-center p-4 overflow-y-auto overflow-x-hidden select-none z-50">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center my-auto">
        {/* Top Meeting Title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 mb-2">
            <TbClockHour4 size={14} className="text-blue-400" />
            <span>Onlayn Yig'ilish</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{title}</h1>
        </div>

        {/* Video Preview Card */}
        <div className="relative w-full aspect-video max-w-lg rounded-3xl overflow-hidden bg-[#1C1F26] border border-white/10 shadow-2xl flex items-center justify-center mb-8">
          {isCameraEnabled && localStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500 gap-2">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                <FaVideoSlash size={32} />
              </div>
              <p className="text-xs font-medium">Kamera o'chirilgan</p>
            </div>
          )}

          {/* Controls overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-lg">
            <button
              type="button"
              onClick={onToggleMic}
              title={isMicEnabled ? "Mikrofonni o'chirish" : "Mikrofonni yoqish"}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer
                ${isMicEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600'}`}
            >
              {isMicEnabled ? <FaMicrophone size={15} /> : <FaMicrophoneSlash size={15} />}
            </button>
            <button
              type="button"
              onClick={onToggleCamera}
              title={isCameraEnabled ? "Kamerani o'chirish" : "Kamerani yoqish"}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer
                ${isCameraEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white hover:bg-red-600'}`}
            >
              {isCameraEnabled ? <FaVideo size={15} /> : <FaVideoSlash size={15} />}
            </button>
          </div>
        </div>

        {/* Status card */}
        <div className="w-full max-w-lg p-6 rounded-3xl bg-[#181B22]/90 backdrop-blur-xl border border-white/10 shadow-xl flex flex-col items-center">
          {!isRejected ? (
            <div className="relative mb-4">
              <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin flex items-center justify-center" />
              <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mb-4">
              <FaVideoSlash size={22} />
            </div>
          )}

          <h3 className="text-lg font-bold text-white">{statusTitle}</h3>
          <p className="text-sm text-slate-300 mt-1 max-w-md leading-relaxed">{statusDesc}</p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onLeave}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-sm font-semibold cursor-pointer transition-colors"
            >
              <FaArrowLeft size={13} />
              <span>{isRejected ? "Orqaga qaytish" : "Chiqish"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
