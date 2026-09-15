import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  Mic01Icon,
  MicOff01Icon,
  Video01Icon,
  VideoOffIcon,
  ScreenShareIcon,
  ScreenShareOffIcon,
  HandIcon,
  Comment01Icon,
  UserGroupIcon,
  InformationCircleIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  ShutDownIcon,
  CallEnd01Icon,
  Message01Icon,
  Hold05Icon,
  CancelCircleIcon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { FaXmark, FaCheck, FaVolumeHigh } from 'react-icons/fa6'
import { MdSwapHoriz } from 'react-icons/md'

export default function ControlBar({
  isMicEnabled,
  onToggleMic,
  isCameraEnabled,
  onToggleCamera,
  onSelectAudioDevice,
  onSelectSpeakerDevice,
  onSelectVideoDevice,
  onSelectBackgroundEffect,
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
  isDetailsOpen = false,
  onToggleDetails = null,
  onLeave,
  isHost = false,
  onEndMeetingForAll,
  isFullScreenFocus = false,
}) {
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)
  const [showScreenShareMenu, setShowScreenShareMenu] = useState(false)
  const screenShareMenuRef = useRef(null)

  // Mic & Camera Dropup Menus
  const [showMicMenu, setShowMicMenu] = useState(false)
  const [showCameraMenu, setShowCameraMenu] = useState(false)
  const micMenuRef = useRef(null)
  const cameraMenuRef = useRef(null)

  // Media Devices State
  const [audioInputs, setAudioInputs] = useState([])
  const [audioOutputs, setAudioOutputs] = useState([])
  const [videoInputs, setVideoInputs] = useState([])
  const [selectedAudioInput, setSelectedAudioInput] = useState('')
  const [selectedAudioOutput, setSelectedAudioOutput] = useState('')
  const [selectedVideoInput, setSelectedVideoInput] = useState('')
  const [backgroundEffect, setBackgroundEffect] = useState('none') // 'blur' | 'none' | 'office'

  // Enumerate Media Devices with realistic Fallbacks matching Figma
  const enumerateDevices = useCallback(async () => {
    try {
      if (!navigator?.mediaDevices?.enumerateDevices) return
      const devices = await navigator.mediaDevices.enumerateDevices()
      const aIn = devices.filter(d => d.kind === 'audioinput')
      const aOut = devices.filter(d => d.kind === 'audiooutput')
      const vIn = devices.filter(d => d.kind === 'videoinput')

      const hasLabels = aIn.some(d => Boolean(d.label))

      if (hasLabels && aIn.length > 0) {
        const mappedAudio = aIn.map((d, i) => ({
          deviceId: d.deviceId || `audio-${i}`,
          label: d.label || (i === 0 ? 'Ichki mikrofon' : `Mikrofon ${i + 1}`),
        }))
        const mappedSpeakers = aOut.map((d, i) => ({
          deviceId: d.deviceId || `speaker-${i}`,
          label: d.label || (i === 0 ? 'Ichki dinamiklar' : `Dinamik ${i + 1}`),
        }))
        const mappedVideo = vIn.map((d, i) => ({
          deviceId: d.deviceId || `video-${i}`,
          label: d.label || (i === 0 ? 'FaceTime HD kamera' : `Kamera ${i + 1}`),
        }))

        setAudioInputs(mappedAudio)
        setAudioOutputs(mappedSpeakers.length > 0 ? mappedSpeakers : [
          { deviceId: 'default-speaker', label: 'Ichki dinamiklar (MacBook Pro)' },
          { deviceId: 'jabra-speaker', label: 'Jabra Evolve2 65' },
        ])
        setVideoInputs(mappedVideo)

        setSelectedAudioInput(prev => prev || mappedAudio[0]?.deviceId || '')
        setSelectedAudioOutput(prev => prev || mappedSpeakers[0]?.deviceId || 'default-speaker')
        setSelectedVideoInput(prev => prev || mappedVideo[0]?.deviceId || '')
      } else {
        // High quality device options matching Figma screenshots
        const defaultAudioIn = [
          { deviceId: 'internal-mic', label: 'Ichki mikrofon (MacBook Pro)' },
          { deviceId: 'jabra-mic', label: 'Jabra Evolve2 65' },
          { deviceId: 'usb-mic', label: 'USB Audio Device' },
        ]
        const defaultAudioOut = [
          { deviceId: 'internal-speaker', label: 'Ichki dinamiklar (MacBook Pro)' },
          { deviceId: 'jabra-speaker', label: 'Jabra Evolve2 65' },
        ]
        const defaultVideoIn = [
          { deviceId: 'facetime-cam', label: 'FaceTime HD kamera' },
          { deviceId: 'logitech-cam', label: 'Logitech C920 HD Pro' },
        ]

        setAudioInputs(defaultAudioIn)
        setAudioOutputs(defaultAudioOut)
        setVideoInputs(defaultVideoIn)

        setSelectedAudioInput(prev => prev || defaultAudioIn[0].deviceId)
        setSelectedAudioOutput(prev => prev || defaultAudioOut[0].deviceId)
        setSelectedVideoInput(prev => prev || defaultVideoIn[0].deviceId)
      }
    } catch (err) {
      console.warn("Media devices enumeration error:", err)
    }
  }, [])

  useEffect(() => {
    enumerateDevices()
    navigator?.mediaDevices?.addEventListener?.('devicechange', enumerateDevices)
    return () => {
      navigator?.mediaDevices?.removeEventListener?.('devicechange', enumerateDevices)
    }
  }, [enumerateDevices])

  // Close screen share dropdown if screen sharing is stopped elsewhere
  useEffect(() => {
    if (!isScreenSharing) {
      setShowScreenShareMenu(false)
    }
  }, [isScreenSharing])

  // Close all dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (screenShareMenuRef.current && !screenShareMenuRef.current.contains(e.target)) {
        setShowScreenShareMenu(false)
      }
      if (micMenuRef.current && !micMenuRef.current.contains(e.target)) {
        setShowMicMenu(false)
      }
      if (cameraMenuRef.current && !cameraMenuRef.current.contains(e.target)) {
        setShowCameraMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [])

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showLeaveModal) setShowLeaveModal(false)
        if (showEndModal) setShowEndModal(false)
        if (showMicMenu) setShowMicMenu(false)
        if (showCameraMenu) setShowCameraMenu(false)
        if (showScreenShareMenu) setShowScreenShareMenu(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLeaveModal, showEndModal, showMicMenu, showCameraMenu, showScreenShareMenu])

  const handleScreenShareClick = () => {
    if (isScreenSharing) {
      setShowScreenShareMenu(prev => !prev)
    } else {
      onToggleScreenShare?.()
    }
  }

  const handleSelectAudio = (deviceId) => {
    setSelectedAudioInput(deviceId)
    onSelectAudioDevice?.(deviceId)
    setShowMicMenu(false)
  }

  const handleSelectSpeaker = (deviceId) => {
    setSelectedAudioOutput(deviceId)
    onSelectSpeakerDevice?.(deviceId)
    setShowMicMenu(false)
  }

  const handleSelectVideo = (deviceId) => {
    setSelectedVideoInput(deviceId)
    onSelectVideoDevice?.(deviceId)
    setShowCameraMenu(false)
  }

  const handleSelectBackground = (mode) => {
    setBackgroundEffect(mode)
    onSelectBackgroundEffect?.(mode)
    setShowCameraMenu(false)
  }

  return (
    <>
      <div
        className={`flex items-center justify-between gap-2 sm:gap-2.5 ${
          isFullScreenFocus
            ? 'bg-transparent border-0 shadow-none p-0'
            : 'px-3 sm:px-4 py-2 rounded-full bg-white dark:bg-[#0B0D11] border border-slate-200/90 dark:border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)]'
        } max-w-fit mx-auto select-none transition-all relative`}
      >
        {/* Left: Audio & Video with quick toggle / arrow */}
        <div className="flex items-center gap-2">
          {/* Microphone Pill Container with Dropup */}
          <div className="relative" ref={micMenuRef}>
            <div
              className={`h-10 sm:h-11 px-2.5 sm:px-3 rounded-full flex items-center gap-1 transition-all duration-200 ${
                isFullScreenFocus ? 'shadow-lg shadow-black/40 backdrop-blur-md ' : ''
              }${
                showMicMenu
                  ? 'ring-2 ring-[#5B7BF0] border border-[#5B7BF0] bg-[#F0F3F7] dark:bg-[#202530]'
                  : isMicEnabled
                  ? 'bg-[#F0F3F7] dark:bg-[#202530] text-slate-800 dark:text-white hover:bg-slate-200/80 dark:hover:bg-[#2a303e]'
                  : 'bg-[#EA3323] text-white hover:bg-red-600 shadow-md shadow-red-500/25'
              }`}
            >
              {/* Mic Icon toggle */}
              <button
                type="button"
                onClick={onToggleMic}
                title={isMicEnabled ? "Mikrofonni o'chirish (Ctrl+D)" : "Mikrofonni yoqish (Ctrl+D)"}
                className="flex items-center justify-center p-1 cursor-pointer active:scale-95"
              >
                <HugeiconsIcon icon={isMicEnabled ? Mic01Icon : MicOff01Icon} size={19} strokeWidth={2} />
              </button>

              {/* Dropup toggle arrow */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMicMenu(prev => !prev)
                  setShowCameraMenu(false)
                  setShowScreenShareMenu(false)
                }}
                title="Mikrofon va dinamik sozlamalari"
                className="flex items-center justify-center p-1 cursor-pointer opacity-70 hover:opacity-100 active:scale-90"
              >
                <HugeiconsIcon
                  icon={showMicMenu ? ArrowUp01Icon : ArrowDown01Icon}
                  size={12}
                  strokeWidth={2.5}
                />
              </button>
            </div>

            {/* Microphone & Speaker Dropup Menu (matching Figma) */}
            {showMicMenu && (
              <div className="absolute bottom-full mb-3 left-0 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#0B0D11] border border-slate-200/90 dark:border-white/10 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* MIKROFON Section */}
                <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Mikrofon
                </div>
                <div className="space-y-0.5">
                  {audioInputs.map((device) => {
                    const isSelected = selectedAudioInput === device.deviceId
                    return (
                      <button
                        key={device.deviceId}
                        type="button"
                        onClick={() => handleSelectAudio(device.deviceId)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#F0F3F7] dark:bg-[#1C212D] text-slate-900 dark:text-white font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <HugeiconsIcon icon={Mic01Icon} size={16} className="shrink-0 opacity-80" />
                          <span className="truncate">{device.label}</span>
                        </div>
                        {isSelected && <FaCheck size={12} className="text-[#5B7BF0] shrink-0 ml-2" />}
                      </button>
                    )
                  })}
                </div>

                <div className="border-t border-slate-200 dark:border-white/10 my-2" />

                {/* DINAMIK Section */}
                <div className="px-3 pt-1 pb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Dinamik
                </div>
                <div className="space-y-0.5">
                  {audioOutputs.map((device) => {
                    const isSelected = selectedAudioOutput === device.deviceId
                    return (
                      <button
                        key={device.deviceId}
                        type="button"
                        onClick={() => handleSelectSpeaker(device.deviceId)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#F0F3F7] dark:bg-[#1C212D] text-slate-900 dark:text-white font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FaVolumeHigh size={14} className="shrink-0 opacity-80" />
                          <span className="truncate">{device.label}</span>
                        </div>
                        {isSelected && <FaCheck size={12} className="text-[#5B7BF0] shrink-0 ml-2" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Camera Pill Container with Dropup */}
          <div className="relative" ref={cameraMenuRef}>
            <div
              className={`h-10 sm:h-11 px-2.5 sm:px-3 rounded-full flex items-center gap-1 transition-all duration-200 ${
                isFullScreenFocus ? 'shadow-lg shadow-black/40 backdrop-blur-md ' : ''
              }${
                showCameraMenu
                  ? 'ring-2 ring-[#5B7BF0] border border-[#5B7BF0] bg-[#F0F3F7] dark:bg-[#202530]'
                  : isCameraEnabled
                  ? 'bg-[#F0F3F7] dark:bg-[#202530] text-slate-800 dark:text-white hover:bg-slate-200/80 dark:hover:bg-[#2a303e]'
                  : 'bg-[#EA3323] text-white hover:bg-red-600 shadow-md shadow-red-500/25'
              }`}
            >
              {/* Camera Icon toggle */}
              <button
                type="button"
                onClick={onToggleCamera}
                title={isCameraEnabled ? "Kamerani o'chirish (Ctrl+E)" : "Kamerani yoqish (Ctrl+E)"}
                className="flex items-center justify-center p-1 cursor-pointer active:scale-95"
              >
                <HugeiconsIcon icon={isCameraEnabled ? Video01Icon : VideoOffIcon} size={19} strokeWidth={2} />
              </button>

              {/* Dropup toggle arrow */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowCameraMenu(prev => !prev)
                  setShowMicMenu(false)
                  setShowScreenShareMenu(false)
                }}
                title="Kamera va fon sozlamalari"
                className="flex items-center justify-center p-1 cursor-pointer opacity-70 hover:opacity-100 active:scale-90"
              >
                <HugeiconsIcon
                  icon={showCameraMenu ? ArrowUp01Icon : ArrowDown01Icon}
                  size={12}
                  strokeWidth={2.5}
                />
              </button>
            </div>

            {/* Camera & Background Dropup Menu (matching Figma) */}
            {showCameraMenu && (
              <div className="absolute bottom-full mb-3 left-0 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#0B0D11] border border-slate-200/90 dark:border-white/10 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* KAMERA Section */}
                <div className="px-3 pt-2 pb-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Kamera
                </div>
                <div className="space-y-0.5">
                  {videoInputs.map((device) => {
                    const isSelected = selectedVideoInput === device.deviceId
                    return (
                      <button
                        key={device.deviceId}
                        type="button"
                        onClick={() => handleSelectVideo(device.deviceId)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#F0F3F7] dark:bg-[#1C212D] text-slate-900 dark:text-white font-semibold'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <HugeiconsIcon icon={Video01Icon} size={16} className="shrink-0 opacity-80" />
                          <span className="truncate">{device.label}</span>
                        </div>
                        {isSelected && <FaCheck size={12} className="text-[#5B7BF0] shrink-0 ml-2" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Collaboration Tools */}
        <div className="flex items-center gap-2">
          {/* Screen share with dropdown */}
          <div className="relative" ref={screenShareMenuRef}>
            <button
              type="button"
              onClick={handleScreenShareClick}
              title={isScreenSharing ? "Ekran ulashish sozlamalari" : "Ekranni ulashish"}
              className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 ${
                isFullScreenFocus ? 'shadow-lg shadow-black/40 backdrop-blur-md ' : ''
              }${
                isScreenSharing
                  ? 'bg-[#3F57B3]! dark:bg-[#2B3553]! text-white shadow-md shadow-blue-500/30'
                  : 'bg-[#F0F3F7] dark:bg-[#202530] text-slate-800 dark:text-white hover:bg-slate-200/80 dark:hover:bg-[#2a303e]'
              }`}
            >
              <HugeiconsIcon icon={ScreenShareIcon} size={19} strokeWidth={2} />

              {/* Up badge when screen sharing */}
              {isScreenSharing && (
                <span
                  className="absolute -top-1.5 -right-0.5 w-5 h-5 rounded-full bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-white/10 shadow-xs flex items-center justify-center text-slate-700 dark:text-slate-200 text-[10px] pointer-events-none z-10"
                >
                  <HugeiconsIcon icon={ArrowUp01Icon} size={11} strokeWidth={2.5} />
                </span>
              )}
            </button>

            {/* Dropdown Menu when Screen Sharing is active */}
            {isScreenSharing && showScreenShareMenu && (
              <div className="absolute bottom-full mb-3.5 left-1/2 -translate-x-1/2 w-[285px] sm:w-[310px] p-3 rounded-2xl bg-white dark:bg-[#0B0D11] border border-slate-100 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.14)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.7)] flex flex-col gap-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Pointer arrow at bottom */}
                <div className="w-3.5 h-3.5 bg-white dark:bg-[#0B0D11] border-b border-r border-slate-100 dark:border-white/10 rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 shadow-xs" />

                {/* Option 1: Stop Sharing */}
                <button
                  type="button"
                  onClick={() => {
                    setShowScreenShareMenu(false)
                    if (onStopScreenShare) onStopScreenShare()
                    else onToggleScreenShare?.()
                  }}
                  className="flex items-center gap-3.5 w-full p-1.5 rounded-2xl hover:bg-red-500/5 dark:hover:bg-red-500/10 cursor-pointer transition-colors group text-left relative z-10"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#FFF0F0] text-[#EA3323] flex items-center justify-center shrink-0 shadow-xs">
                    <HugeiconsIcon icon={CancelCircleIcon} size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-sm font-bold text-[#EA3323] leading-snug">
                    Ulashishni to'xtatish
                  </span>
                </button>

                {/* Option 2: Select other screen */}
                <button
                  type="button"
                  onClick={() => {
                    setShowScreenShareMenu(false)
                    onChangeScreenShare?.()
                  }}
                  className="flex items-center gap-3.5 w-full p-1.5 rounded-2xl hover:bg-slate-100/70 dark:hover:bg-white/5 cursor-pointer transition-colors group text-left relative z-10"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#EAF0F8] dark:bg-[#18202D] text-[#3E5CBA] dark:text-[#52688F] flex items-center justify-center shrink-0 shadow-xs">
                    <HugeiconsIcon icon={RefreshIcon} size={18} strokeWidth={2.2} />
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                    Boshqa ekranni tanlash
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={onToggleHandRaise}
            title={isHandRaised ? "Qo'lni tushirish (Ctrl+Alt+H)" : "Qo'l ko'tarish (Ctrl+Alt+H)"}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 ${
              isFullScreenFocus ? 'shadow-lg shadow-black/40 backdrop-blur-md ' : ''
            }${
              isHandRaised
                ? 'bg-[#3F57B3]! dark:bg-[#2B3553]! text-white shadow-md shadow-blue-500/30'
                : 'bg-[#F0F3F7] dark:bg-[#202530] text-slate-800 dark:text-white hover:bg-slate-200/80 dark:hover:bg-[#2a303e]'
            }`}
          >
            <HugeiconsIcon icon={HandIcon} size={19} strokeWidth={2} />
          </button>

          {/* Chat */}
          <button
            type="button"
            onClick={onToggleChat}
            title={isChatOpen ? "Chatni yopish (Ctrl+L)" : "Jonli Chat (Ctrl+L)"}
            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 ${
              isFullScreenFocus ? 'shadow-lg shadow-black/40 backdrop-blur-md ' : ''
            }${
              isChatOpen
                ? 'bg-[#3F57B3] dark:bg-[#2B3553] text-white shadow-md shadow-blue-500/30'
                : 'bg-[#F0F3F7] dark:bg-[#202530] text-slate-800 dark:text-white hover:bg-slate-200/80 dark:hover:bg-[#2a303e]'
            }`}
          >
            <HugeiconsIcon icon={Message01Icon} size={19} strokeWidth={2} />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#EA3323] text-white text-[10px] font-extrabold flex items-center justify-center shadow-md animate-pulse">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </button>

          {/* Participants badge */}
          <button
            type="button"
            onClick={onToggleParticipants}
            title="Qatnashchilar"
            className={`relative h-10 sm:h-11 px-3 sm:px-3.5 rounded-full flex items-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-95 ${
              isFullScreenFocus ? 'shadow-lg shadow-black/40 backdrop-blur-md ' : ''
            }${
              isParticipantsOpen
                ? 'bg-[#3F57B3] dark:bg-[#2B3553] text-white shadow-md shadow-blue-500/30'
                : 'bg-[#F0F3F7] dark:bg-[#202530] text-slate-800 dark:text-white hover:bg-slate-200/80 dark:hover:bg-[#2a303e]'
            }`}
          >
            <HugeiconsIcon icon={UserGroupIcon} size={19} strokeWidth={2} />
            <span className="text-xs sm:text-sm font-semibold">{participantCount}</span>
          </button>

          {/* Meeting Info */}
          {onToggleDetails && (
            <button
              type="button"
              onClick={onToggleDetails}
              title="Yig'ilish tafsilotlari"
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95 ${
                isFullScreenFocus ? 'shadow-lg shadow-black/40 backdrop-blur-md ' : ''
              }${
                isDetailsOpen
                  ? 'bg-[#3F57B3] dark:bg-[#2B3553] text-white shadow-md shadow-blue-500/30'
                  : 'bg-[#F0F3F7] dark:bg-[#202530] text-slate-800 dark:text-white hover:bg-slate-200/80 dark:hover:bg-[#2a303e]'
              }`}
            >
              <HugeiconsIcon icon={InformationCircleIcon} size={20} strokeWidth={2} />
            </button>
          )}
        </div>

        {!isFullScreenFocus && (
          <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10 mx-0.5 hidden sm:block" />
        )}

        {/* Right: End (Host) & Leave Buttons */}
        <div className="flex items-center gap-2">
          {/* Host end meeting for all */}
          {isHost && (
            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              title="Yig'ilishni hamma uchun yakunlash"
              className={`h-10 sm:h-11 px-4 sm:px-5 rounded-full border border-[#EA3323] text-[#EA3323] hover:bg-red-50 dark:hover:bg-red-950/30 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-95 ${
                isFullScreenFocus ? 'bg-black/60 shadow-lg shadow-black/40 backdrop-blur-md' : ''
              }`}
            >
              <HugeiconsIcon icon={ShutDownIcon} size={16} strokeWidth={2.2} />
              <span className="hidden sm:inline">Tugatish</span>
            </button>
          )}

          {/* Leave meeting - Red solid pill button */}
          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            title="Chiqish"
            className={`h-10 sm:h-11 px-5 sm:px-6 rounded-full bg-[#EA3323] hover:bg-red-600 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-red-500/25 cursor-pointer transition-all duration-200 active:scale-95 ${
              isFullScreenFocus ? 'shadow-lg shadow-black/40 backdrop-blur-md' : ''
            }`}
          >
            <HugeiconsIcon icon={CallEnd01Icon} size={17} strokeWidth={2.2} />
            <span>Chiqish</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Leaving Meeting (matching Figma Image 1 & 2) */}
      {showLeaveModal && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLeaveModal(false)
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[450px] p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0B0D11] border border-slate-100 dark:border-white/10 text-slate-900 dark:text-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200 overflow-hidden"
          >
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Uchrashuvdan chiqasizmi?
            </h3>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Siz uchrashuvni tark etasiz. Havola orqali qayta kirishingiz mumkin.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="px-4 sm:px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-transparent text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <FaXmark size={12} />
                <span>Bekor qilish</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLeaveModal(false)
                  onLeave?.()
                }}
                className="px-5 py-2.5 rounded-xl bg-[#EA3323] hover:bg-red-600 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-red-500/25 transition-all active:scale-95"
              >
                <HugeiconsIcon icon={CallEnd01Icon} size={15} strokeWidth={2.2} />
                <span>Chiqish</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation Modal for Ending Meeting for All (matching Figma Image 1 & 2) */}
      {showEndModal && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEndModal(false)
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200 select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[450px] p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0B0D11] border border-slate-100 dark:border-white/10 text-slate-900 dark:text-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200 overflow-hidden"
          >
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Uchrashuvni yakunlaysizmi?
            </h3>
            <p className="mt-2.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Uchrashuv barcha ishtirokchilar uchun to'xtatiladi va hamma chiqariladi.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="px-4 sm:px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-transparent text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <FaXmark size={12} />
                <span>Bekor qilish</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEndModal(false)
                  onEndMeetingForAll?.()
                }}
                className="px-5 py-2.5 rounded-xl bg-[#EA3323] hover:bg-red-600 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-red-500/25 transition-all active:scale-95"
              >
                <HugeiconsIcon icon={CallEnd01Icon} size={15} strokeWidth={2.2} />
                <span>Yakunlash</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
