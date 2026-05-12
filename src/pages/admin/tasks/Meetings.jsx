import { useState, useEffect, useRef, useCallback } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown, FaCheck, FaPlus, FaCopy } from 'react-icons/fa6'
import { usePageAction } from '../../../context/PageActionContext'
import { useAuth } from '../../../context/AuthContext'
import EmptyState from '../../../components/EmptyState'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'
import { parseApiError } from '../../../service/parseApiError'
import { DateTimeBox } from '../Components/DateTimeBox'
import { MeetingAttendanceModal } from '../../../components/MeetingModals'
import { PiCopyBold } from 'react-icons/pi'

const labelCls = 'block text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1.5'
const DURATION_UNITS = ['daqiqa']

/* -- helpers -- */
const fmtDt = (iso) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

const toIso = (date, time) => {
  if (!date) return null
  const t = time || '00:00'
  const now = new Date()
  const offsetMin = -now.getTimezoneOffset()
  const sign = offsetMin >= 0 ? '+' : '-'
  const absMin = Math.abs(offsetMin)
  const hh = String(Math.floor(absMin / 60)).padStart(2, '0')
  const mm = String(absMin % 60).padStart(2, '0')
  return `${date}T${t}:00${sign}${hh}:${mm}`
}

// Filter uchun sana+vaqt ? ISO+timezone
const toIsoWithOffset = (date, time) => toIso(date, time)

const fromIso = (iso) => {
  if (!iso) return { date: '', time: '' }
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return { date: '', time: '' }
    // Local vaqtni ishlatamiz (UTC emas)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const hh = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` }
  } catch { return { date: '', time: '' } }
}

const durationToMinutes = (val) => {
  const n = parseInt(val, 10)
  if (!n || isNaN(n)) return null
  return n
}

const minutesToDisplay = (mins) => {
  if (!mins) return { val: '', unit: 'daqiqa' }
  return { val: String(mins), unit: 'daqiqa' }
}

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

/* -- useDropdown -- */
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

/* -- ProjectDropdown  real API -- */
function ProjectDropdown({ value, onChange, error, projects = [], disabled = false }) {
  const { open, setOpen, ref } = useDropdown()
  const selected = projects.find(p => p.id === value)
  return (
    <div ref={ref}>
      <label className={labelCls}>Loyiha</label>
      <div className="relative">
        <button type="button"
          onClick={() => !disabled && setOpen(o => !o)}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border
            ${disabled ? 'cursor-default bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)]' : 'cursor-pointer bg-[var(--bg-base)]'}
            ${error ? 'border-red-400' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]'}
            ${selected ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}`}>
          <span className="flex-1 text-left truncate">{selected?.title || 'Loyiha tanlang'}</span>
          {!disabled && (
            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              {selected
                ? <span onMouseDown={e => { e.stopPropagation(); onChange(null) }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"><FaXmark size={11} /></span>
                : <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${open ? 'rotate-180' : ''}`} />
              }
            </div>
          )}
        </button>
        {error && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
        {open && !disabled && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
            {projects.length === 0 && (
              <p className="px-4 py-3 text-sm text-[var(--text-soft)]">Loyihalar topilmadi</p>
            )}
            {projects.map((p, i) => (
              <button key={p.id} type="button" onClick={() => { onChange(p.id); setOpen(false) }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left  cursor-pointer
                  ${i < projects.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''}
                  ${value === p.id ? 'bg-[#EEF1FB] dark:bg-[var(--bg-elevation-2)]' : 'hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'}`}>
                <p className={`text-sm font-medium truncate ${value === p.id ? 'text-[var(--accent-strong)] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)]'}`}>{p.title}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* -- ParticipantsModal  real users API -- */
function ParticipantsModal({ selected, onClose, onApply, users = [] }) {
  const [search, setSearch] = useState('')
  const [sel, setSel] = useState(new Set(selected.map(u => u.id ?? u)))

  const filtered = users.filter(u =>
    (u.username ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.position_info?.name ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const allSelected = filtered.length > 0 && filtered.every(u => sel.has(u.id))

  const toggle = id => setSel(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })
  const toggleAll = () => {
    if (allSelected) setSel(prev => { const s = new Set(prev); filtered.forEach(u => s.delete(u.id)); return s })
    else setSel(prev => { const s = new Set(prev); filtered.forEach(u => s.add(u.id)); return s })
  }

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
      <div className="fixed inset-0 bg-black/10" />
      <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer  z-[200]">
        <FaXmark size={14} />
      </button>
      <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-[var(--bg-base)] flex flex-col overflow-hidden" style={{ height: 700, maxHeight: "90vh" }}>
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer"><FaArrowLeft size={16} /></button>
            <h2 className="text-[18px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Yig'ilishga qatnashishlar</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]
                text-[var(--text-sub)] dark:text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-1)] cursor-pointer  shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
              Barchasini tanlash
            </button>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism bo'yicha izlash"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]
                  bg-[var(--bg-base)] text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-soft)]" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-2 flex flex-col gap-2">
          {filtered.length === 0 && <p className="text-sm text-[var(--text-soft)] text-center py-8">Foydalanuvchi topilmadi</p>}
          {filtered.map(u => {
            const checked = sel.has(u.id)
            return (
              <button key={u.id} type="button" onClick={() => toggle(u.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border  cursor-pointer text-left
                  ${checked ? 'border-[var(--accent-sub)] bg-[#EEF1FB] dark:bg-[#1E2340] dark:border-[var(--accent-sub)]'
                    : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-base)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-1)]'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 
                  ${checked ? 'bg-[var(--accent-strong)] border-[var(--accent-strong)]' : 'border-[var(--stroke-strong)] dark:border-[var(--stroke-sub)]'}`}>
                  {checked && <FaCheck size={9} className="text-white" />}
                </div>
                <div className="w-8 h-8 rounded-full bg-[var(--accent-sub)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent-sub)] shrink-0">
                  {(u.username ?? '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold truncate ${checked ? 'text-[var(--accent-strong)] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)]'}`}>{u.username}</p>
                  <p className="text-xs text-[var(--text-soft)] truncate">{u.position_info?.name || u.position || '—'}</p>
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-3 shrink-0 border-t border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
          <span className="text-sm text-[var(--text-soft)]">{sel.size} ta tanlangan</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setSel(new Set())}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]
                hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-1)] cursor-pointer ">
              <FaXmark size={12} /> Tozalash
            </button>
            <button onClick={() => onApply(users.filter(u => sel.has(u.id)))}
              className="flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-bold bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)] cursor-pointer ">
              <FaCheck size={12} /> Qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -- AddMeetingModal -- */
function AddMeetingModal({ onClose, loadMeetings }) {
  const [showParticipants, setShowParticipants] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [projectMembers, setProjectMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    axiosAPI.get('/projects/', { params: { page_size: 100 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setProjects(Array.isArray(list) ? list : [])
      }).catch(() => { })
  }, [])
  const [form, setForm] = useState({
    project: null, title: '', fine: '', link: '', description: '',
    date: '', time: '', durationVal: '',
    participants: [], is_completed: false,
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const handleFine = (val) => {
    set('fine', normalizePercentInput(val))
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !showParticipants) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, showParticipants]);

  // Loyha o'zgarganda qatnashchilarni tozalash va xodimlarni yuklash
  const handleProjectChange = (v) => {
    setForm(p => ({ ...p, project: v, participants: [] }))
    setErrors(p => ({ ...p, project: '' }))
    setProjectMembers([])
    if (v) {
      setMembersLoading(true)
      axiosAPI.get(`/projects/${v}/`)
        .then(res => {
          const proj = res.data?.data ?? res.data
          const emps = proj?.employees_info ?? []
          const testers = proj?.testers_info ?? []
          const manager = proj?.manager_info ? [proj.manager_info] : []
          const all = [...emps, ...testers, ...manager]
          const seen = new Set()
          setProjectMembers(all.filter(u => { if (seen.has(u.id)) return false; seen.add(u.id); return true }))
        })
        .catch(() => setProjectMembers([]))
        .finally(() => setMembersLoading(false))
    }
  }

  const validate = () => {
    const e = {}
    if (!form.project) e.project = true
    if (!form.title.trim()) e.title = true
    if (!form.description.trim()) e.description = true
    if (!form.link.trim()) e.link = true
    if (!form.date) e.date = true
    if (!form.time) e.time = true
    if (!form.durationVal || isNaN(parseInt(form.durationVal, 10))) e.durationVal = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputCls = err =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border  bg-[var(--bg-base)] text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-soft)] dark:placeholder-[var(--text-sub)] ${err ? 'border-red-400' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] focus:border-[var(--accent-sub)]'}`

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const body = {
        project: form.project,
        title: form.title.trim(),
        is_completed: form.is_completed,
        participants: form.participants.map(u => u.id),
      }
      if (form.description.trim()) body.description = form.description.trim()
      if (form.link.trim()) body.link = form.link.trim()
      const fineNum = parseFloat(form.fine)
      if (fineNum > 0) body.penalty_percentage = String(fineNum)
      const startIso = toIso(form.date, form.time)
      if (startIso) body.start_time = startIso
      const mins = parseInt(form.durationVal, 10)
      if (mins && !isNaN(mins)) body.duration_minutes = mins

      const res = await axiosAPI.post('/meetings/', body)
      toast.success("Yig'ilish yaratildi", "Yangi yig'ilish muvaffaqiyatli qo'shildi")
      loadMeetings()
      onClose()
    } catch (err) {
      const errData = err?.response?.data
      const details = errData?.error?.details
      if (details && typeof details === 'object') {
        const msgs = Object.entries(details)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
          .join('\n')
        toast.error('Xatolik', msgs)
      } else {
        const msg = errData?.error?.errorMsg
          || errData?.detail
          || "Yig'ilish yaratishda xatolik"
        toast.error('Xatolik', msg)
      }
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer  z-[200]">
          <FaXmark size={14} />
        </button>
        <div className="relative w-full max-w-[600px] flex flex-col rounded-3xl shadow-2xl bg-[var(--bg-base)] overflow-hidden" style={{ height: 700, maxHeight: "90vh" }}>

          {/* -- Header (qotgan) -- */}
          <div className="px-7 pt-7 pb-3 shrink-0 ">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0"><FaArrowLeft size={17} /></button>
              <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Yig'ilish qo'shish</h2>
            </div>
            <p className="text-sm text-[var(--text-soft)] ">Yangi yig'ilish yaratish uchun ma'lumotlarni kiriting</p>
          </div>

          {/* -- Scroll qilinadigan content -- */}
          <div className="flex-1 overflow-y-auto px-7 py-4 flex flex-col gap-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#C2C8E0 transparent' }}>
            <ProjectDropdown value={form.project} onChange={handleProjectChange} error={errors.project} projects={projects} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nomi</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Nomi yozing" className={inputCls(errors.title)} />
                {errors.title && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
              </div>
              <div>
                <label className={labelCls}>Jarima foizi (%)</label>
                <input type="text" inputMode="decimal" value={form.fine} onChange={e => handleFine(e.target.value)}
                  placeholder="Jarima foizini kiriting" className={inputCls(false)} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Havolasi</label>
              <div className="relative">
                <input value={form.link} onChange={e => set('link', e.target.value)}
                  placeholder="URL manzil kiriting" className={inputCls(errors.link) + (form.link ? ' pr-9' : '')} />
                {form.link && (
                  <button type="button" title="Nusxa olish"
                    onClick={() => { navigator.clipboard.writeText(form.link); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000) }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors text-[var(--text-soft)] hover:text-[var(--text-strong)]">
                    {copiedLink ? <FaCheck size={12} className="text-green-500" /> : <PiCopyBold size={12} />}
                  </button>
                )}
              </div>
              {errors.link && <p className="text-xs text-red-500 mt-1">*To'g'ri URL manzil kiriting</p>}
            </div>

            <div>
              <label className={labelCls}>Tavsifi</label>
              <div className="relative">
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Tavsifni yozing" rows={3}
                  className={inputCls(errors.description) + ' resize-none pr-8'} />
                {form.description && (
                  <button type="button" onClick={() => set('description', '')}
                    className="absolute top-2.5 right-2.5 text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer">
                    <FaXmark size={12} />
                  </button>
                )}
              </div>
              {errors.description && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Boshlanish sanasi</label>
                <DateTimeBox
                  type="date"
                  placeholder="kk.oo.yyyy"
                  value={form.date}
                  onChange={v => {
                    set('date', v)
                    if (v && (!form.time || form.time === '00:00')) {
                      set('time', '23:59')
                    }
                  }}
                  error={errors.date}
                  dropUp
                />
                {errors.date && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
              </div>
              <div>
                <label className={labelCls}>Vaqti</label>
                <DateTimeBox
                  type="time"
                  placeholder="SS:DD"
                  value={form.time}
                  onChange={v => set('time', v)}
                  error={errors.time}
                  dropUp
                />
                {errors.time && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
              </div>
              <div>
                <label className={labelCls}>Davomiyligi</label>
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border bg-[var(--bg-base)] focus-within:border-[var(--accent-sub)] ${errors.durationVal ? 'border-red-400' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]'}`}>
                  <input min="1" value={form.durationVal} onChange={e => set('durationVal', e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                    className="flex-1 min-w-0 w-8 text-sm outline-none bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-soft)]" />
                  <span className="shrink-0 text-xs text-[var(--text-soft)] dark:text-[var(--text-sub)] whitespace-nowrap">daqiqa</span>
                </div>
                {errors.durationVal && <p className="text-xs text-red-500 mt-1">*Kiriting</p>}
              </div>
            </div>

            <div>
              <label className={labelCls}>Yig'ilish qatnashchilari</label>
              <div
                onClick={() => form.project && !membersLoading ? setShowParticipants(true) : null}
                className={`w-full min-h-[100px] rounded-[24px] border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-base)] p-3 flex flex-col transition-all
                  ${!form.project || membersLoading ? 'cursor-default' : 'cursor-pointer hover:border-[var(--accent-sub)]'}
                  ${form.participants.length === 0 ? 'items-center justify-center' : 'items-start justify-start'}`}
              >
                {form.participants.length === 0 ? (
                  <>
                    <p className="text-sm text-[var(--text-sub)] dark:text-[var(--text-soft)] mb-4 text-center">
                      {membersLoading ? 'Yuklanmoqda...' : !form.project ? 'Avval loyiha tanlang' : 'Quyidagi tugma orqali qidiring va tanlang'}
                    </p>
                    <div className={`inline-flex items-center gap-1 p-2 rounded-xl text-sm font-medium
                      ${!form.project || membersLoading
                        ? 'bg-[#F1F3F9] text-[#C2C8E0] dark:bg-[var(--bg-elevation-1)] dark:text-[#474848]'
                        : 'bg-[#dadff0] dark:bg-[#3a3b3b] text-black dark:text-[var(--accent-soft)] cursor-pointer'}`}>
                      {membersLoading ? (
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                      ) : (
                        <FaPlus size={15} />
                      )}
                      {membersLoading ? 'Yuklanmoqda...' : !form.project ? 'Loyiha tanlanmagan' : "Qatnashchilarni qo'shing"}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {form.participants.map(u => (
                      <div key={u.id} className="inline-flex items-center gap-1 px-1 py-0.5 rounded-xl bg-[#F1F3F9] dark:bg-[var(--bg-elevation-1)] text-[var(--text-strong)] dark:text-[var(--text-strong)] text-xs border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]">
                        <span className="font-medium text-[13px]">
                          {u.username}{(u.position_info?.name || u.position) ? ` | ${u.position_info?.name || u.position}` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={ev => { ev.stopPropagation(); set('participants', form.participants.filter(p => p.id !== u.id)) }}
                          className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ml-1 cursor-pointer"
                        >
                          <FaXmark size={12} className="text-[var(--text-soft)]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* -- Footer (qotgan) -- */}
          <div className="px-7 py-5 flex items-center justify-end gap-3 shrink-0 bg-[var(--bg-base)]">

            {/* <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium text-[var(--text-strong)] dark:text-[var(--text-sub)]">Tugatildimi?</span>
              <button type="button" onClick={() => set('is_completed', !form.is_completed)}
                className={`relative w-10 h-5 rounded-full cursor-pointer ${form.is_completed ? 'bg-black dark:bg-[var(--bg-base)]' : 'bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)]'}`}>
                <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-[var(--bg-base)] shadow transition-transform duration-200 ${form.is_completed ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div> */}
            <div className="flex items-center gap-3">
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
      </div>
      {showParticipants && (
        <ParticipantsModal selected={form.participants} users={projectMembers}
          onClose={() => setShowParticipants(false)}
          onApply={vals => { set('participants', vals); setShowParticipants(false) }} />
      )}
    </>
  )
}

/* -- AttendanceItem -- */
function AttendanceItem({ attendance }) {
  const [expanded, setExpanded] = useState(false);
  const participant = attendance?.user_info;
  const username = participant?.username || 'Noma\'lum';
  const position = participant?.position || 'Xodim';
  const initials = username.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();

  return (
    <div className="flex flex-col gap-2 py-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {participant?.avatar ? (
            <img src={participant?.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-[#9CA3AF] flex items-center justify-center text-white text-[13px] font-semibold shrink-0">
              {initials}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-[13px] font-medium text-[var(--text-strong)] leading-tight">{username}</span>
            <span className="text-[11px] text-[var(--text-soft)]">{position}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {attendance.is_attended ? (
            <div className="px-4 py-1.5 rounded-full bg-[#7A8CEB] text-white text-[11px] font-medium">
              Qatnashdi
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-white text-[11px] font-medium transition-colors cursor-pointer ${attendance.is_excused ? 'bg-[#22C55E] hover:bg-[#16a34a]' : 'bg-[#EF4444] hover:bg-[#dc2626]'}`}
            >
              {attendance.is_excused ? 'Qatnashmadi | Sababli' : 'Qatnashmadi | Sababsiz'}
              <FaChevronDown size={10} className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {!attendance.is_attended && (
        <div
          className={`grid transition-all duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0 mt-0'}`}
        >
          <div className="overflow-hidden">
            <textarea
              readOnly
              value={attendance.absence_reason || ''}
              placeholder="Sabab ko'rsatilmagan"
              className={`w-full p-3 rounded-xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-base)] text-[13px] text-[var(--text-strong)] outline-none min-h-[75px] ${!attendance.absence_reason && attendance?.absence_reason?.length !== 0 ? "resize-none!" : "resize-y!"}`}
            />
          </div>
        </div>
      )}
    </div >
  )
}

/* -- EditMeetingModal -- */
function EditMeetingModal({ meeting, onClose, canEdit = true, onFinish, onSaved }) {
  const [showParticipants, setShowParticipants] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copyLink, setCopyLink] = useState(null)
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])

  useEffect(() => {
    axiosAPI.get('/projects/', { params: { page_size: 100 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setProjects(Array.isArray(list) ? list : [])
      }).catch(() => { })
    axiosAPI.get('/users/all/', { params: { page_size: 200 } })
      .then(res => {
        const list = res.data?.results ?? res.data?.data?.results ?? res.data ?? []
        setUsers(Array.isArray(list) ? list : [])
      }).catch(() => { })
  }, [])

  const { date: initDate, time: initTime } = fromIso(meeting.start_time)
  const { val: initDurVal, unit: initDurUnit } = minutesToDisplay(meeting.duration_minutes)

  const [form, setForm] = useState({
    project: meeting.project ?? null,
    title: meeting.title ?? '',
    fine: meeting.penalty_percentage ? String(Math.abs(parseFloat(meeting.penalty_percentage))) : '',
    link: meeting.link ?? '',
    description: meeting.description ?? '',
    date: initDate,
    time: initTime,
    durationVal: initDurVal,
    participants: meeting.participants_info ?? [],
    is_completed: meeting.is_completed ?? false,
    attendances: meeting.attendances ?? []
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const handleFine = (val) => {
    set('fine', normalizePercentInput(val))
  }

  const validate = () => {
    const e = {}
    if (!form.project) e.project = true
    if (!form.title.trim()) e.title = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputCls = (err, ro = !canEdit) =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-soft)] dark:placeholder-[var(--text-sub)] ${ro ? 'bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] cursor-default' : 'bg-[var(--bg-base)]'} ${err ? 'border-red-400' : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]'} ${!ro ? 'focus:border-[var(--accent-sub)]' : ''}`

  const handleSubmit = async () => {
    if (!canEdit) return
    if (!validate()) return
    setLoading(true)
    try {
      const body = {
        project: form.project,
        title: form.title.trim(),
        participants: form.participants.map(u => u.id),
      }
      if (form.description.trim()) body.description = form.description.trim()
      if (form.link.trim()) body.link = form.link.trim()
      const fineNum = parseFloat(form.fine)
      if (fineNum > 0) body.penalty_percentage = String(fineNum)
      const startIso = toIso(form.date, form.time)
      if (startIso) body.start_time = startIso
      const mins = durationToMinutes(form.durationVal)
      if (mins) body.duration_minutes = mins

      const res = await axiosAPI.put(`/meetings/${meeting?.id}/`, body)

      toast.success("Yig'ilish yangilandi", "O'zgarishlar muvaffaqiyatli saqlandi")
      onSaved?.()
      onClose()
    } catch (error) {
      console.error(error)
      const errData = error?.response?.data?.error;

      // Field-level detail xatolarini chiqarish (masalan: password, name ...)
      let errMsg = "Xatolik yuz berdi" || error?.response?.data?.error?.errorMsg;
      if (errData?.details && typeof errData.details === 'object') {
        const detailMsgs = Object.values(errData.details).flat().join(' ');
        if (detailMsgs) errMsg = detailMsgs;
      } else if (errData?.errorMsg) {
        errMsg = errData.errorMsg;
      } else if (typeof error?.response?.data === 'string') {
        errMsg = error.response.data;
      }

      toast.error(errMsg);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !showParticipants) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, showParticipants]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer  z-[200]">
          <FaXmark size={14} />
        </button>
        <div className="relative w-full max-w-[600px] flex flex-col rounded-3xl shadow-2xl bg-[var(--bg-base)] overflow-hidden" style={{ height: 700, maxHeight: "90vh" }}>

          {/* -- Header (qotgan) -- */}
          <div className="px-7 pt-7 pb-3 shrink-0 ">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0"><FaArrowLeft size={17} /></button>
              <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                {canEdit ? "Yig'ilishni tahrirlash" : "Yig'ilish ma'lumotlari"}
              </h2>
            </div>
            <p className="text-sm text-[var(--text-soft)] ">
              {canEdit ? "Yig'ilish ma'lumotlarini yangilang" : "Yig'ilish haqida to'liq ma'lumot"}
            </p>
          </div>

          {/* -- Scroll qilinadigan content -- */}
          <div className="flex-1 overflow-y-auto px-7 py-4 flex flex-col gap-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#C2C8E0 transparent' }}>
            <ProjectDropdown value={form.project} onChange={v => canEdit && set('project', v)} error={errors.project} projects={projects} disabled={!canEdit} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nomi</label>
                <input value={form.title} onChange={e => canEdit && set('title', e.target.value)}
                  readOnly={!canEdit} placeholder="Nomi yozing" className={inputCls(errors.title)} />
                {errors.title && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
              </div>
              <div>
                <label className={labelCls}>Jarima foizi (%)</label>
                <input type="text" inputMode="decimal" value={form.fine}
                  onChange={e => canEdit && handleFine(e.target.value)}
                  readOnly={!canEdit} placeholder="Jarima foizini kiriting" className={inputCls(false)} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Havolasi</label>
              {canEdit ? (
                <div className='flex items-end relative'>
                  <input value={form.link} onChange={e => set('link', e.target.value)}
                    placeholder="URL manzil kiriting" className={inputCls(false) + ' pr-9'} />
                  {form?.link?.trim() && (
                    <button
                      type="button"
                      className="absolute top-2 right-1 p-1.5 rounded-lg hover:bg-[var(--bg-elevation-2)] transition-colors cursor-pointer shrink-0"
                      onClick={() => { navigator.clipboard.writeText(form.link); setCopyLink(form.link); setTimeout(() => setCopyLink(null), 2000) }}
                      title="Havolani nusxalash"
                    >
                      {copyLink ?
                        <FaCheck size={14} className='text-green-500' />
                        : <PiCopyBold size={18} className='text-[var(--text-soft)]' />
                      }
                    </button>
                  )}
                </div>
              ) : (
                <div className={`${inputCls(false)} flex items-center justify-between gap-2 overflow-hidden`}>
                  <div className="flex-1 min-w-0">
                    {form.link
                      ? <a href={form.link} target="_blank" rel="noreferrer"
                        className="text-[var(--accent-strong)] dark:text-[var(--accent-soft)] hover:underline break-all block">{form.link}</a>
                      : <span className="text-[var(--text-soft)]">—</span>}
                  </div>
                  {form.link && (
                    <button
                      type="button"
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-elevation-2)] transition-colors cursor-pointer shrink-0"
                      onClick={() => { navigator.clipboard.writeText(form.link); setCopyLink(form.link); setTimeout(() => setCopyLink(null), 2000) }}
                      title="Havolani nusxalash"
                    >
                      {copyLink ?
                        <FaCheck size={14} className='text-green-500' />
                        : <PiCopyBold size={18} className='text-[var(--text-soft)]' />
                      }
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className={labelCls}>Tavsifi</label>
              <div className="relative">
                <textarea value={form.description} onChange={e => canEdit && set('description', e.target.value)}
                  readOnly={!canEdit} placeholder="Tavsifni yozing" rows={3}
                  className={inputCls(false) + ' resize-none' + (canEdit ? ' pr-8' : '')} />
                {form.description && canEdit && (
                  <button type="button" onClick={() => set('description', '')}
                    className="absolute top-2.5 right-2.5 text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer">
                    <FaXmark size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-2">
                <label className={labelCls}>Boshlanish sanasi</label>
                <DateTimeBox
                  type="date"
                  placeholder="kk.oo.yyyy"
                  value={form.date}
                  onChange={v => {
                    if (!canEdit) return
                    set('date', v)
                    if (v && (!form.time || form.time === '00:00')) set('time', '23:59')
                  }}
                  disabled={!canEdit}
                  dropUp
                />
              </div>
              <div>
                <label className={labelCls}>Vaqti</label>
                <DateTimeBox
                  type="time"
                  placeholder="SS:DD"
                  value={form.time}
                  onChange={v => canEdit && set('time', v)}
                  disabled={!canEdit}
                  dropUp
                />
              </div>
              <div>
                <label className={labelCls}>Davomiyligi</label>
                <div className={`flex rounded-xl border overflow-hidden ${!canEdit ? 'bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]' : 'bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] focus-within:border-[var(--accent-sub)]'}`}>
                  <input min="1" value={form.durationVal}
                    onChange={e => canEdit && set('durationVal', e.target.value.replace(/\D/g, ''))}
                    readOnly={!canEdit} placeholder="40"
                    className="w-12 px-2 py-2.5 text-sm outline-none bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-soft)]" />
                  <span className="flex items-center px-2 text-xs text-[var(--text-sub)] dark:text-[var(--text-sub)] border-l border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] whitespace-nowrap">
                    daqiqa
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className={labelCls}>Yig'ilish qatnashchilari</label>
              <div
                onClick={() => canEdit && setShowParticipants(true)}
                className={`w-full min-h-[100px] rounded-[24px] border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] p-3 flex flex-col transition-all
                  ${canEdit ? 'bg-[var(--bg-base)] cursor-pointer hover:border-[var(--accent-sub)]' : 'bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] cursor-default'}
                  ${form.participants.length === 0 ? 'items-center justify-center' : 'items-start justify-start'}`}
              >
                {form.participants.length === 0 ? (
                  <>
                    <p className="text-sm text-[var(--text-sub)] dark:text-[var(--text-soft)] mb-4 text-center">
                      {canEdit ? "Quyidagi tugma orqali qidiring va tanlang" : "Qatnashchilar yo'q"}
                    </p>
                    {canEdit && (
                      <div className="inline-flex items-center cursor-pointer gap-1 p-2 rounded-xl bg-[#dadff0] dark:bg-[#3a3b3b] text-black dark:text-[var(--accent-soft)] text-sm">
                        <FaPlus size={15} />
                        Qatnashchilarni qo'shing
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {form.participants.map(u => (
                      <div key={u.id} className="inline-flex items-center gap-1 px-1 py-0.5 rounded-xl bg-[#F1F3F9] dark:bg-[var(--bg-elevation-1)] text-[var(--text-strong)] dark:text-[var(--text-strong)] text-xs border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]">
                        <span className="font-medium text-[13px]">
                          {u.username}{(u.position_info?.name || u.position) ? ` | ${u.position_info?.name || u.position}` : ''}
                        </span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={ev => { ev.stopPropagation(); set('participants', form.participants.filter(p => p.id !== u.id)) }}
                            className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors ml-1 cursor-pointer"
                          >
                            <FaXmark size={12} className="text-[var(--text-soft)]" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Yig'ilish qatnashilari ro'yxati */}
            <div>
              <label className={labelCls}>Yig'ilishga qatnashishlar</label>
              <div className="flex flex-col gap-2">
                {form.attendances?.map(u => (
                  <AttendanceItem key={u.id} attendance={u} />
                ))}
              </div>
            </div>
          </div>

          {/* -- Footer (qotgan) -- */}
          <div className="px-7 py-5 flex items-center justify-between gap-3 shrink-0 bg-[var(--bg-base)]">
            <div className="flex items-center gap-2.5">
              {!meeting.is_completed && onFinish && (
                <button
                  type="button"
                  onClick={() => { onClose(); onFinish(meeting.id) }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold cursor-pointer text-[#22c55e]  hover:bg-[#f0fdf4] dark:hover:bg-[#0f2a1a] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  Yakunlash
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]">
                <FaXmark size={13} /> Yopish
              </button>
              {canEdit && (
                <button onClick={handleSubmit} disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)] disabled:opacity-60">
                  {loading
                    ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                    : <FaCheck size={13} />
                  }
                  Saqlash
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      {showParticipants && canEdit && (
        <ParticipantsModal selected={form.participants} users={users}
          onClose={() => setShowParticipants(false)}
          onApply={vals => { set('participants', vals); setShowParticipants(false) }} />
      )}
    </>
  )
}

/* -- MeetingDetailModal -- */
function MeetingDetailModal({ meeting, onClose }) {
  const [project, setProject] = useState(null)
  const { val: durVal, unit: durUnit } = minutesToDisplay(meeting.duration_minutes)
  const { date: startDate, time: startTime } = fromIso(meeting.start_time)
  const [copyLink, setCopyLink] = useState(null)

  useEffect(() => {
    if (meeting.project) {
      axiosAPI.get(`/projects/${meeting.project}/`)
        .then(res => setProject(res.data?.data ?? res.data))
        .catch(() => { })
    }
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const fieldCls = "px-3 py-2.5 rounded-xl text-sm border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] text-[var(--text-strong)] dark:text-[var(--text-strong)]"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer z-[200]">
        <FaXmark size={14} />
      </button>
      <div className="relative w-full max-w-[600px] flex flex-col rounded-3xl shadow-2xl bg-[var(--bg-base)] overflow-hidden" style={{ height: 700, maxHeight: "90vh" }}>

        {/* Header */}
        <div className="px-7 pt-7 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Yig'ilish ma'lumotlari</h2>
          </div>
          <p className="text-sm text-[var(--text-soft)] ">Yig'ilish haqida to'liq ma'lumot</p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-7 py-4 flex flex-col gap-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#C2C8E0 transparent' }}>

          {/* Loyiha */}
          <div>
            <label className={labelCls}>Loyiha</label>
            <div className={fieldCls}>{project?.title || <span className="text-[var(--text-soft)]">—</span>}</div>
          </div>

          {/* Nomi + Jarima */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nomi</label>
              <div className={fieldCls}>{meeting.title || <span className="text-[var(--text-soft)]">—</span>}</div>
            </div>
            <div>
              <label className={labelCls}>Jarima foizi (%)</label>
              <div className={fieldCls}>
                {meeting.penalty_percentage
                  ? `${Math.abs(parseFloat(meeting.penalty_percentage))} %`
                  : <span className="text-[var(--text-soft)]">—</span>}
              </div>
            </div>
          </div>

          {/* Havola */}
          <div>
            <label className={labelCls}>Havolasi</label>
            <div className={`${fieldCls} flex items-center justify-between gap-2 overflow-hidden`}>
              <div className="flex-1 min-w-0">
                {meeting.link
                  ? <a href={meeting.link} target="_blank" rel="noreferrer"
                    className="text-[var(--accent-strong)] dark:text-[var(--accent-soft)] hover:underline break-all block">{meeting.link}</a>
                  : <span className="text-[var(--text-soft)]">—</span>}
              </div>
              {meeting.link && (
                <button
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-elevation-2)] transition-colors cursor-pointer shrink-0"
                  onClick={() => { navigator.clipboard.writeText(meeting.link); setCopyLink(meeting.link); setTimeout(() => setCopyLink(null), 2000) }}
                  title="Havolani nusxalash"
                >
                  {copyLink ?
                    <FaCheck size={14} className='text-green-500' />
                    : <PiCopyBold size={18} className='text-[var(--text-soft)]' />
                  }
                </button>
              )}
            </div>
          </div>

          {/* Tavsif */}
          <div>
            <label className={labelCls}>Tavsifi</label>
            <div className={fieldCls + " min-h-[80px] whitespace-pre-wrap"}>
              {meeting.description || <span className="text-[var(--text-soft)]">—</span>}
            </div>
          </div>

          {/* Sana + Vaqt + Davomiylik */}
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Boshlanish sanasi</label>
              <div className={`${fieldCls} flex items-center justify-between`}>
                <span>{startDate ? startDate.split('-').reverse().join('.') : <span className="text-[var(--text-soft)]">—</span>}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[var(--text-soft)] ml-1">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
              </div>
            </div>
            <div>
              <label className={labelCls}>Vaqti</label>
              <div className={`${fieldCls} flex items-center justify-between`}>
                <span>{startTime || <span className="text-[var(--text-soft)]">—</span>}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[var(--text-soft)] ml-1">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              </div>
            </div>
            <div>
              <label className={labelCls}>Davomiyligi</label>
              <div className={`${fieldCls} flex items-center gap-1.5`}>
                <span>{durVal || <span className="text-[var(--text-soft)]">—</span>}</span>
                {durVal && <span className="text-xs text-[var(--text-soft)]">{durUnit}</span>}
              </div>
            </div>
          </div>

          {/* Qatnashchilar */}
          <div>
            <label className={labelCls}>Qatnashchilar</label>
            <div className="px-3 py-2.5 rounded-xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-base)] flex flex-wrap gap-1.5 min-h-[44px] items-start">
              {meeting.participants_info?.length > 0
                ? meeting.participants_info.map(u => (
                  <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#EEF1FB] text-[var(--accent-strong)] dark:bg-[#1E2340] dark:text-[var(--accent-soft)]">
                    {u.username}{u.position ? ` | ${u.position}` : ''}
                  </span>
                ))
                : <span className="text-sm text-[var(--text-soft)]">Qatnashchilar yo'q</span>
              }
            </div>
          </div>


          <div>
            <label className={labelCls}>Yig'ilishga qatnashishlar</label>
            <div className="flex flex-col gap-2">
              {meeting?.attendances?.map(u => (
                <AttendanceItem key={u.id} attendance={u} />
              ))}
            </div>
          </div>

        </div>

        {/* Footer — Tugatildimi + Yopish */}
        <div className="px-7 py-4 flex items-center justify-between shrink-0 bg-[var(--bg-base)] ">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[var(--text-sub)] dark:text-[var(--text-soft)]">Tugatildimi?</label>
            <div className={`relative w-10 h-5 rounded-full ${meeting.is_completed ? 'bg-[var(--accent-strong)]' : 'bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)]'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${meeting.is_completed ? 'translate-x-5 left-0.5' : 'translate-x-0.5 left-0'}`} />
            </div>
            <span className="text-sm font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">
              {meeting.is_completed ? 'Ha' : "Yo'q"}
            </span>
          </div>
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]">
            <FaXmark size={13} /> Yopish
          </button>
        </div>
      </div>
    </div>
  )
}

/* -- FilterModal -- */
function FilterModal({ onClose, onApply, initial }) {
  const [organizer, setOrganizer] = useState(initial.organizer ?? '')
  const [project, setProject] = useState(initial.project ?? '')
  const [status, setStatus] = useState(initial.status ?? '')
  const [dateFrom, setDateFrom] = useState(initial.dateFrom ?? '')
  const [dateTo, setDateTo] = useState(initial.dateTo ?? '')
  const [orgSearch, setOrgSearch] = useState('')
  const [prjSearch, setPrjSearch] = useState('')
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])

  useEffect(() => {
    axiosAPI.get('/projects/', { params: { page_size: 100 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setProjects(Array.isArray(list) ? list : [])
      }).catch(() => { })
    axiosAPI.get('/users/all/', { params: { page_size: 200 } })
      .then(res => {
        const list = res.data?.results ?? res.data?.data?.results ?? res.data ?? []
        setUsers(Array.isArray(list) ? list : [])
      }).catch(() => { })
  }, [])

  const orgDd = useDropdown()
  const prjDd = useDropdown()
  const stsDd = useDropdown()

  const reset = () => { setOrganizer(''); setProject(''); setStatus(''); setDateFrom(''); setDateTo('') }

  // Faqat admin va manager rollilarni ko'rsatish
  const managers = users.filter(u => {
    const allRoles = [u.active_role, ...(u.roles ?? [])].filter(Boolean)
    return allRoles.includes('admin') || allRoles.includes('manager')
  })

  const filteredManagers = orgSearch.trim()
    ? managers.filter(u => u.username?.toLowerCase().includes(orgSearch.toLowerCase()))
    : managers

  const filteredProjects = prjSearch.trim()
    ? projects.filter(p => p.title?.toLowerCase().includes(prjSearch.toLowerCase()))
    : projects

  const selectedOrg = managers.find(u => u.id === organizer)
  const selectedPrj = projects.find(p => p.id === project)

  const STATUS_OPTIONS = [
    { label: 'Tugallangan', value: 'true' },
    { label: 'Tugallanmagan', value: 'false' },
  ]

  const fmtDate = (iso) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
    } catch { return '' }
  }

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Avatar komponenti
  const Avatar = ({ user, size = 8 }) => {
    const [err, setErr] = useState(false)
    const initials = (user?.username ?? '?').slice(0, 2).toUpperCase()
    if (user?.avatar && !err) {
      return <img src={user.avatar} alt={user.username} onError={() => setErr(true)}
        className={`w-${size} h-${size} rounded-full object-cover shrink-0`} />
    }
    return (
      <div className={`w-${size} h-${size} rounded-full bg-[var(--accent-sub)]/20 flex items-center justify-center text-xs font-bold text-[var(--accent-sub)] shrink-0`}>
        {initials}
      </div>
    )
  }

  const ddBase = 'absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] overflow-hidden'
  const triggerCls = (val) => `w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border cursor-pointer bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] ${val ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer z-[200]">
        <FaXmark size={14} />
      </button>
      <div className="relative flex flex-col w-full max-w-[600px] h-[600px] rounded-3xl shadow-2xl bg-[var(--bg-base)]">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 ">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0"><FaArrowLeft size={16} /></button>
            <h2 className="text-[18px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Filtrlash</h2>
          </div>
          <p className="text-sm text-[var(--text-sub)]">Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi</p>
        </div>

        <div className="px-6 pb-4 flex flex-1 flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">

            {/* Tashkilotchi */}
            <div ref={orgDd.ref} className="col-span-1 ">
              <label className={labelCls}>Tashkilotchi</label>
              <div className="relative">
                <button type="button" onClick={() => { orgDd.setOpen(o => !o); setOrgSearch('') }} className={triggerCls(organizer)}>
                  {selectedOrg ? (
                    <>

                      <span className="flex-1 text-left truncate text-[var(--text-strong)] dark:text-[var(--text-strong)]">{selectedOrg.username}</span>
                      <span onMouseDown={e => { e.stopPropagation(); setOrganizer('') }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer ml-auto shrink-0"><FaXmark size={11} /></span>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-left">Tanlang</span>
                      <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform shrink-0 ${orgDd.open ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
                {orgDd.open && (
                  <div className={ddBase} style={{ maxHeight: 260, width: 250, }}>
                    {/* <div className="px-3 py-2 border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
                      <input autoFocus value={orgSearch} onChange={e => setOrgSearch(e.target.value)}
                        placeholder="Qidirish..." className="w-full text-sm outline-none bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-soft)]" />
                    </div> */}
                    <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
                      {filteredManagers.length === 0
                        ? <p className="px-4 py-3 text-sm text-[var(--text-soft)] text-center">Topilmadi</p>
                        : filteredManagers.map((u, i) => (
                          <button key={u.id} type="button"
                            onClick={() => { setOrganizer(u.id); orgDd.setOpen(false); setOrgSearch('') }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors
                              ${i < filteredManagers.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''}
                              ${organizer === u.id ? 'bg-[#EEF1FB] dark:bg-[var(--bg-elevation-2)]' : 'hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'}`}>
                            <Avatar user={u} size={8} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${organizer === u.id ? 'text-[var(--accent-strong)] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)]'}`}>{u.username}</p>
                              <p className="text-xs text-[var(--text-soft)] truncate capitalize">
                                {(() => {
                                  const allRoles = [u.active_role, ...(u.roles ?? [])].filter(Boolean)
                                  if (allRoles.includes('admin')) return 'Administrator'
                                  if (allRoles.includes('manager')) return 'Menejer'
                                  return u.position || ''
                                })()}
                              </p>
                            </div>
                            {organizer === u.id && <FaCheck size={11} className="text-[var(--accent-strong)] shrink-0" />}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Loyiha */}
            <div ref={prjDd.ref} className="col-span-1">
              <label className={labelCls}>Loyiha</label>
              <div className="relative">
                <button type="button" onClick={() => { prjDd.setOpen(o => !o); setPrjSearch('') }} className={triggerCls(project)}>
                  <span className="flex-1 text-left truncate">{selectedPrj?.title || 'Tanlang'}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {project
                      ? <span onMouseDown={e => { e.stopPropagation(); setProject('') }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"><FaXmark size={11} /></span>
                      : <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${prjDd.open ? 'rotate-180' : ''}`} />}
                  </div>
                </button>
                {prjDd.open && (
                  <div className={ddBase} style={{ maxHeight: 260, width: 250 }}>

                    <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
                      {filteredProjects.length === 0
                        ? <p className="px-4 py-3 text-sm text-[var(--text-soft)] text-center">Topilmadi</p>
                        : filteredProjects.map((p, i) => (
                          <button key={p.id} type="button"
                            onClick={() => { setProject(p.id); prjDd.setOpen(false); setPrjSearch('') }}
                            className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors
                              ${i < filteredProjects.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''}
                              ${project === p.id ? 'bg-[#EEF1FB] dark:bg-[var(--bg-elevation-2)]' : 'hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'}`}>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${project === p.id ? 'text-[var(--accent-strong)] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)]'}`}>{p.title}</p>
                              {p.description && <p className="text-xs text-[var(--text-soft)] truncate mt-0.5">{p.description}</p>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {(p.deadline || p.end_date) && (
                                <span className="text-[11px] text-[var(--text-soft)] whitespace-nowrap">{fmtDate(p.deadline || p.end_date)}</span>
                              )}
                              {project === p.id && <FaCheck size={11} className="text-[var(--accent-strong)]" />}
                            </div>
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Holati */}
            <div ref={stsDd.ref} className="col-span-1">
              <label className={labelCls}>Holati</label>
              <div className="relative">
                <button type="button" onClick={() => stsDd.setOpen(o => !o)} className={triggerCls(status)}>
                  <span className="flex-1 text-left truncate">{STATUS_OPTIONS.find(s => s.value === status)?.label || 'Tanlang'}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {status
                      ? <span onMouseDown={e => { e.stopPropagation(); setStatus('') }} className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer"><FaXmark size={11} /></span>
                      : <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${stsDd.open ? 'rotate-180' : ''}`} />}
                  </div>
                </button>
                {stsDd.open && (
                  <div className={ddBase}>
                    {STATUS_OPTIONS.map((s, i) => (
                      <button key={s.value} type="button" onClick={() => { setStatus(s.value); stsDd.setOpen(false) }}
                        className={`w-full px-4 py-2.5 text-left text-sm cursor-pointer
                          ${i < STATUS_OPTIONS.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''}
                          ${status === s.value ? 'bg-[#EEF1FB] text-[var(--accent-strong)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]' : 'text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sana oralig'i */}
          <div>
            <label className={labelCls}>Boshlanish sanasi oralig'i</label>
            <div className="grid grid-cols-2 gap-2">
              <DateTimeBox type="date" placeholder="dan" value={dateFrom} onChange={setDateFrom} />
              <DateTimeBox type="date" placeholder="gacha" value={dateTo} onChange={setDateTo} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 flex items-center justify-end gap-3 border-t border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
          <button onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]">
            <FaXmark size={13} /> Tozalash
          </button>
          <button onClick={() => onApply({ organizer, project, status, dateFrom, dateTo })}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            Qidirish
          </button>
        </div>
      </div>
    </div>
  )
}

/* -- RowMenu -- */
function RowMenu({ onDetail, onEdit, onDelete, onFinish, isCompleted, project }) {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()

  const edit = project.organizer === user?.id && !project.is_completed

  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative flex justify-end">
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] text-[var(--text-soft)] cursor-pointer ">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 w-48 rounded-2xl shadow-xl border overflow-hidden bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
          <button onClick={() => { onDetail(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] cursor-pointer border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            Ko'rish
          </button>
          {edit &&
            <button onClick={() => { onEdit(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] cursor-pointer border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              Tahrirlash
            </button>
          }
          {!isCompleted && (
            <button onClick={() => { onFinish(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#22c55e] hover:bg-[#f0fdf4] dark:hover:bg-[#0f2a1a] cursor-pointer border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              Yakunlash
            </button>
          )}
          <button onClick={() => { onDelete(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[#2A1A1A] cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
            O'chirish
          </button>
        </div>
      )}
    </div>
  )
}

/* -- Main Page -- */
export default function MeetingsPage() {
  const { registerAction, clearAction } = usePageAction()
  const { user } = useAuth()
  const isAuditor = user?.active_role === 'auditor'

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [detail, setDetail] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [meetingLoading, setMeetingLoading] = useState(false)
  const [copiedUid, setCopiedUid] = useState(null)
  const [attendanceMeetingId, setAttendanceMeetingId] = useState(null)
  const scrollRef = useRef(null)

  const [projects, setProjects] = useState([])

  const buildParams = useCallback((f = filters, q = search, pg = 1) => {
    const p = { page: pg, page_size: 20 }
    if (q) p.search = q
    if (f.organizer) p.organizer = f.organizer
    if (f.project) p.project = f.project
    if (f.status !== undefined && f.status !== '') p.is_completed = f.status
    if (f.dateFrom) p.start_date_gte = f.dateFrom
    if (f.dateTo) p.start_date_lte = f.dateTo
    return p
  }, [filters, search])

  const getProjects = async () => {
    try {
      const { data } = await axiosAPI.get("/project-shorts/")

      setProjects(data?.data.results)
    } catch (error) {
      console.error(error);
      toast.error(error.results.data.error.errMsg || "Xatolik yuz berdi")
    }
  }

  const loadMeetings = useCallback(async (f = filters, q = search, pg = 1) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await axiosAPI.get('/meetings/', { params: buildParams(f, q, pg) })
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

  useEffect(() => { loadMeetings(); getProjects() }, [])

  /* infinite scroll */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60 && hasMore && !loadingMore) {
        loadMeetings(filters, search, page + 1)
      }
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, page, filters, search])

  const runSearch = (val) => {
    const q = val.trim()
    setSearch(q)
    loadMeetings(filters, q, 1)
  }
  const handleApplyFilter = f => { setFilters(f); setShowFilter(false); loadMeetings(f, search, 1) }

  const handleClose = async (id) => {
    try {
      const res = await axiosAPI.post(`/meetings/${id}/close/`)
      const updated = res.data?.data ?? res.data
      setData(prev => prev.map(m => m.id === id ? { ...m, is_completed: true, ...updated } : m))
      toast.success("Yig'ilish yakunlandi", "Yig'ilish muvaffaqiyatli yakunlandi")
      loadMeetings(filters, search, 1)
    } catch (err) {
      toast.error('Xatolik', parseApiError(err, "Yakunlashda xatolik"))
    }
  }

  const handleDelete = async (id) => {
    try {
      await axiosAPI.delete(`/meetings/${id}/`)
      setData(prev => prev.filter(m => m.id !== id))
      toast.delete("Yig'ilish o'chirildi", "Yig'ilish chiqindi qutisiga yuborildi")
      loadMeetings(filters, search, 1)
    } catch (err) {
      toast.error('Xatolik', parseApiError(err, "O'chirishda xatolik"))
    }
  }

  // API dan to'liq yig'ilish ma'lumotini olish
  const loadMeetingDetail = async (id, mode = 'detail') => {
    setMeetingLoading(true)
    try {
      const res = await axiosAPI.get(`/meetings/${id}/`)
      let meeting = res.data?.data ?? res.data
      if (meeting.id) {
        const { data } = await axiosAPI.get(`meeting-attendance/?meeting=${meeting?.id}`)
        const attendances = data?.data?.results ?? data?.data
        meeting.attendances = attendances
      }
      if (mode === 'edit' && meeting.organizer === user.id && !meeting?.is_completed) setEditItem(meeting)
      else setDetail(meeting)
    } catch (err) {
      toast.error('Xatolik', "Yig'ilish ma'lumotlarini yuklashda xatolik")
    } finally {
      setMeetingLoading(false)
    }
  }

  const hasFilter = Object.values(filters).some(v => v !== '' && v !== undefined && v !== null)

  useEffect(() => {
    if (isAuditor) return
    registerAction({
      label: "Yig'ilish qo'shish",
      icon: <img src="/imgs/addmeetingIcon.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowAdd(true),
    })
    return () => clearAction()
  }, [])

  return (
    <div className="flex flex-col h-full gap-4">
      <h1 className="text-2xl font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Yig'ilishlar</h1>

      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)] dark:text-[var(--text-sub)]"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input type="text" placeholder="Nomi bo'yicha izlash" value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') runSearch(searchInput) }}
            className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none  w-[220px]
              bg-[#F1F3F9] border border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-sub)] focus:border-[var(--accent-sub)]
              dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-sub)] dark:placeholder-[var(--text-sub)]" />
        </div>
        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-bold border  cursor-pointer
            bg-[#F1F3F9] border-[var(--stroke-sub)] text-[var(--text-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-sub)]">
          <img src="/imgs/filterIcon.svg" alt="" className="w-3.5 h-3.5 [filter:brightness(0)_saturate(100%)_invert(38%)_sepia(10%)_saturate(500%)_hue-rotate(190deg)] dark:[filter:brightness(0)_saturate(100%)_invert(70%)_sepia(10%)_saturate(300%)_hue-rotate(190deg)]" /> Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-strong)]" />}
        </button>
      </div>

      <div ref={scrollRef} className="overflow-auto h-[70vh]">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[var(--bg-elevation-1)]">
            <tr className="border-b border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] w-10">№</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">UID</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Nomi</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Tashkilotchi</span>
              </th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Loyiha</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Boshlanish vaqti</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Davomiyligi</th>
              <th className="px-4 py-3 text-center font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Tugatildimi?</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(j => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded-lg bg-[#EEF1F7] dark:bg-[var(--bg-elevation-2)] animate-pulse" style={{ width: j === 1 ? 32 : '80%' }} />
                    </td>
                  ))}
                </tr>
              ))
              : data.map((m, idx) => {
                const project = projects.find(p => p.id === m.project)
                const organizer = m.participants_info?.find(u => u.id === m.organizer) ?? m.participants_info?.[0]
                const { val: durVal, unit: durUnit } = minutesToDisplay(m.duration_minutes)
                return (
                  <tr key={m.id}
                    className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]  cursor-pointer"
                    onClick={() => loadMeetingDetail(m.id, isAuditor && m?.is_completed ? 'detail' : 'edit')}>
                    <td className="px-4 py-3 text-[var(--text-soft)] dark:text-[var(--text-sub)]  font-medium">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 group">
                        <span className="text-[var(--text-soft)] dark:text-[var(--text-sub)]">{m.uid || ''}</span>
                        {m.uid && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(m.uid).then(() => {
                                setCopiedUid(m.id)
                                setTimeout(() => setCopiedUid(null), 2000)
                              }).catch(() => { })
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-md hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] cursor-pointer text-[var(--text-soft)] dark:text-[var(--text-sub)]"
                          >
                            {copiedUid === m.id
                              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              : <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M216,28H88A12,12,0,0,0,76,40V76H40A12,12,0,0,0,28,88V216a12,12,0,0,0,12,12H168a12,12,0,0,0,12-12V180h36a12,12,0,0,0,12-12V40A12,12,0,0,0,216,28ZM156,204H52V100H156Zm48-48H180V88a12,12,0,0,0-12-12H100V52H204Z" /></svg>
                            }
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">{m.title}</td>
                    <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{organizer?.username || ''}</td>
                    <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{project?.title || ''}</td>
                    <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{fmtDt(m.start_time)}</td>
                    <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                      {durVal ? `${durVal} ${durUnit}` : ''}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${m.is_completed ? 'bg-[#22c55e]' : 'bg-[#EF4444]'}`}>
                        {m.is_completed
                          ? <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          : <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
                        }
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {!isAuditor && (
                        <RowMenu
                          onDetail={() => loadMeetingDetail(m.id, 'detail')}
                          onEdit={() => loadMeetingDetail(m.id, 'edit')}
                          onFinish={() => setAttendanceMeetingId(m.id)}
                          isCompleted={!!m.is_completed}
                          onDelete={() => handleDelete(m.id)}
                          project={m}
                        />
                      )}
                    </td>
                  </tr>
                )
              })
            }
          </tbody>
        </table>

        {!loading && data.length === 0 && (
          <EmptyState
            icon="/imgs/yigilishlarIcon.svg"
            title="Yig'ilishlar topilmadi"
            description="Yangi yig'ilish yarating yoki filtrlarni tekshiring"
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

      {detail && (
        <MeetingDetailModal meeting={detail} onClose={() => setDetail(null)} />
      )}
      {showFilter && (
        <FilterModal initial={filters} onClose={() => setShowFilter(false)}
          onApply={handleApplyFilter} />
      )}
      {showAdd && (
        <AddMeetingModal
          onClose={() => setShowAdd(false)}
          loadMeetings={() => loadMeetings(filters, search, 1)}
        />
      )}
      {editItem && (
        <EditMeetingModal
          meeting={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => loadMeetings(filters, search, 1)}
          onFinish={(id) => { setEditItem(null); setAttendanceMeetingId(id) }}
          canEdit={(() => {
            const isAdminOrManager = user?.active_role === 'admin' || user?.active_role === 'manager'
            const isOwner = editItem.organizer === user?.id || editItem.created_by === user?.id
            return isAdminOrManager || isOwner
          })()} />
      )}
      {meetingLoading && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30">
          <svg className="animate-spin w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      )}
      {attendanceMeetingId && (
        <>
          <div className="fixed inset-0 z-[9999] bg-black/30" onClick={() => setAttendanceMeetingId(null)} />
          <MeetingAttendanceModal
            meetingId={attendanceMeetingId}
            closeMeetingOnSave
            onClose={() => { setAttendanceMeetingId(null); loadMeetings(filters, search, 1) }}
          />
        </>
      )}
    </div>
  )
}
