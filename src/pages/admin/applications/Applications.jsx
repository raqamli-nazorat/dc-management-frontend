import { useState, useEffect, useRef } from 'react'
import { MdExpandMore, MdCheck } from 'react-icons/md'
import { FaXmark, FaArrowLeft } from 'react-icons/fa6'
import { usePageAction } from '../../../context/PageActionContext'

const POSITIONS = ['Admin', 'Manager', 'Accountant', 'Tester', 'Developer', 'Designer']
const REGIONS = ['Tashkent region', 'Samarkand region', 'Bukhara region', 'Andijan region', "Fergana region", 'Namangan region', 'Kashkadarya region', 'Surkhandarya region', 'Khorezm region', 'Navoi region', 'Jizzakh region', 'Sirdarya region', "Karakalpakstan"]
const DISTRICTS = ['Yunusabad', 'Chilanzar', 'Mirzo Ulugbek', 'Shaykhantahur', 'Uchtepa', 'Yakkasaray', 'Olmazar', 'Bektemir', 'Sergeli', 'Yashnabad']
const STATUSES = ['Pending', 'Approved', 'Rejected']

const STATUS_COLORS = {
  Pending:  'text-[#F59E0B] bg-[#FEF3C7] dark:bg-[#F59E0B]/10',
  Approved: 'text-[#10B981] bg-[#D1FAE5] dark:bg-[#10B981]/10',
  Rejected: 'text-[#EF4444] bg-[#FEE2E2] dark:bg-[#EF4444]/10',
}

const INITIAL_DATA = [
  { id: 1, name: 'Doston Dostonov Dostonovich', position: 'Head Administrator', region: 'Tashkent region', district: 'Tashkent district', status: 'Pending',  createdAt: '01.01.2026 20:00' },
  { id: 2, name: 'Alyona Sokolova',             position: 'Senior Developer',    region: 'Samarkand region', district: 'Samarkand district', status: 'Approved', createdAt: '02.01.2026 10:30' },
  { id: 3, name: 'Timur Akhmedov',              position: 'Project Manager',     region: 'Bukhara region',   district: 'Bukhara district',   status: 'Rejected', createdAt: '03.01.2026 14:15' },
  { id: 4, name: 'Irina Petrovna',              position: 'UI/UX Designer',      region: 'Andijan region',   district: 'Andijan district',   status: 'Pending',  createdAt: '04.01.2026 09:00' },
  { id: 5, name: 'Sergei Ivanovich',            position: 'DBA',                 region: 'Tashkent region',  district: 'Yunusabad district', status: 'Approved', createdAt: '05.01.2026 16:45' },
]

/* ── Shared dropdown ── */
function FilterSelect({ options, value, onChange, width = 220 }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos]   = useState({})
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
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
      <button
        type="button" onClick={toggle}
        className="flex items-center gap-2 w-full cursor-pointer transition-colors
          bg-white border border-[#E2E6F2] text-[#1A1D2E]
          dark:bg-[#222323] dark:border-[#292A2A] dark:text-white"
        style={{ fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 12 }}
      >
        <span className="flex-1 text-left truncate">{value}</span>
        <MdExpandMore size={16} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: dark ? '#fff' : '#8F95A8' }} />
      </button>
      {open && (
        <div
          className="rounded-2xl shadow-xl bg-white dark:bg-[#1C1D1D]"
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
            <button key={opt} type="button"
              onClick={() => { onChange(opt); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
              style={{ fontSize: 13, fontWeight: 500, color: dark ? '#fff' : '#1A1D2E', background: value === opt ? (dark ? '#303131' : '#F1F3F9') : 'transparent' }}
            >{opt}</button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Add modal ── */
function AddModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', position: '', region: '', district: '', status: 'Pending' })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const inputCls = `w-full px-3 py-2.5 rounded-lg text-sm outline-none border transition-colors
    bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#B6BCCB] focus:border-[#526ED3]
    dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white dark:placeholder-[#8E95B5]`
  const labelCls = 'block text-xs font-medium text-[#5B6078] dark:text-[#C2C8E0] mb-1'

  const submit = () => {
    if (!form.name.trim()) return
    const now = new Date()
    const p = n => String(n).padStart(2, '0')
    onAdd({ id: Date.now(), ...form, createdAt: `${p(now.getDate())}.${p(now.getMonth()+1)}.${now.getFullYear()} ${p(now.getHours())}:${p(now.getMinutes())}` })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[520px] rounded-2xl shadow-2xl bg-white dark:bg-[#222323]">
        <div className="px-7 pt-7 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <button onClick={onClose} className="text-[#1A1D2E] dark:text-white hover:opacity-70 cursor-pointer"><FaArrowLeft size={16} /></button>
            <h2 className="text-xl font-bold text-[#1A1D2E] dark:text-white">Add New Application</h2>
          </div>
          <p className="text-sm text-[#8F95A8] dark:text-[#C2C8E0] ml-7">Fill in the details to register a new application</p>
        </div>
        <div className="px-7 pb-4 flex flex-col gap-4">
          <div>
            <label className={labelCls}>Full Name</label>
            <input className={inputCls} placeholder="Full name" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Position</label>
            <FilterSelect options={['Select position', ...POSITIONS]} value={form.position || 'Select position'} onChange={v => set('position', v === 'Select position' ? '' : v)} width="100%" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Region</label>
              <FilterSelect options={['Select region', ...REGIONS]} value={form.region || 'Select region'} onChange={v => set('region', v === 'Select region' ? '' : v)} />
            </div>
            <div>
              <label className={labelCls}>District</label>
              <FilterSelect options={['Select district', ...DISTRICTS]} value={form.district || 'Select district'} onChange={v => set('district', v === 'Select district' ? '' : v)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <FilterSelect options={STATUSES} value={form.status} onChange={v => set('status', v)} width="100%" />
          </div>
        </div>
        <div className="px-7 py-5 flex items-center justify-end gap-3">
          <button onClick={onClose} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer text-[#5B6078] hover:bg-[#F1F3F9] dark:text-[#C2C8E0] dark:hover:bg-[#292A2A]">
            <FaXmark size={14} /> Cancel
          </button>
          <button onClick={submit} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer bg-[#3F57B3] text-white hover:bg-[#526ED3]">
            <MdCheck size={16} /> Add
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main ── */
export default function ApplicationsPage() {
  const { registerAction, clearAction } = usePageAction()
  const [data, setData]           = useState(INITIAL_DATA)
  const [search, setSearch]       = useState('')
  const [filterStatus, setFilter] = useState('All statuses')
  const [showFilter, setShowFilter] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    registerAction({
      label: 'Add',
      icon: <img src="/imgs/add-team.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowModal(true),
    })
    return () => clearAction()
  }, [registerAction, clearAction])

  const filtered = data.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus !== 'All statuses' && a.status !== filterStatus) return false
    return true
  })

  return (
    <div className="flex flex-col gap-5">
      {showModal && <AddModal onClose={() => setShowModal(false)} onAdd={item => setData(p => [item, ...p])} />}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white dark:bg-[#222323] border-[#E2E6F2] dark:border-[#292A2A]" style={{ minWidth: 240 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#8F95A8] shrink-0">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="flex-1 bg-transparent outline-none text-sm text-[#1A1D2E] dark:text-white placeholder-[#8F95A8]"
            placeholder="Search by full name"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilter(o => !o)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors text-sm font-medium
            bg-white border-[#E2E6F2] text-[#1A1D2E] hover:bg-[#F1F3F9]
            dark:bg-[#222323] dark:border-[#292A2A] dark:text-white dark:hover:bg-[#292A2A]"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
            <path d="M3 6h18M7 12h10M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Filter
        </button>
        {showFilter && (
          <FilterSelect options={['All statuses', ...STATUSES]} value={filterStatus} onChange={setFilter} width={180} />
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#E2E6F2] dark:border-[#292A2A] overflow-hidden bg-white dark:bg-[#222323]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
              {['#', 'Full Name', 'Position', 'Region', 'District', 'Status', 'Created At'].map((h, i) => (
                <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-[#8F95A8] dark:text-[#C2C8E0] whitespace-nowrap">
                  {h === 'Position' ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />{h}
                    </span>
                  ) : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-[#8F95A8]">No data found</td></tr>
            ) : filtered.map((a, idx) => (
              <tr key={a.id} className="border-b border-[#E2E6F2] dark:border-[#292A2A] last:border-0 hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A] transition-colors">
                <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0]">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{a.name}</td>
                <td className="px-4 py-3 text-[#5B6078] dark:text-[#C2C8E0]">{a.position}</td>
                <td className="px-4 py-3 text-[#5B6078] dark:text-[#C2C8E0]">{a.region}</td>
                <td className="px-4 py-3 text-[#5B6078] dark:text-[#C2C8E0]">{a.district}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[a.status] || ''}`}>{a.status}</span>
                </td>
                <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0] whitespace-nowrap">{a.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
