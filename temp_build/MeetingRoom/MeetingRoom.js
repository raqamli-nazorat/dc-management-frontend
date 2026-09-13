import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { Room, RoomEvent, VideoPresets, Track, ConnectionQuality } from "livekit-client";
import { useAuth } from "../../context/AuthContext";
import { axiosAPI } from "../../service/axiosAPI";
import { toast } from "../../Toast/ToastProvider";
import ParticipantTile from "./components/ParticipantTile";
import ControlBar from "./components/ControlBar";
import ChatDrawer from "./components/ChatDrawer";
import ParticipantsDrawer from "./components/ParticipantsDrawer";
import MeetingDetailsDrawer from "./components/MeetingDetailsDrawer";
import WaitingRoom from "./components/WaitingRoom";
import KnockBanner from "./components/KnockBanner";
import {
  playScreenShareStartSound,
  playScreenShareStopSound,
  playChatMessageSound,
  playParticipantJoinedSound,
  playKnockRequestSound,
  playHandRaisedSound
} from "./utils/meetingSounds";
import { getMeetingCode, parseMeetingId, getFullMeetingUrl } from "./utils/meetingCode";
import { FaExpand, FaCompress, FaMicrophone, FaMicrophoneSlash } from "react-icons/fa6";
import { RiSignalWifiFill, RiSignalWifiOffFill, RiSignalWifi1Fill, RiInformationLine } from "react-icons/ri";
import {
  TbBellFilled,
  TbUserPlus,
  TbScreenShare,
  TbScreenShareOff,
  TbMessageCircle,
  TbHandStop,
  TbLink,
  TbCopy,
  TbCheck
} from "react-icons/tb";
const renderAlertIcon = (iconOrType, alertType) => {
  const key = alertType || iconOrType;
  switch (key) {
    case "knock":
    case "bell":
      return /* @__PURE__ */ React.createElement(TbBellFilled, { size: 18, className: "text-amber-400 shrink-0" });
    case "join":
      return /* @__PURE__ */ React.createElement(TbUserPlus, { size: 18, className: "text-emerald-400 shrink-0" });
    case "screen":
      return /* @__PURE__ */ React.createElement(TbScreenShare, { size: 18, className: "text-blue-400 shrink-0" });
    case "screen_stop":
      return /* @__PURE__ */ React.createElement(TbScreenShareOff, { size: 18, className: "text-slate-300 shrink-0" });
    case "chat":
      return /* @__PURE__ */ React.createElement(TbMessageCircle, { size: 18, className: "text-purple-400 shrink-0" });
    case "hand":
      return /* @__PURE__ */ React.createElement(TbHandStop, { size: 18, className: "text-amber-400 shrink-0" });
    case "mute":
      return /* @__PURE__ */ React.createElement(FaMicrophoneSlash, { size: 18, className: "text-red-400 shrink-0" });
    default:
      if (iconOrType && typeof iconOrType !== "string") return iconOrType;
      return /* @__PURE__ */ React.createElement(RiInformationLine, { size: 18, className: "text-blue-400 shrink-0" });
  }
};
const getViewTransitionName = (identity) => {
  if (!identity) return "none";
  const safeId = String(identity).replace(/[^a-zA-Z0-9_-]/g, "_");
  return `tile_${safeId}`;
};
const withViewTransition = (callback) => {
  if (typeof document !== "undefined" && typeof document.startViewTransition === "function") {
    try {
      document.startViewTransition(() => {
        flushSync(() => {
          callback();
        });
      });
      return;
    } catch (err) {
      console.warn("View Transition fallback:", err);
    }
  }
  callback();
};
const CHAT_STORAGE_PREFIX = "meeting_chat_";
const getStoredChatMessages = (id) => {
  if (!id) return [];
  try {
    const raw = localStorage.getItem(`${CHAT_STORAGE_PREFIX}${id}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.messages)) {
      return parsed.messages;
    }
  } catch (err) {
    console.warn("Chat storage o'qishda xatolik:", err);
  }
  return [];
};
const saveStoredChatMessages = (id, messages) => {
  if (!id || !messages) return;
  try {
    localStorage.setItem(
      `${CHAT_STORAGE_PREFIX}${id}`,
      JSON.stringify({
        timestamp: Date.now(),
        messages
      })
    );
  } catch (err) {
    console.warn("Chat storage saqlashda xatolik:", err);
  }
};
const clearStoredChatMessages = (id) => {
  if (!id) return;
  try {
    localStorage.removeItem(`${CHAT_STORAGE_PREFIX}${id}`);
  } catch (err) {
    console.warn("Chat storage tozalashda xatolik:", err);
  }
};
const getMeetingOrganizerId = (meetingDetails, meetingState) => {
  const val = meetingDetails?.organizer?.id ?? meetingDetails?.organizer_info?.id ?? (typeof meetingDetails?.organizer === "number" || typeof meetingDetails?.organizer === "string" ? meetingDetails.organizer : null) ?? meetingDetails?.created_by?.id ?? (typeof meetingDetails?.created_by === "number" || typeof meetingDetails?.created_by === "string" ? meetingDetails.created_by : null) ?? meetingState?.organizer_id ?? meetingState?.organizer?.id ?? (typeof meetingState?.organizer === "number" || typeof meetingState?.organizer === "string" ? meetingState.organizer : null);
  return val ? String(val) : null;
};
const getMeetingOrganizerUser = (meetingDetails, organizerId) => {
  if (meetingDetails?.organizer && typeof meetingDetails.organizer === "object" && meetingDetails.organizer.id) {
    return meetingDetails.organizer;
  }
  if (meetingDetails?.organizer_info && typeof meetingDetails.organizer_info === "object") {
    return meetingDetails.organizer_info;
  }
  if (meetingDetails?.created_by && typeof meetingDetails.created_by === "object" && meetingDetails.created_by.id) {
    return meetingDetails.created_by;
  }
  if (organizerId && Array.isArray(meetingDetails?.participants_info)) {
    return meetingDetails.participants_info.find((u) => String(u.id) === String(organizerId));
  }
  return null;
};
const isParticipantInRoom = (req, remotes) => {
  if (!req || !remotes || remotes.length === 0) return false;
  return remotes.some((rp) => {
    const sId = String(rp.identity || "");
    const sReqId = String(req.user_id || "");
    const rpName = (rp.name || "").trim().toLowerCase();
    const reqName = (req.username || "").trim().toLowerCase();
    if (sReqId && (sId === sReqId || sId.startsWith(sReqId + "_") || sId.endsWith("_" + sReqId))) {
      return true;
    }
    if (reqName && rpName && (rpName === reqName || sId.toLowerCase() === reqName)) {
      return true;
    }
    return false;
  });
};
export default function MeetingRoom() {
  const { id: rawParamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [meetingState, setMeetingState] = useState(null);
  const meetingStateRef = useRef(null);
  const [numericMeetingId, setNumericMeetingId] = useState(() => {
    return parseMeetingId(rawParamId);
  });
  const meetingId = numericMeetingId || parseMeetingId(rawParamId) || (meetingDetails?.id ? String(meetingDetails.id) : null);
  const [waitingState, setWaitingState] = useState("lobby");
  const hasClickedJoinRef = useRef(false);
  const [isJoining, setIsJoining] = useState(false);
  const [rejectedMessage, setRejectedMessage] = useState("");
  const [knockRequests, setKnockRequests] = useState([]);
  const canAdmitParticipantsRef = useRef(false);
  const [networkStatus, setNetworkStatus] = useState("online");
  const [showReconnectedBanner, setShowReconnectedBanner] = useState(false);
  useEffect(() => {
    meetingStateRef.current = meetingState;
  }, [meetingState]);
  const roomRef = useRef(null);
  const [isConnectedToLiveKit, setIsConnectedToLiveKit] = useState(false);
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [activeSpeakers, setActiveSpeakers] = useState([]);
  const [participantTracks, setParticipantTracks] = useState({});
  const [handRaisedMap, setHandRaisedMap] = useState({});
  const [unmuteRequest, setUnmuteRequest] = useState(null);
  const isLocalHostRef = useRef(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const isMicEnabledRef = useRef(true);
  const isCameraEnabledRef = useRef(true);
  useEffect(() => {
    isMicEnabledRef.current = isMicEnabled;
  }, [isMicEnabled]);
  useEffect(() => {
    isCameraEnabledRef.current = isCameraEnabled;
  }, [isCameraEnabled]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localScreenTrack, setLocalScreenTrack] = useState(null);
  const [screenShareVersion, setScreenShareVersion] = useState(0);
  const isChangingScreenShareRef = useRef(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [pinnedId, setPinnedId] = useState(null);
  const screenShareTimesRef = useRef({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [copiedHeaderLink, setCopiedHeaderLink] = useState(false);
  const [chatMessages, setChatMessages] = useState(() => getStoredChatMessages(meetingId));
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [meetingDuration, setMeetingDuration] = useState(0);
  const [endedReason, setEndedReason] = useState("Yig'ilish yakunlandi");
  useEffect(() => {
    if (!meetingId) return;
    if (chatMessages && chatMessages.length > 0) {
      saveStoredChatMessages(meetingId, chatMessages);
    }
  }, [chatMessages, meetingId]);
  useEffect(() => {
    if (!meetingId) return;
    const stored = getStoredChatMessages(meetingId);
    if (stored.length > 0) {
      setChatMessages((prev) => prev.length === 0 ? stored : prev);
    }
  }, [meetingId]);
  const [inRoomAlert, setInRoomAlert] = useState(null);
  const inRoomAlertTimerRef = useRef(null);
  const triggerInRoomAlert = useCallback((icon, text, type = "info") => {
    if (inRoomAlertTimerRef.current) {
      clearTimeout(inRoomAlertTimerRef.current);
    }
    setInRoomAlert({ icon, text, type, id: Date.now() });
    inRoomAlertTimerRef.current = setTimeout(() => {
      setInRoomAlert(null);
    }, 4e3);
  }, []);
  useEffect(() => {
    const code = getMeetingCode(meetingId);
    if (!code) return;
    const targetPath = `/meetings/${code}`;
    if (typeof window !== "undefined" && decodeURIComponent(window.location.pathname) !== targetPath && window.location.pathname !== targetPath) {
      window.history.replaceState(null, "", targetPath);
    }
  }, [meetingId]);
  const currentMeetingCode = getMeetingCode(meetingId);
  const currentMeetingUrl = getFullMeetingUrl(meetingId);
  const handleCopyMeetingLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentMeetingUrl).then(() => {
        setCopiedHeaderLink(true);
        toast.success("Nusxa olindi", "Yig'ilish havolasi nusxalandi");
        setTimeout(() => setCopiedHeaderLink(false), 2e3);
      }).catch(() => {
      });
    }
  };
  const wsRef = useRef(null);
  const previewStreamRef = useRef(null);
  const currentUserName = user?.username || user?.first_name || "Foydalanuvchi";
  useEffect(() => {
    let stream = null;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true }).then((s) => {
      if (waitingState === "in_room" || roomRef.current) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = s;
      previewStreamRef.current = s;
      setLocalStream(s);
    }).catch((err) => {
      console.warn("Media devices not accessible or permission denied:", err);
    });
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((t) => t.stop());
        previewStreamRef.current = null;
      }
    };
  }, []);
  useEffect(() => {
    if (waitingState !== "in_room") return;
    const timer = setInterval(() => {
      setMeetingDuration((p) => p + 1);
    }, 1e3);
    return () => clearInterval(timer);
  }, [waitingState]);
  useEffect(() => {
    const handleOnline = () => {
      if (roomRef.current?.state === "connected") {
        setNetworkStatus("online");
        setShowReconnectedBanner(true);
        setTimeout(() => setShowReconnectedBanner(false), 3500);
      }
    };
    const handleOffline = () => {
      setNetworkStatus("offline");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  useEffect(() => {
    hasClickedJoinRef.current = false;
    if (roomRef.current) {
      roomRef.current.disconnect().catch(() => {
      });
      roomRef.current = null;
      setIsConnectedToLiveKit(false);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [localStream]);
  const handleToggleLobbyCamera = useCallback(async () => {
    if (isCameraEnabledRef.current) {
      if (localStream) {
        localStream.getVideoTracks().forEach((t) => {
          t.stop();
        });
      }
      if (previewStreamRef.current) {
        previewStreamRef.current.getVideoTracks().forEach((t) => {
          t.stop();
        });
      }
      const remainingAudioTracks = localStream ? localStream.getAudioTracks() : [];
      const newStream = new MediaStream(remainingAudioTracks);
      previewStreamRef.current = newStream;
      setLocalStream(newStream);
      setIsCameraEnabled(false);
      isCameraEnabledRef.current = false;
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        if (newVideoTrack) {
          const currentAudioTracks = localStream ? localStream.getAudioTracks() : [];
          const combinedStream = new MediaStream([...currentAudioTracks, newVideoTrack]);
          previewStreamRef.current = combinedStream;
          setLocalStream(combinedStream);
        }
      } catch (err) {
        console.warn("Kamerani yoqishda xatolik:", err);
        toast.error("Xatolik", "Kameraga ulanib bo'lmadi");
      }
      setIsCameraEnabled(true);
      isCameraEnabledRef.current = true;
    }
  }, [localStream]);
  const handleToggleLobbyMic = useCallback(async () => {
    if (isMicEnabledRef.current) {
      if (localStream) {
        localStream.getAudioTracks().forEach((t) => {
          t.stop();
        });
      }
      if (previewStreamRef.current) {
        previewStreamRef.current.getAudioTracks().forEach((t) => {
          t.stop();
        });
      }
      const remainingVideoTracks = localStream ? localStream.getVideoTracks() : [];
      const newStream = new MediaStream(remainingVideoTracks);
      previewStreamRef.current = newStream;
      setLocalStream(newStream);
      setIsMicEnabled(false);
      isMicEnabledRef.current = false;
    } else {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newAudioTrack = audioStream.getAudioTracks()[0];
        if (newAudioTrack) {
          const currentVideoTracks = localStream ? localStream.getVideoTracks() : [];
          const combinedStream = new MediaStream([...currentVideoTracks, newAudioTrack]);
          previewStreamRef.current = combinedStream;
          setLocalStream(combinedStream);
        }
      } catch (err) {
        console.warn("Mikrofonni yoqishda xatolik:", err);
        toast.error("Xatolik", "Mikrofonga ulanib bo'lmadi");
      }
      setIsMicEnabled(true);
      isMicEnabledRef.current = true;
    }
  }, [localStream]);
  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };
  useEffect(() => {
    const extractedId = parseMeetingId(rawParamId) || meetingId;
    const queryTarget = extractedId || rawParamId;
    if (!queryTarget) return;
    let isSubscribed = true;
    const fetchMeeting = async () => {
      if (extractedId && /^\d+$/.test(String(extractedId))) {
        try {
          const res = await axiosAPI.get(`/meetings/${extractedId}/`);
          const d = res.data?.data ?? res.data;
          if (isSubscribed && d && d.id) {
            setMeetingDetails(d);
            setNumericMeetingId(String(d.id));
            return;
          }
        } catch (err) {
          console.warn("Yig'ilish ma'lumotlarini ID orqali olishda xatolik:", err);
        }
      }
      try {
        const res = await axiosAPI.get(`/meetings/${encodeURIComponent(queryTarget)}/`);
        const d = res.data?.data ?? res.data;
        if (isSubscribed && d && d.id) {
          setMeetingDetails(d);
          setNumericMeetingId(String(d.id));
          return;
        }
      } catch (err) {
      }
      try {
        const searchTerm = rawParamId || queryTarget;
        const res = await axiosAPI.get("/meetings/", { params: { search: searchTerm } });
        const results = res.data?.data?.results ?? res.data?.results ?? res.data;
        if (isSubscribed && Array.isArray(results) && results.length > 0) {
          const match = results.find((m) => String(m.uid).trim() === String(searchTerm).trim() || String(m.id) === String(extractedId)) || results[0];
          if (match && match.id) {
            setMeetingDetails(match);
            setNumericMeetingId(String(match.id));
          }
        }
      } catch (err) {
        console.warn("Yig'ilishni qidirishda xato:", err);
      }
    };
    fetchMeeting();
    return () => {
      isSubscribed = false;
    };
  }, [rawParamId, meetingId]);
  useEffect(() => {
    const projId = meetingDetails?.project_info?.id ?? meetingDetails?.project?.id ?? (typeof meetingDetails?.project === "number" || typeof meetingDetails?.project === "string" ? meetingDetails.project : null);
    if (!projId) {
      setProjectData(null);
      return;
    }
    if (meetingDetails?.project_info?.manager || meetingDetails?.project_info?.manager_info) {
      setProjectData(meetingDetails.project_info);
    }
    axiosAPI.get(`/projects/${projId}/`).then((res) => {
      const p = res.data?.data ?? res.data;
      setProjectData(p);
    }).catch(() => {
    });
  }, [meetingDetails]);
  const sendWs = (payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  };
  const handleWsMessage = useCallback((msg) => {
    console.log("WS Event qabul qilindi:", msg.type, msg);
    switch (msg.type) {
      case "meeting_state": {
        setMeetingState(msg);
        if (!hasClickedJoinRef.current) {
          return;
        }
        if (msg.is_host) {
          sendWs({ action: "get_token" });
        } else {
          if (!msg.organizer_joined) {
            setWaitingState("waiting_organizer");
            setIsJoining(false);
          } else {
            if (msg.requires_approval && !msg.is_approved) {
              setWaitingState("waiting_approval");
              sendWs({ action: "ask_to_join" });
              setIsJoining(false);
            } else {
              setWaitingState("connecting");
              sendWs({ action: "get_token" });
            }
          }
        }
        break;
      }
      case "organizer_joined": {
        setMeetingState((prev) => prev ? { ...prev, organizer_joined: true } : prev);
        if (!hasClickedJoinRef.current) {
          return;
        }
        if (waitingState === "waiting_organizer") {
          if (meetingState?.requires_approval && !meetingState?.is_approved) {
            setWaitingState("waiting_approval");
            sendWs({ action: "ask_to_join" });
            setIsJoining(false);
          } else {
            setWaitingState("connecting");
            sendWs({ action: "get_token" });
          }
        }
        break;
      }
      case "knock_request": {
        if (canAdmitParticipantsRef.current) {
          playKnockRequestSound();
          triggerInRoomAlert("bell", `${msg.username || "Foydalanuvchi"} yig'ilishga kirishni so'ramoqda`, "knock");
        }
        setKnockRequests((prev) => {
          if (prev.some((k) => k.user_id === msg.user_id)) return prev;
          return [...prev, {
            user_id: msg.user_id,
            username: msg.username,
            avatar: msg.avatar
          }];
        });
        break;
      }
      case "knock_response":
      case "knock_handled":
      case "knock_approved":
      case "knock_rejected": {
        const handledUserId = msg.user_id || msg.guest_id;
        if (handledUserId) {
          setKnockRequests((prev) => prev.filter((k) => String(k.user_id) !== String(handledUserId)));
        }
        if (msg.status === "approved") {
          setIsJoining(false);
          if (!hasClickedJoinRef.current) {
            return;
          }
          if (msg.server_url && msg.token) {
            connectToLiveKit(msg.server_url, msg.token);
          } else if (waitingState === "waiting_approval") {
            sendWs({ action: "get_token" });
          }
        } else if (msg.status === "rejected") {
          setIsJoining(false);
          if (waitingState === "waiting_approval") {
            setWaitingState("rejected");
            setRejectedMessage(msg.message || "Tashkilotchi yig'ilishga kirishingizni rad etdi.");
          }
        }
        break;
      }
      case "token_response": {
        setIsJoining(false);
        if (!hasClickedJoinRef.current) {
          console.warn("token_response keldi, lekin foydalanuvchi hali Lobby'da! Ulanish to'xtatildi.");
          return;
        }
        if (msg.status === "joined" && msg.server_url && msg.token) {
          connectToLiveKit(msg.server_url, msg.token);
        }
        break;
      }
      case "meeting_ended": {
        clearStoredChatMessages(meetingId);
        setChatMessages([]);
        setWaitingState("ended");
        setEndedReason(msg.message || "Yig'ilish tashkilotchi tomonidan yakunlandi.");
        leaveLiveKit();
        break;
      }
      case "error": {
        const code = msg.code;
        const message = msg.message || "Xatolik yuz berdi";
        toast.error("Xatolik", message);
        if (code === 403 || code === 404 || code === 401) {
          setTimeout(() => navigate(-1), 1500);
        }
        break;
      }
      default:
        break;
    }
  }, [waitingState, meetingState]);
  const handleWsMessageRef = useRef(null);
  handleWsMessageRef.current = handleWsMessage;
  const connectWs = useCallback(async () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    try {
      const { data: ticketRes } = await axiosAPI.post("/notifications/tickets/");
      const ticket = ticketRes?.data?.ticket || ticketRes?.ticket;
      if (!ticket) {
        toast.error("Xatolik", "WebSocket uchun bilet olinmadi");
        setIsJoining(false);
        setWaitingState("lobby");
        return;
      }
      const rawBase = import.meta.env.VITE_BASE_URL;
      const wsUrl = `${rawBase}/ws/meetings/${meetingId}/?ticket=${ticket}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => {
        console.log("WebSocket ulangan:", wsUrl);
      };
      ws.onmessage = (event) => {
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        handleWsMessageRef.current?.(msg);
      };
      ws.onerror = (err) => {
        console.error("WebSocket xatosi:", err);
      };
      ws.onclose = (evt) => {
        console.log("WebSocket yopildi:", evt.code, evt.reason);
      };
    } catch (err) {
      console.error("WebSocket ulanishda xato:", err);
      setIsJoining(false);
      setWaitingState("lobby");
      toast.error("Xatolik", "Server bilan ulanishda muammo yuz berdi");
    }
  }, [meetingId]);
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);
  const checkIsHost = useCallback((participantObj, identity, name) => {
    const organizerId = getMeetingOrganizerId(meetingDetails, meetingState);
    if (!organizerId) return false;
    const sOrgId = String(organizerId);
    const sIdentity = String(identity || "");
    if (sIdentity === sOrgId || sIdentity.startsWith(sOrgId + "_") || sIdentity.endsWith("_" + sOrgId)) {
      return true;
    }
    const organizerUser = getMeetingOrganizerUser(meetingDetails, organizerId);
    if (organizerUser) {
      const sOrgUserId = String(organizerUser.id || "");
      if (sOrgUserId && (sIdentity === sOrgUserId || sIdentity.startsWith(sOrgUserId + "_") || sIdentity.endsWith("_" + sOrgUserId))) {
        return true;
      }
      if (organizerUser.username && sIdentity.toLowerCase() === organizerUser.username.toLowerCase()) {
        return true;
      }
      const orgFullName = `${organizerUser.first_name || ""} ${organizerUser.last_name || ""}`.trim();
      if (orgFullName && name && name.trim().toLowerCase() === orgFullName.toLowerCase()) {
        return true;
      }
    }
    return false;
  }, [meetingDetails, meetingState]);
  const handleJoinFromLobby = useCallback(() => {
    hasClickedJoinRef.current = true;
    setIsJoining(true);
    setWaitingState("connecting");
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      connectWs();
    } else {
      const state = meetingStateRef.current || meetingState;
      if (!state) {
        sendWs({ action: "get_token" });
      } else if (state.is_host) {
        sendWs({ action: "get_token" });
      } else {
        if (!state.organizer_joined) {
          setWaitingState("waiting_organizer");
          setIsJoining(false);
        } else if (state.requires_approval && !state.is_approved) {
          setWaitingState("waiting_approval");
          sendWs({ action: "ask_to_join" });
          setIsJoining(false);
        } else {
          setWaitingState("connecting");
          sendWs({ action: "get_token" });
        }
      }
    }
  }, [connectWs, meetingState]);
  const handleCancelWait = useCallback(() => {
    hasClickedJoinRef.current = false;
    setIsJoining(false);
    setWaitingState("lobby");
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (roomRef.current) {
      leaveLiveKit();
    }
  }, []);
  const connectToLiveKit = async (serverUrl, token) => {
    try {
      if (!hasClickedJoinRef.current) {
        console.warn("connectToLiveKit chaqirildi, lekin hasClickedJoinRef hali false! LiveKit ulanishi bekor qilindi.");
        return;
      }
      if (roomRef.current) {
        return;
      }
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        stopLocalTrackOnUnpublish: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true
        },
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
          simulcast: true
        },
        publishDefaults: {
          simulcast: true,
          videoSimulcastLayers: [
            VideoPresets.h1080,
            VideoPresets.h720,
            VideoPresets.h360
          ]
        }
      });
      roomRef.current = room;
      setupRoomListeners(room);
      await room.connect(serverUrl, token);
      console.log("LiveKit xonaga ulandi:", room.name);
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((t) => t.stop());
        previewStreamRef.current = null;
      }
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        setLocalStream(null);
      }
      const initialCam = isCameraEnabledRef.current;
      const initialMic = isMicEnabledRef.current;
      try {
        if (initialCam) {
          await room.localParticipant.setCameraEnabled(true);
        } else {
          await room.localParticipant.setCameraEnabled(false);
        }
      } catch (mediaErr) {
        console.warn("Kamerani sozlashda xatolik:", mediaErr);
      }
      try {
        if (initialMic) {
          await room.localParticipant.setMicrophoneEnabled(true);
        } else {
          await room.localParticipant.setMicrophoneEnabled(false);
        }
      } catch (mediaErr) {
        console.warn("Mikrofonni sozlashda xatolik:", mediaErr);
      }
      setIsCameraEnabled(initialCam);
      setIsMicEnabled(initialMic);
      const initialOrgId = getMeetingOrganizerId(meetingDetails, meetingState);
      const isInitialLocalHost = Boolean(
        user?.id && initialOrgId && String(user.id) === String(initialOrgId)
      );
      const camTrack = initialCam ? room.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack : null;
      updateParticipantTrack(room.localParticipant.identity, {
        videoTrack: camTrack,
        audioTrack: null,
        isCameraEnabled: initialCam,
        isMicEnabled: initialMic,
        name: room.localParticipant.name || currentUserName,
        isLocal: true,
        isHost: isInitialLocalHost
      });
      const initialRemotes = Array.from(room.remoteParticipants.values());
      setRemoteParticipants(initialRemotes);
      const initialTracks = {};
      initialRemotes.forEach((rp) => {
        const rpIsHost = checkIsHost(rp, rp.identity, rp.name);
        const info = {
          name: rp.name || rp.identity,
          isLocal: false,
          isHost: rpIsHost,
          isCameraEnabled: rp.isCameraEnabled,
          isMicEnabled: rp.isMicrophoneEnabled,
          videoTrack: null,
          audioTrack: null,
          screenShareTrack: null
        };
        rp.trackPublications.forEach((pub) => {
          if (pub.track) {
            if (pub.kind === Track.Kind.Video) {
              if (pub.source === Track.Source.ScreenShare) {
                info.screenShareTrack = pub.track;
                if (!screenShareTimesRef.current[rp.identity]) {
                  screenShareTimesRef.current[rp.identity] = Date.now();
                }
              } else {
                info.videoTrack = pub.track;
                info.isCameraEnabled = !pub.isMuted;
              }
            } else if (pub.kind === Track.Kind.Audio) {
              info.audioTrack = pub.track;
              info.isMicEnabled = !pub.isMuted;
            }
          }
        });
        initialTracks[rp.identity] = info;
      });
      setParticipantTracks((prev) => ({ ...prev, ...initialTracks }));
      if (room.canPlaybackAudio) {
        room.startAudio().catch(() => {
        });
      }
      setIsConnectedToLiveKit(true);
      setWaitingState("in_room");
    } catch (err) {
      console.error("LiveKit xonasiga ulanishda xato:", err);
      toast.error("Xatolik", "Video xonaga ulanishda muammo yuz berdi");
    }
  };
  const setupRoomListeners = (room) => {
    room.on(RoomEvent.ParticipantConnected, (participant) => {
      setRemoteParticipants(Array.from(room.remoteParticipants.values()));
      setKnockRequests((prev) => prev.filter((req) => {
        const sId = String(participant.identity || "");
        const sReqId = String(req.user_id || "");
        const pName2 = (participant.name || "").trim().toLowerCase();
        const reqName = (req.username || "").trim().toLowerCase();
        if (sReqId && (sId === sReqId || sId.startsWith(sReqId + "_") || sId.endsWith("_" + sReqId))) {
          return false;
        }
        if (reqName && pName2 && (pName2 === reqName || sId.toLowerCase() === reqName)) {
          return false;
        }
        return true;
      }));
      const pIsHost = checkIsHost(participant, participant.identity, participant.name);
      playParticipantJoinedSound();
      const pName = participant.name || participant.identity || "Yangi ishtirokchi";
      triggerInRoomAlert("join", `${pName} yig'ilishga qo'shildi`, "join");
      setParticipantTracks((prev) => ({
        ...prev,
        [participant.identity]: {
          name: participant.name || participant.identity,
          isLocal: false,
          isHost: pIsHost,
          isCameraEnabled: participant.isCameraEnabled,
          isMicEnabled: participant.isMicrophoneEnabled,
          videoTrack: null,
          audioTrack: null,
          screenShareTrack: null
        }
      }));
    });
    room.on(RoomEvent.ParticipantDisconnected, (participant) => {
      delete screenShareTimesRef.current[participant.identity];
      setPinnedId((prev) => prev && prev.startsWith(participant.identity) ? null : prev);
      setRemoteParticipants(Array.from(room.remoteParticipants.values()));
      setParticipantTracks((prev) => {
        const next = { ...prev };
        delete next[participant.identity];
        return next;
      });
      setHandRaisedMap((prev) => {
        const next = { ...prev };
        delete next[participant.identity];
        return next;
      });
    });
    room.on(RoomEvent.TrackPublished, (publication, participant) => {
      if (participant.isLocal) return;
      setRemoteParticipants(Array.from(room.remoteParticipants.values()));
    });
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (participant.isLocal) return;
      const pIsHost = checkIsHost(participant, participant.identity, participant.name);
      const isScreen = publication.source === Track.Source.ScreenShare || track.source === Track.Source.ScreenShare;
      if (track.kind === Track.Kind.Video && isScreen) {
        screenShareTimesRef.current[participant.identity] = Date.now();
        playScreenShareStartSound();
        const pName = participant.name || participant.identity || "Ishtirokchi";
        triggerInRoomAlert("screen", `${pName} ekranini ulashdi`, "screen");
      }
      setParticipantTracks((prev) => {
        const cur = {
          name: participant.name || participant.identity,
          isLocal: false,
          isHost: pIsHost,
          isCameraEnabled: participant.isCameraEnabled,
          isMicEnabled: participant.isMicrophoneEnabled,
          videoTrack: null,
          audioTrack: null,
          screenShareTrack: null,
          ...prev[participant.identity] || {}
        };
        if (track.kind === Track.Kind.Video) {
          if (isScreen) {
            cur.screenShareTrack = track;
          } else {
            cur.videoTrack = track;
            cur.isCameraEnabled = true;
          }
        } else if (track.kind === Track.Kind.Audio) {
          cur.audioTrack = track;
          cur.isMicEnabled = true;
        }
        return { ...prev, [participant.identity]: cur };
      });
    });
    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (participant.isLocal) return;
      const isScreen = publication.source === Track.Source.ScreenShare || track.source === Track.Source.ScreenShare;
      if (track.kind === Track.Kind.Video && isScreen) {
        delete screenShareTimesRef.current[participant.identity];
        playScreenShareStopSound();
      }
      setParticipantTracks((prev) => {
        const cur = prev[participant.identity];
        if (!cur) return prev;
        const next = { ...cur };
        if (track.kind === Track.Kind.Video) {
          if (isScreen) {
            next.screenShareTrack = null;
          } else {
            next.videoTrack = null;
            next.isCameraEnabled = false;
          }
        } else if (track.kind === Track.Kind.Audio) {
          next.audioTrack = null;
          next.isMicEnabled = false;
        }
        return { ...prev, [participant.identity]: next };
      });
    });
    room.on(RoomEvent.TrackUnpublished, (publication, participant) => {
      if (participant.isLocal) return;
      const isScreen = publication.source === Track.Source.ScreenShare;
      setParticipantTracks((prev) => {
        const cur = prev[participant.identity];
        if (!cur) return prev;
        const next = { ...cur };
        if (isScreen) {
          delete screenShareTimesRef.current[participant.identity];
          next.screenShareTrack = null;
        } else if (publication.kind === Track.Kind.Video) {
          next.videoTrack = null;
          next.isCameraEnabled = false;
        } else if (publication.kind === Track.Kind.Audio) {
          next.audioTrack = null;
          next.isMicEnabled = false;
        }
        return { ...prev, [participant.identity]: next };
      });
    });
    room.on(RoomEvent.TrackMuted, (publication, participant) => {
      if (participant.isLocal) return;
      const isScreen = publication.source === Track.Source.ScreenShare;
      setParticipantTracks((prev) => {
        const cur = prev[participant.identity];
        if (!cur) return prev;
        const next = { ...cur };
        if (isScreen) {
          next.screenShareTrack = null;
        } else if (publication.kind === Track.Kind.Video) {
          next.isCameraEnabled = false;
        } else if (publication.kind === Track.Kind.Audio) {
          next.isMicEnabled = false;
        }
        return { ...prev, [participant.identity]: next };
      });
    });
    room.on(RoomEvent.TrackUnmuted, (publication, participant) => {
      if (participant.isLocal) return;
      const isScreen = publication.source === Track.Source.ScreenShare;
      setParticipantTracks((prev) => {
        const cur = prev[participant.identity];
        if (!cur) return prev;
        const next = { ...cur };
        if (isScreen) {
          next.screenShareTrack = publication.track;
        } else if (publication.kind === Track.Kind.Video) {
          next.isCameraEnabled = true;
          next.videoTrack = publication.track;
        } else if (publication.kind === Track.Kind.Audio) {
          next.isMicEnabled = true;
          next.audioTrack = publication.track;
        }
        return { ...prev, [participant.identity]: next };
      });
    });
    room.on(RoomEvent.LocalTrackPublished, (publication) => {
      if (publication.source === Track.Source.ScreenShare) {
        screenShareTimesRef.current["local-screen"] = Date.now();
        setLocalScreenTrack(publication.videoTrack || publication.track);
        setIsScreenSharing(true);
      }
    });
    room.on(RoomEvent.LocalTrackUnpublished, (publication) => {
      if (publication.source === Track.Source.ScreenShare) {
        if (!isChangingScreenShareRef.current) {
          delete screenShareTimesRef.current["local-screen"];
          setLocalScreenTrack(null);
          setIsScreenSharing(false);
        }
      }
    });
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      setActiveSpeakers(speakers.map((s) => s.identity));
    });
    room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      if (!room.canPlaybackAudio) {
        console.log("LiveKit: Audio autoplay blocked by browser, user click needed");
      }
    });
    room.on(RoomEvent.DataReceived, (payload, participant) => {
      try {
        const decoded = JSON.parse(new TextDecoder().decode(payload));
        if (decoded.type === "chat") {
          setChatMessages((prev) => {
            const next = [...prev, decoded];
            saveStoredChatMessages(meetingId, next);
            return next;
          });
          playChatMessageSound();
          if (!isChatOpen) {
            setUnreadChatCount((c) => c + 1);
            triggerInRoomAlert("chat", `${decoded.sender}: ${decoded.text?.slice(0, 40)}${decoded.text?.length > 40 ? "..." : ""}`, "chat");
          }
        } else if (decoded.type === "raise_hand") {
          const pIdentity = participant ? participant.identity : decoded.userId;
          setHandRaisedMap((prev) => ({
            ...prev,
            [pIdentity]: decoded.isRaised
          }));
          if (decoded.isRaised) {
            playHandRaisedSound();
            triggerInRoomAlert("hand", `${decoded.sender || "Ishtirokchi"} qo'l ko'tardi`, "hand");
          }
        } else if (decoded.type === "mute_participant") {
          const myIdentity = room.localParticipant?.identity;
          if (decoded.targetUserId === "ALL" || decoded.targetUserId === myIdentity) {
            if (decoded.targetUserId === "ALL" && isLocalHostRef.current) {
              return;
            }
            if (isMicEnabledRef.current) {
              if (room.localParticipant) {
                const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
                if (micPub?.track) {
                  micPub.track.mediaStreamTrack?.stop();
                  room.localParticipant.unpublishTrack(micPub.track, true).catch(() => {
                  });
                }
                room.localParticipant.setMicrophoneEnabled(false).catch(() => {
                });
                updateParticipantTrack(room.localParticipant.identity, { isMicEnabled: false });
              }
              setIsMicEnabled(false);
              isMicEnabledRef.current = false;
              toast.warning("Mikrofon o'chirildi", "Tashkilotchi mikrofoningizni o'chirib qo'ydi");
              triggerInRoomAlert("mute", "Tashkilotchi mikrofoningizni o'chirdi", "mute");
            }
          }
        } else if (decoded.type === "ask_unmute") {
          const myIdentity = room.localParticipant?.identity;
          if (decoded.targetUserId === myIdentity) {
            setUnmuteRequest({
              sender: decoded.sender || "Tashkilotchi",
              timestamp: Date.now()
            });
            playKnockRequestSound();
          }
        }
      } catch (err) {
        console.error("Data channel parslashda xato:", err);
      }
    });
    room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      if (participant.isLocal) {
        if (quality === ConnectionQuality.Poor) {
          setNetworkStatus("poor");
        } else if (quality === ConnectionQuality.Lost) {
          setNetworkStatus("reconnecting");
        } else if (quality === ConnectionQuality.Good || quality === ConnectionQuality.Excellent) {
          setNetworkStatus((prev) => prev === "poor" ? "online" : prev);
        }
      }
    });
    room.on(RoomEvent.Reconnecting, () => {
      setNetworkStatus("reconnecting");
    });
    room.on(RoomEvent.Reconnected, () => {
      setNetworkStatus("online");
      setShowReconnectedBanner(true);
      setTimeout(() => setShowReconnectedBanner(false), 3500);
    });
    room.on(RoomEvent.Disconnected, (reason) => {
      console.log("Xonadan uzildi:", reason);
      setIsConnectedToLiveKit(false);
      if (waitingState !== "ended") {
        setWaitingState("ended");
        setEndedReason("Yig'ilishdan uzildingiz.");
      }
    });
  };
  const updateParticipantTrack = (identity, updates) => {
    setParticipantTracks((prev) => ({
      ...prev,
      [identity]: { ...prev[identity] || {}, ...updates }
    }));
  };
  const leaveLiveKit = async () => {
    try {
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((t) => t.stop());
        previewStreamRef.current = null;
      }
      if (roomRef.current) {
        roomRef.current.localParticipant?.trackPublications?.forEach((pub) => {
          if (pub.track?.mediaStreamTrack) {
            try {
              pub.track.mediaStreamTrack.stop();
              pub.track.stop();
            } catch {
            }
          }
        });
        await roomRef.current.disconnect();
        roomRef.current = null;
      }
      setIsConnectedToLiveKit(false);
    } catch {
    }
  };
  const handleToggleMic = async () => {
    const next = !isMicEnabled;
    setIsMicEnabled(next);
    if (roomRef.current?.localParticipant) {
      try {
        if (!next) {
          const micPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.Microphone);
          if (micPub?.track) {
            micPub.track.mediaStreamTrack?.stop();
            await roomRef.current.localParticipant.unpublishTrack(micPub.track, true);
          }
          await roomRef.current.localParticipant.setMicrophoneEnabled(false);
        } else {
          await roomRef.current.localParticipant.setMicrophoneEnabled(true);
        }
      } catch (err) {
        console.warn("Mikrofonni almashtirishda xatolik:", err);
      }
      updateParticipantTrack(roomRef.current.localParticipant.identity, { isMicEnabled: next });
    }
  };
  const handleToggleCamera = async () => {
    const next = !isCameraEnabled;
    setIsCameraEnabled(next);
    if (roomRef.current?.localParticipant) {
      try {
        if (!next) {
          const camPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera);
          if (camPub?.track) {
            camPub.track.mediaStreamTrack?.stop();
            await roomRef.current.localParticipant.unpublishTrack(camPub.track, true);
          }
          await roomRef.current.localParticipant.setCameraEnabled(false);
          updateParticipantTrack(roomRef.current.localParticipant.identity, {
            isCameraEnabled: false,
            videoTrack: null
          });
        } else {
          await roomRef.current.localParticipant.setCameraEnabled(true);
          const vTrack = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack;
          updateParticipantTrack(roomRef.current.localParticipant.identity, {
            isCameraEnabled: true,
            videoTrack: vTrack
          });
        }
      } catch (err) {
        console.warn("Kamerani almashtirishda xatolik:", err);
      }
    }
  };
  const handleStartScreenShare = async () => {
    try {
      if (roomRef.current?.localParticipant) {
        const publication = await roomRef.current.localParticipant.setScreenShareEnabled(true);
        const track = publication?.videoTrack || publication?.track || roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare)?.videoTrack;
        setLocalScreenTrack(track);
        setIsScreenSharing(true);
        playScreenShareStartSound();
        triggerInRoomAlert("screen", "Ekranni ulashish boshlandi", "screen");
        if (track?.mediaStreamTrack) {
          track.mediaStreamTrack.onended = () => {
            if (!isChangingScreenShareRef.current) {
              handleStopScreenShare();
            }
          };
        }
      }
    } catch (err) {
      console.warn("Ekran ulashish bekor qilindi yoki xato:", err);
      setLocalScreenTrack(null);
      setIsScreenSharing(false);
    }
  };
  const handleStopScreenShare = async () => {
    try {
      if (roomRef.current?.localParticipant) {
        const currentPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare);
        if (currentPub?.track) {
          if (currentPub.track.mediaStreamTrack) {
            currentPub.track.mediaStreamTrack.onended = null;
            currentPub.track.mediaStreamTrack.stop();
          }
          await roomRef.current.localParticipant.unpublishTrack(currentPub.track, true);
        }
        const audioPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShareAudio);
        if (audioPub?.track) {
          audioPub.track.mediaStreamTrack?.stop();
          await roomRef.current.localParticipant.unpublishTrack(audioPub.track, true);
        }
        await roomRef.current.localParticipant.setScreenShareEnabled(false);
      }
    } catch (err) {
      console.warn("Ekran ulashishni to'xtatishda xato:", err);
    } finally {
      playScreenShareStopSound();
      triggerInRoomAlert("screen_stop", "Ekran ulashuvi to'xtatildi", "screen_stop");
      delete screenShareTimesRef.current["local-screen"];
      setLocalScreenTrack(null);
      setIsScreenSharing(false);
    }
  };
  const handleChangeScreenShare = async () => {
    if (!roomRef.current?.localParticipant) return;
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    } catch (err) {
      console.log("Ekran tanlash bekor qilindi:", err);
      return;
    }
    const newMediaStreamTrack = stream?.getVideoTracks()?.[0];
    if (!newMediaStreamTrack) return;
    isChangingScreenShareRef.current = true;
    try {
      const currentPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare);
      const currentTrack = currentPub?.videoTrack || currentPub?.track;
      const oldMediaStreamTrack = currentTrack?.mediaStreamTrack;
      if (oldMediaStreamTrack) {
        oldMediaStreamTrack.onended = null;
      }
      newMediaStreamTrack.onended = () => {
        if (!isChangingScreenShareRef.current) {
          handleStopScreenShare();
        }
      };
      if (currentTrack && typeof currentTrack.replaceTrack === "function" && currentTrack.sender) {
        await currentTrack.replaceTrack(newMediaStreamTrack, { userProvidedTrack: false });
        if (oldMediaStreamTrack && oldMediaStreamTrack !== newMediaStreamTrack) {
          try {
            oldMediaStreamTrack.stop();
          } catch (e) {
            console.warn("Eski trackni to'xtatishda xato:", e);
          }
        }
        screenShareTimesRef.current["local-screen"] = Date.now();
        setLocalScreenTrack(currentTrack);
        setIsScreenSharing(true);
        setScreenShareVersion((v) => v + 1);
        triggerInRoomAlert("screen", "Ekran muvaffaqiyatli almashtirildi", "screen");
      } else {
        if (oldMediaStreamTrack) {
          try {
            oldMediaStreamTrack.stop();
          } catch (e) {
          }
        }
        if (currentTrack) {
          await roomRef.current.localParticipant.unpublishTrack(currentTrack, true);
        }
        const publication = await roomRef.current.localParticipant.publishTrack(newMediaStreamTrack, {
          source: Track.Source.ScreenShare,
          name: "screen"
        });
        const track = publication?.videoTrack || publication?.track;
        screenShareTimesRef.current["local-screen"] = Date.now();
        setLocalScreenTrack(track);
        setIsScreenSharing(true);
        newMediaStreamTrack.onended = () => {
          if (!isChangingScreenShareRef.current) {
            handleStopScreenShare();
          }
        };
        setScreenShareVersion((v) => v + 1);
        triggerInRoomAlert("screen", "Ekran muvaffaqiyatli almashtirildi", "screen");
      }
    } catch (err) {
      console.error("Ekranni almashtirishda xatolik:", err);
      try {
        newMediaStreamTrack.stop();
      } catch (e) {
      }
    } finally {
      setTimeout(() => {
        isChangingScreenShareRef.current = false;
      }, 1e3);
    }
  };
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await handleStopScreenShare();
    } else {
      await handleStartScreenShare();
    }
  };
  const handleToggleHandRaise = async () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    if (next) {
      playHandRaisedSound();
      triggerInRoomAlert("hand", "Siz qo'l ko'tardingiz", "hand");
    }
    if (roomRef.current?.localParticipant) {
      const data = {
        type: "raise_hand",
        isRaised: next,
        sender: currentUserName,
        userId: roomRef.current.localParticipant.identity
      };
      const payload = new TextEncoder().encode(JSON.stringify(data));
      await roomRef.current.localParticipant.publishData(payload, { reliable: true });
      setHandRaisedMap((prev) => ({
        ...prev,
        [roomRef.current.localParticipant.identity]: next
      }));
    }
  };
  const handleSendMessage = async (text) => {
    const messageData = {
      type: "chat",
      text,
      sender: currentUserName,
      time: (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    playChatMessageSound();
    setChatMessages((prev) => {
      const next = [...prev, messageData];
      saveStoredChatMessages(meetingId, next);
      return next;
    });
    if (roomRef.current?.localParticipant) {
      const payload = new TextEncoder().encode(JSON.stringify(messageData));
      await roomRef.current.localParticipant.publishData(payload, { reliable: true });
    }
  };
  const handleAdmitUser = async (userId) => {
    sendWs({
      action: "admit",
      user_id: userId,
      decision: "approve"
    });
    try {
      await axiosAPI.post(`/meetings/${meetingId}/admit/`, {
        user_id: userId,
        decision: "approve"
      });
    } catch {
    }
    setKnockRequests((prev) => prev.filter((k) => k.user_id !== userId));
    toast.success("Tasdiqlandi", "Foydalanuvchiga yig'ilishga kirishga ruxsat berildi");
  };
  const handleRejectUser = async (userId) => {
    sendWs({
      action: "admit",
      user_id: userId,
      decision: "reject"
    });
    try {
      await axiosAPI.post(`/meetings/${meetingId}/admit/`, {
        user_id: userId,
        decision: "reject"
      });
    } catch {
    }
    setKnockRequests((prev) => prev.filter((k) => k.user_id !== userId));
    toast.error("Rad etildi", "Foydalanuvchining kirish so'rovi rad etildi");
  };
  const handleMuteParticipant = async (targetIdentity) => {
    if (!isLocalHost) return;
    try {
      const payload = new TextEncoder().encode(JSON.stringify({
        type: "mute_participant",
        targetUserId: targetIdentity,
        sender: currentUserName
      }));
      await roomRef.current?.localParticipant?.publishData(payload, { reliable: true });
      toast.success("Ovoz o'chirildi", "Ishtirokchi mikrofoni o'chirildi");
      setParticipantTracks((prev) => {
        if (!prev[targetIdentity]) return prev;
        return {
          ...prev,
          [targetIdentity]: { ...prev[targetIdentity], isMicEnabled: false }
        };
      });
    } catch (err) {
      console.error("Mute yuborishda xato:", err);
      toast.error("Xatolik", "Ovozni o'chirishda muammo yuz berdi");
    }
  };
  const handleMuteAllParticipants = async () => {
    if (!isLocalHost) return;
    try {
      const payload = new TextEncoder().encode(JSON.stringify({
        type: "mute_participant",
        targetUserId: "ALL",
        sender: currentUserName
      }));
      await roomRef.current?.localParticipant?.publishData(payload, { reliable: true });
      toast.success("Barchasi o'chirildi", "Barcha ishtirokchilar mikrofoni o'chirildi");
      setParticipantTracks((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (!next[k].isLocal) {
            next[k] = { ...next[k], isMicEnabled: false };
          }
        });
        return next;
      });
    } catch (err) {
      console.error("Mute All yuborishda xato:", err);
    }
  };
  const handleAskUnmuteParticipant = async (targetIdentity) => {
    if (!isLocalHost) return;
    try {
      const payload = new TextEncoder().encode(JSON.stringify({
        type: "ask_unmute",
        targetUserId: targetIdentity,
        sender: currentUserName
      }));
      await roomRef.current?.localParticipant?.publishData(payload, { reliable: true });
      toast.info("So'rov yuborildi", "Ishtirokchiga mikrofonni yoqish taklifi yuborildi");
    } catch (err) {
      console.error("Ask to unmute yuborishda xato:", err);
    }
  };
  const handleEndMeetingForAll = async () => {
    try {
      await axiosAPI.post(`/meetings/${meetingId}/close/`);
      clearStoredChatMessages(meetingId);
      setChatMessages([]);
      toast.success("Yig'ilish yakunlandi", "Barcha qatnashchilar uchun yig'ilish to'xtatildi");
      leaveLiveKit();
      setWaitingState("ended");
    } catch (err) {
      console.error(err);
      toast.error("Xatolik", "Yig'ilishni to'xtatishda xatolik");
    }
  };
  const handleLeaveMeeting = () => {
    leaveLiveKit();
    if (wsRef.current) {
      wsRef.current.close();
    }
    navigate(-1);
  };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {
      });
    }
  };
  const allParticipantItems = [];
  if (roomRef.current?.localParticipant && isScreenSharing) {
    const trackToRender = localScreenTrack || roomRef.current.localParticipant.getTrackPublication(Track.Source.ScreenShare)?.videoTrack;
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
        shareTime: screenShareTimesRef.current["local-screen"] || 0
      });
    }
  }
  remoteParticipants.filter((rp) => rp.identity !== roomRef.current?.localParticipant?.identity).forEach((rp) => {
    const rInfo = participantTracks[rp.identity] || {};
    if (rInfo.screenShareTrack) {
      allParticipantItems.push({
        identity: `${rp.identity}-screen-${rInfo.screenShareTrack.sid || rInfo.screenShareTrack.id || "remote"}`,
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
        shareTime: screenShareTimesRef.current[rp.identity] || 0
      });
    }
  });
  const meetingOrganizerId = getMeetingOrganizerId(meetingDetails, meetingState);
  const isLocalHost = Boolean(
    user?.id && meetingOrganizerId && String(user.id) === String(meetingOrganizerId)
  );
  useEffect(() => {
    isLocalHostRef.current = isLocalHost;
  }, [isLocalHost]);
  const projectManagerId = projectData?.manager?.id ?? projectData?.manager_info?.id ?? (typeof projectData?.manager === "number" || typeof projectData?.manager === "string" ? projectData.manager : null) ?? meetingDetails?.project_info?.manager?.id ?? meetingDetails?.project_info?.manager_info?.id ?? (typeof meetingDetails?.project_info?.manager === "number" || typeof meetingDetails?.project_info?.manager === "string" ? meetingDetails.project_info.manager : null) ?? meetingDetails?.project?.manager?.id ?? meetingDetails?.project?.manager_info?.id ?? (typeof meetingDetails?.project?.manager === "number" || typeof meetingDetails?.project?.manager === "string" ? meetingDetails.project.manager : null);
  const isProjectManager = Boolean(
    user?.id && projectManagerId && String(user.id) === String(projectManagerId)
  );
  const isAdminOrSuperadmin = Boolean(
    user?.is_superuser || user?.is_staff || user?.role === "admin" || user?.role === "superadmin" || user?.active_role === "admin" || user?.active_role === "superadmin" || user?.roles?.includes?.("admin") || user?.roles?.includes?.("superadmin")
  );
  const canAdmitParticipants = Boolean(
    isLocalHost || isAdminOrSuperadmin || isProjectManager
  );
  useEffect(() => {
    canAdmitParticipantsRef.current = canAdmitParticipants;
  }, [canAdmitParticipants]);
  useEffect(() => {
    if (knockRequests.length === 0 || remoteParticipants.length === 0) return;
    setKnockRequests((prev) => {
      const filtered = prev.filter((req) => !isParticipantInRoom(req, remoteParticipants));
      return filtered.length !== prev.length ? filtered : prev;
    });
  }, [remoteParticipants, knockRequests.length]);
  const activeKnockRequests = knockRequests.filter((req) => !isParticipantInRoom(req, remoteParticipants));
  if (roomRef.current?.localParticipant) {
    const localId = roomRef.current.localParticipant.identity;
    const localInfo = participantTracks[localId] || {};
    allParticipantItems.push({
      identity: localId,
      name: currentUserName,
      isLocal: true,
      isScreenShare: false,
      isHost: isLocalHost,
      isSpeaking: activeSpeakers.includes(localId),
      hasHandRaised: !!handRaisedMap[localId] || isHandRaised,
      isCameraEnabled,
      isMicEnabled,
      videoTrack: localInfo.videoTrack || roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera)?.videoTrack,
      audioTrack: null
    });
  }
  remoteParticipants.filter((rp) => rp.identity !== roomRef.current?.localParticipant?.identity).forEach((rp) => {
    const rInfo = participantTracks[rp.identity] || {};
    const rpIsHost = checkIsHost(rp, rp.identity, rp.name || rInfo.name);
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
      audioTrack: rInfo.audioTrack
    });
  });
  const screenShareItems = allParticipantItems.filter((p) => p.isScreenShare);
  const cameraItems = allParticipantItems.filter((p) => !p.isScreenShare);
  const sortedScreenShares = [...screenShareItems].sort((a, b) => (a.shareTime || 0) - (b.shareTime || 0));
  const latestScreenShare = sortedScreenShares.length > 0 ? sortedScreenShares[sortedScreenShares.length - 1] : null;
  const pinnedItem = pinnedId ? allParticipantItems.find((p) => p.identity === pinnedId) : null;
  let mainStageItem = null;
  let sideRailItems = [];
  if (pinnedItem) {
    mainStageItem = pinnedItem;
    const otherScreenShares = sortedScreenShares.filter((s) => s.identity !== pinnedItem.identity);
    const otherCameras = cameraItems.filter((c) => c.identity !== pinnedItem.identity);
    sideRailItems = [...otherScreenShares, ...otherCameras];
  } else if (latestScreenShare) {
    mainStageItem = latestScreenShare;
    const otherScreenShares = sortedScreenShares.filter((s) => s.identity !== latestScreenShare.identity);
    sideRailItems = [...otherScreenShares, ...cameraItems];
  } else {
    mainStageItem = null;
    sideRailItems = [];
  }
  const handleTogglePin = (identity) => {
    withViewTransition(() => {
      setPinnedId((prev) => prev === identity ? null : identity);
    });
  };
  if (waitingState === "lobby" || waitingState === "connecting" || waitingState === "waiting_organizer" || waitingState === "waiting_approval" || waitingState === "rejected") {
    return /* @__PURE__ */ React.createElement(
      WaitingRoom,
      {
        title: meetingDetails?.title || meetingState?.title || "Yig'ilish",
        meetingDetails,
        meetingState,
        meetingId,
        projectData,
        waitingState,
        isRejected: waitingState === "rejected",
        rejectedMessage,
        localStream,
        isCameraEnabled,
        onToggleCamera: handleToggleLobbyCamera,
        isMicEnabled,
        onToggleMic: handleToggleLobbyMic,
        onJoinMeeting: handleJoinFromLobby,
        isJoining,
        onCancelWait: handleCancelWait,
        onLeave: () => navigate(-1),
        user
      }
    );
  }
  if (waitingState === "ended") {
    return /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 w-full h-full bg-[#111317] text-white flex items-center justify-center p-4 overflow-y-auto overflow-x-hidden select-none z-50" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-md p-8 rounded-3xl bg-[#1C1F26] border border-white/10 text-center shadow-2xl animate-in zoom-in-95 my-auto" }, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 rounded-full bg-blue-600/20 text-blue-400 mx-auto flex items-center justify-center mb-4" }, /* @__PURE__ */ React.createElement(RiSignalWifiFill, { size: 30 })), /* @__PURE__ */ React.createElement("h2", { className: "text-2xl font-extrabold" }, endedReason), /* @__PURE__ */ React.createElement("p", { className: "text-sm text-slate-400 mt-2" }, "Yig'ilish davomiyligi: ", /* @__PURE__ */ React.createElement("span", { className: "font-bold text-slate-200" }, formatDuration(meetingDuration))), /* @__PURE__ */ React.createElement("div", { className: "mt-8" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          clearStoredChatMessages(meetingId);
          navigate(-1);
        },
        className: "w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer transition-colors shadow-lg shadow-blue-600/30"
      },
      "Yopish va qaytish"
    ))));
  }
  return /* @__PURE__ */ React.createElement(
    "div",
    {
      onClick: () => {
        if (roomRef.current && !roomRef.current.canPlaybackAudio) {
          roomRef.current.startAudio().catch(() => {
          });
        }
      },
      className: "fixed inset-0 w-full h-full bg-[#202124] text-white overflow-hidden flex flex-col select-none z-50"
    },
    (networkStatus === "reconnecting" || networkStatus === "offline") && /* @__PURE__ */ React.createElement("div", { className: "fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 px-5 py-3 rounded-2xl bg-red-950/95 border border-red-500/50 text-red-200 text-xs sm:text-sm font-medium shadow-2xl shadow-red-950/80 backdrop-blur-xl" }, /* @__PURE__ */ React.createElement(RiSignalWifiOffFill, { className: "text-xl text-red-400 shrink-0 animate-pulse" }), /* @__PURE__ */ React.createElement("span", null, networkStatus === "offline" ? "Siz tarmoqdan uzildingiz. Internet aloqasi mavjud emas." : "Internet aloqasi uzildi. Qayta ulanmoqda..."), /* @__PURE__ */ React.createElement("div", { className: "w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin shrink-0" }))),
    networkStatus === "poor" && /* @__PURE__ */ React.createElement("div", { className: "fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-amber-950/90 border border-amber-500/40 text-amber-200 text-xs sm:text-sm font-medium shadow-xl backdrop-blur-xl" }, /* @__PURE__ */ React.createElement(RiSignalWifi1Fill, { className: "text-xl text-amber-400 shrink-0" }), /* @__PURE__ */ React.createElement("span", null, "Internet aloqasi beqaror. Ovoz va video uzatishda uzilishlar bo'lishi mumkin."))),
    showReconnectedBanner && /* @__PURE__ */ React.createElement("div", { className: "fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-3 duration-300 pointer-events-auto" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs sm:text-sm font-medium shadow-xl backdrop-blur-xl" }, /* @__PURE__ */ React.createElement(RiSignalWifiFill, { className: "text-xl text-emerald-400 shrink-0" }), /* @__PURE__ */ React.createElement("span", null, "Internet aloqasi qayta tiklandi."))),
    canAdmitParticipants && /* @__PURE__ */ React.createElement(
      KnockBanner,
      {
        requests: activeKnockRequests,
        onAdmit: handleAdmitUser,
        onReject: handleRejectUser
      }
    ),
    inRoomAlert && /* @__PURE__ */ React.createElement("div", { className: "fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300" }, /* @__PURE__ */ React.createElement("div", { className: `flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-xl border text-xs sm:text-sm font-semibold shadow-2xl transition-all duration-300 ${inRoomAlert.type === "hand" ? "bg-amber-950/90 border-amber-500/50 text-amber-200 shadow-amber-500/20" : inRoomAlert.type === "join" ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-500/20" : inRoomAlert.type === "screen" ? "bg-blue-950/90 border-blue-500/50 text-blue-200 shadow-blue-500/20" : inRoomAlert.type === "screen_stop" ? "bg-slate-900/95 border-slate-700 text-slate-200 shadow-black/50" : inRoomAlert.type === "knock" ? "bg-orange-950/90 border-orange-500/50 text-orange-200 shadow-orange-500/20" : inRoomAlert.type === "chat" ? "bg-purple-950/90 border-purple-500/50 text-purple-200 shadow-purple-500/20" : inRoomAlert.type === "mute" ? "bg-red-950/90 border-red-500/50 text-red-200 shadow-red-500/20" : "bg-[#1C1F26]/95 border-white/15 text-white shadow-black/50"}` }, /* @__PURE__ */ React.createElement("span", { className: "flex items-center justify-center shrink-0" }, renderAlertIcon(inRoomAlert.icon, inRoomAlert.type)), /* @__PURE__ */ React.createElement("span", null, inRoomAlert.text))),
    /* @__PURE__ */ React.createElement("header", { className: "h-16 px-6 flex items-center justify-between border-b border-[#3c4043] bg-[#202124] z-20 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" }), /* @__PURE__ */ React.createElement("h2", { className: "text-base sm:text-lg font-bold text-white truncate max-w-[200px] sm:max-w-md" }, meetingDetails?.title || meetingState?.title || "Yig'ilish")), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: handleCopyMeetingLink,
        title: "Yig'ilish havolasini nusxalash",
        className: "hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white cursor-pointer transition-all group active:scale-95 shadow-sm"
      },
      /* @__PURE__ */ React.createElement(TbLink, { size: 13, className: "text-[#8ab4f8]" }),
      /* @__PURE__ */ React.createElement("span", null, currentMeetingCode),
      copiedHeaderLink ? /* @__PURE__ */ React.createElement(TbCheck, { size: 13, className: "text-emerald-400" }) : /* @__PURE__ */ React.createElement(TbCopy, { size: 13, className: "text-slate-400 group-hover:text-white transition-colors" })
    ), meetingDetails?.uid && /* @__PURE__ */ React.createElement("span", { className: "hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] font-mono text-blue-300" }, "UID: ", meetingDetails.uid)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => {
          setIsDetailsOpen((prev) => {
            const next = !prev;
            if (next) {
              setIsChatOpen(false);
              setIsParticipantsOpen(false);
            }
            return next;
          });
        },
        title: "Yig'ilish tafsilotlari",
        className: `p-2 rounded-xl transition-all cursor-pointer ${isDetailsOpen ? "bg-[#8ab4f8] text-[#202124]" : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"}`
      },
      /* @__PURE__ */ React.createElement(RiInformationLine, { size: 16 })
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: `flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-medium transition-colors ${networkStatus === "reconnecting" || networkStatus === "offline" ? "bg-red-500/10 border-red-500/30 text-red-400" : networkStatus === "poor" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-white/5 border-white/10 text-emerald-400"}`,
        title: networkStatus === "offline" ? "Tarmoqdan uzilgan" : networkStatus === "reconnecting" ? "Qayta ulanmoqda..." : networkStatus === "poor" ? "Aloqa sifati past" : "Aloqa sifati a'lo"
      },
      networkStatus === "reconnecting" || networkStatus === "offline" ? /* @__PURE__ */ React.createElement(RiSignalWifiOffFill, { className: "text-sm animate-pulse" }) : networkStatus === "poor" ? /* @__PURE__ */ React.createElement(RiSignalWifi1Fill, { className: "text-sm" }) : /* @__PURE__ */ React.createElement(RiSignalWifiFill, { className: "text-sm" }),
      /* @__PURE__ */ React.createElement("span", { className: "hidden md:inline text-[11px]" }, networkStatus === "reconnecting" || networkStatus === "offline" ? "Uzildi" : networkStatus === "poor" ? "Zaif" : "Barqaror")
    ), /* @__PURE__ */ React.createElement("div", { className: "px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-semibold text-slate-300" }, formatDuration(meetingDuration)), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: toggleFullscreen,
        className: "w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-colors",
        title: "To'liq ekran"
      },
      isFullscreen ? /* @__PURE__ */ React.createElement(FaCompress, { size: 14 }) : /* @__PURE__ */ React.createElement(FaExpand, { size: 14 })
    ))),
    /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex overflow-hidden relative" }, /* @__PURE__ */ React.createElement("main", { className: "flex-1 flex overflow-hidden p-2 sm:p-3 md:p-4 transition-all duration-300" }, mainStageItem ? (
      /* Google Meet Presentation Stage (Single Full View) + Right Sidebar Filmstrip */
      /* @__PURE__ */ React.createElement("div", { className: "w-full h-full flex flex-col lg:flex-row gap-3 overflow-hidden" }, /* @__PURE__ */ React.createElement(
        "div",
        {
          style: { viewTransitionName: getViewTransitionName(mainStageItem.identity) },
          className: "flex-1 h-full min-h-0 min-w-0 flex items-center justify-center relative rounded-3xl bg-[#121212] overflow-hidden border border-white/10 shadow-2xl"
        },
        /* @__PURE__ */ React.createElement("div", { className: "w-full h-full flex items-center justify-center" }, /* @__PURE__ */ React.createElement(
          ParticipantTile,
          {
            participant: mainStageItem,
            isLocal: mainStageItem.isLocal,
            isScreenShare: mainStageItem.isScreenShare,
            isSpeaking: mainStageItem.isSpeaking,
            hasHandRaised: mainStageItem.hasHandRaised,
            isHost: mainStageItem.isHost,
            videoTrack: mainStageItem.videoTrack,
            audioTrack: mainStageItem.audioTrack,
            isCameraEnabled: mainStageItem.isCameraEnabled,
            isMicEnabled: mainStageItem.isMicEnabled,
            displayName: mainStageItem.name,
            avatar: mainStageItem.isLocal ? user?.avatar : "",
            version: mainStageItem.version || 0,
            isPinned: pinnedId === mainStageItem.identity,
            onTogglePin: () => handleTogglePin(mainStageItem.identity)
          }
        ))
      ), sideRailItems.length > 0 && /* @__PURE__ */ React.createElement(
        "div",
        {
          className: "w-full lg:w-72 xl:w-80 h-36 sm:h-44 lg:h-full shrink-0 flex flex-row lg:flex-col justify-start gap-3 overflow-x-auto lg:overflow-y-auto p-1",
          style: { scrollbarWidth: "thin", scrollbarColor: "#3c4043 transparent" }
        },
        sideRailItems.map((item) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: item.identity,
            style: { viewTransitionName: getViewTransitionName(item.identity) },
            className: `w-48 sm:w-56 lg:w-full aspect-video shrink-0 rounded-2xl overflow-hidden shadow-md transition-shadow hover:shadow-xl ${item.isScreenShare ? "bg-[#121212] border-2 border-blue-500/60 hover:border-blue-400" : "bg-[#3c4043] border border-white/5 hover:border-white/20"}`
          },
          /* @__PURE__ */ React.createElement(
            ParticipantTile,
            {
              participant: item,
              isLocal: item.isLocal,
              isScreenShare: item.isScreenShare,
              isSpeaking: item.isSpeaking,
              hasHandRaised: item.hasHandRaised,
              isHost: item.isHost,
              videoTrack: item.videoTrack,
              audioTrack: item.audioTrack,
              isCameraEnabled: item.isCameraEnabled,
              isMicEnabled: item.isMicEnabled,
              displayName: item.name,
              avatar: item.isLocal ? user?.avatar : "",
              version: item.version || 0,
              isPinned: pinnedId === item.identity,
              onTogglePin: () => handleTogglePin(item.identity)
            }
          )
        ))
      ))
    ) : (
      /* Pure Google Meet Balanced Grid */
      /* @__PURE__ */ React.createElement("div", { className: "w-full h-full flex items-center justify-center p-1 sm:p-2 md:p-3 overflow-hidden" }, cameraItems.length <= 1 ? (
        /* 1 Person: Centered large 16:9 card */
        /* @__PURE__ */ React.createElement(
          "div",
          {
            key: cameraItems[0]?.identity,
            style: { viewTransitionName: getViewTransitionName(cameraItems[0]?.identity) },
            className: "w-full max-w-6xl h-full max-h-[calc(100vh-170px)] aspect-video rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center"
          },
          /* @__PURE__ */ React.createElement(
            ParticipantTile,
            {
              participant: cameraItems[0],
              isLocal: cameraItems[0]?.isLocal,
              isScreenShare: false,
              isSpeaking: cameraItems[0]?.isSpeaking,
              hasHandRaised: cameraItems[0]?.hasHandRaised,
              isHost: cameraItems[0]?.isHost,
              videoTrack: cameraItems[0]?.videoTrack,
              audioTrack: cameraItems[0]?.audioTrack,
              isCameraEnabled: cameraItems[0]?.isCameraEnabled,
              isMicEnabled: cameraItems[0]?.isMicEnabled,
              displayName: cameraItems[0]?.name,
              avatar: cameraItems[0]?.isLocal ? user?.avatar : "",
              version: cameraItems[0]?.version || 0,
              isPinned: pinnedId === cameraItems[0]?.identity,
              onTogglePin: () => handleTogglePin(cameraItems[0]?.identity)
            }
          )
        )
      ) : cameraItems.length === 2 ? (
        /* 2 People: 2 equal side-by-side 16:9 cards */
        /* @__PURE__ */ React.createElement("div", { className: "w-full h-full max-h-[calc(100vh-170px)] max-w-[1700px] flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-4 p-1" }, cameraItems.map((item) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: item.identity,
            style: { viewTransitionName: getViewTransitionName(item.identity) },
            className: "flex-1 w-full max-w-[820px] aspect-video max-h-[calc(100vh-190px)] rounded-3xl overflow-hidden shadow-xl"
          },
          /* @__PURE__ */ React.createElement(
            ParticipantTile,
            {
              participant: item,
              isLocal: item.isLocal,
              isScreenShare: false,
              isSpeaking: item.isSpeaking,
              hasHandRaised: item.hasHandRaised,
              isHost: item.isHost,
              videoTrack: item.videoTrack,
              audioTrack: item.audioTrack,
              isCameraEnabled: item.isCameraEnabled,
              isMicEnabled: item.isMicEnabled,
              displayName: item.name,
              avatar: item.isLocal ? user?.avatar : "",
              version: item.version || 0,
              isPinned: pinnedId === item.identity,
              onTogglePin: () => handleTogglePin(item.identity)
            }
          )
        )))
      ) : cameraItems.length === 3 ? (
        /* 3 People: 3 balanced cards */
        /* @__PURE__ */ React.createElement("div", { className: "w-full h-full max-h-[calc(100vh-170px)] max-w-[1700px] flex flex-wrap items-center justify-center gap-3 sm:gap-4 p-1" }, cameraItems.map((item) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: item.identity,
            style: { viewTransitionName: getViewTransitionName(item.identity) },
            className: "w-full sm:w-[calc(50%-10px)] xl:w-[calc(33.333%-12px)] max-w-[620px] aspect-video max-h-[calc(100vh-200px)] rounded-3xl overflow-hidden shadow-xl"
          },
          /* @__PURE__ */ React.createElement(
            ParticipantTile,
            {
              participant: item,
              isLocal: item.isLocal,
              isScreenShare: false,
              isSpeaking: item.isSpeaking,
              hasHandRaised: item.hasHandRaised,
              isHost: item.isHost,
              videoTrack: item.videoTrack,
              audioTrack: item.audioTrack,
              isCameraEnabled: item.isCameraEnabled,
              isMicEnabled: item.isMicEnabled,
              displayName: item.name,
              avatar: item.isLocal ? user?.avatar : "",
              version: item.version || 0,
              isPinned: pinnedId === item.identity,
              onTogglePin: () => handleTogglePin(item.identity)
            }
          )
        )))
      ) : cameraItems.length === 4 ? (
        /* 4 People: 2x2 grid */
        /* @__PURE__ */ React.createElement("div", { className: "w-full h-full max-h-[calc(100vh-170px)] max-w-[1500px] grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center justify-center p-1" }, cameraItems.map((item) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: item.identity,
            style: { viewTransitionName: getViewTransitionName(item.identity) },
            className: "w-full aspect-video max-h-[calc(50vh-100px)] rounded-3xl overflow-hidden shadow-xl mx-auto"
          },
          /* @__PURE__ */ React.createElement(
            ParticipantTile,
            {
              participant: item,
              isLocal: item.isLocal,
              isScreenShare: false,
              isSpeaking: item.isSpeaking,
              hasHandRaised: item.hasHandRaised,
              isHost: item.isHost,
              videoTrack: item.videoTrack,
              audioTrack: item.audioTrack,
              isCameraEnabled: item.isCameraEnabled,
              isMicEnabled: item.isMicEnabled,
              displayName: item.name,
              avatar: item.isLocal ? user?.avatar : "",
              version: item.version || 0,
              isPinned: pinnedId === item.identity,
              onTogglePin: () => handleTogglePin(item.identity)
            }
          )
        )))
      ) : cameraItems.length <= 6 ? (
        /* 5-6 People: 3x2 grid */
        /* @__PURE__ */ React.createElement("div", { className: "w-full h-full max-h-[calc(100vh-170px)] max-w-[1700px] grid grid-cols-2 lg:grid-cols-3 gap-3 items-center justify-center p-1" }, cameraItems.map((item) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: item.identity,
            style: { viewTransitionName: getViewTransitionName(item.identity) },
            className: "w-full aspect-video max-h-[calc(50vh-100px)] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md mx-auto"
          },
          /* @__PURE__ */ React.createElement(
            ParticipantTile,
            {
              participant: item,
              isLocal: item.isLocal,
              isScreenShare: false,
              isSpeaking: item.isSpeaking,
              hasHandRaised: item.hasHandRaised,
              isHost: item.isHost,
              videoTrack: item.videoTrack,
              audioTrack: item.audioTrack,
              isCameraEnabled: item.isCameraEnabled,
              isMicEnabled: item.isMicEnabled,
              displayName: item.name,
              avatar: item.isLocal ? user?.avatar : "",
              version: item.version || 0,
              isPinned: pinnedId === item.identity,
              onTogglePin: () => handleTogglePin(item.identity)
            }
          )
        )))
      ) : (
        /* 7+ People: Multi-column responsive grid */
        /* @__PURE__ */ React.createElement("div", { className: "w-full h-full max-h-[calc(100vh-170px)] max-w-[1800px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-center justify-center overflow-y-auto p-1" }, cameraItems.map((item) => /* @__PURE__ */ React.createElement(
          "div",
          {
            key: item.identity,
            style: { viewTransitionName: getViewTransitionName(item.identity) },
            className: "w-full aspect-video rounded-2xl overflow-hidden shadow-md mx-auto"
          },
          /* @__PURE__ */ React.createElement(
            ParticipantTile,
            {
              participant: item,
              isLocal: item.isLocal,
              isScreenShare: false,
              isSpeaking: item.isSpeaking,
              hasHandRaised: item.hasHandRaised,
              isHost: item.isHost,
              videoTrack: item.videoTrack,
              audioTrack: item.audioTrack,
              isCameraEnabled: item.isCameraEnabled,
              isMicEnabled: item.isMicEnabled,
              displayName: item.name,
              avatar: item.isLocal ? user?.avatar : "",
              version: item.version || 0,
              isPinned: pinnedId === item.identity,
              onTogglePin: () => handleTogglePin(item.identity)
            }
          )
        )))
      ))
    )), /* @__PURE__ */ React.createElement(
      ChatDrawer,
      {
        isOpen: isChatOpen,
        onClose: () => setIsChatOpen(false),
        messages: chatMessages,
        onSendMessage: handleSendMessage,
        currentUserName
      }
    ), /* @__PURE__ */ React.createElement(
      ParticipantsDrawer,
      {
        isOpen: isParticipantsOpen,
        onClose: () => setIsParticipantsOpen(false),
        participants: allParticipantItems.filter((p) => !p.isScreenShare),
        knockRequests: activeKnockRequests,
        isHost: canAdmitParticipants,
        isLocalHost,
        onMuteParticipant: handleMuteParticipant,
        onMuteAll: handleMuteAllParticipants,
        onAskUnmuteParticipant: handleAskUnmuteParticipant,
        onAdmitUser: handleAdmitUser,
        onRejectUser: handleRejectUser,
        currentUserId: roomRef.current?.localParticipant?.identity,
        pinnedId,
        onTogglePin: handleTogglePin
      }
    ), /* @__PURE__ */ React.createElement(
      MeetingDetailsDrawer,
      {
        isOpen: isDetailsOpen,
        onClose: () => setIsDetailsOpen(false),
        meetingDetails,
        meetingState,
        meetingId,
        projectData
      }
    )),
    /* @__PURE__ */ React.createElement("footer", { className: "p-4 z-20 shrink-0" }, /* @__PURE__ */ React.createElement(
      ControlBar,
      {
        isMicEnabled,
        onToggleMic: handleToggleMic,
        isCameraEnabled,
        onToggleCamera: handleToggleCamera,
        isScreenSharing,
        onToggleScreenShare: handleStartScreenShare,
        onStopScreenShare: handleStopScreenShare,
        onChangeScreenShare: handleChangeScreenShare,
        isHandRaised,
        onToggleHandRaise: handleToggleHandRaise,
        isChatOpen,
        onToggleChat: () => {
          setIsChatOpen((prev) => {
            const next = !prev;
            if (next) {
              setIsParticipantsOpen(false);
              setIsDetailsOpen(false);
              setUnreadChatCount(0);
            }
            return next;
          });
        },
        unreadChatCount,
        isParticipantsOpen,
        onToggleParticipants: () => {
          setIsParticipantsOpen((prev) => {
            const next = !prev;
            if (next) {
              setIsChatOpen(false);
              setIsDetailsOpen(false);
            }
            return next;
          });
        },
        participantCount: allParticipantItems.filter((p) => !p.isScreenShare).length,
        knockCount: canAdmitParticipants ? activeKnockRequests.length : 0,
        isDetailsOpen,
        onToggleDetails: () => {
          setIsDetailsOpen((prev) => {
            const next = !prev;
            if (next) {
              setIsChatOpen(false);
              setIsParticipantsOpen(false);
            }
            return next;
          });
        },
        onLeave: handleLeaveMeeting,
        isHost: isLocalHost,
        onEndMeetingForAll: handleEndMeetingForAll
      }
    )),
    unmuteRequest && /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200" }, /* @__PURE__ */ React.createElement("div", { className: "w-full max-w-sm rounded-3xl bg-[#202124] border border-white/10 p-6 shadow-2xl text-center flex flex-col items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center text-2xl border border-blue-500/30 shadow-inner" }, /* @__PURE__ */ React.createElement(FaMicrophone, { size: 24 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-lg font-bold text-white" }, "Mikrofonni yoqish so'rovi"), /* @__PURE__ */ React.createElement("p", { className: "text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed" }, /* @__PURE__ */ React.createElement("span", { className: "font-bold text-white" }, unmuteRequest.sender), " mikrofoningizni yoqishingizni so'ramoqda.")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 w-full mt-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: () => setUnmuteRequest(null),
        className: "flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
      },
      "Hozir emas"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        onClick: async () => {
          if (!isMicEnabled) {
            await handleToggleMic();
          }
          setUnmuteRequest(null);
        },
        className: "flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-lg shadow-blue-600/30"
      },
      "Mikrofonni yoqish"
    ))))
  );
}
