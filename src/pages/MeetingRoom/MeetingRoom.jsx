import { useState, useEffect, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useParams, useNavigate } from 'react-router-dom'
import { Room, RoomEvent, VideoPresets, Track } from 'livekit-client'
import { useAuth } from '../../context/AuthContext'
import { axiosAPI } from '../../service/axiosAPI'
import { toast } from '../../Toast/ToastProvider'

import ParticipantTile from './components/ParticipantTile'
import ControlBar from './components/ControlBar'
import ChatDrawer from './components/ChatDrawer'
import ParticipantsDrawer from './components/ParticipantsDrawer'
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

import { FaExpand, FaCompress } from 'react-icons/fa6'
import { RiSignalWifiFill } from 'react-icons/ri'

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

export default function MeetingRoom() {
  const { id: meetingId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Meeting & State Machine
  const [meetingDetails, setMeetingDetails] = useState(null)
  const [meetingState, setMeetingState] = useState(null)
  const [waitingState, setWaitingState] = useState('connecting') // 'connecting' | 'waiting_organizer' | 'waiting_approval' | 'rejected' | 'in_room' | 'ended'
  const [rejectedMessage, setRejectedMessage] = useState('')
  const [knockRequests, setKnockRequests] = useState([])

  // LiveKit Connection
  const roomRef = useRef(null)
  const [isConnectedToLiveKit, setIsConnectedToLiveKit] = useState(false)
  const [remoteParticipants, setRemoteParticipants] = useState([])
  const [activeSpeakers, setActiveSpeakers] = useState([])
  const [participantTracks, setParticipantTracks] = useState({}) // { [identity]: { videoTrack, audioTrack, isCameraEnabled, isMicEnabled } }
  const [handRaisedMap, setHandRaisedMap] = useState({}) // { [identity]: boolean }

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
  const screenShareTimesRef = useRef({})

  // Drawers & UI
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState(() => getStoredChatMessages(meetingId))
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [meetingDuration, setMeetingDuration] = useState(0)
  const [endedReason, setEndedReason] = useState("Yig'ilish yakunlandi")

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

  const triggerInRoomAlert = useCallback((icon, text, type = 'info') => {
    if (inRoomAlertTimerRef.current) {
      clearTimeout(inRoomAlertTimerRef.current)
    }
    setInRoomAlert({ icon, text, type, id: Date.now() })
    inRoomAlertTimerRef.current = setTimeout(() => {
      setInRoomAlert(null)
    }, 3500)
  }, [])

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

  // Load meeting metadata from REST API
  useEffect(() => {
    if (!meetingId) return
    axiosAPI.get(`/meetings/${meetingId}/`)
      .then(res => {
        const d = res.data?.data ?? res.data
        setMeetingDetails(d)
      })
      .catch(() => { })
  }, [meetingId])

  // 2. WebSocket Connection & State Machine
  useEffect(() => {
    let isSubscribed = true

    const connectWs = async () => {
      try {
        // Step 1: Request ticket
        const { data: ticketRes } = await axiosAPI.post('/notifications/tickets/')
        const ticket = ticketRes?.data?.ticket || ticketRes?.ticket

        if (!ticket) {
          toast.error("Xatolik", "WebSocket uchun bilet olinmadi")
          return
        }

        // Formulate WebSocket URL
        const rawBase = import.meta.env.VITE_BASE_URL
        const wsUrl = `${rawBase}/ws/meetings/${meetingId}/?ticket=${ticket}`

        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          console.log("WebSocket ulangan:", wsUrl)
        }

        ws.onmessage = (event) => {
          if (!isSubscribed) return
          let msg
          try {
            msg = JSON.parse(event.data)
          } catch {
            return
          }

          handleWsMessage(msg)
        }

        ws.onerror = (err) => {
          console.error("WebSocket xatosi:", err)
        }

        ws.onclose = (evt) => {
          console.log("WebSocket yopildi:", evt.code, evt.reason)
        }
      } catch (err) {
        console.error("WebSocket ulanishda xato:", err)
      }
    }

    connectWs()

    return () => {
      isSubscribed = false
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [meetingId])

  // Send message over WebSocket helper
  const sendWs = (payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload))
    }
  }

  // Handle incoming WebSocket messages
  const handleWsMessage = useCallback((msg) => {
    console.log("WS Event qabul qilindi:", msg.type, msg)

    switch (msg.type) {
      case 'meeting_state': {
        setMeetingState(msg)

        if (msg.is_host) {
          // Host immediately requests token
          sendWs({ action: 'get_token' })
        } else {
          // Guest flow
          if (!msg.organizer_joined) {
            setWaitingState('waiting_organizer')
          } else {
            if (msg.requires_approval && !msg.is_approved) {
              setWaitingState('waiting_approval')
              sendWs({ action: 'ask_to_join' })
            } else {
              sendWs({ action: 'get_token' })
            }
          }
        }
        break
      }

      case 'organizer_joined': {
        setMeetingState(prev => prev ? ({ ...prev, organizer_joined: true }) : prev)
        // If guest was waiting for organizer
        if (waitingState === 'waiting_organizer') {
          if (meetingState?.requires_approval && !meetingState?.is_approved) {
            setWaitingState('waiting_approval')
            sendWs({ action: 'ask_to_join' })
          } else {
            sendWs({ action: 'get_token' })
          }
        }
        break
      }

      case 'knock_request': {
        // Host receives knock from guest
        playKnockRequestSound()
        triggerInRoomAlert('🔔', `${msg.username || 'Foydalanuvchi'} yig'ilishga kirishni so'ramoqda`, 'knock')
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

      case 'knock_response': {
        if (msg.status === 'approved') {
          // Guest approved! Connect to LiveKit room
          if (msg.server_url && msg.token) {
            connectToLiveKit(msg.server_url, msg.token)
          } else {
            sendWs({ action: 'get_token' })
          }
        } else if (msg.status === 'rejected') {
          setWaitingState('rejected')
          setRejectedMessage(msg.message || "Tashkilotchi yig'ilishga kirishingizni rad etdi.")
        }
        break
      }

      case 'token_response': {
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

      default:
        break
    }
  }, [waitingState, meetingState])

  // Helper to determine if a participant is the host/organizer
  const checkIsHost = useCallback((participantObj, identity, name) => {
    // 1. LiveKit roomAdmin permission
    if (participantObj?.permissions?.roomAdmin) return true

    // 2. LiveKit metadata
    if (participantObj?.metadata) {
      try {
        const meta = typeof participantObj.metadata === 'string'
          ? JSON.parse(participantObj.metadata)
          : participantObj.metadata
        if (meta.is_host || meta.role === 'host' || meta.is_organizer || meta.isHost) return true
        const organizerId = meetingDetails?.organizer ?? meetingState?.organizer_id ?? meetingState?.organizer
        if (organizerId && String(meta.user_id || meta.id) === String(organizerId)) return true
      } catch {}
    }

    // 3. Match against meetingDetails.organizer ID
    const organizerId = meetingDetails?.organizer ?? meetingState?.organizer_id ?? meetingState?.organizer
    if (organizerId !== undefined && organizerId !== null) {
      const sOrgId = String(organizerId)
      const sIdentity = String(identity || '')
      if (sIdentity === sOrgId) return true
      if (sIdentity.startsWith(sOrgId + '_') || sIdentity.endsWith('_' + sOrgId)) return true
    }

    // 4. Match against organizerUser details
    const organizerUser = meetingDetails?.participants_info?.find(u => u.id === organizerId) || meetingDetails?.organizer_info
    if (organizerUser) {
      const sOrgUserId = String(organizerUser.id || '')
      const sIdentity = String(identity || '')
      if (sOrgUserId && (sIdentity === sOrgUserId || sIdentity.startsWith(sOrgUserId + '_'))) return true
      if (organizerUser.username) {
        if (sIdentity.toLowerCase() === organizerUser.username.toLowerCase()) return true
        if (name && name.toLowerCase() === organizerUser.username.toLowerCase()) return true
      }
      const orgFullName = `${organizerUser.first_name || ''} ${organizerUser.last_name || ''}`.trim()
      if (orgFullName && name && name.toLowerCase() === orgFullName.toLowerCase()) return true
    }

    // 5. Match against project manager
    if (meetingDetails?.project_info?.manager) {
      const sMgrId = String(meetingDetails.project_info.manager)
      if (String(identity || '') === sMgrId) return true
    }

    return false
  }, [meetingDetails, meetingState])

  // 3. LiveKit Connection
  const connectToLiveKit = async (serverUrl, token) => {
    try {
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
      console.log("LiveKit xonaga ulandi:", room.name)

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

      const isLocalHost = Boolean(
        meetingState?.is_host ||
        checkIsHost(room.localParticipant, room.localParticipant.identity, currentUserName) ||
        (user?.id && meetingDetails?.organizer && String(user.id) === String(meetingDetails.organizer))
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
        isHost: isLocalHost,
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
      const pIsHost = checkIsHost(participant, participant.identity, participant.name)
      playParticipantJoinedSound()
      const pName = participant.name || participant.identity || "Yangi ishtirokchi"
      triggerInRoomAlert('👋', `${pName} yig'ilishga qo'shildi`, 'join')
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
        triggerInRoomAlert('🖥️', `${pName} ekranini ulashdi`, 'screen')
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
            triggerInRoomAlert('💬', `${decoded.sender}: ${decoded.text?.slice(0, 40)}${decoded.text?.length > 40 ? '...' : ''}`, 'chat')
          }
        } else if (decoded.type === 'raise_hand') {
          const pIdentity = participant ? participant.identity : decoded.userId
          setHandRaisedMap(prev => ({
            ...prev,
            [pIdentity]: decoded.isRaised
          }))
          if (decoded.isRaised) {
            playHandRaisedSound()
            triggerInRoomAlert('✋', `${decoded.sender || 'Ishtirokchi'} qo'l ko'tardi`, 'hand')
          }
        }
      } catch (err) {
        console.error("Data channel parslashda xato:", err)
      }
    })

    // Room disconnected
    room.on(RoomEvent.Disconnected, (reason) => {
      console.log("Xonadan uzildi:", reason)
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
        triggerInRoomAlert('🖥️', "Ekranni ulashish boshlandi", 'screen')
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
      triggerInRoomAlert('⏹️', "Ekran ulashuvi to'xtatildi", 'screen')
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
        triggerInRoomAlert('🖥️', "Ekran muvaffaqiyatli almashtirildi", 'screen')
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
        triggerInRoomAlert('🖥️', "Ekran muvaffaqiyatli almashtirildi", 'screen')
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
      triggerInRoomAlert('✋', "Siz qo'l ko'tardingiz", 'hand')
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
      text: text,
      sender: currentUserName,
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
    navigate(-1)
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

  const isLocalHost = Boolean(
    meetingState?.is_host ||
    (roomRef.current?.localParticipant && checkIsHost(roomRef.current.localParticipant, roomRef.current.localParticipant.identity, currentUserName)) ||
    (user?.id && meetingDetails?.organizer && String(user.id) === String(meetingDetails.organizer))
  )

  // 3. Local Participant Camera tile
  if (roomRef.current?.localParticipant) {
    const localId = roomRef.current.localParticipant.identity
    const localInfo = participantTracks[localId] || {}
    allParticipantItems.push({
      identity: localId,
      name: currentUserName,
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
    allParticipantItems.push({
      identity: rp.identity,
      name: rp.name || rp.identity,
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

  // Sort screen shares by start time ascending (latest screen share is at the end)
  const sortedScreenShares = [...screenShareItems].sort((a, b) => (a.shareTime || 0) - (b.shareTime || 0))
  const latestScreenShare = sortedScreenShares.length > 0 ? sortedScreenShares[sortedScreenShares.length - 1] : null

  // Pinned item (client-side only for current user)
  const pinnedItem = pinnedId ? allParticipantItems.find(p => p.identity === pinnedId) : null

  let mainStageItem = null
  let sideRailItems = []

  if (pinnedItem) {
    // 1. User pinned an item explicitly (client-side only)
    mainStageItem = pinnedItem
    const otherScreenShares = sortedScreenShares.filter(s => s.identity !== pinnedItem.identity)
    const otherCameras = cameraItems.filter(c => c.identity !== pinnedItem.identity)
    sideRailItems = [...otherScreenShares, ...otherCameras]
  } else if (latestScreenShare) {
    // 2. Multiple or single screen shares active: main stage shows latest screen share
    mainStageItem = latestScreenShare
    const otherScreenShares = sortedScreenShares.filter(s => s.identity !== latestScreenShare.identity)
    sideRailItems = [...otherScreenShares, ...cameraItems]
  } else {
    // 3. No screen share and no pin -> pure balanced camera grid
    mainStageItem = null
    sideRailItems = []
  }

  const handleTogglePin = (identity) => {
    withViewTransition(() => {
      setPinnedId(prev => (prev === identity ? null : identity))
    })
  }

  // Render Waiting Room state
  if (waitingState === 'connecting' || waitingState === 'waiting_organizer' || waitingState === 'waiting_approval' || waitingState === 'rejected') {
    return (
      <WaitingRoom
        title={meetingDetails?.title || meetingState?.title || "Yig'ilish"}
        meetingState={meetingState}
        isRejected={waitingState === 'rejected'}
        rejectedMessage={rejectedMessage}
        localStream={localStream}
        isCameraEnabled={isCameraEnabled}
        onToggleCamera={() => {
          setIsCameraEnabled((prev) => {
            const next = !prev
            isCameraEnabledRef.current = next
            if (localStream) {
              localStream.getVideoTracks().forEach((t) => {
                t.enabled = next
              })
            }
            return next
          })
        }}
        isMicEnabled={isMicEnabled}
        onToggleMic={() => {
          setIsMicEnabled((prev) => {
            const next = !prev
            isMicEnabledRef.current = next
            if (localStream) {
              localStream.getAudioTracks().forEach((t) => {
                t.enabled = next
              })
            }
            return next
          })
        }}
        onLeave={() => navigate(-1)}
      />
    )
  }

  // Render Meeting Ended state
  if (waitingState === 'ended') {
    return (
      <div className="fixed inset-0 w-full h-full bg-[#111317] text-white flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden select-none z-50">
        <div className="w-full max-w-md p-8 rounded-3xl bg-[#1C1F26] border border-white/10 text-center shadow-2xl animate-in zoom-in-95 my-auto">
          <div className="w-16 h-16 rounded-full bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center mb-4">
            <RiSignalWifiFill size={30} />
          </div>
          <h2 className="text-2xl font-extrabold">{endedReason}</h2>
          <p className="text-sm text-slate-400 mt-2">
            Yig'ilish davomiyligi: <span className="font-bold text-slate-200">{formatDuration(meetingDuration)}</span>
          </p>
          <div className="mt-8">
            <button
              type="button"
              onClick={() => {
                clearStoredChatMessages(meetingId)
                navigate(-1)
              }}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer transition-colors shadow-lg shadow-blue-600/30"
            >
              Yopish va qaytish
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
      className="fixed inset-0 w-full h-full bg-[#202124] text-white overflow-hidden flex flex-col select-none z-50"
    >
      {/* Knock Request Banner for Host */}
      {meetingState?.is_host && (
        <KnockBanner
          requests={knockRequests}
          onAdmit={handleAdmitUser}
          onReject={handleRejectUser}
        />
      )}

      {/* In-Room Dynamic Alert Banner with smooth slide/fade animations */}
      {inRoomAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-xl border text-xs sm:text-sm font-semibold shadow-2xl transition-all duration-300 ${
            inRoomAlert.type === 'hand'
              ? 'bg-amber-950/90 border-amber-500/50 text-amber-200 shadow-amber-500/20'
              : inRoomAlert.type === 'join'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-500/20'
              : inRoomAlert.type === 'screen'
              ? 'bg-blue-950/90 border-blue-500/50 text-blue-200 shadow-blue-500/20'
              : inRoomAlert.type === 'knock'
              ? 'bg-orange-950/90 border-orange-500/50 text-orange-200 shadow-orange-500/20'
              : inRoomAlert.type === 'chat'
              ? 'bg-purple-950/90 border-purple-500/50 text-purple-200 shadow-purple-500/20'
              : 'bg-[#1C1F26]/95 border-white/15 text-white shadow-black/50'
          }`}>
            <span className="text-base sm:text-lg">{inRoomAlert.icon}</span>
            <span>{inRoomAlert.text}</span>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-[#3c4043] bg-[#202124] z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-[200px] sm:max-w-md">
              {meetingDetails?.title || meetingState?.title || "Yig'ilish"}
            </h2>
          </div>
          {meetingDetails?.uid && (
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-slate-400">
              {meetingDetails.uid}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Duration Badge */}
          <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-semibold text-slate-300">
            {formatDuration(meetingDuration)}
          </div>

          {/* Fullscreen button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors"
            title="To'liq ekran"
          >
            {isFullscreen ? <FaCompress size={14} /> : <FaExpand size={14} />}
          </button>
        </div>
      </header>

      {/* Main Conference Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Video Area: Google Meet Presentation Mode OR Pure Camera Grid */}
        <main className="flex-1 flex overflow-hidden p-2 sm:p-3 md:p-4 transition-all duration-300">
          {mainStageItem ? (
            /* Google Meet Presentation Stage (Single Full View) + Right Sidebar Filmstrip */
            <div className="w-full h-full flex flex-col lg:flex-row gap-3 overflow-hidden">
              {/* Main Stage (Pinned Item OR Latest Shared Screen) */}
              <div
                style={{ viewTransitionName: getViewTransitionName(mainStageItem.identity) }}
                className="flex-1 h-full min-h-0 min-w-0 flex items-center justify-center relative rounded-3xl bg-[#121212] overflow-hidden border border-white/10 shadow-2xl"
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
                    avatar={mainStageItem.isLocal ? user?.avatar : ''}
                    version={mainStageItem.version || 0}
                    isPinned={pinnedId === mainStageItem.identity}
                    onTogglePin={() => handleTogglePin(mainStageItem.identity)}
                  />
                </div>
              </div>

              {/* Right Sidebar Filmstrip: Other Screen Shares + Participant Webcams */}
              {sideRailItems.length > 0 && (
                <div
                  className="w-full lg:w-72 xl:w-80 h-36 sm:h-44 lg:h-full shrink-0 flex flex-row lg:flex-col justify-start gap-3 overflow-x-auto lg:overflow-y-auto p-1"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#3c4043 transparent' }}
                >
                  {sideRailItems.map((item) => (
                    <div
                      key={item.identity}
                      style={{ viewTransitionName: getViewTransitionName(item.identity) }}
                      className={`w-48 sm:w-56 lg:w-full aspect-video shrink-0 rounded-2xl overflow-hidden shadow-md transition-shadow hover:shadow-xl ${
                        item.isScreenShare
                          ? 'bg-[#121212] border-2 border-blue-500/60 hover:border-blue-400'
                          : 'bg-[#3c4043] border border-white/5 hover:border-white/20'
                      }`}
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
                        avatar={item.isLocal ? user?.avatar : ''}
                        version={item.version || 0}
                        isPinned={pinnedId === item.identity}
                        onTogglePin={() => handleTogglePin(item.identity)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Pure Google Meet Balanced Grid */
            <div className="w-full h-full flex items-center justify-center p-1 sm:p-2 md:p-3 overflow-hidden">
              {cameraItems.length <= 1 ? (
                /* 1 Person: Centered large 16:9 card */
                <div
                  key={cameraItems[0]?.identity}
                  style={{ viewTransitionName: getViewTransitionName(cameraItems[0]?.identity) }}
                  className="w-full max-w-6xl h-full max-h-[calc(100vh-170px)] aspect-video rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center"
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
                    avatar={cameraItems[0]?.isLocal ? user?.avatar : ''}
                    version={cameraItems[0]?.version || 0}
                    isPinned={pinnedId === cameraItems[0]?.identity}
                    onTogglePin={() => handleTogglePin(cameraItems[0]?.identity)}
                  />
                </div>
              ) : cameraItems.length === 2 ? (
                /* 2 People: 2 equal side-by-side 16:9 cards */
                <div className="w-full h-full max-h-[calc(100vh-170px)] max-w-[1700px] flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4 p-1">
                  {cameraItems.map((item) => (
                    <div
                      key={item.identity}
                      style={{ viewTransitionName: getViewTransitionName(item.identity) }}
                      className="flex-1 w-full max-w-[820px] aspect-video max-h-[calc(100vh-190px)] rounded-3xl overflow-hidden shadow-xl"
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
                        avatar={item.isLocal ? user?.avatar : ''}
                        version={item.version || 0}
                        isPinned={pinnedId === item.identity}
                        onTogglePin={() => handleTogglePin(item.identity)}
                      />
                    </div>
                  ))}
                </div>
              ) : cameraItems.length === 3 ? (
                /* 3 People: 3 balanced cards */
                <div className="w-full h-full max-h-[calc(100vh-170px)] max-w-[1700px] flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-1">
                  {cameraItems.map((item) => (
                    <div
                      key={item.identity}
                      style={{ viewTransitionName: getViewTransitionName(item.identity) }}
                      className="w-full sm:w-[calc(50%-10px)] xl:w-[calc(33.333%-12px)] max-w-[620px] aspect-video max-h-[calc(100vh-200px)] rounded-3xl overflow-hidden shadow-xl"
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
                        avatar={item.isLocal ? user?.avatar : ''}
                        version={item.version || 0}
                        isPinned={pinnedId === item.identity}
                        onTogglePin={() => handleTogglePin(item.identity)}
                      />
                    </div>
                  ))}
                </div>
              ) : cameraItems.length === 4 ? (
                /* 4 People: 2x2 grid */
                <div className="w-full h-full max-h-[calc(100vh-170px)] max-w-[1500px] grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center justify-center p-1">
                  {cameraItems.map((item) => (
                    <div
                      key={item.identity}
                      style={{ viewTransitionName: getViewTransitionName(item.identity) }}
                      className="w-full aspect-video max-h-[calc(50vh-100px)] rounded-3xl overflow-hidden shadow-xl mx-auto"
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
                        avatar={item.isLocal ? user?.avatar : ''}
                        version={item.version || 0}
                        isPinned={pinnedId === item.identity}
                        onTogglePin={() => handleTogglePin(item.identity)}
                      />
                    </div>
                  ))}
                </div>
              ) : cameraItems.length <= 6 ? (
                /* 5-6 People: 3x2 grid */
                <div className="w-full h-full max-h-[calc(100vh-170px)] max-w-[1700px] grid grid-cols-2 lg:grid-cols-3 gap-3 items-center justify-center p-1">
                  {cameraItems.map((item) => (
                    <div
                      key={item.identity}
                      style={{ viewTransitionName: getViewTransitionName(item.identity) }}
                      className="w-full aspect-video max-h-[calc(50vh-100px)] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md mx-auto"
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
                        avatar={item.isLocal ? user?.avatar : ''}
                        version={item.version || 0}
                        isPinned={pinnedId === item.identity}
                        onTogglePin={() => handleTogglePin(item.identity)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* 7+ People: Multi-column responsive grid */
                <div className="w-full h-full max-h-[calc(100vh-170px)] max-w-[1800px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-center justify-center overflow-y-auto p-1">
                  {cameraItems.map((item) => (
                    <div
                      key={item.identity}
                      style={{ viewTransitionName: getViewTransitionName(item.identity) }}
                      className="w-full aspect-video rounded-2xl overflow-hidden shadow-md mx-auto"
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
                        avatar={item.isLocal ? user?.avatar : ''}
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
        </main>

        {/* In-Meeting Chat Drawer */}
        <ChatDrawer
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          currentUserName={currentUserName}
        />

        {/* Participants Drawer */}
        <ParticipantsDrawer
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          participants={allParticipantItems.filter(p => !p.isScreenShare)}
          knockRequests={knockRequests}
          isHost={isLocalHost}
          onAdmitUser={handleAdmitUser}
          onRejectUser={handleRejectUser}
          currentUserId={roomRef.current?.localParticipant?.identity}
          pinnedId={pinnedId}
          onTogglePin={handleTogglePin}
        />
      </div>

      {/* Bottom Floating Control Bar */}
      <footer className="p-4 z-20 shrink-0">
        <ControlBar
          isMicEnabled={isMicEnabled}
          onToggleMic={handleToggleMic}
          isCameraEnabled={isCameraEnabled}
          onToggleCamera={handleToggleCamera}
          isScreenSharing={isScreenSharing}
          onToggleScreenShare={handleStartScreenShare}
          onStopScreenShare={handleStopScreenShare}
          onChangeScreenShare={handleChangeScreenShare}
          isHandRaised={isHandRaised}
          onToggleHandRaise={handleToggleHandRaise}
          isChatOpen={isChatOpen}
          onToggleChat={() => {
            setIsChatOpen((prev) => {
              const next = !prev
              if (next) {
                setIsParticipantsOpen(false)
                setUnreadChatCount(0)
              }
              return next
            })
          }}
          unreadChatCount={unreadChatCount}
          isParticipantsOpen={isParticipantsOpen}
          onToggleParticipants={() => {
            setIsParticipantsOpen((prev) => {
              const next = !prev
              if (next) {
                setIsChatOpen(false)
              }
              return next
            })
          }}
          participantCount={allParticipantItems.filter(p => !p.isScreenShare).length}
          knockCount={knockRequests.length}
          onLeave={handleLeaveMeeting}
          isHost={isLocalHost}
          onEndMeetingForAll={handleEndMeetingForAll}
        />
      </footer>
    </div>
  )
}
