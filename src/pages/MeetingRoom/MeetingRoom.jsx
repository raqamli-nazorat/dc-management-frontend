import { useState, useEffect, useRef, useCallback } from 'react'
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

import { FaExpand, FaCompress } from 'react-icons/fa6'
import { RiSignalWifiFill } from 'react-icons/ri'

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
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [localStream, setLocalStream] = useState(null)

  // Drawers & UI
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [meetingDuration, setMeetingDuration] = useState(0)
  const [endedReason, setEndedReason] = useState("Yig'ilish yakunlandi")

  // WebSocket reference
  const wsRef = useRef(null)
  const currentUserName = user?.username || user?.first_name || 'Foydalanuvchi'

  // 1. Initial Local Camera / Mic Preview for Waiting Room
  useEffect(() => {
    let stream = null
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        stream = s
        setLocalStream(s)
      })
      .catch((err) => {
        console.warn("Media devices not accessible or permission denied:", err)
      })

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop())
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
          setRejectedMessage(msg.message || "Mezbon yig'ilishga kirishingizni rad etdi.")
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
        setWaitingState('ended')
        setEndedReason(msg.message || "Yig'ilish mezbon tomonidan yakunlandi.")
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

      // Release preview stream from waiting room
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop())
        setLocalStream(null)
      }

      // Enable local mic & camera respecting user choices
      try {
        if (isCameraEnabled) {
          await room.localParticipant.setCameraEnabled(true)
        }
        if (isMicEnabled) {
          await room.localParticipant.setMicrophoneEnabled(true)
        }
      } catch (mediaErr) {
        console.warn("Kamera yoki mikrofonni yoqishda xatolik:", mediaErr)
      }

      const isLocalHost = Boolean(
        meetingState?.is_host ||
        checkIsHost(room.localParticipant, room.localParticipant.identity, currentUserName) ||
        (user?.id && meetingDetails?.organizer && String(user.id) === String(meetingDetails.organizer))
      )

      // Sync local participant track
      updateParticipantTrack(room.localParticipant.identity, {
        videoTrack: room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack,
        audioTrack: null,
        isCameraEnabled: isCameraEnabled,
        isMicEnabled: isMicEnabled,
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
      setRemoteParticipants(Array.from(room.remoteParticipants.values()))
    })

    // Track Subscribed (remote audio/video track ready)
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      const pIsHost = checkIsHost(participant, participant.identity, participant.name)
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
          if (track.source === Track.Source.ScreenShare) {
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
      setParticipantTracks(prev => {
        const cur = prev[participant.identity]
        if (!cur) return prev
        const next = { ...cur }

        if (track.kind === Track.Kind.Video) {
          if (track.source === Track.Source.ScreenShare) {
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
      setParticipantTracks(prev => {
        const cur = prev[participant.identity]
        if (!cur) return prev
        const next = { ...cur }

        if (publication.source === Track.Source.ScreenShare) {
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
      setParticipantTracks(prev => {
        const cur = prev[participant.identity]
        if (!cur) return prev
        const next = { ...cur }

        if (publication.source === Track.Source.ScreenShare) {
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
      setParticipantTracks(prev => {
        const cur = prev[participant.identity]
        if (!cur) return prev
        const next = { ...cur }

        if (publication.source === Track.Source.ScreenShare) {
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

    // Local screen share track ended via browser toolbar
    room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
      if (publication.source === Track.Source.ScreenShare) {
        setIsScreenSharing(false)
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
          setChatMessages(prev => [...prev, decoded])
          if (!isChatOpen) {
            setUnreadChatCount(c => c + 1)
          }
        } else if (decoded.type === 'raise_hand') {
          const pIdentity = participant ? participant.identity : decoded.userId
          setHandRaisedMap(prev => ({
            ...prev,
            [pIdentity]: decoded.isRaised
          }))
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
      if (roomRef.current) {
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
      await roomRef.current.localParticipant.setMicrophoneEnabled(next)
      updateParticipantTrack(roomRef.current.localParticipant.identity, { isMicEnabled: next })
    }
  }

  const handleToggleCamera = async () => {
    const next = !isCameraEnabled
    setIsCameraEnabled(next)
    if (roomRef.current?.localParticipant) {
      await roomRef.current.localParticipant.setCameraEnabled(next)
      const vTrack = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack
      updateParticipantTrack(roomRef.current.localParticipant.identity, {
        isCameraEnabled: next,
        videoTrack: vTrack
      })
    }
  }

  const handleToggleScreenShare = async () => {
    const next = !isScreenSharing
    try {
      if (roomRef.current?.localParticipant) {
        const publication = await roomRef.current.localParticipant.setScreenShareEnabled(next)
        setIsScreenSharing(next)
        if (next && publication?.track?.mediaStreamTrack) {
          publication.track.mediaStreamTrack.onended = () => {
            roomRef.current?.localParticipant?.setScreenShareEnabled(false)
            setIsScreenSharing(false)
          }
        }
      }
    } catch (err) {
      console.warn("Ekran ulashish bekor qilindi yoki xato:", err)
      setIsScreenSharing(false)
    }
  }

  const handleToggleHandRaise = async () => {
    const next = !isHandRaised
    setIsHandRaised(next)
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

    setChatMessages(prev => [...prev, messageData])

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
    const localScreenTrack = roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare)?.videoTrack
    if (localScreenTrack) {
      allParticipantItems.push({
        identity: `${roomRef.current.localParticipant.identity}-screen`,
        name: `${currentUserName} (Ekran)`,
        isLocal: true,
        isScreenShare: true,
        videoTrack: localScreenTrack,
        audioTrack: null,
        isCameraEnabled: true,
        isMicEnabled: false,
        isSpeaking: false,
        hasHandRaised: false,
        isHost: false,
      })
    }
  }

  // 2. Remote Screen Shares (if any remote participant shares screen)
  remoteParticipants.forEach(rp => {
    const rInfo = participantTracks[rp.identity] || {}
    if (rInfo.screenShareTrack) {
      allParticipantItems.push({
        identity: `${rp.identity}-screen`,
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
  remoteParticipants.forEach(rp => {
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

  const hasScreenShare = allParticipantItems.some(i => i.isScreenShare)

  // Dynamic grid column class based on participant count
  const getGridClass = (count) => {
    if (hasScreenShare) {
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-full'
    }
    if (count <= 1) return 'grid-cols-1 max-w-4xl'
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl'
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-6xl'
    if (count <= 6) return 'grid-cols-2 lg:grid-cols-3 max-w-7xl'
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-full'
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
        onToggleCamera={() => setIsCameraEnabled(p => !p)}
        isMicEnabled={isMicEnabled}
        onToggleMic={() => setIsMicEnabled(p => !p)}
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
              onClick={() => navigate(-1)}
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
      className="fixed inset-0 w-full h-full bg-[#0E1013] text-white overflow-hidden flex flex-col select-none z-50"
    >
      {/* Knock Request Banner for Host */}
      {meetingState?.is_host && (
        <KnockBanner
          requests={knockRequests}
          onAdmit={handleAdmitUser}
          onReject={handleRejectUser}
        />
      )}

      {/* Top Header Bar */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-white/10 bg-[#14171D]/90 backdrop-blur-md z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-extrabold text-white truncate max-w-[200px] sm:max-w-md">
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
        {/* Video Grid Area */}
        <main className="flex-1 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className={`w-full h-full grid gap-3 sm:gap-4 items-center justify-center mx-auto ${getGridClass(allParticipantItems.length)}`}>
            {allParticipantItems.map((item) => (
              <div
                key={item.identity}
                className={`w-full h-full min-h-[180px] max-h-[75vh] ${
                  item.isScreenShare ? 'col-span-full md:col-span-2 row-span-2 min-h-[300px]' : ''
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
                />
              </div>
            ))}
          </div>
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
          onToggleScreenShare={handleToggleScreenShare}
          isHandRaised={isHandRaised}
          onToggleHandRaise={handleToggleHandRaise}
          isChatOpen={isChatOpen}
          onToggleChat={() => {
            setIsChatOpen(p => !p)
            if (!isChatOpen) setUnreadChatCount(0)
          }}
          unreadChatCount={unreadChatCount}
          isParticipantsOpen={isParticipantsOpen}
          onToggleParticipants={() => setIsParticipantsOpen(p => !p)}
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
