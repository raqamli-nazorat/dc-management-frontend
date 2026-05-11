import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { MdExpandMore, MdExpandLess } from 'react-icons/md'
import { FaTrashCan, FaChevronRight, FaArrowRightFromBracket, FaRegCalendarCheck } from 'react-icons/fa6'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { getRouteRole } from './ProtectedRoute'
import {
  IconUserGroup, IconFolder, IconBriefcaseDollar,
  IconAnalytics, IconSidebarLeft,
} from './icons'
import { toast } from '../Toast/ToastProvider'
import { axiosAPI } from '../service/axiosAPI'

function IconApplications({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M5.83334 2.5H14.1667C15.0871 2.5 15.8333 3.24619 15.8333 4.16667V17.5L10 15L4.16667 17.5V4.16667C4.16667 3.24619 4.91286 2.5 5.83334 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 7.5H12.5M7.5 10.8333H10.8333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

const menuByRole = {
  // ── ADMIN / SUPERADMIN ──────────────────────────────────────
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
        { label: 'Ish haqi', path: '/admin/finance' },
        { label: 'Tarix', path: '/admin/finance/history' },
      ],
    },
    {
      label: 'Hisobotlar', icon: IconAnalytics,
      children: [
        { label: "Xodim bo'yicha", path: '/admin/reports/employee' },
        { label: "Loyihalar bo'yicha", path: '/admin/reports/project' },
        { label: "Xarajat so'rovlari bo'yicha", path: '/admin/reports/cost_inquiries' },
        { label: "Ish haqi bo'yicha", path: '/admin/reports/salary' },
        { label: "Vazifalar bo'yicha", path: '/admin/reports/by_tasks' },
      ],
    },
    {
      label: 'Arizalar', icon: IconApplications,
      children: [
        { label: 'Arizalar', path: '/admin/applications' },
        { label: 'Lavozimlar', path: '/admin/applications/positions' },
        { label: 'Viloyatlar', path: '/admin/applications/regions' },
      ],
    },
  ],

  // ── MANAGER ─────────────────────────────────────────────────
  manager: [
    {
      label: 'Vazifalar boshqaruvi', icon: IconFolder,
      children: [
        { label: 'Loyihalar', path: '/manager/projects' },
        { label: 'Vazifalar', path: '/manager/tasks' },
        { label: "Yig'ilishlar", path: '/manager/meetings' },
      ],
    },
    {
      label: 'Moliya', icon: IconBriefcaseDollar,
      children: [
        { label: "Xarajat so'rovlari", path: '/manager/payments' },
        { label: 'Ish haqi', path: '/manager/finance' },
        { label: 'Tarix', path: '/manager/finance/history' },
      ],
    },
    {
      label: 'Hisobotlar', icon: IconAnalytics,
      children: [
        { label: "Xodim bo'yicha", path: '/manager/reports/employee' },
        { label: "Loyihalar bo'yicha", path: '/manager/reports/project' },
        { label: "Xarajat so'rovlari bo'yicha", path: '/manager/reports/cost_inquiries' },
        { label: "Ish haqi bo'yicha", path: '/manager/reports/salary' },
        { label: "Vazifalar bo'yicha", path: '/manager/reports/by_tasks' },
      ],
    },
  ],

  // ── EMPLOYEE ─────────────────────────────────────────────────
  employee: [
    {
      label: 'Vazifalar boshqaruvi', icon: IconFolder,
      children: [
        { label: 'Loyihalar', path: '/employee/projects' },
        { label: 'Vazifalar', path: '/employee/tasks' },
        { label: "Yig'ilishlar", path: '/employee/meetings' },
      ],
    },
    {
      label: 'Moliya', icon: IconBriefcaseDollar,
      children: [
        { label: "Xarajat so'rovlari", path: '/employee/payments' },
        { label: 'Ish haqi', path: '/employee/finance' },
        { label: 'Tarix', path: '/employee/finance/history' },
      ],
    },
    {
      label: 'Hisobotlar', icon: IconAnalytics,
      children: [
        { label: "Xodim bo'yicha", path: '/employee/reports/employee' },
        { label: "Loyihalar bo'yicha", path: '/employee/reports/project' },
        { label: "Xarajat so'rovlari bo'yicha", path: '/employee/reports/cost_inquiries' },
        { label: "Ish haqi bo'yicha", path: '/employee/reports/salary' },
        { label: "Vazifalar bo'yicha", path: '/employee/reports/by_tasks' },
      ],
    },
  ],

  // ── AUDITOR ──────────────────────────────────────────────────
  auditor: [
    {
      label: 'Autentifikatsiya', icon: IconUserGroup,
      children: [
        { label: 'Foydalanuvchilar', path: '/auditor/users' },
      ],
    },
    {
      label: 'Vazifalar boshqaruvi', icon: IconFolder,
      children: [
        { label: 'Loyihalar', path: '/auditor/projects' },
        { label: 'Vazifalar', path: '/auditor/tasks' },
        { label: "Yig'ilishlar", path: '/auditor/meetings' },
      ],
    },
    {
      label: 'Moliya', icon: IconBriefcaseDollar,
      children: [
        { label: "Xarajat so'rovlari", path: '/auditor/payments' },
        { label: 'Ish haqi', path: '/auditor/finance' },
        { label: 'Tarix', path: '/auditor/finance/history' },
      ],
    },
    {
      label: 'Hisobotlar', icon: IconAnalytics,
      children: [
        { label: "Xodim bo'yicha", path: '/auditor/reports/employee' },
        { label: "Loyihalar bo'yicha", path: '/auditor/reports/project' },
        { label: "Xarajat so'rovlari bo'yicha", path: '/auditor/reports/cost_inquiries' },
        { label: "Ish haqi bo'yicha", path: '/auditor/reports/salary' },
        { label: "Vazifalar bo'yicha", path: '/auditor/reports/by_tasks' },
      ],
    },
    {
      label: 'Arizalar', icon: IconApplications,
      children: [
        { label: 'Arizalar', path: '/auditor/applications' },
        { label: 'Lavozimlar', path: '/auditor/applications/positions' },
        { label: 'Viloyatlar', path: '/auditor/applications/regions' },
      ],
    },
  ],

  // ── ACCOUNTANT ───────────────────────────────────────────────
  accountant: [
    {
      label: 'Moliya', icon: IconBriefcaseDollar,
      children: [
        { label: "Xarajat so'rovlari", path: '/accountant/payments' },
        { label: 'Ish haqi', path: '/accountant/finance' },
        { label: 'Tarix', path: '/accountant/finance/history' },
      ],
    },
    {
      label: 'Hisobotlar', icon: IconAnalytics,
      children: [
        { label: "Xarajat so'rovlari bo'yicha", path: '/accountant/reports/cost_inquiries' },
        { label: "Ish haqi bo'yicha", path: '/accountant/reports/salary' },
        { label: "Xodim bo'yicha", path: '/accountant/reports/employee' },
        { label: "Loyihalar bo'yicha", path: '/accountant/reports/project' },
        { label: "Vazifalar bo'yicha", path: '/accountant/reports/by_tasks' },
      ],
    },
  ],

  // ── Eski nomlar (backward compat) ────────────────────────────
  menager: [],
  xodim: [],
  nazoratchi: [],
  hisobchi: [],
}

const roleLabels = {
  admin: 'Administrator',
  superadmin: 'Administrator',
  manager: 'Menejer',
  menager: 'Menejer',
  employee: 'Xodim',
  xodim: 'Xodim',
  auditor: 'Nazoratchi',
  nazoratchi: 'Nazoratchi',
  accountant: 'Hisobchi',
  hisobchi: 'Hisobchi',
}

export default function Sidebar({ forceCollapsed = false, onForceClick }) {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [collapsed, setCollapsed] = useState(false)
  const [openGroups, setOpenGroups] = useState({ 0: true })
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const popupRef = useRef(null)

  const [userSts, setUserSts] = useState({})

  const getUserSts = async () => {
    try {
      const { data } = await axiosAPI.get('users/me/efficiency/')
      setUserSts(data.data)
    } catch (error) {
      console.error(error)
      toast.error("Samaradorlik haqidagi malumotlarni yuklashda xatolik!", error?.response?.data?.error?.errorMsg)
    }
  }

  useEffect(() => {
    if (user?.active_role === "employee" || user?.active_role === "manager") {
      getUserSts()
    }
  }, [])

  // Outside click — popup yopish
  useEffect(() => {
    const h = (e) => {
      const clickedTrigger = profileRef.current && profileRef.current.contains(e.target)
      const clickedPopup = popupRef.current && popupRef.current.contains(e.target)
      if (!clickedTrigger && !clickedPopup) setProfileOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Check for role change notification on mount
  useEffect(() => {
    const changedRole = localStorage.getItem('roleChanged')
    if (changedRole) {
      const roleMessages = {
        admin: { title: "Administrator roliga o'tildi.", desc: "Siz endi administrator sifatida ishlayapsiz." },
        superadmin: { title: "Administrator roliga o'tildi.", desc: "Siz endi administrator sifatida ishlayapsiz." },
        manager: { title: "Menejer roliga o'tildi.", desc: "Siz endi menejer sifatida ishlayapsiz." },
        menager: { title: "Menejer roliga o'tildi.", desc: "Siz endi menejer sifatida ishlayapsiz." },
        accountant: { title: "Hisobchi roliga o'tildi.", desc: "Siz endi hisobchi sifatida ishlayapsiz." },
        hisobchi: { title: "Hisobchi roliga o'tildi.", desc: "Siz endi hisobchi sifatida ishlayapsiz." },
        auditor: { title: "Kuzatuvchi roliga o'tildi.", desc: "Siz endi kuzatuvchi sifatida tizimni ko'rishingiz mumkin." },
        nazoratchi: { title: "Kuzatuvchi roliga o'tildi.", desc: "Siz endi kuzatuvchi sifatida tizimni ko'rishingiz mumkin." },
        employee: { title: "Xodim roliga o'tildi.", desc: "Siz endi xodim sifatida ishlayapsiz." },
        xodim: { title: "Xodim roliga o'tildi.", desc: "Siz endi xodim sifatida ishlayapsiz." },
      }
      const msg = roleMessages[changedRole] || {
        title: `${roleLabels[changedRole] || changedRole} roliga o'tildi.`,
        desc: `Siz endi ${(roleLabels[changedRole] || changedRole).toLowerCase()} sifatida ishlayapsiz.`
      }

      setTimeout(() => {
        toast.success(msg.title, msg.desc)
      }, 300)

      localStorage.removeItem('roleChanged')
    }
  }, [])

  const isCollapsed = forceCollapsed || collapsed

  const routeRole = getRouteRole(user)
  // URL dan prefix olish — eng ishonchli usul
  const urlPrefix = location.pathname.split('/')[1] || routeRole
  const menu = menuByRole[routeRole] || []
  const toggleGroup = (i) => setOpenGroups(prev => ({ [i]: !prev[i] }))
  const isGroupActive = (group) => group.children?.some(c => location.pathname === c.path)
  const handleDashboard = () => navigate(`/${urlPrefix}/dashboard`)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  /* isCollapsed ikonka style — active/inactive */
  const iconBtn = (active) => [
    'w-9 h-9 flex items-center justify-center rounded-xl  cursor-pointer border',
    active
      ? 'bg-[var(--stroke-sub)] text-[var(--text-strong)] border-[var(--stroke-soft)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--text-strong)] dark:border-[var(--stroke-sub)]'
      : 'text-[var(--text-sub)] border-transparent hover:bg-[var(--stroke-sub)] hover:border-[var(--stroke-soft)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)] dark:hover:border-[#474848]',
  ].join(' ')

  return (
    <aside
      className={[
        'hidden md:flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden transition-[width] duration-300',
        'bg-[#F1F3F9] dark:bg-[var(--bg-elevation-1)]',
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
          'flex items-center shrink-0 ',
          isCollapsed ? 'justify-center h-16 px-3' : 'h-16 px-3',
        ].join(' ')}
      >
        {isCollapsed ? (
          /* Yopilgan: logo shakli o'zgarmaydi — rounded-lg kvadrat */
          <button
            onClick={handleDashboard}
            className="w-8 h-8 rounded-lg bg-[var(--accent-sub)] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity shrink-0"
          >
            <img src="/imgs/Logo.png" alt="logo" className="w-5 h-5 object-contain" />
          </button>
        ) : (
          <>
            <button
              onClick={handleDashboard}
              className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-sub)] flex items-center justify-center shrink-0">
                <img src="/imgs/Logo.png" alt="logo" className="w-5 h-5 object-contain" />
              </div>
              <span
                className="truncate text-[var(--text-sub)] dark:text-[var(--text-strong)]"
                style={{ fontWeight: 400, fontSize: 15 }}
              >
                Raqamli Nazorat
              </span>
            </button>
            <button
              onClick={() => setCollapsed(true)}
              className="ml-1 flex items-center justify-center w-7 h-7 rounded-md  cursor-pointer shrink-0
                text-[var(--text-sub)] hover:text-[var(--text-strong)] dark:text-[var(--text-sub)] dark:hover:text-white"
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
        {/* Analitika */}
        {['employee', 'xodim', 'manager', 'menager', 'admin', 'superadmin'].includes(routeRole) && (
          isCollapsed ? (
            <button
              onClick={() => navigate(`/${urlPrefix}/dashboard`)}
              title="Analitika"
              className={iconBtn(location.pathname.includes('dashboard') || location.pathname.includes('analytics'))}
            >
              <img src="/imgs/dashboard-square-03.svg" alt="analytics" className="w-4 h-4 dark:invert dark:brightness-0" />
            </button>
          ) : (
            <NavLink
              to={`/${urlPrefix}/dashboard`}
              className={({ isActive }) => [
                'flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px] font-medium cursor-pointer border',
                isActive || location.pathname.includes('analytics')
                  ? 'bg-[var(--stroke-sub)] text-[var(--text-strong)] border-[var(--stroke-soft)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--text-strong)] dark:border-[var(--stroke-sub)]'
                  : 'text-[var(--text-sub)] border-transparent hover:bg-[var(--stroke-sub)] hover:border-[var(--stroke-soft)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)] dark:border-transparent',
              ].join(' ')}
            >
              <img src="/imgs/dashboard-square-03.svg" alt="" className="w-4 h-4 shrink-0 opacity-70 dark:invert dark:brightness-0 dark:opacity-100" />
              <span>Analitika</span>
            </NavLink>
          )
        )}
        {menu.map((group, i) => {
          const active = isGroupActive(group)
          const open = openGroups[i]
          const Icon = group.icon

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
                    'w-full flex items-center gap-2.5 px-4 py-3 rounded-lg  cursor-pointer',
                    'text-[13px] font-medium border',
                    active
                      ? 'bg-[var(--stroke-sub)] text-[var(--text-strong)] border-[var(--stroke-soft)] font-semibold dark:bg-[var(--bg-elevation-2)] dark:text-[var(--text-strong)] dark:border-[var(--stroke-sub)]'
                      : 'text-[var(--text-sub)] border-transparent hover:bg-[var(--stroke-sub)] hover:text-[var(--text-strong)] hover:border-[var(--stroke-soft)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)] dark:hover:text-white dark:hover:border-[#474848]',
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
                          'block px-4 py-3 rounded-lg text-[13px] font-medium cursor-pointer border',
                          childActive
                            ? 'bg-[var(--bg-elevation-2)] text-[var(--text-strong)] border-[var(--stroke-sub)] font-semibold dark:bg-[var(--bg-elevation-2)] dark:text-[var(--text-strong)]! dark:border-[var(--stroke-soft)]'
                            : 'text-[var(--text-sub)] border-transparent hover:bg-[var(--bg-elevation-2)] hover:text-[var(--text-strong)] hover:border-[var(--stroke-sub)] dark:text-[var(--text-sub)]! dark:hover:text-white! dark:hover:bg-[var(--bg-elevation-2)] dark:hover:border-[#292A2A]',
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


        {/* Kundalik reja */}
        {isCollapsed ? (
          <button
            onClick={() => navigate(`/${urlPrefix}/my_tasks`)}
            title="Kundalik reja"
            className={iconBtn(location.pathname.includes('my_tasks'))}
          >
            <FaRegCalendarCheck size={16} />
          </button>
        ) : (
          <NavLink
            to={`/${urlPrefix}/my_tasks`}
            className={({ isActive }) => [
              'flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px] font-medium cursor-pointer border',
              isActive
                ? 'bg-[var(--stroke-sub)] text-[var(--text-strong)] border-[var(--stroke-soft)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--text-strong)] dark:border-[var(--stroke-sub)]'
                : 'text-[var(--text-sub)] border-transparent hover:bg-[var(--stroke-sub)] hover:border-[var(--stroke-soft)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)] dark:border-transparent',
            ].join(' ')}
          >
            <FaRegCalendarCheck size={16} className="shrink-0" />
            <span>Kundalik reja</span>
          </NavLink>
        )}

        {routeRole !== 'accountant' && routeRole !== 'auditor' && (isCollapsed ? (
          /* Yopilgan: Chiqindi qutisi ikonka */
          <button
            onClick={() => navigate(`/${urlPrefix}/trash`)}
            title="Chiqindi qutisi"
            className={iconBtn(location.pathname.includes('trash'))}
          >
            <FaTrashCan size={16} />
          </button>
        ) : (
          <NavLink
            to={`/${urlPrefix}/trash`}
            className={({ isActive }) => [
              'flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px] font-medium  cursor-pointer border mb-3',
              isActive
                ? 'bg-[var(--stroke-sub)] text-[var(--text-strong)] border-[var(--stroke-soft)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--text-strong)] dark:border-[var(--stroke-sub)]'
                : 'text-[var(--text-sub)] border-transparent hover:bg-[var(--stroke-sub)] hover:border-[var(--stroke-soft)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)] dark:border-transparent',
            ].join(' ')}
          >
            <FaTrashCan size={16} className="shrink-0 " />
            <span>Chiqindi qutisi</span>
          </NavLink>
        ))}

        {(user?.active_role === "employee" || user?.active_role === "manager") && !isCollapsed && (
          <div className="flex flex-col justify-start gap-3 ml-3.5 mb-2">
            <h6 className='flex items-center gap-2 text-[13px] font-medium text-[#1A1D2E] dark:text-[var(--text-strong)]'>
              <span className='font-extrabold'>
                {userSts?.overall_efficiency || 0}%
              </span>
              Samaradorlik
            </h6>
            <div className='w-full h-[6px] bg-[#dbdbd9] rounded-full overflow-hidden'>
              <div
                style={{ width: `${userSts?.overall_efficiency || 0}%`, background: userSts?.overall_efficiency < 30 ? "#ff4053" : userSts?.overall_efficiency < 75 ? "#fca400" : userSts?.overall_efficiency > 75 ? "#00b253" : "#adaca8" }}
                className={`h-full rounded-full transition-all duration-1000 ease-in-out`}></div>
            </div>
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-[var(--stroke-sub)] dark:border-[var(--stroke-sub)] mx-1 min-w-10" />

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
              className="w-full flex items-center gap-2.5 px-4 py-3 rounded-lg  cursor-pointer
                hover:bg-[var(--stroke-sub)] dark:hover:bg-[var(--bg-elevation-2)]"
            >
              <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-medium bg-[#3A3B3B]">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-[13px] font-medium truncate leading-tight text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                  {user?.username}
                </p>
                <p className="text-xs truncate text-[var(--accent-sub)] dark:text-[var(--accent-soft)]">{roleLabels[user?.active_role || getRouteRole(user)] || user?.active_role || getRouteRole(user)}</p>
              </div>
            </button>
          )}

          {/* ── Profile Popup ── */}
          {profileOpen && createPortal(
            <div
              ref={popupRef}
              className="fixed z-[99999] w-[240px] rounded-2xl shadow-2xl border overflow-hidden
                bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]"
              style={{ bottom: 16, left: isCollapsed ? 72 : 288 }}
            >
              {/* Rollar ro'yxati */}
              <div className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
                {(user?.roles?.length > 0 ? user.roles : [user?.active_role || getRouteRole(user)]).map((role) => {
                  const isActive = (user?.active_role || user?.roles?.[0]) === role
                  return (
                    <button
                      key={role}
                      onClick={async () => {
                        if (isActive) return
                        try {
                          const { axiosAPI: api } = await import('../service/axiosAPI')
                          await api.patch('users/me/', { active_role: role })
                          const saved = localStorage.getItem('user')
                          if (saved) {
                            const u = JSON.parse(saved)
                            u.active_role = role
                            localStorage.setItem('user', JSON.stringify(u))
                          }
                          localStorage.setItem('roleChanged', role)
                          window.location.reload()
                        } catch { /* silent */ }
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 cursor-pointer 
                        ${isActive ? 'bg-[#F1F3F9] dark:bg-[var(--bg-elevation-2)]' : 'hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-1)]'}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0
                        ${isActive ? 'bg-[var(--accent-sub)] text-white' : 'bg-[var(--stroke-sub)] text-[var(--text-sub)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--text-sub)]'}`}>
                        {user?.username?.[0]?.toUpperCase()}{user?.username?.[1]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-[13px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] truncate">{user?.username}</p>
                        <p className="text-xs text-[var(--text-soft)] dark:text-[var(--text-sub)]">{roleLabels[role] || role}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              {/* Dark mode toggle */}
              <div className="px-4 py-3 border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isDark ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-sub)] dark:text-[var(--text-sub)]">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-sub)] dark:text-[var(--text-sub)]">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                      </svg>
                    )}
                    <span className="text-[13px] font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                      {isDark ? "Qorong'i mavzu" : 'Kunduzgi mavzu'}
                    </span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative w-10 h-5 rounded-full  cursor-pointer shrink-0
                      ${isDark ? 'bg-[var(--accent-sub)]' : 'bg-[var(--stroke-strong)]'}`}
                  >
                    <span className={`absolute left-0 top-0.5 w-4 h-4 rounded-full bg-[var(--bg-base)] shadow transition-transform duration-200
                      ${isDark ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Shaxsiy kabinet */}
              <button
                onClick={() => { navigate(`/${routeRole}/profile`); setProfileOpen(false) }}
                className="w-full flex items-center justify-between px-4 py-3 border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]
                  hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]  cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  {isDark ? (
                    <img src="/imgs/profileIcon_night.svg" alt="" />
                  ) : (
                    <img src="/imgs/profileIcon_light.svg" alt="" />
                  )}
                  <span className="text-[13px] font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">Shaxsiy kabinet</span>
                </div>
                <FaChevronRight size={11} className="text-[var(--text-soft)]" />
              </button>

              {/* Chiqish */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-end  gap-2.5 px-4 py-3
                  hover:bg-[#FFF5F5] dark:hover:bg-[#2A1A1A]  cursor-pointer"
              >
                <span className="text-[13px] font-semibold text-[var(--error-strong)]">Chiqish</span>
                <FaArrowRightFromBracket size={14} className="text-[var(--error-strong)]" />

              </button>
            </div>
            , document.body)}
        </div>
      </div>
    </aside>
  )
}