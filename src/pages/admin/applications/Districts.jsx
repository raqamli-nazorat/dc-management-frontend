import { useState, useEffect, useRef } from 'react'
import { MdCheck, MdExpandMore } from 'react-icons/md'
import { FaXmark, FaArrowLeft, FaTrash, FaPen } from 'react-icons/fa6'
import { usePageAction } from '../../../context/PageActionContext'

const REGIONS = [
  'Tashkent region', 'Samarkand region', 'Bukhara region',
  'Andijan region', 'Fergana region', 'Namangan region',
  'Kashkadarya region', 'Surkhandarya region', 'Khorezm region',
  'Navoi region', 'Jizzakh region', 'Sirdarya region', 'Karakalpakstan',
]

const INITIAL_DATA = [
  { id: 1, name: 'Yunusabad district',     region: 'Tashkent region',  createdAt: '01.01.2026' },
  { id: 2, name: 'Chilanzar district',     region: 'Tashkent region',  createdAt: '01.01.2026' },
  { id: 3, name: 'Mirzo Ulugbek district', region: 'Tashkent region',  createdAt: '01.01.2026' },
  { id: 4, name: 'Shaykhantahur district', region: 'Tashkent region',  createdAt: '01.01.2026' },
  { id: 5, name: 'Uchtepa district',       region: 'Tashkent region',  createdAt: '01.01.2026' },
  { id: 6, name: 'Samarkand district',     region: 'Samarkand region', createdAt: '01.01.2026' },
  { id: 7, name: 'Bukhara district',       region: 'Bukhara region',   createdAt: '01.01.2026' },
  { id: 8, name: 'Andijan district',       region: 'Andijan region',   createdAt: '01.01.2026' },
]

const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm outline-none border transition-colors
  bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#B6BCCB] focus:border-[#526ED3]
  dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white dark:placeholder-[#8E95B5]`
const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1'

/* ── Dropdown ── */
function Select({ options, value, onChange, width = 220 }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({})
  const ref = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggle = () => {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect()
      const up = window.innerHeight - r.bottom < 220
      const w  = Math.max(r.width, 200)
      const l  = r.left + w > window.innerWidth - 8 ? window.innerWidth - w - 8 : r.left
      setPos({ top: up ? r.top - 4 : r.bottom + 4, left: l, up, w })
    }
    setOpen(o => !o)
  }

  const dark = document.documentElement.classList.contains('dark')

  return (
    <div ref={ref} style={{ width }} className="relative">
      <button type="button" onClick={toggle}
        className="flex items-center gap-2 w-full cursor-pointer transition-colors
          bg-white border border-[#E2E6F2] text-[#1A1D2E]
          dark:bg-[#222323] dark:border-[#292A2A] dark:text-white"
        style={{ fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 12 }}
      >
        <span className="flex-1 text-left truncate">{value}</span>
        <MdExpandMore size={16} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: dark ? '#fff' : '#8F95A8' }} />
      </button>
      {open && (
        <div className="rounded-2xl shadow-xl bg-white dark:bg-[#1C1D1D]"
          style={{
            position: 'fixed',
            top:    pos.up ? 'auto' : pos.top,
            bottom: pos.up ? window.innerHeight - pos.top : 'auto',
            left: pos.left,
            border: dark ? '1px solid #292A2A' : '1px solid #EEF1F7',
            padding: '6px 8px', width: pos.w || width, maxHeight: 260, overflowY: 'auto', zIndex: 9999,
          }}
        >
          {options.map(opt => (
            <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
              style={{ fontSize: 13, fontWeight: 500, color: dark ? '#fff' : '#1A1D2E', background: value === opt ? (dark ? '#303131' : '#F1F3F9') : 'transparent' }}
            >{opt}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Modal ── */
function Modal({ title, initial, onClose, onSave }) {
  const [form, setForm] = useState(initial || { name: '', region: '' })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[480px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">
        <div className="px-7 pt-7 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-70 cursor-pointer"><FaArrowLeft size={16} /></button>
            <h2 className="text-xl font-bold text-[#1A1D2E] dark:text-white">{title}</h2>
          </div>
        </div>
        <div className="px-7 pb-4 flex flex-col gap-4">
          <div>
            <label className={labelCls}>District Name</label>
            <input className={inputCls} placeholder="District name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Region</label>
            <Select
              options={['Select region', ...REGIONS]}
              value={form.region || 'Select region'}
              onChange={v => setForm(p => ({ ...p, region: v === 'Select region' ? '' : v }))}
              width="100%"
            />
          </div>
        </div>
        <div className="px-7 py-5 flex items-center justify-end gap-3">
          <button onClick={onClose} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={14} /> Cancel
          </button>
          <button onClick={() => { if (form.name.trim()) { onSave(form); onClose() } }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <MdCheck size={16} /> Save
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmDelete({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[420px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323] p-7">
        <h2 className="text-lg font-bold text-[#1A1D2E] dark:text-white mb-2">Delete district?</h2>
        <p className="text-sm text-[#8F95A8] dark:text-[#C2C8E0] mb-6">This district will be permanently removed from the system.</p>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={14} /> Cancel
          </button>
          <button onClick={onConfirm} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer bg-[#E02D2D] text-white hover:bg-[#c42424]">
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main ── */
export default function DistrictsPage() {
  const { registerAction, clearAction } = usePageAction()
  const [data, setData]         = useState(INITIAL_DATA)
  const [search, setSearch]     = useState('')
  const [filterRegion, setFilter] = useState('All regions')
  const [addOpen, setAddOpen]   = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    registerAction({
      label: 'Add',
      icon: <img src="/imgs/add-team.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setAddOpen(true),
    })
    return () => clearAction()
  }, [registerAction, clearAction])

  const filtered = data.filter(d => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterRegion !== 'All regions' && d.region !== filterRegion) return false
    return true
  })

  const handleAdd  = (form) => {
    const now = new Date(); const p = n => String(n).padStart(2, '0')
    setData(prev => [{ id: Date.now(), ...form, createdAt: `${p(now.getDate())}.${p(now.getMonth()+1)}.${now.getFullYear()}` }, ...prev])
  }
  const handleEdit = (form) => setData(prev => prev.map(d => d.id === editItem.id ? { ...d, ...form } : d))

  return (
    <div className="flex flex-col gap-5">
      {addOpen  && <Modal title="Add District"  onClose={() => setAddOpen(false)}  onSave={handleAdd} />}
      {editItem && <Modal title="Edit District" initial={editItem} onClose={() => setEditItem(null)} onSave={handleEdit} />}
      {deleteId && <ConfirmDelete onClose={() => setDeleteId(null)} onConfirm={() => { setData(p => p.filter(d => d.id !== deleteId)); setDeleteId(null) }} />}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white dark:bg-[#222323] border-[#E2E6F2] dark:border-[#292A2A]" style={{ minWidth: 240 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#8F95A8] shrink-0">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input className="flex-1 bg-transparent outline-none text-sm text-[#1A1D2E] dark:text-white placeholder-[#8F95A8]"
            placeholder="Search by district name" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select options={['All regions', ...REGIONS]} value={filterRegion} onChange={setFilter} width={220} />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#E2E6F2] dark:border-[#292A2A] overflow-hidden bg-white dark:bg-[#222323]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
              {['#', 'District Name', 'Region', 'Created At', ''].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-[#8F95A8] dark:text-[#C2C8E0]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-[#8F95A8]">No data found</td></tr>
            ) : filtered.map((d, idx) => (
              <tr key={d.id} className="border-b border-[#E2E6F2] dark:border-[#292A2A] last:border-0 hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A] transition-colors">
                <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0]">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{d.name}</td>
                <td className="px-4 py-3 text-[#5B6078] dark:text-[#C2C8E0]">{d.region}</td>
                <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0]">{d.createdAt}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditItem(d)} className="p-2 rounded-lg text-[#526ED3] hover:bg-[#EEF1F7] dark:hover:bg-[#526ED3]/10 transition-colors cursor-pointer">
                      <FaPen size={12} />
                    </button>
                    <button onClick={() => setDeleteId(d.id)} className="p-2 rounded-lg text-[#EF4444] hover:bg-[#FEE2E2] dark:hover:bg-[#EF4444]/10 transition-colors cursor-pointer">
                      <FaTrash size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
