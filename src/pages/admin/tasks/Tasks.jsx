import { useState, useEffect, useRef, useCallback } from 'react'
import { FaXmark, FaPaperclip } from 'react-icons/fa6'
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
const TYPE_LABEL = { bug: 'Xatolik (Bug)', feature: 'Yangi funksiya', extra: "Qo'shimcha", improvement: "Qo'shimcha", research: "Tadqiqot/O'rganish" }
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
  todo: ['in_progress'],
  in_progress: ['done'],
  done: ['production'],
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
            zIndex: snapshot.isDragging ? 9999 : 'auto',
            boxShadow: snapshot.isDragging
              ? '0 8px 24px rgba(0,0,0,0.35)'
              : '0 1px 4px rgba(0,0,0,0.12)',
          }}
          className={`w-full shrink-0 rounded-xl bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-2)] select-none cursor-grab active:cursor-grabbing overflow-hidden border
            ${snapshot.isDragging
              ? 'border-[var(--accent-sub)] dark:border-[var(--accent-sub)]'
              : 'border-[#E8EBF4] dark:border-[#333535]'}`}
        >
          <div className="flex ">
            <div className="flex-1 px-2 py-1.5 flex    h-40 flex-col gap-1.5">

              {/* Title — har doim 2 qator balandlik, matn oshsa kesiladi */}
              <p className="w-full text-[13px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] leading-snug line-clamp-2"
                style={{ minHeight: 'calc(1.25em * 2)' }}
                title={card.title || ''}>
                {card.title}
              </p>

              {/* UID (flag icon) + reopened_count */}
              <div className="flex  items-center relative justify-between gap-1">
                <div className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M1.94048 0.379342C2.4338 0.174378 3.151 0 4.15625 0C5.23407 0 6.12464 0.370484 6.85083 0.67258C6.86665 0.679161 6.88239 0.685709 6.89805 0.692221C7.66714 1.01194 8.26531 1.25037 8.96875 1.25037C9.76797 1.25037 10.2538 1.11224 10.5124 1.00466C10.6427 0.950482 10.72 0.902155 10.7543 0.878337C10.7632 0.872212 10.7693 0.867595 10.773 0.864778C11.0204 0.630029 11.3834 0.559762 11.7021 0.688171C12.0332 0.821599 12.25 1.14278 12.25 1.49975L12.25 9.00025C12.25 9.22648 12.1624 9.44391 12.0055 9.60693L11.375 9.00025C12.0055 9.60693 12.0051 9.6074 12.0046 9.60786L12.0037 9.60881L12.0018 9.61074L11.9979 9.61477L11.9892 9.62346C11.9831 9.62954 11.9763 9.63617 11.9687 9.64331C11.9536 9.65759 11.9356 9.6739 11.9146 9.6919C11.8725 9.72792 11.8184 9.77057 11.7511 9.81717C11.6162 9.9106 11.4302 10.0186 11.1845 10.1207C10.6912 10.3256 9.974 10.5 8.96875 10.5C7.89093 10.5 7.00036 10.1295 6.27418 9.82742C6.25836 9.82084 6.24261 9.81429 6.22695 9.80778C5.45786 9.48806 4.85969 9.24963 4.15625 9.24963C3.35982 9.24963 2.87459 9.3868 2.61529 9.49421C2.62168 9.53688 2.625 9.58055 2.625 9.625L2.625 13.125C2.625 13.6082 2.23325 14 1.75 14C1.26675 14 0.875 13.6082 0.875 13.125L0.875 9.625C0.875 9.51484 0.895357 9.40943 0.932515 9.31234C0.895138 9.2145 0.875 9.10904 0.875 9.00025L0.875 1.49975C0.875 1.27352 0.96262 1.05609 1.11947 0.893068L1.75 1.49975C1.11947 0.893068 1.11992 0.892604 1.12037 0.892137L1.12128 0.891192L1.12316 0.889261L1.1271 0.885235L1.13577 0.876539C1.14191 0.870461 1.14874 0.86383 1.1563 0.85669C1.17142 0.842407 1.18941 0.826097 1.21045 0.808098C1.25254 0.772077 1.30663 0.729427 1.37391 0.682828C1.5088 0.589399 1.69475 0.481437 1.94048 0.379342ZM2.625 1.99003L2.625 7.66161C3.0382 7.56449 3.5438 7.49963 4.15625 7.49963C5.2347 7.49963 6.12559 7.87023 6.85198 8.17241C6.86763 8.17892 6.88321 8.1854 6.89871 8.19185C7.66792 8.51161 8.2658 8.75 8.96875 8.75C9.75533 8.75 10.2383 8.61655 10.5 8.50997L10.5 2.83839C10.0868 2.93551 9.5812 3.00037 8.96875 3.00037C7.8903 3.00037 6.99941 2.62977 6.27302 2.32759C6.25737 2.32108 6.24179 2.3146 6.22629 2.30815C5.45708 1.98839 4.8592 1.75 4.15625 1.75C3.36967 1.75 2.88668 1.88345 2.625 1.99003Z" fill="#9AA1B5" />
                  </svg>

                  <span
                    className="text-[11px] cursor-pointer text-[var(--text-strong)] dark:text-[var(--text-sub)] font-medium hover:text-[var(--accent-sub)] transition-colors"
                    onClick={e => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(card.uid || `T${card.id}`).then(() => {
                        toast.success('Nusxa olindi', card.uid || `T${card.id}`)
                      }).catch(() => { })
                    }}
                    title="Nusxa olish"
                  >{card.uid || `T${card.id}`}</span>
                </div>
                {card.reopened_count > 0 && (
                  <div className="flex items-center top-0 right-3 absolute gap-0.5 shrink-0">
                    <img src="/imgs/tuiIconRedo.svg" alt="redo" className="w-3 h-3" style={{ filter: 'invert(65%) sepia(80%) saturate(600%) hue-rotate(5deg) brightness(105%)' }} />
                    <span className="text-[11px]  dark:text-[var(--text-sub)]  font-bold text-[var(--text-sub)]">{card.reopened_count}</span>
                  </div>
                )}
              </div>

              {/* Deadline */}
              {deadline && (
                <div className="flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M4.375 0C4.85825 0 5.25 0.391751 5.25 0.875V1.75L8.75 1.75V0.875C8.75 0.391751 9.14175 0 9.625 0C10.1082 0 10.5 0.391751 10.5 0.875V1.75H11.0836C12.2109 1.75 13.125 2.66413 13.125 3.79138L13.125 11.9586C13.125 13.0859 12.2109 14 11.0836 14L2.91637 14C1.78913 14 0.875 13.0859 0.875 11.9586L0.875 3.79138C0.875 2.66413 1.78913 1.75 2.91637 1.75L3.5 1.75L3.5 0.875C3.5 0.391751 3.89175 0 4.375 0ZM3.54969 3.5H2.91637C2.75562 3.5 2.625 3.63062 2.625 3.79138L2.625 5.25L11.375 5.25V3.79138C11.375 3.63062 11.2444 3.5 11.0836 3.5L10.4503 3.5C10.3303 3.84 10.0061 4.08362 9.625 4.08362C9.24391 4.08362 8.91972 3.84 8.79969 3.5L5.20031 3.5C5.08028 3.84 4.75609 4.08362 4.375 4.08362C3.99391 4.08362 3.66972 3.84 3.54969 3.5ZM11.375 7L2.625 7L2.625 11.9586C2.625 12.1194 2.75562 12.25 2.91637 12.25L11.0836 12.25C11.2444 12.25 11.375 12.1194 11.375 11.9586L11.375 7Z" fill="#9AA1B5" />
                  </svg>

                  <span className={`text-[11px] dark:text-[var(--text-sub)]  font-medium ${isOverdue ? 'text-[#EF4444]' : 'text-[var(--text-strong)]'}`}>
                    {fmtDate(card.deadline)}
                  </span>
                </div>
              )}

              {/* Duration + countdown */}
              {(durationStr || countdown) && (
                <div className="flex items-center gap-2">
                  {durationStr && (
                    <div className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clip-path="url(#clip0_928_475044)">
                          <path fill-rule="evenodd" clip-rule="evenodd" d="M6.98926 0.292006C7.87708 0.281132 8.75864 0.447081 9.58203 0.77931C10.4053 1.11149 11.1545 1.60371 11.7861 2.22755C12.4177 2.85147 12.9194 3.5949 13.2617 4.41408C13.604 5.23335 13.7803 6.11309 13.7803 7.00099C13.7802 7.88874 13.604 8.7678 13.2617 9.58693C12.9194 10.4061 12.4178 11.1495 11.7861 11.7735C11.1545 12.3973 10.4053 12.8895 9.58203 13.2217C8.75863 13.5539 7.87709 13.7199 6.98926 13.709C5.22454 13.6873 3.53911 12.9704 2.29883 11.7149C1.05874 10.4593 0.363401 8.76569 0.363281 7.00099C0.363281 5.23611 1.05861 3.54179 2.29883 2.28615C3.53911 1.03058 5.22454 0.313731 6.98926 0.292006ZM7.01074 2.04201C5.70639 2.05808 4.46068 2.58761 3.54395 3.51564C2.62715 4.44375 2.11328 5.69641 2.11328 7.00099C2.1134 8.30539 2.62727 9.55736 3.54395 10.4854C4.46068 11.4134 5.70638 11.9429 7.01074 11.959C7.66698 11.967 8.31912 11.8442 8.92773 11.5986C9.53613 11.3531 10.0899 10.9894 10.5566 10.5283C11.0235 10.0671 11.3945 9.51768 11.6475 8.91212C11.9004 8.30674 12.0302 7.65708 12.0303 7.00099C12.0303 6.34472 11.9005 5.69442 11.6475 5.08888C11.3945 4.48332 11.0235 3.93388 10.5566 3.47267C10.0899 3.01161 9.53613 2.64791 8.92773 2.40236C8.31912 2.15679 7.66698 2.03397 7.01074 2.04201ZM7 2.62501C7.48322 2.62501 7.87495 3.0168 7.875 3.50001L7.875 6.459L9.72559 7.3838C10.1576 7.59989 10.3331 8.12548 10.1172 8.55763C9.9012 8.98977 9.37555 9.16499 8.94336 8.94923L6.60937 7.78322C6.31287 7.63502 6.12598 7.33149 6.12598 7.00001L6.12598 3.50001C6.12602 3.01697 6.517 2.62528 7 2.62501Z" fill="#9AA1B5" />
                        </g>
                        <defs>
                          <clipPath id="clip0_928_475044">
                            <rect width="14" height="14" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>

                      <span className="text-[11px] dark:text-[var(--text-sub)]  text-[var(--text-strong)] font-medium">{durationStr}</span>
                    </div>
                  )}
                  {countdown && (
                    <div className="flex items-center gap-1">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11.0837 1.16675V2.91675C11.0837 5.17191 9.25549 7.00008 7.00033 7.00008M2.91699 1.16675L2.91699 2.91675C2.91699 5.17191 4.74516 7.00008 7.00033 7.00008M7.00033 7.00008C9.25549 7.00008 11.0837 8.82825 11.0837 11.0834L11.0837 12.8334M7.00033 7.00008C4.74516 7.00008 2.91699 8.82825 2.91699 11.0834L2.91699 12.8334" stroke="#9AA1B5" stroke-width="1.5" />
                        <path d="M2.33398 1.16675L11.6673 1.16675M11.6673 12.8334L2.33398 12.8334" stroke="#9AA1B5" stroke-width="1.5" stroke-linecap="round" />
                      </svg>

                      <span className="text-[11px] font-bold text-[#EF4444]">{countdown}</span>
                    </div>
                  )}
                </div>
              )}

              <div className='mt-auto'>
                {/* Divider */}
                <div className="  mb-2 " />

                {/* Assignee */}
                <div className="flex  mt-auto  items-center gap-1.5">
                  {card.assignee_info?.avatar ? (
                    <img src={card.assignee_info.avatar} alt={assignee}
                      className="w-6 h-6 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#EEF1FB] dark:bg-[#333535] flex items-center justify-center shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-soft)" strokeWidth="1.8">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] truncate leading-tight">
                      {assignee}
                    </p>
                    <p className="text-[11px] dark:text-[var(--text-strong)]  text-[var(--text-strong)] truncate leading-tight">
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
    <div className="fixed inset-0 z-[9999]  flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[520px] rounded-3xl shadow-2xl bg-[var(--bg-base)] p-7 flex flex-col gap-5">
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] dark:bg-[var(--bg-elevation-2)] text-[var(--text-sub)] dark:text-[var(--text-sub)] hover:bg-[var(--stroke-sub)] cursor-pointer">
          <FaXmark size={13} />
        </button>

        <div>
          <h2 className="text-[18px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Vazifani rad etish</h2>
          <p className="text-sm text-[var(--text-soft)] mt-0.5">Rad etish sababini kiriting</p>
        </div>

        {/* Fayllar */}
        <div>
          <div className="flex flex-wrap gap-2 mb-1">
            {files.map((f, i) => (
              <div key={i} className="relative w-16 h-16 rounded-xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] overflow-hidden bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] flex items-center justify-center group">
                {f.preview
                  ? <img src={f.preview} alt="" className="w-full h-full object-cover" />
                  : <div className="flex flex-col items-center gap-0.5 px-1">
                    <FaPaperclip size={14} className="text-[var(--accent-sub)]" />
                    <span className="text-[8px] text-[var(--text-sub)] truncate w-full text-center">{f.file.name}</span>
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
                border-[#C2C8E0] dark:border-[var(--stroke-sub)] text-[var(--text-soft)] hover:border-[var(--accent-sub)] hover:text-[var(--accent-sub)]">
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
              bg-[var(--bg-base)] text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-disabled)] dark:placeholder-[var(--text-sub)]
              focus:border-[var(--accent-sub)] transition-colors
              ${reasonError ? 'border-red-500 dark:border-red-500' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]'}`}
          />
          {reasonError && <p className="text-xs text-red-500 mt-0.5">*Sabab kiritish majburiy</p>}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]">
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
function KanbanColumn({ col, cards, onOpen, isDimmed, isDropDisabled, isDragTarget, isDraggingGlobal }) {
  const { isDark } = useTheme()
  const colBg = isDark ? col.darkBg : col.bg

  return (
    <div
      className={`flex  flex-col min-w-0 transition-opacity duration-300 ${isDimmed ? 'opacity-40 grayscale-[30%]' : 'opacity-100'}`}
      style={{
        flex: '1 1 0',
        willChange: isDraggingGlobal ? 'opacity' : 'auto',
      }}
    >
      {/* Header */}
      <div className="flex  mb-2 justify-center items-center gap-2 px-1">
        <span className="text-[12px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] whitespace-nowrap truncate">{col.label}</span>
        <span
          className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
          style={{ backgroundColor: col.color }}
        >
          {cards.length}
        </span>
      </div>

      {/* Cards area */}
      <Droppable droppableId={col.id} isDropDisabled={isDropDisabled}>
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

  const [viewMode, setViewMode] = useState(() => localStorage.getItem('tasks_view_mode') || 'table')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
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
  const [copiedUid, setCopiedUid] = useState(null)
  const [dragSourceCol, setDragSourceCol] = useState(null)
  const [rejectionPending, setRejectionPending] = useState(null) // { taskId, draggableId, sourceColId }
  const scrollRef = useRef(null)

  const hasFilter = filters.projects?.length > 0 ||
    !!filters.holat || !!filters.daraja || !!filters.turi ||
    !!filters.deadFromD || !!filters.deadToD || !!filters.created_by?.length > 0 || !!filters.assignee?.length > 0

  const buildParams = useCallback((f = filters, q = search, pg = 1) => {
    // Sana + vaqtni timezone bilan ISO formatga o'tkazish
    const toIso = (date, time, isEnd = false) => {
      if (!date) return null
      const t = time || (isEnd ? '23:59' : '00:00')
      const now = new Date()
      const offsetMin = -now.getTimezoneOffset()
      const sign = offsetMin >= 0 ? '+' : '-'
      const absMin = Math.abs(offsetMin)
      const hh = String(Math.floor(absMin / 60)).padStart(2, '0')
      const mm = String(absMin % 60).padStart(2, '0')
      return `${date}T${t}:00${sign}${hh}:${mm}`
    }

    const p = { page: pg, page_size: 20 }
    if (q) p.search = q
    if (f.holat) p.status = f.holat
    if (f.daraja) p.priority = f.daraja
    if (f.turi) p.type = f.turi
    if (f.projects?.length) p.project = f.projects.map(pr => pr.id || pr).join(',')
    const fromIso = toIso(f.deadFromD, f.deadFromT, false)
    const toIsoVal = toIso(f.deadToD, f.deadToT, true)
    if (fromIso) p.deadline_from = fromIso
    if (toIsoVal) p.deadline_to = toIsoVal
    if (f.created_by?.length) p.created_by = f.created_by.map(pr => pr.id || pr).join(',')
    if (f.assignee?.length) p.assignee = f.assignee.map(pr => pr.id || pr).join(',')
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

  const runSearch = (val) => {
    const q = val.trim()
    setSearch(q)
    if (viewMode === 'kanban') loadKanbanTasks(filters, q)
    else loadTasks(filters, q, 1)
  }
  const handleApplyFilter = (f) => {
    setFilters(f)
    setShowFilter(false)
    if (viewMode === 'kanban') loadKanbanTasks(f, search)
    else loadTasks(f, search, 1)
  }

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

      const { data } = await axiosAPI.get(`task-attachments/?task=${id}`)

      setEditTask({ ...task, attachments: data?.data?.results })
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
  // silent=true bo'lsa loading spinner ko'rsatilmaydi (status o'zgarishidan keyin)
  const loadKanbanTasks = useCallback(async (f = filters, q = search, silent = false) => {
    if (!silent) setKanbanLoading(true)
    try {
      const toIso = (date, time, isEnd = false) => {
        if (!date) return null
        const t = time || (isEnd ? '23:59' : '00:00')
        const now = new Date()
        const offsetMin = -now.getTimezoneOffset()
        const sign = offsetMin >= 0 ? '+' : '-'
        const absMin = Math.abs(offsetMin)
        const hh = String(Math.floor(absMin / 60)).padStart(2, '0')
        const mm = String(absMin % 60).padStart(2, '0')
        return `${date}T${t}:00${sign}${hh}:${mm}`
      }

      const params = { page_size: 200 }
      if (q) params.search = q
      if (f.holat) params.status = f.holat
      if (f.daraja) params.priority = f.daraja
      if (f.turi) params.type = f.turi
      if (f.projects?.length) params.project = f.projects.map(pr => pr.id || pr).join(',')
      const fromIso = toIso(f.deadFromD, f.deadFromT, false)
      const toIsoVal = toIso(f.deadToD, f.deadToT, true)
      if (fromIso) params.deadline_from = fromIso
      if (toIsoVal) params.deadline_to = toIsoVal
      if (f.created_by?.length) params.created_by = f.created_by.map(pr => pr.id || pr).join(',')
      if (f.assignee?.length) params.assignee = f.assignee.map(pr => pr.id || pr).join(',')
      const res = await axiosAPI.get('/tasks/', { params })
      const payload = res.data?.data ?? res.data
      const results = Array.isArray(payload) ? payload : (payload.results ?? [])
      setCards(results)
    } catch (err) {
      toast.error('Xatolik', "Kanban ma'lumotlarini yuklashda xatolik")
    } finally {
      if (!silent) setKanbanLoading(false)
    }
  }, [filters, search])
  const switchToTable = () => { setViewMode('table'); localStorage.setItem('tasks_view_mode', 'table') }
  const switchToKanban = () => { setViewMode('kanban'); localStorage.setItem('tasks_view_mode', 'kanban'); loadKanbanTasks(filters, search) }

  const onDragEnd = async ({ destination, source, draggableId }) => {
    setDraggingOver(null)
    setDragSourceCol(null)
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId
    const srcStatus = source.droppableId
    const taskId = Number(draggableId)
    const draggedCard = cards.find(c => String(c.id) === String(draggableId))

    // Xodim faqat 'checked' va 'rejected' ga o'tkaza olmaydi
    if (isEmployee && (newStatus === 'checked' || newStatus === 'rejected')) {
      toast.error("Ruxsat yo'q", "Siz vazifani bu bo'limga o'tkaza olmaysiz")
      return
    }

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
      loadKanbanTasks(filters, search, true)
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

  const onDragStart = (start) => {
    setDragSourceCol(start.source.droppableId)
  }

  useEffect(() => {
    if (!isAuditor) {
      registerAction({
        label: "Vazifa qo'shish",
        icon: <img src="/imgs/tasks.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
        onClick: () => setShowAdd(true),
      })
    }

    if (viewMode === 'kanban') {
      loadKanbanTasks(filters, search)
      registerNavbarExtra(
        <div className="flex items-center gap-3 flex-1">
          <span
            className="text-[13px] font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] cursor-pointer"
            onClick={() => switchToTable()}
          >
            Vazifa boshqaruvi
          </span>
          <span className="text-[13px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">
            › Vazifalar
          </span>
          <div className="flex-1" />
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Izlash..."
              value={searchInput}
              onChange={e => {
                setSearchInput(e.target.value)
                if (e.target.value.length === 0) {
                  runSearch("")
                }
              }}
              onKeyDown={e => { if (e.key === 'Enter') runSearch(searchInput) }}
              className="pl-8 pr-3 py-[5px] rounded-xl text-[13px] outline-none  w-[200px]
                bg-[#F1F3F9] border border-[var(--stroke-sub)] text-[var(--text-soft)] placeholder-[var(--text-soft)] focus:border-[var(--accent-sub)]
                dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-sub)] dark:placeholder-[#C2C8E0]"
            />
          </div>
          {/* Filter */}
          <button onClick={() => setShowFilter(true)}
            className="relative flex items-center gap-1.5 px-3 py-[5px] rounded-xl text-[13px] font-semibold border  cursor-pointer
              bg-[#F1F3F9] border-[var(--stroke-sub)] text-[var(--text-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-sub)]">
            <img src="/imgs/filterIcon.svg" alt="" className="w-3.5 h-3.5 [filter:brightness(0)_saturate(100%)_invert(38%)_sepia(10%)_saturate(500%)_hue-rotate(190deg)] dark:[filter:brightness(0)_saturate(100%)_invert(70%)_sepia(10%)_saturate(300%)_hue-rotate(190deg)]" />
            {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-strong)]" />}
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
          className="flex flex-col bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]"
          style={{ height: 'calc(99vh - 57px)' }}
        >
          {kanbanLoading ? (
            <div className="flex items-center justify-center h-full">
              <svg className="animate-spin w-8 h-8 text-[var(--accent-sub)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : (
            <div
              className="flex gap-2 px-3 pt-3  dark:bg-[var(--bg-base)] pb-3 h-full"
              style={{ overflow: 'hidden' }}
            >
              {COLUMNS.map(col => {
                const allowedCols = dragSourceCol ? (ALLOWED_TRANSITIONS[dragSourceCol] || []) : [];
                const isRestrictedForEmployee = !!(dragSourceCol && isEmployee && (col.id === 'checked' || col.id === 'rejected'));
                const isDropDisabled = isRestrictedForEmployee || !!(dragSourceCol && dragSourceCol !== col.id && !allowedCols.includes(col.id));
                const isDimmed = isRestrictedForEmployee || !!(dragSourceCol && dragSourceCol !== col.id && !allowedCols.includes(col.id));

                return (
                  <KanbanColumn
                    key={col.id}
                    col={col}
                    cards={cards.filter(c => (STATUS_TO_COL[c.status] || c.status) === col.id)}
                    onOpen={loadTaskDetail}
                    isDimmed={isDimmed}
                    isDropDisabled={isDropDisabled}
                    isDragTarget={draggingOver === col.id}
                    isDraggingGlobal={!!dragSourceCol}
                  />
                )
              })}
            </div>
          )}
        </div>

        {showFilter && (
          <TaskFilterModal initial={filters} onClose={() => setShowFilter(false)}
            onApply={(f) => { setFilters(f); setShowFilter(false); loadKanbanTasks(f, search) }} />
        )}
        {showAdd && (
          <AddTaskModal
            onClose={() => setShowAdd(false)}
            onAdd={async (body) => {
              const created = await handleAdd(body)
              loadKanbanTasks(filters, search)
              return created
            }}
            isEmployee={isEmployee}
          />
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
            isEmployee={isEmployee}
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
              loadKanbanTasks(filters, search, true)
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
    <div className="flex flex-col h-full gap-4" >

      <h1 className="text-2xl font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Vazifalar</h1>

      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)] dark:text-[var(--text-sub)]"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Izlash"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runSearch(searchInput) }}
            className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none  w-[200px]
              bg-[#F1F3F9] border border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-sub)] focus:border-[var(--accent-sub)]
              dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-sub)] dark:placeholder-[var(--text-sub)]" />
        </div>
        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border  cursor-pointer
            bg-[#F1F3F9] border-[var(--stroke-sub)] text-[var(--text-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-sub)]">
          <img src="/imgs/filterIcon.svg" alt="" className="w-3.5 h-3.5 [filter:brightness(0)_saturate(100%)_invert(38%)_sepia(10%)_saturate(500%)_hue-rotate(190deg)] dark:[filter:brightness(0)_saturate(100%)_invert(70%)_sepia(10%)_saturate(300%)_hue-rotate(190deg)]" /> Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-strong)]" />}
        </button>
        <div className="ml-auto flex items-center gap-1 p-1 rounded-xl border border-[var(--stroke-sub)] bg-[#F1F3F9] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)]">
          <button className="p-1.5 rounded-lg bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-2)] shadow-sm cursor-pointer">
            <img
              src="/imgs/taskIconRow.svg"
              alt="row view"
              className="w-3 h-3 text-[var(--accent-strong)] [filter:invert(27%)_sepia(89%)_saturate(500%)_hue-rotate(210deg)_brightness(90%)] dark:[filter:invert(60%)_sepia(30%)_saturate(400%)_hue-rotate(190deg)_brightness(110%)]"
            />
          </button>
          <button onClick={switchToKanban} className="p-1.5 rounded-lg cursor-pointer">
            <img
              src="/imgs/taskIconCard.svg"
              alt="card view"
              className="w-4 h-4 [filter:invert(65%)_sepia(10%)_saturate(400%)_hue-rotate(190deg)_brightness(95%)] dark:[filter:invert(65%)_sepia(10%)_saturate(300%)_hue-rotate(190deg)_brightness(90%)] hover:[filter:invert(27%)_sepia(89%)_saturate(500%)_hue-rotate(210deg)_brightness(90%)]"
            />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="overflow-auto h-[70vh]">
        <table className="w-full  text-sm whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[var(--bg-elevation-1)]">
            <tr className="border-b border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">№</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">UID</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Nomi</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Loyiha</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Yaratuvchi</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Topshiruvchi
                </span>
              </th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Turi</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Darajasi</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Holati</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Muddati</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className=''>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(j => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded-lg bg-[#EEF1F7] dark:bg-[var(--bg-elevation-2)] animate-pulse" style={{ width: j === 1 ? 32 : '80%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              data.map((t, idx) => (
                <tr key={t.id}
                  onClick={() => loadTaskDetail(t.id)}
                  className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] last:border-0 hover:bg-black/2 dark:hover:bg-white/2  cursor-pointer">
                  <td className="px-4 py-3 text-[var(--text-soft)] dark:text-[var(--text-sub)] text-xs font-medium">{idx + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5 group">
                      <span className="text-[var(--text-soft)] dark:text-[var(--text-sub)]">{t.uid || idx + 1}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(t.uid || String(idx + 1)).then(() => {
                            setCopiedUid(t.id)
                            setTimeout(() => setCopiedUid(null), 2000)
                          }).catch(() => {})
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-md hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] text-[var(--text-soft)] dark:text-[var(--text-sub)] cursor-pointer"
                      >
                        {copiedUid === t.id
                          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M216,28H88A12,12,0,0,0,76,40V76H40A12,12,0,0,0,28,88V216a12,12,0,0,0,12,12H168a12,12,0,0,0,12-12V180h36a12,12,0,0,0,12-12V40A12,12,0,0,0,216,28ZM156,204H52V100H156Zm48-48H180V88a12,12,0,0,0-12-12H100V52H204Z"/></svg>
                        }
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)] max-w-[220px]">
                    <span className="block truncate" title={t.title || t.name || ''}>
                      {t.title || t.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{typeof t.project_info === 'object' ? t.project_info?.title : (t.project_info || t.project || '—')}</td>
                  <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{t.created_by_info?.username || t.creator || '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{t.assignee_info?.username || t.assignee || '—'}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-strong)] dark:text-[var(--text-strong)]">{TYPE_LABEL[t.type] || t.type || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">{PRIORITY_LABEL[t.priority] || t.level || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">{TASK_STATUS_LABEL[t.status] || t.status || '—'}</td>
                  <td className="px-4 py-3 text-right text-[var(--text-strong)] dark:text-[var(--text-strong)]">{fmtTaskDt(t.deadline)}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {!isAuditor && canEdit && (
                      <TaskRowMenu
                        onDetail={() => loadTaskDetail(t.id)}
                        onEdit={() => loadTaskDetail(t.id)}
                        onDelete={() => handleDelete(t.id)}
                      />
                    )}
                    {!isAuditor && !canEdit && (
                      <TaskRowMenu
                        onDetail={() => loadTaskDetail(t.id)}
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
          <div className="py-4 text-center text-sm text-[var(--text-disabled)] dark:text-[var(--text-soft)]">
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
        <AddTaskModal
          onClose={() => setShowAdd(false)}
          onAdd={async (body) => {
            const created = await handleAdd(body)
            loadTasks(filters, search, 1)
            return created
          }}
          isEmployee={isEmployee}
        />
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
          isEmployee={isEmployee}
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
