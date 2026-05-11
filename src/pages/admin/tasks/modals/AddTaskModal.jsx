import { useState, useRef, useEffect } from "react"
import { FaXmark, FaArrowLeft, FaChevronDown, FaCheck, FaPaperclip } from "react-icons/fa6"
import { labelCls } from "../components/constants"
import { axiosAPI } from "../../../../service/axiosAPI"
import { toast } from "../../../../Toast/ToastProvider"
import { parseApiError } from "../../../../service/parseApiError"
import { DateTimeBox } from "../../Components/DateTimeBox"

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
function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])
  return { open, setOpen, ref }
}

function SelectDropdown({ label, value, onChange, options, placeholder, error }) {
  const { open, setOpen, ref } = useDropdown()
  const selected = options.find(o => o.value === value)
  return (
    <div ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border cursor-pointer
            bg-[var(--bg-base)]
            ${error ? "border-red-400" : "border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]"}
            ${value ? "text-[var(--text-strong)] dark:text-[var(--text-strong)]" : "text-[var(--text-sub)] dark:text-[var(--text-sub)]"}`}>
          <span className="flex-1 text-left truncate">{selected?.label || placeholder}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {value && <span onMouseDown={e => { e.stopPropagation(); onChange("") }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"><FaXmark size={11} /></span>}
            <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </button>
        {error && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
            {options.map((o, i) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer
                  ${i < options.length - 1 ? "border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]" : ""}
                  ${value === o.value ? "bg-[#EEF1FB] text-[var(--accent-strong)] font-semibold dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]" : "text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]"}`}>
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

function ProjectDropdownLocal({ value, onChange, error, projects }) {
  const { open, setOpen, ref } = useDropdown()
  const selected = projects.find(p => String(p.id) === String(value))

  return (
    <div ref={ref}>
      <label className={labelCls}>Loyiha</label>
      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border cursor-pointer
            bg-[var(--bg-base)]
            ${error ? 'border-red-400' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]'}
            ${value ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-sub)]'}`}
        >
          <span className="flex-1 text-left truncate">
            {selected ? selected.title : 'Loyiha tanlang'}
          </span>
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
        </button>

        {error && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}

        {/* Dropdown */}
        {open && (
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
                      {fmtProjectDate(p.deadline)}
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

function UserPickerModal({ title, selected, onConfirm, onClose, users }) {
  const [search, setSearch] = useState("")
  // Bitta tanlash � selected[0] yoki null
  const [temp, setTemp] = useState(selected?.length > 0 ? selected[0] : null)
  const filtered = users.filter(u =>
    (u.username ?? "").toLowerCase().includes(search.toLowerCase())
  )

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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-[var(--bg-base)] flex flex-col overflow-hidden" style={{ height: 700, maxHeight: "90vh" }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0 border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
          <div className="flex items-center gap-3 mb-3">
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
        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {filtered.length === 0 && <p className="text-sm text-[var(--text-soft)] text-center py-8">Foydalanuvchi topilmadi</p>}
          {filtered.map(u => {
            const isSel = temp?.id === u.id
            return (
              <button key={u.id} onClick={() => setTemp(isSel ? null : u)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer text-left transition-colors
                  ${isSel ? "bg-[#EEF1FB] border-[var(--accent-sub)] dark:bg-[var(--bg-elevation-2)] dark:border-[var(--accent-strong)]" : "bg-[var(--bg-base)] border-[var(--stroke-sub)] hover:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] dark:hover:bg-[var(--bg-elevation-1)]"}`}>
                {/* Radio circle */}
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                  ${isSel ? "bg-[var(--accent-strong)] border-[var(--accent-strong)]" : "border-[var(--stroke-strong)] dark:border-[var(--stroke-sub)]"}`}>
                  {isSel && <div className="w-2 h-2 rounded-full bg-[var(--bg-base)]" />}
                </div>
                <div className="w-9 h-9 rounded-full bg-[var(--accent-sub)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent-sub)] shrink-0">
                  {u.username?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text-strong)] dark:text-[var(--text-strong)] truncate">{u.username}</p>
                  <p className="text-xs text-[var(--text-soft)] truncate">{u.position || "Ko'rsatilmagan"}</p>
                </div>
              </button>
            )
          })}
        </div>
        {/* Footer */}
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

export default function AddTaskModal({ onClose, onAdd, isEmployee }) {
  const [projects, setProjects] = useState([])
  const [positions, setPositions] = useState([])
  const [projectEmployees, setProjectEmployees] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // project-shorts � tezroq endpoint (faqat ro'yxat uchun)
    axiosAPI.get("/project-shorts/", { params: { page_size: 200 } })
      .then(res => {
        const payload = res.data?.data ?? res.data
        const list = Array.isArray(payload) ? payload : (payload.results ?? [])
        setProjects(Array.isArray(list) ? list : [])
      }).catch(() => {
        axiosAPI.get("/projects/", { params: { page_size: 100 } })
          .then(res => {
            const payload = res.data?.data ?? res.data
            const list = Array.isArray(payload) ? payload : (payload.results ?? [])
            setProjects(Array.isArray(list) ? list : [])
          }).catch(() => setProjects([]))
      })

    axiosAPI.get("/applications/positions/", { params: { page_size: 100 } })
      .then(res => {
        const payload = res.data?.data ?? res.data
        const list = Array.isArray(payload) ? payload : (payload.results ?? [])
        setPositions(Array.isArray(list) ? list : [])
      }).catch(() => { })
  }, [])

  const [form, setForm] = useState({
    project: "", title: "", description: "", priority: "low", type: "bug",
    assignees: [], position: "", sprint: "", task_price: "", penalty_percentage: "",
    deadline: "", deadline_time: "00:00", estimated_hours: "", estimated_minutes: "",
  })
  const [errors, setErrors] = useState({})
  const [attachments, setAttachments] = useState([]) // { file, preview, id? }
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
  const set = (k, v) => {
    if (k === 'project') {
      setForm(p => ({ ...p, project: v, assignees: [] }))
      setErrors(p => ({ ...p, project: false }))
      setProjectEmployees([])
      if (v) {
        // Loyiha xodimlarini yuklash
        axiosAPI.get(`/projects/${v}/`)
          .then(res => {
            const proj = res.data?.data ?? res.data
            const emps = proj?.employees_info ?? []
            setProjectEmployees(Array.isArray(emps) ? emps : [])
          })
          .catch(() => setProjectEmployees([]))
      }
      return
    }
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: false }))
  }

  // Topshiruvchi uchun foydalanuvchilar ro'yxati
  // projectEmployees bo'sh bo'lsa � allUsers ni ko'rsatamiz

  // Narxni formatlash: raqam va nuqta, max 12 xona, minglik ajratgich
  const formatPrice = (val) => {
    // Nuqtadan keyin 2 ta raqam
    const clean = val.replace(/[^\d.]/g, '').replace(/^(\d*\.?\d{0,2}).*$/, '$1')
    const [int, dec] = clean.split('.')
    const formatted = (int || '').slice(0, 12).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
    return dec !== undefined ? `${formatted}.${dec}` : formatted
  }

  // Foiz: 0�100
  const handlePenalty = (val) => {
    set('penalty_percentage', normalizePercentInput(val))
  }

  // Sprint: 1�10
  const handleSprint = (val) => {
    const digits = val.replace(/\D/g, '')
    if (digits === '') { set('sprint', ''); return }
    const num = Math.min(10, Math.max(1, parseInt(digits, 10)))
    set('sprint', String(num))
  }

  const validate = () => {
    const e = {}
    if (!form.project) e.project = true
    if (!form.title.trim()) e.title = true
    if (!form.priority) e.priority = true
    if (!form.type) e.type = true
    if (form.sprint && (isNaN(Number(form.sprint)) || Number(form.sprint) > 10 || Number(form.sprint) < 1)) {
      e.sprint = "Sprint 1 dan 10 gacha bo'lishi kerak"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputCls = err =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border bg-[var(--bg-base)] text-[var(--text-strong)] placeholder-[var(--text-sub)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)] ${err ? "border-red-400" : "border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] focus:border-[var(--accent-sub)]"}`

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      // API sxemasiga mos body
      const body = {
        project: Number(form.project),
        title: form.title.trim(),
        priority: form.priority,
        type: form.type,
        status: 'todo',
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

      // 1. Task yaratish
      const created = await onAdd(body)
      const taskId = created?.id ?? created?.data?.id

      // 2. Fayllarni yuklash (task yaratilgandan keyin)
      if (taskId && attachments.length > 0) {
        const uploadResults = await Promise.allSettled(
          attachments.map(att => {
            const fd = new FormData()
            fd.append('task', taskId)
            fd.append('file', att.file)
            return axiosAPI.post('/task-attachments/', fd, {
              headers: { 'Content-Type': 'multipart/form-data' }
            })
          })
        )
        uploadResults.forEach((result, i) => {
          if (result.status === 'rejected') {
            const fname = attachments[i]?.file?.name || 'fayl'
            toast.error(`"${fname}" yuklanmadi`, parseApiError(result.reason, "Fayl yuklashda xatolik"))
          }
        })
      }

      onClose()
    } catch {
      // Xatolik Tasks.jsx handleAdd da ko'rsatiladi
    } finally {
      setLoading(false)
    }
  }

  const positionOptions = positions.map(p => ({ label: p.name, value: String(p.id) }))
  const assigneeLabel = form.assignees.map(u => u.username).join(", ")

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !pickerOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, pickerOpen]);  

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="fixed top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer z-[200]">
          <FaXmark size={14} />
        </button>
        <div className="relative w-full max-w-[600px] flex flex-col rounded-3xl shadow-2xl bg-[var(--bg-base)] overflow-hidden" style={{ height: 700, maxHeight: '90vh' }}>

          {/* -- Header (qotgan) -- */}
          <div className="px-7 pt-7 pb-4 shrink-0  rounded-t-3xl">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0"><FaArrowLeft size={17} /></button>
              <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Vazifa qo'shish</h2>
            </div>
            <p className="text-sm text-[var(--text-sub)] ">Yangi vazifa yaratish uchun ma'lumotlarni kiriting</p>
          </div>

          {/* -- Scroll qilinadigan content -- */}
          <div className="flex-1 overflow-y-auto px-7 py-4 pb-6 flex flex-col gap-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#C2C8E0 transparent' }}>

            {/* Loyiha + Nomi */}
            <div className="grid grid-cols-2 gap-4">
              <ProjectDropdownLocal value={form.project} onChange={v => set("project", v)} error={errors.project} projects={projects} />
              <div>
                <label className={labelCls}>Nomi</label>
                <input value={form.title} onChange={e => set("title", e.target.value)}
                  placeholder="Nomi yozing" className={inputCls(errors.title)} />
                {errors.title && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
              </div>
            </div>

            {/* Tavsifi */}
            <div>
              <label className={labelCls}>Tavsifi</label>
              <div className="relative">
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="Tavsifni yozing" rows={3} className={inputCls(false) + " resize-none pr-8"} />
                {form.description && (
                  <button type="button" onClick={() => set("description", "")}
                    className="absolute top-2.5 right-2.5 text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer">
                    <FaXmark size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Darajasi + Turi */}
            <div className="grid grid-cols-2 gap-4">
              <SelectDropdown label="Darajasi" value={form.priority} onChange={v => set("priority", v)} options={PRIORITY_OPTIONS} placeholder="Daraja" error={errors.priority} />
              <SelectDropdown label="Turi" value={form.type} onChange={v => set("type", v)} options={TYPE_OPTIONS} placeholder="Turi" error={errors.type} />
            </div>

            {/* Topshiruvchi */}
            <div>
              <label className={labelCls}>Topshiruvchi</label>
              <button type="button"
                onClick={() => form.project ? setPickerOpen(true) : null}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border
                  ${form.project ? 'cursor-pointer bg-[var(--bg-base)] hover:border-[var(--accent-sub)]' : 'cursor-default bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]'}
                  border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]`}
              >
                <span
                  className={assigneeLabel ? "text-[var(--text-strong)] dark:text-[var(--text-strong)] flex-1 text-left truncate" : "text-[var(--text-sub)] flex-1 text-left"}
                >
                  {!form.project ? "Avval loyiha tanlang" : (assigneeLabel || "Topshiruvchi tanlang")}
                </span>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {form.assignees.length > 0 && (
                    <span
                      onMouseDown={e => { e.stopPropagation(); set("assignees", []) }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"
                    >
                      <FaXmark size={11} />
                    </span>
                  )}
                  {form.project && <FaChevronDown size={11} className="text-[var(--text-soft)]" />}
                </div>
              </button>
            </div>

            {/* Lavozim + Sprint */}
            <div className="grid grid-cols-2 gap-4">
              <SelectDropdown
                label="Lavozim"
                value={form.position}
                onChange={v => set("position", v)}
                options={positionOptions}
                placeholder="Lavozim tanlang"
              />
              <div>
                <label className={labelCls}>Sprint raqami </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.sprint}
                  onChange={e => handleSprint(e.target.value)}
                  placeholder="1"
                  className={inputCls(errors.sprint)}
                />
                {errors.sprint && <p className="text-xs text-red-500 mt-1">{typeof errors.sprint === 'string' ? errors.sprint : '*Xato'}</p>}
              </div>
            </div>

            {/* Vazifa narxi + Jarima */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Vazifa narxi (UZS)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.task_price}
                  onChange={e => set('task_price', formatPrice(e.target.value))}
                  placeholder="0"
                  className={inputCls(false) + " text-right"}
                  disabled={isEmployee}
                />
              </div>
              <div>
                <label className={labelCls}>Jarima foizi (%) </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.penalty_percentage}
                  onChange={e => handlePenalty(e.target.value)}
                  placeholder="0"
                  className={inputCls(false)}
                  disabled={isEmployee}
                />
              </div>
            </div>

            {/* Muddati + Taxminiy vaqt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Muddati</label>
                <div className="grid grid-cols-2 gap-2">
                  <DateTimeBox
                    type="date"
                    placeholder="Sana tanlash"
                    value={form.deadline}
                    onChange={v => {
                      set("deadline", v);
                      if (v && (!form.deadline_time || form.deadline_time === "00:00")) {
                        set("deadline_time", "23:59");
                      }
                    }}
                    dropUp
                  />
                  <DateTimeBox
                    type="time"
                    value={form.deadline_time}
                    onChange={v => set("deadline_time", v)}
                    dropUp
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Taxminiy vaqt (soat : daqiqa)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="0" value={form.estimated_hours} onChange={e => set("estimated_hours", e.target.value)}
                    placeholder="0 soat" className={inputCls(false)} />
                  <input type="number" min="0" max="59" value={form.estimated_minutes} onChange={e => set("estimated_minutes", e.target.value)}
                    placeholder="0 daqiqa" className={inputCls(false)} />
                </div>
              </div>
            </div>

            {/* Qo'shimcha fayllar */}
            <div>
              <label className={labelCls}>Qo'shimcha fayllar</label>
              <div className="flex flex-wrap gap-2">
                {/* Yuklangan fayllar */}
                {attachments.map((att, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] overflow-hidden bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] flex items-center justify-center group">
                    {att.preview ? (
                      <img src={att.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 px-1">
                        <FaPaperclip size={16} className="text-[var(--accent-sub)]" />
                        <span className="text-[9px] text-[var(--text-sub)] dark:text-[var(--text-sub)] text-center truncate w-full px-1">{att.file.name}</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <FaXmark size={9} />
                    </button>
                  </div>
                ))}

                {/* Fayl qo'shish tugmasi */}
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
                    const newAtts = files.map(f => ({
                      file: f,
                      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
                    }))
                    setAttachments(prev => [...prev, ...newAtts])
                    e.target.value = ''
                  }}
                />
              </div>
            </div>

          </div>

          {/* -- Footer (qotgan) -- */}
          <div className="px-7 py-5 flex items-center justify-end gap-3  shrink-0 rounded-b-3xl bg-[var(--bg-base)]">
            <button onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]">
              <FaXmark size={13} /> Yopish
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)] disabled:opacity-60">
              {loading
                ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                : <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              }
              Qo'shish
            </button>
          </div>

        </div>
      </div>

      {pickerOpen && (
        <UserPickerModal
          title="Topshiruvchi tanlang"
          selected={form.assignees}
          users={projectEmployees}
          onClose={() => setPickerOpen(false)}
          onConfirm={list => {
            set("assignees", list)
            if (list.length > 0) {
              const user = list[0]
              if (user.position) {
                const foundPos = positions.find(p => p.name === user.position)
                if (foundPos) {
                  set("position", String(foundPos.id))
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
