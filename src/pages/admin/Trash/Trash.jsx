import { useState, useRef, useEffect } from 'react'
import { FaEllipsisVertical, FaCheck, FaTrashCan } from 'react-icons/fa6'
import { ConfirmationModal } from '../../../components/ConfirmationModal'
import { toast } from '../../../Toast/ToastProvider'
import EmptyState from '../../../components/EmptyState'

/* ── Mock data ── */
const DELETED_PROJECTS = [
  { id: 1, name: 'Crm sistema',   manager: "Dudan Turg'unov",    status: "O'chirilgan", startDate: '01.01.2024 20:00', deadline: '01.01.2024 20:00' },
  { id: 2, name: 'Dashboard',     manager: "To'raqul Fozilov",   status: "O'chirilgan", startDate: '01.01.2024 20:00', deadline: '01.01.2024 20:00' },
  { id: 3, name: 'SaaS loyiha',   manager: 'Davron Turdiyev',    status: "O'chirilgan", startDate: '01.01.2024 20:00', deadline: '01.01.2024 20:00' },
]

const DELETED_TASKS = [
  { id: 1, code: 'TASD', name: "Dashboard qo'shish", project: 'Crm sistema', creator: "Dudan Turg'unov", assignee: "Dudan Turg'unov", type: "Qo'shimcha", level: 'Kritik', status: "O'chirilgan", deadline: '01.01.2024 20:00' },
  { id: 2, code: 'TASD', name: 'Login sahifasi',     project: 'Dashboard',   creator: "To'raqul Fozilov", assignee: "To'raqul Fozilov", type: 'Xato',       level: 'Yuqori', status: "O'chirilgan", deadline: '15.02.2024 18:00' },
]

/* ── Row menu ── */
function RowMenu({ onRestore, onDelete }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8F95A8] hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A] transition-colors cursor-pointer"
      >
        <FaEllipsisVertical size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-[180px] rounded-2xl shadow-xl border overflow-hidden
          bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
          <button
            onClick={() => { onRestore(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#1A1D2E] dark:text-white
              hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A] transition-colors cursor-pointer border-b border-[#F1F3F9] dark:border-[#2A2B2B]"
          >
            <FaCheck size={13} className="text-[#22c55e]" />
            Tiklash
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#E02D2D]
              hover:bg-[#FFF5F5] dark:hover:bg-[#2A1A1A] transition-colors cursor-pointer"
          >
            <FaTrashCan size={13} />
            Butunlay o'chirish
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Projects Tab ── */
function ProjectsTab() {
  const [projects, setProjects] = useState(DELETED_PROJECTS)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmRestore, setConfirmRestore] = useState(null)

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.manager.toLowerCase().includes(search.toLowerCase())
  )

  const doRestore = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id))
    toast.success('Loyiha tiklandi', 'Loyiha avvalgi holatiga qaytarildi')
  }

  const doDelete = (id) => {
    setProjects(prev => prev.filter(p => p.id !== id))
    toast.delete("Muvaffaqiyatli o'chirildi", "Tanlangan ma'lumot butunlay o'chirildi")
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      {/* Search */}
      <div className="relative w-[220px] shrink-0">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8]"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Loyihani izlash"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none border transition-colors
            bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8]
            dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white dark:placeholder-[#5B6078]
            focus:border-[#526ED3]"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">№</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Nomi</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Menejer
                </span>
              </th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Holati</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Boshlanish sanasi</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Muddati</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr
                key={p.id}
                className="border-b border-[#EEF1F7] dark:border-[#292A2A] last:border-0 hover:bg-black/2 dark:hover:bg-white/2 transition-colors"
              >
                <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0] text-xs font-medium">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{p.name}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{p.manager}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-[#E2E6F2] text-[#5B6078] dark:border-[#292A2A] dark:text-[#C2C8E0]">
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{p.startDate}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{p.deadline}</td>
                <td className="px-4 py-3">
                  <RowMenu
                    onRestore={() => setConfirmRestore(p.id)}
                    onDelete={() => setConfirmDelete(p.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <EmptyState
            icon="/imgs/delete-02.svg"
            title="Chiqindi qutisi bo'sh"
            description="O'chirilgan loyihalar bu yerda ko'rinadi"
          />
        )}
      </div>

      {/* Restore confirm */}
      <ConfirmationModal
        showModal={!!confirmRestore}
        title="Tiklashni tasdiqlaysizmi?"
        description="Tanlangan loyiha avvalgi holatiga qaytariladi"
        buttonText="Tiklash"
        confirmIcon={<FaCheck size={13} />}
        confirmColor="bg-[#22c55e] hover:bg-green-600"
        onClose={() => setConfirmRestore(null)}
        onAction={() => { doRestore(confirmRestore); setConfirmRestore(null) }}
      />

      {/* Delete confirm */}
      <ConfirmationModal
        showModal={!!confirmDelete}
        title="Butunlay o'chirmoqchimisiz?"
        description="Bu amalni bekor qilib bo'lmaydi. Ma'lumotlar butunlay o'chiriladi"
        buttonText="O'chirish"
        confirmIcon={<FaTrashCan size={13} />}
        confirmColor="bg-[#E02D2D] hover:bg-red-600"
        onClose={() => setConfirmDelete(null)}
        onAction={() => { doDelete(confirmDelete); setConfirmDelete(null) }}
      />
    </div>
  )
}

/* ── Tasks Tab ── */
function TasksTab() {
  const [tasks, setTasks] = useState(DELETED_TASKS)
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [confirmRestore, setConfirmRestore] = useState(null)

  const filtered = tasks.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.project.toLowerCase().includes(search.toLowerCase())
  )

  const doRestore = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    toast.success('Vazifa tiklandi', 'Vazifa avvalgi holatiga qaytarildi')
  }

  const doDelete = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    toast.delete("Muvaffaqiyatli o'chirildi", "Tanlangan ma'lumot butunlay o'chirildi")
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      {/* Search */}
      <div className="relative w-[220px] shrink-0">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8]"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Vazifani izlash"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none border transition-colors
            bg-white border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8]
            dark:bg-[#191A1A] dark:border-[#292A2A] dark:text-white dark:placeholder-[#5B6078]
            focus:border-[#526ED3]"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[#E2E6F2] dark:border-[#292A2A]">
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">№</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Nomi</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Loyiha</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Yaratuvchi</th>
              <th className="px-4 py-3 text-left font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Topshiruvchi
                </span>
              </th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Turi</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Darajasi</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Holati</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Muddati</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr
                key={t.id}
                className="border-b border-[#EEF1F7] dark:border-[#292A2A] last:border-0 hover:bg-black/2 dark:hover:bg-white/2 transition-colors"
              >
                <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0] text-xs font-medium">{t.code}</td>
                <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{t.name}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.project}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.creator}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.assignee}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{t.type}</td>
                <td className="px-4 py-3 text-right font-medium text-[#1A1D2E] dark:text-white">{t.level}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-[#E2E6F2] text-[#5B6078] dark:border-[#292A2A] dark:text-[#C2C8E0]">
                    {t.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{t.deadline}</td>
                <td className="px-4 py-3">
                  <RowMenu
                    onRestore={() => setConfirmRestore(t.id)}
                    onDelete={() => setConfirmDelete(t.id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <EmptyState
            icon="/imgs/delete-02.svg"
            title="Chiqindi qutisi bo'sh"
            description="O'chirilgan vazifalar bu yerda ko'rinadi"
          />
        )}
      </div>

      {/* Restore confirm */}
      <ConfirmationModal
        showModal={!!confirmRestore}
        title="Tiklashni tasdiqlaysizmi?"
        description="Tanlangan vazifa avvalgi holatiga qaytariladi"
        buttonText="Tiklash"
        confirmIcon={<FaCheck size={13} />}
        confirmColor="bg-[#22c55e] hover:bg-green-600"
        onClose={() => setConfirmRestore(null)}
        onAction={() => { doRestore(confirmRestore); setConfirmRestore(null) }}
      />

      {/* Delete confirm */}
      <ConfirmationModal
        showModal={!!confirmDelete}
        title="Butunlay o'chirmoqchimisiz?"
        description="Bu amalni bekor qilib bo'lmaydi. Ma'lumotlar butunlay o'chiriladi"
        buttonText="O'chirish"
        confirmIcon={<FaTrashCan size={13} />}
        confirmColor="bg-[#E02D2D] hover:bg-red-600"
        onClose={() => setConfirmDelete(null)}
        onAction={() => { doDelete(confirmDelete); setConfirmDelete(null) }}
      />
    </div>
  )
}

/* ── Main Page ── */
export default function TrashPage() {
  const [activeTab, setActiveTab] = useState('projects')

  const tabs = [
    { id: 'projects', label: 'Loyihalar' },
    { id: 'tasks',    label: 'Vazifalar' },
  ]

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-white shrink-0">Chiqindi qutisi</h1>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E2E6F2] dark:border-[#292A2A] shrink-0 mt-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-[#526ED3] text-[#526ED3] dark:text-[#7F95E6] dark:border-[#7F95E6]'
                : 'border-transparent text-[#5B6078] dark:text-[#8F95A8] hover:text-[#1A1D2E] dark:hover:text-white',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content — flex-1 to fill remaining height */}
      <div className="flex flex-col flex-1 min-h-0 pt-4">
        {activeTab === 'projects' ? <ProjectsTab /> : <TasksTab />}
      </div>
    </div>
  )
}
