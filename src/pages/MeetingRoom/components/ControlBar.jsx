import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
  FaUsers,
  FaComments,
  FaChevronUp,
  FaXmark,
} from 'react-icons/fa6'
import { MdScreenShare, MdStopScreenShare, MdSwapHoriz } from 'react-icons/md'
import { TbHandStop } from 'react-icons/tb'
import { RiShutDownLine } from 'react-icons/ri'

export default function ControlBar({
  isMicEnabled,
  onToggleMic,
  isCameraEnabled,
  onToggleCamera,
  isScreenSharing,
  onToggleScreenShare,
  onStopScreenShare,
  onChangeScreenShare,
  isHandRaised,
  onToggleHandRaise,
  isChatOpen,
  onToggleChat,
  unreadChatCount = 0,
  isParticipantsOpen,
  onToggleParticipants,
  participantCount = 1,
  knockCount = 0,
  onLeave,
  isHost = false,
  onEndMeetingForAll,
}) {
  const [showEndModal, setShowEndModal] = useState(false)
  const [showScreenShareMenu, setShowScreenShareMenu] = useState(false)
  const screenShareMenuRef = useRef(null)

  // Close screen share dropdown if screen sharing is stopped elsewhere (e.g. browser toolbar)
  useEffect(() => {
    if (!isScreenSharing) {
      setShowScreenShareMenu(false)
    }
  }, [isScreenSharing])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (screenShareMenuRef.current && !screenShareMenuRef.current.contains(e.target)) {
        setShowScreenShareMenu(false)
      }
    }
    if (showScreenShareMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showScreenShareMenu])

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showEndModal) {
        setShowEndModal(false)
      }
    }
    if (showEndModal) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showEndModal])

  const handleScreenShareClick = () => {
    if (isScreenSharing) {
      setShowScreenShareMenu(prev => !prev)
    } else {
      onToggleScreenShare?.()
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2.5 sm:gap-3.5 px-4 sm:px-6 py-2.5 rounded-full bg-[#202124]/95 backdrop-blur-xl border border-[#3c4043] shadow-2xl max-w-fit mx-auto select-none">
        {/* Left / Audio & Video */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Microphone */}
          <button
            type="button"
            onClick={onToggleMic}
            title={isMicEnabled ? "Mikrofonni o'chirish" : "Mikrofonni yoqish"}
            className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full cursor-pointer transition-all duration-200
              ${isMicEnabled
                ? 'bg-[#3c4043] text-white hover:bg-[#474a4e]'
                : 'bg-[#ea4335] text-white hover:bg-[#d93025] shadow-md shadow-red-500/30'
              }`}
          >
            {isMicEnabled ? <FaMicrophone size={17} /> : <FaMicrophoneSlash size={17} />}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={onToggleCamera}
            title={isCameraEnabled ? "Kamerani o'chirish" : "Kamerani yoqish"}
            className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full cursor-pointer transition-all duration-200
              ${isCameraEnabled
                ? 'bg-[#3c4043] text-white hover:bg-[#474a4e]'
                : 'bg-[#ea4335] text-white hover:bg-[#d93025] shadow-md shadow-red-500/30'
              }`}
          >
            {isCameraEnabled ? <FaVideo size={17} /> : <FaVideoSlash size={17} />}
          </button>
        </div>

        <div className="w-[1px] h-6 bg-[#3c4043] mx-0.5 hidden sm:block" />

        {/* Middle / Collaboration */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Screen share with dropdown */}
          <div className="relative" ref={screenShareMenuRef}>
            <button
              type="button"
              onClick={handleScreenShareClick}
              title={isScreenSharing ? "Ekran ulashish sozlamalari" : "Ekranni ulashish"}
              className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full cursor-pointer transition-all duration-200
                ${isScreenSharing
                  ? 'bg-[#8ab4f8] text-[#202124] hover:bg-[#aecbfa] ring-2 ring-blue-300 shadow-lg shadow-blue-400/30'
                  : 'bg-[#3c4043] text-white hover:bg-[#474a4e]'
                }`}
            >
              {isScreenSharing ? <MdStopScreenShare size={21} /> : <MdScreenShare size={21} />}
              {isScreenSharing && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#202124] border border-white/30 flex items-center justify-center text-[8px] text-white shadow-sm">
                  <FaChevronUp size={7} />
                </span>
              )}
            </button>

            {/* Dropdown Menu when Screen Sharing is active */}
            {isScreenSharing && showScreenShareMenu && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-72 p-1.5 rounded-2xl bg-[#202124] backdrop-blur-xl border border-[#3c4043] shadow-2xl shadow-black/80 flex flex-col gap-1 z-50">
                {/* Option 1: Stop screen sharing */}
                <button
                  type="button"
                  onClick={() => {
                    setShowScreenShareMenu(false)
                    if (onStopScreenShare) onStopScreenShare()
                    else onToggleScreenShare?.()
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-red-400 hover:text-white hover:bg-red-600/20 border border-transparent hover:border-red-500/30 cursor-pointer transition-all duration-150 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 group-hover:bg-red-500/30 flex items-center justify-center shrink-0 text-red-400 group-hover:text-red-300">
                    <MdStopScreenShare size={18} />
                  </div>
                  <span className="truncate">Ekranni ulashuvini to'xtatish</span>
                </button>

                {/* Option 2: Change screen sharing source */}
                <button
                  type="button"
                  onClick={() => {
                    setShowScreenShareMenu(false)
                    onChangeScreenShare?.()
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-xs font-semibold text-blue-400 hover:text-white hover:bg-blue-600/20 border border-transparent hover:border-blue-500/30 cursor-pointer transition-all duration-150 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/15 group-hover:bg-blue-500/30 flex items-center justify-center shrink-0 text-blue-400 group-hover:text-blue-300">
                    <MdSwapHoriz size={19} />
                  </div>
                  <span className="truncate">Ekran ulashuv qismini o'zgartirish</span>
                </button>
              </div>
            )}
          </div>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={onToggleHandRaise}
            title={isHandRaised ? "Qo'lni tushirish" : "Qo'l ko'tarish"}
            className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full cursor-pointer transition-all duration-200
              ${isHandRaised
                ? 'bg-[#fdd663] text-[#202124] hover:bg-[#fde293] shadow-lg shadow-amber-400/30 animate-bounce'
                : 'bg-[#3c4043] text-white hover:bg-[#474a4e]'
              }`}
          >
            <TbHandStop size={20} />
          </button>

          {/* Chat */}
          <button
            type="button"
            onClick={onToggleChat}
            title="Jonli Chat"
            className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full cursor-pointer transition-all duration-200
              ${isChatOpen
                ? 'bg-[#8ab4f8] text-[#202124]'
                : 'bg-[#3c4043] text-white hover:bg-[#474a4e]'
              }`}
          >
            <FaComments size={17} />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ea4335] text-white text-[10px] font-extrabold flex items-center justify-center animate-bounce shadow-md ring-2 ring-[#202124]">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </button>

          {/* Participants */}
          <button
            type="button"
            onClick={onToggleParticipants}
            title="Qatnashchilar"
            className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-full cursor-pointer transition-all duration-200
              ${isParticipantsOpen
                ? 'bg-[#8ab4f8] text-[#202124]'
                : 'bg-[#3c4043] text-white hover:bg-[#474a4e]'
              }`}
          >
            <FaUsers size={17} />
            <span className="ml-1 text-xs font-semibold">{participantCount}</span>
            {knockCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-bounce shadow-md ring-2 ring-[#202124]">
                {knockCount}
              </span>
            )}
          </button>
        </div>

        <div className="w-[1px] h-6 bg-[#3c4043] mx-0.5 hidden sm:block" />

        {/* Right / Leave & Host Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Host end meeting for all */}
          {isHost && (
            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              title="Yig'ilishni hamma uchun yakunlash"
              className="flex items-center gap-1.5 px-3.5 h-11 sm:h-12 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 hover:bg-red-900 text-xs font-bold cursor-pointer transition-all duration-200 shadow-md"
            >
              <RiShutDownLine size={16} />
              <span className="hidden md:inline">Tugatish</span>
            </button>
          )}

          {/* Leave meeting - Google Meet iconic red pill */}
          <button
            type="button"
            onClick={onLeave}
            title="Chiqish"
            className="flex items-center justify-center h-11 sm:h-12 px-5 sm:px-6 rounded-full bg-[#ea4335] text-white hover:bg-[#d93025] font-semibold text-xs sm:text-sm shadow-md shadow-red-500/25 cursor-pointer transition-all duration-200 gap-2"
          >
            <FaPhoneSlash size={16} />
            <span className="hidden sm:inline">Chiqish</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Ending Meeting for All - Portaled to document.body */}
      {showEndModal && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEndModal(false)
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl bg-[#1A1D24] border border-red-500/30 text-white shadow-2xl shadow-red-950/50 animate-in zoom-in-95 duration-200 overflow-hidden"
          >
            {/* Ambient Red Glow */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-56 h-28 bg-red-600/20 rounded-full blur-2xl pointer-events-none" />

            {/* Top Row: Icon & Close button */}
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/20">
                <RiShutDownLine size={24} />
              </div>
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors"
                title="Yopish"
              >
                <FaXmark size={14} />
              </button>
            </div>

            {/* Title & Warning Text */}
            <div className="relative z-10">
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Yig'ilishni yakunlash
              </h3>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Haqiqatan ham ushbu yig'ilishni barcha ishtirokchilar uchun to'xtatmoqchimisiz?
              </p>
              <div className="mt-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/25 text-xs text-red-300 flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-ping" />
                <span className="leading-snug">Xona barcha qatnashchilar uchun yopiladi va hamma foydalanuvchilar chiqariladi.</span>
              </div>
            </div>

            {/* Actions Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3 relative z-10">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#282C35] hover:bg-[#343A46] text-slate-200 cursor-pointer transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEndModal(false)
                  onEndMeetingForAll?.()
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white cursor-pointer shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-95"
              >
                <RiShutDownLine size={16} />
                <span>Ha, yakunlash</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
