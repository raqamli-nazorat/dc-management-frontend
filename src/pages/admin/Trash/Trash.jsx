import { useState, useRef, useEffect, useCallback } from 'react'
import { FaEllipsisVertical, FaCheck, FaTrashCan } from 'react-icons/fa6'
import { ConfirmationModal } from '../../../components/ConfirmationModal'
import { toast } from '../../../Toast/ToastProvider'
import EmptyState from '../../../components/EmptyState'
import { axiosAPI } from '../../../service/axiosAPI'
import { getErrorMessage } from '../../../service/getErrorMessage'

/* ── format date ── */
const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

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
        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#8F95A8] hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A]  cursor-pointer"
      >
        <FaEllipsisVertical size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-[180px] rounded-2xl shadow-xl border overflow-hidden
          bg-white border-[#E2E6F2] dark:bg-[#1C1D1D] dark:border-[#2A2B2B]">
          <button
            onClick={() => { onRestore(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#1A1D2E] dark:text-white
              hover:bg-[#F8F9FC] dark:hover:bg-[#292A2A]  cursor-pointer border-b border-[#F1F3F9] dark:border-[#2A2B2B]"
          >
            <FaCheck size={13} className="text-[#22c55e]" />
            Tiklash
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#E02D2D]
              hover:bg-[#FFF5F5] dark:hover:bg-[#2A1A1A]  cursor-pointer"
          >
            <FaTrashCan size={13} />
            Butunlay o'chirish
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Skeleton rows ── */
function SkeletonRows({ cols = 6 }) {
  return Array.from({ length: 4 }).map((_, i) => (
    <tr key={i} className="border-b border-[#EEF1F7] dark:border-[#292A2A]">
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 rounded-lg bg-[#EEF1F7] dark:bg-[#292A2A] animate-pulse" style={{ width: j === 0 ? 24 : '80%' }} />
        </td>
      ))}
    </tr>
  ))
}

/* ── Projects Tab ── */
function ProjectsTab() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [confirmDelete, setConfirmDelete]   = useState(null)
  const [confirmRestore, setConfirmRestore] = useState(null)
  const [actionLoading, setActionLoading]   = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosAPI.get('/projects/trash/')
      const list = res.data?.data ?? res.data?.results ?? res.data ?? []
      setProjects(Array.isArray(list) ? list : [])
    } catch (err) {
      toast.error('Xatolik', getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = projects.filter(p =>
    (p.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (p.manager_info?.username ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const doRestore = async (id) => {
    setActionLoading(true)
    try {
      await axiosAPI.post(`/projects/${id}/restore/`)
      setProjects(prev => prev.filter(p => p.id !== id))
      toast.success('Loyiha tiklandi', 'Loyiha avvalgi holatiga qaytarildi')
    } catch (err) {
      toast.error('Xatolik', getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const doDelete = async (id) => {
    setActionLoading(true)
    try {
      await axiosAPI.delete(`/projects/${id}/hard_delete/`)
      setProjects(prev => prev.filter(p => p.id !== id))
      toast.delete("Muvaffaqiyatli o'chirildi", "Ma'lumot butunlay o'chirildi")
    } catch (err) {
      toast.error('Xatolik', getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const statusLabel = (s) => {
    const map = { planning: 'Rejalashtirilmoqda', active: 'Faol', completed: 'Yakunlangan', cancelled: "Bekor qilingan" }
    return map[s] || s || "O'chirilgan"
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
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none border 
              border-[#E2E6F2] text-[#1A1D2E] placeholder-[#8F95A8]
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
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Yaratilgan</th>
              <th className="px-4 py-3 text-right font-medium text-[#1B1F3B]/65 dark:text-[#C2C8E0]">Muddati</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={7} />
            ) : filtered.map((p, i) => (
              <tr key={p.id}
                className="border-b border-[#EEF1F7] dark:border-[#292A2A] last:border-0 hover:bg-black/2 dark:hover:bg-white/2 ">
                <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0] text-xs font-medium">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{p.title}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{p.manager_info?.username || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-[#E2E6F2] text-[#5B6078] dark:border-[#292A2A] dark:text-[#C2C8E0]">
                    {statusLabel(p.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{fmtDate(p.created_at)}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{fmtDate(p.deadline)}</td>
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

        {!loading && filtered.length === 0 && (
          <EmptyState
            icon="/imgs/delete-02.svg"
            title="Chiqindi qutisi bo'sh"
            description="O'chirilgan loyihalar bu yerda ko'rinadi"
          />
        )}
      </div>

      <ConfirmationModal
        showModal={!!confirmRestore}
        title="Tiklashni tasdiqlaysizmi?"
        description="Tanlangan loyiha avvalgi holatiga qaytariladi"
        buttonText={actionLoading ? 'Tiklanmoqda...' : 'Tiklash'}
        confirmIcon={<FaCheck size={13} />}
        confirmColor="bg-[#22c55e] hover:bg-green-600"
        onClose={() => setConfirmRestore(null)}
        onAction={() => { doRestore(confirmRestore); setConfirmRestore(null) }}
      />
      <ConfirmationModal
        showModal={!!confirmDelete}
        title="Butunlay o'chirmoqchimisiz?"
        description="Bu amalni bekor qilib bo'lmaydi. Ma'lumotlar butunlay o'chiriladi"
        buttonText={actionLoading ? "O'chirilmoqda..." : "O'chirish"}
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
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [confirmDelete, setConfirmDelete]   = useState(null)
  const [confirmRestore, setConfirmRestore] = useState(null)
  const [actionLoading, setActionLoading]   = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosAPI.get('/tasks/trash/')
      const list = res.data?.data ?? res.data?.results ?? res.data ?? []
      setTasks(Array.isArray(list) ? list : [])
    } catch (err) {
      toast.error('Xatolik', getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const filtered = tasks.filter(t =>
    (t.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (typeof t.project_info === 'object' ? t.project_info?.title : t.project_info ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.created_by_info?.username ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const doRestore = async (id) => {
    setActionLoading(true)
    try {
      await axiosAPI.post(`/tasks/${id}/restore/`)
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.success('Vazifa tiklandi', 'Vazifa avvalgi holatiga qaytarildi')
    } catch (err) {
      toast.error('Xatolik', getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const doDelete = async (id) => {
    setActionLoading(true)
    try {
      await axiosAPI.delete(`/tasks/${id}/hard_delete/`)
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.delete("Muvaffaqiyatli o'chirildi", "Ma'lumot butunlay o'chirildi")
    } catch (err) {
      toast.error('Xatolik', getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const priorityLabel = (p) => {
    const map = { low: 'Past', medium: "O'rta", high: 'Yuqori', critical: 'Kritik' }
    return map[p] || p || '—'
  }

  const typeLabel = (t) => {
    const map = { bug: 'Xato', feature: 'Yangi funksiya', task: 'Vazifa', improvement: "Qo'shimcha" }
    return map[t] || t || '—'
  }

  const statusLabel = (s) => {
    const map = { todo: 'Bajarilishi kerak', in_progress: 'Jarayonda', done: 'Bajarilgan', cancelled: 'Bekor qilingan' }
    return map[s] || s || "O'chirilgan"
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
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none border 
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
            {loading ? (
              <SkeletonRows cols={10} />
            ) : filtered.map((t, i) => (
              <tr key={t.id}
                className="border-b border-[#EEF1F7] dark:border-[#292A2A] last:border-0 hover:bg-black/2 dark:hover:bg-white/2 ">
                <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0] text-xs font-medium">{t.uid || i + 1}</td>
                <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{t.title}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{typeof t.project_info === 'object' ? t.project_info?.title : (t.project_info || '—')}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.created_by_info?.username || '—'}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.assignee_info?.username || '—'}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{typeLabel(t.type)}</td>
                <td className="px-4 py-3 text-right font-medium text-[#1A1D2E] dark:text-white">{priorityLabel(t.priority)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-[#E2E6F2] text-[#5B6078] dark:border-[#292A2A] dark:text-[#C2C8E0]">
                    {statusLabel(t.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{fmtDate(t.deadline)}</td>
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

        {!loading && filtered.length === 0 && (
          <EmptyState
            icon="/imgs/delete-02.svg"
            title="Chiqindi qutisi bo'sh"
            description="O'chirilgan vazifalar bu yerda ko'rinadi"
          />
        )}
      </div>

      <ConfirmationModal
        showModal={!!confirmRestore}
        title="Tiklashni tasdiqlaysizmi?"
        description="Tanlangan vazifa avvalgi holatiga qaytariladi"
        buttonText={actionLoading ? 'Tiklanmoqda...' : 'Tiklash'}
        confirmIcon={<FaCheck size={13} />}
        confirmColor="bg-[#22c55e] hover:bg-green-600"
        onClose={() => setConfirmRestore(null)}
        onAction={() => { doRestore(confirmRestore); setConfirmRestore(null) }}
      />
      <ConfirmationModal
        showModal={!!confirmDelete}
        title="Butunlay o'chirmoqchimisiz?"
        description="Bu amalni bekor qilib bo'lmaydi. Ma'lumotlar butunlay o'chiriladi"
        buttonText={actionLoading ? "O'chirilmoqda..." : "O'chirish"}
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

      <div className="flex items-center gap-1 border-b border-[#E2E6F2] dark:border-[#292A2A] shrink-0 mt-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2.5 text-sm font-semibold cursor-pointer border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-[#526ED3] text-[#526ED3] dark:text-[#7F95E6] dark:border-[#7F95E6]'
                : 'border-transparent text-[#5B6078] dark:text-[#8F95A8] hover:text-[#1A1D2E] dark:hover:text-white',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col flex-1 min-h-0 pt-4">
        {activeTab === 'projects' ? <ProjectsTab /> : <TasksTab />}
      </div>
    </div>
  )
}
