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
        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-soft)] hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]  cursor-pointer"
      >
        <FaEllipsisVertical size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-[180px] rounded-2xl shadow-xl border overflow-hidden
          bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
          <button
            onClick={() => { onRestore(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)]
              hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)]  cursor-pointer border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]"
          >
            <FaCheck size={13} className="text-[#22c55e]" />
            Tiklash
          </button>
          <button
            onClick={() => { onDelete(); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--error-strong)]
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
    <tr key={i} className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} className="px-4 py-3">
          <div className="h-4 rounded-lg bg-[#EEF1F7] dark:bg-[var(--bg-elevation-2)] animate-pulse" style={{ width: j === 0 ? 24 : '80%' }} />
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

  const fetchData = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const params = { page_size: 100 }
      if (q) params.search = q
      const res = await axiosAPI.get('/projects/trash/', { params })
      const payload = res.data?.data ?? res.data
      const list = Array.isArray(payload) ? payload : (payload.results ?? [])
      setProjects(list)
    } catch (err) {
      toast.error('Xatolik', getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchData(search), 400)
    return () => clearTimeout(t)
  }, [search, fetchData])

  const doRestore = async (id) => {
    setActionLoading(true)
    try {
      await axiosAPI.post(`/projects/${id}/restore/`)
      setProjects(prev => prev.filter(p => p.id !== id))
      toast.success('Loyiha tiklandi', 'Loyiha avvalgi holatiga qaytarildi')
    } catch (err) {
      const msg = err?.response?.data?.error?.errorMsg || getErrorMessage(err)
      toast.error('Xatolik', msg)
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
      const msg = err?.response?.data?.error?.errorMsg || getErrorMessage(err)
      toast.error('Xatolik', msg)
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
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Loyihani izlash"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none border 
              border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-soft)]
            dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)]
            focus:border-[var(--accent-sub)]"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">№</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Nomi</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Menejer
                </span>
              </th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Holati</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Yaratilgan</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Muddati</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={7} />
            ) : projects.map((p, i) => (
              <tr key={p.id}
                className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] last:border-0 hover:bg-black/2 dark:hover:bg-white/2 ">
                <td className="px-4 py-3 text-[var(--text-soft)] dark:text-[var(--text-sub)] text-xs font-medium">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">{p.title}</td>
                <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{p.manager_info?.username || '—'}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--stroke-sub)] text-[var(--text-sub)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-sub)]">
                    {statusLabel(p.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[var(--text-strong)] dark:text-[var(--text-strong)]">{fmtDate(p.created_at)}</td>
                <td className="px-4 py-3 text-right text-[var(--text-strong)] dark:text-[var(--text-strong)]">{fmtDate(p.deadline)}</td>
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

        {!loading && projects.length === 0 && (
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
        confirmColor="bg-[var(--error-strong)] hover:bg-red-600"
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

  const fetchData = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const params = { page_size: 100 }
      if (q) params.search = q
      const res = await axiosAPI.get('/tasks/trash/', { params })
      const payload = res.data?.data ?? res.data
      const list = Array.isArray(payload) ? payload : (payload.results ?? [])
      setTasks(list)
    } catch (err) {
      toast.error('Xatolik', getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchData(search), 400)
    return () => clearTimeout(t)
  }, [search, fetchData])

  const doRestore = async (id) => {
    setActionLoading(true)
    try {
      await axiosAPI.post(`/tasks/${id}/restore/`)
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.success('Vazifa tiklandi', 'Vazifa avvalgi holatiga qaytarildi')
    } catch (err) {
      const msg = err?.response?.data?.error?.errorMsg || getErrorMessage(err)
      toast.error('Xatolik', msg)
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
      const msg = err?.response?.data?.error?.errorMsg || getErrorMessage(err)
      toast.error('Xatolik', msg)
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
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Vazifani izlash"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none border 
            bg-[var(--bg-base)] border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-soft)]
            dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)]
            focus:border-[var(--accent-sub)]"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">№</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Nomi</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Loyiha</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Yaratuvchi</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Topshiruvchi
                </span>
              </th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Turi</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Darajasi</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Holati</th>
              <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Muddati</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={10} />
            ) : tasks.map((t, i) => (
              <tr key={t.id}
                className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] last:border-0 hover:bg-black/2 dark:hover:bg-white/2 ">
                <td className="px-4 py-3 text-[var(--text-soft)] dark:text-[var(--text-sub)] text-xs font-medium">{t.uid || i + 1}</td>
                <td className="px-4 py-3 font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">{t.title}</td>
                <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{typeof t.project_info === 'object' ? t.project_info?.title : (t.project_info || '—')}</td>
                <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{t.created_by_info?.username || '—'}</td>
                <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{t.assignee_info?.username || '—'}</td>
                <td className="px-4 py-3 text-right text-[var(--text-strong)] dark:text-[var(--text-strong)]">{typeLabel(t.type)}</td>
                <td className="px-4 py-3 text-right font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">{priorityLabel(t.priority)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-[var(--stroke-sub)] text-[var(--text-sub)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-sub)]">
                    {statusLabel(t.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-[var(--text-strong)] dark:text-[var(--text-strong)]">{fmtDate(t.deadline)}</td>
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

        {!loading && tasks.length === 0 && (
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
        confirmColor="bg-[var(--error-strong)] hover:bg-red-600"
        onClose={() => setConfirmDelete(null)}
        onAction={() => { doDelete(confirmDelete); setConfirmDelete(null) }}
      />
    </div>
  )
}

/* ── Meetings Tab ── */
function MeetingsTab() {
  const [meetings, setMeetings]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [confirmDelete, setConfirmDelete]   = useState(null)
  const [confirmRestore, setConfirmRestore] = useState(null)
  const [actionLoading, setActionLoading]   = useState(false)

  const fetchData = useCallback(async (q = '') => {
    setLoading(true)
    try {
      const params = { page_size: 100 }
      if (q) params.search = q
      const res = await axiosAPI.get('/meetings/trash/', { params })
      const payload = res.data?.data ?? res.data
      const list = Array.isArray(payload) ? payload : (payload.results ?? [])
      setMeetings(list)
    } catch (err) {
      toast.error('Xatolik', getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const t = setTimeout(() => fetchData(search), 400)
    return () => clearTimeout(t)
  }, [search, fetchData])

  const doRestore = async (id) => {
    setActionLoading(true)
    try {
      await axiosAPI.post(`/meetings/${id}/restore/`)
      setMeetings(prev => prev.filter(m => m.id !== id))
      toast.success("Yig'ilish tiklandi", "Yig'ilish avvalgi holatiga qaytarildi")
    } catch (err) {
      toast.error('Xatolik', err?.response?.data?.error?.errorMsg || getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const doDelete = async (id) => {
    setActionLoading(true)
    try {
      await axiosAPI.delete(`/meetings/${id}/hard_delete/`)
      setMeetings(prev => prev.filter(m => m.id !== id))
      toast.delete("Muvaffaqiyatli o'chirildi", "Ma'lumot butunlay o'chirildi")
    } catch (err) {
      toast.error('Xatolik', err?.response?.data?.error?.errorMsg || getErrorMessage(err))
    } finally {
      setActionLoading(false)
    }
  }

  const minutesToDisplay = (mins) => {
    if (!mins) return '—'
    if (mins >= 60 && mins % 60 === 0) return `${mins / 60} soat`
    return `${mins} daqiqa`
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      {/* Search */}
      <div className="relative w-[220px] shrink-0">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]"
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Yig'ilishni izlash"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none border
            bg-[var(--bg-base)] border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-soft)]
            dark:bg-[var(--bg-base)] dark:border-[var(--stroke-soft)] dark:text-[var(--text-strong)] dark:placeholder-[var(--text-sub)]
            focus:border-[var(--accent-sub)]"
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]">
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">№</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">UID</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Nomi</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Tashkilotchi
                </span>
              </th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Boshlanish vaqti</th>
              <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Davomiyligi</th>
              <th className="px-4 py-3 text-center font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Tugatildimi?</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonRows cols={8} />
            ) : meetings.map((m, i) => {
              const organizer = m.participants_info?.find(u => u.id === m.organizer) ?? m.participants_info?.[0]
              return (
                <tr key={m.id}
                  className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] last:border-0 hover:bg-black/2 dark:hover:bg-white/2">
                  <td className="px-4 py-3 text-[var(--text-soft)] dark:text-[var(--text-sub)] text-xs font-medium">{i + 1}</td>
                  <td className="px-4 py-3 text-[var(--text-soft)] dark:text-[var(--text-sub)] font-medium">{m.uid || '—'}</td>
                  <td className="px-4 py-3 font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">{m.title}</td>
                  <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{organizer?.username || '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{fmtDate(m.start_time)}</td>
                  <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{minutesToDisplay(m.duration_minutes)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${m.is_completed ? 'bg-[#22c55e]' : 'bg-[var(--error-sub)]'}`}>
                      {m.is_completed
                        ? <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        : <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="white" strokeWidth="1.8" strokeLinecap="round" /></svg>
                      }
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <RowMenu
                      onRestore={() => setConfirmRestore(m.id)}
                      onDelete={() => setConfirmDelete(m.id)}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {!loading && meetings.length === 0 && (
          <EmptyState
            icon="/imgs/yigilishlarIcon.svg"
            title="Chiqindi qutisi bo'sh"
            description="O'chirilgan yig'ilishlar bu yerda ko'rinadi"
          />
        )}
      </div>

      <ConfirmationModal
        showModal={!!confirmRestore}
        title="Tiklashni tasdiqlaysizmi?"
        description="Tanlangan yig'ilish avvalgi holatiga qaytariladi"
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
        confirmColor="bg-[var(--error-strong)] hover:bg-red-600"
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
    { id: 'projects',  label: 'Loyihalar' },
    { id: 'tasks',     label: 'Vazifalar' },
    { id: 'meetings',  label: "Yig'ilishlar" },
  ]

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] shrink-0">Chiqindi qutisi</h1>

      <div className="flex items-center gap-1 shrink-0 mt-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2.5 text-sm font-semibold cursor-pointer border-b-2 -mb-px',
              activeTab === tab.id
                ? 'border-[var(--accent-sub)] text-[var(--accent-sub)] dark:text-[var(--accent-soft)] dark:border-[var(--accent-soft)]'
                : 'border-transparent text-[var(--text-sub)] dark:text-[var(--text-soft)] hover:text-[var(--text-strong)] dark:hover:text-white',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col flex-1 min-h-0 pt-4">
        {activeTab === 'projects' ? <ProjectsTab /> : activeTab === 'tasks' ? <TasksTab /> : <MeetingsTab />}
      </div>
    </div>
  )
}
