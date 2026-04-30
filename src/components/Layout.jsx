import { useState, useRef, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import { usePageAction } from '../context/PageActionContext'
import { useTheme } from '../context/ThemeContext'
import { FaAngleDown, FaXmark } from 'react-icons/fa6'
import { FaFolder } from 'react-icons/fa'
import { MdCheck, MdOutlineFileDownload, MdOutlinePrint } from 'react-icons/md'
import { ExcelIcon, PdfIcon } from './icons'

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
  trash: 'Chiqindi qutisi', profile: 'Shaxsiy kabinet',
}

const NOTIFS_DATA = [
  { id: 1, date: '17.01.2026', title: "Yig'ilish yakunlandi", sub: "Yig'ilishda kimlar qatnashdi", time: '11:00', read: true, urgent: false },
  { id: 2, date: '17.01.2026', title: "Yig'ilish yakunlandi", sub: "Yig'ilishda kimlar qatnashdi", time: '10:00', read: false, urgent: true },
  { id: 3, date: '16.01.2026', title: "Yig'ilish yakunlandi", sub: "Yig'ilishda kimlar qatnashdi", time: '11:00', read: false, urgent: false },
  { id: 4, date: '16.01.2026', title: "Yig'ilish yakunlandi", sub: "Yig'ilishda kimlar qatnashdi", time: '11:00', read: true, urgent: false },
  { id: 5, date: '16.01.2026', title: "Yig'ilish yakunlandi", sub: "Yig'ilishda kimlar qatnashdi", time: '11:00', read: false, urgent: false },
]

function groupByDate(notifs) {
  const map = {}
  notifs.forEach(n => {
    if (!map[n.date]) map[n.date] = []
    map[n.date].push(n)
  })
  return Object.entries(map)
}

function NotificationPanel({ notifs, setNotifs, onClose }) {
  const grouped = groupByDate(notifs)

  const markRead = (id) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  return (
    <div
      className="fixed top-0 right-0 h-full z-50 flex flex-col shadow-2xl
        bg-white dark:bg-[#1C1D1D] border-l border-[#EEF1F7] dark:border-[#292A2A]"
      style={{ width: 480 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#EEF1F7] dark:border-[#292A2A] shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#1A1D2E] dark:text-white">Bildirshnomalar</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors
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
              {items.map(n => (
                <button
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors cursor-pointer
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
                    {n.read ? (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#526ED3] flex items-center justify-center">
                        <MdCheck size={10} color="white" />
                      </span>
                    ) : n.urgent ? (
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#E02D2D] flex items-center justify-center text-white font-bold" style={{ fontSize: 9 }}>
                        !
                      </span>
                    ) : null}
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
  const location = useLocation()

  const isId = (part) => {
    if (!isNaN(Number(part))) return true
    if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(part)) return true
    return false
  }

  const hiddenParts = ['detail', 'edit', 'add', 'new', 'create', 'admin', 'manager']

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
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && (
              <span className="text-[#D0D5E2] dark:text-[#3A3B3B] mx-0.5">›</span>
            )}
            <span
              className="text-[13px] font-medium"
              style={{ color: isLast ? '#5B6078' : '#5B6078' }}
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
  const { action, breadcrumbExtra, navbarExtra, sidebarClickHandler, print, download } = usePageAction()
  const { isDark, toggleTheme } = useTheme()
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState(NOTIFS_DATA)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const downloadRef = useRef(null)

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
                    <span className="text-[13px] font-medium text-[#5B6078] dark:text-[#C2C8E0]">
                      {breadcrumbExtra}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={`flex items-center gap-2 shrink-0 ${isKanban ? 'ml-3' : ''}`}>
            {action && (
              <button
                onClick={action.onClick}
                className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors bg-[#e9eeff] text-[#1A1D2E] "
                style={{ fontSize: 13, fontWeight: 800 }}
              >
                <MdOutlinePrint size={20} />
                Chop etish
              </button>
            )}

            {download && (
              <div className="relative" ref={downloadRef}>
                <button className='flex items-center gap-[2px] rounded-xl overflow-hidden'>
                  <span className='flex items-center h-full px-3 py-2 gap-1 text-[13px] font-extrabold text-white! bg-[#3f57b3] cursor-pointer hover:bg-[#526ED3] transition-colors'>
                    <MdOutlineFileDownload size={20} />
                    Yuklab olish
                  </span>
                  <span
                    onClick={() => setDownloadOpen(!downloadOpen)}
                    className='flex items-center h-full px-1.5 py-2.5 justify-center bg-[#3f57b3] text-white! cursor-pointer border-l border-white/20 hover:bg-[#526ED3] transition-colors'
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
                        <div className="w-6 h-6 flex items-center justify-center text-[#5B6078] dark:text-[#C2C8E0] group-hover:text-[#3F57B3] transition-colors">
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
                className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer transition-colors
                  bg-[#F1F3F9] hover:bg-[#E8EAF2]
                  dark:bg-[#292A2A] dark:hover:bg-[#333435]"
              >
                <img
                  src="/imgs/notification.svg"
                  alt="notification"
                  className="w-[18px] h-[18px] brightness-0 [filter:brightness(0)_saturate(100%)_invert(10%)_sepia(10%)_saturate(1000%)_hue-rotate(190deg)_brightness(90%)] dark:brightness-0 dark:invert"
                />
              </button>
              {notifs.some(n => !n.read) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#3F57B3] border-2 border-white dark:border-[#191A1A]" />
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
          <NotificationPanel notifs={notifs} setNotifs={setNotifs} onClose={() => setNotifOpen(false)} />
        </>
      )}
    </div>
  )
}
