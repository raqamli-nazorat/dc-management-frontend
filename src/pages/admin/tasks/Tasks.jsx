import { useState, useEffect, useRef, useCallback } from 'react'
import { FaXmark, FaPaperclip } from 'react-icons/fa6'
import { LuFilter, LuLayoutList, LuLayoutGrid } from 'react-icons/lu'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { usePageAction } from '../../../context/PageActionContext'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import TaskRowMenu from './components/TaskRowMenu'
import TaskFilterModal, { TASK_EMPTY_FILTER } from './modals/TaskFilterModal'
import AddTaskModal from './modals/AddTaskModal'
import EditTaskModal from './modals/EditTaskModal'
import EmptyState from '../../../components/EmptyState'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'
import { parseApiError } from '../../../service/parseApiError'

// ── Label maps ──
const TYPE_LABEL = { bug: 'Xato', feature: 'Yangi funksiya', improvement: "Qo'shimcha" }
const PRIORITY_LABEL = { low: 'Past', medium: "O'rta", high: 'Yuqori', critical: 'Kritik' }
const TASK_STATUS_LABEL = {
  todo: 'Bajarilishi kerak',
  in_progress: 'Jarayonda',
  done: 'Bajarilgan',
  production: 'Ishga tushirilgan',
  deployed: 'Ishga tushirilgan',
  checked: 'Tekshirilgan',
  rejected: 'Rad etilgan',
  overdue: "Muddati o'tgan",
  cancelled: 'Bekor qilingan',
}
const fmtTaskDt = (iso) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

// ── Status → Column mapping ──
const STATUS_TO_COL = {
  todo: 'todo',
  in_progress: 'in_progress',
  done: 'done',
  production: 'production',
  deployed: 'deployed',
  checked: 'checked',
  rejected: 'rejected',
  overdue: 'overdue',
  cancelled: 'cancelled',
}

/* ── Columns ── */
const COLUMNS = [
  { id: 'todo', label: 'Bajarilishi kerak', color: '#F59E0B', bg: '#FFF8E1', darkBg: '#2A2310' },
  { id: 'in_progress', label: 'Jarayonda', color: '#3B82F6', bg: '#E3F2FD', darkBg: '#0F1E2E' },
  { id: 'done', label: 'Bajarilgan', color: '#8B5CF6', bg: '#EDE7F6', darkBg: '#1A1228' },
  { id: 'production', label: 'Ishga tushirilgan', color: '#10B981', bg: '#E8F5E9', darkBg: '#0D2018' },
  { id: 'checked', label: 'Tekshirilgan', color: '#06B6D4', bg: '#E0FFF9', darkBg: '#0A1E22' },
  { id: 'rejected', label: 'Rad etilgan', color: '#EF4444', bg: '#FFEBEE', darkBg: '#2A0F0F' },
  { id: 'overdue', label: "Muddati o'tgan", color: '#9CA3AF', bg: '#F5F5F5', darkBg: '#1A1A1A' },
]

// Qaysi ustundan qaysi ustunga o'tish mumkin
const ALLOWED_TRANSITIONS = {
  todo: ['in_progress', 'done'],
  in_progress: ['todo', 'done', 'checked'],
  done: ['in_progress', 'production', 'checked'],
  production: ['rejected', 'checked'],
  checked: ['done', 'production', 'rejected'],
  rejected: [],
  overdue: ['in_progress'],
  cancelled: [],
}

/* ── helpers ── */
const fmtDate = (iso) => {
  if (!iso) return null
  try {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${dd}.${mm}.${yyyy} ${hh}:${min}`
  } catch { return null }
}

const PRIORITY_DOT = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }

/* ── Countdown hook — drag paytida to'xtatiladi ── */
function useCountdown(deadline, paused) {
  const calc = useCallback(() => {
    if (!deadline) return null
    const diff = new Date(deadline) - new Date()
    if (diff <= 0) return null
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }, [deadline])

  const [tick, setTick] = useState(calc)
  useEffect(() => {
    if (!deadline || paused) return
    const id = setInterval(() => setTick(calc()), 1000)
    return () => clearInterval(id)
  }, [deadline, paused, calc])
  return tick
}

/* ── KanbanCard ── */
function KanbanCard({ card, index, onOpen, colColor, isDraggingGlobal }) {
  const now = new Date()
  const deadline = card.deadline ? new Date(card.deadline) : null
  const isOverdue = deadline && deadline < now &&
    card.status !== 'done' && card.status !== 'deployed' && card.status !== 'rejected'

  const assignee = card.assignee_info?.username || '—'
  const position = card.assignee_info?.position || card.position_info?.name || ''

  const estimatedH = card.estimated_minutes ? Math.floor(card.estimated_minutes / 60) : 0
  const estimatedM = card.estimated_minutes ? card.estimated_minutes % 60 : 0
  const durationStr = (estimatedH || estimatedM)
    ? `${estimatedH ? estimatedH + 'h ' : ''}${estimatedM ? estimatedM + 'min' : ''}`.trim()
    : null

  const showCountdown = deadline && !isOverdue &&
    (card.status === 'todo' || card.status === 'in_progress') &&
    (deadline - now) < 86400000
  // drag paytida countdown to'xtatiladi — re-render bo'lmasin
  const countdown = useCountdown(showCountdown ? card.deadline : null, isDraggingGlobal)

  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => !snapshot.isDragging && onOpen(card.id)}
          style={{
            ...provided.draggableProps.style,
            // transition ni drag paytida o'chiramiz — freeze oldini olish
            transition: snapshot.isDragging
              ? provided.draggableProps.style?.transition
              : undefined,
            opacity: snapshot.isDragging ? 0.95 : 1,
            boxShadow: snapshot.isDragging
              ? '0 8px 24px rgba(0,0,0,0.35)'
              : '0 1px 4px rgba(0,0,0,0.12)',
          }}
          className={`w-full shrink-0 rounded-xl bg-white dark:bg-[#252626] select-none cursor-grab active:cursor-grabbing overflow-hidden border
            ${snapshot.isDragging
              ? 'border-[#526ED3] dark:border-[#526ED3]'
              : 'border-[#E8EBF4] dark:border-[#333535]'}`}
        >
          <div className="flex ">
            <div className="flex-1 px-2 py-1.5 flex  h-35 flex-col gap-1.5">

              {/* Title */}
              <p className="text-[11px] font-bold text-[#1A1D2E] dark:text-white leading-snug line-clamp-2">
                {
                  card.title.length > 27 ? `  ${card.title.slice(0, 27)}...` : `   ${card.title.slice(0, 27)}`
                }

              </p>

              {/* UID (flag icon) + reopened_count */}
              <div className="flex  items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B6BCCB" strokeWidth="2" className="shrink-0">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
                  </svg>
                  <span
                    className="text-[10px] cursor-pointer text-[#B6BCCB] font-medium hover:text-[#526ED3] transition-colors"
                    onClick={e => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(card.uid || `T${card.id}`).then(() => {
                        toast.success('Nusxa olindi', card.uid || `T${card.id}`)
                      }).catch(() => {})
                    }}
                    title="Nusxa olish"
                  >{card.uid || `T${card.id}`}</span>
                </div>
                {card.reopened_count > 0 && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <img src="/imgs/tuiIconRedo.svg" alt="redo" className="w-3 h-3" style={{ filter: 'invert(65%) sepia(80%) saturate(600%) hue-rotate(5deg) brightness(105%)' }} />
                    <span className="text-[10px] font-bold text-[#5B6078]">{card.reopened_count}</span>
                  </div>
                )}
              </div>

              {/* Deadline */}
              {deadline && (
                <div className="flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B6BCCB" strokeWidth="2" className="shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <span className={`text-[10px] font-medium ${isOverdue ? 'text-[#EF4444]' : 'text-[#8F95A8]'}`}>
                    {fmtDate(card.deadline)}
                  </span>
                </div>
              )}

              {/* Duration + countdown */}
              {(durationStr || countdown) && (
                <div className="flex items-center gap-2">
                  {durationStr && (
                    <div className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B6BCCB" strokeWidth="2" className="shrink-0">
                        <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                      </svg>
                      <span className="text-[10px] text-[#8F95A8] font-medium">{durationStr}</span>
                    </div>
                  )}
                  {countdown && (
                    <div className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" className="shrink-0">
                        <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                      </svg>
                      <span className="text-[10px] font-bold text-[#EF4444]">{countdown}</span>
                    </div>
                  )}
                </div>
              )}

           <div className='mt-auto'>
               {/* Divider */}
              <div className="border-t  mb-2 border-[#F1F3F9] dark:border-[#333535]" />

              {/* Assignee */}
              <div className="flex  mt-auto  items-center gap-1.5">
                {card.assignee_info?.avatar ? (
                  <img src={card.assignee_info.avatar} alt={assignee}
                    className="w-6 h-6 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#EEF1FB] dark:bg-[#333535] flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8F95A8" strokeWidth="1.8">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#1A1D2E] dark:text-white truncate leading-tight">
                    {assignee}
                  </p>
                  <p className="text-[10px] text-[#8F95A8] truncate leading-tight">
                    {position || 'Dasturchi'}
                  </p>
                </div>
              </div>
           </div>

            </div>


          </div>
        </div>
      )}
    </Draggable>
  )
}

/* ── RejectionModal ── */
function RejectionModal({ task, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [reasonError, setReasonError] = useState(false)
  const [filesError, setFilesError] = useState(false)
  const fileRef = useRef(null)

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setReasonError(true)
      return
    }

    setLoading(true)
    try {
      // 1. Avval status o'zgartirish + sabab
      const res = await axiosAPI.patch(`/tasks/${task.id}/change-status/`, {
        status: 'rejected',
        rejection_reason: reason.trim(),
      })
      // Backenddan kelgan haqiqiy statusni olish
      const actualStatus = res.data?.data?.status ?? res.data?.status ?? 'rejected'

      // 2. Status rejected bo'lgandan keyin fayllarni ketma-ket yuklash
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData()
        fd.append('task', task.id)
        fd.append('file', files[i].file)
        try {
          await axiosAPI.post('/task-rejection-files/', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        } catch (fileErr) {
          const msg = fileErr?.response?.data?.error?.errorMsg
            || fileErr?.response?.data?.detail
            || 'Yuklashda xatolik'
          toast.error(`"${files[i]?.file?.name || 'fayl'}" yuklanmadi`, msg)
        }
      }

      onConfirm(actualStatus)
      toast.success('Rad etildi', 'Vazifa muvaffaqiyatli rad etildi')
    } catch (err) {
      const details = err?.response?.data?.error?.details
      const msg = err?.response?.data?.error?.errorMsg || err?.response?.data?.detail || 'Xatolik yuz berdi'
      if (Array.isArray(details) && details.length > 0) {
        toast.error('Xatolik', details[0])
      } else if (details && typeof details === 'object') {
        const msgs = Object.entries(details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
        toast.error('Xatolik', msgs || msg)
      } else {
        toast.error('Xatolik', msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[520px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111] p-7 flex flex-col gap-5">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] dark:bg-[#292A2A] text-[#5B6078] dark:text-[#C2C8E0] hover:bg-[#E2E6F2] cursor-pointer">
          <FaXmark size={13} />
        </button>

        <div>
          <h2 className="text-[18px] font-extrabold text-[#1A1D2E] dark:text-white">Vazifani rad etish</h2>
          <p className="text-sm text-[#8F95A8] mt-0.5">Rad etish sababini kiriting</p>
        </div>

        {/* Fayllar */}
        <div>
          <div className="flex flex-wrap gap-2 mb-1">
            {files.map((f, i) => (
              <div key={i} className="relative w-16 h-16 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] overflow-hidden bg-[#F8F9FC] dark:bg-[#191A1A] flex items-center justify-center group">
                {f.preview
                  ? <img src={f.preview} alt="" className="w-full h-full object-cover" />
                  : <div className="flex flex-col items-center gap-0.5 px-1">
                    <FaPaperclip size={14} className="text-[#526ED3]" />
                    <span className="text-[8px] text-[#5B6078] truncate w-full text-center">{f.file.name}</span>
                  </div>
                }
                <button type="button" onClick={() => { setFiles(p => p.filter((_, j) => j !== i)); setFilesError(false) }}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer">
                  <FaXmark size={8} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors
                border-[#C2C8E0] dark:border-[#474848] text-[#8F95A8] hover:border-[#526ED3] hover:text-[#526ED3]">
              <FaPaperclip size={14} />
              <span className="text-[9px]">Rasm</span>
            </button>
            <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" className="hidden"
              onChange={e => {
                const added = Array.from(e.target.files || []).map(f => ({
                  file: f,
                  preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
                }))
                setFiles(p => [...p, ...added])
                setFilesError(false)
                e.target.value = ''
              }} />
          </div>
          {filesError && <p className="text-xs text-red-500 mt-0.5">*Kamida bitta fayl yuklang</p>}        </div>

        {/* Sabab */}
        <div>
          <textarea
            value={reason}
            onChange={e => { setReason(e.target.value); if (e.target.value.trim()) setReasonError(false) }}
            placeholder="Sababini yozing..."
            rows={4}
            className={`w-full px-3 py-2.5 rounded-xl text-sm outline-none border resize-none
              bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white placeholder-[#B6BCCB] dark:placeholder-[#474848]
              focus:border-[#526ED3] transition-colors
              ${reasonError ? 'border-red-500 dark:border-red-500' : 'border-[#E2E6F2] dark:border-[#292A2A]'}`}
          />
          {reasonError && <p className="text-xs text-red-500 mt-0.5">*Sabab kiritish majburiy</p>}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={12} /> Bekor qilish
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer bg-[#EF4444] text-white hover:bg-red-600 disabled:opacity-60">
            {loading
              ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
              : <FaPaperclip size={12} />
            }
            Rad etish
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── KanbanColumn ── */
function KanbanColumn({ col, cards, onOpen, isDimmed, isDragTarget, isDraggingGlobal }) {
  const { isDark } = useTheme()
  const colBg = isDark ? col.darkBg : col.bg

  return (
    <div
      className="flex flex-col min-w-0"
      style={{
        flex: '1 1 0',
        opacity: isDimmed ? 0.35 : 1,
        willChange: isDraggingGlobal ? 'opacity' : 'auto',
      }}
    >
      {/* Header */}
      <div className="flex  mb-2 justify-center items-center gap-2 px-1">
        <span className="text-[12px] font-bold text-[#1A1D2E] dark:text-white whitespace-nowrap truncate">{col.label}</span>
        <span
          className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
          style={{ backgroundColor: col.color }}
        >
          {cards.length}
        </span>
      </div>

      {/* Cards area */}
      <Droppable droppableId={col.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="kanban-col-scroll flex flex-col gap-2 rounded-2xl p-1.5 overflow-y-auto"
            style={{
              flex: '1 1 0',
              minHeight: 80,
              backgroundColor: snapshot.isDraggingOver
                ? col.color + '33'
                : colBg,
              outline: isDragTarget ? `2px solid ${col.color}` : 'none',
              outlineOffset: '-2px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {cards.map((card, index) => (
              <KanbanCard
                key={card.id}
                card={card}
                index={index}
                onOpen={onOpen}
                colColor={col.color}
                isDraggingGlobal={isDraggingGlobal}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

/* ── Main Page ── */
export default function TasksPage() {
  const { registerAction, clearAction, registerNavbarExtra, clearNavbarExtra, registerSidebarClick, clearSidebarClick } = usePageAction()
  const { user } = useAuth()
  const activeRole = user?.active_role || user?.roles?.[0]
  const isAuditor = activeRole === 'auditor'
  const isEmployee = activeRole === 'employee'
  const canEdit = activeRole === 'admin' || activeRole === 'superadmin' || activeRole === 'manager'

  const [viewMode, setViewMode] = useState('table')
  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [filters, setFilters] = useState(TASK_EMPTY_FILTER)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [editTask, setEditTask] = useState(null)
  const [taskLoading, setTaskLoading] = useState(false)
  const [cards, setCards] = useState([])
  const [kanbanLoading, setKanbanLoading] = useState(false)
  const [draggingOver, setDraggingOver] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [rejectionPending, setRejectionPending] = useState(null) // { taskId, draggableId, sourceColId }
  const scrollRef = useRef(null)

  const hasFilter = filters.projects?.length > 0 ||
    !!filters.holat || !!filters.daraja || !!filters.turi ||
    !!filters.deadFromD || !!filters.deadToD || filters.myTasks

  const buildParams = useCallback((f = filters, q = search, pg = 1) => {
    const p = { page: pg, page_size: 20 }
    if (q) p.search = q
    if (f.holat) p.status = f.holat
    if (f.daraja) p.priority = f.daraja
    if (f.turi) p.type = f.turi
    if (f.myTasks) p.my_tasks = true
    if (f.projects?.length) p.project = f.projects.map(pr => pr.id || pr).join(',')
    if (f.deadFromD) p.deadline_from = f.deadFromD
    if (f.deadToD) p.deadline_to = f.deadToD
    return p
  }, [filters, search])

  const loadTasks = useCallback(async (f = filters, q = search, pg = 1) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await axiosAPI.get('/tasks/', { params: buildParams(f, q, pg) })
      const payload = res.data?.data ?? res.data
      const results = Array.isArray(payload) ? payload : (payload.results ?? [])
      const next = Array.isArray(payload) ? null : (payload.next ?? null)
      setData(prev => pg === 1 ? results : [...prev, ...results])
      setHasMore(!!next)
      setPage(pg)
    } catch (err) {
      toast.error('Xatolik', err?.response?.data?.detail || "Ma'lumotlarni yuklashda xatolik")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildParams])

  useEffect(() => { loadTasks() }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60 && hasMore && !loadingMore) {
        loadTasks(filters, search, page + 1)
      }
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, page, filters, search])

  const handleSearch = (val) => { setSearch(val); loadTasks(filters, val, 1) }
  const handleApplyFilter = (f) => { setFilters(f); setShowFilter(false); loadTasks(f, search, 1) }

  const handleAdd = async (body) => {
    try {
      const res = await axiosAPI.post('/tasks/', body)
      const created = res.data?.data ?? res.data
      toast.success("Vazifa yaratildi", "Yangi vazifa muvaffaqiyatli qo'shildi")
      return created
    } catch (err) {
      const details = err?.response?.data?.error?.details
      const errorMsg = err?.response?.data?.error?.errorMsg || err?.response?.data?.detail || "Vazifa yaratishda xatolik"
      if (details && typeof details === 'object') {
        const msgs = Object.entries(details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
        toast.error('Xatolik', msgs || errorMsg)
      } else {
        toast.error('Xatolik', errorMsg)
      }
      throw err
    }
  }

  const handleEdit = async (id, body) => {
    try {
      const res = await axiosAPI.patch(`/tasks/${id}/`, body)
      const updated = res.data?.data ?? res.data
      setData(prev => prev.map(t => t.id === id ? { ...updated, id } : t))
      toast.success("Vazifa yangilandi", "O'zgarishlar muvaffaqiyatli saqlandi")
    } catch (err) {
      const details = err?.response?.data?.error?.details
      const errorMsg = err?.response?.data?.error?.errorMsg || err?.response?.data?.detail || "Yangilashda xatolik"
      if (details && typeof details === 'object') {
        const msgs = Object.entries(details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
        toast.error('Xatolik', msgs || errorMsg)
      } else {
        toast.error('Xatolik', errorMsg)
      }
      throw err
    }
  }

  const handleDelete = async (id) => {
    try {
      await axiosAPI.delete(`/tasks/${id}/`)
      setData(prev => prev.filter(t => t.id !== id))
      setCards(prev => prev.filter(c => c.id !== id))
      toast.delete("Vazifa o'chirildi", "Vazifa chiqindi qutisiga yuborildi.")
    } catch (err) {
      const msg = parseApiError(err, "O'chirishda xatolik")
      toast.error('Xatolik', msg)
    }
  }

  // Task ni API dan to'liq yuklash
  const loadTaskDetail = async (id) => {
    setTaskLoading(true)
    try {
      const res = await axiosAPI.get(`/tasks/${id}/`)
      // API: { data: {...task}, error, success } yoki to'g'ridan task object
      const task = res.data?.data ?? res.data

      // project_info object bo'lsa — project ID ni olish
      if (!task.project && task.project_info) {
        if (typeof task.project_info === 'object' && task.project_info?.id) {
          task.project = task.project_info.id
        }
      }
      setEditTask(task)
    } catch (err) {
      const status = err?.response?.status
      if (status === 404) {
        toast.error('Topilmadi', "Bu vazifa mavjud emas yoki o'chirilgan")
        setData(prev => prev.filter(t => t.id !== id))
        setCards(prev => prev.filter(c => c.id !== id))
      } else if (status === 403) {
        toast.error("Ruxsat yo'q", "Bu vazifani ko'rish uchun ruxsatingiz yo'q")
      } else {
        toast.error('Xatolik', "Vazifa ma'lumotlarini yuklashda xatolik")
      }
    } finally {
      setTaskLoading(false)
    }
  }

  // Kanban uchun barcha vazifalarni yuklash (pagination yo'q, ko'proq yuklash)
  const loadKanbanTasks = useCallback(async (f = filters, q = search) => {
    setKanbanLoading(true)
    try {
      const params = { page_size: 200 }
      if (q) params.search = q
      if (f.holat) params.status = f.holat
      if (f.daraja) params.priority = f.daraja
      if (f.turi) params.type = f.turi
      if (f.myTasks) params.my_tasks = true
      if (f.projects?.length) params.project = f.projects.map(pr => pr.id || pr).join(',')
      if (f.deadFromD) params.deadline_from = f.deadFromD
      if (f.deadToD) params.deadline_to = f.deadToD
      const res = await axiosAPI.get('/tasks/', { params })
      const payload = res.data?.data ?? res.data
      const results = Array.isArray(payload) ? payload : (payload.results ?? [])
      setCards(results)
    } catch (err) {
      toast.error('Xatolik', "Kanban ma'lumotlarini yuklashda xatolik")
    } finally {
      setKanbanLoading(false)
    }
  }, [filters, search])
  const switchToTable = () => setViewMode('table')
  const switchToKanban = () => setViewMode('kanban')

  const onDragEnd = async ({ destination, source, draggableId }) => {
    setDraggingOver(null)
    setIsDragging(false)
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId
    const srcStatus = source.droppableId
    const taskId = Number(draggableId)
    const draggedCard = cards.find(c => String(c.id) === String(draggableId))

    // Ruxsat etilgan o'tishlarni tekshirish
    const allowed = ALLOWED_TRANSITIONS[srcStatus] || []
    if (!allowed.includes(newStatus)) {
      toast.error(
        "O'tkazib bo'lmaydi",
        `"${COLUMNS.find(c => c.id === srcStatus)?.label}" dan "${COLUMNS.find(c => c.id === newStatus)?.label}" ga o'tkazib bo'lmaydi`
      )
      return
    }

    // rejected ga tushganda — sabab so'rash
    if (newStatus === 'rejected') {
      setRejectionPending({ taskId, draggableId, sourceColId: srcStatus })
      return
    }

    // Optimistic update
    setCards(prev => prev.map(c => String(c.id) === draggableId ? { ...c, status: newStatus } : c))

    try {
      await axiosAPI.patch(`/tasks/${taskId}/change-status/`, { status: newStatus })
      setData(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
      loadKanbanTasks(filters, search)
    } catch (err) {
      // Rollback
      setCards(prev => prev.map(c => String(c.id) === draggableId ? { ...c, status: srcStatus } : c))
      const errMsg = err?.response?.data?.error?.errorMsg || err?.response?.data?.detail || "Holat yangilashda xatolik"
      const details = err?.response?.data?.error?.details
      if (details) {
        const msgs = Object.entries(details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(', ')
        toast.error('Xatolik', msgs)
      } else {
        toast.error('Xatolik', errMsg)
      }
    }
  }

  const onDragUpdate = ({ destination }) => {
    setDraggingOver(destination?.droppableId || null)
  }

  const onDragStart = () => {
    setIsDragging(true)
  }

  useEffect(() => {
    if (!isAuditor && !isEmployee) {
      registerAction({
        label: "Vazifa qo'shish",
        icon: <img src="/imgs/addProjectIcon.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
        onClick: () => setShowAdd(true),
      })
    }

    if (viewMode === 'kanban') {
      loadKanbanTasks(filters, search)
      registerNavbarExtra(
        <div className="flex items-center gap-3 flex-1">
          <span className="text-[13px] font-medium text-[#5B6078] dark:text-[#C2C8E0]">
            Vazifa boshqaruvi › Vazifalar
          </span>
          <div className="flex-1" />
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8]"
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Izlash" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-[5px] rounded-xl text-[13px] outline-none  w-[200px]
                bg-[#F1F3F9] border border-[#E2E6F2] text-[#8F95A8] placeholder-[#8F95A8] focus:border-[#526ED3]
                dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#C2C8E0]" />
          </div>
          {/* Filter */}
          <button onClick={() => setShowFilter(true)}
            className="relative flex items-center gap-1.5 px-3 py-[5px] rounded-xl text-[13px] font-semibold border  cursor-pointer
              bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078] dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
            <LuFilter size={13} /> Filtrlash
            {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
          </button>
        </div>
      )
      registerSidebarClick(switchToTable)
    } else {
      clearNavbarExtra()
      clearSidebarClick()
    }

    return () => { clearAction(); clearNavbarExtra(); clearSidebarClick() }
  }, [viewMode, search, hasFilter])

  /* ── KANBAN VIEW ── */
  if (viewMode === 'kanban') {
    return (
      <DragDropContext onDragEnd={onDragEnd} onDragUpdate={onDragUpdate} onDragStart={onDragStart}>
        <div
          className="flex flex-col bg-[#F8F9FC] dark:bg-[#191A1A]"
          style={{ height: 'calc(100vh - 57px)' }}
        >
          {kanbanLoading ? (
            <div className="flex items-center justify-center h-full">
              <svg className="animate-spin w-8 h-8 text-[#526ED3]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : (
            <div
              className="flex gap-2 px-3 pt-3 bg-white dark:bg-[#191A1A] pb-3 h-full"
              style={{ overflow: 'hidden' }}
            >
              {COLUMNS.map(col => (
                <KanbanColumn
                  key={col.id}
                  col={col}
                  cards={cards.filter(c => (STATUS_TO_COL[c.status] || c.status) === col.id)}
                  onOpen={loadTaskDetail}
                  isDimmed={isDragging && draggingOver !== null && draggingOver !== col.id}
                  isDragTarget={draggingOver === col.id}
                  isDraggingGlobal={isDragging}
                />
              ))}
            </div>
          )}
        </div>

        {showFilter && (
          <TaskFilterModal initial={filters} onClose={() => setShowFilter(false)}
            onApply={(f) => { setFilters(f); setShowFilter(false); loadKanbanTasks(f, search) }} />
        )}
        {showAdd && (
          <AddTaskModal onClose={() => setShowAdd(false)} onAdd={async (body) => {
            const created = await handleAdd(body)
            loadKanbanTasks(filters, search)
            return created
          }} />
        )}
        {editTask && (
          <EditTaskModal
            task={editTask}
            canEdit={canEdit}
            onClose={() => setEditTask(null)}
            onSave={async (id, body) => {
              if (!canEdit) return
              await handleEdit(id, body)
              loadKanbanTasks(filters, search)
            }}
            onDelete={canEdit ? async () => {
              await handleDelete(editTask.id)
              setEditTask(null)
            } : undefined}
          />
        )}
        {rejectionPending && (
          <RejectionModal
            task={{ id: rejectionPending.taskId }}
            onClose={() => setRejectionPending(null)}
            onConfirm={(actualStatus) => {
              setCards(prev => prev.map(c =>
                String(c.id) === String(rejectionPending.draggableId)
                  ? { ...c, status: actualStatus }
                  : c
              ))
              setData(prev => prev.map(t =>
                t.id === rejectionPending.taskId
                  ? { ...t, status: actualStatus }
                  : t
              ))
              setRejectionPending(null)
              loadKanbanTasks(filters, search)
            }}
          />
        )}
        {taskLoading && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30">
            <svg className="animate-spin w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          </div>
        )}
      </DragDropContext>
    )
  }

  /* ── TABLE VIEW ── */
  return (
    <div className="flex flex-col h-full gap-4">

      <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-white">Vazifalar</h1>

      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#C2C8E0]"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Izlash" value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none  w-[200px]
              bg-[#F1F3F9] border border-[#E2E6F2] text-[#1A1D2E] placeholder-[#5B6078] focus:border-[#526ED3]
              dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#5B6078]" />
        </div>
        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border  cursor-pointer
            bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078] dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
          <LuFilter size={13} /> Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
        </button>
        <div className="ml-auto flex items-center gap-1 p-1 rounded-xl border border-[#E2E6F2] bg-[#F1F3F9] dark:bg-[#222323] dark:border-[#474848]">
          <button className="p-1.5 rounded-lg bg-white dark:bg-[#2A2B2B] text-[#3F57B3] dark:text-[#7F95E6] shadow-sm cursor-pointer">
            <LuLayoutList size={16} />
          </button>
          <button onClick={switchToKanban}
            className="p-1.5 rounded-lg  cursor-pointer text-[#8F95A8] dark:text-[#C2C8E0] hover:text-[#3F57B3]">
            <LuLayoutGrid size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="overflow-auto h-[70vh]">
        <table className="w-full  text-sm whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[#222323]">
            <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">№</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Nomi</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Loyiha</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Yaratuvchi</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Topshiruvchi
                </span>
              </th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Turi</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Darajasi</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Holati</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Muddati</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className=''>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#EEF1F7] dark:border-[#292A2A]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(j => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded-lg bg-[#EEF1F7] dark:bg-[#292A2A] animate-pulse" style={{ width: j === 1 ? 32 : '80%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              data.map((t, idx) => (
                <tr key={t.id}
                  onClick={() => loadTaskDetail(t.id)}
                  className="border-b border-[#EEF1F7] dark:border-[#292A2A] last:border-0 hover:bg-black/2 dark:hover:bg-white/2  cursor-pointer">
                  <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0] text-xs font-medium">{t.uid || idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{t.title || t.name}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{typeof t.project_info === 'object' ? t.project_info?.title : (t.project_info || t.project || '—')}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.created_by_info?.username || t.creator || '—'}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.assignee_info?.username || t.assignee || '—'}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{TYPE_LABEL[t.type] || t.type || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#1A1D2E] dark:text-white">{PRIORITY_LABEL[t.priority] || t.level || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#1A1D2E] dark:text-white">{TASK_STATUS_LABEL[t.status] || t.status || '—'}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{fmtTaskDt(t.deadline)}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {!isAuditor && canEdit && (
                      <TaskRowMenu
                        onEdit={() => loadTaskDetail(t.id)}
                        onDelete={() => handleDelete(t.id)}
                      />
                    )}
                    {!isAuditor && !canEdit && (
                      <TaskRowMenu
                        onDelete={() => handleDelete(t.id)}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && data.length === 0 && (
          <EmptyState
            icon="/imgs/vazifalarIcon.svg"
            title="Vazifalar topilmadi"
            description="Yangi vazifa yarating yoki filtrlarni tekshiring"
          />
        )}
        {loadingMore && (
          <div className="py-4 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">
            <svg className="animate-spin inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Yuklanmoqda...
          </div>
        )}
      </div>

      {showFilter && (
        <TaskFilterModal initial={filters} onClose={() => setShowFilter(false)}
          onApply={handleApplyFilter} />
      )}
      {showAdd && (
        <AddTaskModal onClose={() => setShowAdd(false)} onAdd={async (body) => {
          const created = await handleAdd(body)
          loadTasks(filters, search, 1)
          return created
        }} />
      )}
      {editTask && (
        <EditTaskModal
          task={editTask}
          canEdit={canEdit}
          onClose={() => setEditTask(null)}
          onSave={async (id, body) => {
            if (!canEdit) return
            await handleEdit(id, body)
            loadTasks(filters, search, 1)
          }}
          onDelete={canEdit ? async () => {
            await handleDelete(editTask.id)
            setEditTask(null)
          } : undefined}
        />
      )}

      {taskLoading && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30">
          <svg className="animate-spin w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      )}

    </div>
  )
}
