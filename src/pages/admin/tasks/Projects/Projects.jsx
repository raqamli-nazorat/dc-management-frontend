import { useState, useEffect, useRef, useCallback } from 'react'
import { FaXmark, FaArrowLeft, FaEllipsisVertical } from 'react-icons/fa6'
import { usePageAction } from '../../../../context/PageActionContext'
import { useAuth } from '../../../../context/AuthContext'
import EmptyState from '../../../../components/EmptyState'
import { axiosAPI } from '../../../../service/axiosAPI'
import { toast } from '../../../../Toast/ToastProvider'
import EditProjectModal from "./Modals/EditProjectModal"
import DetailModal from "./Modals/DetailModal"

import ProjectFilterModal from "./Modals/ProjectFilterModal"
import dayjs from 'dayjs'
import AddProjectModal from './Modals/AddProjectModal'

const EMPTY_FILTER = {
  manager: '',
  status: '',
  employee: '',
  startFromD: dayjs().startOf('month').format('YYYY-MM-DD'),
  startFromT: '00:00',
  startToD: dayjs().endOf('month').format('YYYY-MM-DD'),
  startToT: '23:59',
  deadFromD: '',
  deadFromT: '',
  deadToD: '',
  deadToT: ''
}

const STATUS_LABEL = {
  planning: 'Rejalashtirilmoqda',
  active: 'Faol',
  overdue: "Muddati o'tgan",
  completed: 'Yakunlangan',
  cancelled: 'Bekor qilingan',
}

const fmtDt = (iso) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

const useDropdown = () => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return { open, setOpen, ref }
}

/* ── DeleteConfirmModal ── */
const DeleteConfirmModal = ({ project, onClose, onConfirm }) => {
  return (
    <div className="fixed  inset-0 z-50 flex items-center justickyfy-center px-4">
      <div className="fixed inset-0 bg-black/60" />
      <button onClick={onClose} className="absolute  top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F1F3F9] hover:bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)] dark:hover:bg-[var(--bg-elevation-2)] text-[var(--text-sub)] dark:text-[var(--text-sub)] cursor-pointer  z-10">
        <FaXmark size={14} />
      </button>
      <div className="relative left-[30%]  w-full max-w-[600px] rounded-3xl shadow-2xl bg-[var(--bg-base)]">

        <div className="px-7 pt-7 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={onClose} className="text-[var(--text-strong)] dark:text-[var(--text-strong)] hover:opacity-60 cursor-pointer shrink-0 transition-opacity">
              <FaArrowLeft size={17} />
            </button>
            <h2 className="text-[20px] font-extrabold text-[var(--text-strong)] dark:text-[var(--text-strong)]">Loyihani o'chirish</h2>
          </div>
          <p className="text-sm text-[var(--text-sub)] dark:text-[var(--text-soft)] ">
            Haqiqatan ham ushbu loyihani o'chirmoqchimisiz? Bu amalni bekor qilib bo'lmaydi
          </p>
        </div>
        <div className="px-7 py-5 flex items-center justify-end gap-3">
          <button onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium  cursor-pointer
              text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-1)]">
            <FaXmark size={13} /> Bekor qilish
          </button>
          <button onClick={() => { onConfirm(project.id); onClose() }}
            className="px-6 py-2.5 rounded-2xl text-sm font-bold  cursor-pointer bg-[var(--error-strong)] text-white hover:bg-red-600">
            O'chirish
          </button>
        </div>
      </div>

    </div>
  )
}

/* ── RowMenu ── */
const RowMenu = ({ onEdit, onDetail, onDelete, canEdit = false }) => {
  const { open, setOpen, ref } = useDropdown()
  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(o => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors
          text-[var(--text-soft)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-sub)] dark:hover:bg-[var(--bg-elevation-2)]">
        <FaEllipsisVertical size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-2xl shadow-2xl border overflow-hidden
          bg-[var(--bg-base)] border-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)]">
          {/* Batafsil — hammaga */}
          <button onClick={() => { onDetail?.(); setOpen(false) }}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)]
              hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] cursor-pointer transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[var(--text-sub)] dark:text-[var(--text-sub)]">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Batafsil
          </button>

          {/* Tahrirlash + O'chirish — faqat admin */}
          {canEdit && (
            <>
              <button onClick={() => { onEdit?.(); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-strong)] dark:text-[var(--text-strong)]
                  hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] cursor-pointer transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[var(--text-sub)] dark:text-[var(--text-sub)]">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
                Tahrirlash
              </button>
              <button onClick={() => { onDelete?.(); setOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--error-strong)]
                  hover:bg-[#FFF5F5] dark:hover:bg-[#2A1A1A] cursor-pointer transition-colors">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
                O'chirish
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main Page ── */
const ProjectsPage = () => {
  const { registerAction, clearAction } = usePageAction()

  const { user } = useAuth()
  const is_admin = user.active_role === 'superadmin' || user.active_role === 'admin'

  const [search, setSearch] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [detailProject, setDetailProject] = useState(null)
  const [deleteProject, setDeleteProject] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTER)
  const [viewMode, setViewMode] = useState('table')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [copiedUid, setCopiedUid] = useState(null)
  const scrollRef = useRef(null)

  // ── API funksiyalari ──
  const buildParams = useCallback((f = filters, q = search, pg = 1) => {
    const p = { page: pg }
    if (q) p.search = q
    if (f.status) p.status = f.status
    if (f.manager) p.manager = f.manager
    if (f.employee) p.employee = f.employee
    if (f.deadFromD) p.deadline_gte = dayjs(`${f.deadFromD} ${f.deadFromT || '23:59'}`).toISOString()
    if (f.deadToD) p.deadline_lte = dayjs(`${f.deadToD} ${f.deadToT || '23:59'}`).toISOString()
    if (f.startFromD) p.created_at_gte = dayjs(`${f.startFromD} ${f.startFromT || '00:00'}`).toISOString()
    if (f.startToD) p.created_at_lte = dayjs(`${f.startToD} ${f.startToT || '23:59'}`).toISOString()
    return p
  }, [filters, search])

  const loadProjects = useCallback(async (f = filters, q = search, pg = 1) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await axiosAPI.get('/projects/', { params: buildParams(f, q, pg) })
      const payload = res.data?.data ?? res.data
      const results = Array.isArray(payload) ? payload : (payload.results ?? [])
      const next = Array.isArray(payload) ? null : (payload.next ?? null)
      setData(prev => pg === 1 ? results : [...prev, ...results])
      setHasMore(!!next)
      setPage(pg)
    } catch (err) {
      console.error('Projects load error:', err)
      toast.error('Xatolik', err?.response?.data?.error?.errorMsg || err?.message || "Ma'lumotlarni yuklashda xatolik")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [buildParams])

  useEffect(() => {
    loadProjects()
  }, [])

  // Scroll pagination
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60 && hasMore && !loadingMore) {
        loadProjects(filters, search, page + 1)
      }
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, page, filters, search])

  useEffect(() => {
    if (!is_admin) return
    registerAction({
      label: "Loyiha qo'shish",
      icon: <img src="/imgs/addProjectIcon.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowAdd(true),
    })
    return () => clearAction()
  }, [])

  const hasFilter = Object.values(filters).some(v => v)

  const handleApplyFilter = (f) => {
    setFilters(f)
    setShowFilter(false)
    loadProjects(f, search, 1)
  }

  const handleDelete = async (id) => {
    try {
      await axiosAPI.delete(`/projects/${id}/`)
      setData(prev => prev.filter(p => p.id !== id))
      toast.delete("Loyiha o'chirildi", "Loyiha chiqindi qutisiga yuborildi.")
    } catch (err) {
      const msg = err?.response?.data?.error?.errorMsg
        || err?.response?.data?.detail
        || "O'chirishda xatolik yuz berdi"
      toast.error('Xatolik', msg)
    }
  }

  return (
    <div className="flex flex-col h-[85vh] gap-4">

      <h1 className="text-2xl font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] shrink-0">Loyihalar</h1>

      {/* Toolbar */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-soft)] dark:text-[var(--text-sub)]"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Izlash..."
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              if (e.target.value.length === 0) {
                loadProjects(filters, "", 1)
              }
            }}
            onKeyDown={e => {
              if (e.key === "Enter") {
                const q = search.trim()
                setSearch(q)
                loadProjects(filters, q, 1)
              }
            }}
            className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none  w-[240px]
              bg-[#F1F3F9] border border-[var(--stroke-sub)] text-[var(--text-strong)] placeholder-[var(--text-sub)] focus:border-[var(--accent-sub)]
              dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-sub)] dark:placeholder-[var(--text-sub)]"
          />
        </div>

        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border  cursor-pointer
            bg-[#F1F3F9] border-[var(--stroke-sub)] text-[var(--text-sub)]
            dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-sub)] dark:text-[var(--text-sub)]">
          <img src="/imgs/filterIcon.svg" alt="" className="w-3.5 h-3.5 [filter:brightness(0)_saturate(100%)_invert(38%)_sepia(10%)_saturate(500%)_hue-rotate(190deg)] dark:[filter:brightness(0)_saturate(100%)_invert(70%)_sepia(10%)_saturate(300%)_hue-rotate(190deg)]" />
          Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[var(--accent-strong)]" />}
        </button>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 p-1 rounded-xl bg-[#F1F3F9] dark:bg-[var(--bg-elevation-1)] border border-[var(--stroke-sub)] dark:border-[var(--stroke-sub)]">
          <button onClick={() => setViewMode('table')}
            className={`w-7 h-7 flex items-center justify-center rounded-lg  cursor-pointer
              ${viewMode === 'table' ? 'bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-2)] shadow-sm text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
            </svg>
          </button>
          <button onClick={() => setViewMode('grid')}
            className={`w-7 h-7 flex items-center justify-center rounded-lg  cursor-pointer
              ${viewMode === 'grid' ? 'bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-2)] shadow-sm text-[var(--text-strong)] dark:text-[var(--text-strong)]' : 'text-[var(--text-soft)] dark:text-[var(--text-sub)]'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
              <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table */}
      {viewMode === 'table' && (
        <div ref={scrollRef} className="flex-1 overflow-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-[var(--bg-elevation-1)]">
              <tr className="border-b border-[var(--stroke-sub)] dark:border-[var(--stroke-soft)]">
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)] w-10">№</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Titul</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Nomi</th>
                <th className="px-4 py-3 text-left font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Menejer</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Holati</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Boshlanish sanasi</th>
                <th className="px-4 py-3 text-right font-medium text-[var(--text-sub)] dark:text-[var(--text-sub)]">Muddati</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded-lg bg-[#EEF1F7] dark:bg-[var(--bg-elevation-2)] animate-pulse" style={{ width: j === 1 ? 24 : '80%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                data.map((p, idx) => (
                  <tr key={p.id}
                    onClick={() => {
                      if (!is_admin) {
                        setDetailProject(p.id)
                        return
                      }
                      setEditProject(p.id)
                    }}
                    className="border-b border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] last:border-0 hover:bg-black/3 dark:hover:bg-white/3  cursor-pointer">
                    <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 group">
                        <span className="text-[var(--text-soft)] dark:text-[var(--text-sub)]">{p.prefix}</span>
                        <button
                          onClick={() => {
                            const val = p.prefix || ''
                            navigator.clipboard.writeText(val).then(() => {
                              setCopiedUid(p.id)
                              setTimeout(() => setCopiedUid(null), 2000)
                            }).catch(() => { })
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 flex items-center justify-center rounded-md hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] text-[var(--text-soft)] dark:text-[var(--text-sub)] cursor-pointer"
                        >
                          {copiedUid === p.id
                            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            : <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M216,28H88A12,12,0,0,0,76,40V76H40A12,12,0,0,0,28,88V216a12,12,0,0,0,12,12H168a12,12,0,0,0,12-12V180h36a12,12,0,0,0,12-12V40A12,12,0,0,0,216,28ZM156,204H52V100H156Zm48-48H180V88a12,12,0,0,0-12-12H100V52H204Z" /></svg>
                          }
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">{p.title || p.name}</td>
                    <td className="px-4 py-3 text-[var(--text-strong)] dark:text-[var(--text-strong)]">{p.manager_info?.username || p.manager || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-[var(--text-strong)] dark:text-[var(--text-strong)]">{STATUS_LABEL[p.status] || p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--text-strong)] dark:text-[var(--text-strong)]">{fmtDt(p.created_at)}</td>
                    <td className="px-4 py-3 text-right text-[var(--text-strong)] dark:text-[var(--text-strong)]">{fmtDt(p.deadline)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <RowMenu onEdit={() => setEditProject(p.id)} onDetail={() => setDetailProject(p.id)} onDelete={() => setDeleteProject(p)} canEdit={is_admin} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!loading && data.length === 0 && (
            <EmptyState
              icon="/imgs/loyhalarIcon.svg"
              title="Hozircha loyihalar yo'q"
              description="Yangi loyiha qo'shish orqali ishni boshlang"
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
      )}

      {/* Grid */}
      {viewMode === 'grid' && (
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map(p => {
              const statusMap = {
                'Faol': { label: 'Faol', bg: 'bg-[#22c55e]', text: 'text-white' },
                'active': { label: 'Faol', bg: 'bg-[#22c55e]', text: 'text-white' },
                'Rejalashtirilmoqda': { label: 'Rejalashtirilmoqda', bg: 'bg-[var(--stroke-sub)]', text: 'text-[var(--text-sub)]' },
                'planning': { label: 'Rejalashtirilmoqda', bg: 'bg-[var(--stroke-sub)]', text: 'text-[var(--text-sub)]' },
                'Yakunlangan': { label: 'Yakunlangan', bg: 'bg-[var(--accent-sub)]', text: 'text-white' },
                'completed': { label: 'Yakunlangan', bg: 'bg-[var(--accent-sub)]', text: 'text-white' },
                'cancelled': { label: 'Bekor qilingan', bg: 'bg-[var(--error-strong)]', text: 'text-white' },
              }
              const st = statusMap[p.status] || statusMap['Rejalashtirilmoqda']
              const managerName = p.manager_info?.username || p.manager || '—'
              const managerRole = p.manager_info?.position || 'Menejer'
              const managerInitials = managerName.slice(0, 2).toUpperCase()
              const fmtDt = (iso) => {
                if (!iso) return '—'
                if (iso.includes('T')) {
                  const d = new Date(iso)
                  return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                }
                return iso
              }
              return (
                <div key={p.id}
                  onClick={() => {
                    if (!is_admin) {
                      setDetailProject(p.id)
                      return
                    }
                    setEditProject(p.id)
                  }}
                  className="rounded-2xl border p-4 cursor-pointer transition-all
                  bg-[var(--bg-base)] border-[var(--stroke-sub)] hover:border-[#C2C8E0] hover:shadow-sm
                  dark:bg-[var(--bg-elevation-1)] dark:border-[var(--stroke-soft)] dark:hover:border-[#474848]">

                  {/* Title + Status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-[14px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)] leading-snug truncate flex-1">{p.title || p.name}</h3>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.bg} ${st.text}`}>
                      {st.label}
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-sub)] dark:text-[var(--text-soft)] mb-3">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    <span className="truncate">{fmtDt(p.created_at || p.startDate)}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mx-0.5">
                      <path d="m9 18 6-6-6-6" />
                      <path d="m15 18 6-6-6-6" />
                    </svg>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    <span className="truncate">{fmtDt(p.deadline)}</span>
                  </div>

                  {/* Manager + Menu */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[var(--accent-sub)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--accent-sub)] shrink-0">
                        {managerInitials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[var(--text-strong)] dark:text-[var(--text-strong)] truncate">{managerName}</p>
                        <p className="text-[10px] text-[var(--text-soft)] dark:text-[var(--text-sub)]">{managerRole}</p>
                      </div>
                    </div>
                    <div onClick={e => e.stopPropagation()}>
                      <RowMenu onEdit={() => setEditProject(p.id)} onDetail={() => setDetailProject(p.id)} onDelete={() => setDeleteProject(p)} canEdit={is_admin} />
                    </div>
                  </div>
                </div>
              )
            })}
            {!loading && data.length === 0 && (
              <div className="col-span-3">
                <EmptyState
                  icon="/imgs/loyhalarIcon.svg"
                  title="Hozircha loyihalar yo'q"
                  description="Yangi loyiha qo'shish orqali ishni boshlang"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {showFilter && (
        <ProjectFilterModal
          initial={filters}
          onClose={() => setShowFilter(false)}
          onApply={handleApplyFilter}
          empty_filter={EMPTY_FILTER}
          useDropdown={useDropdown}
        />
      )}

      {showAdd && (
        <AddProjectModal
          onClose={() => setShowAdd(false)}
          refreshData={loadProjects}
          useDropdown={useDropdown}
          STATUS_API={STATUS_LABEL}
        />
      )}

      {editProject && (
        <EditProjectModal
          id={editProject}
          onClose={() => setEditProject(null)}
          refreshData={loadProjects}
          useDropdown={useDropdown}
          STATUS_LABEL={STATUS_LABEL}
        />
      )}

      {detailProject && (
        <DetailModal
          id={detailProject}
          onClose={() => setDetailProject(null)}
        />
      )}

      {deleteProject && (
        <DeleteConfirmModal
          project={deleteProject}
          onClose={() => setDeleteProject(null)}
          onConfirm={id => handleDelete(id)}
        />
      )}
    </div>
  )
}

export default ProjectsPage