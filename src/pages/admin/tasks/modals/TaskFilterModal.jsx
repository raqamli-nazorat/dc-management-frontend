import { useState, useRef, useEffect } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown, FaChevronRight } from 'react-icons/fa6'
import { LuSearch, LuSlidersHorizontal } from 'react-icons/lu'
import { DateTimeBox } from '../../Components/DateTimeBox'
import { LEVELS, TYPES } from '../components/constants'
import { axiosAPI } from '../../../../service/axiosAPI'

/* ─── constants ─── */
const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1.5'

const LEVEL_COLORS = {
  'Past':   '#9CA3AF',
  "O'rta":  '#F59E0B',
  'Yuqori': '#3B82F6',
  'Kritik': '#EF4444',
}

const HOLAT_LIST = [
  'Kutilmoqda', 'Jarayonda', "Muddati o'tgan",
  'Bajarilgan', 'Ishga tushirildi', 'Tekshirildi', 'Rad etildi',
]

export const TASK_EMPTY_FILTER = {
  projects:  [],
  authors:   [],
  holat:     '',
  daraja:    '',
  turi:      '',
  deadFromD: '',
  deadFromT: '',
  deadToD:   '',
  deadToT:   '',
  myTasks:   false,
}

/* ─── SimpleDropdown ─── */
function SimpleDropdown({ label, value, onChange, options, placeholder, renderOption }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div>
      {label && <label className={labelCls}>{label}</label>}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border  cursor-pointer
            bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]
            ${value ? 'text-[#1A1D2E] dark:text-white' : 'text-[#8F95A8] dark:text-[#5B6078]'}`}
        >
          <span className="flex-1 text-left truncate">
            {value
              ? (renderOption ? renderOption(value) : value)
              : placeholder}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {value && (
              <span
                onMouseDown={e => { e.stopPropagation(); onChange('') }}
                className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer"
              >
                <FaXmark size={11} />
              </span>
            )}
            <FaChevronDown size={11} className={`text-[#8F95A8] transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 z-[70] w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
            {options.map((o, i) => (
              <button
                key={o}
                type="button"
                onClick={() => { onChange(o); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm  cursor-pointer
                  ${i < options.length - 1 ? 'border-b border-[#F1F3F9] dark:border-[#2A2B2B]' : ''}
                  ${value === o
                    ? 'bg-[#EEF1FB] text-[#3F57B3] font-semibold dark:bg-[#292A2A] dark:text-[#7F95E6]'
                    : 'text-[#1A1D2E] dark:text-white hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]'}`}
              >
                {renderOption ? renderOption(o) : o}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── MultiChipField ─── */
function MultiChipField({ label, selected, onRemove, onClick, placeholder, renderChip }) {
  return (
    <div>
      {label && <label className={labelCls}>{label}</label>}
      <button
        type="button"
        onClick={onClick}
        className="w-full min-h-[42px] flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl border  cursor-pointer text-left
          bg-white border-[#E2E6F2] dark:bg-[#191A1A] dark:border-[#292A2A]"
      >
        {selected.length === 0 ? (
          <span className="flex-1 text-sm text-[#8F95A8] dark:text-[#5B6078]">{placeholder}</span>
        ) : (
          <span className="flex flex-wrap gap-1.5 flex-1">
            {selected.map(item => (
              <span
                key={item.id ?? item.name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium
                  bg-[#EEF1FB] text-[#3F57B3] dark:bg-[#292A2A] dark:text-[#7F95E6]"
              >
                <span className="truncate max-w-[130px]">
                  {renderChip ? renderChip(item) : item.name}
                </span>
                <span
                  onMouseDown={e => { e.stopPropagation(); onRemove(item) }}
                  className="hover:opacity-70 cursor-pointer ml-0.5"
                >
                  <FaXmark size={9} />
                </span>
              </span>
            ))}
          </span>
        )}
        <FaChevronRight size={11} className="text-[#8F95A8] shrink-0 ml-auto" />
      </button>
    </div>
  )
}

/* ─── ProjectSelectModal ─── */
function ProjectSelectModal({ selected, onClose, onApply, projectsList = [] }) {
  const [query, setQuery] = useState('')
  const [local, setLocal] = useState(selected)

  const filtered = projectsList.filter(p =>
    (p.title ?? '').toLowerCase().includes(query.toLowerCase())
  )

  const toggle = p => setLocal(prev =>
    prev.find(x => x.id === p.id)
      ? prev.filter(x => x.id !== p.id)
      : [...prev, { id: p.id, name: p.title }]
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-7 pt-7 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Loyiha tanlang</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                local.length === projectsList.length
                  ? setLocal([])
                  : setLocal(projectsList.map(p => ({ id: p.id, name: p.title })))
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#E2E6F2] dark:border-[#292A2A]
                text-[#5B6078] dark:text-[#C2C8E0] hover:bg-[#F1F3F9] dark:hover:bg-[#1C1D1D] cursor-pointer  shrink-0"
            >
              <LuSlidersHorizontal size={12} /> Barchasi tanlash
            </button>
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A]">
              <LuSearch size={13} className="text-[#8F95A8] shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Loyiha nomi bo'yicha izlash"
                className="flex-1 text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white placeholder-[#8F95A8]"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-7 pb-2 flex flex-col gap-2">
          {filtered.length === 0 && <p className="text-sm text-[#8F95A8] text-center py-8">Loyiha topilmadi</p>}
          {filtered.map(p => {
            const checked = !!local.find(x => x.id === p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border  cursor-pointer text-left
                  ${checked
                    ? 'border-[#526ED3] bg-[#EEF1FB] dark:bg-[#1C2340] dark:border-[#526ED3]'
                    : 'border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] hover:bg-[#F8F9FC] dark:hover:bg-[#222323]'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center 
                  ${checked ? 'border-[#526ED3] bg-[#526ED3]' : 'border-[#C2C8E0] dark:border-[#474848]'}`}>
                  {checked && (
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className="text-sm font-semibold text-[#1A1D2E] dark:text-white truncate flex-1">{p.title}</p>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 flex items-center justify-between shrink-0 border-t border-[#F1F3F9] dark:border-[#292A2A]">
          <span className="text-sm text-[#8F95A8]">{local.length} ta tanlangan</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocal([])}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
                text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]"
            >
              <FaXmark size={13} /> Tozalash
            </button>
            <button
              onClick={() => onApply(local)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]"
            >
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── AuthorSelectModal ─── */
function AuthorSelectModal({ title, selected, onClose, onApply, usersList = [] }) {
  const [query, setQuery] = useState('')
  const [local, setLocal] = useState(selected)

  const filtered = usersList.filter(u =>
    (u.username ?? '').toLowerCase().includes(query.toLowerCase()) ||
    (u.position_info?.name ?? '').toLowerCase().includes(query.toLowerCase())
  )

  const toggle = u => setLocal(prev =>
    prev.find(x => x.id === u.id)
      ? prev.filter(x => x.id !== u.id)
      : [...prev, { id: u.id, name: u.username, role: u.position_info?.name || u.roles?.[0] || '' }]
  )

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-7 pt-7 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">{title}</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                local.length === usersList.length
                  ? setLocal([])
                  : setLocal(usersList.map(u => ({ id: u.id, name: u.username, role: u.position_info?.name || u.roles?.[0] || '' })))
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[#E2E6F2] dark:border-[#292A2A]
                text-[#5B6078] dark:text-[#C2C8E0] hover:bg-[#F1F3F9] dark:hover:bg-[#1C1D1D] cursor-pointer  shrink-0"
            >
              <LuSlidersHorizontal size={12} /> Barchasi tanlash
            </button>
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A]">
              <LuSearch size={13} className="text-[#8F95A8] shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Ism bo'yicha izlash"
                className="flex-1 text-sm outline-none bg-transparent text-[#1A1D2E] dark:text-white placeholder-[#8F95A8]"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-7 pb-2 flex flex-col gap-2">
          {filtered.length === 0 && <p className="text-sm text-[#8F95A8] text-center py-8">Foydalanuvchi topilmadi</p>}
          {filtered.map(u => {
            const checked = !!local.find(x => x.id === u.id)
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggle(u)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border  cursor-pointer text-left
                  ${checked
                    ? 'border-[#526ED3] bg-[#EEF1FB] dark:bg-[#1C2340] dark:border-[#526ED3]'
                    : 'border-[#E2E6F2] dark:border-[#292A2A] bg-white dark:bg-[#191A1A] hover:bg-[#F8F9FC] dark:hover:bg-[#222323]'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center 
                  ${checked ? 'border-[#526ED3] bg-[#526ED3]' : 'border-[#C2C8E0] dark:border-[#474848]'}`}>
                  {checked && (
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-xs font-bold text-[#526ED3] shrink-0">
                  {(u.username ?? '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A1D2E] dark:text-white truncate">{u.username}</p>
                  <p className="text-xs text-[#8F95A8]">{u.position_info?.name || u.roles?.[0] || '—'}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 flex items-center justify-between shrink-0 border-t border-[#F1F3F9] dark:border-[#292A2A]">
          <span className="text-sm text-[#8F95A8]">{local.length} ta tanlangan</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocal([])}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
                text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]"
            >
              <FaXmark size={13} /> Tozalash
            </button>
            <button
              onClick={() => onApply(local)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]"
            >
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main TaskFilterModal ─── */
export default function TaskFilterModal({ onClose, onApply, initial }) {
  const [f, setF] = useState({ ...TASK_EMPTY_FILTER, ...initial })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const [subModal, setSubModal] = useState(null) // 'project' | 'author'

  const [projectsList, setProjectsList] = useState([])
  const [usersList, setUsersList] = useState([])

  useEffect(() => {
    axiosAPI.get('/projects/', { params: { page_size: 100 } })
      .then(res => {
        const payload = res.data?.data ?? res.data
        const list = Array.isArray(payload) ? payload : (payload.results ?? [])
        setProjectsList(list)
      }).catch(() => {})

    axiosAPI.get('/users/', { params: { page_size: 200 } })
      .then(res => {
        const payload = res.data?.data ?? res.data
        const list = Array.isArray(payload) ? payload : (payload.results ?? [])
        setUsersList(list)
      }).catch(() => {})
  }, [])

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />
        <button
          onClick={onClose}
          className="fixed top-5 right-5 w-9 h-9 flex items-center justify-center rounded-full bg-[#FFFFFF29] hover:bg-[#FFFFFF40] text-white cursor-pointer  z-[200]"
        >
          <FaXmark size={14} />
        </button>

        <div className="relative w-full max-w-[600px] rounded-3xl shadow-2xl bg-white dark:bg-[#111111]">

          {/* Header */}
          <div className="px-7 pt-7 pb-3">
            <div className="flex items-center gap-3 mb-1.5">
              <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-60 cursor-pointer shrink-0">
                <FaArrowLeft size={17} />
              </button>
              <h2 className="text-[20px] font-extrabold text-[#1A1D2E] dark:text-white">Filtrlash</h2>
            </div>
            <p className="text-sm text-[#5B6078]">Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi</p>
          </div>

          {/* Body */}
          <div className="px-7 pb-5 pt-2 flex flex-col gap-4">

            {/* Loyiha */}
            <MultiChipField
              label="Loyiha"
              selected={f.projects}
              onRemove={item => set('projects', f.projects.filter(x => x.id !== item.id))}
              onClick={() => setSubModal('project')}
              placeholder="Loyiha tanlang"
            />

            {/* Muallif */}
            <MultiChipField
              label="Muallif"
              selected={f.authors}
              onRemove={item => set('authors', f.authors.filter(x => x.name !== item.name))}
              onClick={() => setSubModal('author')}
              placeholder="Muallif tanlang"
              renderChip={item => `${item.name} | ${item.role}`}
            />

            {/* Holati + Darajasi + Turi */}
            <div className="grid grid-cols-3 gap-3">
              <SimpleDropdown
                label="Holati"
                value={f.holat}
                onChange={v => set('holat', v)}
                options={HOLAT_LIST}
                placeholder="Holati tanlang"
              />
              <SimpleDropdown
                label="Darajasi"
                value={f.daraja}
                onChange={v => set('daraja', v)}
                options={LEVELS}
                placeholder="Daraja tanlang"
                renderOption={o => (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: LEVEL_COLORS[o] ?? '#9CA3AF' }} />
                    {o}
                  </span>
                )}
              />
              <SimpleDropdown
                label="Turi"
                value={f.turi}
                onChange={v => set('turi', v)}
                options={TYPES}
                placeholder="Turi tanlang"
              />
            </div>

            {/* Muddat oralig'i */}
            <div>
              <label className={labelCls}>Muddat oralig'i</label>
              <div className="grid grid-cols-4 gap-2">
                <DateTimeBox type="date" placeholder="dan"   value={f.deadFromD} onChange={v => set('deadFromD', v)} />
                <DateTimeBox type="time"                     value={f.deadFromT} onChange={v => set('deadFromT', v)} />
                <DateTimeBox type="date" placeholder="gacha" value={f.deadToD}   onChange={v => set('deadToD', v)} />
                <DateTimeBox type="time"                     value={f.deadToT}   onChange={v => set('deadToT', v)} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-[#1A1D2E] dark:text-white">Mening vazifalarim</span>
              <button
                type="button"
                onClick={() => set('myTasks', !f.myTasks)}
                className={`relative w-10 h-5 rounded-full  cursor-pointer
                  ${f.myTasks ? 'bg-[#3F57B3]' : 'bg-[#E2E6F2] dark:bg-[#292A2A]'}`}
              >
                <span className={`absolute left-0 top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                  ${f.myTasks ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setF({ ...TASK_EMPTY_FILTER })}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
                  text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#8F95A8] dark:hover:bg-[#1C1D1D]"
              >
                <FaXmark size={13} /> Tozalash
              </button>
              <button
                onClick={() => onApply(f)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                Qidirish
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      {subModal === 'project' && (
        <ProjectSelectModal
          selected={f.projects}
          onClose={() => setSubModal(null)}
          onApply={items => { set('projects', items); setSubModal(null) }}
          projectsList={projectsList}
        />
      )}
      {subModal === 'author' && (
        <AuthorSelectModal
          title="Muallif tanlang"
          selected={f.authors}
          onClose={() => setSubModal(null)}
          onApply={items => { set('authors', items); setSubModal(null) }}
          usersList={usersList}
        />
      )}
    </>
  )
}
