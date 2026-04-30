import { useState, useRef, useEffect } from "react"
import { FaXmark, FaArrowLeft, FaChevronDown, FaCheck } from "react-icons/fa6"
import { labelCls, fmtNum, LEVELS, TYPES, PROJECTS_LIST, EMPLOYEES_LIST } from "../components/constants"
import { axiosAPI } from "../../../../service/axiosAPI"

/* ── SimpleDropdown ── */
function SimpleDropdown({ label, value, onChange, options, placeholder, error }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])
  return (
    <div ref={ref}>
      {label && <label className={labelCls}>{label}</label>}
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
            bg-white dark:bg-[#191A1A]
            ${error ? "border-red-400 dark:border-red-500" : "border-[#E2E6F2] dark:border-[#292A2A]"}
            ${value ? "text-[#1A1D2E] dark:text-white" : "text-[#5B6078] dark:text-[#5B6078]"}`}>
          <span className="flex-1 text-left truncate">{value || placeholder}</span>
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
              <button key={o} type="button" onClick={() => { onChange(o); setOpen(false) }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer
                  ${i < options.length - 1 ? "border-b border-[#F1F3F9] dark:border-[#2A2B2B]" : ""}
                  ${value === o ? "bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]" : "text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]"}`}>
                {o}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── ProjectDropdownLocal ── */
function ProjectDropdownLocal({ value, onChange, error, projects }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])
  const selected = projects.find(p => String(p.id) === String(value))
  return (
    <div ref={ref}>
      <label className={labelCls}>Loyiha</label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
            bg-white dark:bg-[#191A1A]
            ${error ? "border-red-400 dark:border-red-500" : "border-[#E2E6F2] dark:border-[#292A2A]"}
            ${value ? "text-[#1A1D2E] dark:text-white" : "text-[#5B6078] dark:text-[#5B6078]"}`}>
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
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer
                  ${i < projects.length - 1 ? "border-b border-[#F1F3F9] dark:border-[#2A2B2B]" : ""}
                  ${String(value) === String(p.id) ? "bg-[#EEF1FB] dark:bg-[#292A2A]" : "hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]"}`}>
                <div className="min-w-0">
                  <p className={`text-sm font-medium truncate ${String(value) === String(p.id) ? "text-[#3F57B3] dark:text-[#7F95E6]" : "text-[#1A1D2E] dark:text-white"}`}>{p.title || p.name}</p>
                  {p.description && <p className="text-xs text-[#8F95A8] truncate mt-0.5">{p.description}</p>}
                </div>
                {p.deadline && <span className="text-xs text-[#8F95A8] shrink-0 ml-3">{p.deadline?.split("T")[0]}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── UserPickerModal ── */
function UserPickerModal({ title, selected, onConfirm, onClose, users }) {
  const [search, setSearch] = useState("")
  const [temp, setTemp] = useState(selected ? [selected] : [])

  const filtered = users.filter(u =>
    (u.username ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.position ?? "").toLowerCase().includes(search.toLowerCase())
  )

  const toggle = (u) => {
    setTemp(prev => prev.find(x => x.id === u.id) ? prev.filter(x => x.id !== u.id) : [...prev, u])
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-full max-w-[520px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111] flex flex-col max-h-[80vh]">
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer">
              <FaArrowLeft size={16} />
            </button>
            <h2 className="text-lg font-extrabold text-[#1A1D2E] dark:text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setTemp(temp.length === filtered.length ? [] : [...filtered])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer
                border-[#E2E6F2] text-[#5B6078] hover:bg-[#F1F3F9] dark:border-[#292A2A] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
              </svg>
              Barchini tanlash
            </button>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input type="text" placeholder="Ism Sharifi bo'yicha izlash" value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none border transition-colors
                  bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#5B6078]
                  dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white focus:border-[#526ED3]" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-2">
          {filtered.map(u => {
            const isSel = temp.find(x => x.id === u.id)
            return (
              <button key={u.id} onClick={() => toggle(u)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors cursor-pointer text-left
                  ${isSel ? "bg-[#EEF1FB] border-[#C7D0F5] dark:bg-[#292A2A] dark:border-[#3F57B3]" : "bg-white border-[#EEF1F7] hover:bg-[#F8F9FC] dark:bg-[#191A1A] dark:border-[#292A2A] dark:hover:bg-[#222323]"}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                  ${isSel ? "bg-[#3F57B3] border-[#3F57B3]" : "border-[#D0D5E2] dark:border-[#474848]"}`}>
                  {isSel && <FaCheck size={9} className="text-white" />}
                </div>
                <div className="w-9 h-9 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                  {u.username?.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#1A1D2E] dark:text-white truncate">{u.username}</p>
                  <p className="text-xs text-[#8F95A8] dark:text-[#5B6078] truncate">{u.position || u.roles?.[0] || "—"}</p>
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-6 py-4 border-t border-[#EEF1F7] dark:border-[#292A2A] flex items-center justify-between shrink-0">
          <span className="text-sm text-[#5B6078] dark:text-[#C2C8E0]">{temp.length} ta tanlangan</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setTemp([])}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer
                text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
              <FaXmark size={12} /> Tozalash
            </button>
            <button onClick={() => onConfirm(temp)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer
                bg-[#3F57B3] text-white hover:bg-[#526ED3]">
              <FaCheck size={12} /> Qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── POSITIONS ── */
const POSITIONS = ["Dasturchi", "Dizayner", "QA", "HR", "Frontend", "Backend", "DevOps", "Menejer"]

/* ── Main Modal ── */
export default function AddTaskModal({ onClose, onAdd }) {
  const dateRef = useRef(null)
  const timeRef = useRef(null)

  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    axiosAPI.get("/projects/", { params: { page_size: 100 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setProjects(Array.isArray(list) ? list : PROJECTS_LIST)
      })
      .catch(() => setProjects(PROJECTS_LIST))

    axiosAPI.get("/users/", { params: { page_size: 100 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setUsers(Array.isArray(list) ? list : [])
      })
      .catch(() => setUsers([]))
  }, [])

  const [form, setForm] = useState({
    project: "", name: "", description: "", level: "", type: "",
    assignees: [], position: "", sprint: "", price: "", fine: "",
    deadline: "", time: "",
  })
  const [errors, setErrors] = useState({})
  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: false })) }

  const validate = () => {
    const e = {}
    if (!form.project)     e.project = true
    if (!form.name.trim()) e.name    = true
    if (!form.description.trim()) e.description = true
    if (!form.level)       e.level   = true
    if (!form.type)        e.type    = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputCls = err =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors
    bg-white text-[#1A1D2E] placeholder-[#5B6078]
    dark:bg-[#191A1A] dark:text-white dark:placeholder-[#5B6078]
    ${err ? "border-red-400 dark:border-red-500" : "border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]"}`

  const assigneeLabel = form.assignees.length > 0
    ? form.assignees.map(u => u.username).join(", ")
    : ""

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="fixed top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer transition-colors z-200">
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
                <input value={form.name} onChange={e => set("name", e.target.value)}
                  placeholder="Nomi yozing" className={inputCls(errors.name)} />
                {errors.name && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
              </div>
            </div>

            {/* Tavsifi */}
            <div>
              <label className={labelCls}>Tavsifi</label>
              <div className="relative">
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="Tavsifni yozing" rows={3} className={inputCls(errors.description) + " resize-none pr-8"} />
                {form.description && (
                  <button type="button" onClick={() => set("description", "")}
                    className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                    <FaXmark size={12} />
                  </button>
                )}
              </div>
              {errors.description && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
            </div>

            {/* Darajasi + Turi */}
            <div className="grid grid-cols-2 gap-4">
              <SimpleDropdown label="Darajasi" value={form.level} onChange={v => set("level", v)} options={LEVELS} placeholder="Darajasi tanlang" error={errors.level} />
              <SimpleDropdown label="Turi"     value={form.type}  onChange={v => set("type", v)}  options={TYPES}  placeholder="Turi tanlang"     error={errors.type} />
            </div>

            {/* Topshiruvchi */}
            <div>
              <label className={labelCls}>Topshiruvchi</label>
              <button type="button" onClick={() => setPickerOpen(true)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
                  bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A] hover:border-[#526ED3]`}>
                <span className={assigneeLabel ? "text-[#1A1D2E] dark:text-white flex-1 text-left truncate" : "text-[#5B6078] flex-1 text-left"}>
                  {assigneeLabel || "Topshiruvchi"}
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

            {/* Kimlar uchun + Sprint */}
            <div className="grid grid-cols-2 gap-4">
              <SimpleDropdown label="Kimlar uchun" value={form.position} onChange={v => set("position", v)} options={POSITIONS} placeholder="Tanlang" />
              <div>
                <label className={labelCls}>Sprint tartib raqami</label>
                <input type="number" min="0" value={form.sprint} onChange={e => set("sprint", e.target.value)}
                  placeholder="0" className={inputCls(false)} />
              </div>
            </div>

            {/* Vazifa narxi + Jarima */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Vazifa narxi (UZS)</label>
                <input value={form.price} onChange={e => set("price", fmtNum(e.target.value))}
                  placeholder="0.00" className={inputCls(false) + " text-right"} />
              </div>
              <div>
                <label className={labelCls}>Jarima foizi (%)</label>
                <input value={form.fine} onChange={e => set("fine", e.target.value.replace(/\D/g, ""))}
                  placeholder="Jarima" className={inputCls(false)} />
              </div>
            </div>

            {/* Muddati + Taxminiy vaqt */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Muddati</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                  <input ref={dateRef} type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)}
                    className={`flex-1 min-w-0 text-sm outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden
                      ${!form.deadline ? "[&::-webkit-datetime-edit]:opacity-0" : "text-[#1A1D2E] dark:text-white"}`} />
                  <button type="button" onClick={() => dateRef.current?.showPicker?.()}
                    className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Taxminiy vaqt</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                  <input ref={timeRef} type="time" value={form.time || "00:00"} onChange={e => set("time", e.target.value === "00:00" ? "" : e.target.value)}
                    step="60"
                    className={`flex-1 min-w-0 text-sm outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden
                      ${!form.time ? "text-[#B6BCCB] dark:text-[#474848]" : "text-[#1A1D2E] dark:text-white"}`} />
                  <button type="button" onClick={() => timeRef.current?.showPicker?.()}
                    className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </button>
                </div>
              </div>
            </div>

          </div>

          <div className="px-7 py-5 flex items-center justify-end gap-3">
            <button onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
              <FaXmark size={13} /> Yopish
            </button>
            <button onClick={() => {
              if (!validate()) return
              onAdd({
                ...form,
                id: Date.now(),
                code: "TASD",
                creator: "Admin",
                assignee: form.assignees.map(u => u.username).join(", "),
              })
              onClose()
            }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Qo'shish
            </button>
          </div>

        </div>
      </div>

      {pickerOpen && (
        <UserPickerModal
          title="Topshruvchi tanlang"
          selected={form.assignees}
          users={users}
          onClose={() => setPickerOpen(false)}
          onConfirm={list => { set("assignees", list); setPickerOpen(false) }}
        />
      )}
    </>
  )
}