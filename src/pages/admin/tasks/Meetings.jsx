import { useState, useEffect, useRef, useCallback } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown, FaCheck } from 'react-icons/fa6'
import { LuFilter } from 'react-icons/lu'
import { usePageAction } from '../../../context/PageActionContext'
import EmptyState from '../../../components/EmptyState'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'

const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'
const DURATION_UNITS = ['Daqiqa', 'Soat']

/* ── helpers ── */
const fmtDt = (iso) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

const toIso = (date, time) => {
  if (!date) return null
  return time ? `${date}T${time}:00` : `${date}T00:00:00`
}

const fromIso = (iso) => {
  if (!iso) return { date: '', time: '' }
  try {
    const d = new Date(iso)
    const date = d.toISOString().slice(0, 10)
    const time = d.toISOString().slice(11, 16)
    return { date, time }
  } catch { return { date: '', time: '' } }
}

const durationToMinutes = (val, unit) => {
  const n = parseInt(val, 10)
  if (!n || isNaN(n)) return null
  return unit === 'Soat' ? n * 60 : n
}

const minutesToDisplay = (mins) => {
  if (!mins) return { val: '', unit: 'Daqiqa' }
  if (mins >= 60 && mins % 60 === 0) return { val: String(mins / 60), unit: 'Soat' }
  return { val: String(mins), unit: 'Daqiqa' }
}

/* ── useDropdown ── */
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

/* ── ProjectDropdown — real API ── */
function ProjectDropdown({ value, onChange, error, projects = [] }) {
  const { open, setOpen, ref } = useDropdown()
  const selected = projects.find(p => p.id === value)
  return (
    <div ref={ref}>
      <label className={labelCls}>Loyiha</label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
            bg-white dark:bg-[#191A1A]
            ${error ? 'border-red-400' : 'border-[#E2E6F2] dark:border-[#292A2A]'}
            ${selected ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}>
          <span className="flex-1 text-left truncate">{selected?.title || 'Loyiha tanlang'}</span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {selected
              ? <span onMouseDown={e => { e.stopPropagation(); onChange(null) }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
              : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
            }
          </div>
        </button>
        {error && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
        {open && (
          <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
            {projects.length === 0 && (
              <p className="px-4 py-3 text-sm text-[#8F95A8]">Loyihalar topilmadi</p>
            )}
            {projects.map((p, i) => (
              <button key={p.id} type="button" onClick={() => { onChange(p.id); setOpen(false) }}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer
                  ${i < projects.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                  ${value === p.id ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                <p className={`text-sm font-medium truncate ${value === p.id ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white'}`}>{p.title}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── DurationSelect ── */
function DurationSelect({ value, unit, onValueChange, onUnitChange }) {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref}>
      <label className={labelCls}>Davomiyligi</label>
      <div className="flex gap-2">
        <input type="number" min="1" value={value} onChange={e => onValueChange(e.target.value)}
          placeholder="40"
          className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none border border-[#E2E6F2] dark:border-[#292A2A]
            bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white placeholder-[#8F95A8] focus:border-[#526ED3] transition-colors" />
        <div className="relative w-28">
          <button type="button" onClick={() => setOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer
              bg-white dark:bg-[#191A1A] border-[#E2E6F2] dark:border-[#292A2A] text-[#1A1D2E] dark:text-white">
            <span>{unit}</span>
            <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-xl shadow-xl border overflow-hidden
              bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
              {DURATION_UNITS.map((u, i) => (
                <button key={u} type="button" onClick={() => { onUnitChange(u); setOpen(false) }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors cursor-pointer
                    ${i < DURATION_UNITS.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                    ${unit === u ? 'bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                  {u}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── ParticipantsModal — real users API ── */
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

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer transition-colors z-[200]">
        <FaXmark size={14} />
      </button>
      <div className="relative w-full max-w-[520px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111] flex flex-col max-h-[80vh]">
        <div className="px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer"><FaArrowLeft size={16} /></button>
            <h2 className="text-[18px] font-extrabold text-[#1A1D2E] dark:text-white">Yig'ilishga qatnashishlar</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#E2E6F2] dark:border-[#292A2A]
                text-[#5B6078] dark:text-[#C2C8E0] hover:bg-[#F1F3F9] dark:hover:bg-[#1C1D1D] cursor-pointer transition-colors shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
              Barchasini tanlash
            </button>
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8]" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Ism bo'yicha izlash"
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none border border-[#E2E6F2] dark:border-[#292A2A]
                  bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white placeholder-[#8F95A8]" />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-2 flex flex-col gap-2">
          {filtered.length === 0 && <p className="text-sm text-[#8F95A8] text-center py-8">Foydalanuvchi topilmadi</p>}
          {filtered.map(u => {
            const checked = sel.has(u.id)
            return (
              <button key={u.id} type="button" onClick={() => toggle(u.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors cursor-pointer text-left
                  ${checked ? 'border-[#526ED3] bg-[#EEF1FB] dark:bg-[#1E2340] dark:border-[#526ED3]'
                    : 'border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] hover:bg-[#F8F9FC] dark:hover:bg-[#222323]'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                  ${checked ? 'bg-[#3F57B3] border-[#3F57B3]' : 'border-[#D0D5E2] dark:border-[#474848]'}`}>
                  {checked && <FaCheck size={9} className="text-white" />}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                  {(u.username ?? '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold truncate ${checked ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white'}`}>{u.username}</p>
                  <p className="text-xs text-[#8F95A8] truncate">{u.position_info?.name || u.roles?.[0] || '—'}</p>
                </div>
              </button>
            )
          })}
        </div>
        <div className="px-6 py-4 flex items-center justify-between gap-3 shrink-0 border-t border-[#F1F3F9] dark:border-[#292A2A]">
          <span className="text-sm text-[#8F95A8]">{sel.size} ta tanlangan</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setSel(new Set())}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-[#5B6078] dark:text-[#C2C8E0]
                hover:bg-[#F1F3F9] dark:hover:bg-[#1C1D1D] cursor-pointer transition-colors">
              <FaXmark size={12} /> Tozalash
            </button>
            <button onClick={() => onApply(users.filter(u => sel.has(u.id)))}
              className="flex items-center gap-2 px-5 py-2 rounded-2xl text-sm font-bold bg-[#3F57B3] text-white hover:bg-[#526ED3] cursor-pointer transition-colors">
              <FaCheck size={12} /> Qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── AddMeetingModal ── */
function AddMeetingModal({ onClose, onAdd, projects, users }) {
  const dateRef = useRef(null)
  const timeRef = useRef(null)
  const [showParticipants, setShowParticipants] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    project: null, title: '', fine: '', link: '', description: '',
    date: '', time: '', durationVal: '', durationUnit: 'Daqiqa',
    participants: [], is_completed: false,
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.project)      e.project = true
    if (!form.title.trim()) e.title   = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputCls = err =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white placeholder-[#8F95A8] dark:placeholder-[#5B6078] ${err ? 'border-red-400' : 'border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]'}`

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const body = {
        project:      form.project,
        title:        form.title.trim(),
        is_completed: form.is_completed,
        participants: form.participants.map(u => u.id),
      }
      if (form.description.trim()) body.description = form.description.trim()
      if (form.link.trim())        body.link         = form.link.trim()
      if (form.fine)               body.penalty_percentage = `-${form.fine}`
      const startIso = toIso(form.date, form.time)
      if (startIso) body.start_time = startIso
      const mins = durationToMinutes(form.durationVal, form.durationUnit)
      if (mins) body.duration_minutes = mins
      await onAdd(body)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer transition-colors z-[200]">
          <FaXmark size={14} />
        </button>
        <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
          <div className="px-7 pt-7 pb-3">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0"><FaArrowLeft size={17} /></button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Yig'ilish qo'shish</h2>
            </div>
            <p className="text-sm text-[#8F95A8] ml-8">Yangi yig'ilish yaratish uchun ma'lumotlarni kiriting</p>
          </div>

          <div className="px-7 pb-2 flex flex-col gap-3">
            <ProjectDropdown value={form.project} onChange={v => set('project', v)} error={errors.project} projects={projects} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nomi</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Nomi yozing" className={inputCls(errors.title)} />
                {errors.title && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
              </div>
              <div>
                <label className={labelCls}>Jarima foizi (%)</label>
                <input value={form.fine} onChange={e => set('fine', e.target.value.replace(/\D/g, ''))}
                  placeholder="Jarima foizini kiriting" className={inputCls(false)} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Havolasi</label>
              <input value={form.link} onChange={e => set('link', e.target.value)}
                placeholder="URL manzil kiriting" className={inputCls(false)} />
            </div>

            <div>
              <label className={labelCls}>Tavsifi</label>
              <div className="relative">
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Tavsifni yozing" rows={3}
                  className={inputCls(false) + ' resize-none pr-8'} />
                {form.description && (
                  <button type="button" onClick={() => set('description', '')}
                    className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                    <FaXmark size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Boshlanish sanasi</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                  <input ref={dateRef} type="date" value={form.date} onChange={e => set('date', e.target.value)}
                    className={`flex-1 min-w-0 text-sm outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${!form.date ? '[&::-webkit-datetime-edit]:opacity-0' : 'text-[#1A1D2E] dark:text-white'}`} />
                  <button type="button" onClick={() => dateRef.current?.showPicker?.()}
                    className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Vaqti</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                  <input ref={timeRef} type="time" value={form.time} onChange={e => set('time', e.target.value)}
                    placeholder="00:00" step="60"
                    className={`flex-1 min-w-0 text-sm outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${!form.time ? 'text-[#B6BCCB] dark:text-[#474848]' : 'text-[#1A1D2E] dark:text-white'}`} />
                  <button type="button" onClick={() => timeRef.current?.showPicker?.()}
                    className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </button>
                </div>
              </div>
              <DurationSelect value={form.durationVal} unit={form.durationUnit}
                onValueChange={v => set('durationVal', v)} onUnitChange={v => set('durationUnit', v)} />
            </div>

            <div>
              <label className={labelCls}>Qatnashchilar</label>
              {form.participants.length > 0 && (
                <div className="px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] flex flex-wrap gap-1.5 mb-2">
                  {form.participants.map(u => (
                    <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#1E2340] dark:text-[#7F95E6]">
                      {u.username}
                      <button type="button" onMouseDown={ev => { ev.stopPropagation(); set('participants', form.participants.filter(p => p.id !== u.id)) }}
                        className="hover:opacity-70 cursor-pointer ml-0.5"><FaXmark size={9} /></button>
                    </span>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => setShowParticipants(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#C2C8E0] dark:border-[#474848]
                  text-sm text-[#8F95A8] dark:text-[#C2C8E0] hover:border-[#526ED3] hover:text-[#526ED3] cursor-pointer transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Qatnashchilarni qo'shish
              </button>
            </div>
          </div>

          <div className="px-7 py-5 flex items-center justify-between gap-3 border-t border-[#F1F3F9] dark:border-[#292A2A]">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium text-[#1A1D2E] dark:text-[#C2C8E0]">Tugatildimi?</span>
              <button type="button" onClick={() => set('is_completed', !form.is_completed)}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.is_completed ? 'bg-black dark:bg-white' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
                <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#111111] shadow transition-transform duration-200 ${form.is_completed ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
                <FaXmark size={13} /> Yopish
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3] disabled:opacity-60">
                {loading
                  ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  : <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                }
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      </div>
      {showParticipants && (
        <ParticipantsModal selected={form.participants} users={users}
          onClose={() => setShowParticipants(false)}
          onApply={vals => { set('participants', vals); setShowParticipants(false) }} />
      )}
    </>
  )
}

/* ── EditMeetingModal ── */
function EditMeetingModal({ meeting, onClose, onSave, projects, users }) {
  const dateRef = useRef(null)
  const timeRef = useRef(null)
  const [showParticipants, setShowParticipants] = useState(false)
  const [loading, setLoading] = useState(false)

  const { date: initDate, time: initTime } = fromIso(meeting.start_time)
  const { val: initDurVal, unit: initDurUnit } = minutesToDisplay(meeting.duration_minutes)

  const [form, setForm] = useState({
    project:      meeting.project ?? null,
    title:        meeting.title ?? '',
    fine:         meeting.penalty_percentage ? String(Math.abs(parseFloat(meeting.penalty_percentage))) : '',
    link:         meeting.link ?? '',
    description:  meeting.description ?? '',
    date:         initDate,
    time:         initTime,
    durationVal:  initDurVal,
    durationUnit: initDurUnit,
    participants: meeting.participants_info ?? [],
    is_completed: meeting.is_completed ?? false,
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.project)      e.project = true
    if (!form.title.trim()) e.title   = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const inputCls = err =>
    `w-full px-3 py-2.5 rounded-xl text-sm outline-none border transition-colors bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white placeholder-[#8F95A8] dark:placeholder-[#5B6078] ${err ? 'border-red-400' : 'border-[#E2E6F2] dark:border-[#292A2A] focus:border-[#526ED3]'}`

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const body = {
        project:      form.project,
        title:        form.title.trim(),
        is_completed: form.is_completed,
        participants: form.participants.map(u => u.id),
      }
      if (form.description.trim()) body.description = form.description.trim()
      if (form.link.trim())        body.link         = form.link.trim()
      if (form.fine)               body.penalty_percentage = `-${form.fine}`
      const startIso = toIso(form.date, form.time)
      if (startIso) body.start_time = startIso
      const mins = durationToMinutes(form.durationVal, form.durationUnit)
      if (mins) body.duration_minutes = mins
      await onSave(meeting.id, body)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer transition-colors z-[200]">
          <FaXmark size={14} />
        </button>
        <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
          <div className="px-7 pt-7 pb-3">
            <div className="flex items-center gap-3 mb-1">
              <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0"><FaArrowLeft size={17} /></button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Yig'ilishni tahrirlash</h2>
            </div>
            <p className="text-sm text-[#8F95A8] ml-8">Yig'ilish ma'lumotlarini yangilang</p>
          </div>

          <div className="px-7 pb-2 flex flex-col gap-3">
            <ProjectDropdown value={form.project} onChange={v => set('project', v)} error={errors.project} projects={projects} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Nomi</label>
                <input value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="Nomi yozing" className={inputCls(errors.title)} />
                {errors.title && <p className="text-xs text-red-500 mt-1">*Bu maydon majburiy</p>}
              </div>
              <div>
                <label className={labelCls}>Jarima foizi (%)</label>
                <input value={form.fine} onChange={e => set('fine', e.target.value.replace(/\D/g, ''))}
                  placeholder="Jarima foizini kiriting" className={inputCls(false)} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Havolasi</label>
              <input value={form.link} onChange={e => set('link', e.target.value)}
                placeholder="URL manzil kiriting" className={inputCls(false)} />
            </div>

            <div>
              <label className={labelCls}>Tavsifi</label>
              <div className="relative">
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  placeholder="Tavsifni yozing" rows={3}
                  className={inputCls(false) + ' resize-none pr-8'} />
                {form.description && (
                  <button type="button" onClick={() => set('description', '')}
                    className="absolute top-2.5 right-2.5 text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer">
                    <FaXmark size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Boshlanish sanasi</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                  <input ref={dateRef} type="date" value={form.date} onChange={e => set('date', e.target.value)}
                    className={`flex-1 min-w-0 text-sm outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${!form.date ? '[&::-webkit-datetime-edit]:opacity-0' : 'text-[#1A1D2E] dark:text-white'}`} />
                  <button type="button" onClick={() => dateRef.current?.showPicker?.()}
                    className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  </button>
                </div>
              </div>
              <div>
                <label className={labelCls}>Vaqti</label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors">
                  <input ref={timeRef} type="time" value={form.time} onChange={e => set('time', e.target.value)}
                    placeholder="00:00" step="60"
                    className={`flex-1 min-w-0 text-sm outline-none bg-transparent cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${!form.time ? 'text-[#B6BCCB] dark:text-[#474848]' : 'text-[#1A1D2E] dark:text-white'}`} />
                  <button type="button" onClick={() => timeRef.current?.showPicker?.()}
                    className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                  </button>
                </div>
              </div>
              <DurationSelect value={form.durationVal} unit={form.durationUnit}
                onValueChange={v => set('durationVal', v)} onUnitChange={v => set('durationUnit', v)} />
            </div>

            <div>
              <label className={labelCls}>Qatnashchilar</label>
              {form.participants.length > 0 && (
                <div className="px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] flex flex-wrap gap-1.5 mb-2">
                  {form.participants.map(u => (
                    <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#1E2340] dark:text-[#7F95E6]">
                      {u.username}
                      <button type="button" onMouseDown={ev => { ev.stopPropagation(); set('participants', form.participants.filter(p => p.id !== u.id)) }}
                        className="hover:opacity-70 cursor-pointer ml-0.5"><FaXmark size={9} /></button>
                    </span>
                  ))}
                </div>
              )}
              <button type="button" onClick={() => setShowParticipants(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#C2C8E0] dark:border-[#474848]
                  text-sm text-[#8F95A8] dark:text-[#C2C8E0] hover:border-[#526ED3] hover:text-[#526ED3] cursor-pointer transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Qatnashchilarni qo'shish
              </button>
            </div>
          </div>

          <div className="px-7 py-5 flex items-center justify-between gap-3 border-t border-[#F1F3F9] dark:border-[#292A2A]">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-medium text-[#1A1D2E] dark:text-[#C2C8E0]">Tugatildimi?</span>
              <button type="button" onClick={() => set('is_completed', !form.is_completed)}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${form.is_completed ? 'bg-black dark:bg-white' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
                <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#111111] shadow transition-transform duration-200 ${form.is_completed ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={onClose}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
                <FaXmark size={13} /> Yopish
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3] disabled:opacity-60">
                {loading
                  ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                  : <FaCheck size={13} />
                }
                Saqlash
              </button>
            </div>
          </div>
        </div>
      </div>
      {showParticipants && (
        <ParticipantsModal selected={form.participants} users={users}
          onClose={() => setShowParticipants(false)}
          onApply={vals => { set('participants', vals); setShowParticipants(false) }} />
      )}
    </>
  )
}

/* ── MeetingDetailModal ── */
function MeetingDetailModal({ meeting, onClose, projects }) {
  const project = projects?.find(p => p.id === meeting.project)
  const { val: durVal, unit: durUnit } = minutesToDisplay(meeting.duration_minutes)
  const { date: startDate, time: startTime } = fromIso(meeting.start_time)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer transition-colors z-[200]">
        <FaXmark size={14} />
      </button>
      <div className="relative w-full max-w-[600px] max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
        <div className="px-7 pt-7 pb-3">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Yig'ilish ma'lumotlari</h2>
          </div>
          <p className="text-sm text-[#8F95A8] ml-8">Yig'ilish haqida to'liq ma'lumot</p>
        </div>

        <div className="px-7 pb-2 flex flex-col gap-3">
          <div>
            <label className={labelCls}>Loyiha</label>
            <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white">
              <span className="flex-1 truncate">{project?.title || '—'}</span>
              <FaChevronDown size={11} className="text-[#8F95A8] shrink-0 ml-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nomi</label>
              <div className="px-3 py-2.5 rounded-xl text-sm border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white">
                {meeting.title || <span className="text-[#8F95A8]">—</span>}
              </div>
            </div>
            <div>
              <label className={labelCls}>Jarima foizi (%)</label>
              <div className="px-3 py-2.5 rounded-xl text-sm border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white">
                {meeting.penalty_percentage
                  ? `${Math.abs(parseFloat(meeting.penalty_percentage))} %`
                  : <span className="text-[#8F95A8]">—</span>}
              </div>
            </div>
          </div>

          <div>
            <label className={labelCls}>Havolasi</label>
            <div className="px-3 py-2.5 rounded-xl text-sm border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A]">
              {meeting.link
                ? <a href={meeting.link} target="_blank" rel="noreferrer"
                    className="text-[#3F57B3] dark:text-[#7F95E6] hover:underline truncate block">{meeting.link}</a>
                : <span className="text-[#8F95A8]">—</span>}
            </div>
          </div>

          <div>
            <label className={labelCls}>Tavsifi</label>
            <div className="px-3 py-2.5 rounded-xl text-sm border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] min-h-[80px] whitespace-pre-wrap text-[#1A1D2E] dark:text-white">
              {meeting.description || <span className="text-[#8F95A8]">—</span>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Boshlanish sanasi</label>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white">
                <span>{startDate ? startDate.split('-').reverse().join('.') : '—'}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#8F95A8] ml-1">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
              </div>
            </div>
            <div>
              <label className={labelCls}>Vaqti</label>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] text-[#1A1D2E] dark:text-white">
                <span>{startTime || '—'}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#8F95A8] ml-1">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
            </div>
            <div>
              <label className={labelCls}>Davomiyligi</label>
              <div className="flex rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] overflow-hidden">
                <div className="flex-1 px-3 py-2.5 text-sm text-[#1A1D2E] dark:text-white">{durVal || '—'}</div>
                <div className="flex items-center gap-1 px-2.5 text-sm text-[#1A1D2E] dark:text-white border-l border-[#E2E6F2] dark:border-[#292A2A]">
                  <span className="whitespace-nowrap">{durUnit}</span>
                  <FaChevronDown size={10} className="text-[#8F95A8]" />
                </div>
              </div>
            </div>
          </div>

          <div className="pb-2">
            <label className={labelCls}>Qatnashchilar</label>
            <div className="px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] flex flex-wrap gap-1.5 min-h-[44px] items-start">
              {meeting.participants_info?.length > 0
                ? meeting.participants_info.map(u => (
                    <span key={u.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#1E2340] dark:text-[#7F95E6]">
                      {u.username}{u.position ? ` | ${u.position}` : ''}
                    </span>
                  ))
                : <span className="text-sm text-[#8F95A8]">Qatnashchilar yo'q</span>
              }
            </div>
          </div>
        </div>

        <div className="px-7 py-5 flex items-center justify-between gap-3 border-t border-[#F1F3F9] dark:border-[#292A2A]">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-[#1A1D2E] dark:text-[#C2C8E0]">Tugatildimi?</span>
            <div className={`relative w-10 h-5 rounded-full ${meeting.is_completed ? 'bg-black dark:bg-white' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white dark:bg-[#111111] shadow transition-transform duration-200 ${meeting.is_completed ? 'translate-x-5 left-0.5' : 'translate-x-0.5 left-0'}`} />
            </div>
          </div>
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Yopish
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── FilterModal ── */
function FilterModal({ onClose, onApply, initial, users, projects }) {
  const [organizer, setOrganizer] = useState(initial.organizer ?? '')
  const [project,   setProject]   = useState(initial.project   ?? '')
  const [status,    setStatus]    = useState(initial.status    ?? '')
  const [dateFrom,  setDateFrom]  = useState(initial.dateFrom  ?? '')
  const [dateTo,    setDateTo]    = useState(initial.dateTo    ?? '')

  const dateFromRef = useRef(null)
  const dateToRef   = useRef(null)
  const orgDd  = useDropdown()
  const prjDd  = useDropdown()
  const stsDd  = useDropdown()

  const reset = () => { setOrganizer(''); setProject(''); setStatus(''); setDateFrom(''); setDateTo('') }

  const ddBtn = (val) => `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border transition-colors cursor-pointer bg-white dark:bg-[#191A1A] border-[#E2E6F2] dark:border-[#292A2A] ${val ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`
  const ddList = 'absolute top-full left-0 mt-1 z-50 w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52 bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]'
  const inputBox = 'flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] focus-within:border-[#526ED3] transition-colors'

  const STATUS_OPTIONS = [
    { label: 'Tugallangan',   value: 'true' },
    { label: 'Tugallanmagan', value: 'false' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <button onClick={onClose} className="fixed top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer transition-colors z-[200]">
        <FaXmark size={14} />
      </button>
      <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0"><FaArrowLeft size={16} /></button>
            <h2 className="text-[18px] font-extrabold text-[#1A1D2E] dark:text-white">Filtrlash</h2>
          </div>
          <p className="text-sm text-[#5B6078]">Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi</p>
        </div>

        <div className="px-6 pb-4 flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Tashkilotchi */}
            <div ref={orgDd.ref}>
              <label className={labelCls}>Tashkilotchi</label>
              <div className="relative">
                <button type="button" onClick={() => orgDd.setOpen(o => !o)} className={ddBtn(organizer)}>
                  <span className="flex-1 text-left truncate">{users.find(u => u.id === organizer)?.username || 'Tanlang'}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {organizer
                      ? <span onMouseDown={e => { e.stopPropagation(); setOrganizer('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                      : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${orgDd.open ? 'rotate-180' : ''}`} />}
                  </div>
                </button>
                {orgDd.open && (
                  <div className={ddList}>
                    {users.map((u, i) => (
                      <button key={u.id} type="button" onClick={() => { setOrganizer(u.id); orgDd.setOpen(false) }}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors cursor-pointer ${i < users.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${organizer === u.id ? 'bg-[#EEF1FB] dark:bg-[#292A2A]' : 'hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                        <div className="w-7 h-7 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                          {(u.username ?? '?').slice(0, 2).toUpperCase()}
                        </div>
                        <p className={`text-sm font-medium truncate ${organizer === u.id ? 'text-[#3F57B3] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white'}`}>{u.username}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Loyiha */}
            <div ref={prjDd.ref}>
              <label className={labelCls}>Loyiha</label>
              <div className="relative">
                <button type="button" onClick={() => prjDd.setOpen(o => !o)} className={ddBtn(project)}>
                  <span className="flex-1 text-left truncate">{projects.find(p => p.id === project)?.title || 'Tanlang'}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {project
                      ? <span onMouseDown={e => { e.stopPropagation(); setProject('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                      : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${prjDd.open ? 'rotate-180' : ''}`} />}
                  </div>
                </button>
                {prjDd.open && (
                  <div className={ddList}>
                    {projects.map((p, i) => (
                      <button key={p.id} type="button" onClick={() => { setProject(p.id); prjDd.setOpen(false) }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${i < projects.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${project === p.id ? 'bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
                        {p.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Holati */}
            <div ref={stsDd.ref}>
              <label className={labelCls}>Holati</label>
              <div className="relative">
                <button type="button" onClick={() => stsDd.setOpen(o => !o)} className={ddBtn(status)}>
                  <span className="flex-1 text-left truncate">{STATUS_OPTIONS.find(s => s.value === status)?.label || 'Tanlang'}</span>
                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {status
                      ? <span onMouseDown={e => { e.stopPropagation(); setStatus('') }} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"><FaXmark size={11} /></span>
                      : <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${stsDd.open ? 'rotate-180' : ''}`} />}
                  </div>
                </button>
                {stsDd.open && (
                  <div className={ddList}>
                    {STATUS_OPTIONS.map((s, i) => (
                      <button key={s.value} type="button" onClick={() => { setStatus(s.value); stsDd.setOpen(false) }}
                        className={`w-full px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${i < STATUS_OPTIONS.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''} ${status === s.value ? 'bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]' : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}>
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
            <div className="flex items-center gap-2">
              <div className={`${inputBox} flex-1 min-w-0`}>
                {!dateFrom && <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">dan:</span>}
                <input ref={dateFromRef} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className={`text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${dateFrom ? 'flex-1 min-w-0' : 'w-0 opacity-0 pointer-events-none'}`} />
                <button type="button" onClick={() => dateFromRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors ml-auto">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </button>
              </div>
              <div className={`${inputBox} flex-1 min-w-0`}>
                {!dateTo && <span className="text-xs text-[#5B6078] dark:text-[#C2C8E0] shrink-0 select-none">gacha:</span>}
                <input ref={dateToRef} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className={`text-xs outline-none bg-transparent text-[#1A1D2E] dark:text-white cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden ${dateTo ? 'flex-1 min-w-0' : 'w-0 opacity-0 pointer-events-none'}`} />
                <button type="button" onClick={() => dateToRef.current?.showPicker?.()}
                  className="shrink-0 cursor-pointer text-[#8F95A8] hover:text-[#526ED3] transition-colors ml-auto">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 flex items-center justify-end gap-3 border-t border-[#F1F3F9] dark:border-[#292A2A]">
          <button onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]">
            <FaXmark size={13} /> Tozalash
          </button>
          <button onClick={() => onApply({ organizer, project, status, dateFrom, dateTo })}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Qidirish
          </button>
        </div>
      </div>
    </div>
  )
}


/* ── RowMenu ── */
function RowMenu({ onDetail, onEdit, onDelete, onClose: onCloseMeeting }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative flex justify-end">
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A] text-[#8F95A8] cursor-pointer transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
        </svg>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 w-44 rounded-2xl shadow-xl border overflow-hidden bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
          <button onClick={() => { onDetail(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A] cursor-pointer transition-colors border-b border-[#F1F3F9] dark:border-[#2A2B2B]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Ko'rish
          </button>
          <button onClick={() => { onEdit(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A] cursor-pointer transition-colors border-b border-[#F1F3F9] dark:border-[#2A2B2B]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Tahrirlash
          </button>
          <button onClick={() => { onCloseMeeting(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#22c55e] hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A] cursor-pointer transition-colors border-b border-[#F1F3F9] dark:border-[#2A2B2B]">
            <FaCheck size={13} />
            Yakunlash
          </button>
          <button onClick={() => { onDelete(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-[#2A1A1A] cursor-pointer transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            O'chirish
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Main Page ── */
export default function MeetingsPage() {
  const { registerAction, clearAction } = usePageAction()

  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]       = useState(false)
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [filters, setFilters]       = useState({})
  const [showAdd, setShowAdd]       = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [detail, setDetail]         = useState(null)
  const [editItem, setEditItem]     = useState(null)
  const [projects, setProjects]     = useState([])
  const [users, setUsers]           = useState([])
  const scrollRef = useRef(null)

  /* load projects & users once */
  useEffect(() => {
    axiosAPI.get('/projects/', { params: { page_size: 100 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setProjects(Array.isArray(list) ? list : [])
      }).catch(() => {})

    axiosAPI.get('/users/', { params: { page_size: 200 } })
      .then(res => {
        const list = res.data?.data?.results ?? res.data?.results ?? res.data ?? []
        setUsers(Array.isArray(list) ? list : [])
      }).catch(() => {})
  }, [])

  const buildParams = useCallback((f = filters, q = search, pg = 1) => {
    const p = { page: pg, page_size: 20 }
    if (q)           p.search    = q
    if (f.organizer) p.organizer = f.organizer
    if (f.project)   p.project   = f.project
    if (f.status !== undefined && f.status !== '') p.is_completed = f.status
    if (f.dateFrom)  p.start_time__date__gte = f.dateFrom
    if (f.dateTo)    p.start_time__date__lte = f.dateTo
    return p
  }, [filters, search])

  const loadMeetings = useCallback(async (f = filters, q = search, pg = 1) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await axiosAPI.get('/meetings/', { params: buildParams(f, q, pg) })
      const payload = res.data?.data ?? res.data
      const results = Array.isArray(payload) ? payload : (payload.results ?? [])
      const next    = Array.isArray(payload) ? null : (payload.next ?? null)
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

  useEffect(() => { loadMeetings() }, [])

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

  const handleSearch = val => { setSearch(val); loadMeetings(filters, val, 1) }
  const handleApplyFilter = f => { setFilters(f); setShowFilter(false); loadMeetings(f, search, 1) }

  const handleAdd = async (body) => {
    try {
      const res = await axiosAPI.post('/meetings/', body)
      const created = res.data?.data ?? res.data
      setData(prev => [created, ...prev])
      toast.success("Yig'ilish yaratildi", "Yangi yig'ilish muvaffaqiyatli qo'shildi")
    } catch (err) {
      const errData = err?.response?.data
      const msg = errData?.detail
        || (typeof errData === 'object' ? Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(', ') : null)
        || "Yig'ilish yaratishda xatolik"
      toast.error('Xatolik', msg)
      throw err
    }
  }

  const handleEdit = async (id, body) => {
    try {
      const res = await axiosAPI.put(`/meetings/${id}/`, body)
      const updated = res.data?.data ?? res.data
      setData(prev => prev.map(m => m.id === id ? updated : m))
      toast.success("Yig'ilish yangilandi", "O'zgarishlar muvaffaqiyatli saqlandi")
    } catch (err) {
      const errData = err?.response?.data
      const msg = errData?.detail
        || (typeof errData === 'object' ? Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`).join(', ') : null)
        || "Yangilashda xatolik"
      toast.error('Xatolik', msg)
      throw err
    }
  }

  const handleClose = async (id) => {
    try {
      const res = await axiosAPI.post(`/meetings/${id}/close/`)
      const updated = res.data?.data ?? res.data
      setData(prev => prev.map(m => m.id === id ? { ...m, is_completed: true, ...updated } : m))
      toast.success("Yig'ilish yakunlandi", "Yig'ilish muvaffaqiyatli yakunlandi")
    } catch (err) {
      toast.error('Xatolik', err?.response?.data?.detail || "Yakunlashda xatolik")
    }
  }

  const handleDelete = async (id) => {
    try {
      await axiosAPI.delete(`/meetings/${id}/`)
      setData(prev => prev.filter(m => m.id !== id))
      toast.delete("Yig'ilish o'chirildi", "Yig'ilish chiqindi qutisiga yuborildi")
    } catch (err) {
      toast.error('Xatolik', err?.response?.data?.detail || "O'chirishda xatolik")
    }
  }

  const hasFilter = Object.values(filters).some(v => v !== '' && v !== undefined && v !== null)

  useEffect(() => {
    registerAction({
      label: "Yig'ilish qo'shish",
      icon: <img src="/imgs/addmeetingIcon.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowAdd(true),
    })
    return () => clearAction()
  }, [])

  return (
    <div className="flex flex-col h-full gap-4">
      <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-white">Yig'ilishlar</h1>

      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#C2C8E0]"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Nomi bo'yicha izlash" value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none transition-colors w-[220px]
              bg-[#F1F3F9] border border-[#E2E6F2] text-[#1A1D2E] placeholder-[#5B6078] focus:border-[#526ED3]
              dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#5B6078]" />
        </div>
        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border transition-colors cursor-pointer
            bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078] dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
          <LuFilter size={13} /> Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0] w-10">№</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">UID</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Nomi</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Tashkilotchi</span>
              </th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Loyiha</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Boshlanish vaqti</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Davomiyligi</th>
              <th className="px-4 py-3 text-center font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Tugatildimi?</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#EEF1F7] dark:border-[#292A2A]">
                    {[1,2,3,4,5,6,7,8,9].map(j => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded-lg bg-[#EEF1F7] dark:bg-[#292A2A] animate-pulse" style={{ width: j === 1 ? 32 : '80%' }} />
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
                      className="border-b border-[#EEF1F7] dark:border-[#292A2A] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setDetail(m)}>
                      <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0] text-xs font-medium">{idx + 1}</td>
                      <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0] text-xs font-medium">{m.uid || '—'}</td>
                      <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{m.title}</td>
                      <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{organizer?.username || '—'}</td>
                      <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{project?.title || '—'}</td>
                      <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{fmtDt(m.start_time)}</td>
                      <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">
                        {durVal ? `${durVal} ${durUnit}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${m.is_completed ? 'bg-[#22c55e]' : 'bg-[#EF4444]'}`}>
                          {m.is_completed
                            ? <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            : <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="white" strokeWidth="1.8" strokeLinecap="round"/></svg>
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <RowMenu
                          onDetail={() => setDetail(m)}
                          onEdit={() => setEditItem(m)}
                          onCloseMeeting={() => handleClose(m.id)}
                          onDelete={() => handleDelete(m.id)}
                        />
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
          <div className="py-4 text-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]">
            <svg className="animate-spin inline w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Yuklanmoqda...
          </div>
        )}
      </div>

      {detail && (
        <MeetingDetailModal meeting={detail} onClose={() => setDetail(null)} projects={projects} />
      )}
      {showFilter && (
        <FilterModal initial={filters} onClose={() => setShowFilter(false)}
          onApply={handleApplyFilter} users={users} projects={projects} />
      )}
      {showAdd && (
        <AddMeetingModal onClose={() => setShowAdd(false)} onAdd={handleAdd}
          projects={projects} users={users} />
      )}
      {editItem && (
        <EditMeetingModal meeting={editItem} onClose={() => setEditItem(null)}
          onSave={handleEdit} projects={projects} users={users} />
      )}
    </div>
  )
}
