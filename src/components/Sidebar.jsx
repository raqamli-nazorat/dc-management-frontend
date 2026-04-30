import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { MdExpandMore, MdExpandLess } from 'react-icons/md'
import { FaTrashCan, FaChevronRight, FaArrowRightFromBracket } from 'react-icons/fa6'
import { useState, useRef, useEffect } from 'react'

import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getRouteRole } from './ProtectedRoute'
import {
  IconUserGroup, IconFolder, IconBriefcaseDollar,
  IconAnalytics, IconSidebarLeft,
} from './icons'

function IconApplications({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M5.83334 2.5H14.1667C15.0871 2.5 15.8333 3.24619 15.8333 4.16667V17.5L10 15L4.16667 17.5V4.16667C4.16667 3.24619 4.91286 2.5 5.83334 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M7.5 7.5H12.5M7.5 10.8333H10.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

const menuByRole = {
  admin: [
    {
      label: 'Autentifikatsiya', icon: IconUserGroup,
      children: [
        { label: 'Foydalanuvchilar', path: '/admin/users' },
      ],
    },
    {
      label: 'Vazifalar boshqaruvi', icon: IconFolder,
      children: [
        { label: 'Loyihalar', path: '/admin/projects' },
        { label: 'Vazifalar', path: '/admin/tasks' },
        { label: "Yig'ilishlar", path: '/admin/meetings' },
      ],
    },
    {
      label: 'Moliya', icon: IconBriefcaseDollar,
      children: [
        { label: "Xarajat so'rovlari", path: '/admin/payments' },
        { label: 'Ish haqi',           path: '/admin/finance' },
        { label: 'Tarix',              path: '/admin/finance/history' },
      ],
    },
    {
      label: 'Hisobotlar', icon: IconAnalytics,
      children: [
        { label: 'Xodim bo\'yicha', path: '/admin/reports/employee' },
        { label: 'Loyihalar bo\'yicha', path: '/admin/reports/project' },
        { label: 'Xarajat so\'rovlari bo\'yicha', path: '/admin/reports/cost_inquiries' },
        { label: 'Ish haqi bo\'yicha', path: '/admin/reports/salary' },
        { label: 'Vazifalar bo\'yicha', path: '/admin/reports/by_tasks' },
      ],
    },
    {
      label: 'Arizalar', icon: IconApplications,
      children: [
        { label: 'Arizalar',   path: '/admin/applications' },
        { label: 'Lavozimlar', path: '/admin/applications/positions' },
        { label: 'Viloyatlar', path: '/admin/applications/regions' },
      ],
    },
  ],
  menager: [
    {
      label: 'Jamoam', icon: IconUserGroup,
      children: [
        { label: 'Xodimlar', path: '/menager/team' },
        { label: 'Vazifalar', path: '/menager/tasks' },
      ],
    },
    {
      label: 'Loyihalar', icon: IconFolder,
      children: [
        { label: 'Faol',  path: '/menager/projects' },
        { label: 'Arxiv', path: '/menager/projects/archive' },
      ],
    },
    {
      label: 'Moliya', icon: IconBriefcaseDollar,
      children: [
        { label: "Xarajat so'rovlari", path: '/menager/payments' },
        { label: 'Ish haqi',           path: '/menager/finance' },
        { label: 'Tarix',              path: '/menager/finance/history' },
      ],
    },
    {
      label: 'Hisobotlar', icon: IconAnalytics,
      children: [
        { label: 'Kalendar', path: '/menager/calendar' },
        { label: 'Xabarlar', path: '/menager/messages' },
      ],
    },
  ],
  xodim: [
    {
      label: 'Vazifalarim', icon: IconUserGroup,
      children: [
        { label: 'Joriy',      path: '/xodim/tasks' },
        { label: 'Bajarilgan', path: '/xodim/tasks/done' },
      ],
    },
    {
      label: 'Loyihalar', icon: IconFolder,
      children: [{ label: 'Mening loyihalarim', path: '/xodim/projects' }],
    },
    {
      label: 'Moliya', icon: IconBriefcaseDollar,
      children: [
        { label: "Xarajat so'rovlari", path: '/xodim/payments' },
        { label: 'Ish haqi',           path: '/xodim/finance' },
        { label: 'Tarix',              path: '/xodim/finance/history' },
      ],
    },
    {
      label: 'Hisobotlar', icon: IconAnalytics,
      children: [
        { label: 'Faoliyat', path: '/xodim/reports' },
        { label: 'Kalendar', path: '/xodim/calendar' },
      ],
    },
  ],
  hisobchi: [
    {
      label: 'Moliya', icon: IconBriefcaseDollar,
      children: [
        { label: "Xarajat so'rovlari", path: '/hisobchi/payments' },
        { label: 'Ish haqi',           path: '/hisobchi/finance' },
        { label: 'Tarix',              path: '/hisobchi/finance/history' },
      ],
    },
  ],
}

export default function Sidebar({ forceCollapsed = false, onForceClick }) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [collapsed, setCollapsed]   = useState(false)
  const [openGroups, setOpenGroups] = useState({ 0: true })
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)

  // Outside click — popup yopish
  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const isCollapsed = forceCollapsed || collapsed

  const routeRole = getRouteRole(user)
  const menu = menuByRole[routeRole] || []
  const toggleGroup   = (i) => setOpenGroups(prev => ({ [i]: !prev[i] }))
  const isGroupActive = (group) => group.children?.some(c => location.pathname === c.path)
  const handleDashboard = () => navigate(`/${routeRole}/dashboard`)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  /* isCollapsed ikonka style — active/inactive */
  const iconBtn = (active) => [
    'w-9 h-9 flex items-center justify-center rounded-xl transition-colors cursor-pointer border',
    active
      ? 'bg-[#E2E6F2] text-[#1A1D2E] border-[#EEF1F7] dark:bg-[#303131] dark:text-white dark:border-[#474848]'
      : 'text-[#5B6078] border-transparent hover:bg-[#E2E6F2] hover:border-[#EEF1F7] dark:text-[#C2C8E0] dark:hover:bg-[#303131] dark:hover:border-[#474848]',
  ].join(' ')

  return (
    <aside
      className={[
        'hidden md:flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden transition-[width] duration-300',
        'bg-[#F1F3F9] dark:bg-[#1C1D1D]',
        isCollapsed ? 'w-[64px] cursor-pointer' : 'w-[280px]',
      ].join(' ')}
      onClick={() => {
        if (forceCollapsed && onForceClick) { onForceClick(); return }
        if (isCollapsed && !forceCollapsed) setCollapsed(false)
      }}
    >

      {/* ── Logo ── */}
      <div
        className={[
          'flex items-center shrink-0 mb-4',
          isCollapsed ? 'justify-center h-20 px-3' : 'h-20 px-3',
        ].join(' ')}
      >
        {isCollapsed ? (
          /* Yopilgan: logo shakli o'zgarmaydi — rounded-lg kvadrat */
          <button
            onClick={handleDashboard}
            className="w-8 h-8 rounded-lg bg-[#526ED3] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity shrink-0"
          >
            <img src="/imgs/Logo.png" alt="logo" className="w-5 h-5 object-contain" />
          </button>
        ) : (
          <>
            <button
              onClick={handleDashboard}
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-[#526ED3] flex items-center justify-center shrink-0">
                <img src="/imgs/Logo.png" alt="logo" className="w-5 h-5 object-contain" />
              </div>
              <span
                className="truncate text-[#5B6078] dark:text-white"
                style={{ fontWeight: 400, fontSize: 15 }}
              >
                Raqamli Nazorat
              </span>
            </button>
            <button
              onClick={() => setCollapsed(true)}
              className="ml-1 flex items-center justify-center w-7 h-7 rounded-md transition-colors cursor-pointer shrink-0
                text-[#5B6078] hover:text-[#1A1D2E] dark:text-[#C2C8E0] dark:hover:text-white"
            >
              <IconSidebarLeft size={18} />
            </button>
          </>
        )}
      </div>

      {/* ── Nav ── */}
      <nav
        className={[
          'flex-1 overflow-y-auto flex flex-col gap-2',
          isCollapsed ? 'px-[10px]' : 'px-3 py-3',
        ].join(' ')}
      >
        {menu.map((group, i) => {
          const active = isGroupActive(group)
          const open   = openGroups[i]
          const Icon   = group.icon

          return (
            <div key={i} className="flex flex-col gap-1.5">
              {/* Group header */}
              {isCollapsed ? (
                /* Yopilgan: faqat ikonka, kvadrat */
                <button
                  onClick={() => setCollapsed(false)}
                  title={group.label}
                  className={iconBtn(active)}
                >
                  <Icon size={18} />
                </button>
              ) : (
                <button
                  onClick={() => toggleGroup(i)}
                  className={[
                    'w-full flex items-center gap-2.5 px-4 py-3 rounded-lg transition-colors cursor-pointer',
                    'text-[13px] font-medium',
                    active
                      ? 'bg-[#E2E6F2] text-[#1A1D2E] border border-[#EEF1F7] dark:bg-[#303131] dark:text-white dark:border-[#474848]'
                      : 'text-[#5B6078] border border-transparent hover:bg-[#E2E6F2] hover:text-[#1A1D2E] hover:border-[#EEF1F7] dark:text-[#C2C8E0] dark:hover:bg-[#303131] dark:hover:text-white dark:hover:border-[#474848]',
                  ].join(' ')}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="flex-1 text-left truncate">{group.label}</span>
                  {open
                    ? <MdExpandLess size={20} className="shrink-0 opacity-50" />
                    : <MdExpandMore size={20} className="shrink-0 opacity-50" />
                  }
                </button>
              )}

              {/* Children — smooth accordion */}
              {!isCollapsed && (
                <div
                  className="ml-3 flex flex-col gap-1 overflow-hidden transition-all duration-200 ease-in-out"
                  style={{
                    maxHeight: open ? `${group.children.length * 56}px` : '0px',
                    opacity: open ? 1 : 0,
                  }}
                >
                  {group.children.map(child => {
                    const childActive = location.pathname === child.path
                    return (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={() => [
                          'block px-4 py-3 rounded-lg text-[13px] font-medium transition-colors cursor-pointer border',
                          childActive
                            ? 'bg-[#E9ECF5] text-[#5B6078] border-[#E2E6F2] dark:bg-[#292A2A] dark:text-[#C2C8E0] dark:border-[#292A2A]'
                            : 'text-[#5B6078] border-transparent hover:bg-[#E9ECF5] hover:border-[#E2E6F2] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A] dark:hover:border-[#292A2A]',
                        ].join(' ')}
                      >
                        {child.label}
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* ── Bottom ── */}
      <div
        className={[
          'flex flex-col gap-1 shrink-0',
          isCollapsed ? 'px-[10px] py-3 items-center' : 'px-3 py-3',
        ].join(' ')}
      >
        {isCollapsed ? (
          /* Yopilgan: Chiqindi qutisi ikonka */
          <button
            onClick={() => navigate(`/${routeRole}/trash`)}
            title="Chiqindi qutisi"
            className={iconBtn(location.pathname.includes('trash'))}
          >
            <FaTrashCan size={16} />
          </button>
        ) : (
          <NavLink
            to={`/${routeRole}/trash`}
            className={({ isActive }) => [
              'flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px] font-medium transition-colors cursor-pointer border',
              isActive
                ? 'bg-[#E2E6F2] text-[#1A1D2E] border-[#EEF1F7] dark:bg-[#303131] dark:text-white dark:border-[#474848]'
                : 'text-[#5B6078] border-transparent hover:bg-[#E2E6F2] hover:border-[#EEF1F7] dark:text-[#C2C8E0] dark:hover:bg-[#303131] dark:border-transparent',
            ].join(' ')}
          >
            <FaTrashCan size={16} className="shrink-0" />
            <span>Chiqindi qutisi</span>
          </NavLink>
        )}

        {/* Separator */}
        <div className="border-t border-[#E2E6F2] dark:border-[#474848] mx-1 min-w-10" />

        {/* Account + Profile Popup */}
        <div ref={profileRef} className="relative">
          {isCollapsed ? (
            <button
              onClick={() => setProfileOpen(o => !o)}
              title={`${user?.username} (${user?.roles?.[0]})`}
              className="w-9 h-9 rounded-xl bg-[#3A3B3B] flex items-center justify-center text-white text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity shrink-0"
            >
              {user?.username?.[0]?.toUpperCase()}
            </button>
          ) : (
            <button
              onClick={() => setProfileOpen(o => !o)}
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg transition-colors cursor-pointer
                hover:bg-[#E2E6F2] dark:hover:bg-[#303131]"
            >
              <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-medium bg-[#3A3B3B]">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[13px] font-medium truncate leading-tight text-[#1A1D2E] dark:text-white">
                  {user?.username}
                </p>
                <p className="text-xs truncate text-[#526ED3] dark:text-[#7F95E6]">{getRouteRole(user)}</p>
              </div>
            </button>
          )}

          {/* ── Profile Popup ── */}
          {profileOpen && (
            <div
              className="fixed z-[200] w-[240px] rounded-2xl shadow-2xl border overflow-hidden
                bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]"
              style={{ bottom: 16, left: isCollapsed ? 72 : 288 }}
            >

              {/* Current user */}
              <div className="px-4 py-3 border-b border-[#F1F3F9] dark:border-[#2A2B2B]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#526ED3] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user?.username?.[0]?.toUpperCase()}{user?.username?.[1]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1A1D2E] dark:text-white truncate">{user?.username}</p>
                    <p className="text-xs text-[#8F95A8] dark:text-[#5B6078]">{getRouteRole(user)}</p>
                  </div>
                </div>
              </div>

              {/* Dark mode toggle */}
              <div className="px-4 py-3 border-b border-[#F1F3F9] dark:border-[#2A2B2B]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isDark ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#5B6078] dark:text-[#C2C8E0]">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#5B6078] dark:text-[#C2C8E0]">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                      </svg>
                    )}
                    <span className="text-[13px] font-medium text-[#1A1D2E] dark:text-white">
                      {isDark ? "Qorong'i mavzu" : 'Kunduzgi mavzu'}
                    </span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0
                      ${isDark ? 'bg-[#526ED3]' : 'bg-[#D0D5E2]'}`}
                  >
                    <span className={`absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                      ${isDark ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Shaxsiy kabinet */}
              <button
                onClick={() => { navigate(`/${routeRole}/profile`); setProfileOpen(false) }}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-[#F1F3F9] dark:border-[#2A2B2B]
                  hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#5B6078] dark:text-[#C2C8E0]">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span className="text-[13px] font-medium text-[#1A1D2E] dark:text-white">Shaxsiy kabinet</span>
                </div>
                <FaChevronRight size={11} className="text-[#8F95A8]" />
              </button>

              {/* Chiqish */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-end  gap-2.5 px-4 py-3
                  hover:bg-[#FFF5F5] dark:hover:bg-[#2A1A1A] transition-colors cursor-pointer" 
              >
                  <span className="text-[13px] font-semibold text-[#E02D2D]">Chiqish</span>
                <FaArrowRightFromBracket size={14} className="text-[#E02D2D]" />
              
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}