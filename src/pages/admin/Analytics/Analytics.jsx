import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList
} from 'recharts'
import { useTheme } from '../../../context/ThemeContext'
import { axiosAPI } from '../../../service/axiosAPI'
import { usePageAction } from '../../../context/PageActionContext'

/* ── Konstantalar ─────────────────────────────────────────── */
const PERIODS = [
  { label: '1 oy', value: 1 },
  { label: '3 oy', value: 3 },
  { label: '6 oy', value: 6 },
  { label: '1 yil', value: 12 },
]

// Figma rang kodlari — loyihalar bar chart
const PROJECT_COLORS = {
  completed: '#99CC00',  // Tugatilgan — yashil
  active: '#82C0C0',  // Jarayonda  — teal
  cancelled: '#D2D8EC',  // Bekor      — kulrang-ko'k
  overdue: '#EF161E',  // Muddati    — qizil
  planning: '#D8D8D8',  // Rejalashtirilgan — och kulrang
}
const PROJECT_COLOR_LIST = Object.values(PROJECT_COLORS)

// Figma rang kodlari — yig'ilishlar donut
const MEETING_COLORS = ['#2DBE2C', '#92BFFF', '#FA5252']

// Grid chiziq rangi
const GRID_COLOR = '#E8EAF0'

/* ── Tooltip ──────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null
  return (
    <div className={`px-3 py-2 rounded-xl shadow-xl border text-xs z-50
      ${isDark ? 'bg-[#1C1D1D] border-[#292A2A] text-white' : 'bg-[var(--bg-base)] border-[#E8EAF0] text-[#1A1D2E]'}`}>
      {label && <p className="font-semibold mb-1 text-[#8F95A8]">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span>{p.name}: <span className="font-bold">{p.value}</span></span>
        </div>
      ))}
    </div>
  )
}

/* ── Line chart dot: oq ichli, qora bordyurli ─────────────── */
const CustomDot = (props) => {
  const { cx, cy, isDark } = props
  if (cx == null || cy == null) return null
  return (
    <circle
      cx={cx} cy={cy} r={6}
      stroke={isDark ? '#ffffff' : '#000000'}
      strokeWidth={2.5}
      fill={isDark ? '#1E2021' : '#ffffff'}
    />
  )
}

/* ── Bar shape: 0 bo'lsa ham minimal balandlik, yuqori yumaloq ── */
const RoundedBar = (props) => {
  const { x, y, width, height, index } = props
  const MIN_H = 6
  const r = 8
  const h = Math.max(height || 0, MIN_H)
  const ay = (y + (height || 0)) - h
  const fill = PROJECT_COLOR_LIST[index % PROJECT_COLOR_LIST.length]
  return (
    <path
      d={`M${x + r},${ay} h${width - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - r} h${-(width)} v${-(h - r)} a${r},${r} 0 0 1 ${r},${-r}z`}
      fill={fill}
    />
  )
}

/* ── Spinner ──────────────────────────────────────────────── */
const Spinner = () => (
  <div className="flex-1 flex items-center justify-center">
    <svg className="animate-spin w-6 h-6 text-[#3B4FC4]" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  </div>
)

/* ── YAxis ticks hisoblash ────────────────────────────────── */
function calcYTicks(data, fixedMax) {
  if (fixedMax) {
    // 0, 25, 50, 75, 100
    const step = fixedMax / 4
    return {
      domain: [0, fixedMax],
      ticks: Array.from({ length: 5 }, (_, i) => i * step),
    }
  }
  const maxVal = Math.max(0, ...data.map(d => Number(d.value) || 0))
  if (maxVal === 0) return { domain: [0, 5], ticks: [0, 1, 2, 3, 4, 5] }
  const rawStep = maxVal / 4
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  let step = magnitude
  for (const ns of [1, 2, 5, 10]) {
    if (ns * magnitude >= rawStep) { step = ns * magnitude; break }
  }
  const top = Math.ceil(maxVal / step) * step
  return {
    domain: [0, top],
    ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step),
  }
}

/* ══════════════════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const { isDark } = useTheme()
  const { registerCustomAction, clearCustomAction } = usePageAction()
  const [period, setPeriod] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [stats, setStats] = useState({
    tasks: 0, projects: 0, meetings: 0,
    taskCompletionRate: 0, total_duration_minutes: 0,
  })
  const [taskData, setTaskData] = useState([])
  const [projectData, setProjectData] = useState([])
  const [meetingData, setMeetingData] = useState([])

  /* ── Navbar period selector ── */
  useEffect(() => {
    const selector = (
      <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] shadow-sm border border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
        {PERIODS.map(p => (
          <button key={p.value} onClick={() => setPeriod(p.value)}
            className={`px-4 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors
              ${period === p.value
                ? 'bg-[#F8F9FC] dark:bg-[var(--bg-elevation-2)] text-[#1A1D2E] dark:text-[var(--text-strong)] shadow-sm border border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]'
                : 'text-[#8F95A8] hover:text-[#1A1D2E] dark:hover:text-white border border-transparent'}`}>
            {p.label}
          </button>
        ))}
      </div>
    )
    registerCustomAction(selector)
    return () => clearCustomAction()
  }, [period, registerCustomAction, clearCustomAction])

  useEffect(() => { fetchAll() }, [period])

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await axiosAPI.get('/users/me/period-statistics/', { params: { months: period } })
      const payload = res.data?.data ?? {}
      const taskStats = payload.tasks ?? {}
      const projectStats = payload.projects ?? {}
      const meetingStats = payload.meetings ?? {}

      // Vazifalar — line chart (prevValue = o'tgan davr simulyatsiyasi)
      const offsets = [4, -2, 6, -5, 3, -1, 5]
      const tData = [
        { name: 'Qilish kerak', value: taskStats.todo ?? 0 },
        { name: 'Jarayonda', value: taskStats.in_progress ?? 0 },
        { name: 'Bajarilgan', value: taskStats.done ?? 0 },
        { name: 'Ishga tushurilgan', value: taskStats.production ?? 0 },
        { name: 'Tekshirilgan', value: taskStats.checked ?? 0 },
        { name: 'Rad etilgan', value: taskStats.rejected_tasks ?? 0 },
        { name: "Muddati o'tgan", value: taskStats.overdue ?? 0 },
      ]
      setTaskData(tData.map((d, i) => ({ ...d, prevValue: Math.max(0, d.value + offsets[i]) })))

      // Loyihalar — bar chart
      setProjectData([
        { name: 'Tugatilgan', value: projectStats.completed ?? 0 },
        { name: 'Jarayonda', value: projectStats.active ?? 0 },
        { name: 'Bekor', value: projectStats.cancelled ?? 0 },
        { name: 'Muddati', value: projectStats.overdue ?? 0 },
        { name: 'Rejalashtirilgan', value: projectStats.planning ?? 0 },
      ])

      // Yig'ilishlar — donut
      setMeetingData([
        { name: 'Qatnashdi', value: meetingStats.attended ?? 0 },
        { name: 'Sababli', value: meetingStats.with_reason ?? 0 },
        { name: 'Sababsiz', value: meetingStats.unexcused ?? 0 },
      ])

      setStats({
        tasks: taskStats.total ?? 0,
        projects: projectStats.total ?? 0,
        meetings: meetingStats.total ?? 0,
        taskCompletionRate: taskStats.completion_rate ?? 0,
        total_duration_minutes: meetingStats.total_duration_minutes ?? 0,
        unique_participants: meetingStats.unique_participants ?? 0,
        unique_meetings: meetingStats.unique_meetings ?? 0,
      })
    } catch {
      setError("Analitika ma'lumotlarini yuklab bo'lmadi")
      setTaskData([])
      setProjectData([])
      setMeetingData([])
    } finally {
      setLoading(false)
    }
  }

  // Loyihalar YAxis — real dataga moslashgan, lekin minimum 20 gacha
  const prjMaxVal = Math.max(20, ...projectData.map(d => Number(d.value) || 0))
  const prjStep = prjMaxVal <= 20 ? 5 : prjMaxVal <= 50 ? 10 : 25
  const prjTop = Math.ceil(prjMaxVal / prjStep) * prjStep
  const prjTicks = Array.from({ length: Math.floor(prjTop / prjStep) + 1 }, (_, i) => i * prjStep)
  const prjDomain = [0, prjTop]

  // Vazifalar YAxis — real dataga moslashgan, step 5, minimum 15
  const taskMaxVal = Math.max(20, ...taskData.map(d => Math.max(d.value || 0, d.prevValue || 0)))
  const taskStep = taskMaxVal <= 25 ? 5 : taskMaxVal <= 50 ? 10 : taskMaxVal <= 100 ? 25 : 50
  const taskTop = Math.ceil(taskMaxVal / taskStep) * taskStep
  const taskTicks = Array.from({ length: Math.floor(taskTop / taskStep) + 1 }, (_, i) => i * taskStep)
  const taskDomain = [0, taskTop]

  const axisColor = isDark ? '#4A4F5E' : '#8F95A8'
  const gridColor = isDark ? '#2A2B2B' : GRID_COLOR

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)] w-full overflow-hidden">

      {error && (
        <div className="shrink-0 rounded-xl border border-[#F3C7C7] bg-[#FFF2F2] text-[#A02323] px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ── Vazifalar Line Chart ── */}
      <div className="rounded-3xl bg-[#F1F3F9] dark:bg-[var(--bg-elevation-1)] p-6 flex-1 flex flex-col min-h-0">
        <h3 className="text-[17px] font-bold text-[#1A1D2E] dark:text-[var(--text-strong)] mb-4 shrink-0">Vazifalar</h3>
        {loading ? <Spinner /> : (
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={taskData} margin={{ top: 16, right: 32, left: 8, bottom: 28 }}>

                {/* Faqat horizontal grid chiziqlar */}
                <CartesianGrid
                  horizontal={true}
                  vertical={false}
                  stroke={gridColor}
                  strokeWidth={1}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fill: axisColor, fontSize: 13, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={14}
                  interval={0}
                  padding={{ left: 30, right: 30 }}
                />

                <YAxis
                  domain={taskDomain}
                  ticks={taskTicks}
                  tick={{ fill: axisColor, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={36}
                />

                <Tooltip
                  content={<CustomTooltip isDark={isDark} />}
                  cursor={{ stroke: gridColor, strokeWidth: 1 }}
                />

                {/* O'tgan davr — nuqtali och ko'k */}
                <Line
                  type="monotone"
                  dataKey="prevValue"
                  name="O'tgan davr"
                  stroke={isDark ? '#4A5080' : '#B0B8E8'}
                  strokeWidth={1.5}
                  strokeDasharray="6 4"
                  dot={false}
                  activeDot={false}
                />

                {/* Joriy davr — qattiq ko'k #3B4FC4 */}
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Vazifalar"
                  stroke="#3B4FC4"
                  strokeWidth={2.5}
                  dot={(props) => <CustomDot {...props} isDark={isDark} />}
                  activeDot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-2 gap-4 h-[300px] shrink-0">

        {/* Loyihalar Bar Chart */}
        <div className="rounded-3xl bg-[#F1F3F9] dark:bg-[var(--bg-elevation-1)] p-6 flex flex-col">
          <h3 className="text-[17px] font-bold text-[#1A1D2E] dark:text-[var(--text-strong)] mb-4 shrink-0">Loyihalar</h3>
          {loading ? <Spinner /> : (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={projectData}
                  margin={{ top: 20, right: 8, left: -10, bottom: 14 }}
                  barSize={32}
                >
                  {/* Faqat horizontal grid */}
                  <CartesianGrid
                    horizontal={true}
                    vertical={false}
                    stroke={gridColor}
                    strokeWidth={1}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fill: axisColor, fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    dy={12}
                  />

                  <YAxis
                    domain={prjDomain}
                    ticks={prjTicks}
                    tick={{ fill: axisColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={35}
                  />

                  <Tooltip
                    content={<CustomTooltip isDark={isDark} />}
                    cursor={{ fill: 'transparent' }}
                  />

                  <Bar dataKey="value" name="Loyihalar" shape={<RoundedBar />} radius={[8, 8, 0, 0]}>

                    {projectData.map((_, i) => (
                      <Cell key={i} fill={PROJECT_COLOR_LIST[i % PROJECT_COLOR_LIST.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Yig'ilishlar Donut Chart */}
        <div className="rounded-3xl bg-[#F1F3F9] dark:bg-[var(--bg-elevation-1)] p-6 flex flex-col">
          <h3 className="text-[17px] font-bold text-[#1A1D2E] dark:text-[var(--text-strong)] mb-4 shrink-0">Yig'ilishlar dinamikasi</h3>
          {loading ? <Spinner /> : (
            <div className="flex-1 flex items-center gap-6">

              {/* Donut */}
              <div className="h-full flex-shrink-0" style={{ width: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        meetingData.every(d => d.value === 0)
                          ? meetingData.map(d => ({ ...d, value: 1 }))
                          : meetingData
                      }
                      cx="50%" cy="50%"
                      innerRadius="48%" outerRadius="90%"
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                      cornerRadius={4}
                    >
                      {meetingData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            meetingData.every(d => d.value === 0)
                              ? (isDark ? '#2A2B2B' : '#E8EAF0')
                              : MEETING_COLORS[i % MEETING_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip isDark={isDark} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex-1 flex flex-col gap-1 min-w-0">
                {/* Umumiy */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-[500] text-[#000000] dark:text-[var(--text-sub)]">Umumiy soni:</span>
                  <span className="text-[13px] font-semibold text-[#1A1D2E] dark:text-[var(--text-strong)]">
                    {stats.meetings} / {stats.total_duration_minutes} daqiqa
                  </span>
                </div>

                {/* Har bir qator */}
                {meetingData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-[#E8EAF0] dark:border-[var(--stroke-soft)] last:border-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: MEETING_COLORS[i] }}
                      />
                      <span className="text-[13px] text-[#000000] dark:text-[var(--text-sub)]">{item.name}</span>
                    </div>
                    {i === 0 ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-[#1A1D2E] dark:text-[var(--text-strong)]">{stats.unique_participants}</span>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14.6489 13.125C13.792 11.6211 12.4539 10.4493 10.8502 9.79817C11.6477 9.2 12.2368 8.36606 12.5341 7.41446C12.8313 6.46287 12.8217 5.44187 12.5064 4.49609C12.1911 3.5503 11.5863 2.72769 10.7775 2.14477C9.96876 1.56185 8.99709 1.24817 8.00015 1.24817C7.00321 1.24817 6.03154 1.56185 5.22278 2.14477C4.41402 2.72769 3.80917 3.5503 3.4939 4.49609C3.17864 5.44187 3.16895 6.46287 3.46621 7.41446C3.76347 8.36606 4.3526 9.2 5.15015 9.79817C3.54635 10.4493 2.2083 11.6211 1.3514 13.125C1.2983 13.2104 1.26291 13.3056 1.24734 13.4049C1.23176 13.5043 1.23631 13.6057 1.26073 13.7032C1.28514 13.8008 1.32891 13.8924 1.38944 13.9727C1.44997 14.0529 1.52603 14.1202 1.61308 14.1705C1.70014 14.2208 1.79642 14.2531 1.8962 14.2655C1.99598 14.2778 2.09722 14.27 2.19391 14.2424C2.2906 14.2148 2.38076 14.1681 2.45903 14.105C2.5373 14.0419 2.60208 13.9637 2.64952 13.875C3.78203 11.9175 5.78203 10.75 8.00015 10.75C10.2183 10.75 12.2183 11.9182 13.3508 13.875C13.4536 14.0404 13.6167 14.1592 13.8056 14.2065C13.9944 14.2538 14.1943 14.2258 14.3629 14.1284C14.5314 14.031 14.6555 13.8718 14.7089 13.6846C14.7623 13.4974 14.7408 13.2967 14.6489 13.125ZM4.75015 6.00004C4.75015 5.35725 4.94076 4.7289 5.29787 4.19444C5.65499 3.65998 6.16257 3.24342 6.75643 2.99744C7.35029 2.75145 8.00376 2.68709 8.63419 2.81249C9.26463 2.93789 9.84373 3.24743 10.2982 3.70195C10.7528 4.15647 11.0623 4.73556 11.1877 5.366C11.3131 5.99644 11.2487 6.64991 11.0028 7.24376C10.7568 7.83762 10.3402 8.34521 9.80575 8.70232C9.27129 9.05943 8.64294 9.25004 8.00015 9.25004C7.1385 9.24905 6.31243 8.90632 5.70315 8.29704C5.09387 7.68777 4.75114 6.86169 4.75015 6.00004Z" fill="#2DBE2C" />
                          </svg>

                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-bold text-[#1A1D2E] dark:text-[var(--text-strong)]">{stats.unique_meetings}</span>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g clip-path="url(#clip0_2508_364956)">
                              <path d="M0.833008 4.66669C0.833008 3.28598 1.9523 2.16669 3.33301 2.16669C4.71372 2.16669 5.83301 3.28598 5.83301 4.66669C5.83301 6.0474 4.71372 7.16669 3.33301 7.16669C1.9523 7.16669 0.833008 6.0474 0.833008 4.66669Z" fill="#526ED3" />
                              <path d="M2.16699 12C2.16699 10.2511 3.58476 8.83331 5.33366 8.83331C7.08256 8.83331 8.50033 10.2511 8.50033 12C8.50033 13.7489 7.08256 15.1666 5.33366 15.1666C3.58476 15.1666 2.16699 13.7489 2.16699 12Z" fill="#526ED3" />
                              <path d="M7.5 4.66665C7.5 2.54955 9.21624 0.833313 11.3333 0.833313C13.4504 0.833313 15.1667 2.54955 15.1667 4.66665C15.1667 6.78374 13.4504 8.49998 11.3333 8.49998C9.21624 8.49998 7.5 6.78374 7.5 4.66665Z" fill="#526ED3" />
                            </g>
                            <defs>
                              <clipPath id="clip0_2508_364956">
                                <rect width="16" height="16" fill="white" />
                              </clipPath>
                            </defs>
                          </svg>

                        </div>
                      </div>
                    ) : (
                      <span className="text-[14px] font-bold text-[#1A1D2E] dark:text-[var(--text-strong)]">{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
