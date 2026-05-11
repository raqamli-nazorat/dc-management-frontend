import { useState, useRef, useEffect } from 'react'
import { FaXmark, FaArrowLeft, FaChevronDown, FaChevronRight } from 'react-icons/fa6'
import { LuSearch, LuSlidersHorizontal } from 'react-icons/lu'
import { DateTimeBox } from '../../Components/DateTimeBox'
import { axiosAPI } from '../../../../service/axiosAPI'
import EmployeeStep from '../../Reports/Modals/EmployeeStep'
import { useAuth } from '../../../../context/AuthContext'

/* ─── constants ─── */
const labelCls = 'block text-xs font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1.5'

const HOLAT_LIST = [
  { label: 'Bajarilishi kerak', value: 'todo' },
  { label: 'Jarayonda', value: 'in_progress' },
  { label: "Muddati o'tgan", value: 'overdue' },
  { label: 'Bajarilgan', value: 'done' },
  { label: 'Ishga tushirilgan', value: 'production' },
  { label: 'Tekshirilgan', value: 'checked' },
  { label: 'Rad etilgan', value: 'rejected' },
  { label: 'Bekor qilingan', value: 'cancelled' },
]

// Joriy oyning birinchi va oxirgi sanasini YYYY-MM-DD formatda qaytaradi
function getMonthRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    from: `${y}-${m}-01`,
    to: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
  }
}

export const TASK_EMPTY_FILTER = {
  projects: [],
  created_by: [],
  assignee: [],
  holat: '',
  daraja: '',
  turi: '',
  deadFromD: '',
  deadFromT: '',
  deadToD: '',
  deadToT: '',
}

function getDefaultFilter() {
  const { from, to } = getMonthRange()
  return {
    ...TASK_EMPTY_FILTER,
    deadFromD: from,
    deadFromT: '00:00',
    deadToD: to,
    deadToT: '23:59',
  }
}

/* ─── SimpleDropdown — { label, value } yoki string options ─── */
function SimpleDropdown({ label, value, onChange, options, placeholder, renderOption }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // options { label, value } yoki string bo'lishi mumkin
  const getVal = o => (typeof o === 'object' ? o.value : o)
  const getLabel = o => (typeof o === 'object' ? o.label : (renderOption ? renderOption(o) : o))
  const selectedLabel = (() => {
    const found = options.find(o => getVal(o) === value)
    return found ? getLabel(found) : null
  })()

  return (
    <div>
      {label && <label className={labelCls}>{label}</label>}
      <div ref={ref} className="relative">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm border cursor-pointer
            bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]
            ${value ? 'text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}`}
        >
          <span className="flex-1 text-left truncate">
            {selectedLabel || placeholder}
          </span>
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            {value && (
              <span onMouseDown={e => { e.stopPropagation(); onChange('') }}
                className="text-[var(--text-disabled)] hover:text-[var(--text-sub)] cursor-pointer">
                <FaXmark size={11} />
              </span>
            )}
            <FaChevronDown size={11} className={`text-[var(--text-soft)] transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 z-[70] w-full rounded-2xl shadow-xl border overflow-y-auto max-h-52
            bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
            {options.map((o, i) => (
              <button
                key={getVal(o)}
                type="button"
                onClick={() => { onChange(getVal(o)); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm cursor-pointer
                  ${i < options.length - 1 ? 'border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]' : ''}
                  ${value === getVal(o)
                    ? 'bg-[#EEF1FB] text-[var(--accent-strong)] font-semibold dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]'
                    : 'text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]'}`}
              >
                {typeof o === 'object' ? o.label : (renderOption ? renderOption(o) : o)}
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
          bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]"
      >
        {selected?.length === 0 ? (
          <span className="flex-1 text-sm text-[var(--text-soft)] dark:text-[var(--text-sub)]">{placeholder}</span>
        ) : (
          <span className="flex flex-wrap gap-1.5 flex-1">
            {selected?.map(item => (
              <span
                key={item.id || item}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium
                  bg-[#EEF1FB] text-[var(--accent-strong)] dark:bg-[var(--bg-elevation-2)] dark:text-[var(--accent-soft)]"
              >
                <span className="truncate max-w-[130px]">
                  {renderChip ? renderChip(item) : (item.username || item.name || item)}
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
        <FaChevronRight size={11} className="text-[var(--text-soft)] shrink-0 ml-auto" />
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

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("keydown", handleKey)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div className="fixed inset-0 " />

      <button onClick={onClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer bg-white/20 text-white hover:bg-white/30">
        <FaXmark size={16} />
      </button>

      <div className="relative w-full max-w-[600px] h-[600px] rounded-3xl shadow-2xl bg-[var(--bg-base)] flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-7 pt-7 pb-4 shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Loyiha tanlang</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                local.length === projectsList.length
                  ? setLocal([])
                  : setLocal(projectsList.map(p => ({ id: p.id, name: p.title })))
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]
                text-[var(--text-sub)] dark:text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-1)] cursor-pointer  shrink-0"
            >
              <LuSlidersHorizontal size={12} /> Barchasi tanlash
            </button>
            <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-base)]">
              <LuSearch size={13} className="text-[var(--text-soft)] shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Loyiha nomi bo'yicha izlash"
                className="flex-1 text-sm outline-none bg-transparent text-[var(--text-strong)] dark:text-[var(--text-strong)] placeholder-[var(--text-sub)]"
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-7 pb-2 flex flex-col gap-2">
          {filtered?.length === 0 && <p className="text-sm text-[var(--text-soft)] text-center py-8">Loyiha topilmadi</p>}
          {filtered?.map(p => {
            const checked = !!local.find(x => x.id === p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border  cursor-pointer text-left
                  ${checked
                    ? 'border-[var(--accent-sub)] bg-[#EEF1FB] dark:bg-[#1C2340] dark:border-[var(--accent-sub)]'
                    : 'border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)] bg-[var(--bg-base)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-1)]'}`}
              >
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center 
                  ${checked ? 'border-[var(--accent-sub)] bg-[var(--accent-sub)]' : 'border-[#C2C8E0] dark:border-[var(--stroke-sub)]'}`}>
                  {checked && (
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <p className="text-sm font-semibold text-[var(--text-strong)] dark:text-[var(--text-strong)] truncate flex-1">{p.title}</p>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 flex items-center justify-between shrink-0 ">
          <span className="text-sm text-[var(--text-soft)]">{local.length} ta tanlangan</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocal([])}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
                text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]"
            >
              <FaXmark size={13} /> Tozalash
            </button>
            <button
              onClick={() => onApply(local)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]"
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
  const { user } = useAuth()

  const [f, setF] = useState(() => ({ ...getDefaultFilter(), ...initial }))
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const [subModal, setSubModal] = useState(null) // 'project' | 'author'

  const [projectsList, setProjectsList] = useState([])
  const [authorsList, setAuthorsList] = useState([])
  const [allUsersList, setAllUsersList] = useState([])

  const handleSelectEmployees = (selectedIds) => {
    const selectedObjects = selectedIds.map(id => {
      return allUsersList.find(a => a.id === id) || authorsList.find(a => a.id === id) || { id, username: `ID: ${id}` }
    })
    setF(prev => ({ ...prev, created_by: selectedObjects }))
    setSubModal(null)
  }

  const handleSelectAssignee = (selectedIds) => {
    const selectedObjects = selectedIds.map(id => {
      return allUsersList.find(a => a.id === id) || authorsList.find(a => a.id === id) || { id, username: `ID: ${id}` }
    })
    setF(prev => ({ ...prev, assignee: selectedObjects }))
    setSubModal(null)
  }


  useEffect(() => {
    axiosAPI.get('/project-shorts/', { params: { page_size: 200 } })
      .then(res => {
        const payload = res.data?.data ?? res.data
        const list = Array.isArray(payload) ? payload : (payload.results ?? [])
        setProjectsList(list)
      }).catch(() => {
        axiosAPI.get('/projects/', { params: { page_size: 100 } })
          .then(res => {
            const payload = res.data?.data ?? res.data
            const list = Array.isArray(payload) ? payload : (payload.results ?? [])
            setProjectsList(list)
          }).catch(() => { })
      })

    // Admin/manager uchun muallif ro'yxati
    axiosAPI.get('/users/all/', { params: { roles: 'admin' } })
      .then(res => {
        setAuthorsList(res.data?.data?.results || [])
      }).catch(() => { })

    // Barcha userlar — xodim tanlashda username topish uchun
    axiosAPI.get('/users/all/', { params: { page_size: 500 } })
      .then(res => {
        setAllUsersList(res.data?.data?.results || [])
      }).catch(() => { })
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && !subModal) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => {
      window.removeEventListener("keydown", handleKey)
    }
  }, [onClose, subModal])

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="fixed inset-0 bg-black/60" />

        <button onClick={onClose} className="fixed top-5 right-5 z-10 w-8 h-8 flex items-center justify-center rounded-full cursor-pointer bg-white/20 text-white hover:bg-white/30">
          <FaXmark size={16} />
        </button>

        <div className="relative w-full max-w-[600px] h-[600px] rounded-3xl shadow-2xl bg-[var(--bg-base)] flex flex-col">

          {/* Header */}
          <div className="px-7 pt-7 pb-3">
            <div className="flex items-center gap-3 mb-1.5">
              <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0">
                <FaArrowLeft size={17} />
              </button>
              <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Filtrlash</h2>
            </div>
            <p className="text-sm text-[var(--text-sub)]">Kerakli filtrlarni tanlang, natijalar shunga qarab saralanadi</p>
          </div>

          {/* Body */}
          <div className="px-7 pb-5 pt-2 flex flex-col gap-4 flex-1">

            {/* Loyiha */}
            <MultiChipField
              label="Loyiha"
              selected={f.projects}
              onRemove={item => set('projects', f.projects.filter(x => x.id !== item.id))}
              onClick={() => setSubModal('project')}
              placeholder="Loyiha tanlang"
            />

            <div className='grid grid-cols-2 gap-2'>
              {/* Muallif */}
              <MultiChipField
                label="Muallif"
                selected={f.created_by}
                onRemove={item => set('created_by', f.created_by.filter(x => (x.id ?? x) !== (item.id ?? item)))}
                onClick={() => setSubModal('created_by')}
                placeholder="Muallif tanlang"
              />

              <MultiChipField
                label="Xodim"
                selected={f.assignee}
                onRemove={item => set('assignee', f.assignee.filter(x => (x.id ?? x) !== (item.id ?? item)))}
                onClick={() => setSubModal('assignee')}
                placeholder="Xodim tanlang"
              />
            </div>


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
                options={[
                  { label: 'Past', value: 'low' },
                  { label: "O'rta", value: 'medium' },
                  { label: 'Yuqori', value: 'high' },
                  { label: 'Kritik', value: 'critical' },
                ]}
                placeholder="Daraja tanlang"
              />
              <SimpleDropdown
                label="Turi"
                value={f.turi}
                onChange={v => set('turi', v)}
                options={[
                  { label: 'Xatolik (Bug)', value: 'bug' },
                  { label: 'Yangi funksiya', value: 'feature' },
                  { label: "Qo'shimcha", value: 'extra' },
                  { label: "Tadqiqot/O'rganish", value: 'research' },
                ]}
                placeholder="Turi tanlang"
              />
            </div>

            {/* Muddat oralig'i */}
            <div>
              <label className={labelCls}>Muddat oralig'i</label>
              <div className="grid grid-cols-4 gap-2">
                <DateTimeBox type="date" placeholder="dan" value={f.deadFromD}
                  onChange={v => {
                    set('deadFromD', v)
                    if (v && !f.deadFromT) set('deadFromT', '23:59')
                  }} />
                <DateTimeBox type="time" value={f.deadFromT} onChange={v => set('deadFromT', v)} />
                <DateTimeBox type="date" placeholder="gacha" value={f.deadToD}
                  onChange={v => {
                    set('deadToD', v)
                    if (v && !f.deadToT) set('deadToT', '23:59')
                  }} />
                <DateTimeBox type="time" value={f.deadToT} onChange={v => set('deadToT', v)} />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-5 flex items-center  justify-end">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setF(getDefaultFilter())}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
                  text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]"
              >
                <FaXmark size={13} /> Tozalash
              </button>
              <button
                onClick={() => onApply(f)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-sub)]"
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

      {subModal === 'created_by' && (
        <EmployeeStep
          onClose={() => setSubModal(null)}
          param={{ roles: "admin,manager" }}
          title='Muallif tanlash'
          selectedList={f.created_by ? f.created_by.map(u => u.id || u) : []}
          onConfirm={handleSelectEmployees}
          bgColor={false}
        />
      )}

      {subModal === 'assignee' && (
        <EmployeeStep
          onClose={() => setSubModal(null)}
          employee_role={user.active_role !== "admin" ? "employee" : "all"}
          title='Xodim tanlang'
          selectedList={f.assignee ? f.assignee.map(u => u.id || u) : []}
          onConfirm={handleSelectAssignee}
          bgColor={false}
        />
      )}
    </>
  )
}
