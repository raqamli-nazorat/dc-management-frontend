import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { MdExpandMore, MdExpandLess } from 'react-icons/md'
import { FaChevronRight, FaArrowRightFromBracket } from 'react-icons/fa6'
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

function IconHistory({ size = 19, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 19 19" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M9.08464 17.4167C13.687 17.4167 17.4179 13.6857 17.4179 9.08333C17.4179 4.48096 13.687 0.75 9.0846 0.75C5.35324 0.75 2.22986 3.20241 1.16797 6.58333H3.2513" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.08398 5.75V9.08333L10.7507 10.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M0.75 9.08337C0.75 9.36445 0.762671 9.64243 0.787446 9.91671M6.58333 17.4167C6.29867 17.323 6.02059 17.2137 5.75 17.0898M1.75783 13.25C1.59712 12.9404 1.45377 12.6194 1.32914 12.2886M3.10935 15.1721C3.36408 15.4466 3.63588 15.7035 3.92296 15.9411" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconDailyPlan({ size = 19, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 19" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M4.08659 2C2.79009 2.0389 2.0171 2.1832 1.48223 2.71856C0.75 3.45148 0.75 4.63109 0.75 6.9903L0.75 12.412C0.75 14.7712 0.75 15.9508 1.48223 16.6838C2.21447 17.4167 3.39298 17.4167 5.75 17.4167L9.91667 17.4167C12.2737 17.4167 13.4522 17.4167 14.1844 16.6838C14.9167 15.9508 14.9167 14.7712 14.9167 12.412V6.9903C14.9167 4.63109 14.9167 3.45148 14.1844 2.71856C13.6496 2.1832 12.8766 2.0389 11.5801 2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.08203 2.20833C4.08203 1.40292 4.73495 0.75 5.54036 0.75L10.1237 0.75C10.9291 0.75 11.582 1.40292 11.582 2.20833C11.582 3.01375 10.9291 3.66667 10.1237 3.66667L5.54036 3.66667C4.73495 3.66667 4.08203 3.01375 4.08203 2.20833Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9.08594 8.25H12.0026" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3.66992 9.08341C3.66992 9.08341 4.08659 9.08341 4.50326 9.91675C4.50326 9.91675 5.82678 7.83341 7.00326 7.41675" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.08594 13.25H12.0026" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.50195 13.25H5.33529" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconTrash({ size = 19, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 17 19" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M14.5 3.66675L13.9836 12.021C13.8516 14.1555 13.7856 15.2227 13.2506 15.99C12.9861 16.3693 12.6455 16.6895 12.2506 16.9301C11.4518 17.4167 10.3825 17.4167 8.24395 17.4167C6.1026 17.4167 5.03192 17.4167 4.23254 16.9292C3.83733 16.6881 3.49666 16.3674 3.23224 15.9874C2.6974 15.2189 2.63288 14.1502 2.50384 12.0127L2 3.66675" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M0.75 3.66667L15.75 3.66667M11.6298 3.66667L11.0609 2.49311C10.683 1.71355 10.494 1.32377 10.1681 1.08067C10.0958 1.02675 10.0192 0.978785 9.93919 0.937251C9.57826 0.75 9.1451 0.75 8.27877 0.75C7.39069 0.75 6.94665 0.75 6.57974 0.9451C6.49842 0.98834 6.42082 1.03825 6.34774 1.09431C6.01803 1.34725 5.83386 1.75129 5.4655 2.55938L4.96077 3.66667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.16602 12.8334L6.16602 7.83337" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.334 12.8334L10.334 7.83337" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
    {
      label: 'Arizalar', icon: IconApplications,
      children: [
        { label: 'Arizalar', path: '/manager/applications' },
        { label: 'Lavozimlar', path: '/manager/applications/positions' },
        { label: 'Viloyatlar', path: '/manager/applications/regions' },
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

/* ── Samaradorlik kartochkasi ──────────────────────────────── */
/* Bir xil rang palitrasi (butun bo'lim bo'ylab izchil) */
const EFF_GREEN = '#00B254'
const EFF_ORANGE = '#FCA400'
const EFF_RED = '#FA5252'

function effColor(v) {
  if (v <= 30) return EFF_RED
  if (v <= 75) return EFF_ORANGE
  return EFF_GREEN
}

function EffBar({ value, color }) {
  return (
    <div className="w-full h-[6px] rounded-full overflow-hidden bg-[var(--stroke-soft)] dark:bg-[var(--bg-elevation-1)]">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-in-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  )
}

function MetricRow({ label, value, dot }) {
  return (
    <div className="flex items-center justify-between py-[5px] text-[13px]">
      <span className="text-[var(--text-strong)] dark:text-[var(--text-sub)]">{label}</span>
      <span className="flex items-center gap-2">
        {dot && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />}
        <span className="font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] tabular-nums">{value}</span>
      </span>
    </div>
  )
}

function EfficiencyCard({ data, loading, detailOpen, onToggleDetail, tipOpen, onTip, cardRef }) {
  const overall = Math.round(data?.overall_efficiency || 0)
  const taskScore = Math.round(data?.task_score || 0)
  const meetScore = Math.round(data?.meeting_score || 0)
  const m = data?.metrics || {}

  /* Izchil uslublar (ikkala kartochkada bir xil) */
  const cardCls = 'rounded-2xl p-4 bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-2)] border border-[var(--stroke-soft)] dark:border-[var(--stroke-sub)] shadow-sm'
  const titleCls = 'text-[15px] font-semibold text-[var(--text-strong)] dark:text-[var(--text-strong)]'
  const pctCls = 'text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)] leading-none tabular-nums'
  const capCls = 'text-[13px] text-[var(--text-soft)]'

  return (
    <div ref={cardRef} className="relative">
      {/* ── Tafsilot paneli — absolute overlay, yuqoriga ochiladi (boshqa elementlarni siljitmaydi) ── */}
      <div
        className={`absolute bottom-full left-0 right-0 mb-2 z-50 transition-all duration-200 ease-out
          ${detailOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none'}`}
      >
        <div className={`${cardCls} shadow-sm`}>
          <h6 className={`${titleCls} mb-3`}>Samaradorlik tafsiloti</h6>

          {/* Vazifalar bo'yicha */}
          <div className="mb-3">
            <div className="flex items-end justify-between mb-1.5">
              <span className={pctCls}>{taskScore}%</span>
              <span className={capCls}>Vazifalar bo'yicha</span>
            </div>
            <EffBar value={taskScore} color={EFF_GREEN} />
          </div>

          {/* Yig'ilishlar bo'yicha */}
          <div className="mb-3">
            <div className="flex items-end justify-between mb-1.5">
              <span className={pctCls}>{meetScore}%</span>
              <span className={capCls}>Yig'ilishlar bo'yicha</span>
            </div>
            <EffBar value={meetScore} color={EFF_ORANGE} />
          </div>

          {/* Ajratuvchi */}
          <div className="border-t border-dashed border-[var(--stroke-sub)] my-2.5" />

          <p className={`${capCls} mb-1`}>Vazifa ko'rsatkichlari</p>
          <MetricRow label="Jami vazifalar" value={m.total_tasks ?? 0} />
          <MetricRow label="Muddati o'tgan" value={m.overdue_tasks ?? 0} dot={EFF_GREEN} />
          <MetricRow label="Rad etilgan" value={m.rejected_tasks ?? 0} dot={EFF_RED} />
          <MetricRow label="Qayta ochilgan" value={m.total_reopened_actions ?? 0} dot={EFF_ORANGE} />
        </div>
      </div>

      {/* ── Samaradorlik darajasi (asosiy karta) ── */}
      <div className={`rounded-2xl p-3 bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-2)] border border-[var(--stroke-soft)] dark:border-[var(--stroke-sub)] shadow-sm relative`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-0.5">
            <span className={`text-[12px] font-semibold text-nowrap text-[var(--text-strong)] dark:text-[var(--text-strong)]`}>Samaradorlik darajasi</span>
            <button
              type="button"
              onMouseEnter={() => onTip(true)}
              onMouseLeave={() => onTip(false)}
              onClick={(e) => { e.stopPropagation(); onTip(!tipOpen) }}
              className="w-[16px] h-[16px] rounded-full bg-[var(--text-soft)] text-white text-[10px] font-bold flex items-center justify-center shrink-0 cursor-pointer hover:bg-[var(--text-sub)] transition-colors"
            >
              ?
            </button>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleDetail() }}
            className="px-3 py-1 rounded-lg text-[13px] font-medium cursor-pointer shrink-0
              text-[var(--text-sub)] border border-[var(--stroke-sub)]
              hover:bg-[var(--bg-elevation-2)] hover:text-[var(--text-strong)]
              dark:hover:bg-[var(--bg-elevation-1)] transition-colors"
          >
            Batafsil
          </button>
        </div>

        {/* Tooltip — bg-elevation-2, pastda, ko'rsatkich (arrow) bilan */}
        {tipOpen && (
          <div className="absolute left-3 right-3 top-[46px] z-50 rounded-2xl px-4 py-3 text-center text-[12px] leading-snug shadow-xl
            bg-[var(--bg-elevation-2)] dark:bg-[var(--bg-elevation-1)] text-[var(--text-strong)] dark:text-[var(--text-strong)]
            border border-[var(--stroke-soft)] dark:border-[var(--stroke-sub)]">
            <span className="absolute -top-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 rounded-[2px]
              bg-[var(--bg-elevation-2)] dark:bg-[var(--bg-elevation-1)]
              border-l border-t border-[var(--stroke-soft)] dark:border-[var(--stroke-sub)]" />
            Xodim faoliyati real vaqt ma'lumotlari asosida hisoblanadi
          </div>
        )}

        <div className="flex items-end justify-between mb-2.5">
          <span className={` font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)] leading-none tabular-nums text-[16px] `}>{loading && !data ? '—' : `${overall}%`}</span>
          <span className={capCls}>Umumiy samaradorlik</span>
        </div>

        <EffBar value={overall} color={effColor(overall)} />
      </div>
    </div>
  )
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

  const [userSts, setUserSts] = useState(null)
  const [stsLoading, setStsLoading] = useState(true)
  const [stsDetailOpen, setStsDetailOpen] = useState(false)
  const [stsTipOpen, setStsTipOpen] = useState(false)
  const effRef = useRef(null)

  const getUserSts = async () => {
    setStsLoading(true)
    try {
      const { data } = await axiosAPI.get('users/me/efficiency/')
      setUserSts(data.data)
    } catch (error) {
      console.error('Samaradorlik yuklashda xatolik:', error)
      setUserSts(null)
    } finally {
      setStsLoading(false)
    }
  }

  useEffect(() => {
    if (user) getUserSts()
  }, [])

  // Samaradorlik paneli — tashqariga bosilganda yopish
  useEffect(() => {
    if (!stsDetailOpen && !stsTipOpen) return
    const h = (e) => {
      if (effRef.current && !effRef.current.contains(e.target)) {
        setStsDetailOpen(false)
        setStsTipOpen(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [stsDetailOpen, stsTipOpen])

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
        {['employee', 'xodim', 'manager', 'menager', 'admin', 'superadmin', 'accountant', 'hisobchi', 'auditor', 'nazoratchi'].includes(routeRole) && (
          isCollapsed ? (
            (() => {
              const isAnalyticActive = location.pathname.includes('dashboard') || location.pathname.includes('analytics')
              return (
                <button
                  onClick={() => navigate(`/${urlPrefix}/dashboard`)}
                  title="Analitika"
                  className={iconBtn(isAnalyticActive)}
                >
                  <img src="/imgs/dashboard-square-03.svg" alt="analytics"
                    className={`w-4 h-4 brightness-0 ${isAnalyticActive ? 'dark:invert dark:opacity-100' : 'dark:invert dark:opacity-40'}`} />
                </button>
              )
            })()
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
              <img
                alt=""
                src="/imgs/dashboard-square-03.svg"
                className={`w-4 h-4 shrink-0 dark:brightness-0 dark:invert ${!(location.pathname.includes('dashboard') || location.pathname.includes('analytics')) ? 'opacity-60' : ''}`}
              />
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


        {/* Umumiy tarix */}
        {isCollapsed ? (
          <button
            onClick={() => navigate(`/${urlPrefix}/auditlog`)}
            title="Umumiy tarix"
            className={iconBtn(location.pathname.includes('auditlog'))}
          >
            <IconHistory size={18} />
          </button>
        ) : (
          <NavLink
            to={`/${urlPrefix}/auditlog`}
            className={({ isActive }) => [
              'flex items-center gap-2.5 px-4 py-3 rounded-lg text-[13px] font-medium cursor-pointer border',
              isActive
                ? 'bg-[var(--stroke-sub)] text-[var(--text-strong)] border-[var(--stroke-soft)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--text-strong)] dark:border-[var(--stroke-sub)]'
                : 'text-[var(--text-sub)] border-transparent hover:bg-[var(--stroke-sub)] hover:border-[var(--stroke-soft)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)] dark:border-transparent',
            ].join(' ')}
          >
            <IconHistory size={18} className="shrink-0" />
            <span>Umumiy tarix</span>
          </NavLink>
        )}

        {/* Kundalik reja */}
        {isCollapsed ? (
          <button
            onClick={() => navigate(`/${urlPrefix}/my_tasks`)}
            title="Kundalik reja"
            className={iconBtn(location.pathname.includes('my_tasks'))}
          >
            <IconDailyPlan size={18} />
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
            <IconDailyPlan size={18} className="shrink-0" />
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
            <IconTrash size={18} />
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
            <IconTrash size={18} className="shrink-0" />
            <span>Chiqindi qutisi</span>
          </NavLink>
        ))}

        {!isCollapsed && <EfficiencyCard
          cardRef={effRef}
          data={userSts}
          loading={stsLoading}
          detailOpen={stsDetailOpen}
          onToggleDetail={() => setStsDetailOpen(o => !o)}
          tipOpen={stsTipOpen}
          onTip={setStsTipOpen}
        />}

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