import { useState, useRef, useEffect } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown, FaCheck, FaPaperclip } from 'react-icons/fa6'
import { labelCls, PROJECTS_LIST } from '../components/constants'
import { axiosAPI } from '../../../../service/axiosAPI'
import { toast } from '../../../../Toast/ToastProvider'
import { DateTimeBox } from '../../Components/DateTimeBox'

const PRIORITY_OPTIONS = [
  { label: 'Past',    value: 'low' },
  { label: "O'rta",  value: 'medium' },
  { label: 'Yuqori', value: 'high' },
  { label: 'Kritik', value: 'critical' },
]
const TYPE_OPTIONS = [
  { label: 'Xato',           value: 'bug' },
  { label: 'Yangi funksiya', value: 'feature' },
  { label: "Qo'shimcha",    value: 'improvement' },
]
const STATUS_OPTIONS = [
  { label: 'Bajarilishi kerak', value: 'todo' },
  { label: 'Jarayonda',         value: 'in_progress' },
  { label: 'Bajarilgan',        value: 'done' },
  { label: 'Ishga tushirilgan', value: 'deployed' },
  { label: 'Tekshirilgan',      value: 'reviewed' },
  { label: 'Rad etilgan',       value: 'rejected' },
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
            ${disabled ? 'cursor-default bg-[#F8F9FC] dark:bg-[#1A1B1B]' : 'cursor-pointer bg-white dark:bg-[#191A1A]'}
            ${error ? 'border-red-400' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
            ${value ? 'text-[#1A1D2E] dark:text-white' : 'text-[#5B6078] dark:text-[#5B6078]'}`}>
          <span className="flex-1 text-left truncate">{selected?.label || placeholder}</span>
          {!disabled && (
            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              {value && <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>}
              <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          )}
        </button>
        {error && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
        {open && !disabled && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
            {options.map((o, i) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer
                  ${i < options.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                  ${value === o.value ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectDropdownLocal({ value, onChange, error, projects, disabled }) {
  const { open, setOpen, ref } = useDropdown()
  const selected = projects.find(p => String(p.id) === String(value))
  return (
    <div ref={ref}>
      <label className={labelCls}>Loyiha</label>
      <div className="relative">
        <button type="button" onClick={() => !disabled && setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border
            ${disabled ? 'cursor-default bg-[#F8F9FC] dark:bg-[#1A1B1B]' : 'cursor-pointer bg-white dark:bg-[#191A1A]'}
            ${error ? 'border-red-400' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
            ${value ? 'text-[#1A1D2E] dark:text-white' : 'text-[#5B6078]'}`}>
          <span className="flex-1 text-left truncate">{selected?.title || selected?.name || 'Loyiha tanlang'}</span>
          {!disabled && (
            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              {value && <span onMouseDown={e => { e.stopPropagation(); onChange('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>}
              <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
            </div>
          )}
        </button>
        {error && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
        {open && !disabled && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
            {projects.map((p, i) => (
              <button key={p.id} type="button" onClick={() => { onChange(String(p.id)); setOpen(false) }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer
                  ${i < projects.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                  ${String(value) === String(p.id) ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                <p className={`text-sm font-medium truncate ${String(value) === String(p.id) ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white'}`}>
                  {p.title || p.name}
                </p>
              </button>
            ))}
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111] flex flex-col overflow-hidden" style={{ height: 700, maxHeight: '90vh' }}>
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer"><FaArrowLeft size={16} /></button>
            <h2 className="text-lg font-extrabold text-[#1A1D2E] dark:text-white">{title}</h2>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Ism bo'yicha izlash" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none border bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#5B6078] dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white focus:border-[#526ED3]" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-2">
          {filtered.length === 0 && <p className="text-sm text-[#8F95A8] text-center py-8">Foydalanuvchi topilmadi</p>}
          {filtered.map(u => {
            const isSel = temp?.id === u.id
            return (
              <button key={u.id} onClick={() => setTemp(isSel ? null : u)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer text-left
                  ${isSel ? 'bg-[#EEF1FB] border-[#526ED3] dark:bg-[#292A2A] dark:border-[#3F57B3]' : 'bg-white border-[#EEF1F7] hover:bg-[#F8F9FC] dark:bg-[#191A1A] dark:border-[#292A2A] dark:hover:bg-[#222323]'}`}>
                {/* Radio circle */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                  ${isSel ? 'bg-[#3F57B3] border-[#3F57B3]' : 'border-[#D0D5E2] dark:border-[#474848]'}`}>
                  {isSel && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <div className="w-9 h-9 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                  {u.username?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1A1D2E] dark:text-white truncate">{u.username}</p>
                  <p className="text-xs text-[#8F95A8] truncate">{u.position_info?.name || u.roles?.[0] || '—'}</p>
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-6 py-4 border-t border-[#EEF1F7] dark:border-[#292A2A] flex items-center justify-between shrink-0">
          <span className="text-sm text-[#5B6078] dark:text-[#C2C8E0]">{temp ? '1 ta tanlangan' : 'Tanlanmagan'}</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setTemp(null)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
              <FaXmark size={12} /> Tozalash
            </button>
            <button onClick={() => onConfirm(temp ? [temp] : [])} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
              <FaCheck size={12} /> Tanlash
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EditTaskModal({ task, onClose, onSave, canEdit = true }) {
  const [projects, setProjects] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [positions, setPositions] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  // Existing attachments from the task
  const [existingAttachments, setExistingAttachments] = useState(
    Array.isArray(task.attachments) ? task.attachments : []
  )
  // New files to upload after save
  const [newAttachments, setNewAttachments] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    axiosAPI.get('/projects/', { params: { page_size: 100 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setProjects(Array.isArray(list) ? list : PROJECTS_LIST)
      }).catch(() => setProjects(PROJECTS_LIST))
    axiosAPI.get('/users/', { params: { page_size: 200 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setAllUsers(Array.isArray(list) ? list : [])
      }).catch(() => {})
    axiosAPI.get('/applications/positions/', { params: { page_size: 100 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setPositions(Array.isArray(list) ? list : [])
      }).catch(() => {})
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

  const initHours     = task.estimated_minutes ? String(Math.floor(task.estimated_minutes / 60)) : ''
  const initMins      = task.estimated_minutes ? String(task.estimated_minutes % 60) : ''
  const initAssignees = task.assignee_info ? [task.assignee_info] : []
  const initProject   = task.project
    ? String(task.project)
    : (task.project_info && typeof task.project_info === 'object' ? String(task.project_info.id) : '')

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
    project:            initProject,
    title:              task.title              || '',
    description:        task.description        || '',
    priority:           task.priority           || 'low',
    type:               task.type               || 'bug',
    status:             task.status             || 'todo',
    assignees:          initAssignees,
    position:           task.position_info      ? String(task.position_info.id) : '',
    sprint:             task.sprint             ? String(task.sprint) : '',
    task_price:         fmtPrice(task.task_price),
    penalty_percentage: task.penalty_percentage ? String(Math.abs(parseFloat(task.penalty_percentage))) : '',
    deadline:           initDeadlineDate,
    deadline_time:      initDeadlineTime,
    estimated_hours:    initHours,
    estimated_minutes:  initMins,
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    if (k === 'project') {
      setForm(p => ({ ...p, project: v, assignees: [] }))
      setErrors(p => ({ ...p, project: false }))
      return
    }
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: false }))
  }

  const selectedProject = projects.find(p => String(p.id) === String(form.project))
  const projectEmployees = (() => {
    if (!selectedProject) return []
    if (selectedProject.employees_info?.length) return selectedProject.employees_info
    if (selectedProject.employees?.length) {
      return allUsers.filter(u => selectedProject.employees.includes(u.id))
    }
    return []
  })()

  const formatPrice = (val) => {
    const clean = val.replace(/[^\d.]/g, '').replace(/^(\d*\.?\d{0,2}).*$/, '$1')
    const [int, dec] = clean.split('.')
    const formatted = (int || '').slice(0, 12).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return dec !== undefined ? `${formatted}.${dec}` : formatted
  }

  const handlePenalty = (val) => {
    const digits = val.replace(/\D/g, '')
    if (!digits) { set('penalty_percentage', ''); return }
    set('penalty_percentage', String(Math.min(100, Math.max(0, parseInt(digits, 10)))))
  }

  const handleSprint = (val) => {
    const digits = val.replace(/\D/g, '')
    if (!digits) { set('sprint', ''); return }
    set('sprint', String(Math.min(10, Math.max(1, parseInt(digits, 10)))))
  }

  const validate = () => {
    const e = {}
    if (!form.project)      e.project  = true
    if (!form.title.trim()) e.title    = true
    if (!form.priority)     e.priority = true
    if (!form.type)         e.type     = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputCls = (err, ro) =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border text-[#1A1D2E] placeholder-[#5B6078] dark:text-white dark:placeholder-[#5B6078]
    ${ro ? 'bg-[#F8F9FC] dark:bg-[#1A1B1B] cursor-default' : 'bg-white dark:bg-[#191A1A]'}
    ${err ? 'border-red-400' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
    ${!ro ? 'focus:border-[#526ED3]' : ''}`

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
    if (!validate()) return
    setLoading(true)
    try {
      const body = {
        project:  Number(form.project),
        title:    form.title.trim(),
        priority: form.priority,
        type:     form.type,
        status:   form.status,
      }
      if (form.description.trim()) body.description = form.description.trim()
      if (form.assignees.length)   body.assignee    = form.assignees[0].id
      if (form.position)           body.position    = Number(form.position)
      if (form.sprint)             body.sprint      = Number(form.sprint)
      if (form.task_price)         body.task_price  = form.task_price.replace(/\s/g, '')
      if (form.penalty_percentage) body.penalty_percentage = form.penalty_percentage
      if (form.deadline) {
        const t = form.deadline_time || '00:00'
        const now = new Date()
        const offsetMin = -now.getTimezoneOffset()
        const sign = offsetMin >= 0 ? '+' : '-'
        const absMin = Math.abs(offsetMin)
        const hh = String(Math.floor(absMin / 60)).padStart(2, '0')
        const mm = String(absMin % 60).padStart(2, '0')
        body.deadline = `${form.deadline}T${t}:00${sign}${hh}:${mm}`
      }
      const hrs  = parseInt(form.estimated_hours, 10) || 0
      const mins = parseInt(form.estimated_minutes, 10) || 0
      if (hrs || mins) {
        body.estimated_input_hours   = hrs
        body.estimated_input_minutes = mins
      }

      // 1. Save the task
      await onSave(task.id, body)

      // 2. Upload new attachments
      if (newAttachments.length > 0) {
        await Promise.allSettled(
          newAttachments.map(att => {
            const fd = new FormData()
            fd.append('task', task.id)
            fd.append('file', att.file)
            return axiosAPI.post('/task-attachments/', fd, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
          })
        )
      }

      onClose()
    } catch (err) {
      const details = err?.response?.data?.error?.details
      const errorMsg = err?.response?.data?.error?.errorMsg || 'Vazifa yangilashda xatolik'
      if (details && typeof details === 'object') {
        const msgs = Object.entries(details).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join('\n')
        toast.error('Xatolik', msgs || errorMsg)
      } else {
        toast.error('Xatolik', errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }

  const positionOptions = positions.map(p => ({ label: p.name, value: String(p.id) }))
  const assigneeLabel   = form.assignees.map(u => u.username).join(', ')
  const ro = !canEdit

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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="fixed top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer z-[200]">
          <FaXmark size={14} />
        </button>
        <div className="relative w-full max-w-[600px] flex flex-col rounded-3xl shadow-2xl bg-white dark:bg-[#111111] overflow-hidden" style={{ height: 700, maxHeight: '90vh' }}>

          {/* ── Header ── */}
          <div className="px-7 pt-7 pb-4 shrink-0 border-b border-[#F1F3F9] dark:border-[#292A2A] rounded-t-3xl">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0"><FaArrowLeft size={17} /></button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">
                {canEdit ? 'Vazifa tahrirlash' : "Vazifa ma'lumotlari"}
              </h2>
            </div>
            <p className="text-sm text-[#5B6078] ml-8">
              {canEdit ? "Vazifa ma'lumotlarini yangilash uchun o'zgartirishlar kiriting" : "Vazifa haqida batafsil ma'lumot"}
            </p>
          </div>

          {/* ── Scrollable content ── */}
          <div className="flex-1 overflow-y-auto px-7 py-4 pb-6 flex flex-col gap-4">

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
                    className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                    <FaXmark size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Holati + Darajasi + Turi */}
            <div className="grid grid-cols-3 gap-4">
              <SelectDropdown label="Holati"   value={form.status}   onChange={v => set('status', v)}   options={STATUS_OPTIONS}   placeholder="Holati"  disabled={ro} />
              <SelectDropdown label="Darajasi" value={form.priority} onChange={v => set('priority', v)} options={PRIORITY_OPTIONS} placeholder="Daraja"  disabled={ro} error={errors.priority} />
              <SelectDropdown label="Turi"     value={form.type}     onChange={v => set('type', v)}     options={TYPE_OPTIONS}     placeholder="Turi"    disabled={ro} error={errors.type} />
            </div>

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
                    ? 'cursor-default bg-[#F8F9FC] dark:bg-[#1A1B1B]'
                    : 'cursor-pointer bg-white dark:bg-[#191A1A] hover:border-[#526ED3]'}
                  border-[#E2E6F2] dark:border-[#292A2A]`}>
                <span className={assigneeLabel ? 'text-[#1A1D2E] dark:text-white flex-1 text-left truncate' : 'text-[#5B6078] flex-1 text-left'}>
                  {!form.project ? "Avval loyiha tanlang" : (assigneeLabel || 'Topshiruvchi tanlang')}
                </span>
                {!ro && form.project && form.status !== 'in_progress' && (
                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {form.assignees.length > 0 && (
                      <span onMouseDown={e => { e.stopPropagation(); set('assignees', []) }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                        <FaXmark size={11} />
                      </span>
                    )}
                    <FaChevronDown size={11} className="text-[#8F95A8]" />
                  </div>
                )}
              </button>
            </div>

            {/* Lavozim + Sprint */}
            <div className="grid grid-cols-2 gap-4">
              <SelectDropdown label="Lavozim" value={form.position} onChange={v => set('position', v)} options={positionOptions} placeholder="Lavozim tanlang" disabled={ro} />
              <div>
                <label className={labelCls}>Sprint raqami <span className="text-[#8F95A8] font-normal">(1–10)</span></label>
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
                  onChange={e => !ro && set('task_price', formatPrice(e.target.value))}
                  readOnly={ro} placeholder="0" className={inputCls(false, ro) + ' text-right'} />
              </div>
              <div>
                <label className={labelCls}>Jarima foizi (%) <span className="text-[#8F95A8] font-normal">(0–100)</span></label>
                <input type="text" inputMode="numeric" value={form.penalty_percentage}
                  onChange={e => !ro && handlePenalty(e.target.value)}
                  readOnly={ro} placeholder="0" className={inputCls(false, ro)} />
              </div>
            </div>

            {/* Muddati + Taxminiy vaqt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Muddati</label>
                <div className="grid grid-cols-2 gap-2">
                  <DateTimeBox
                    type="date"
                    placeholder="KK/OO/YYYY"
                    value={form.deadline}
                    onChange={v => !ro && set('deadline', v)}
                    disabled={ro}
                    dropUp
                  />
                  <DateTimeBox
                    type="time"
                    value={form.deadline_time}
                    onChange={v => !ro && set('deadline_time', v)}
                    disabled={ro}
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
            <div>
              <label className={labelCls}>Qo'shimcha fayllar</label>
              <div className="flex flex-wrap gap-2">

                {/* Existing attachments */}
                {existingAttachments.map(att => (
                  <div key={att.id} className="relative w-20 h-20 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] overflow-hidden bg-[#F8F9FC] dark:bg-[#191A1A] flex items-center justify-center group">
                    {isImage(att.file) ? (
                      <img src={att.file} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 px-1">
                        <FaPaperclip size={16} className="text-[#526ED3]" />
                        <span className="text-[9px] text-[#5B6078] dark:text-[#C2C8E0] text-center truncate w-full px-1">{getFilename(att.file)}</span>
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
                  <div key={`new-${i}`} className="relative w-20 h-20 rounded-xl border border-[#526ED3]/40 dark:border-[#526ED3]/40 overflow-hidden bg-[#F8F9FC] dark:bg-[#191A1A] flex items-center justify-center group">
                    {att.preview ? (
                      <img src={att.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 px-1">
                        <FaPaperclip size={16} className="text-[#526ED3]" />
                        <span className="text-[9px] text-[#5B6078] dark:text-[#C2C8E0] text-center truncate w-full px-1">{att.file.name}</span>
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
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-[#C2C8E0] dark:border-[#474848] flex flex-col items-center justify-center gap-1 text-[#8F95A8] hover:border-[#526ED3] hover:text-[#526ED3] cursor-pointer transition-colors"
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

          </div>

          {/* ── Footer ── */}
          <div className="px-7 py-5 flex items-center justify-end gap-3 border-t border-[#F1F3F9] dark:border-[#292A2A] shrink-0 rounded-b-3xl bg-white dark:bg-[#111111]">
            <button onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
              <FaXmark size={13} /> Yopish
            </button>
            {canEdit && (
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3] disabled:opacity-60">
                {loading
                  ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                }
                Saqlash
              </button>
            )}
          </div>

        </div>
      </div>

      {pickerOpen && !ro && (
        <UserPickerModal
          title="Topshiruvchi tanlang"
          selected={form.assignees}
          users={projectEmployees}
          onClose={() => setPickerOpen(false)}
          onConfirm={list => { set('assignees', list); setPickerOpen(false) }}
        />
      )}
    </>
  )
}
