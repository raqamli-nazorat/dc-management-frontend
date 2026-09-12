import { useState } from 'react'
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
  FaUsers,
  FaComments,
} from 'react-icons/fa6'
import { MdScreenShare, MdStopScreenShare } from 'react-icons/md'
import { TbHandStop } from 'react-icons/tb'
import { RiShutDownLine } from 'react-icons/ri'

export default function ControlBar({
  isMicEnabled,
  onToggleMic,
  isCameraEnabled,
  onToggleCamera,
  isScreenSharing,
  onToggleScreenShare,
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

  return (
    <>
      <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3 rounded-2xl bg-[#181A1E]/90 backdrop-blur-xl border border-white/10 shadow-2xl max-w-fit mx-auto select-none">
        {/* Left / Audio & Video */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Microphone */}
          <button
            type="button"
            onClick={onToggleMic}
            title={isMicEnabled ? "Mikrofonni o'chirish" : "Mikrofonni yoqish"}
            className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl cursor-pointer transition-all duration-200
              ${isMicEnabled
                ? 'bg-[#2A2E37] text-white hover:bg-[#383E4B]'
                : 'bg-red-500/90 text-white hover:bg-red-600 shadow-md shadow-red-500/30'
              }`}
          >
            {isMicEnabled ? <FaMicrophone size={18} /> : <FaMicrophoneSlash size={18} />}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={onToggleCamera}
            title={isCameraEnabled ? "Kamerani o'chirish" : "Kamerani yoqish"}
            className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl cursor-pointer transition-all duration-200
              ${isCameraEnabled
                ? 'bg-[#2A2E37] text-white hover:bg-[#383E4B]'
                : 'bg-red-500/90 text-white hover:bg-red-600 shadow-md shadow-red-500/30'
              }`}
          >
            {isCameraEnabled ? <FaVideo size={17} /> : <FaVideoSlash size={17} />}
          </button>
        </div>

        <div className="w-[1px] h-6 bg-white/15 mx-1 hidden sm:block" />

        {/* Middle / Collaboration */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Screen share */}
          <button
            type="button"
            onClick={onToggleScreenShare}
            title={isScreenSharing ? "Ekran ulashishni to'xtatish" : "Ekranni ulashish"}
            className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl cursor-pointer transition-all duration-200
              ${isScreenSharing
                ? 'bg-blue-600 text-white hover:bg-blue-700 ring-2 ring-blue-400/50 shadow-md shadow-blue-500/30'
                : 'bg-[#2A2E37] text-white hover:bg-[#383E4B]'
              }`}
          >
            {isScreenSharing ? <MdStopScreenShare size={21} /> : <MdScreenShare size={21} />}
          </button>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={onToggleHandRaise}
            title={isHandRaised ? "Qo'lni tushirish" : "Qo'l ko'tarish"}
            className={`flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl cursor-pointer transition-all duration-200
              ${isHandRaised
                ? 'bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-400/50 shadow-md shadow-amber-500/30'
                : 'bg-[#2A2E37] text-white hover:bg-[#383E4B]'
              }`}
          >
            <TbHandStop size={21} />
          </button>

          {/* Chat */}
          <button
            type="button"
            onClick={onToggleChat}
            title="Jonli Chat"
            className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl cursor-pointer transition-all duration-200
              ${isChatOpen
                ? 'bg-indigo-600 text-white'
                : 'bg-[#2A2E37] text-white hover:bg-[#383E4B]'
              }`}
          >
            <FaComments size={17} />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </button>

          {/* Participants */}
          <button
            type="button"
            onClick={onToggleParticipants}
            title="Qatnashchilar"
            className={`relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl cursor-pointer transition-all duration-200
              ${isParticipantsOpen
                ? 'bg-indigo-600 text-white'
                : 'bg-[#2A2E37] text-white hover:bg-[#383E4B]'
              }`}
          >
            <FaUsers size={17} />
            <span className="ml-1.5 text-xs font-semibold">{participantCount}</span>
            {knockCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-bounce">
                {knockCount}
              </span>
            )}
          </button>
        </div>

        <div className="w-[1px] h-6 bg-white/15 mx-1 hidden sm:block" />

        {/* Right / Leave & Host Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Host end meeting for all */}
          {isHost && (
            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              title="Yig'ilishni hamma uchun yakunlash"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 hover:bg-red-900/90 text-xs font-bold cursor-pointer transition-all duration-200"
            >
              <RiShutDownLine size={15} />
              <span className="hidden md:inline">Tugatish</span>
            </button>
          )}

          {/* Leave meeting */}
          <button
            type="button"
            onClick={onLeave}
            title="Chiqish"
            className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/30 cursor-pointer transition-all duration-200"
          >
            <FaPhoneSlash size={17} />
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Ending Meeting for All */}
      {showEndModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#1C1F26] border border-white/10 text-white shadow-2xl">
            <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
              <RiShutDownLine size={20} />
              Yig'ilishni yakunlash
            </h3>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Haqiqatan ham ushbu yig'ilishni barcha ishtirokchilar uchun to'xtatmoqchimisiz?
              Xona yopiladi va hamma foydalanuvchilar chiqariladi.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium bg-[#2A2E37] hover:bg-[#383E4B] text-slate-200 cursor-pointer transition-colors"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEndModal(false)
                  onEndMeetingForAll?.()
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white cursor-pointer shadow-lg shadow-red-600/30 transition-colors"
              >
                Ha, yakunlash
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
