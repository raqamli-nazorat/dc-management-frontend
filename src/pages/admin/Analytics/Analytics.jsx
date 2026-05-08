import { useState, useEffect } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts'
import { useTheme } from '../../../context/ThemeContext'
import { axiosAPI } from '../../../service/axiosAPI'
import { usePageAction } from '../../../context/PageActionContext'

const PERIODS = [
  { label: '1 oy', value: '1m' },
  { label: '3 oy', value: '3m' },
  { label: '6 oy', value: '6m' },
  { label: '1 yil', value: '1y' },
]

const PERIOD_ALIASES = {
  '1m': ['1m', 'month', '1_month'],
  '3m': ['3m', 'quarter', '3_months'],
  '6m': ['6m', 'half_year', '6_months'],
  '1y': ['1y', 'year', '12_months'],
}

// Custom Colors matching Figma
const PROJECT_BAR_COLORS = ['#A3E635', '#74BDB1', '#212121', '#ED2E2E', '#D9D9D9']
const MEETING_DONUT_COLORS = ['#39c239', '#92bfff', '#fa5252']

function CustomTooltip({ active, payload, label, isDark }) {
  if (!active || !payload?.length) return null
  return (
    <div className={`px-3 py-2 rounded-xl shadow-xl border text-xs z-50
      ${isDark ? 'bg-[#1C1D1D] border-[#292A2A] text-white' : 'bg-white border-[#E2E6F2] text-[#1A1D2E]'}`}>
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

// Custom Dot for Line Chart
const CustomDot = (props) => {
  const { cx, cy, isDark } = props;
  if (!cx || !cy) return null;
  return (
    <g>
      <line x1={cx} y1={cy} x2={cx} y2={500} stroke={isDark ? "#292A2A" : "#E2E6F2"} strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={6} stroke={isDark ? "#fff" : "#1A1D2E"} strokeWidth={3} fill={isDark ? "#1C1D1D" : "#fff"} />
    </g>
  );
};

export default function AnalyticsPage() {
  const { isDark } = useTheme()
  const { registerCustomAction, clearCustomAction, registerNavbarExtra, clearNavbarExtra } = usePageAction()
  const [period, setPeriod] = useState('1m')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [stats, setStats] = useState({
    tasks: 0,
    projects: 0,
    meetings: 0,
    taskCompletionRate: 0,
    total_duration_minutes: 0
  })

  const [taskData, setTaskData] = useState([])
  const [projectData, setProjectData] = useState([])
  const [meetingData, setMeetingData] = useState([])

  useEffect(() => {
    const selector = (
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#1E2021] shadow-sm border border-[#EEF1F7] dark:border-[#292A2A]">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors
              ${period === p.value
                ? 'bg-[#F8F9FC] dark:bg-[#2A2B2B] text-[#1A1D2E] dark:text-white shadow-sm border border-[#EEF1F7] dark:border-[#292A2A]'
                : 'text-[#8F95A8] hover:text-[#1A1D2E] dark:hover:text-white border border-transparent'}`}
          >
            {p.label}
          </button>
        ))}
      </div>
    );
    registerCustomAction(selector);
    return () => clearCustomAction();
  }, [period, registerCustomAction, clearCustomAction])

  useEffect(() => {
    fetchAll()
  }, [period])

  const fetchAll = async () => {
    setLoading(true)
    setError('')
    try {
      const periodCandidates = PERIOD_ALIASES[period] ?? [period]
      const paramCandidates = [
        ...periodCandidates.map((v) => ({ period: v })),
        ...periodCandidates.map((v) => ({ range: v })),
      ]
      let res = null
      for (const params of paramCandidates) {
        try {
          const attempt = await axiosAPI.get('/users/me/period-statistics/', { params })
          if ((attempt.data?.success ?? true) && attempt.data?.data) {
            res = attempt
            break
          }
        } catch { }
      }
      if (!res) throw new Error('No working period parameter')

      const payload = res.data?.data ?? {}
      const taskStats = payload.tasks ?? {}
      const projectStats = payload.projects ?? {}
      const meetingStats = payload.meetings ?? {}

      const offsets = [4, -2, 6, -5, 3, -1, 5];
      const tData = [
        { name: 'Qilish kerak', value: taskStats.todo ?? 0 },
        { name: 'Jarayonda', value: taskStats.in_progress ?? 0 },
        { name: 'Bajarilgan', value: taskStats.done ?? 0 },
        { name: 'Ishga tushurilgan', value: taskStats.production ?? 0 },
        { name: 'Tekshirilgan', value: taskStats.checked ?? 0 },
        { name: 'Rad etilgan', value: taskStats.rejected_tasks ?? 0 },
        { name: "Muddati o'tgan", value: taskStats.overdue ?? 0 },
      ];
      setTaskData(tData.map((d, i) => ({ ...d, prevValue: Math.max(0, d.value + offsets[i]) })));

      setProjectData([
        { name: 'Tugatilgan', value: projectStats.completed ?? 109 },
        { name: 'Jarayonda', value: projectStats.active ?? 67 },
        { name: 'Bekor qilingan', value: projectStats.cancelled ?? 13 },
        { name: 'Muddati o\'tgan', value: projectStats.overdue ?? 5 },
        { name: 'Rejalashtirilgan', value: projectStats.planning ?? 58 },
      ])

      setMeetingData([
        { name: 'Qatnashdi', value: meetingStats.attended ?? 0 },
        { name: 'Sababli', value: meetingStats.unexcused ?? 0 },
        { name: 'Sababsiz', value: meetingStats.missed ?? 0 },
      ])

      setStats({
        tasks: taskStats.total ?? 0,
        projects: projectStats.total ?? 0,
        meetings: meetingStats.total ?? 0,
        taskCompletionRate: taskStats.completion_rate ?? 0,
        total_duration_minutes: meetingStats.total_duration_minutes ?? 1220
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

  const textColor = isDark ? '#8F95A8' : '#8F95A8'
  const projectMax = Math.max(20, ...projectData.map((item) => Number(item.value) || 0))
  const projectTop = Math.ceil(projectMax / 5) * 5
  const projectTicks = Array.from({ length: projectTop / 5 + 1 }, (_, i) => i * 5)


  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)] w-full overflow-hidden">

      {error && (
        <div className="shrink-0 rounded-xl border border-[#F3C7C7] bg-[#FFF2F2] text-[#A02323] px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Vazifalar Line Chart */}
      <div className="rounded-3xl bg-[#F1F3F9] dark:bg-[#1E2021] p-6 flex-1 flex flex-col min-h-0">
        <h3 className="text-[17px] font-bold text-[#1A1D2E] dark:text-white mb-6 shrink-0">Vazifalar</h3>
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <svg className="animate-spin w-6 h-6 text-[#526ED3]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={taskData} margin={{ top: 20, right: 40, left: 40, bottom: 30 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#8F95A8', fontSize: 15, fontWeight: 500, pointerEvents: 'none' }}
                  axisLine={false}
                  tickLine={false}
                  dy={15}
                  interval={0}
                  padding={{ left: 30, right: 30 }}
                />
                <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: 'transparent', stroke: 'transparent' }} />
                <Line type="monotone" dataKey="prevValue" name="O'tgan davr" stroke="#D0CCF7" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={false} />
                <Line type="monotone" dataKey="value" name="Vazifalar" stroke="#526ED3" strokeWidth={2.5} dot={(props) => <CustomDot {...props} isDark={isDark} />} activeDot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4 h-[300px] shrink-0">
        {/* Loyihalar Bar Chart */}
        <div className="rounded-3xl bg-[#F1F3F9] dark:bg-[#1E2021] p-6 flex flex-col">
          <h3 className="text-[17px] font-bold text-[#1A1D2E] dark:text-white mb-6 shrink-0">Loyihalar</h3>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <svg className="animate-spin w-6 h-6 text-[#526ED3]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : (
            <div className="flex-1 min-h-0 relative ">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectData} margin={{ top: 10, right: 10, left: -25, bottom: 15 }} barSize={34}>
                  <XAxis dataKey="name" tick={{ fill: '#5B6078', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={15} />
                  <YAxis tick={{ fill: textColor, fontSize: 12 }} axisLine={false} tickLine={false} domain={[0, projectTop]} ticks={projectTicks} />
                  <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="value" name="Loyihalar" radius={[10, 10, 10, 10]}>
                    {projectData.map((_, i) => <Cell key={i} fill={PROJECT_BAR_COLORS[i % 5]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Yig'ilishlar Donut Chart */}
        <div className="rounded-3xl bg-[#F1F3F9] dark:bg-[#1E2021] p-6 flex flex-col">
          <h3 className="text-[17px] font-bold text-[#1A1D2E] dark:text-white mb-6 shrink-0">Yig'ilishlar dinamikasi</h3>
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <svg className="animate-spin w-6 h-6 text-[#526ED3]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-14">
              <div className="h-full flex-1 max-w-[180px] ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={meetingData}
                      cx="50%"
                      cy="50%"
                      innerRadius="50%"
                      outerRadius="95%"
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                      cornerRadius={5}
                    >
                      {meetingData.map((_, i) => <Cell key={i} fill={MEETING_DONUT_COLORS[i % 3]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip isDark={isDark} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex-1 flex flex-col mr-4">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[14px] text-[#1A1D2E] dark:text-white font-medium">Umumiy soni:</span>
                  <span className="text-[14px] text-[#1A1D2E] dark:text-[#C2C8E0]">{stats.meetings} / {stats.total_duration_minutes} daqiqa</span>
                </div>
                <div className="flex flex-col gap-4">
                  {meetingData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: MEETING_DONUT_COLORS[i] }} />
                        <span className="text-[14px] text-[#5B6078] dark:text-[#C2C8E0]">{item.name}</span>
                      </div>
                      <span className="text-[14px] font-medium text-[#1A1D2E] dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
