import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { useTheme } from '../../../context/ThemeContext'
import { axiosAPI } from '../../../service/axiosAPI'

// ── Rang palitasi — loyiha bo'yicha bir xil ──────────────────
const COLORS = {
  primary:   '#526ED3',
  secondary: '#7186ED',
  green:     '#10B981',
  amber:     '#F59E0B',
  red:       '#EF4444',
  cyan:      '#06B6D4',
  purple:    '#8B5CF6',
  gray:      '#9CA3AF',
}

// Vazifalar statusi ranglari
const TASK_COLORS = [
  COLORS.amber,    // Bajarilishi kerak
  COLORS.primary,  // Jarayonda
  COLORS.purple,   // Bajarilgan
  COLORS.green,    // Ishga tushirilgan
  COLORS.cyan,     // Tekshirilgan
  COLORS.red,      // Rad etilgan
  COLORS.gray,     // Muddati o'tgan
]

// Loyiha statusi ranglari
const PROJECT_COLORS = [
  COLORS.green,    // Tugallangan
  COLORS.primary,  // Jarayonda
  COLORS.red,      // Bekor
  COLORS.amber,    // Muddati
  COLORS.gray,     // Rejalashtirilgan
]

// Yig'ilish ranglari
const MEETING_COLORS = [COLORS.green, COLORS.primary, COLORS.red]

const PERIODS = [
  { label: '1 oy',  value: '1m' },
  { label: '3 oy',  value: '3m' },
  { label: '6 oy',  value: '6m' },
  { label: '1 yil', value: '1y' },
]

// ── Custom Tooltip ────────────────────────────────────────────
function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null
  return (
    <div className={`px-3 py-2 rounded-xl shadow-xl border text-xs
      ${isDark ? 'bg-[#1C1D1D] border-[#292A2A] text-white' : 'bg-white border-[#E2E6F2] text-[#1A1D2E]'}`}>
      {label && <p className="font-semibold mb-1 text-[#8F95A8]">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
          <span>{p.name}: <span className="font-bold">{p.value}</span></span>
        </div>
      ))}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────
function StatCard({ label, value, color, icon }) {
  return (
    <div className="rounded-2xl border bg-white dark:bg-[#1C1D1D] border-[#E2E6F2] dark:border-[#292A2A] p-4 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: color + '20' }}>
        <span className="text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-[22px] font-extrabold text-[#1A1D2E] dark:text-white leading-tight">{value ?? '—'}</p>
        <p className="text-xs text-[#8F95A8] mt-0.5">{label}</p>
      </div>
    </div>
  )
}

// ── Chart Card ────────────────────────────────────────────────
function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-2xl border bg-white dark:bg-[#1C1D1D] border-[#E2E6F2] dark:border-[#292A2A] p-5 ${className}`}>
      <h3 className="text-[15px] font-bold text-[#1A1D2E] dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const { isDark } = useTheme()
  const [period, setPeriod] = useState('1m')
  const [loading, setLoading] = useState(true)

  // Stats
  const [stats, setStats] = useState({ tasks: 0, projects: 0, meetings: 0, users: 0 })

  // Chart data
  const [taskData, setTaskData]       = useState([])
  const [projectData, setProjectData] = useState([])
  const [meetingData, setMeetingData] = useState([])

  useEffect(() => {
    fetchAll()
  }, [period])

  const fetchAll = async () => {
    setLoading(true)
    try {
      await Promise.allSettled([
        fetchTasks(),
        fetchProjects(),
        fetchMeetings(),
        fetchUsers(),
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const res = await axiosAPI.get('/tasks/', { params: { page_size: 200 } })
      const payload = res.data?.data ?? res.data
      const list = Array.isArray(payload) ? payload : (payload.results ?? [])

      const counts = {
        'Bajarilishi kerak': 0,
        'Jarayonda': 0,
        'Bajarilgan': 0,
        'Ishga tushirilgan': 0,
        'Tekshirilgan': 0,
        'Rad etilgan': 0,
        "Muddati o'tgan": 0,
      }
      const statusMap = {
        todo: 'Bajarilishi kerak',
        in_progress: 'Jarayonda',
        done: 'Bajarilgan',
        production: 'Ishga tushirilgan',
        checked: 'Tekshirilgan',
        rejected: 'Rad etilgan',
        overdue: "Muddati o'tgan",
      }
      list.forEach(t => {
        const key = statusMap[t.status]
        if (key) counts[key]++
      })

      setTaskData(Object.entries(counts).map(([name, value]) => ({ name, value })))
      setStats(prev => ({ ...prev, tasks: list.length }))
    } catch {}
  }

  const fetchProjects = async () => {
    try {
      const res = await axiosAPI.get('/projects/', { params: { page_size: 200 } })
      const payload = res.data?.data ?? res.data
      const list = Array.isArray(payload) ? payload : (payload.results ?? [])

      const counts = {
        'Tugallangan': 0,
        'Jarayonda': 0,
        'Bekor': 0,
        'Muddati': 0,
        'Rejalashtirilgan': 0,
      }
      const statusMap = {
        completed: 'Tugallangan',
        active: 'Jarayonda',
        cancelled: 'Bekor',
        overdue: 'Muddati',
        planning: 'Rejalashtirilgan',
      }
      list.forEach(p => {
        const key = statusMap[p.status]
        if (key) counts[key]++
      })

      setProjectData(Object.entries(counts).map(([name, value]) => ({ name, value })))
      setStats(prev => ({ ...prev, projects: list.length }))
    } catch {}
  }

  const fetchMeetings = async () => {
    try {
      const res = await axiosAPI.get('/meetings/', { params: { page_size: 200 } })
      const payload = res.data?.data ?? res.data
      const list = Array.isArray(payload) ? payload : (payload.results ?? [])

      // Yig'ilish qatnashish statistikasi
      let attended = 0, excused = 0, unexcused = 0
      list.forEach(m => {
        if (m.is_completed) attended++
        else unexcused++
      })

      setMeetingData([
        { name: 'Qatnashdi',  value: attended  || list.length },
        { name: 'Sababli',    value: excused },
        { name: 'Sababsiz',   value: unexcused },
      ])
      setStats(prev => ({ ...prev, meetings: list.length }))
    } catch {}
  }

  const fetchUsers = async () => {
    try {
      const res = await axiosAPI.get('/users/', { params: { page_size: 1 } })
      const payload = res.data?.data ?? res.data
      const count = Array.isArray(payload) ? payload.length : (payload.count ?? 0)
      setStats(prev => ({ ...prev, users: count }))
    } catch {}
  }

  // Recharts uchun ranglar
  const axisColor  = isDark ? '#474848' : '#E2E6F2'
  const textColor  = isDark ? '#8F95A8' : '#8F95A8'
  const gridColor  = isDark ? '#292A2A' : '#F1F3F9'

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-white">Analitika</h1>
        <div className="flex items-center gap-1 p-1 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-[#F1F3F9] dark:bg-[#222323]">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer transition-colors
                ${period === p.value
                  ? 'bg-white dark:bg-[#2A2B2B] text-[#3F57B3] dark:text-[#7F95E6] shadow-sm'
                  : 'text-[#8F95A8] hover:text-[#3F57B3]'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>


      {/* ── Vazifalar Line Chart ── */}
      <ChartCard title="Vazifalar holati bo'yicha">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <svg className="animate-spin w-6 h-6 text-[#526ED3]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={taskData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="name"
                tick={{ fill: textColor, fontSize: 11 }}
                axisLine={{ stroke: axisColor }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: textColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              <Line
                type="monotone"
                dataKey="value"
                name="Vazifalar"
                stroke={COLORS.primary}
                strokeWidth={2.5}
                dot={{ fill: '#fff', stroke: COLORS.primary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: COLORS.primary }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Quyi qator: Loyihalar + Yig'ilishlar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Loyihalar Bar Chart */}
        <ChartCard title="Loyihalar">
          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <svg className="animate-spin w-6 h-6 text-[#526ED3]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projectData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: textColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: textColor, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip isDark={isDark} />} />
                <Bar dataKey="value" name="Loyihalar" radius={[6, 6, 0, 0]}>
                  {projectData.map((_, i) => (
                    <Cell key={i} fill={PROJECT_COLORS[i % PROJECT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Yig'ilishlar Donut Chart */}
        <ChartCard title="Yig'ilishlar dinamikasi">
          {loading ? (
            <div className="h-56 flex items-center justify-center">
              <svg className="animate-spin w-6 h-6 text-[#526ED3]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie
                    data={meetingData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {meetingData.map((_, i) => (
                      <Cell key={i} fill={MEETING_COLORS[i % MEETING_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip isDark={isDark} />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-col gap-3 flex-1">
                {meetingData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: MEETING_COLORS[i] }} />
                      <span className="text-sm text-[#1A1D2E] dark:text-white">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-[#1A1D2E] dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </div>

 

    </div>
  )
}
