import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { flushSync } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { Room, RoomEvent, VideoPresets, Track, ConnectionQuality, setLogLevel, LogLevel } from 'livekit-client'
import { useAuth } from '../../context/AuthContext'
import { axiosAPI } from '../../service/axiosAPI'
import { toast } from '../../Toast/ToastProvider'

// LiveKit ichki statistika va track loglarini to'liq o'chirish (Silent mode)
try {
  setLogLevel(LogLevel?.silent ?? 'silent')
} catch {}

import ParticipantTile from './components/ParticipantTile'
import ControlBar from './components/ControlBar'
import ChatDrawer from './components/ChatDrawer'
import ParticipantsDrawer from './components/ParticipantsDrawer'
import MeetingDetailsDrawer from './components/MeetingDetailsDrawer'
import WaitingRoom from './components/WaitingRoom'
import KnockBanner from './components/KnockBanner'
import {
  playScreenShareStartSound,
  playScreenShareStopSound,
  playChatMessageSound,
  playParticipantJoinedSound,
  playKnockRequestSound,
  playHandRaisedSound,
} from './utils/meetingSounds'
import { getMeetingCode, parseMeetingId, getFullMeetingUrl } from './utils/meetingCode'
import {
  UserGroupIcon,
  InformationCircleIcon,
  HandIcon,
  ScreenShareIcon,
  Home01Icon,
  RefreshIcon,
  Refresh01Icon,
  Refresh04Icon,
  Home04Icon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

import { FaExpand, FaCompress, FaMicrophone, FaMicrophoneSlash, FaVideo } from 'react-icons/fa6'
import { RiSignalWifiFill, RiSignalWifiOffFill, RiSignalWifi1Fill, RiInformationLine } from 'react-icons/ri'
import {
  TbBellFilled,
  TbUserPlus,
  TbScreenShare,
  TbScreenShareOff,
  TbMessageCircle,
  TbHandStop,
  TbLink,
  TbCopy,
  TbCheck,
} from 'react-icons/tb'

const renderAlertIcon = (iconOrType, alertType) => {
  const key = alertType || iconOrType
  switch (key) {
    case 'knock':
    case 'bell':
      return <TbBellFilled size={18} className="text-amber-400 shrink-0" />
    case 'join':
      return <TbUserPlus size={18} className="text-emerald-400 shrink-0" />
    case 'screen':
      return <TbScreenShare size={18} className="text-blue-400 shrink-0" />
    case 'screen_stop':
      return <TbScreenShareOff size={18} className="text-slate-300 shrink-0" />
    case 'chat':
      return <TbMessageCircle size={18} className="text-purple-400 shrink-0" />
    case 'hand':
      return <TbHandStop size={18} className="text-amber-400 shrink-0" />
    case 'mute':
      return <FaMicrophoneSlash size={18} className="text-red-400 shrink-0" />
    default:
      if (iconOrType && typeof iconOrType !== 'string') return iconOrType
      return <RiInformationLine size={18} className="text-blue-400 shrink-0" />
  }
}

const getViewTransitionName = (identity) => {
  if (!identity) return 'none'
  const safeId = String(identity).replace(/[^a-zA-Z0-9_-]/g, '_')
  return `tile_${safeId}`
}

const withViewTransition = (callback) => {
  if (typeof document !== 'undefined' && typeof document.startViewTransition === 'function') {
    try {
      document.startViewTransition(() => {
        flushSync(() => {
          callback()
        })
      })
      return
    } catch (err) {
      console.warn('View Transition fallback:', err)
    }
  }
  callback()
}

// Persistent Remote Audio Player for playing remote participant audio
// Decoupled from video tile UI to guarantee continuous audio during full-screen focus or tile re-renders
function RemoteAudioPlayer({ audioTrack, isMicEnabled }) {
  const audioRef = useRef(null)

  useEffect(() => {
    const el = audioRef.current
    if (!el || !audioTrack) return

    if (isMicEnabled) {
      audioTrack.attach(el)
      const playPromise = el.play?.()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio autoplay issue:", err)
        })
      }
      return () => {
        try {
          audioTrack.detach(el)
        } catch (e) {}
        if (el) {
          el.srcObject = null
        }
      }
    } else {
      try {
        audioTrack.detach(el)
      } catch (e) {}
      if (el) {
        el.srcObject = null
      }
    }
  }, [audioTrack, isMicEnabled])

  return <audio ref={audioRef} autoPlay playsInline />
}

// Storage helpers for meeting chat persistence
const CHAT_STORAGE_PREFIX = 'meeting_chat_'

const getStoredChatMessages = (id) => {
  if (!id) return []
  try {
    const raw = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${id}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    if (parsed && Array.isArray(parsed.messages)) {
      return parsed.messages
    }
  } catch (err) {
    console.warn("Chat storage o'qishda xatolik:", err)
  }
  return []
}

const saveStoredChatMessages = (id, messages) => {
  if (!id || !messages) return
  try {
    localStorage.setItem(
      `${CHAT_STORAGE_PREFIX}${id}`,
      JSON.stringify({
        timestamp: Date.now(),
        messages,
      })
    )
  } catch (err) {
    console.warn('Chat storage saqlashda xatolik:', err)
  }
}

const clearStoredChatMessages = (id) => {
  if (!id) return
  try {
    localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${id}`)
  } catch (err) {
    console.warn('Chat storage tozalashda xatolik:', err)
  }
}

const getMeetingOrganizerId = (meetingDetails, meetingState) => {
  const val = (
    meetingDetails?.organizer?.id ??
    meetingDetails?.organizer_info?.id ??
    (typeof meetingDetails?.organizer === 'number' || typeof meetingDetails?.organizer === 'string' ? meetingDetails.organizer : null) ??
    meetingDetails?.created_by?.id ??
    (typeof meetingDetails?.created_by === 'number' || typeof meetingDetails?.created_by === 'string' ? meetingDetails.created_by : null) ??
    meetingState?.organizer_id ??
    meetingState?.organizer?.id ??
    (typeof meetingState?.organizer === 'number' || typeof meetingState?.organizer === 'string' ? meetingState.organizer : null)
  )
  return val ? String(val) : null
}

const getMeetingOrganizerUser = (meetingDetails, organizerId) => {
  if (meetingDetails?.organizer && typeof meetingDetails.organizer === 'object' && meetingDetails.organizer.id) {
    return meetingDetails.organizer
  }
  if (meetingDetails?.organizer_info && typeof meetingDetails.organizer_info === 'object') {
    return meetingDetails.organizer_info
  }
  if (meetingDetails?.created_by && typeof meetingDetails.created_by === 'object' && meetingDetails.created_by.id) {
    return meetingDetails.created_by
  }
  if (organizerId && Array.isArray(meetingDetails?.participants_info)) {
    return meetingDetails.participants_info.find(u => String(u.id) === String(organizerId))
  }
  return null
}

const isParticipantInRoom = (req, remotes) => {
  if (!req || !remotes || remotes.length === 0) return false
  return remotes.some(rp => {
    const sId = String(rp.identity || '')
    const sReqId = String(req.user_id || '')
    const rpName = (rp.name || '').trim().toLowerCase()
    const reqName = (req.username || '').trim().toLowerCase()

    // 1. ID mosligi (masalan: "12", "12_abc", "user_12")
    if (sReqId && (sId === sReqId || sId.startsWith(sReqId + '_') || sId.endsWith('_' + sReqId))) {
      return true
    }
    // 2. Ism yoki username mosligi
    if (reqName && rpName && (rpName === reqName || sId.toLowerCase() === reqName)) {
      return true
    }
    return false
  })
}

const formatAvatarUrl = (url) => {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed
  }
  const rawBase = import.meta.env.VITE_BASE_URL || ''
  const cleanBase = rawBase.replace(/\/+$/, '')
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return cleanBase ? `${cleanBase}${cleanPath}` : cleanPath
}

const isUserMatch = (u, identity, pNameLower) => {
  if (!u) return false
  const sId = String(u.id || '').trim()
  const sIdent = String(identity || '').trim().toLowerCase()
  if (sId && (sIdent === sId || sIdent.startsWith(sId + '_') || sIdent.endsWith('_' + sId))) {
    return true
  }
  if (u.username) {
    const uName = String(u.username).trim().toLowerCase()
    if (sIdent === uName || pNameLower === uName) {
      return true
    }
  }
  const fn = String(u.first_name || '').trim().toLowerCase()
  const ln = String(u.last_name || '').trim().toLowerCase()
  const name1 = `${fn} ${ln}`.trim()
  const name2 = `${ln} ${fn}`.trim()
  if (name1 && (pNameLower === name1 || sIdent === name1)) return true
  if (name2 && (pNameLower === name2 || sIdent === name2)) return true

  if (fn && ln && pNameLower.includes(fn) && pNameLower.includes(ln)) {
    return true
  }
  return false
}

const parseMeetingStartTimeMs = (startTime) => {
  if (!startTime) return null
  if (typeof startTime === 'number') return startTime
  if (typeof startTime === 'string') {
    const normalized = startTime.includes(' ') && !startTime.includes('T')
      ? startTime.replace(' ', 'T')
      : startTime
    const t = new Date(normalized).getTime()
    return isNaN(t) ? null : t
  }
  return null
}

const formatMeetingDuration = (totalSeconds) => {
  if (typeof totalSeconds !== 'number' || isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00'
  }
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  const pad = (n) => String(n).padStart(2, '0')
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}`
  }
  return `${pad(minutes)}:${pad(seconds)}`
}


export default function MeetingRoom() {
  const { id: rawParamId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Meeting & State Machine
  const [meetingDetails, setMeetingDetails] = useState(null)
  const [projectData, setProjectData] = useState(null)
  const [meetingState, setMeetingState] = useState(null)
  const meetingStateRef = useRef(null)

  const [directoryUsers, setDirectoryUsers] = useState([])
  const [peerProfiles, setPeerProfiles] = useState({})

  const [numericMeetingId, setNumericMeetingId] = useState(() => {
    return parseMeetingId(rawParamId)
  })
  const meetingId = numericMeetingId || parseMeetingId(rawParamId) || (meetingDetails?.id ? String(meetingDetails.id) : null)
  const [waitingState, setWaitingState] = useState('lobby') // 'lobby' | 'connecting' | 'waiting_organizer' | 'waiting_approval' | 'rejected' | 'in_room' | 'ended'
  const hasClickedJoinRef = useRef(false)
  const [isJoining, setIsJoining] = useState(false)
  const [rejectedMessage, setRejectedMessage] = useState('')
  const [knockRequests, setKnockRequests] = useState([])
  const canAdmitParticipantsRef = useRef(false)

  // Network Quality & Connection Monitoring (Google Meet style)
  const [networkStatus, setNetworkStatus] = useState('online') // 'online' | 'poor' | 'reconnecting' | 'offline'
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false)

  useEffect(() => {
    meetingStateRef.current = meetingState
  }, [meetingState])

  // LiveKit Connection
  const roomRef = useRef(null)
  const [isConnectedToLiveKit, setIsConnectedToLiveKit] = useState(false)
  const [remoteParticipants, setRemoteParticipants] = useState([])
  const [activeSpeakers, setActiveSpeakers] = useState([])
  const [participantTracks, setParticipantTracks] = useState({}) // { [identity]: { videoTrack, audioTrack, isCameraEnabled, isMicEnabled } }
  const [handRaisedMap, setHandRaisedMap] = useState({}) // { [identity]: boolean }
  const [unmuteRequest, setUnmuteRequest] = useState(null)
  const [turnOnCameraRequest, setTurnOnCameraRequest] = useState(null)
  const isLocalHostRef = useRef(false)

  // Local Media State
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const isMicEnabledRef = useRef(true)
  const isCameraEnabledRef = useRef(true)

  useEffect(() => {
    isMicEnabledRef.current = isMicEnabled
  }, [isMicEnabled])

  useEffect(() => {
    isCameraEnabledRef.current = isCameraEnabled
  }, [isCameraEnabled])

  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [localScreenTrack, setLocalScreenTrack] = useState(null)
  const [screenShareVersion, setScreenShareVersion] = useState(0)
  const isChangingScreenShareRef = useRef(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [localStream, setLocalStream] = useState(null)

  // Client-side Pinning & Screen Share Order Tracking
  const [pinnedId, setPinnedId] = useState(null)
  const [screenFocusId, setScreenFocusId] = useState(null)
  const screenShareTimesRef = useRef({})

  // Drawers & UI
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [copiedHeaderLink, setCopiedHeaderLink] = useState(false)
  const [chatMessages, setChatMessages] = useState(() => getStoredChatMessages(meetingId))
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [meetingDuration, setMeetingDuration] = useState(0)
  const [endedReason, setEndedReason] = useState("Yig'ilish yakunlandi")

  // Live meeting duration counter (calculates elapsed time since start_time from API)
  const rawStartTime = meetingDetails?.start_time || meetingState?.start_time || meetingDetails?.started_at
  const [currentTime, setCurrentTime] = useState(() => {
    const startMs = parseMeetingStartTimeMs(rawStartTime)
    if (startMs) {
      const diffSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
      return formatMeetingDuration(diffSeconds)
    }
    return '00:00'
  })

  useEffect(() => {
    const updateElapsed = () => {
      const startMs = parseMeetingStartTimeMs(rawStartTime)
      if (startMs) {
        const diffSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
        setCurrentTime(formatMeetingDuration(diffSeconds))
      } else {
        setCurrentTime(formatMeetingDuration(meetingDuration))
      }
    }

    updateElapsed()
    const timer = setInterval(updateElapsed, 1000)
    return () => clearInterval(timer)
  }, [rawStartTime, meetingDuration])

  // Auto-sync chat messages to localStorage
  useEffect(() => {
    if (!meetingId) return
    if (chatMessages && chatMessages.length > 0) {
      saveStoredChatMessages(meetingId, chatMessages)
    }
  }, [chatMessages, meetingId])

  // Re-hydrate chat from storage whenever meetingId is available
  useEffect(() => {
    if (!meetingId) return
    const stored = getStoredChatMessages(meetingId)
    if (stored.length > 0) {
      setChatMessages(prev => (prev.length === 0 ? stored : prev))
    }
  }, [meetingId])

  // In-room dynamic alerts
  const [inRoomAlert, setInRoomAlert] = useState(null)
  const inRoomAlertTimerRef = useRef(null)
  const leaveLiveKitRef = useRef(null)

  const triggerInRoomAlert = useCallback((icon, text, type = 'info') => {
    if (inRoomAlertTimerRef.current) {
      clearTimeout(inRoomAlertTimerRef.current)
    }
    setInRoomAlert({ icon, text, type, id: Date.now() })
    inRoomAlertTimerRef.current = setTimeout(() => {
      setInRoomAlert(null)
    }, 4000)
  }, [])

  // Auto-sync address bar to /meetings/<id>
  useEffect(() => {
    const code = getMeetingCode(meetingId)
    if (!code) return
    const targetPath = `/meetings/${code}`
    if (typeof window !== 'undefined' && decodeURIComponent(window.location.pathname) !== targetPath && window.location.pathname !== targetPath) {
      window.history.replaceState(null, '', targetPath)
    }
  }, [meetingId])

  const currentMeetingCode = getMeetingCode(meetingId)
  const currentMeetingUrl = getFullMeetingUrl(meetingId)

  const handleCopyMeetingLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentMeetingUrl).then(() => {
        setCopiedHeaderLink(true)
        toast.success('Nusxa olindi', 'Yig\'ilish havolasi nusxalandi')
        setTimeout(() => setCopiedHeaderLink(false), 2000)
      }).catch(() => {})
    }
  }

  // WebSocket reference
  const wsRef = useRef(null)
  const previewStreamRef = useRef(null)
  const currentUserName = user?.username || user?.first_name || 'Foydalanuvchi'

  // 1. Initial Local Camera / Mic Preview for Waiting Room
  useEffect(() => {
    let stream = null
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (waitingState === 'in_room' || roomRef.current) {
          s.getTracks().forEach(t => t.stop())
          return
        }
        stream = s
        previewStreamRef.current = s
        setLocalStream(s)
      })
      .catch((err) => {
        console.warn("Media devices not accessible or permission denied:", err)
      })

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
      }
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(t => t.stop())
        previewStreamRef.current = null
      }
    }
  }, [])

  // Timer while in room
  useEffect(() => {
    if (waitingState !== 'in_room') return
    const timer = setInterval(() => {
      setMeetingDuration(p => p + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [waitingState])

  // Browser internet connectivity monitoring
  useEffect(() => {
    const handleOnline = () => {
      if (roomRef.current?.state === 'connected') {
        setNetworkStatus('online')
        setShowReconnectedBanner(true)
        setTimeout(() => setShowReconnectedBanner(false), 3500)
      }
    }
    const handleOffline = () => {
      setNetworkStatus('offline')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Disconnect any lingering LiveKit / WebSocket sessions on initial mount
  useEffect(() => {
    hasClickedJoinRef.current = false
    if (roomRef.current) {
      roomRef.current.disconnect().catch(() => {})
      roomRef.current = null
      setIsConnectedToLiveKit(false)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  // Immediately disconnect LiveKit and close WebSocket when tab is closed or refreshed
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomRef.current) {
        roomRef.current.disconnect()
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop())
      }
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(t => t.stop())
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [localStream])

  // Complete hardware toggle for Camera in WaitingRoom (stops tracks / restarts getUserMedia)
  const handleToggleLobbyCamera = useCallback(async () => {
    const stream = localStream || previewStreamRef.current
    const activeVideoTracks = stream ? stream.getVideoTracks() : []
    const hasLiveVideo = activeVideoTracks.some(t => t.readyState === 'live')

    if (isCameraEnabledRef.current || hasLiveVideo) {
      // 1. O'chirish: Barcha video tracklarni to'liq stop qilamiz (webcam apparat chirog'i darhol o'chadi)
      if (localStream) {
        localStream.getVideoTracks().forEach(t => {
          try {
            t.stop()
            t.enabled = false
          } catch (e) {}
        })
      }
      if (previewStreamRef.current) {
        previewStreamRef.current.getVideoTracks().forEach(t => {
          try {
            t.stop()
            t.enabled = false
          } catch (e) {}
        })
      }
      const remainingAudioTracks = stream ? stream.getAudioTracks() : []
      const newStream = new MediaStream(remainingAudioTracks)
      previewStreamRef.current = newStream
      setLocalStream(newStream)
      setIsCameraEnabled(false)
      isCameraEnabledRef.current = false
    } else {
      // 2. Yoqish: Yangi video track olib, mavjud streamga qo'shamiz (webcam apparat chirog'i yonadi)
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          }
        })
        const newVideoTrack = videoStream.getVideoTracks()[0]
        if (newVideoTrack) {
          const currentAudioTracks = stream ? stream.getAudioTracks() : []
          const combinedStream = new MediaStream([...currentAudioTracks, newVideoTrack])
          previewStreamRef.current = combinedStream
          setLocalStream(combinedStream)
        }
      } catch (err) {
        console.warn("Kamerani yoqishda xatolik:", err)
        toast.error("Xatolik", "Kameraga ulanib bo'lmadi")
      }
      setIsCameraEnabled(true)
      isCameraEnabledRef.current = true
    }
  }, [localStream])

  // Complete hardware toggle for Mic in WaitingRoom (stops tracks / restarts getUserMedia)
  const handleToggleLobbyMic = useCallback(async () => {
    const stream = localStream || previewStreamRef.current
    const activeAudioTracks = stream ? stream.getAudioTracks() : []
    const hasLiveAudio = activeAudioTracks.some(t => t.readyState === 'live')

    if (isMicEnabledRef.current || hasLiveAudio) {
      // 1. O'chirish: Barcha audio tracklarni to'liq stop qilamiz (mikrofon apparat darajasida to'xtaydi)
      if (localStream) {
        localStream.getAudioTracks().forEach(t => {
          try {
            t.stop()
            t.enabled = false
          } catch (e) {}
        })
      }
      if (previewStreamRef.current) {
        previewStreamRef.current.getAudioTracks().forEach(t => {
          try {
            t.stop()
            t.enabled = false
          } catch (e) {}
        })
      }
      const remainingVideoTracks = stream ? stream.getVideoTracks() : []
      const newStream = new MediaStream(remainingVideoTracks)
      previewStreamRef.current = newStream
      setLocalStream(newStream)
      setIsMicEnabled(false)
      isMicEnabledRef.current = false
    } else {
      // 2. Yoqish: Yangi audio track olib, mavjud streamga qo'shamiz
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const newAudioTrack = audioStream.getAudioTracks()[0]
        if (newAudioTrack) {
          const currentVideoTracks = stream ? stream.getVideoTracks() : []
          const combinedStream = new MediaStream([...currentVideoTracks, newAudioTrack])
          previewStreamRef.current = combinedStream
          setLocalStream(combinedStream)
        }
      } catch (err) {
        console.warn("Mikrofonni yoqishda xatolik:", err)
        toast.error("Xatolik", "Mikrofonga ulanib bo'lmadi")
      }
      setIsMicEnabled(true)
      isMicEnabledRef.current = true
    }
  }, [localStream])

  // Format seconds to HH:MM:SS or MM:SS
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Load meeting metadata from REST API by extracting numeric ID from URL
  useEffect(() => {
    // URL dan (masalan "12-54sa-asq4" dan) id ni ("12") kesib olamiz
    const extractedId = parseMeetingId(rawParamId) || meetingId
    const queryTarget = extractedId || rawParamId
    if (!queryTarget) return

    let isSubscribed = true

    const fetchMeeting = async () => {
      // 1. URL dan kesib olingan ID orqali to'g'ridan-to'g'ri /meetings/<extractedId>/ ga GET so'rov yuboramiz
      if (extractedId && /^\d+$/.test(String(extractedId))) {
        try {
          const res = await axiosAPI.get(`/meetings/${extractedId}/`)
          const d = res.data?.data ?? res.data
          if (isSubscribed && d && d.id) {
            setMeetingDetails(d)
            setNumericMeetingId(String(d.id))
            return
          }
        } catch (err) {
          console.warn("Yig'ilish ma'lumotlarini ID orqali olishda xatolik:", err)
        }
      }

      // 2. Agar ID orqali olinmasa yoki URL da faqat UID bo'lsa, to'g'ridan-to'g'ri yoki /meetings/?search= orqali qidiramiz
      try {
        const res = await axiosAPI.get(`/meetings/${encodeURIComponent(queryTarget)}/`)
        const d = res.data?.data ?? res.data
        if (isSubscribed && d && d.id) {
          setMeetingDetails(d)
          setNumericMeetingId(String(d.id))
          return
        }
      } catch (err) {
        // Fallback search
      }

      try {
        const searchTerm = rawParamId || queryTarget
        const res = await axiosAPI.get('/meetings/', { params: { search: searchTerm } })
        const results = res.data?.data?.results ?? res.data?.results ?? res.data
        if (isSubscribed && Array.isArray(results) && results.length > 0) {
          const match = results.find(m => String(m.uid).trim() === String(searchTerm).trim() || String(m.id) === String(extractedId)) || results[0]
          if (match && match.id) {
            setMeetingDetails(match)
            setNumericMeetingId(String(match.id))
          }
        }
      } catch (err) {
        console.warn("Yig'ilishni qidirishda xato:", err)
      }
    }

    fetchMeeting()

    return () => {
      isSubscribed = false
    }
  }, [rawParamId, meetingId])

  // Load project details if meeting is associated with a project (for project manager detection)
  useEffect(() => {
    const projId = (
      meetingDetails?.project_info?.id ??
      meetingDetails?.project?.id ??
      (typeof meetingDetails?.project === 'number' || typeof meetingDetails?.project === 'string' ? meetingDetails.project : null)
    )
    if (!projId) {
      setProjectData(null)
      return
    }
    if (meetingDetails?.project_info?.manager || meetingDetails?.project_info?.manager_info) {
      setProjectData(meetingDetails.project_info)
    }
    axiosAPI.get(`/projects/${projId}/`)
      .then(res => {
        const p = res.data?.data ?? res.data
        setProjectData(p)
      })
      .catch(() => {})
  }, [meetingDetails])

  // Send message over WebSocket helper
  const sendWs = (payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }

  // Handle incoming WebSocket messages
  const handleWsMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'meeting_state': {
        setMeetingState(msg)

        // Agar foydalanuvchi hali Lobby (tayyorgarlik) sahifasida bo'lsa va "Yig'ilishga kirish" tugmasini bosmagan bo'lsa,
        // avtomatik token yoki ask_to_join so'rovini yubormaymiz!
        if (!hasClickedJoinRef.current) {
          return
        }

        if (msg.is_host) {
          // Host immediately requests token
          sendWs({ action: 'get_token' })
        } else {
          // Guest flow
          if (!msg.organizer_joined) {
            setWaitingState('waiting_organizer')
            setIsJoining(false)
          } else {
            if (msg.requires_approval && !msg.is_approved) {
              setWaitingState('waiting_approval')
              sendWs({ action: 'ask_to_join' })
              setIsJoining(false)
            } else {
              setWaitingState('connecting')
              sendWs({ action: 'get_token' })
            }
          }
        }
        break
      }

      case 'organizer_joined': {
        setMeetingState(prev => prev ? ({ ...prev, organizer_joined: true }) : prev)
        if (!hasClickedJoinRef.current) {
          return
        }
        // If guest was waiting for organizer
        if (waitingState === 'waiting_organizer') {
          if (meetingState?.requires_approval && !meetingState?.is_approved) {
            setWaitingState('waiting_approval')
            sendWs({ action: 'ask_to_join' })
            setIsJoining(false)
          } else {
            setWaitingState('connecting')
            sendWs({ action: 'get_token' })
          }
        }
        break
      }

      case 'knock_request': {
        // Faqat qabul qilish huquqiga ega bo'lganlar (host, admin, superadmin, loyiha menejeri) ga signal beriladi
        if (canAdmitParticipantsRef.current) {
          playKnockRequestSound()
          triggerInRoomAlert('bell', `${msg.username || 'Foydalanuvchi'} yig'ilishga kirishni so'ramoqda`, 'knock')
        }
        setKnockRequests(prev => {
          if (prev.some(k => k.user_id === msg.user_id)) return prev
          return [...prev, {
            user_id: msg.user_id,
            username: msg.username,
            avatar: msg.avatar
          }]
        })
        break
      }

      case 'knock_response':
      case 'knock_handled':
      case 'knock_approved':
      case 'knock_rejected': {
        // Agar biror foydalanuvchi so'rovi qabul/rad qilingan bo'lsa, barcha admin/hostlarda ro'yxatdan o'chirish
        const handledUserId = msg.user_id || msg.guest_id
        if (handledUserId) {
          setKnockRequests(prev => prev.filter(k => String(k.user_id) !== String(handledUserId)))
        }
        if (msg.status === 'approved') {
          setIsJoining(false)
          if (!hasClickedJoinRef.current) {
            return
          }
          // Guest approved! Connect to LiveKit room
          if (msg.server_url && msg.token) {
            connectToLiveKit(msg.server_url, msg.token)
          } else if (waitingState === 'waiting_approval') {
            sendWs({ action: 'get_token' })
          }
        } else if (msg.status === 'rejected') {
          setIsJoining(false)
          if (waitingState === 'waiting_approval') {
            setWaitingState('rejected')
            setRejectedMessage(msg.message || "Tashkilotchi yig'ilishga kirishingizni rad etdi.")
          }
        }
        break
      }

      case 'token_response': {
        setIsJoining(false)
        if (!hasClickedJoinRef.current) {
          console.warn("token_response keldi, lekin foydalanuvchi hali Lobby'da! Ulanish to'xtatildi.")
          return
        }
        if (msg.status === 'joined' && msg.server_url && msg.token) {
          connectToLiveKit(msg.server_url, msg.token)
        }
        break
      }

      case 'meeting_ended': {
        clearStoredChatMessages(meetingId)
        setChatMessages([])
        setWaitingState('ended')
        setEndedReason(msg.message || "Yig'ilish tashkilotchi tomonidan yakunlandi.")
        leaveLiveKit()
        break
      }

      case 'error': {
        const code = msg.code
        const message = msg.message || "Xatolik yuz berdi"
        toast.error("Xatolik", message)
        // 403, 404, 401 — orqaga qaytish
        if (code === 403 || code === 404 || code === 401) {
          setTimeout(() => navigate(-1), 1500)
        }
        break
      }

      default:
        break
    }
  }, [waitingState, meetingState])

  const handleWsMessageRef = useRef(null)
  handleWsMessageRef.current = handleWsMessage

  // 2. WebSocket Connection (Faqat foydalanuvchi yig'ilishga kirishni bosganda chaqiriladi!)
  const connectWs = useCallback(async () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    try {
      // Step 1: Request ticket
      const { data: ticketRes } = await axiosAPI.post('/notifications/tickets/')
      if (!hasClickedJoinRef.current) {
        return
      }
      const ticket = ticketRes?.data?.ticket || ticketRes?.ticket

      if (!ticket) {
        toast.error("Xatolik", "WebSocket uchun bilet olinmadi")
        setIsJoining(false)
        setWaitingState('lobby')
        return
      }

      // Formulate WebSocket URL
      const rawBase = import.meta.env.VITE_BASE_URL
      const wsUrl = `${rawBase}/ws/meetings/${meetingId}/?ticket=${ticket}`

      if (!hasClickedJoinRef.current) {
        return
      }

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        if (!hasClickedJoinRef.current) {
          try { ws.close() } catch {}
          return
        }
      }

      ws.onmessage = (event) => {
        let msg
        try {
          msg = JSON.parse(event.data)
        } catch {
          return
        }

        handleWsMessageRef.current?.(msg)
      }

      ws.onerror = (err) => {
        console.error("WebSocket xatosi:", err)
      }

      ws.onclose = (evt) => {
      }
    } catch (err) {
      console.error("WebSocket ulanishda xato:", err)
      setIsJoining(false)
      setWaitingState('lobby')
      toast.error("Xatolik", "Server bilan ulanishda muammo yuz berdi")
    }
  }, [meetingId])

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  // Helper to determine if a participant is the host/organizer
  const checkIsHost = useCallback((participantObj, identity, name) => {
    // Faqat va faqat yig'ilish organizatori ID va ma'lumotlariga qarab aniqlaymiz
    const organizerId = getMeetingOrganizerId(meetingDetails, meetingState)
    if (!organizerId) return false

    const sOrgId = String(organizerId)
    const sIdentity = String(identity || '')

    // 1. Participant identity ID ga to'liq mos kelishi (masalan, "5", "5_abc", "user_5")
    if (sIdentity === sOrgId || sIdentity.startsWith(sOrgId + '_') || sIdentity.endsWith('_' + sOrgId)) {
      return true
    }

    // 2. Organizer ma'lumotlari (id, username, ism-familiya) bilan solishtirish
    const organizerUser = getMeetingOrganizerUser(meetingDetails, organizerId)
    if (organizerUser) {
      const sOrgUserId = String(organizerUser.id || '')
      if (sOrgUserId && (sIdentity === sOrgUserId || sIdentity.startsWith(sOrgUserId + '_') || sIdentity.endsWith('_' + sOrgUserId))) {
        return true
      }
      if (organizerUser.username && sIdentity.toLowerCase() === organizerUser.username.toLowerCase()) {
        return true
      }
      const orgFullName = `${organizerUser.first_name || ''} ${organizerUser.last_name || ''}`.trim()
      if (orgFullName && name && name.trim().toLowerCase() === orgFullName.toLowerCase()) {
        return true
      }
    }

    return false
  }, [meetingDetails, meetingState])

  // Lobby sahifasidan "Yig'ilishga kirish" tugmasi bosilganda
  const handleJoinFromLobby = useCallback(() => {
    hasClickedJoinRef.current = true
    setIsJoining(true)
    setWaitingState('connecting')

    // Tugma bosilgandagina WebSocket ulanadi va so'rov yuboriladi!
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWs()
    } else {
      const state = meetingStateRef.current || meetingState
      if (!state) {
        sendWs({ action: 'get_token' })
      } else if (state.is_host) {
        sendWs({ action: 'get_token' })
      } else {
        if (!state.organizer_joined) {
          setWaitingState('waiting_organizer')
          setIsJoining(false)
        } else if (state.requires_approval && !state.is_approved) {
          setWaitingState('waiting_approval')
          sendWs({ action: 'ask_to_join' })
          setIsJoining(false)
        } else {
          setWaitingState('connecting')
          sendWs({ action: 'get_token' })
        }
      }
    }
  }, [connectWs, meetingState])

  const handleCancelWait = useCallback(() => {
    hasClickedJoinRef.current = false
    setIsJoining(false)
    setWaitingState('lobby')

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ action: 'cancel_join' }))
        }
      } catch {}
      wsRef.current.close()
      wsRef.current = null
    }
    if (roomRef.current) {
      leaveLiveKitRef.current?.()
    }
  }, [])

  // Load all company users once to resolve any participant avatars
  useEffect(() => {
    let isSub = true
    axiosAPI.get('/users/all/', { params: { page_size: 200 } })
      .then(res => {
        const list = res.data?.results ?? res.data?.data?.results ?? res.data?.data ?? res.data ?? []
        if (isSub && Array.isArray(list)) {
          setDirectoryUsers(list)
        }
      })
      .catch(() => {})
    return () => { isSub = false }
  }, [])

  // Broadcast current user's profile and avatar over LiveKit DataChannel
  const broadcastMyProfile = useCallback((roomInstance, isRequest = true) => {
    const targetRoom = roomInstance || roomRef.current
    if (!targetRoom || !targetRoom.localParticipant) return
    const myProfilePayload = {
      type: 'user_profile',
      identity: targetRoom.localParticipant.identity,
      userId: user?.id,
      username: user?.username,
      name: currentUserName,
      avatar: formatAvatarUrl(user?.avatar) || user?.avatar || '',
      isRequest
    }
    const encoder = new TextEncoder()
    const data = encoder.encode(JSON.stringify(myProfilePayload))
    targetRoom.localParticipant.publishData(data, { reliable: true }).catch(() => {})
  }, [user, currentUserName])

  // Resolve avatar for any participant using all available data sources
  const resolveParticipantAvatar = useCallback((participant, pInfo) => {
    if (!participant) return ''
    if (participant.isLocal) return formatAvatarUrl(user?.avatar) || user?.avatar || ''

    const identity = String(participant.identity || '')
    const pName = (participant.name || pInfo?.name || '').trim()
    const pNameLower = pName.toLowerCase()

    // 1. LiveKit metadata
    if (participant.metadata) {
      try {
        const parsed = JSON.parse(participant.metadata)
        if (parsed?.avatar) return formatAvatarUrl(parsed.avatar)
      } catch {
        if (typeof participant.metadata === 'string' && (participant.metadata.startsWith('http') || participant.metadata.startsWith('/media'))) {
          return formatAvatarUrl(participant.metadata)
        }
      }
    }

    // 2. DataChannel orqali qabul qilingan peer profiles
    if (peerProfiles[identity]?.avatar) return formatAvatarUrl(peerProfiles[identity].avatar)
    if (pNameLower && peerProfiles[pNameLower]?.avatar) return formatAvatarUrl(peerProfiles[pNameLower].avatar)

    // 3. meetingDetails - organizer
    const orgId = getMeetingOrganizerId(meetingDetails, meetingState)
    const orgUser = getMeetingOrganizerUser(meetingDetails, orgId)
    if (orgUser?.avatar && isUserMatch(orgUser, identity, pNameLower)) {
      return formatAvatarUrl(orgUser.avatar)
    }

    // 4. meetingDetails - participants_info
    if (Array.isArray(meetingDetails?.participants_info)) {
      const match = meetingDetails.participants_info.find(u => isUserMatch(u, identity, pNameLower))
      if (match?.avatar) return formatAvatarUrl(match.avatar)
    }

    // 5. projectData (employees_info, testers_info, manager_info)
    const allProjectMembers = [
      ...(projectData?.employees_info || []),
      ...(projectData?.testers_info || []),
      ...(projectData?.manager_info ? [projectData.manager_info] : [])
    ]
    if (allProjectMembers.length > 0) {
      const match = allProjectMembers.find(u => isUserMatch(u, identity, pNameLower))
      if (match?.avatar) return formatAvatarUrl(match.avatar)
    }

    // 6. Directory users (/users/all/)
    if (Array.isArray(directoryUsers) && directoryUsers.length > 0) {
      const match = directoryUsers.find(u => isUserMatch(u, identity, pNameLower))
      if (match?.avatar) return formatAvatarUrl(match.avatar)
    }

    // 7. knockRequests
    if (Array.isArray(knockRequests) && knockRequests.length > 0) {
      const match = knockRequests.find(k => {
        const kId = String(k.user_id || '')
        if (kId && (identity === kId || identity.startsWith(kId + '_') || identity.endsWith('_' + kId))) return true
        if (k.username && (identity.toLowerCase() === k.username.toLowerCase() || pNameLower === k.username.toLowerCase())) return true
        return false
      })
      if (match?.avatar) return formatAvatarUrl(match.avatar)
    }

    return ''
  }, [meetingDetails, meetingState, projectData, directoryUsers, peerProfiles, knockRequests, user])

  // 3. LiveKit Connection
  const connectToLiveKit = async (serverUrl, token) => {
    try {
      // Agar foydalanuvchi hali Lobby'da bo'lsa yoki qo'shilishni tasdiqlamagan bo'lsa, xonaga kirmaymiz!
      if (!hasClickedJoinRef.current) {
        console.warn("connectToLiveKit chaqirildi, lekin hasClickedJoinRef hali false! LiveKit ulanishi bekor qilindi.")
        return
      }

      // If already connected, do not re-connect
      if (roomRef.current) {
        return
      }

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        stopLocalTrackOnUnpublish: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
          simulcast: true,
        },
        publishDefaults: {
          simulcast: true,
          videoSimulcastLayers: [
            VideoPresets.h1080,
            VideoPresets.h720,
            VideoPresets.h360
          ]
        }
      })
      roomRef.current = room

      // Setup LiveKit event listeners
      setupRoomListeners(room)

      // Connect to LiveKit Media Server
      await room.connect(serverUrl, token)

      // Profilimizni va avatarimizni boshqa qatnashchilarga tarqatamiz
      broadcastMyProfile(room)
      if (user?.avatar) {
        room.localParticipant.setMetadata(JSON.stringify({
          avatar: formatAvatarUrl(user.avatar) || user.avatar,
          name: currentUserName,
          userId: user.id
        })).catch(() => {})
      }

      // Release preview stream from waiting room immediately so camera/mic are freed
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(t => t.stop())
        previewStreamRef.current = null
      }
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop())
        setLocalStream(null)
      }

      // Enable or disable local mic & camera strictly respecting user choices from waiting room!
      const initialCam = isCameraEnabledRef.current
      const initialMic = isMicEnabledRef.current

      try {
        if (initialCam) {
          await room.localParticipant.setCameraEnabled(true)
        } else {
          await room.localParticipant.setCameraEnabled(false)
        }
      } catch (mediaErr) {
        console.warn("Kamerani sozlashda xatolik:", mediaErr)
      }

      try {
        if (initialMic) {
          await room.localParticipant.setMicrophoneEnabled(true)
        } else {
          await room.localParticipant.setMicrophoneEnabled(false)
        }
      } catch (mediaErr) {
        console.warn("Mikrofonni sozlashda xatolik:", mediaErr)
      }

      setIsCameraEnabled(initialCam)
      setIsMicEnabled(initialMic)

      // Faqat yig'ilishni yaratgan user (organizer) host hisoblanadi
      const initialOrgId = getMeetingOrganizerId(meetingDetails, meetingState)
      const isInitialLocalHost = Boolean(
        user?.id &&
        initialOrgId &&
        String(user.id) === String(initialOrgId)
      )

      // Sync local participant track with exact user choices
      const camTrack = initialCam
        ? room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack
        : null

      updateParticipantTrack(room.localParticipant.identity, {
        videoTrack: camTrack,
        audioTrack: null,
        isCameraEnabled: initialCam,
        isMicEnabled: initialMic,
        name: room.localParticipant.name || currentUserName,
        isLocal: true,
        isHost: isInitialLocalHost,
      })

      // 1. Sync all ALREADY CONNECTED remote participants (for users who joined later!)
      const initialRemotes = Array.from(room.remoteParticipants.values())
      setRemoteParticipants(initialRemotes)

      // 2. Sync all ALREADY SUBSCRIBED / PUBLISHED tracks for existing participants
      const initialTracks = {}
      initialRemotes.forEach(rp => {
        const rpIsHost = checkIsHost(rp, rp.identity, rp.name)
        const info = {
          name: rp.name || rp.identity,
          isLocal: false,
          isHost: rpIsHost,
          isCameraEnabled: rp.isCameraEnabled,
          isMicEnabled: rp.isMicrophoneEnabled,
          videoTrack: null,
          audioTrack: null,
          screenShareTrack: null,
        }

        rp.trackPublications.forEach(pub => {
          if (pub.track) {
            if (pub.kind === Track.Kind.Video) {
              if (pub.source === Track.Source.ScreenShare) {
                info.screenShareTrack = pub.track
                if (!screenShareTimesRef.current[rp.identity]) {
                  screenShareTimesRef.current[rp.identity] = Date.now()
                }
              } else {
                info.videoTrack = pub.track
                info.isCameraEnabled = !pub.isMuted
              }
            } else if (pub.kind === Track.Kind.Audio) {
              info.audioTrack = pub.track
              info.isMicEnabled = !pub.isMuted
            }
          }
        })

        initialTracks[rp.identity] = info
      })
      setParticipantTracks(prev => ({ ...prev, ...initialTracks }))

      // 3. Audio playback permission check
      if (room.canPlaybackAudio) {
        room.startAudio().catch(() => {})
      }

      setIsConnectedToLiveKit(true)
      setWaitingState('in_room')
    } catch (err) {
      console.error("LiveKit xonasiga ulanishda xato:", err)
      toast.error("Xatolik", "Video xonaga ulanishda muammo yuz berdi")
    }
  }

  // Setup LiveKit room event listeners
  const setupRoomListeners = (room) => {
    // Participant connected (fires when another participant joins later)
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      setRemoteParticipants(Array.from(room.remoteParticipants.values()))
      // Xonaga kirgan ishtirokchini knock so'rovlaridan darhol olib tashlash
      setKnockRequests(prev => prev.filter(req => {
        const sId = String(participant.identity || '')
        const sReqId = String(req.user_id || '')
        const pName = (participant.name || '').trim().toLowerCase()
        const reqName = (req.username || '').trim().toLowerCase()
        if (sReqId && (sId === sReqId || sId.startsWith(sReqId + '_') || sId.endsWith('_' + sReqId))) {
          return false
        }
        if (reqName && pName && (pName === reqName || sId.toLowerCase() === reqName)) {
          return false
        }
        return true
      }))
      const pIsHost = checkIsHost(participant, participant.identity, participant.name)
      playParticipantJoinedSound()
      const pName = participant.name || participant.identity || "Yangi ishtirokchi"
      triggerInRoomAlert('join', `${pName} yig'ilishga qo'shildi`, 'join')
      setParticipantTracks(prev => ({
        ...prev,
        [participant.identity]: {
          name: participant.name || participant.identity,
          isLocal: false,
          isHost: pIsHost,
          isCameraEnabled: participant.isCameraEnabled,
          isMicEnabled: participant.isMicrophoneEnabled,
          videoTrack: null,
          audioTrack: null,
          screenShareTrack: null,
        }
      }))
      // Yangi ishtirokchiga o'z profilimizni va avatarimizni yuboramiz
      broadcastMyProfile(room)
    })

    // Participant metadata changed (LiveKit metadata orqali avatar yangilanishi)
    room.on(RoomEvent.ParticipantMetadataChanged, (metadata, participant) => {
      if (participant && metadata) {
        try {
          const parsed = JSON.parse(metadata)
          if (parsed?.avatar) {
            setPeerProfiles(prev => ({
              ...prev,
              [participant.identity]: parsed,
              ...(parsed.userId ? { [String(parsed.userId)]: parsed } : {})
            }))
          }
        } catch {}
      }
    })

    // Participant disconnected
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      delete screenShareTimesRef.current[participant.identity]
      setPinnedId(prev => (prev && prev.startsWith(participant.identity) ? null : prev))
      setRemoteParticipants(Array.from(room.remoteParticipants.values()))
      setParticipantTracks(prev => {
        const next = { ...prev }
        delete next[participant.identity]
        return next
      })
      setHandRaisedMap(prev => {
        const next = { ...prev }
        delete next[participant.identity]
        return next
      })
    })

    // Track Published (remote participant published camera / mic / screen)
    room.on(RoomEvent.TrackPublished, (publication, participant) => {
      if (participant.isLocal) return
      setRemoteParticipants(Array.from(room.remoteParticipants.values()))
    })

    // Track Subscribed (remote audio/video track ready)
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (participant.isLocal) return
      const pIsHost = checkIsHost(participant, participant.identity, participant.name)
      const isScreen = publication.source === Track.Source.ScreenShare || track.source === Track.Source.ScreenShare

      if (track.kind === Track.Kind.Video && isScreen) {
        screenShareTimesRef.current[participant.identity] = Date.now()
        playScreenShareStartSound()
        const pName = participant.name || participant.identity || "Ishtirokchi"
        triggerInRoomAlert('screen', `${pName} ekranini ulashdi`, 'screen')
      }

      setParticipantTracks(prev => {
        const cur = {
          name: participant.name || participant.identity,
          isLocal: false,
          isHost: pIsHost,
          isCameraEnabled: participant.isCameraEnabled,
          isMicEnabled: participant.isMicrophoneEnabled,
          videoTrack: null,
          audioTrack: null,
          screenShareTrack: null,
          ...(prev[participant.identity] || {}),
        }

        if (track.kind === Track.Kind.Video) {
          if (isScreen) {
            cur.screenShareTrack = track
          } else {
            cur.videoTrack = track
            cur.isCameraEnabled = true
          }
        } else if (track.kind === Track.Kind.Audio) {
          cur.audioTrack = track
          cur.isMicEnabled = true
        }

        return { ...prev, [participant.identity]: cur }
      })
    })

    // Track Unsubscribed
    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (participant.isLocal) return
      const isScreen = publication.source === Track.Source.ScreenShare || track.source === Track.Source.ScreenShare

      if (track.kind === Track.Kind.Video && isScreen) {
        delete screenShareTimesRef.current[participant.identity]
        playScreenShareStopSound()
      }

      setParticipantTracks(prev => {
        const cur = prev[participant.identity]
        if (!cur) return prev
        const next = { ...cur }

        if (track.kind === Track.Kind.Video) {
          if (isScreen) {
            next.screenShareTrack = null
          } else {
            next.videoTrack = null
            next.isCameraEnabled = false
          }
        } else if (track.kind === Track.Kind.Audio) {
          next.audioTrack = null
          next.isMicEnabled = false
        }

        return { ...prev, [participant.identity]: next }
      })
    })

    // Track Unpublished
    room.on(RoomEvent.TrackUnpublished, (publication, participant) => {
      if (participant.isLocal) return
      const isScreen = publication.source === Track.Source.ScreenShare

      setParticipantTracks(prev => {
        const cur = prev[participant.identity]
        if (!cur) return prev
        const next = { ...cur }

        if (isScreen) {
          delete screenShareTimesRef.current[participant.identity]
          next.screenShareTrack = null
        } else if (publication.kind === Track.Kind.Video) {
          next.videoTrack = null
          next.isCameraEnabled = false
        } else if (publication.kind === Track.Kind.Audio) {
          next.audioTrack = null
          next.isMicEnabled = false
        }

        return { ...prev, [participant.identity]: next }
      })
    })

    // Track Muted
    room.on(RoomEvent.TrackMuted, (publication, participant) => {
      if (participant.isLocal) return
      const isScreen = publication.source === Track.Source.ScreenShare

      setParticipantTracks(prev => {
        const cur = prev[participant.identity]
        if (!cur) return prev
        const next = { ...cur }

        if (isScreen) {
          next.screenShareTrack = null
        } else if (publication.kind === Track.Kind.Video) {
          next.isCameraEnabled = false
        } else if (publication.kind === Track.Kind.Audio) {
          next.isMicEnabled = false
        }

        return { ...prev, [participant.identity]: next }
      })
    })

    // Track Unmuted
    room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
      if (participant.isLocal) return
      const isScreen = publication.source === Track.Source.ScreenShare

      setParticipantTracks(prev => {
        const cur = prev[participant.identity]
        if (!cur) return prev
        const next = { ...cur }

        if (isScreen) {
          next.screenShareTrack = publication.track
        } else if (publication.kind === Track.Kind.Video) {
          next.isCameraEnabled = true
          next.videoTrack = publication.track
        } else if (publication.kind === Track.Kind.Audio) {
          next.isMicEnabled = true
          next.audioTrack = publication.track
        }

        return { ...prev, [participant.identity]: next }
      })
    })

    // Local screen share track published
    room.on(RoomEvent.LocalTrackPublished, (publication) => {
      if (publication.source === Track.Source.ScreenShare) {
        screenShareTimesRef.current['local-screen'] = Date.now()
        setLocalScreenTrack(publication.videoTrack || publication.track)
        setIsScreenSharing(true)
      }
    })

    // Local screen share track ended via browser toolbar
    room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
      if (publication.source === Track.Source.ScreenShare) {
        if (!isChangingScreenShareRef.current) {
          delete screenShareTimesRef.current['local-screen']
          setLocalScreenTrack(null)
          setIsScreenSharing(false)
        }
      }
    })

    // Active speakers
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      setActiveSpeakers(speakers.map(s => s.identity))
    })

    // Audio Playback Status Changed (detect browser autoplay policies)
    room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      if (!room.canPlaybackAudio) {
        console.log("LiveKit: Audio autoplay blocked by browser, user click needed")
      }
    })

    // In-meeting Chat & Raise Hand via WebRTC DataChannel
    room.on(RoomEvent.DataReceived, (payload, participant) => {
      try {
        const decoded = JSON.parse(new TextDecoder().decode(payload))
        if (decoded.type === 'chat') {
          setChatMessages(prev => {
            const next = [...prev, decoded]
            saveStoredChatMessages(meetingId, next)
            return next
          })
          playChatMessageSound()
          if (!isChatOpen) {
            setUnreadChatCount(c => c + 1)
            triggerInRoomAlert('chat', `${decoded.sender}: ${decoded.text?.slice(0, 40)}${decoded.text?.length > 40 ? '...' : ''}`, 'chat')
          }
        } else if (decoded.type === 'raise_hand') {
          const pIdentity = participant ? participant.identity : decoded.userId
          setHandRaisedMap(prev => ({
            ...prev,
            [pIdentity]: decoded.isRaised
          }))
          if (decoded.isRaised) {
            playHandRaisedSound()
          }
        } else if (decoded.type === 'mute_participant') {
          const myIdentity = room.localParticipant?.identity
          if (decoded.targetUserId === 'ALL' || decoded.targetUserId === myIdentity) {
            // Agar target ALL bo'lsa va bu foydalanuvchi tashkilotchi bo'lsa, tashkilotchi o'zi o'chmaydi
            if (decoded.targetUserId === 'ALL' && isLocalHostRef.current) {
              return
            }
            if (isMicEnabledRef.current) {
              if (room.localParticipant) {
                const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone)
                if (micPub?.track) {
                  micPub.track.mediaStreamTrack?.stop()
                  room.localParticipant.unpublishTrack(micPub.track, true).catch(() => {})
                }
                room.localParticipant.setMicrophoneEnabled(false).catch(() => {})
                updateParticipantTrack(room.localParticipant.identity, { isMicEnabled: false })
              }
              setIsMicEnabled(false)
              isMicEnabledRef.current = false
              toast.warning("Mikrofon o'chirildi", "Tashkilotchi mikrofoningizni o'chirib qo'ydi")
              triggerInRoomAlert('mute', "Tashkilotchi mikrofoningizni o'chirdi", 'mute')
            }
          }
        } else if (decoded.type === 'turn_off_camera') {
          const myIdentity = room.localParticipant?.identity
          if (decoded.targetUserId === 'ALL' || decoded.targetUserId === myIdentity) {
            if (decoded.targetUserId === 'ALL' && isLocalHostRef.current) {
              return
            }
            if (isCameraEnabledRef.current) {
              if (room.localParticipant) {
                const camPub = room.localParticipant.getTrackPublication(Track.Source.Camera)
                if (camPub?.track) {
                  camPub.track.mediaStreamTrack?.stop()
                  room.localParticipant.unpublishTrack(camPub.track, true).catch(() => {})
                }
                room.localParticipant.setCameraEnabled(false).catch(() => {})
                updateParticipantTrack(room.localParticipant.identity, {
                  isCameraEnabled: false,
                  videoTrack: null
                })
              }
              setIsCameraEnabled(false)
              isCameraEnabledRef.current = false
              toast.warning("Kamera o'chirildi", "Tashkilotchi kamerangizni o'chirib qo'ydi")
              triggerInRoomAlert('mute', "Tashkilotchi kamerangizni o'chirdi", 'mute')
            }
          }
        } else if (decoded.type === 'ask_unmute') {
          const myIdentity = String(room.localParticipant?.identity || '')
          const targetId = String(decoded.targetUserId || '')
          const myUserId = String(user?.id || '')
          if (targetId && (targetId === myIdentity || targetId === myUserId || myIdentity.startsWith(targetId + '_') || targetId.startsWith(myIdentity + '_') || targetId === 'ALL')) {
            setUnmuteRequest({
              sender: decoded.sender || 'Tashkilotchi',
              timestamp: Date.now()
            })
            playKnockRequestSound()
            triggerInRoomAlert('bell', `${decoded.sender || 'Tashkilotchi'} mikrofoningizni yoqishingizni so'ramoqda`, 'knock')
          }
        } else if (decoded.type === 'ask_turn_on_camera') {
          const myIdentity = String(room.localParticipant?.identity || '')
          const targetId = String(decoded.targetUserId || '')
          const myUserId = String(user?.id || '')
          if (targetId && (targetId === myIdentity || targetId === myUserId || myIdentity.startsWith(targetId + '_') || targetId.startsWith(myIdentity + '_') || targetId === 'ALL')) {
            setTurnOnCameraRequest({
              sender: decoded.sender || 'Tashkilotchi',
              timestamp: Date.now()
            })
            playKnockRequestSound()
            triggerInRoomAlert('bell', `${decoded.sender || 'Tashkilotchi'} kamerangizni yoqishingizni so'ramoqda`, 'knock')
          }
        } else if (decoded.type === 'user_profile') {
          if (decoded.identity || decoded.userId) {
            setPeerProfiles(prev => ({
              ...prev,
              [decoded.identity]: decoded,
              ...(decoded.userId ? { [String(decoded.userId)]: decoded } : {}),
              ...(decoded.username ? { [decoded.username.toLowerCase()]: decoded } : {}),
              ...(decoded.name ? { [decoded.name.toLowerCase()]: decoded } : {})
            }))
          }
          if (decoded.isRequest) {
            broadcastMyProfile(room, false)
          }
        }
      } catch (err) {
        console.error("Data channel parslashda xato:", err)
      }
    })

    // Connection Quality Changed (Google Meet style network quality detection)
    room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      if (participant.isLocal) {
        if (quality === ConnectionQuality.Poor) {
          setNetworkStatus('poor')
        } else if (quality === ConnectionQuality.Lost) {
          setNetworkStatus('reconnecting')
        } else if (quality === ConnectionQuality.Good || quality === ConnectionQuality.Excellent) {
          setNetworkStatus(prev => (prev === 'poor' ? 'online' : prev))
        }
      }
    })

    // Reconnecting to LiveKit Media Server
    room.on(RoomEvent.Reconnecting, () => {
      setNetworkStatus('reconnecting')
    })

    // Reconnected successfully
    room.on(RoomEvent.Reconnected, () => {
      setNetworkStatus('online')
      setShowReconnectedBanner(true)
      setTimeout(() => setShowReconnectedBanner(false), 3500)
    })

    // Room disconnected
    room.on(RoomEvent.Disconnected, (reason) => {
      setIsConnectedToLiveKit(false)
      if (waitingState !== 'ended') {
        setWaitingState('ended')
        setEndedReason("Yig'ilishdan uzildingiz.")
      }
    })
  }

  const updateParticipantTrack = (identity, updates) => {
    setParticipantTracks(prev => ({
      ...prev,
      [identity]: { ...(prev[identity] || {}), ...updates }
    }))
  }

  // Cleanup LiveKit
  const leaveLiveKit = async () => {
    try {
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach(t => t.stop())
        previewStreamRef.current = null
      }
      if (roomRef.current) {
        // Barcha lokal oqimlarni hardware darajasida to'xtatamiz
        roomRef.current.localParticipant?.trackPublications?.forEach(pub => {
          if (pub.track?.mediaStreamTrack) {
            try {
              pub.track.mediaStreamTrack.stop()
              pub.track.stop()
            } catch {}
          }
        })
        await roomRef.current.disconnect()
        roomRef.current = null
      }
      setIsConnectedToLiveKit(false)
    } catch { }
  }
  leaveLiveKitRef.current = leaveLiveKit

  // 4. In-Room Collaboration Handlers
  const handleToggleMic = async () => {
    const next = !isMicEnabled
    setIsMicEnabled(next)
    if (roomRef.current?.localParticipant) {
      try {
        if (!next) {
          // Mikrofonni butunlay o'chirish: hardware darajasida to'xtatish
          const micPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.Microphone)
          if (micPub?.track) {
            micPub.track.mediaStreamTrack?.stop()
            await roomRef.current.localParticipant.unpublishTrack(micPub.track, true)
          }
          await roomRef.current.localParticipant.setMicrophoneEnabled(false)
        } else {
          // Mikrofonni yoqish
          await roomRef.current.localParticipant.setMicrophoneEnabled(true)
        }
      } catch (err) {
        console.warn("Mikrofonni almashtirishda xatolik:", err)
      }
      updateParticipantTrack(roomRef.current.localParticipant.identity, { isMicEnabled: next })
    }
  }

  const handleToggleCamera = async () => {
    const next = !isCameraEnabled
    setIsCameraEnabled(next)
    if (roomRef.current?.localParticipant) {
      try {
        if (!next) {
          // Kamerani butunlay o'chirish: webcam chirog'ini o'chirish va trackni stop qilish
          const camPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera)
          if (camPub?.track) {
            camPub.track.mediaStreamTrack?.stop()
            await roomRef.current.localParticipant.unpublishTrack(camPub.track, true)
          }
          await roomRef.current.localParticipant.setCameraEnabled(false)
          updateParticipantTrack(roomRef.current.localParticipant.identity, {
            isCameraEnabled: false,
            videoTrack: null
          })
        } else {
          // Kamerani yoqish
          await roomRef.current.localParticipant.setCameraEnabled(true)
          const vTrack = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack
          updateParticipantTrack(roomRef.current.localParticipant.identity, {
            isCameraEnabled: true,
            videoTrack: vTrack
          })
        }
      } catch (err) {
        console.warn("Kamerani almashtirishda xatolik:", err)
      }
    }
  }

  const handleStartScreenShare = async () => {
    try {
      if (roomRef.current?.localParticipant) {
        const publication = await roomRef.current.localParticipant.setScreenShareEnabled(true)
        const track = publication?.videoTrack || publication?.track || roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare)?.videoTrack
        setLocalScreenTrack(track)
        setIsScreenSharing(true)
        playScreenShareStartSound()
        triggerInRoomAlert('screen', "Ekranni ulashish boshlandi", 'screen')
        if (track?.mediaStreamTrack) {
          track.mediaStreamTrack.onended = () => {
            if (!isChangingScreenShareRef.current) {
              handleStopScreenShare()
            }
          }
        }
      }
    } catch (err) {
      console.warn("Ekran ulashish bekor qilindi yoki xato:", err)
      setLocalScreenTrack(null)
      setIsScreenSharing(false)
    }
  }

  const handleStopScreenShare = async () => {
    try {
      if (roomRef.current?.localParticipant) {
        const currentPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare)
        if (currentPub?.track) {
          if (currentPub.track.mediaStreamTrack) {
            currentPub.track.mediaStreamTrack.onended = null
            currentPub.track.mediaStreamTrack.stop()
          }
          await roomRef.current.localParticipant.unpublishTrack(currentPub.track, true)
        }

        const audioPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShareAudio)
        if (audioPub?.track) {
          audioPub.track.mediaStreamTrack?.stop()
          await roomRef.current.localParticipant.unpublishTrack(audioPub.track, true)
        }

        await roomRef.current.localParticipant.setScreenShareEnabled(false)
      }
    } catch (err) {
      console.warn("Ekran ulashishni to'xtatishda xato:", err)
    } finally {
      playScreenShareStopSound()
      triggerInRoomAlert('screen_stop', "Ekran ulashuvi to'xtatildi", 'screen_stop')
      delete screenShareTimesRef.current['local-screen']
      setLocalScreenTrack(null)
      setIsScreenSharing(false)
    }
  }

  const handleChangeScreenShare = async () => {
    if (!roomRef.current?.localParticipant) return

    let stream = null
    try {
      // 1. Yangi oyna yoki ekranni tanlash dialogini ochamiz.
      // Eslatma: Foydalanuvchi yangi oyna/ekranni tanlab tasdiqlamaguncha oldingi ekran to'xtatilmaydi
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })
    } catch (err) {
      // Agar foydalanuvchi "Bekor qilish" (Cancel) ni bossa, oldingi ekran hech qanday uzilishsiz davom etadi
      console.log("Ekran tanlash bekor qilindi:", err)
      return
    }

    const newMediaStreamTrack = stream?.getVideoTracks()?.[0]
    if (!newMediaStreamTrack) return

    isChangingScreenShareRef.current = true

    try {
      const currentPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare)
      const currentTrack = currentPub?.videoTrack || currentPub?.track

      // 2. Oldingi MediaStreamTrack ni saqlaymiz va uning onended hodisasini DARHOL tozalaymiz
      const oldMediaStreamTrack = currentTrack?.mediaStreamTrack
      if (oldMediaStreamTrack) {
        oldMediaStreamTrack.onended = null
      }

      // 3. Yangi MediaStreamTrack uchun onended o'rnatamiz
      newMediaStreamTrack.onended = () => {
        if (!isChangingScreenShareRef.current) {
          handleStopScreenShare()
        }
      }

      if (currentTrack && typeof currentTrack.replaceTrack === 'function' && currentTrack.sender) {
        // 4. LiveKit LocalVideoTrack orqali WebRTC sender'ga yangi trackni o'rnatamiz
        await currentTrack.replaceTrack(newMediaStreamTrack, { userProvidedTrack: false })

        // 5. Oldingi trackni BUTUNLAY to'xtatamiz!
        // Bu orqali brauzerdagi 2-chi ortiqcha "sharing" paneli darhol yo'qoladi va xatoliklar bartaraf bo'ladi
        if (oldMediaStreamTrack && oldMediaStreamTrack !== newMediaStreamTrack) {
          try {
            oldMediaStreamTrack.stop()
          } catch (e) {
            console.warn("Eski trackni to'xtatishda xato:", e)
          }
        }

        screenShareTimesRef.current['local-screen'] = Date.now()
        setLocalScreenTrack(currentTrack)
        setIsScreenSharing(true)
        setScreenShareVersion(v => v + 1)
        triggerInRoomAlert('screen', "Ekran muvaffaqiyatli almashtirildi", 'screen')
      } else {
        // Zaxira: replaceTrack bo'lmaganda
        if (oldMediaStreamTrack) {
          try {
            oldMediaStreamTrack.stop()
          } catch (e) {}
        }
        if (currentTrack) {
          await roomRef.current.localParticipant.unpublishTrack(currentTrack, true)
        }
        const publication = await roomRef.current.localParticipant.publishTrack(newMediaStreamTrack, {
          source: Track.Source.ScreenShare,
          name: 'screen'
        })
        const track = publication?.videoTrack || publication?.track
        screenShareTimesRef.current['local-screen'] = Date.now()
        setLocalScreenTrack(track)
        setIsScreenSharing(true)
        newMediaStreamTrack.onended = () => {
          if (!isChangingScreenShareRef.current) {
            handleStopScreenShare()
          }
        }
        setScreenShareVersion(v => v + 1)
        triggerInRoomAlert('screen', "Ekran muvaffaqiyatli almashtirildi", 'screen')
      }
    } catch (err) {
      console.error("Ekranni almashtirishda xatolik:", err)
      try {
        newMediaStreamTrack.stop()
      } catch (e) {}
    } finally {
      // 1 soniya kutib, so'ng flagni false qilamiz, shunda eski trackning qoldiq hodisalari xalaqit bermaydi
      setTimeout(() => {
        isChangingScreenShareRef.current = false
      }, 1000)
    }
  }

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await handleStopScreenShare()
    } else {
      await handleStartScreenShare()
    }
  }

  const handleToggleHandRaise = async () => {
    const next = !isHandRaised
    setIsHandRaised(next)
    if (next) {
      playHandRaisedSound()
    }
    if (roomRef.current?.localParticipant) {
      const data = {
        type: 'raise_hand',
        isRaised: next,
        sender: currentUserName,
        userId: roomRef.current.localParticipant.identity
      }
      const payload = new TextEncoder().encode(JSON.stringify(data))
      await roomRef.current.localParticipant.publishData(payload, { reliable: true })
      setHandRaisedMap(prev => ({
        ...prev,
        [roomRef.current.localParticipant.identity]: next
      }))
    }
  }

  const handleSendMessage = async (text) => {
    const messageData = {
      type: 'chat',
      text,
      sender: currentUserName,
      avatar: formatAvatarUrl(user?.avatar) || user?.avatar || '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    playChatMessageSound()
    setChatMessages(prev => {
      const next = [...prev, messageData]
      saveStoredChatMessages(meetingId, next)
      return next
    })

    if (roomRef.current?.localParticipant) {
      const payload = new TextEncoder().encode(JSON.stringify(messageData))
      await roomRef.current.localParticipant.publishData(payload, { reliable: true })
    }
  }

  // 5. Host Actions (Admit / Reject / End for all)
  const handleAdmitUser = async (userId) => {
    // Send over WebSocket
    sendWs({
      action: 'admit',
      user_id: userId,
      decision: 'approve'
    })

    // REST fallback
    try {
      await axiosAPI.post(`/meetings/${meetingId}/admit/`, {
        user_id: userId,
        decision: 'approve'
      })
    } catch { }

    setKnockRequests(prev => prev.filter(k => k.user_id !== userId))
    toast.success("Tasdiqlandi", "Foydalanuvchiga yig'ilishga kirishga ruxsat berildi")
  }

  const handleRejectUser = async (userId) => {
    sendWs({
      action: 'admit',
      user_id: userId,
      decision: 'reject'
    })

    try {
      await axiosAPI.post(`/meetings/${meetingId}/admit/`, {
        user_id: userId,
        decision: 'reject'
      })
    } catch { }

    setKnockRequests(prev => prev.filter(k => k.user_id !== userId))
    toast.error("Rad etildi", "Foydalanuvchining kirish so'rovi rad etildi")
  }

  // Tashkilotchi (Host) tomonidan ishtirokchi mikrofonini o'chirish (Mute)
  const handleMuteParticipant = async (targetIdentity) => {
    if (!isLocalHost) return
    try {
      const payload = new TextEncoder().encode(JSON.stringify({
        type: 'mute_participant',
        targetUserId: targetIdentity,
        sender: currentUserName,
      }))
      await roomRef.current?.localParticipant?.publishData(payload, { reliable: true })
      toast.success("Ovoz o'chirildi", "Ishtirokchi mikrofoni o'chirildi")
      setParticipantTracks(prev => {
        if (!prev[targetIdentity]) return prev
        return {
          ...prev,
          [targetIdentity]: { ...prev[targetIdentity], isMicEnabled: false }
        }
      })
    } catch (err) {
      console.error("Mute yuborishda xato:", err)
      toast.error("Xatolik", "Ovozni o'chirishda muammo yuz berdi")
    }
  }

  // Tashkilotchi (Host) tomonidan ishtirokchi kamerasini o'chirish
  const handleTurnOffCamera = async (targetIdentity) => {
    if (!isLocalHost) return
    try {
      const payload = new TextEncoder().encode(JSON.stringify({
        type: 'turn_off_camera',
        targetUserId: targetIdentity,
        sender: currentUserName,
      }))
      await roomRef.current?.localParticipant?.publishData(payload, { reliable: true })
      toast.success("Kamera o'chirildi", "Ishtirokchi kamerasi o'chirildi")
      setParticipantTracks(prev => {
        if (!prev[targetIdentity]) return prev
        return {
          ...prev,
          [targetIdentity]: { ...prev[targetIdentity], isCameraEnabled: false, videoTrack: null }
        }
      })
    } catch (err) {
      console.error("Kamerani o'chirishda xato:", err)
      toast.error("Xatolik", "Kamerani o'chirishda muammo yuz berdi")
    }
  }

  // Tashkilotchi tomonidan barcha ishtirokchilar mikrofonini o'chirish (Mute All)
  const handleMuteAllParticipants = async () => {
    if (!isLocalHost) return
    try {
      const payload = new TextEncoder().encode(JSON.stringify({
        type: 'mute_participant',
        targetUserId: 'ALL',
        sender: currentUserName,
      }))
      await roomRef.current?.localParticipant?.publishData(payload, { reliable: true })
      toast.success("Barchasi o'chirildi", "Barcha ishtirokchilar mikrofoni o'chirildi")
      setParticipantTracks(prev => {
        const next = { ...prev }
        Object.keys(next).forEach(k => {
          if (!next[k].isLocal) {
            next[k] = { ...next[k], isMicEnabled: false }
          }
        })
        return next
      })
    } catch (err) {
      console.error("Mute All yuborishda xato:", err)
    }
  }

  // Tashkilotchi tomonidan mikrofonni yoqish so'rovini yuborish (Ask to Unmute)
  const handleAskUnmuteParticipant = async (targetIdentity) => {
    if (!isLocalHost) return
    try {
      const payload = new TextEncoder().encode(JSON.stringify({
        type: 'ask_unmute',
        targetUserId: targetIdentity,
        sender: currentUserName,
      }))
      await roomRef.current?.localParticipant?.publishData(payload, { reliable: true })
      toast.info("So'rov yuborildi", "Ishtirokchiga mikrofonni yoqish taklifi yuborildi")
    } catch (err) {
      console.error("Ask to unmute yuborishda xato:", err)
      toast.error("Xatolik", "Mikrofonni yoqish so'rovini yuborishda muammo yuz berdi")
    }
  }

  // Tashkilotchi tomonidan kamerani yoqish so'rovini yuborish (Ask to Turn on Camera)
  const handleAskTurnOnCamera = async (targetIdentity) => {
    if (!isLocalHost) return
    try {
      const payload = new TextEncoder().encode(JSON.stringify({
        type: 'ask_turn_on_camera',
        targetUserId: targetIdentity,
        sender: currentUserName,
      }))
      await roomRef.current?.localParticipant?.publishData(payload, { reliable: true })
      toast.info("So'rov yuborildi", "Ishtirokchiga kamerani yoqish taklifi yuborildi")
    } catch (err) {
      console.error("Ask to turn on camera yuborishda xato:", err)
      toast.error("Xatolik", "Kamerani yoqish so'rovini yuborishda muammo yuz berdi")
    }
  }

  const handleEndMeetingForAll = async () => {
    try {
      await axiosAPI.post(`/meetings/${meetingId}/close/`)
      clearStoredChatMessages(meetingId)
      setChatMessages([])
      toast.success("Yig'ilish yakunlandi", "Barcha qatnashchilar uchun yig'ilish to'xtatildi")
      leaveLiveKit()
      setWaitingState('ended')
    } catch (err) {
      console.error(err)
      toast.error("Xatolik", "Yig'ilishni to'xtatishda xatolik")
    }
  }

  const handleLeaveMeeting = () => {
    leaveLiveKit()
    if (wsRef.current) {
      wsRef.current.close()
    }
    clearStoredChatMessages(meetingId)
    setWaitingState('left')
  }

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  // Combine participants for rendering
  const allParticipantItems = []

  // 1. Local Screen Share (if sharing screen)
  if (roomRef.current?.localParticipant && isScreenSharing) {
    const trackToRender = localScreenTrack || roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare)?.videoTrack
    if (trackToRender) {
      allParticipantItems.push({
        identity: `${roomRef.current.localParticipant.identity}-screen`,
        name: `${currentUserName} (Ekran)`,
        isLocal: true,
        isScreenShare: true,
        videoTrack: trackToRender,
        audioTrack: null,
        isCameraEnabled: true,
        isMicEnabled: false,
        isSpeaking: false,
        hasHandRaised: false,
        isHost: false,
        version: screenShareVersion,
        shareTime: screenShareTimesRef.current['local-screen'] || 0,
      })
    }
  }

  // 2. Remote Screen Shares (if any remote participant shares screen)
  remoteParticipants
    .filter(rp => rp.identity !== roomRef.current?.localParticipant?.identity)
    .forEach(rp => {
    const rInfo = participantTracks[rp.identity] || {}
    if (rInfo.screenShareTrack) {
      allParticipantItems.push({
        identity: `${rp.identity}-screen-${rInfo.screenShareTrack.sid || rInfo.screenShareTrack.id || 'remote'}`,
        name: `${rp.name || rp.identity} (Ekran)`,
        isLocal: false,
        isScreenShare: true,
        videoTrack: rInfo.screenShareTrack,
        audioTrack: null,
        isCameraEnabled: true,
        isMicEnabled: false,
        isSpeaking: false,
        hasHandRaised: false,
        isHost: false,
        shareTime: screenShareTimesRef.current[rp.identity] || 0,
      })
    }
  })

  const meetingOrganizerId = getMeetingOrganizerId(meetingDetails, meetingState)
  // Faqat va faqat yig'ilishni yaratgan foydalanuvchi (organizer) host bo'ladi.
  // Role (admin, superadmin) dan qat'iy nazar, faqat user.id === organizerId bo'lgandagina true bo'ladi!
  const isLocalHost = Boolean(
    user?.id &&
    meetingOrganizerId &&
    String(user.id) === String(meetingOrganizerId)
  )

  useEffect(() => {
    isLocalHostRef.current = isLocalHost
  }, [isLocalHost])

  // Loyiha menejeri ID si (agar yig'ilish loyihaga tegishli bo'lsa)
  const projectManagerId = (
    projectData?.manager?.id ??
    projectData?.manager_info?.id ??
    (typeof projectData?.manager === 'number' || typeof projectData?.manager === 'string' ? projectData.manager : null) ??
    meetingDetails?.project_info?.manager?.id ??
    meetingDetails?.project_info?.manager_info?.id ??
    (typeof meetingDetails?.project_info?.manager === 'number' || typeof meetingDetails?.project_info?.manager === 'string' ? meetingDetails.project_info.manager : null) ??
    meetingDetails?.project?.manager?.id ??
    meetingDetails?.project?.manager_info?.id ??
    (typeof meetingDetails?.project?.manager === 'number' || typeof meetingDetails?.project?.manager === 'string' ? meetingDetails.project.manager : null)
  )

  const isProjectManager = Boolean(
    user?.id &&
    projectManagerId &&
    String(user.id) === String(projectManagerId)
  )

  const isAdminOrSuperadmin = Boolean(
    user?.is_superuser ||
    user?.is_staff ||
    user?.role === 'admin' ||
    user?.role === 'superadmin' ||
    user?.active_role === 'admin' ||
    user?.active_role === 'superadmin' ||
    user?.roles?.includes?.('admin') ||
    user?.roles?.includes?.('superadmin')
  )

  // Ishtirokchini qabul qilish / rad etish huquqi:
  // 1) Yig'ilish tashkilotchisi (organizer)
  // 2) Admin va Superadminlar
  // 3) Loyiha menejeri (agar loyiha bo'yicha yig'ilish bo'lsa)
  const canAdmitParticipants = Boolean(
    isLocalHost ||
    isAdminOrSuperadmin ||
    isProjectManager
  )

  useEffect(() => {
    canAdmitParticipantsRef.current = canAdmitParticipants
  }, [canAdmitParticipants])

  // Xonada allaqachon mavjud bo'lgan (boshqa admin qabul qilgan) foydalanuvchilarning knock so'rovlarini tozalash
  useEffect(() => {
    if (knockRequests.length === 0 || remoteParticipants.length === 0) return
    setKnockRequests(prev => {
      const filtered = prev.filter(req => !isParticipantInRoom(req, remoteParticipants))
      return filtered.length !== prev.length ? filtered : prev
    })
  }, [remoteParticipants, knockRequests.length])

  // Xonaga hali kirmagan faol knock so'rovlari (avatarlarini to'liq qidirib topish)
  const activeKnockRequests = knockRequests
    .filter(req => !isParticipantInRoom(req, remoteParticipants))
    .map(req => {
      let resolvedAvatar = req.avatar
      if (!resolvedAvatar) {
        const dMatch = directoryUsers?.find(u => String(u.id) === String(req.user_id))
        const pMatch = meetingDetails?.participants_info?.find(u => String(u.id) === String(req.user_id))
        resolvedAvatar = dMatch?.avatar || pMatch?.avatar || ''
      }
      return {
        ...req,
        avatar: formatAvatarUrl(resolvedAvatar) || resolvedAvatar || ''
      }
    })

  // 3. Local Participant Camera tile
  if (roomRef.current?.localParticipant) {
    const localId = roomRef.current.localParticipant.identity
    const localInfo = participantTracks[localId] || {}
    allParticipantItems.push({
      identity: localId,
      name: currentUserName,
      avatar: formatAvatarUrl(user?.avatar) || user?.avatar || '',
      isLocal: true,
      isScreenShare: false,
      isHost: isLocalHost,
      isSpeaking: activeSpeakers.includes(localId),
      hasHandRaised: !!handRaisedMap[localId] || isHandRaised,
      isCameraEnabled: isCameraEnabled,
      isMicEnabled: isMicEnabled,
      videoTrack: localInfo.videoTrack || roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack,
      audioTrack: null,
    })
  }

  // 4. Remote Participants Camera tiles
  remoteParticipants
    .filter(rp => rp.identity !== roomRef.current?.localParticipant?.identity)
    .forEach(rp => {
    const rInfo = participantTracks[rp.identity] || {}
    const rpIsHost = checkIsHost(rp, rp.identity, rp.name || rInfo.name)
    const rpAvatar = formatAvatarUrl(resolveParticipantAvatar(rp, rInfo))
    allParticipantItems.push({
      identity: rp.identity,
      name: rp.name || rp.identity,
      avatar: rpAvatar,
      isLocal: false,
      isScreenShare: false,
      isHost: rpIsHost,
      isSpeaking: activeSpeakers.includes(rp.identity),
      hasHandRaised: !!handRaisedMap[rp.identity],
      isCameraEnabled: rInfo.isCameraEnabled ?? rp.isCameraEnabled,
      isMicEnabled: rInfo.isMicEnabled ?? rp.isMicrophoneEnabled,
      videoTrack: rInfo.videoTrack,
      audioTrack: rInfo.audioTrack,
    })
  })

  const screenShareItems = allParticipantItems.filter(p => p.isScreenShare)
  const cameraItems = allParticipantItems.filter(p => !p.isScreenShare)
  const handRaisedParticipants = allParticipantItems.filter(p => p.hasHandRaised && !p.isScreenShare)
  const firstHandRaiser = handRaisedParticipants[0]
  const handRaisedNotificationText = handRaisedParticipants.length > 0
    ? handRaisedParticipants.length > 1
      ? `${firstHandRaiser.name || (firstHandRaiser.isLocal ? 'Siz' : 'Ishtirokchi')} va yana ${handRaisedParticipants.length - 1} kishi qo'l ko'tardi`
      : `${firstHandRaiser.name || (firstHandRaiser.isLocal ? 'Siz' : 'Ishtirokchi')} qo'l ko'tardi`
    : ''

  // Sort screen shares by start time ascending (latest screen share is at the end)
  const sortedScreenShares = [...screenShareItems].sort((a, b) => (a.shareTime || 0) - (b.shareTime || 0))
  const latestScreenShare = sortedScreenShares.length > 0 ? sortedScreenShares[sortedScreenShares.length - 1] : null

  // Screen Focus Mode (client-side only for current user)
  const isScreenFocused = Boolean(
    screenFocusId &&
    allParticipantItems.some(p => p.identity === screenFocusId && p.isScreenShare)
  )

  // Auto-reset screen focus if that screen share stops
  useEffect(() => {
    if (screenFocusId) {
      const stillActive = allParticipantItems.some(p => p.identity === screenFocusId && p.isScreenShare)
      if (!stillActive) {
        setScreenFocusId(null)
      }
    }
  }, [screenFocusId, allParticipantItems])

  // Escape key listener to exit full screen focus mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && screenFocusId) {
        setScreenFocusId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [screenFocusId])

  // Global Keyboard Shortcuts (Ctrl+D: Mic, Ctrl+E: Camera, Ctrl+Alt+H: Hand, Ctrl+L: Chat)
  useEffect(() => {
    const handleMeetingShortcuts = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey
      if (!isCtrlOrCmd) return

      const key = (e.key || '').toLowerCase()

      // 1. Ctrl + D -> Mikrofonni yoqish / o'chirish
      if (!e.altKey && !e.shiftKey && key === 'd') {
        e.preventDefault()
        e.stopPropagation()
        if (waitingState === 'in_room') {
          handleToggleMic()
        } else if (waitingState === 'lobby') {
          handleToggleLobbyMic()
        }
        return
      }

      // 2. Ctrl + E -> Kamerani yoqish / o'chirish
      if (!e.altKey && !e.shiftKey && key === 'e') {
        e.preventDefault()
        e.stopPropagation()
        if (waitingState === 'in_room') {
          handleToggleCamera()
        } else if (waitingState === 'lobby') {
          handleToggleLobbyCamera()
        }
        return
      }

      // 3. Ctrl + Alt + H -> Qo'l ko'tarish / tushirish (faqat in_room da)
      if (e.altKey && !e.shiftKey && key === 'h') {
        e.preventDefault()
        e.stopPropagation()
        if (waitingState === 'in_room') {
          handleToggleHandRaise()
        }
        return
      }

      // 4. Ctrl + L -> Chatni ochish / yopish (faqat in_room da)
      if (!e.altKey && !e.shiftKey && key === 'l') {
        e.preventDefault()
        e.stopPropagation()
        if (waitingState === 'in_room') {
          if (isScreenFocused) setScreenFocusId(null)
          setIsChatOpen(prev => {
            const next = !prev
            if (next) {
              setIsParticipantsOpen(false)
              setIsDetailsOpen(false)
              setUnreadChatCount(0)
            }
            return next
          })
        }
        return
      }
    }

    window.addEventListener('keydown', handleMeetingShortcuts)
    return () => window.removeEventListener('keydown', handleMeetingShortcuts)
  }, [
    waitingState,
    handleToggleMic,
    handleToggleCamera,
    handleToggleLobbyMic,
    handleToggleLobbyCamera,
    handleToggleHandRaise,
    isScreenFocused
  ])

  const handleToggleScreenFocus = (identity) => {
    withViewTransition(() => {
      setScreenFocusId(prev => (prev === identity ? null : identity))
    })
  }

  // Pinned item (client-side only for current user)
  const pinnedItem = pinnedId ? allParticipantItems.find(p => p.identity === pinnedId) : null

  let mainStageItem = null
  let sideRailItems = []

  if (isScreenFocused) {
    // 1. Shared screen full screen focus mode (client-side only for current user)
    mainStageItem = allParticipantItems.find(p => p.identity === screenFocusId && p.isScreenShare) || latestScreenShare
    sideRailItems = []
  } else if (pinnedItem) {
    // 2. User pinned an item explicitly (client-side only)
    mainStageItem = pinnedItem
    const otherScreenShares = sortedScreenShares.filter(s => s.identity !== pinnedItem.identity)
    const otherCameras = cameraItems.filter(c => c.identity !== pinnedItem.identity)
    sideRailItems = [...otherScreenShares, ...otherCameras]
  } else if (latestScreenShare) {
    // 3. Multiple or single screen shares active: main stage shows latest screen share
    mainStageItem = latestScreenShare
    const otherScreenShares = sortedScreenShares.filter(s => s.identity !== latestScreenShare.identity)
    sideRailItems = [...otherScreenShares, ...cameraItems]
  } else {
    // 4. No screen share and no pin -> pure balanced camera grid
    mainStageItem = null
    sideRailItems = []
  }

  const handleTogglePin = (identity) => {
    withViewTransition(() => {
      setPinnedId(prev => (prev === identity ? null : identity))
    })
  }

  // Render Waiting Room / Google Meet Lobby state
  if (
    waitingState === 'lobby' ||
    waitingState === 'connecting' ||
    waitingState === 'waiting_organizer' ||
    waitingState === 'waiting_approval' ||
    waitingState === 'rejected'
  ) {
    return (
      <WaitingRoom
        title={meetingDetails?.title || meetingState?.title || "Yig'ilish"}
        meetingDetails={meetingDetails}
        meetingState={meetingState}
        meetingId={meetingId}
        projectData={projectData}
        waitingState={waitingState}
        isRejected={waitingState === 'rejected'}
        rejectedMessage={rejectedMessage}
        localStream={localStream}
        isCameraEnabled={isCameraEnabled}
        onToggleCamera={handleToggleLobbyCamera}
        isMicEnabled={isMicEnabled}
        onToggleMic={handleToggleLobbyMic}
        onJoinMeeting={handleJoinFromLobby}
        isJoining={isJoining}
        onCancelWait={handleCancelWait}
        onLeave={() => navigate(-1)}
        user={user}
      />
    )
  }

  // Render Meeting Left / Ended state matching Figma Images 3 & 4
  if (waitingState === 'ended' || waitingState === 'left') {
    const isMeetingEnded = waitingState === 'ended'

    return (
      <div className="fixed inset-0 w-full h-full bg-[#F8FAFC] dark:bg-[#0B0D11] text-slate-900 dark:text-white flex flex-col items-center justify-center p-4 select-none z-50 transition-colors animate-in fade-in duration-300">
        <div className="text-center max-w-lg w-full my-auto flex flex-col items-center animate-in zoom-in-95 duration-200">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {isMeetingEnded ? "Yig'ilish yakunlandi" : "Siz uchrashuvdan chiqdingiz"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 mb-7 text-center">
            {isMeetingEnded
              ? (endedReason || "Yig'ilish tashkilotchi tomonidan yakunlandi.")
              : "Havola hali ham amal qiladi — istagan vaqtda qaytishingiz mumkin."}
          </p>
          <div className="flex items-center justify-center gap-3">
            {!isMeetingEnded && (
              <button
                type="button"
                onClick={() => {
                  window.location.reload()
                }}
                className="px-5 py-2.5 rounded-xl bg-[#3E5CBA] hover:bg-[#344F9F] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
              >
                <HugeiconsIcon icon={Refresh04Icon} size={17} strokeWidth={2.2} />
                <span>Qayta qo'shilish</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                clearStoredChatMessages(meetingId)
                navigate('/')
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/15 bg-white dark:bg-black text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs"
            >
              <HugeiconsIcon icon={Home04Icon} size={17} strokeWidth={2.2} />
              <span>Bosh sahifaga</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render Active In-Room Video Conference
  return (
    <div
      onClick={() => {
        if (roomRef.current && !roomRef.current.canPlaybackAudio) {
          roomRef.current.startAudio().catch(() => {})
        }
      }}
      className="fixed inset-0 w-full h-full bg-white dark:bg-[#16191F] text-slate-900 dark:text-white overflow-hidden flex flex-col select-none z-50 transition-colors"
    >
      {/* Google Meet style Network Status Alerts */}
      {(networkStatus === 'reconnecting' || networkStatus === 'offline') && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto">
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-950/95 border border-red-500/50 text-red-200 text-xs sm:text-sm font-medium shadow-2xl shadow-red-950/80 backdrop-blur-xl">
            <RiSignalWifiOffFill className="text-xl text-red-400 shrink-0 animate-pulse" />
            <span>
              {networkStatus === 'offline'
                ? 'Siz tarmoqdan uzildingiz. Internet aloqasi mavjud emas.'
                : 'Internet aloqasi uzildi. Qayta ulanmoqda...'}
            </span>
            <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin shrink-0" />
          </div>
        </div>
      )}

      {networkStatus === 'poor' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-medium shadow-xl backdrop-blur-xl">
            <RiSignalWifi1Fill className="text-xl text-amber-400 shrink-0" />
            <span>Internet aloqasi beqaror. Ovoz va video uzatishda uzilishlar bo'lishi mumkin.</span>
          </div>
        </div>
      )}

      {showReconnectedBanner && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto">
          <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-medium shadow-xl backdrop-blur-xl">
            <RiSignalWifiFill className="text-xl text-emerald-400 shrink-0" />
            <span>Internet aloqasi qayta tiklandi.</span>
          </div>
        </div>
      )}

      {/* Knock Request Banner for Host, Admin, Superadmin, Project Manager */}
      {canAdmitParticipants && (
        <KnockBanner
          requests={activeKnockRequests}
          onAdmit={handleAdmitUser}
          onReject={handleRejectUser}
        />
      )}

      {/* In-Room Dynamic Alert Banner with smooth slide/fade animations */}
      {inRoomAlert && inRoomAlert.type !== 'hand' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-xl border text-xs sm:text-sm font-semibold shadow-2xl transition-all duration-300 ${
            inRoomAlert.type === 'hand'
              ? 'bg-amber-950/90 border-amber-500/50 text-amber-200 shadow-amber-500/20'
              : inRoomAlert.type === 'join'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-500/20'
              : inRoomAlert.type === 'screen'
              ? 'bg-blue-950/90 border-blue-500/50 text-blue-200 shadow-blue-500/20'
              : inRoomAlert.type === 'screen_stop'
              ? 'bg-slate-900/95 border-slate-700 text-slate-200 shadow-black/50'
              : inRoomAlert.type === 'knock'
              ? 'bg-orange-950/90 border-orange-500/50 text-orange-200 shadow-orange-500/20'
              : inRoomAlert.type === 'chat'
              ? 'bg-purple-950/90 border-purple-500/50 text-purple-200 shadow-purple-500/20'
              : inRoomAlert.type === 'mute'
              ? 'bg-red-950/90 border-red-500/50 text-red-200 shadow-red-500/20'
              : 'bg-[#1C1F26]/95 border-white/15 text-white shadow-black/50'
          }`}>
            <span className="flex items-center justify-center shrink-0">
              {renderAlertIcon(inRoomAlert.icon, inRoomAlert.type)}
            </span>
            <span>{inRoomAlert.text}</span>
          </div>
        </div>
      )}

      {/* Persistent Global Remote Audio Players (Uninterrupted audio playback regardless of full-screen focus or tile layout) */}
      <div className="hidden pointer-events-none opacity-0 w-0 h-0" aria-hidden="true">
        {remoteParticipants.map((rp) => {
          const rInfo = participantTracks[rp.identity] || {}
          const micTrack = rInfo.audioTrack || rp.getTrackPublication(Track.Source.Microphone)?.audioTrack
          const isMicEnabled = rInfo.isMicEnabled ?? rp.isMicrophoneEnabled ?? true

          const screenAudioPub = rp.getTrackPublication(Track.Source.ScreenShareAudio)
          const screenAudioTrack = screenAudioPub?.audioTrack

          return (
            <div key={`remote-audio-wrapper-${rp.identity}`}>
              <RemoteAudioPlayer
                audioTrack={micTrack}
                isMicEnabled={isMicEnabled}
              />
              {screenAudioTrack && (
                <RemoteAudioPlayer
                  audioTrack={screenAudioTrack}
                  isMicEnabled={!screenAudioPub?.isMuted}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Floating Screen Share Banner matching Screenshot 3 & 4 */}
      {isScreenSharing && (
        <div className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 pl-3.5 sm:pl-4 pr-1.5 py-1.5 rounded-full bg-white dark:bg-[#151922] border border-slate-200/90 dark:border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.14)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] animate-in fade-in slide-in-from-top-3 duration-200 select-none">
          <div className="text-[#EA3323] flex items-center justify-center">
            <HugeiconsIcon icon={ScreenShareIcon} size={20} strokeWidth={2} />
          </div>
          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">
            Siz ekranni ulashyapsiz
          </span>
          <button
            type="button"
            onClick={handleStopScreenShare}
            className="px-3.5 sm:px-4 py-1.5 rounded-full bg-[#EA3323] hover:bg-red-600 text-white text-xs sm:text-sm font-bold cursor-pointer transition-all active:scale-95 shadow-xs"
          >
            To'xtatish
          </button>
        </div>
      )}

      {/* Top Header Bar matching Figma screenshots */}
      {!isScreenFocused && (
        <header className={`relative ${mainStageItem ? 'h-11 sm:h-12' : 'h-13 sm:h-14'} px-3 sm:px-6 flex items-center justify-between bg-transparent z-20 shrink-0 select-none`}>
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Realtime Elapsed Meeting Duration (e.g. 05:23 or 01:15:30) */}
            <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 select-none tabular-nums font-mono">
              {currentTime}
            </span>

            {/* Meeting Name */}
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-md">
              {meetingDetails?.title || meetingState?.title || "Meet nomi"}
            </h2>

            {/* Info Circle Button */}
            <button
              type="button"
              onClick={() => {
                setIsDetailsOpen((prev) => {
                  const next = !prev
                  if (next) {
                    setIsChatOpen(false)
                    setIsParticipantsOpen(false)
                  }
                  return next
                })
              }}
              title="Yig'ilish tafsilotlari"
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isDetailsOpen
                  ? 'text-blue-600 dark:text-blue-400 scale-110'
                  : 'text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <HugeiconsIcon icon={InformationCircleIcon} size={18} strokeWidth={2} />
            </button>

            {/* Network Quality Indicator (specifically kept as requested with Barqaror / Past) */}
            <div
              className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-medium transition-all select-none shadow-2xs ${
                networkStatus === 'reconnecting' || networkStatus === 'offline'
                  ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'
                  : networkStatus === 'poor'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400'
              }`}
              title={
                networkStatus === 'offline'
                  ? "Internet aloqasi: Uzildi (Tarmoq mavjud emas)"
                  : networkStatus === 'reconnecting'
                  ? "Internet aloqasi: Qayta ulanmoqda..."
                  : networkStatus === 'poor'
                  ? "Internet aloqasi: Past (Zaif aloqa)"
                  : "Internet aloqasi: Barqaror (A'lo darajada)"
              }
            >
              {/* Mini signal strength bars */}
              <div className="flex items-end gap-[2px] h-3">
                <span className={`w-[3px] rounded-full transition-colors ${
                  networkStatus === 'reconnecting' || networkStatus === 'offline'
                    ? 'h-1.5 bg-red-500 animate-pulse'
                    : networkStatus === 'poor'
                    ? 'h-1.5 bg-amber-500'
                    : 'h-1.5 bg-emerald-500'
                }`} />
                <span className={`w-[3px] rounded-full transition-colors ${
                  networkStatus === 'reconnecting' || networkStatus === 'offline'
                    ? 'h-2 bg-slate-300 dark:bg-slate-700'
                    : networkStatus === 'poor'
                    ? 'h-2 bg-amber-500'
                    : 'h-2 bg-emerald-500'
                }`} />
                <span className={`w-[3px] rounded-full transition-colors ${
                  networkStatus === 'online'
                    ? 'h-3 bg-emerald-500'
                    : 'h-3 bg-slate-300 dark:bg-slate-700'
                }`} />
              </div>

              <span className="text-[11px] font-semibold tracking-tight">
                {networkStatus === 'offline'
                  ? 'Uzildi'
                  : networkStatus === 'reconnecting'
                  ? 'Ulanmoqda'
                  : networkStatus === 'poor'
                  ? 'Past'
                  : 'Barqaror'}
              </span>
            </div>
          </div>

          {/* Center: Hand Raised Pill Notification matching Screenshot 1 & 2 */}
          {handRaisedParticipants.length > 0 && !isScreenSharing && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5270D0] dark:bg-[#394975] text-white text-xs sm:text-sm font-medium shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 z-30 select-none pointer-events-none">
              <HugeiconsIcon icon={HandIcon} size={16} strokeWidth={2} className="text-white" />
              <span>{handRaisedNotificationText}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Top Right: Participants Badge pill */}
            <button
              type="button"
              onClick={() => {
                setIsParticipantsOpen((prev) => {
                  const next = !prev
                  if (next) {
                    setIsChatOpen(false)
                    setIsDetailsOpen(false)
                  }
                  return next
                })
              }}
              title="Qatnashchilar ro'yxati"
              className="px-3 py-1.5 rounded-full bg-[#F1F4F9] dark:bg-[#1F242E] hover:bg-slate-200/70 dark:hover:bg-[#282F3D] text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
            >
              <HugeiconsIcon icon={UserGroupIcon} size={16} strokeWidth={2} />
              <span>{allParticipantItems.filter(p => !p.isScreenShare).length}</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Conference Body with Outer Rounded Stage Frame */}
      <div className={`flex-1 flex overflow-hidden relative ${mainStageItem ? 'px-1.5 sm:px-3 pt-0 pb-0.5' : 'px-2 sm:px-4 pt-0.5 pb-1'} min-h-0`}>
        {/* Large Rounded Container matching Figma screenshots */}
        <div className={`w-full h-full flex-1 flex overflow-hidden rounded-2xl sm:rounded-3xl bg-[#DFE5EE] dark:bg-[#13161D] ${mainStageItem ? 'p-1 sm:p-1.5' : 'p-2 sm:p-3'} relative transition-colors shadow-inner`}>

          {mainStageItem ? (
            /* Google Meet Presentation Stage (Single Full View) + Right Sidebar Filmstrip */
            <div className="w-full h-full flex flex-col lg:flex-row gap-3 overflow-hidden">
              {/* Main Stage (Pinned Item OR Latest Shared Screen) */}
              <div
                style={{ viewTransitionName: getViewTransitionName(mainStageItem.identity) }}
                className={`flex-1 h-full min-h-0 min-w-0 flex items-center justify-center relative overflow-hidden transition-all duration-300 ${
                  isScreenFocused
                    ? 'rounded-none bg-black border-0 shadow-none'
                    : 'rounded-2xl sm:rounded-3xl bg-transparent border-0 shadow-xl'
                }`}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <ParticipantTile
                    participant={mainStageItem}
                    isLocal={mainStageItem.isLocal}
                    isScreenShare={mainStageItem.isScreenShare}
                    isSpeaking={mainStageItem.isSpeaking}
                    hasHandRaised={mainStageItem.hasHandRaised}
                    isHost={mainStageItem.isHost}
                    videoTrack={mainStageItem.videoTrack}
                    audioTrack={mainStageItem.audioTrack}
                    isCameraEnabled={mainStageItem.isCameraEnabled}
                    isMicEnabled={mainStageItem.isMicEnabled}
                    displayName={mainStageItem.name}
                    avatar={mainStageItem.avatar || (mainStageItem.isLocal ? (formatAvatarUrl(user?.avatar) || user?.avatar) : '')}
                    version={mainStageItem.version || 0}
                    isPinned={pinnedId === mainStageItem.identity}
                    onTogglePin={() => handleTogglePin(mainStageItem.identity)}
                    isFullScreenFocus={isScreenFocused && screenFocusId === mainStageItem.identity}
                    onToggleFullScreenFocus={mainStageItem.isScreenShare ? () => handleToggleScreenFocus(mainStageItem.identity) : null}
                  />
                </div>
              </div>

              {/* Right Sidebar Filmstrip: Other Screen Shares + Participant Webcams */}
              {!isScreenFocused && sideRailItems.length > 0 && (
                <div
                  className="w-full lg:w-72 xl:w-80 h-36 sm:h-44 lg:h-full shrink-0 flex flex-row lg:flex-col justify-start gap-3 overflow-x-auto lg:overflow-y-auto p-1"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#3c4043 transparent' }}
                >
                  {sideRailItems.map((item) => (
                    <div
                      key={item.identity}
                      style={{ viewTransitionName: getViewTransitionName(item.identity) }}
                      className="w-48 sm:w-56 lg:w-full aspect-video shrink-0 rounded-2xl sm:rounded-3xl flex flex-col items-stretch transition-shadow hover:shadow-xl"
                    >
                      <ParticipantTile
                        participant={item}
                        isLocal={item.isLocal}
                        isScreenShare={item.isScreenShare}
                        isSpeaking={item.isSpeaking}
                        hasHandRaised={item.hasHandRaised}
                        isHost={item.isHost}
                        videoTrack={item.videoTrack}
                        audioTrack={item.audioTrack}
                        isCameraEnabled={item.isCameraEnabled}
                        isMicEnabled={item.isMicEnabled}
                        displayName={item.name}
                        avatar={item.avatar || (item.isLocal ? (formatAvatarUrl(user?.avatar) || user?.avatar) : '')}
                        version={item.version || 0}
                        isPinned={pinnedId === item.identity}
                        onTogglePin={() => handleTogglePin(item.identity)}
                        isFullScreenFocus={isScreenFocused && screenFocusId === item.identity}
                        onToggleFullScreenFocus={item.isScreenShare ? () => handleToggleScreenFocus(item.identity) : null}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Balanced Grid matching parent container height */
            <div className="w-full h-full flex items-stretch justify-center overflow-hidden">
              {cameraItems.length <= 1 ? (
                /* 1 Person: Card filling parent height and width */
                <div
                  key={cameraItems[0]?.identity}
                  style={{ viewTransitionName: getViewTransitionName(cameraItems[0]?.identity) }}
                  className="w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center"
                >
                  <ParticipantTile
                    participant={cameraItems[0]}
                    isLocal={cameraItems[0]?.isLocal}
                    isScreenShare={false}
                    isSpeaking={cameraItems[0]?.isSpeaking}
                    hasHandRaised={cameraItems[0]?.hasHandRaised}
                    isHost={cameraItems[0]?.isHost}
                    videoTrack={cameraItems[0]?.videoTrack}
                    audioTrack={cameraItems[0]?.audioTrack}
                    isCameraEnabled={cameraItems[0]?.isCameraEnabled}
                    isMicEnabled={cameraItems[0]?.isMicEnabled}
                    displayName={cameraItems[0]?.name}
                    avatar={cameraItems[0]?.avatar || (cameraItems[0]?.isLocal ? (formatAvatarUrl(user?.avatar) || user?.avatar) : '')}
                    version={cameraItems[0]?.version || 0}
                    isPinned={pinnedId === cameraItems[0]?.identity}
                    onTogglePin={() => handleTogglePin(cameraItems[0]?.identity)}
                  />
                </div>
              ) : cameraItems.length === 2 ? (
                /* 2 People: 2 equal side-by-side cards filling full parent height */
                <div className="w-full h-full flex flex-col md:flex-row items-stretch justify-center gap-3 sm:gap-4 p-1">
                  {cameraItems.map((item) => (
                    <div
                      key={item.identity}
                      style={{ viewTransitionName: getViewTransitionName(item.identity) }}
                      className="flex-1 w-full h-full min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl flex flex-col items-stretch"
                    >
                      <ParticipantTile
                        participant={item}
                        isLocal={item.isLocal}
                        isScreenShare={false}
                        isSpeaking={item.isSpeaking}
                        hasHandRaised={item.hasHandRaised}
                        isHost={item.isHost}
                        videoTrack={item.videoTrack}
                        audioTrack={item.audioTrack}
                        isCameraEnabled={item.isCameraEnabled}
                        isMicEnabled={item.isMicEnabled}
                        displayName={item.name}
                        avatar={item.avatar || (item.isLocal ? (formatAvatarUrl(user?.avatar) || user?.avatar) : '')}
                        version={item.version || 0}
                        isPinned={pinnedId === item.identity}
                        onTogglePin={() => handleTogglePin(item.identity)}
                      />
                    </div>
                  ))}
                </div>
              ) : cameraItems.length === 3 ? (
                /* 3 People: 3 balanced vertical columns filling parent height */
                <div className="w-full h-full flex flex-col md:flex-row items-stretch justify-center gap-3 sm:gap-4 p-1">
                  {cameraItems.map((item) => (
                    <div
                      key={item.identity}
                      style={{ viewTransitionName: getViewTransitionName(item.identity) }}
                      className="flex-1 w-full h-full min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl flex flex-col items-stretch"
                    >
                      <ParticipantTile
                        participant={item}
                        isLocal={item.isLocal}
                        isScreenShare={false}
                        isSpeaking={item.isSpeaking}
                        hasHandRaised={item.hasHandRaised}
                        isHost={item.isHost}
                        videoTrack={item.videoTrack}
                        audioTrack={item.audioTrack}
                        isCameraEnabled={item.isCameraEnabled}
                        isMicEnabled={item.isMicEnabled}
                        displayName={item.name}
                        avatar={item.avatar || (item.isLocal ? (formatAvatarUrl(user?.avatar) || user?.avatar) : '')}
                        version={item.version || 0}
                        isPinned={pinnedId === item.identity}
                        onTogglePin={() => handleTogglePin(item.identity)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* 4+ People: Responsive grid filling parent height */
                <div className={`w-full h-full grid gap-3 sm:gap-4 p-1 items-stretch justify-center ${
                  cameraItems.length === 4
                    ? 'grid-cols-1 sm:grid-cols-2 grid-rows-2'
                    : cameraItems.length <= 6
                    ? 'grid-cols-2 lg:grid-cols-3 grid-rows-2'
                    : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 overflow-y-auto'
                }`}>
                  {cameraItems.map((item) => (
                    <div
                      key={item.identity}
                      style={{ viewTransitionName: getViewTransitionName(item.identity) }}
                      className="w-full h-full min-h-0 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl flex flex-col items-stretch"
                    >
                      <ParticipantTile
                        participant={item}
                        isLocal={item.isLocal}
                        isScreenShare={false}
                        isSpeaking={item.isSpeaking}
                        hasHandRaised={item.hasHandRaised}
                        isHost={item.isHost}
                        videoTrack={item.videoTrack}
                        audioTrack={item.audioTrack}
                        isCameraEnabled={item.isCameraEnabled}
                        isMicEnabled={item.isMicEnabled}
                        displayName={item.name}
                        avatar={item.avatar || (item.isLocal ? (formatAvatarUrl(user?.avatar) || user?.avatar) : '')}
                        version={item.version || 0}
                        isPinned={pinnedId === item.identity}
                        onTogglePin={() => handleTogglePin(item.identity)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* In-Meeting Chat Drawer */}
        <ChatDrawer
          isOpen={!isScreenFocused && isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          currentUserName={currentUserName}
        />

        {/* Participants Drawer */}
        <ParticipantsDrawer
          isOpen={!isScreenFocused && isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          participants={allParticipantItems.filter(p => !p.isScreenShare)}
          knockRequests={activeKnockRequests}
          isHost={canAdmitParticipants}
          isLocalHost={isLocalHost}
          onMuteParticipant={handleMuteParticipant}
          onMuteAll={handleMuteAllParticipants}
          onAskUnmuteParticipant={handleAskUnmuteParticipant}
          onTurnOffCamera={handleTurnOffCamera}
          onAskTurnOnCamera={handleAskTurnOnCamera}
          onAdmitUser={handleAdmitUser}
          onRejectUser={handleRejectUser}
          currentUserId={roomRef.current?.localParticipant?.identity}
          pinnedId={pinnedId}
          onTogglePin={handleTogglePin}
        />

        {/* Meeting Details Drawer (Google Meet Style) */}
        <MeetingDetailsDrawer
          isOpen={!isScreenFocused && isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          meetingDetails={meetingDetails}
          meetingState={meetingState}
          meetingId={meetingId}
          projectData={projectData}
        />
      </div>

      {/* Bottom Floating Control Bar */}
      <footer className={`z-20 shrink-0 ${mainStageItem ? 'py-1 pb-1.5 px-3' : 'py-1.5 pb-2.5 px-4'}`}>
        <ControlBar
          isMicEnabled={isMicEnabled}
          onToggleMic={handleToggleMic}
          isCameraEnabled={isCameraEnabled}
          onToggleCamera={handleToggleCamera}
          onSelectAudioDevice={async (deviceId) => {
            try {
              if (roomRef.current) {
                await roomRef.current.switchActiveDevice('audioinput', deviceId)
              }
            } catch (err) {
              console.warn("Switch audioinput error:", err)
            }
          }}
          onSelectSpeakerDevice={async (deviceId) => {
            try {
              if (roomRef.current) {
                await roomRef.current.switchActiveDevice('audiooutput', deviceId)
              }
            } catch (err) {
              console.warn("Switch audiooutput error:", err)
            }
          }}
          onSelectVideoDevice={async (deviceId) => {
            try {
              if (roomRef.current) {
                await roomRef.current.switchActiveDevice('videoinput', deviceId)
              }
            } catch (err) {
              console.warn("Switch videoinput error:", err)
            }
          }}
          onSelectBackgroundEffect={(mode) => {
            console.log("Selected background mode:", mode)
          }}
          isScreenSharing={isScreenSharing}
          onToggleScreenShare={handleStartScreenShare}
          onStopScreenShare={handleStopScreenShare}
          onChangeScreenShare={handleChangeScreenShare}
          isHandRaised={isHandRaised}
          onToggleHandRaise={handleToggleHandRaise}
          isChatOpen={isChatOpen}
          onToggleChat={() => {
            if (isScreenFocused) setScreenFocusId(null)
            setIsChatOpen((prev) => {
              const next = !prev
              if (next) {
                setIsParticipantsOpen(false)
                setIsDetailsOpen(false)
                setUnreadChatCount(0)
              }
              return next
            })
          }}
          unreadChatCount={unreadChatCount}
          isParticipantsOpen={isParticipantsOpen}
          onToggleParticipants={() => {
            if (isScreenFocused) setScreenFocusId(null)
            setIsParticipantsOpen((prev) => {
              const next = !prev
              if (next) {
                setIsChatOpen(false)
                setIsDetailsOpen(false)
              }
              return next
            })
          }}
          participantCount={allParticipantItems.filter(p => !p.isScreenShare).length}
          knockCount={canAdmitParticipants ? activeKnockRequests.length : 0}
          isDetailsOpen={isDetailsOpen}
          onToggleDetails={() => {
            if (isScreenFocused) setScreenFocusId(null)
            setIsDetailsOpen((prev) => {
              const next = !prev
              if (next) {
                setIsChatOpen(false)
                setIsParticipantsOpen(false)
              }
              return next
            })
          }}
          onLeave={handleLeaveMeeting}
          isHost={isLocalHost}
          onEndMeetingForAll={handleEndMeetingForAll}
        />
      </footer>

      {/* Ask to Unmute Modal (received from Host) */}
      {unmuteRequest && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#202124] border border-white/10 p-6 shadow-2xl text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-2xl border border-blue-500/30 shadow-inner">
              <FaMicrophone size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Mikrofonni yoqish so'rovi</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                <span className="font-bold text-white">{unmuteRequest.sender}</span> mikrofoningizni yoqishingizni so'ramoqda.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => setUnmuteRequest(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Hozir emas
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!isMicEnabled) {
                    await handleToggleMic()
                  }
                  setUnmuteRequest(null)
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-blue-600/30"
              >
                Mikrofonni yoqish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ask to Turn on Camera Modal (received from Host) */}
      {turnOnCameraRequest && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-[#202124] border border-white/10 p-6 shadow-2xl text-center flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-2xl border border-blue-500/30 shadow-inner">
              <FaVideo size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Kamerani yoqish so'rovi</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                <span className="font-bold text-white">{turnOnCameraRequest.sender}</span> kamerangizni yoqishingizni so'ramoqda.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                type="button"
                onClick={() => setTurnOnCameraRequest(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Hozir emas
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!isCameraEnabled) {
                    await handleToggleCamera()
                  }
                  setTurnOnCameraRequest(null)
                }}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-blue-600/30"
              >
                Kamerani yoqish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
