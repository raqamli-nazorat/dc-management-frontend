import { useState, useRef, useEffect, useCallback } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import { usePageAction } from '../context/PageActionContext'
import { FaAngleDown, FaXmark } from 'react-icons/fa6'
import { FaFolder } from 'react-icons/fa'
import { MdCheck, MdOutlineFileDownload, MdOutlinePrint } from 'react-icons/md'
import { ExcelIcon, PdfIcon } from './icons'
import { axiosAPI } from '../service/axiosAPI'
import { MeetingAttendanceModal, MeetingAbsenceModal, MeetingOpenModal, AttendanceExcuseModal, SystemNotifModal } from './MeetingModals'
import { useAuth } from '../context/AuthContext'
import { onMessageListener, requestForToken } from '../firebase'
import notificationSocket from '../NotificationSocket'

const labelMap = {
  menager: 'Menager', xodim: 'Xodim',
  dashboard: 'Analitika', users: 'Foydalanuvchilar', roles: 'Rollar',
  projects: 'Loyihalar', payments: "Xarajat so'rovlari", finance: 'Ish haqi',
  history: 'Tarix',
  reports: 'Hisobotlar', messages: 'Xabarlar', settings: 'Sozlamalar',
  team: 'Jamoam', tasks: 'Vazifalar', by_tasks: 'Vazifalar bo\'yicha',
  project: "Loyihalar bo\'yicha", cost_inquiries: "Xarajat so'rovlari bo'yicha",
  calendar: 'Kalendar',
  salary: 'Ish haqi bo\'yicha', employee: 'Xodimlar bo\'yicha', archive: 'Arxiv', staff: 'Xodimlar', done: 'Bajarilgan',
  applications: 'Arizalar', positions: 'Lavozimlar', regions: 'Viloyatlar',
  trash: 'Chiqindi qutisi', profile: 'Shaxsiy kabinet', analytics: "Analitika", meetings: "Yig'ilishlar", my_tasks: "Kundalik rejalar", accountant: "Hisobchi"
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
    id: item?.id,
    date: formatNotifDate(item.created_at),
    title: item.title || 'Bildirishnoma',
    sub: item.message || item.sub || '',
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

const showSystemNotification = (notif) => {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(notif.title || "Yangi xabar", {
      body: notif.sub || notif.message || "Sizga yangi bildirishnoma keldi",
      icon: "/imgs/Logo.png", // Loyihangiz logotipi
    });
  }
};

function NotificationPanel({ notifs, setNotifs, onClose, onItemClick, onScroll, onCountRefresh }) {
  const grouped = groupByDate(notifs)

  const markRead = async (id) => {
    const notif = notifs.find(n => n.id === id)
    if (notif?.read) return  // allaqachon o'qilgan — backend ga so'rov yuborma
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try {
      await axiosAPI.patch(`notifications/${id}/read/`)
      onCountRefresh?.()
    } catch {
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: false } : n))
    }
  }

  const markAllRead = async () => {
    const previous = [...notifs]
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await axiosAPI.post('/notifications/read-all/')
      onCountRefresh?.()
    } catch {
      setNotifs(previous)
    }
  }

  return (
    <div
      className="fixed top-0 right-0 h-full z-50 flex flex-col shadow-2xl
        bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] border-l border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]"
      style={{ width: 480 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5  shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Bildirshnomalar</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            className="px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer
              text-[var(--accent-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[#8EA1E8] dark:hover:bg-[var(--bg-elevation-2)]"
          >
            Barchasi o'qish
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer 
              text-[var(--text-soft)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-2)]"
          >
            <FaXmark size={15} />
          </button>
        </div>
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5"
        onScroll={onScroll}
      >
        {grouped.map(([date, items]) => {
          return (
            <div key={date}>
              <p className="text-xs font-semibold text-[var(--text-soft)] dark:text-[var(--text-soft)] mb-3 px-2">{date}</p>
              <div className="flex flex-col gap-1">
                {[...items].sort((a, b) => b.time.localeCompare(a.time)).map((n, i) => {
                  return (

                    <button
                      key={i}
                      onClick={() => {
                        markRead(n.id)
                        if (onItemClick) onItemClick(n)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left  cursor-pointer
                    ${!n.read
                          ? 'bg-[#F4F6FD] dark:bg-[var(--bg-elevation-1)]'
                          : 'hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-1)]'
                        }`}
                    >

                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[var(--stroke-strong)] dark:bg-[var(--bg-elevation-2)] flex items-center justify-center text-sm font-bold text-[var(--text-sub)] dark:text-[var(--text-sub)]">
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
                          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[var(--accent-sub)] flex items-center justify-center">
                            <MdCheck size={10} color="white" />
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!n.read ? 'font-semibold text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-[var(--text-soft)] dark:text-[var(--text-soft)] flex items-center gap-1 mt-0.5 truncate">
                          <FaFolder size={10} className="shrink-0" />
                          {n.sub}
                        </p>
                      </div>

                      {/* Time */}
                      <span className="text-xs text-[var(--text-disabled)] dark:text-[var(--text-soft)] shrink-0">{n.time}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
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

  const hiddenParts = ['edit', 'add', 'new', 'create', 'admin', 'manager', 'employee', 'auditor', 'accountant', 'menager', 'xodim', 'nazoratchi', 'hisobchi']

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
              className={`text-[13px] font-medium ${part === "detail" ? "hidden" : ""} ${isLast ? 'text-[var(--text-sub)] dark:text-[var(--text-strong)]' : 'text-[#c2c8e0]'} ${canClick ? 'cursor-pointer' : ''}`}
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
  const { user } = useAuth()
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
  const shownNotifIdsRef = useRef(new Set())
  const unreadCount = notifs.filter(n => !n.read).length
  const [activeAttendanceMeetingId, setActiveAttendanceMeetingId] = useState(null)
  const [activeAbsence, setActiveAbsence] = useState(null)
  const [activeOpenMeeting, setActiveOpenMeeting] = useState(null)
  const [activeExcuseAttendanceId, setActiveExcuseAttendanceId] = useState(null)
  const [activeSystemNotif, setActiveSystemNotif] = useState(null) // { title, message, date }

  const [notifCount, setNotifCount] = useState(0)
  const [notifNextUrl, setNotifNextUrl] = useState(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const navigate = useNavigate()
  const location = useLocation()

  const handleNotifClick = (n) => {
    const type = n.raw?.type || ''
    const title = n.title?.toLowerCase() || ''
    const extraData = n.raw?.extra_data || n.raw?.data?.extra_data || {}

    // extra_data.action === 'close_meeting' bo'lsa — davomat modalini ochish
    if (extraData?.action === 'close_meeting') {
      const meetingId = extraData.meeting_id
      if (meetingId) {
        setActiveAttendanceMeetingId(meetingId)
        setNotifOpen(false)
        return
      }
    }

    // extra_data.action === 'open_meeting' bo'lsa — sabab yozish modalini ochish
    if (extraData?.action === 'open_meeting') {
      const meetingId = extraData.meeting_id
      const projectId = extraData.project_id
      if (meetingId) {
        setActiveOpenMeeting({ meetingId, projectId })
        setNotifOpen(false)
        return
      }
    }

    // extra_data.action === 'open_attendance' — sabab ko'rish va tasdiqlash modali
    if (extraData?.action === 'open_attendance') {
      const attendanceId = extraData.attendance_id
      if (attendanceId) {
        setActiveExcuseAttendanceId(attendanceId)
        setNotifOpen(false)
        return
      }
    }

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
      // Tizim xabari — modal ochish
      setActiveSystemNotif({
        title: n.title || n.raw?.title || 'Tizim xabari',
        message: n.raw?.message || n.raw?.body || n.message || '',
        date: n.date && n.time ? `${n.date} ${n.time}` : '',
      })
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

  const fetchNotifCount = async () => {
    try {
      const { data } = await axiosAPI.get('/notifications/count/')
      setNotifCount(data?.data?.unread ?? 0)
    } catch {
      // silent
    }
  }

  const fetchNotifications = async () => {
    try {
      const { data } = await axiosAPI.get('/notifications/')
      const list = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.data?.results)
          ? data.data.results
          : []
      setNotifNextUrl(data?.data?.next)
      // Yangilari tepada turishi uchun created_at bo'yicha teskari tartibda saralash
      const sorted = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setNotifs(sorted.map(mapApiNotification))
    } catch {
      // static fallback saqlanadi
    }
  }

  useEffect(() => {
    fetchNotifCount();
  }, []);

  const loadMoreNotifications = async () => {
    if (!notifNextUrl || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const { data } = await axiosAPI.get(notifNextUrl);

      const list = Array.isArray(data?.results)
        ? data.results
        : Array.isArray(data?.data?.results)
          ? data.data.results
          : [];

      setNotifNextUrl(data?.data?.next);

      const sorted = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Eski xabarlar ustiga yangilarini qo'shamiz
      setNotifs(prev => [...prev, ...sorted.map(mapApiNotification)]);

    } catch (error) {
      console.error("Pagination xatosi:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScrollNotif = (e) => {
    if (!notifNextUrl || isLoadingMore) return;

    const { scrollTop, clientHeight, scrollHeight } = e.target;

    if (scrollTop + clientHeight >= scrollHeight - 20) {
      loadMoreNotifications();
    }
  };

  // 1. WebSocket ulanishini sozlash
  const connectNotificationsWs = useCallback(async () => {
    try {
      // Serverdan ticket olish
      const { data } = await axiosAPI.post('/notifications/tickets/');
      const ticket = data?.data?.ticket;


      if (!ticket) {
        console.error("❌ Ticket olinmadi");
        return;
      }

      // WS URL ni shakllantirish (VITE_BASE_URL dan foydalanish)
      const backendUrl = "https://backend.raqamlinazorat.uz"; // Backend manzilingiz
      const baseUrl = backendUrl.replace(/^http/, 'ws');

      const wsUrl = `${baseUrl}/ws/notifications/?ticket=${ticket}`;

      // NotificationSocket orqali ulanish
      notificationSocket.connect(wsUrl, (payload) => {
        // Bu yerda xabarni UI da ko'rsatish logikasi (masalan, Toast yoki State)
        handleIncomingNotification(payload);
      });

    } catch (error) {
      console.error("WS ulanishda xato:", error);
    }
  }, []);

  // 2. Xabarni qayta ishlash funksiyasi
  const handleIncomingNotification = (payload) => {
    // Tizim bildirishnomasini ko'rsatish
    if (Notification.permission === "granted") {
      const notification = new Notification(payload.title || "Yangi xabar", {
        body: payload.body || payload.message,
        icon: "/imgs/Logo.png",
        data: { url: window.location.origin }
      });

      notification.onclick = (event) => {
        event.preventDefault();

        window.focus();

        window.location.href = window.location.origin;

        notification.close(); // Bosilgandan keyin bildirishnomani yopish
      };
    }

    const newNotif = mapApiNotification({
      ...payload,
      created_at: new Date().toISOString(), // kelgan vaqti
      is_read: false
    });

    setNotifs(prev => [newNotif, ...prev]); // Yangisini ro'yxat boshiga qo'shish
    setNotifCount(prev => prev + 1);
  };

  // 3. Asosiy effekt: Firebase va WebSocket-ni ishga tushirish
  useEffect(() => {
    // A. Firebase Token olish va Foreground xabarlarni eshitish
    const setupFirebase = async () => {
      await requestForToken(); // Tokenni oladi va backendga yuboradi

      // Sayt ochiq turganda Firebase orqali keladigan xabarlar uchun
      onMessageListener().then((payload) => {
        console.log("🔥 Firebase Foreground xabar:", payload);
        handleIncomingNotification(payload.notification);
      });
    };

    setupFirebase();
    connectNotificationsWs();

    // Tozalash (Cleanup): Komponent yopilganda ulanishni uzish
    return () => {
      notificationSocket.disconnect();
    };
  }, [connectNotificationsWs]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (downloadRef.current && !downloadRef.current.contains(event.target)) {
        setDownloadOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // navbarExtra mavjud bo'lsa sidebar collapsed holda ko'rsatiladi (kanban mode)
  const isKanban = !!navbarExtra

  return (
    <div className="flex min-h-screen bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]">
      <Sidebar forceCollapsed={isKanban} onForceClick={sidebarClickHandler} />
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Navbar ── */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b
          bg-[var(--bg-elevation-1)] border-[var(--stroke-soft)]
          dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)]">

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
                    <span className="text-[13px] font-medium text-[var(--text-sub)] dark:text-[var(--text-strong)]">
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
                  bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]"
                style={{ fontSize: 13, fontWeight: 800 }}
              >
                {action.icon && <span>{action.icon}</span>}
                {action.label}
              </button>
            )}

            {print && (
              <button
                onClick={print.onClick}
                className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer  bg-[#e9eeff] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--text-strong)] text-[var(--text-strong)] "
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
                    className='flex items-center h-full px-3 py-2 gap-1 text-[13px] font-extrabold text-white! bg-[#3f57b3] cursor-pointer hover:bg-[var(--accent-sub)] '
                  >
                    <MdOutlineFileDownload size={20} />
                    Yuklab olish
                  </span>
                  <span
                    onClick={() => setDownloadOpen(!downloadOpen)}
                    className='flex items-center h-full px-1.5 py-2.5 justify-center bg-[#3f57b3] text-white! cursor-pointer border-l border-white/20 hover:bg-[var(--accent-sub)] '
                  >
                    <FaAngleDown size={16} />
                  </span>
                </button>

                {downloadOpen && (
                  <div className="absolute top-full right-0 mt-3 w-[230px] bg-[#F1F3F9] dark:bg-[var(--bg-elevation-2)] rounded-[24px] p-3 shadow-2xl z-50 flex flex-col gap-2 border border-white/50 dark:border-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {[
                      { label: 'Excel', icon: <ExcelIcon size={24} />, key: 'excel' },
                      { label: 'PDF', icon: <PdfIcon size={24} />, key: 'pdf' },
                      { label: 'CSV', icon: <img src="/imgs/csv.svg" alt="CSV" className="w-8 h-8" />, key: 'csv' }
                    ].map((item) => (
                      <div
                        key={item.key}
                        onClick={() => { download[item.key](); setDownloadOpen(false) }}
                        className="flex items-center justify-between p-2 bg-white/40 dark:bg-white/5 rounded-[18px] cursor-pointer hover:bg-[var(--bg-elevation-1)] dark:hover:bg-white/10 transition-all active:scale-[0.98] group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] rounded-[14px] flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                            {item.icon}
                          </div>
                          <span className="text-[var(--text-strong)] dark:text-[var(--text-strong)] font-bold text-base">{item.label}</span>
                        </div>
                        <div className="w-6 h-6 flex items-center justify-center text-[var(--text-sub)] dark:text-[var(--text-sub)] group-hover:text-[var(--accent-strong)] ">
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
                onClick={() => {
                  if (!notifOpen) {
                    fetchNotifications()
                  }
                  setNotifOpen(o => !o)
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer 
                  bg-[#F1F3F9] hover:bg-[#E8EAF2]
                  dark:bg-[var(--bg-elevation-2)] dark:hover:bg-[var(--bg-elevation-2)]"
              >
                <img
                  src="/imgs/notification.svg"
                  alt="notification"
                  className="w-[18px] h-[18px] brightness-0 [filter:brightness(0)_saturate(100%)_invert(10%)_sepia(10%)_saturate(1000%)_hue-rotate(190deg)_brightness(90%)] dark:brightness-0 dark:invert"
                />
              </button>
        
              {notifCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--error-strong)] border-2 border-white dark:border-[#191A1A] text-[10px] leading-none font-bold text-white flex items-center justify-center">
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </div>
          </div>
        </header>

        <main className={`flex-1 flex flex-col bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] ${isKanban ? 'p-0 overflow-hidden' : 'p-6'}`}>
          <Outlet />
        </main>
      </div>

      {/* Overlay */}
      {notifOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setNotifOpen(false)} />
          <NotificationPanel
            notifs={notifs}
            setNotifs={setNotifs}
            onClose={() => setNotifOpen(false)}
            onItemClick={handleNotifClick}
            onScroll={handleScrollNotif}
            onCountRefresh={fetchNotifCount}
          />
        </>
      )}

      {activeAttendanceMeetingId && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setActiveAttendanceMeetingId(null)} />
          <MeetingAttendanceModal
            meetingId={activeAttendanceMeetingId}
            closeMeetingOnSave
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

      {activeOpenMeeting && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setActiveOpenMeeting(null)} />
          <MeetingOpenModal
            meetingId={activeOpenMeeting.meetingId}
            userId={user?.id}
            onClose={() => setActiveOpenMeeting(null)}
          />
        </>
      )}

      {activeExcuseAttendanceId && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setActiveExcuseAttendanceId(null)} />
          <AttendanceExcuseModal
            attendanceId={activeExcuseAttendanceId}
            onClose={() => setActiveExcuseAttendanceId(null)}
          />
        </>
      )}

      {activeSystemNotif && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => setActiveSystemNotif(null)} />
          <SystemNotifModal
            title={activeSystemNotif.title}
            message={activeSystemNotif.message}
            date={activeSystemNotif.date}
            onClose={() => setActiveSystemNotif(null)}
            onBack={() => { setActiveSystemNotif(null); setNotifOpen(true) }}
          />
        </>
      )}
    </div>
  )
}
