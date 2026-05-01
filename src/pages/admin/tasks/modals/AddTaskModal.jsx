import { useState, useRef, useEffect } from "react"
import { FaXmark, FaArrowLeft, FaChevronDown, FaCheck } from "react-icons/fa6"
import { labelCls, PROJECTS_LIST } from "../components/constants"
import { axiosAPI } from "../../../../service/axiosAPI"
import { toast } from "../../../../Toast/ToastProvider"

const PRIORITY_OPTIONS = [
  { label: 'Past',    value: 'low' },
  { label: "O'rta",  value: 'medium' },
  { label: 'Yuqori', value: 'high' },
  { label: 'Kritik', value: 'critical' },
]
const TYPE_OPTIONS = [
  { label: 'Xato',           value: 'bug' },
  { label: 'Yangi funksiya', value: 'feature' },
  { label: 'Vazifa',         value: 'task' },
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
            bg-white dark:bg-[#191A1A]
            ${error ? "border-red-400" : "border-[#E2E6F2] dark:border-[#292A2A]"}
            ${value ? "text-[#1A1D2E] dark:text-white" : "text-[#5B6078] dark:text-[#5B6078]"}`}>
          <span className="flex-1 text-left truncate">{selected?.label || placeholder}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {value && <span onMouseDown={e => { e.stopPropagation(); onChange("") }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>}
            <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </button>
        {error && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
            {options.map((o, i) => (
              <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer
                  ${i < options.length - 1 ? "border-b border-[#F1F3F9] dark:border-[#2A2B2B]" : ""}
                  ${value === o.value ? "bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]" : "text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]"}`}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectDropdownLocal({ value, onChange, error, projects }) {
  const { open, setOpen, ref } = useDropdown()
  const selected = projects.find(p => String(p.id) === String(value))
  return (
    <div ref={ref}>
      <label className={labelCls}>Loyiha</label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border cursor-pointer
            bg-white dark:bg-[#191A1A]
            ${error ? "border-red-400" : "border-[#E2E6F2] dark:border-[#292A2A]"}
            ${value ? "text-[#1A1D2E] dark:text-white" : "text-[#5B6078]"}`}>
          <span className="flex-1 text-left truncate">{selected?.title || selected?.name || "Loyiha tanlang"}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {value && <span onMouseDown={e => { e.stopPropagation(); onChange("") }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>}
            <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </button>
        {error && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
            {projects.map((p, i) => (
              <button key={p.id} type="button" onClick={() => { onChange(String(p.id)); setOpen(false) }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer
                  ${i < projects.length - 1 ? "border-b border-[#F1F3F9] dark:border-[#2A2B2B]" : ""}
                  ${String(value) === String(p.id) ? "bg-[#EEF1FB] dark:bg-[#292A2A]" : "hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]"}`}>
                <p className={`text-sm font-medium truncate ${String(value) === String(p.id) ? "text-[#3F57B3] dark:text-[#7F95E6]" : "text-[#1A1D2E] dark:text-white"}`}>
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

function UserPickerModal({ title, selected, onConfirm, onClose, users }) {
  const [search, setSearch] = useState("")
  const [temp, setTemp] = useState(selected ? [...selected] : [])
  const filtered = users.filter(u =>
    (u.username ?? "").toLowerCase().includes(search.toLowerCase())
  )
  const toggle = (u) => setTemp(prev => prev.find(x => x.id === u.id) ? prev.filter(x => x.id !== u.id) : [...prev, u])
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-full max-w-[520px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111] flex flex-col max-h-[80vh]">
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
            const isSel = temp.find(x => x.id === u.id)
            return (
              <button key={u.id} onClick={() => toggle(u)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer text-left
                  ${isSel ? "bg-[#EEF1FB] border-[#C7D0F5] dark:bg-[#292A2A] dark:border-[#3F57B3]" : "bg-white border-[#EEF1F7] hover:bg-[#F8F9FC] dark:bg-[#191A1A] dark:border-[#292A2A] dark:hover:bg-[#222323]"}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSel ? "bg-[#3F57B3] border-[#3F57B3]" : "border-[#D0D5E2] dark:border-[#474848]"}`}>
                  {isSel && <FaCheck size={9} className="text-white" />}
                </div>
                <div className="w-9 h-9 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                  {u.username?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1A1D2E] dark:text-white truncate">{u.username}</p>
                  <p className="text-xs text-[#8F95A8] truncate">{u.position_info?.name || u.roles?.[0] || "—"}</p>
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-6 py-4 border-t border-[#EEF1F7] dark:border-[#292A2A] flex items-center justify-between shrink-0">
          <span className="text-sm text-[#5B6078] dark:text-[#C2C8E0]">{temp.length} ta tanlangan</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setTemp([])} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
              <FaXmark size={12} /> Tozalash
            </button>
            <button onClick={() => onConfirm(temp)} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
              <FaCheck size={12} /> Qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AddTaskModal({ onClose, onAdd }) {
  const dateRef = useRef(null)
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [positions, setPositions] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    axiosAPI.get("/projects/", { params: { page_size: 100 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setProjects(Array.isArray(list) ? list : PROJECTS_LIST)
      }).catch(() => setProjects(PROJECTS_LIST))

    axiosAPI.get("/users/", { params: { page_size: 200 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setUsers(Array.isArray(list) ? list : [])
      }).catch(() => {})

    axiosAPI.get("/applications/positions/", { params: { page_size: 100 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setPositions(Array.isArray(list) ? list : [])
      }).catch(() => {})
  }, [])

  const [form, setForm] = useState({
    project: "", title: "", description: "", priority: "low", type: "task", status: "todo",
    assignees: [], position: "", sprint: "", task_price: "", penalty_percentage: "",
    deadline: "", estimated_hours: "", estimated_minutes: "",
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: false })) }

  const validate = () => {
    const e = {}
    if (!form.project)      e.project = true
    if (!form.title.trim()) e.title   = true
    if (!form.priority)     e.priority = true
    if (!form.type)         e.type    = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputCls = err =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border bg-white text-[#1A1D2E] placeholder-[#5B6078] dark:bg-[#191A1A] dark:text-white dark:placeholder-[#5B6078] ${err ? "border-red-400" : "border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]"}`

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
        body.deadline = `${form.deadline}T00:00:00.000000+05:00`
      }
      const hrs  = parseInt(form.estimated_hours, 10) || 0
      const mins = parseInt(form.estimated_minutes, 10) || 0
      if (hrs || mins) {
        body.estimated_input_hours   = hrs
        body.estimated_input_minutes = mins
      }
      await onAdd(body)
      onClose()
    } catch {
      // error handled in parent
    } finally {
      setLoading(false)
    }
  }

  const positionOptions = positions.map(p => ({ label: p.name, value: String(p.id) }))
  const assigneeLabel = form.assignees.map(u => u.username).join(", ")

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="fixed top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer z-[200]">
          <FaXmark size={14} />
        </button>
        <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">

          <div className="px-7 pt-7 pb-4">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0"><FaArrowLeft size={17} /></button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Vazifa qo'shish</h2>
            </div>
            <p className="text-sm text-[#5B6078] ml-8">Yangi vazifa yaratish uchun ma'lumotlarni kiriting</p>
          </div>

          <div className="px-7 pb-4 flex flex-col gap-4">

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
                    className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                    <FaXmark size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Holati + Darajasi + Turi */}
            <div className="grid grid-cols-3 gap-4">
              <SelectDropdown label="Holati"   value={form.status}   onChange={v => set("status", v)}   options={STATUS_OPTIONS}   placeholder="Holati" />
              <SelectDropdown label="Darajasi" value={form.priority} onChange={v => set("priority", v)} options={PRIORITY_OPTIONS} placeholder="Daraja" error={errors.priority} />
              <SelectDropdown label="Turi"     value={form.type}     onChange={v => set("type", v)}     options={TYPE_OPTIONS}     placeholder="Turi"   error={errors.type} />
            </div>

            {/* Topshiruvchi */}
            <div>
              <label className={labelCls}>Topshiruvchi</label>
              <button type="button" onClick={() => setPickerOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border cursor-pointer bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A] hover:border-[#526ED3]">
                <span className={assigneeLabel ? "text-[#1A1D2E] dark:text-white flex-1 text-left truncate" : "text-[#5B6078] flex-1 text-left"}>
                  {assigneeLabel || "Topshiruvchi tanlang"}
                </span>
                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {form.assignees.length > 0 && (
                    <span onMouseDown={e => { e.stopPropagation(); set("assignees", []) }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                      <FaXmark size={11} />
                    </span>
                  )}
                  <FaChevronDown size={11} className="text-[#8F95A8]" />
                </div>
              </button>
            </div>

            {/* Lavozim + Sprint */}
            <div className="grid grid-cols-2 gap-4">
              <SelectDropdown label="Lavozim" value={form.position} onChange={v => set("position", v)} options={positionOptions} placeholder="Lavozim tanlang" />
              <div>
                <label className={labelCls}>Sprint raqami</label>
                <input type="number" min="0" value={form.sprint} onChange={e => set("sprint", e.target.value)}
                  placeholder="0" className={inputCls(false)} />
              </div>
            </div>

            {/* Vazifa narxi + Jarima */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Vazifa narxi (UZS)</label>
                <input value={form.task_price} onChange={e => set("task_price", e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder="0.00" className={inputCls(false) + " text-right"} />
              </div>
              <div>
                <label className={labelCls}>Jarima foizi (%)</label>
                <input value={form.penalty_percentage} onChange={e => set("penalty_percentage", e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder="0" className={inputCls(false)} />
              </div>
            </div>

            {/* Muddati + Taxminiy vaqt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Muddati</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3]">
                  <input ref={dateRef} type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)}
                    className={`flex-1 min-w-0 text-sm outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${!form.deadline ? "[&::-webkit-datetime-edit]:opacity-0" : "text-[#1A1D2E] dark:text-white"}`} />
                  <button type="button" onClick={() => dateRef.current?.showPicker?.()}
                    className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3]">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  </button>
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

          </div>

          <div className="px-7 py-5 flex items-center justify-end gap-3 border-t border-[#F1F3F9] dark:border-[#292A2A]">
            <button onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
              <FaXmark size={13} /> Yopish
            </button>
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3] disabled:opacity-60">
              {loading
                ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                : <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
          users={users}
          onClose={() => setPickerOpen(false)}
          onConfirm={list => { set("assignees", list); setPickerOpen(false) }}
        />
      )}
    </>
  )
}
