import { useState, useRef, useEffect } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown, FaCheck, FaPaperclip } from 'react-icons/fa6'
import { labelCls } from '../components/constants'
import { axiosAPI } from '../../../../service/axiosAPI'
import { toast } from '../../../../Toast/ToastProvider'
import { parseApiError } from '../../../../service/parseApiError'
import { DateTimeBox } from '../../Components/DateTimeBox'
import DiscardModal from '../../../../components/DiscardModal'

const PRIORITY_OPTIONS = [
  { label: 'Past', value: 'low' },
  { label: "O'rta", value: 'medium' },
  { label: 'Yuqori', value: 'high' },
  { label: 'Kritik', value: 'critical' },
]
const TYPE_OPTIONS = [
  { label: 'Xatolik (Bug)', value: 'bug' },
  { label: 'Yangi funksiya', value: 'feature' },
  { label: "Qo'shimcha", value: 'extra' },
  { label: "Tadqiqot/O'rganish", value: 'research' },
]
const STATUS_OPTIONS = [
  { label: 'Bajarilishi kerak', value: 'todo' },
  { label: 'Jarayonda', value: 'in_progress' },
  { label: 'Bajarilgan', value: 'done' },
  { label: 'Ishga tushirilgan', value: 'production' },
  { label: 'Tekshirilgan', value: 'checked' },
  { label: 'Rad etilgan', value: 'rejected' },
]

function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return { open, setOpen, ref }
}

function SelectDropdown({ label, value, onChange, options, placeholder, error, disabled }) {
  const { open, setOpen, ref } = useDropdown()
  const selected = options.find(o => o.value === value)
  return (
    <div ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative">
        <button type="button" onClick={() => !disabled && setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border
            ${disabled ? 'cursor-default bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]' : 'cursor-pointer bg-[var(--bg-base)]'}
            ${error ? 'border-red-400' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]'}
            ${value ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-sub)] dark:text-[var(--text-sub)]'}`}>
          <span className="flex-1 text-left truncate">{selected?.label || placeholder}</span>
          {!disabled && (
            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              {value && <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"><FaXmark size={11} /></span>}
              <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          )}
        </button>
        {error && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
        {open && !disabled && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
            {options.map((o, i) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer
                  ${i < options.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''}
                  ${value === o.value ? 'bg-[#EEF1FB] text-[var(--accent-strong)] font-semibold dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'}`}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function fmtProjectDate(iso) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${dd}.${mm}.${d.getFullYear()}`
  } catch { return '' }
}

function ProjectDropdownLocal({ value, onChange, error, projects, disabled }) {
  const { open, setOpen, ref } = useDropdown()
  const selected = projects.find(p => String(p.id) === String(value))

  return (
    <div ref={ref}>
      <label className={labelCls}>Loyiha</label>
      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => !disabled && setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border
            ${disabled ? 'cursor-default bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]' : 'cursor-pointer bg-[var(--bg-base)]'}
            ${error ? 'border-red-400' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]'}
            ${value ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-sub)]'}`}
        >
          <span className="flex-1 text-left truncate">
            {selected ? selected.title : 'Loyiha tanlang'}
          </span>
          {!disabled && (
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              {value && (
                <span
                  onMouseDown={e => { e.stopPropagation(); onChange('') }}
                  className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"
                >
                  <FaXmark size={11} />
                </span>
              )}
              <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          )}
        </button>

        {error && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}

        {/* Dropdown */}
        {open && !disabled && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-hidden
            bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
            <div className="overflow-y-auto max-h-64">
              {projects.length === 0 && (
                <p className="text-sm text-[var(--text-soft)] text-center py-6">Loyihalar topilmadi</p>
              )}
              {projects.map(p => {
                const isActive = String(value) === String(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { onChange(String(p.id)); setOpen(false) }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer transition-colors
                      border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] last:border-0
                      ${isActive ? 'bg-[#F1F3F9] dark:bg-[var(--bg-elevation-2)]' : 'hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-1)]'}`}
                  >
                    {/* Left: title + description */}
                    <div className="flex flex-col min-w-0 flex-1 pr-3">
                      <span className="text-sm font-semibold truncate leading-snug text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                        {p.title}
                      </span>
                      {p.description && (
                        <span className="text-xs text-[var(--text-soft)] dark:text-[var(--text-sub)] truncate leading-snug mt-0.5">
                          {p.description}
                        </span>
                      )}
                    </div>
                    {/* Right: date */}
                    <span className="shrink-0 text-sm text-[var(--text-soft)] dark:text-[var(--text-sub)] font-medium">
                      {fmtProjectDate(p.created_at)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Bitta topshiruvchi tanlash (radio)
function UserPickerModal({ title, selected, onConfirm, onClose, users }) {
  const [search, setSearch] = useState('')
  // selected — array, lekin faqat birinchisi ishlatiladi
  const [temp, setTemp] = useState(selected?.length > 0 ? selected[0] : null)
  const filtered = users.filter(u => (u.username ?? '').toLowerCase().includes(search.toLowerCase()))

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);


  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-[var(--bg-base)] flex flex-col overflow-hidden" style={{ height: 700, maxHeight: '90vh' }}>
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer"><FaArrowLeft size={16} /></button>
            <h2 className="text-lg font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">{title}</h2>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="text" placeholder="Ism bo'yicha izlash" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none border bg-[var(--bg-base)] border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-sub)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)] focus:border-[var(--accent-sub)]" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-2">
          {filtered.length === 0 && <p className="text-sm text-[var(--text-soft)] text-center py-8">Foydalanuvchi topilmadi</p>}
          {filtered.map(u => {
            const isSel = temp?.id === u.id
            return (
              <button key={u.id} onClick={() => setTemp(isSel ? null : u)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer text-left
                  ${isSel ? 'bg-[#EEF1FB] border-[var(--accent-sub)] dark:bg-[var(--bg-elevation-2)] dark:border-[var(--accent-strong)]' : 'bg-[var(--bg-base)] border-[var(--stroke-sub)] hover:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] dark:hover:bg-[var(--bg-elevation-1)]'}`}>
                {/* Radio circle */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                  ${isSel ? 'bg-[var(--accent-strong)] border-[var(--accent-strong)]' : 'border-[var(--stroke-strong)] dark:border-[var(--stroke-sub)]'}`}>
                  {isSel && <div className="w-2 h-2 rounded-full bg-[var(--bg-base)]" />}
                </div>
                <div className="w-9 h-9 rounded-full bg-[var(--accent-sub)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent-sub)] shrink-0">
                  {u.username?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text-strong)] dark:text-[var(--text-strong)] truncate">{u.username}</p>
                  <p className="text-xs text-[var(--text-soft)] truncate">{u.position || '—'}</p>
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-6 py-4 border-t border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] flex items-center justify-between shrink-0">
          <span className="text-sm text-[var(--text-sub)] dark:text-[var(--text-sub)]">{temp ? '1 ta tanlangan' : 'Tanlanmagan'}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setTemp(null)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]">
              <FaXmark size={12} /> Tozalash
            </button>
            <button onClick={() => onConfirm(temp ? [temp] : [])} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]">
              <FaCheck size={12} /> Tanlash
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// rejection_reason ni parse qilish: "[08.05.2026 11:26] matn\n\n[08.05.2026 18:51] matn2"
function parseRejectionReason(reason) {
  if (!reason) return []
  // Har bir [sana vaqt] blokini ajratib olish
  const parts = reason.split(/\n\n+/)
  return parts.map(part => part.trim()).filter(Boolean).map(part => {
    const match = part.match(/^\[([^\]]+)\]\s*(.*)$/s)
    if (match) {
      return { date: match[1].trim(), text: match[2].trim() }
    }
    return { date: null, text: part }
  })
}

export default function EditTaskModal({ task, onClose, onSave, canEdit = true, onDelete, isEmployee, deadlineOnly = false }) {
  const [projects, setProjects] = useState([])
  const [positions, setPositions] = useState([])
  const [projectEmployees, setProjectEmployees] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  // Rejection files from separate endpoint
  const [rejectionFiles, setRejectionFiles] = useState(
    Array.isArray(task.rejection_files) ? task.rejection_files : []
  )
  // Existing attachments from the task
  const [existingAttachments, setExistingAttachments] = useState(
    Array.isArray(task.attachments) ? task.attachments : []
  )

  // New files to upload after save
  const [newAttachments, setNewAttachments] = useState([])
  const [showDetails, setShowDetails] = useState(false)
  const fileInputRef = useRef(null)
  const normalizePercentInput = (val) => {
    const cleaned = String(val || '').replace(/,/g, '.').replace(/[^\d.]/g, '')
    if (!cleaned) return ''
    const firstDot = cleaned.indexOf('.')
    const normalized = firstDot === -1
      ? cleaned
      : `${cleaned.slice(0, firstDot)}.${cleaned.slice(firstDot + 1).replace(/\./g, '')}`
    const [intPartRaw = '', decRaw = ''] = normalized.split('.')
    const intPart = intPartRaw.replace(/^0+(?=\d)/, '') || '0'

    if (firstDot === -1) {
      return Number(intPart) > 100 ? '100' : intPart
    } else {
      const limitedDec = decRaw.slice(0, 2)
      const resultStr = `${intPart}.${limitedDec}`
      return Number(resultStr) > 100 ? '100' : resultStr
    }
  }

  useEffect(() => {
    // project-shorts — tezroq endpoint (faqat ro'yxat uchun)
    axiosAPI.get('/project-shorts/', { params: { page_size: 200 } })
      .then(res => {
        const payload = res.data?.data ?? res.data
        const list = Array.isArray(payload) ? payload : (payload.results ?? [])
        setProjects(Array.isArray(list) ? list : [])
      }).catch(() => {
        axiosAPI.get('/projects/', { params: { page_size: 100 } })
          .then(res => {
            const payload = res.data?.data ?? res.data
            const list = Array.isArray(payload) ? payload : (payload.results ?? [])
            setProjects(Array.isArray(list) ? list : [])
          }).catch(() => setProjects([]))
      })
    axiosAPI.get('/applications/positions/', { params: { page_size: 100 } })
      .then(res => {
        const payload = res.data?.data ?? res.data
        const list = Array.isArray(payload) ? payload : (payload.results ?? [])
        setPositions(Array.isArray(list) ? list : [])
      }).catch(() => { })

    // Rad etilgan yoki qayta ochilgan bo'lsa — rejection fayllarni alohida endpoint dan yuklash
    if ((task.status === 'rejected' || task.reopened_count > 0) && task.id) {
      axiosAPI.get('/task-rejection-files/', { params: { task: task.id } })
        .then(res => {
          const payload = res.data?.data ?? res.data
          const list = Array.isArray(payload) ? payload : (payload.results ?? [])
          if (Array.isArray(list) && list.length > 0) {
            setRejectionFiles(list)
          }
        })
        .catch(() => { /* task.rejection_files fallback ishlatiladi */ })
    }
  }, [])

  // Mavjud task ning loyihasidan xodimlarni yuklash
  useEffect(() => {
    const projId = initProject
    if (projId) {
      axiosAPI.get(`/projects/${projId}/`)
        .then(res => {
          const proj = res.data?.data ?? res.data
          const emps = proj?.employees_info ?? []
          setProjectEmployees(Array.isArray(emps) ? emps : [])
        })
        .catch(() => { })
    }
  }, [])

  // Parse deadline: date = slice(0,10), time = local HH:MM from Date object
  const initDeadlineDate = task.deadline ? task.deadline.slice(0, 10) : ''
  const initDeadlineTime = (() => {
    if (!task.deadline) return '00:00'
    const d = new Date(task.deadline)
    if (isNaN(d.getTime())) return '00:00'
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${hh}:${mm}`
  })()

  const initHours = task.estimated_minutes ? String(Math.floor(task.estimated_minutes / 60)) : ''
  const initMins = task.estimated_minutes ? String(task.estimated_minutes % 60) : ''
  const initAssignees = task.assignee_info ? [task.assignee_info] : []
  const initProject = task.project
    ? String(task.project)
    : (task.project_info && typeof task.project_info === 'object'
      ? String(task.project_info.id)
      : (task.project_info && typeof task.project_info === 'string' && task.project_info
        ? '' // string bo'lsa ID yo'q
        : '')
    )

  const fmtPrice = (val) => {
    if (!val) return ''
    const raw = String(val).replace(/[^\d.]/g, '')
    const n = Math.abs(parseFloat(raw))
    if (isNaN(n)) return ''
    const [int, dec] = String(n).split('.')
    const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return dec !== undefined ? `${formatted}.${dec}` : formatted
  }

  const [form, setForm] = useState({
    project: initProject,
    title: task.title || '',
    description: task.description || '',
    priority: task.priority || 'low',
    type: task.type || 'bug',
    status: task.status || 'todo',
    assignees: initAssignees,
    position: task.position_info ? String(task.position_info.id) : '',
    sprint: task.sprint ? String(task.sprint) : '',
    task_price: fmtPrice(task.task_price),
    penalty_percentage: task.penalty_percentage ? String(Math.abs(parseFloat(task.penalty_percentage))) : '',
    deadline: initDeadlineDate,
    deadline_time: initDeadlineTime,
    estimated_hours: initHours,
    estimated_minutes: initMins,
    task_attachments: task.task_attachments || [],
  })
  const [errors, setErrors] = useState({})

  const [isDirty, setIsDirty] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const handleClose = () => { if (isDirty) setShowDiscard(true); else onClose() }

  const set = (k, v) => {
    setIsDirty(true)
    if (k === 'project') {
      setForm(p => ({ ...p, project: v, assignees: [] }))
      setErrors(p => ({ ...p, project: false }))
      setProjectEmployees([])
      if (v) {
        axiosAPI.get(`/projects/${v}/`)
          .then(res => {
            const proj = res.data?.data ?? res.data
            const emps = proj?.employees_info ?? []
            setProjectEmployees(Array.isArray(emps) ? emps : [])
          })
          .catch(() => { })
      }
      return
    }
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: false }))
  }

  // projects yuklanganidan keyin project_info string bo'lsa, title bo'yicha moslashtirish
  useEffect(() => {
    if (!form.project && task.project_info && typeof task.project_info === 'string' && projects.length > 0) {
      const found = projects.find(p =>
        (p.title || p.name || '').toLowerCase() === task.project_info.toLowerCase()
      )
      if (found) {
        setForm(prev => ({ ...prev, project: String(found.id) }))
      }
    }
  }, [projects])

  const formatPrice = (val) => {
    const clean = val.replace(/[^\d.]/g, '').replace(/^(\d*\.?\d{0,2}).*$/, '$1')
    const [int, dec] = clean.split('.')
    const formatted = (int || '').slice(0, 12).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return dec !== undefined ? `${formatted}.${dec}` : formatted
  }

  const handlePenalty = (val) => {
    set('penalty_percentage', normalizePercentInput(val))
  }

  const handleSprint = (val) => {
    const digits = val.replace(/\D/g, '')
    if (!digits) { set('sprint', ''); return }
    set('sprint', String(Math.min(10, Math.max(1, parseInt(digits, 10)))))
  }

  const validate = () => {
    if (deadlineOnly) return true
    const e = {}
    if (!form.project) e.project = true
    if (!form.title.trim()) e.title = true
    if (!form.priority) e.priority = true
    if (!form.type) e.type = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputCls = (err, ro) =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border text-[var(--text-strong)] placeholder-[var(--text-sub)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)]
    ${ro ? 'bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] cursor-default' : 'bg-[var(--bg-base)]'}
    ${err ? 'border-red-400' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]'}
    ${!ro ? 'focus:border-[var(--accent-sub)]' : ''}`

  // Delete an existing attachment
  const handleDeleteAttachment = async (attId) => {
    try {
      await axiosAPI.delete(`/task-attachments/${attId}/`)
      setExistingAttachments(prev => prev.filter(a => a.id !== attId))
    } catch {
      toast.error('Xatolik', 'Faylni o\'chirishda xatolik yuz berdi')
    }
  }

  const handleSubmit = async () => {
    if (!canEdit) return
    if (!validate()) return
    setLoading(true)
    try {
      let body
      if (deadlineOnly) {
        body = {}
        if (form.deadline) {
          const t = form.deadline_time || '00:00'
          body.deadline = `${form.deadline}T${t}:00`
        }
      } else {
        body = {
          project: Number(form.project),
          title: form.title.trim(),
          priority: form.priority,
          type: form.type,
        }
        if (form.description.trim()) body.description = form.description.trim()
        if (form.assignees.length) body.assignee = form.assignees[0].id
        if (form.position) body.position = Number(form.position)
        if (form.sprint) body.sprint = Number(form.sprint)
        if (form.task_price) body.task_price = form.task_price.replace(/\s/g, '')
        if (form.penalty_percentage) body.penalty_percentage = form.penalty_percentage
        if (form.deadline) {
          const t = form.deadline_time || '00:00'
          body.deadline = `${form.deadline}T${t}:00`
        }
        const hrs = parseInt(form.estimated_hours, 10) || 0
        const mins = parseInt(form.estimated_minutes, 10) || 0
        if (hrs || mins) {
          body.estimated_input_hours = hrs
          body.estimated_input_minutes = mins
        }
      }

      await onSave(task.id, body)

      if (!deadlineOnly && newAttachments.length > 0) {
        const uploadResults = await Promise.allSettled(
          newAttachments.map(att => {
            const fd = new FormData()
            fd.append('task', task.id)
            fd.append('file', att.file)
            return axiosAPI.post('/task-attachments/', fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          })
        )
        uploadResults.forEach((result, i) => {
          if (result.status === 'rejected') {
            const fname = newAttachments[i]?.file?.name || 'fayl'
            toast.error(`"${fname}" yuklanmadi`, parseApiError(result.reason, "Fayl yuklashda xatolik"))
          }
        })
      }

      if (!deadlineOnly && form.status && form.status !== task.status) {
        try {
          await axiosAPI.patch(`/tasks/${task.id}/change-status/`, { status: form.status })
        } catch (statusErr) {
          toast.error('Holat xatoligi', parseApiError(statusErr, "Holat yangilashda xatolik"))
        }
      }

      onClose()
    } catch (err) {
      toast.error('Xatolik', parseApiError(err, 'Vazifa yangilashda xatolik'))
    } finally {
      setLoading(false)
    }
  }

  const positionOptions = positions.map(p => ({ label: p.name, value: String(p.id) }))
  const assigneeLabel = form.assignees.map(u => u.username).join(', ')
  const ro = !canEdit || deadlineOnly   // barcha maydonlar uchun (deadline bundan mustasno)
  const roDeadline = !canEdit           // faqat deadline uchun

  // Helper: extract filename from URL
  const getFilename = (url) => {
    if (!url) return 'fayl'
    const parts = url.split('/')
    return decodeURIComponent(parts[parts.length - 1] || 'fayl')
  }

  // Helper: check if URL is an image
  const isImage = (url) => {
    if (!url) return false
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url)
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !pickerOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty, pickerOpen]);


  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button onClick={handleClose} className="fixed top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer z-[200]">
          <FaXmark size={14} />
        </button>
        <div className="relative w-full max-w-[600px] flex flex-col rounded-3xl shadow-2xl bg-[var(--bg-base)] overflow-hidden" style={{ height: 700, maxHeight: '90vh' }}>

          {/* ── Header ── */}
          <div className="px-7 pt-7 pb-4 shrink-0  rounded-t-3xl">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={handleClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0"><FaArrowLeft size={17} /></button>
              <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                {deadlineOnly ? 'Muddatni yangilash' : canEdit ? 'Vazifa tahrirlash' : "Vazifa ma'lumotlari"}
              </h2>
            </div>
            <p className="text-sm text-[var(--text-sub)] ">
              {deadlineOnly ? "Vazifa muddati o'tgan. Yangi muddatni belgilang." : canEdit ? "Vazifa ma'lumotlarini yangilash uchun o'zgartirishlar kiriting" : "Vazifa haqida batafsil ma'lumot"}
            </p>
          </div>

          {/* ── Scrollable content ── */}
          <div className="flex-1 overflow-y-auto px-7 py-4 pb-6 flex flex-col gap-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#C2C8E0 transparent' }}>

            {/* Loyiha + Nomi */}
            <div className="grid grid-cols-2 gap-4">
              <ProjectDropdownLocal value={form.project} onChange={v => set('project', v)} error={errors.project} projects={projects} disabled={ro} />
              <div>
                <label className={labelCls}>Nomi</label>
                <input value={form.title} onChange={e => !ro && set('title', e.target.value)}
                  readOnly={ro} placeholder="Nomi yozing" className={inputCls(errors.title, ro)} />
                {errors.title && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
              </div>
            </div>

            {/* Tavsifi */}
            <div>
              <label className={labelCls}>Tavsifi</label>
              <div className="relative">
                <textarea value={form.description} onChange={e => !ro && set('description', e.target.value)}
                  readOnly={ro} placeholder="Tavsifni yozing" rows={3}
                  className={inputCls(false, ro) + ' resize-none pr-8'} />
                {form.description && !ro && (
                  <button type="button" onClick={() => set('description', '')}
                    className="absolute top-2.5 right-2.5 text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer">
                    <FaXmark size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Holati + Darajasi + Turi */}
            <div className="grid grid-cols-3 gap-4">
              <SelectDropdown label="Holati" value={form.status} onChange={v => set('status', v)} options={STATUS_OPTIONS} placeholder="Holati" disabled={ro} />

              <SelectDropdown label="Darajasi" value={form.priority} onChange={v => set('priority', v)} options={PRIORITY_OPTIONS} placeholder="Daraja" disabled={ro} error={errors.priority} />

              <SelectDropdown label="Turi" value={form.type} onChange={v => set('type', v)} options={TYPE_OPTIONS} placeholder="Turi" disabled={ro} error={errors.type} />
            </div>

            {/* Batafsil tugmasi */}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer bg-[var(--bg-elevation-1)] text-[var(--text-strong)]`}
              >
                <span className="flex-1 text-left truncate">Batafsil</span>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} />
                </div>
              </button>
            </div>

            <div className={`grid transition-all duration-300 ease-in-out ml-1 ${showDetails ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden flex flex-col gap-4">

                {/* Topshiruvchi */}
                <div>
                  <label className={labelCls}>Topshiruvchi</label>
                  {/* in_progress statusida topshiruvchi o'zgartirilmaydi */}
                  {form.status === 'in_progress' && !ro && (
                    <p className="text-xs text-amber-500 dark:text-amber-400 mb-1.5">
                      ⚠ Jarayondagi vazifada topshiruvchi o'zgartirilmaydi
                    </p>
                  )}
                  <button type="button"
                    onClick={() => !ro && form.project && form.status !== 'in_progress' ? setPickerOpen(true) : null}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border
                      ${ro || !form.project || form.status === 'in_progress'
                        ? 'cursor-default bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]'
                        : 'cursor-pointer bg-[var(--bg-base)] hover:border-[var(--accent-sub)]'}
                      border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]`}>
                    <span className={assigneeLabel ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)] flex-1 text-left truncate' : 'text-[var(--text-sub)] flex-1 text-left'}>
                      {!form.project ? "Avval loyiha tanlang" : (assigneeLabel || 'Topshiruvchi tanlang')}
                    </span>
                    {!ro && form.project && form.status !== 'in_progress' && (
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {form.assignees.length > 0 && (
                          <span onMouseDown={e => { e.stopPropagation(); set('assignees', []) }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer">
                            <FaXmark size={11} />
                          </span>
                        )}
                        <FaChevronDown size={11} className="text-[var(--text-soft)]" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Lavozim + Sprint */}
                <div className="grid grid-cols-2 gap-4">
                  <SelectDropdown label="Lavozim" value={form.position} onChange={v => set('position', v)} options={positionOptions} placeholder="Lavozim tanlang" disabled={ro} />
                  <div>
                    <label className={labelCls}>Sprint raqami <span className="text-[var(--text-soft)] font-normal">(1–10)</span></label>
                    <input type="text" inputMode="numeric" value={form.sprint}
                      onChange={e => !ro && handleSprint(e.target.value)}
                      readOnly={ro} placeholder="1" className={inputCls(errors.sprint, ro)} />
                    {errors.sprint && <p className="text-xs text-red-500 mt-1">{typeof errors.sprint === 'string' ? errors.sprint : '*Xato'}</p>}
                  </div>
                </div>

                {/* Vazifa narxi + Jarima */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Vazifa narxi (UZS)</label>
                    <input type="text" inputMode="numeric" value={form.task_price}
                      onChange={e => !ro && !isEmployee && set('task_price', formatPrice(e.target.value))}
                      readOnly={ro || isEmployee} placeholder="0" className={inputCls(false, ro || isEmployee) + ' text-right'} />
                  </div>
                  <div>
                    <label className={labelCls}>Jarima foizi (%) <span className="text-[var(--text-soft)] font-normal">(0–100)</span></label>
                    <input type="text" inputMode="decimal" value={form.penalty_percentage}
                      onChange={e => !ro && !isEmployee && handlePenalty(e.target.value)}
                      readOnly={ro || isEmployee} placeholder="0" className={inputCls(false, ro || isEmployee)} />
                  </div>
                </div>
              </div>
            </div>

            {/* Muddati + Taxminiy vaqt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Muddati</label>
                <div className="grid grid-cols-2 gap-2">
                  <DateTimeBox
                    type="date"
                    placeholder="kk.oo.yyyy"
                    value={form.deadline}
                    onChange={v => {
                      if (!roDeadline) {
                        set('deadline', v);
                        if (v && (!form.deadline_time || form.deadline_time === "00:00")) {
                          set('deadline_time', "23:59");
                        }
                      }
                    }}
                    disabled={roDeadline}
                    dropUp
                  />
                  <DateTimeBox
                    type="time"
                    value={form.deadline_time}
                    onChange={v => !roDeadline && set('deadline_time', v)}
                    disabled={roDeadline}
                    dropUp
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Taxminiy vaqt (soat : daqiqa)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="0" value={form.estimated_hours}
                    onChange={e => !ro && set('estimated_hours', e.target.value)}
                    readOnly={ro} placeholder="0 soat" className={inputCls(false, ro)} />
                  <input type="number" min="0" max="59" value={form.estimated_minutes}
                    onChange={e => !ro && set('estimated_minutes', e.target.value)}
                    readOnly={ro} placeholder="0 daqiqa" className={inputCls(false, ro)} />
                </div>
              </div>
            </div>

            {/* Qo'shimcha fayllar */}
            {(!ro || existingAttachments.length > 0) && (
              <div>
                <label className={labelCls}>Qo'shimcha fayllar</label>
                <div className="flex flex-wrap gap-2">
                  {/* Existing attachments */}
                  {existingAttachments.map(att => (
                    <div key={att.id} className="relative w-20 h-20 rounded-xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] overflow-hidden bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] flex items-center justify-center group">
                      {isImage(att.file) ? (
                        <img src={att.file} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 px-1">
                          <FaPaperclip size={16} className="text-[var(--accent-sub)]" />
                          <span className="text-[9px] text-[var(--text-sub)] dark:text-[var(--text-sub)] text-center whitespace-normal break-words w-[75%] px-1">{getFilename(att.file.split('/').pop().split('?')[0])}</span>
                        </div>
                      )}
                      {/* View link */}
                      <a
                        href={att.file}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 z-10"
                        onClick={e => e.stopPropagation()}
                      />
                      {/* Delete button (edit mode only) */}
                      {!ro && (
                        <button
                          type="button"
                          onClick={e => { e.preventDefault(); handleDeleteAttachment(att.id) }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20"
                        >
                          <FaXmark size={9} />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* New (pending) attachments */}
                  {newAttachments.map((att, i) => (
                    <div key={`new-${i}`} className="relative w-20 h-20 rounded-xl border border-[var(--accent-sub)]/40 dark:border-[var(--accent-sub)]/40 overflow-hidden bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] flex items-center justify-center group">
                      {att.preview ? (
                        <img src={att.preview} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 px-1">
                          <FaPaperclip size={16} className="text-[var(--accent-sub)]" />
                          <span className="text-[9px] text-[var(--text-sub)] dark:text-[var(--text-sub)] text-center whitespace-normal break-words w-full px-1">{att.file.name}</span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setNewAttachments(prev => prev.filter((_, j) => j !== i))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <FaXmark size={9} />
                      </button>
                    </div>
                  ))}

                  {/* Add file button (edit mode only) */}
                  {!ro && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-20 h-20 rounded-xl border-2 border-dashed border-[#C2C8E0] dark:border-[var(--stroke-sub)] flex flex-col items-center justify-center gap-1 text-[var(--text-soft)] hover:border-[var(--accent-sub)] hover:text-[var(--accent-sub)] cursor-pointer transition-colors"
                      >
                        <FaPaperclip size={16} />
                        <span className="text-[10px] font-medium">Fayl</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                        className="hidden"
                        onChange={e => {
                          const files = Array.from(e.target.files || [])
                          const added = files.map(f => ({
                            file: f,
                            preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
                          }))
                          setNewAttachments(prev => [...prev, ...added])
                          e.target.value = ''
                        }}
                      />
                    </>
                  )}

                </div>
              </div>
            )}

            {/* Rad etish sababi */}
            {(task.status === 'rejected' || task.reopened_count > 0) && (task.rejection_reason || rejectionFiles.length > 0) && (
              <div>
                <label className="text-[11px]  text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-2 flex items-center gap-1.5">

                  Rad etish sabablari
                </label>
                <div className="rounded-2xl border border-[var(--stroke-sub)] dark:border-[#262C36] p-4 flex flex-col gap-3">


                  {rejectionFiles.length > 0 && (
                    <div>

                      <div className="flex flex-wrap gap-2">
                        {rejectionFiles.map(rf => (
                          <a
                            key={rf.id}
                            href={rf.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative w-16 h-16 rounded-xl border border-[var(--stroke-sub)] dark:border-[#262C36] overflow-hidden bg-[var(--bg-base)] dark:bg-[#1E0A0A] flex items-center justify-center group hover:opacity-80 transition-opacity"
                          >
                            {/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(rf.file) ? (
                              <img src={rf.file} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center gap-0.5 px-1">
                                <FaPaperclip size={14} className="text-[var(--text-sub)]" />
                                <span className="text-[8px] text-[var(--text-sub)] truncate w-full text-center">
                                  {decodeURIComponent((rf.file.split('/').pop() || 'fayl').split('?')[0])}
                                </span>
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejection reason — har bir yozuv alohida blok */}
                  {task.rejection_reason && (
                    <div className="flex flex-col gap-1">
                      {parseRejectionReason(task.rejection_reason).map((entry, idx) => (
                        <div key={idx} className="rounded-xl bg-[var(--bg-elevation-1)] dark:bg-[#1A0808] px-3 py-2.5">
                          {entry.date && (
                            <p className="text-[11px] font-semibold text-[var(--text-sub)]/70 dark:text-[var(--text-strong)] mb-1">
                              {entry.date}
                            </p>
                          )}
                          <p className="text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)] leading-relaxed whitespace-pre-wrap">
                            {entry.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            )}

          </div>

          {/* ── Footer ── */}
          <div className="px-7 py-5 flex items-center justify-between  shrink-0 rounded-b-3xl bg-[var(--bg-base)]">
            {/* O'chirish tugmasi — faqat onDelete prop berilganda */}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer text-[var(--error-sub)] hover:bg-[#FFF5F5] dark:hover:bg-[#1C0A0A] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
                O'chirish
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button onClick={handleClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]">
                <FaXmark size={13} /> Yopish
              </button>
              {canEdit && (
                <button onClick={handleSubmit} disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)] disabled:opacity-60">
                  {loading
                    ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                    : <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  }
                  Saqlash
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {showDiscard && (
        <DiscardModal
          onCancel={() => setShowDiscard(false)}
          onConfirm={() => { setShowDiscard(false); onClose() }}
        />
      )}
      {pickerOpen && !ro && (
        <UserPickerModal
          title="Topshiruvchi tanlang"
          selected={form.assignees}
          users={projectEmployees}
          onClose={() => setPickerOpen(false)}
          onConfirm={list => {
            set('assignees', list)
            if (list.length > 0) {
              const user = list[0]
              if (user.position) {
                const foundPos = positions.find(p => p.name === user.position)
                if (foundPos) {
                  set('position', String(foundPos.id))
                }
              }
            }
            setPickerOpen(false)
          }}
        />
      )}
    </>
  )
}
