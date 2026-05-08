import { useState, useRef, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { usePageAction } from '../context/PageActionContext'
import { FaAngleDown, FaXmark } from 'react-icons/fa6'
import { FaFolder } from 'react-icons/fa'
import { MdCheck, MdOutlineFileDownload, MdOutlinePrint } from 'react-icons/md'
import { ExcelIcon, PdfIcon } from './icons'
import { axiosAPI } from '../service/axiosAPI'
import { MeetingAttendanceModal, MeetingAbsenceModal } from './MeetingModals'

const labelMap = {
  menager: 'Menager', xodim: 'Xodim',
  dashboard: 'Dashboard', users: 'Foydalanuvchilar', roles: 'Rollar',
  projects: 'Loyihalar', payments: "Xarajat so'rovlari", finance: 'Ish haqi',
  history: 'Tarix',
  reports: 'Hisobotlar', messages: 'Xabarlar', settings: 'Sozlamalar',
  team: 'Jamoam', tasks: 'Vazifalar', by_tasks: 'Vazifalar bo\'yicha',
  project: "Loyihalar bo\'yicha", cost_inquiries: "Xarajat so'rovlari bo'yicha",
  calendar: 'Kalendar',
  salary: 'Ish haqi bo\'yicha', employee: 'Xodimlar bo\'yicha', archive: 'Arxiv', staff: 'Xodimlar', done: 'Bajarilgan',
  applications: 'Arizalar', positions: 'Lavozimlar', regions: 'Viloyatlar',
  trash: 'Chiqindi qutisi', profile: 'Shaxsiy kabinet', analytics: "Analitika", meetings: "Yig'ilishlar", my_tasks: "Kundalik rejalar",
}

const NOTIFS_DATA = [
  { id: 1, date: '17.01.2026', title: "Yig'ilish yakunlandi", sub: "Yig'ilishda kimlar qatnashdi", time: '11:00', read: true, urgent: false, raw: { meeting_id: 1 } },
  { id: 2, date: '17.01.2026', title: "Yig'ilishga qatnashmadingiz", sub: "Sababni yozishingiz so'raladi", time: '10:00', read: false, urgent: true, raw: { attendance_id: 1, meeting_title: "Marketing meet" } },
  { id: 3, date: '16.01.2026', title: "Yig'ilish yakunlandi", sub: "Yig'ilishda kimlar qatnashdi", time: '11:00', read: false, urgent: false, raw: { meeting_id: 1 } },
  { id: 4, date: '16.01.2026', title: "Yig'ilish yakunlandi", sub: "Yig'ilishda kimlar qatnashdi", time: '11:00', read: true, urgent: false, raw: { meeting_id: 1 } },
  { id: 5, date: '16.01.2026', title: "Yig'ilish yakunlandi", sub: "Yig'ilishda kimlar qatnashdi", time: '11:00', read: false, urgent: false, raw: { meeting_id: 1 } },
]

function formatNotifDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB').replace(/\//g, '.')
}

function formatNotifTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function mapApiNotification(item) {
  return {
    id: item.id,
    date: formatNotifDate(item.created_at),
    title: item.title || 'Bildirishnoma',
    sub: item.message || '',
    time: formatNotifTime(item.created_at),
    read: !!item.is_read,
    urgent: item.type === 'alert',
    raw: item,
  }
}

function groupByDate(notifs) {
  const map = {}
  notifs.forEach(n => {
    if (!map[n.date]) map[n.date] = []
    map[n.date].push(n)
  })
  // Sanalarni teskari tartibda (yangilari tepada) qaytarish
  return Object.entries(map).sort((a, b) => {
    // "DD.MM.YYYY" formatini taqqoslash uchun "YYYY-MM-DD" ga o'tkazamiz
    const toSortable = (d) => d.split('.').reverse().join('-')
    return toSortable(b[0]).localeCompare(toSortable(a[0]))
  })
}

function NotificationPanel({ notifs, setNotifs, onClose, onItemClick }) {
  const grouped = groupByDate(notifs)

  const markRead = async (id) => {
    const notif = notifs.find(n => n.id === id)
    if (notif?.read) return  // allaqachon o'qilgan — backend ga so'rov yuborma
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try {
      await axiosAPI.patch(`/notifications/${id}/read/`)
    } catch {
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: false } : n))
    }
  }

  const markAllRead = async () => {
    const previous = [...notifs]
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await axiosAPI.post('/notifications/read-all/')
    } catch {
      setNotifs(previous)
    }
  }

  return (
    <div
      className="fixed top-0 right-0 h-full z-50 flex flex-col shadow-2xl
        bg-white dark:bg-[#1C1D1D] border-l border-[#EEF1F7] dark:border-[#292A2A]"
      style={{ width: 480 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5  shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#1A1D2E] dark:text-white">Bildirshnomalar</h2>
        </div>
        <div className="flex items-center gap-2">
         {/* 
          <button
            onClick={markAllRead}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer
              text-[#526ED3] hover:bg-[#F1F3F9] dark:text-[#8EA1E8] dark:hover:bg-[#292A2A]"
          >
            Barchasi o'qildi
          </button>
          */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer 
              text-[#8F95A8] hover:bg-[#F1F3F9] dark:text-[#8E95B5] dark:hover:bg-[#292A2A]"
          >
            <FaXmark size={15} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
        {grouped.map(([date, items]) => (
          <div key={date}>
            <p className="text-xs font-semibold text-[#8F95A8] dark:text-[#8E95B5] mb-3 px-2">{date}</p>
            <div className="flex flex-col gap-1">
              {[...items].sort((a, b) => b.time.localeCompare(a.time)).map(n => (
                <button
                  key={n.id}
                  onClick={() => {
                    markRead(n.id)
                    if (onItemClick) onItemClick(n)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left  cursor-pointer
                    ${!n.read
                      ? 'bg-[#F4F6FD] dark:bg-[#222323]'
                      : 'hover:bg-[#F8F9FC] dark:hover:bg-[#222323]'
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-[#D0D5E2] dark:bg-[#3A3B3B] flex items-center justify-center text-sm font-bold text-[#5B6078] dark:text-[#C2C8E0]">
                      Y
                    </div>
                    {/* Badge */}
                    {!n.read ? (
                      <span
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF7A45] flex items-center justify-center text-white font-semibold"
                        style={{ fontSize: 11 }}
                      >
                        1
                      </span>
                    ) : (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#526ED3] flex items-center justify-center">
                        <MdCheck size={10} color="white" />
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!n.read ? 'font-semibold text-[#1A1D2E] dark:text-white' : 'font-medium text-[#5B6078] dark:text-[#C2C8E0]'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-[#8F95A8] dark:text-[#8E95B5] flex items-center gap-1 mt-0.5 truncate">
                      <FaFolder size={10} className="shrink-0" />
                      {n.sub}
                    </p>
                  </div>

                  {/* Time */}
                  <span className="text-xs text-[#B6BCCB] dark:text-[#8E95B5] shrink-0">{n.time}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Breadcrumb() {
  const navigate = useNavigate()
  const location = useLocation()

  const isId = (part) => {
    if (!isNaN(Number(part))) return true
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(part)) return true
    return false
  }

  const hiddenParts = ['edit', 'add', 'new', 'create', 'admin', 'manager']

  const parts = location.pathname.split('/').filter(part => {
    if (!part) return false
    if (hiddenParts.includes(part.toLowerCase())) return false
    if (isId(part)) return false
    return true
  })

  return (
    <>
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1
        const label = labelMap[part] || part
        const isReport = ['reports', 'by_tasks', 'project', 'cost_inquiries', 'salary', 'employee'].includes(part)
        const canClick = !isLast && !isReport

        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && part !== "detail" && (
              <span className="text-[#D0D5E2] dark:text-[#3A3B3B] mx-0.5">›</span>
            )}
            <span
              className={`text-[13px] font-medium ${part === "detail" ? "hidden" : ""} ${isLast ? 'text-[#5B6078] dark:text-white' : 'text-[#c2c8e0]'} ${canClick ? 'cursor-pointer' : ''}`}
              onClick={() => canClick && navigate(part)}
            >
              {label}
            </span>
          </span>
        )
      })}
    </>
  )
}

export default function Layout() {
  const { action, customAction, breadcrumbExtra, navbarExtra, sidebarClickHandler, print, download } = usePageAction()
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState([...NOTIFS_DATA].sort((a, b) => {
    const toSortable = (d) => d.split('.').reverse().join('-')
    const dateCmp = toSortable(b.date).localeCompare(toSortable(a.date))
    if (dateCmp !== 0) return dateCmp
    return b.time.localeCompare(a.time)
  }))
  const [downloadOpen, setDownloadOpen] = useState(false)
  const downloadRef = useRef(null)
  const wsRef = useRef(null)
  const reconnectTimerRef = useRef(null)
  const unreadCount = notifs.filter(n => !n.read).length
  const [activeAttendanceMeetingId, setActiveAttendanceMeetingId] = useState(null)
  const [activeAbsence, setActiveAbsence] = useState(null)

  const navigate = useNavigate()
  const location = useLocation()

  const handleNotifClick = (n) => {
    const type = n.raw?.type || ''
    const title = n.title?.toLowerCase() || ''

    // Allaqachon o'qilgan bo'lsa backend ga so'rov yuborilmaydi (markRead ichida tekshiriladi)

    // type ga qarab yo'naltirish
    if (type === 'task') {
      // Vazifa notification — tasks sahifasiga
      const prefix = location.pathname.split('/')[1] || 'admin'
      navigate(`/${prefix}/tasks`)
      setNotifOpen(false)
    } else if (type === 'finance') {
      // Moliya notification — payments sahifasiga
      const prefix = location.pathname.split('/')[1] || 'admin'
      navigate(`/${prefix}/payments`)
      setNotifOpen(false)
    } else if (type === 'meeting') {
      // Yig'ilish notification
      const prefix = location.pathname.split('/')[1] || 'admin'
      if (title.includes("yakunlandi")) {
        const meetingId = n.raw?.meeting_id || n.raw?.data?.meeting_id || n.raw?.meeting
        if (meetingId || n.raw?.id) {
          setActiveAttendanceMeetingId(meetingId || n.raw?.id)
          setNotifOpen(false)
        } else {
          navigate(`/${prefix}/meetings`)
          setNotifOpen(false)
        }
      } else if (title.includes("qatnashmadingiz")) {
        const attendanceId = n.raw?.attendance_id || n.raw?.data?.attendance_id || n.raw?.id
        const meetingTitle = n.raw?.meeting_title || n.raw?.data?.meeting_title || "Yig'ilish"
        if (attendanceId || n.raw?.id) {
          setActiveAbsence({
            attendanceId: attendanceId || n.raw?.id,
            meetingTitle,
            meetingDate: n.date + ' ' + n.time,
          })
          setNotifOpen(false)
        } else {
          navigate(`/${prefix}/meetings`)
          setNotifOpen(false)
        }
      } else {
        navigate(`/${prefix}/meetings`)
        setNotifOpen(false)
      }
    } else if (type === 'system' || type === 'alert') {
      // Tizim xabari yoki ogohlantirish — loyihalar sahifasiga
      const prefix = location.pathname.split('/')[1] || 'admin'
      navigate(`/${prefix}/projects`)
      setNotifOpen(false)
    } else {
      // type yo'q yoki noma'lum — title ga qarab eski logika
      if (title.includes("yig'ilish yakunlandi")) {
        const meetingId = n.raw?.meeting_id || n.raw?.data?.meeting_id || n.raw?.meeting
        if (meetingId || n.raw?.id) {
          setActiveAttendanceMeetingId(meetingId || n.raw?.id)
          setNotifOpen(false)
        }
      } else if (title.includes("qatnashmadingiz")) {
        const attendanceId = n.raw?.attendance_id || n.raw?.data?.attendance_id || n.raw?.id
        const meetingTitle = n.raw?.meeting_title || n.raw?.data?.meeting_title || "Yig'ilish"
        if (attendanceId || n.raw?.id) {
          setActiveAbsence({
            attendanceId: attendanceId || n.raw?.id,
            meetingTitle,
            meetingDate: n.date + ' ' + n.time,
          })
          setNotifOpen(false)
        }
      } else {
        // default — loyihalar
        const prefix = location.pathname.split('/')[1] || 'admin'
        navigate(`/${prefix}/projects`)
        setNotifOpen(false)
      }
    }
  }

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await axiosAPI.get('/notifications/')
      const list = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.data?.results)
          ? data.data.results
          : []
      // Yangilari tepada turishi uchun created_at bo'yicha teskari tartibda saralash
      const sorted = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setNotifs(sorted.map(mapApiNotification))
    } catch {
      // static fallback saqlanadi
    }
  }, [])

  const connectNotificationsWs = useCallback(async () => {
    try {
      const { data } = await axiosAPI.post('/notifications/tickets/')
      const ticket = data?.data?.ticket
      if (!ticket) return

      const apiBase = import.meta.env.VITE_BASE_URL || window.location.origin
      const baseUrl = new URL(apiBase, window.location.origin)
      const wsProtocol = baseUrl.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProtocol}//${baseUrl.host}/ws/notifications/?ticket=${encodeURIComponent(ticket)}`

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data)
          const payload =
            typeof raw?.data?.payload === 'string'
              ? JSON.parse(raw.data.payload)
              : raw?.data?.payload || raw
          const mapped = mapApiNotification(payload)
          if (!mapped.id) return

          setNotifs(prev => {
            if (prev.some(n => n.id === mapped.id)) {
              return prev.map(n => (n.id === mapped.id ? mapped : n))
            }
            return [mapped, ...prev]
          })
        } catch {
          // noto'g'ri payloadlarni e'tiborsiz qoldiramiz
        }
      }

      ws.onclose = () => {
        reconnectTimerRef.current = setTimeout(() => {
          connectNotificationsWs()
        }, 4000)
      }
    } catch {
      reconnectTimerRef.current = setTimeout(() => {
        connectNotificationsWs()
      }, 6000)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target)) {
        setDownloadOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchNotifications()
    connectNotificationsWs()

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [fetchNotifications, connectNotificationsWs])

  // navbarExtra mavjud bo'lsa sidebar collapsed holda ko'rsatiladi (kanban mode)
  const isKanban = !!navbarExtra

  return (
    <div className="flex min-h-screen bg-[#F8F9FC] dark:bg-[#191A1A]">
      <Sidebar forceCollapsed={isKanban} onForceClick={sidebarClickHandler} />
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Navbar ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b
          bg-[#F8F9FC] border-[#EEF1F7]
          dark:bg-[#191A1A] dark:border-[#292A2A]">

          {/* Left: Breadcrumb OR navbarExtra */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {navbarExtra ? (
              <div className="flex items-center gap-2 w-full">{navbarExtra}</div>
            ) : (
              <div className="flex items-center gap-1 text-sm">
                <Breadcrumb />
                {breadcrumbExtra && (
                  <>
                    <span className="text-[#D0D5E2] dark:text-[#3A3B3B] mx-0.5">›</span>
                    <span className="text-[13px] font-medium text-[#5B6078] dark:text-white">
                      {breadcrumbExtra}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={`flex items-center gap-2 shrink-0 ${isKanban ? 'ml-3' : ''}`}>
            {customAction && customAction}

            {action && (
              <button
                onClick={action.onClick}
                className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer 
                  bg-[#3F57B3] text-white hover:bg-[#526ED3]"
                style={{ fontSize: 13, fontWeight: 800 }}
              >
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </button>
            )}

            {print && (
              <button
                onClick={print.onClick}
                className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer  bg-[#e9eeff] dark:bg-[#303131] dark:text-white text-[#1A1D2E] "
                style={{ fontSize: 13, fontWeight: 800 }}
              >
                <MdOutlinePrint size={20} />
                Chop etish
              </button>
            )}

            {download && (
              <div className="relative" ref={downloadRef}>
                <button className='flex items-center gap-[2px] rounded-xl overflow-hidden'>
                  <span
                    onClick={() => download?.excel()}
                    className='flex items-center h-full px-3 py-2 gap-1 text-[13px] font-extrabold text-white! bg-[#3f57b3] cursor-pointer hover:bg-[#526ED3] '
                  >
                    <MdOutlineFileDownload size={20} />
                    Yuklab olish
                  </span>
                  <span
                    onClick={() => setDownloadOpen(!downloadOpen)}
                    className='flex items-center h-full px-1.5 py-2.5 justify-center bg-[#3f57b3] text-white! cursor-pointer border-l border-white/20 hover:bg-[#526ED3] '
                  >
                    <FaAngleDown size={16} />
                  </span>
                </button>

                {downloadOpen && (
                  <div className="absolute top-full right-0 mt-3 w-[230px] bg-[#F1F3F9] dark:bg-[#292A2A] rounded-[24px] p-3 shadow-2xl z-50 flex flex-col gap-2 border border-white/50 dark:border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {[
                      { label: 'Excel', icon: <ExcelIcon size={24} />, key: 'excel' },
                      { label: 'PDF', icon: <PdfIcon size={24} />, key: 'pdf' },
                      { label: 'CSV', icon: <img src="/imgs/csv.svg" alt="CSV" className="w-8 h-8" />, key: 'csv' }
                    ].map((item) => (
                      <div
                        key={item.key}
                        onClick={() => { download[item.key](); setDownloadOpen(false) }}
                        className="flex items-center justify-between p-2 bg-white/40 dark:bg-white/5 rounded-[18px] cursor-pointer hover:bg-white dark:hover:bg-white/10 transition-all active:scale-[0.98] group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white dark:bg-[#1C1D1D] rounded-[14px] flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                            {item.icon}
                          </div>
                          <span className="text-[#1A1D2E] dark:text-white font-bold text-base">{item.label}</span>
                        </div>
                        <div className="w-6 h-6 flex items-center justify-center text-[#5B6078] dark:text-[#C2C8E0] group-hover:text-[#3F57B3] ">
                          <MdOutlineFileDownload size={22} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(o => !o)}
                className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer 
                  bg-[#F1F3F9] hover:bg-[#E8EAF2]
                  dark:bg-[#292A2A] dark:hover:bg-[#333435]"
              >
                <img
                  src="/imgs/notification.svg"
                  alt="notification"
                  className="w-[18px] h-[18px] brightness-0 [filter:brightness(0)_saturate(100%)_invert(10%)_sepia(10%)_saturate(1000%)_hue-rotate(190deg)_brightness(90%)] dark:brightness-0 dark:invert"
                />
              </button>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E02D2D] border-2 border-white dark:border-[#191A1A] text-[10px] leading-none font-bold text-white flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </div>
        </header>

        <main className={`flex-1 flex flex-col bg-[#F8F9FC] dark:bg-[#191A1A] ${isKanban ? 'p-0 overflow-hidden' : 'p-6'}`}>
          <Outlet />
        </main>
      </div>

      {/* Overlay */}
      {notifOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setNotifOpen(false)} />
          <NotificationPanel notifs={notifs} setNotifs={setNotifs} onClose={() => setNotifOpen(false)} onItemClick={handleNotifClick} />
        </>
      )}

      {activeAttendanceMeetingId && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setActiveAttendanceMeetingId(null)} />
          <MeetingAttendanceModal 
            meetingId={activeAttendanceMeetingId} 
            onClose={() => setActiveAttendanceMeetingId(null)} 
          />
        </>
      )}

      {activeAbsence && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setActiveAbsence(null)} />
          <MeetingAbsenceModal 
            attendanceId={activeAbsence.attendanceId}
            meetingTitle={activeAbsence.meetingTitle}
            meetingDate={activeAbsence.meetingDate}
            onClose={() => setActiveAbsence(null)} 
          />
        </>
      )}
    </div>
  )
}
