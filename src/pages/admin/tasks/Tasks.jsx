import { useState, useEffect, useRef, useCallback } from 'react'
import { FaXmark } from 'react-icons/fa6'
import { LuFilter, LuLayoutList, LuLayoutGrid } from 'react-icons/lu'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { usePageAction } from '../../../context/PageActionContext'
import { useAuth } from '../../../context/AuthContext'
import TaskRowMenu     from './components/TaskRowMenu'
import TaskFilterModal, { TASK_EMPTY_FILTER } from './modals/TaskFilterModal'
import AddTaskModal    from './modals/AddTaskModal'
import EditTaskModal   from './modals/EditTaskModal'
import EmptyState from '../../../components/EmptyState'
import { axiosAPI } from '../../../service/axiosAPI'
import { toast } from '../../../Toast/ToastProvider'

// ── Label maps ──
const TYPE_LABEL = { bug: 'Xato', feature: 'Yangi funksiya', task: 'Vazifa', improvement: "Qo'shimcha" }
const PRIORITY_LABEL = { low: 'Past', medium: "O'rta", high: 'Yuqori', critical: 'Kritik' }
const TASK_STATUS_LABEL = {
  todo: 'Bajarilishi kerak', in_progress: 'Jarayonda', done: 'Bajarilgan',
  deployed: 'Ishga tushirilgan', reviewed: 'Tekshirilgan',
  rejected: 'Rad etilgan', overdue: "Muddati o'tgan", cancelled: 'Bekor qilingan',
}
const fmtTaskDt = (iso) => {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

/* ── Columns ── */
const COLUMNS = [
  { id: 'Qilinishi kerak',   color: '#6366F1', bg: '#EEF2FF' },
  { id: 'Jarayonda',         color: '#3B82F6', bg: '#EFF6FF' },
  { id: 'Bajarilgan',        color: '#8B5CF6', bg: '#F5F3FF' },
  { id: 'Ishga tushirilgan', color: '#10B981', bg: '#ECFDF5' },
  { id: 'Tekshirilgan',      color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'Rad etilgan',       color: '#EF4444', bg: '#FEF2F2' },
  { id: "Muddati o'tgan",    color: '#6B7280', bg: '#F9FAFB' },
]

/* ── Initial cards ── */
const INITIAL_CARDS = [
  { id:'c1',  title:'Email Campaign',       code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:'24:11:59', assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Qilinishi kerak' },
  { id:'c2',  title:'Email Campaign',       code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:'24:11:59', assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Qilinishi kerak' },
  { id:'c3',  title:'Email Campaign',       code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:'24:11:59', assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Qilinishi kerak' },
  { id:'c4',  title:'SEO Optimization',     code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:'24:11:59', assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Jarayonda' },
  { id:'c5',  title:'SEO Optimization',     code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:'24:11:59', assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Jarayonda' },
  { id:'c6',  title:'SEO Optimization',     code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:'24:11:59', assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Jarayonda' },
  { id:'c7',  title:'Mobile App Update',    code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:null,       assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Bajarilgan' },
  { id:'c8',  title:'Customer Survey',      code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:null,       assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Ishga tushirilgan' },
  { id:'c9',  title:'Customer Survey',      code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:null,       assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Ishga tushirilgan' },
  { id:'c10', title:'Video Production',     code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:null,       assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Tekshirilgan' },
  { id:'c11', title:'Video Production',     code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:null,       assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Tekshirilgan' },
  { id:'c12', title:'Video Production',     code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:null,       assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Tekshirilgan' },
  { id:'c13', title:'Brand Awareness',      code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:null,       assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Rad etilgan' },
  { id:'c14', title:'Brand Awareness',      code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:null,       assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Rad etilgan' },
  { id:'c15', title:'Brand Awareness',      code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:null,       assignee:'Марк Леонидов', role:'Dasturchi', columnId:'Rad etilgan' },
  { id:'c16', title:'Partnership Devel...', code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:null,       assignee:'Марк Леонидов', role:'Dasturchi', columnId:"Muddati o'tgan" },
  { id:'c17', title:'Partnership Devel...', code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:null,       assignee:'Марк Леонидов', role:'Dasturchi', columnId:"Muddati o'tgan" },
  { id:'c18', title:'Partnership Devel...', code:'T1213', date:'01.01.2026 20:00', duration:'24h 12min', overdue:null,       assignee:'Марк Леонидов', role:'Dasturchi', columnId:"Muddati o'tgan" },
]

/* ── KanbanCard ── */
function KanbanCard({ card, index }) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.92 : 1,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} scale(1.02)`
              : provided.draggableProps.style?.transform,
            boxShadow: snapshot.isDragging ? '0 6px 20px rgba(0,0,0,0.10)' : undefined,
          }}
          className={`rounded-xl bg-white border p-2.5 flex flex-col gap-1.5 cursor-grab active:cursor-grabbing select-none
            dark:bg-[#1C1D1D]
            ${snapshot.isDragging
              ? 'border-[#526ED3] ring-2 ring-[#526ED3]/20 dark:border-[#526ED3]'
              : 'border-[#E2E6F2] dark:border-[#292A2A]'}`}
        >
          {/* Title */}
          <p className="text-[11px] font-bold text-[#1A1D2E] dark:text-white leading-snug">{card.title}</p>

          {/* Code */}
          <div className="flex items-center gap-1 text-[10px] text-[#8F95A8]">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{card.code}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 text-[10px] text-[#8F95A8]">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <span>{card.date}</span>
          </div>

          {/* Duration + overdue */}
          <div className="flex items-center gap-2 text-[10px]">
            <div className="flex items-center gap-1 text-[#8F95A8]">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <span>{card.duration}</span>
            </div>
            {card.overdue && (
              <div className="flex items-center gap-1 text-[#EF4444] font-semibold">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <span>{card.overdue}</span>
              </div>
            )}
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#EEF1F7] dark:border-[#292A2A]">
            <div className="w-4 h-4 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-[8px] font-bold text-[#526ED3] shrink-0">
              {card.assignee.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-[#1A1D2E] dark:text-white truncate">{card.assignee}</p>
              <p className="text-[9px] text-[#8F95A8]">{card.role}</p>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}

/* ── KanbanColumn ── */
function KanbanColumn({ col, cards }) {
  return (
    <div className="flex flex-col shrink-0" style={{ width: 'clamp(150px, 13vw, 200px)' }}>
      {/* Header */}
      <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
        <span className="text-[12px] font-bold text-[#1A1D2E] dark:text-white truncate">{col.id}</span>
        <span
          className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
          style={{ backgroundColor: col.color }}
        >
          {cards.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={col.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-col gap-[6px] rounded-xl p-1.5 transition-all duration-150 min-h-[50px]"
            style={{
              backgroundColor: snapshot.isDraggingOver
                ? col.color + '18'
                : col.bg,
              outline: snapshot.isDraggingOver ? `2px dashed ${col.color}` : 'none',
              outlineOffset: '-2px',
            }}
          >
            {cards.map((card, index) => (
              <KanbanCard key={card.id} card={card} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}

/* ── Main Page ── */
export default function TasksPage() {
  const { registerAction, clearAction, registerNavbarExtra, clearNavbarExtra, registerSidebarClick, clearSidebarClick } = usePageAction()
  const { user } = useAuth()
  const activeRole = user?.active_role || user?.roles?.[0]
  const isAuditor  = activeRole === 'auditor'
  const isEmployee = activeRole === 'employee'
  const canEdit    = activeRole === 'admin' || activeRole === 'superadmin' || activeRole === 'manager'

  const [viewMode, setViewMode]       = useState('table')
  const [search, setSearch]           = useState('')
  const [showFilter, setShowFilter]   = useState(false)
  const [showAdd, setShowAdd]         = useState(false)
  const [filters, setFilters]         = useState(TASK_EMPTY_FILTER)
  const [data, setData]               = useState([])
  const [loading, setLoading]         = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore]         = useState(false)
  const [page, setPage]               = useState(1)
  const [editTask, setEditTask]       = useState(null)
  const [taskLoading, setTaskLoading] = useState(false)
  const [cards, setCards]             = useState(INITIAL_CARDS)
  const scrollRef = useRef(null)

  const hasFilter = filters.projects?.length > 0 || filters.authors?.length > 0 ||
    !!filters.holat || !!filters.daraja || !!filters.turi ||
    !!filters.deadFromD || !!filters.deadToD || filters.myTasks

  const buildParams = useCallback((f = filters, q = search, pg = 1) => {
    const p = { page: pg, page_size: 20 }
    if (q) p.search = q
    if (f.holat)  p.status   = f.holat
    if (f.daraja) p.priority = f.daraja
    if (f.turi)   p.type     = f.turi
    if (f.myTasks) p.my_tasks = true
    if (f.projects?.length) p.project = f.projects.map(pr => pr.id || pr).join(',')
    if (f.authors?.length)  p.assignee = f.authors.map(a => a.id || a).join(',')
    if (f.deadFromD) p.deadline_from = f.deadFromD
    if (f.deadToD)   p.deadline_to   = f.deadToD
    return p
  }, [filters, search])

  const loadTasks = useCallback(async (f = filters, q = search, pg = 1) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)
    try {
      const res = await axiosAPI.get('/tasks/', { params: buildParams(f, q, pg) })
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

  useEffect(() => { loadTasks() }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const handleScroll = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60 && hasMore && !loadingMore) {
        loadTasks(filters, search, page + 1)
      }
    }
    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, page, filters, search])

  const handleSearch = (val) => { setSearch(val); loadTasks(filters, val, 1) }
  const handleApplyFilter = (f) => { setFilters(f); setShowFilter(false); loadTasks(f, search, 1) }

  const handleAdd = async (body) => {
    try {
      const res = await axiosAPI.post('/tasks/', body)
      const created = res.data?.data ?? res.data
      setData(prev => [created, ...prev])
      toast.success("Vazifa yaratildi", "Yangi vazifa muvaffaqiyatli qo'shildi")
    } catch (err) {
      toast.error('Xatolik', err?.response?.data?.detail || "Vazifa yaratishda xatolik")
    }
  }

  const handleEdit = async (id, body) => {
    try {
      const res = await axiosAPI.put(`/tasks/${id}/`, body)
      const updated = res.data?.data ?? res.data
      setData(prev => prev.map(t => t.id === id ? updated : t))
      toast.success("Vazifa yangilandi", "O'zgarishlar muvaffaqiyatli saqlandi")
    } catch (err) {
      toast.error('Xatolik', err?.response?.data?.detail || "Yangilashda xatolik")
    }
  }

  const handleDelete = async (id) => {
    try {
      await axiosAPI.delete(`/tasks/${id}/`)
      setData(prev => prev.filter(t => t.id !== id))
      toast.delete("Vazifa o'chirildi", "Vazifa chiqindi qutisiga yuborildi.")
    } catch (err) {
      toast.error('Xatolik', err?.response?.data?.detail || "O'chirishda xatolik")
    }
  }

  // Task ni API dan to'liq yuklash
  const loadTaskDetail = async (id) => {
    setTaskLoading(true)
    try {
      const res = await axiosAPI.get(`/tasks/${id}/`)
      const task = res.data?.data ?? res.data
      setEditTask(task)
    } catch (err) {
      toast.error('Xatolik', "Vazifa ma'lumotlarini yuklashda xatolik")
    } finally {
      setTaskLoading(false)
    }
  }
  const switchToTable  = () => setViewMode('table')
  const switchToKanban = () => setViewMode('kanban')

  const onDragEnd = ({ destination, source, draggableId }) => {
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return
    setCards(prev => {
      const moved = { ...prev.find(c => c.id === draggableId), columnId: destination.droppableId }
      const rest  = prev.filter(c => c.id !== draggableId)
      const destCards = rest.filter(c => c.columnId === destination.droppableId)
      const others    = rest.filter(c => c.columnId !== destination.droppableId)
      destCards.splice(destination.index, 0, moved)
      return [...others, ...destCards]
    })
  }

  const handleAddCard = (columnId, title) => {
    setCards(prev => [...prev, {
      id: `c${Date.now()}`, title, code: 'T1213',
      date: '01.01.2026 20:00', duration: '24h 12min',
      overdue: null, assignee: 'Марк Леонидов', role: 'Dasturchi', columnId,
    }])
  }

  useEffect(() => {
    if (!isAuditor && !isEmployee) {
      registerAction({
        label: "Vazifa qo'shish",
        icon: <img src="/imgs/addProjectIcon.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
        onClick: () => setShowAdd(true),
      })
    }

    if (viewMode === 'kanban') {
      registerNavbarExtra(
        <div className="flex items-center gap-3 flex-1">
          <span className="text-[13px] font-medium text-[#5B6078] dark:text-[#C2C8E0]">
            Vazifa boshqaruvi › Vazifalar
          </span>
          <div className="flex-1" />
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8F95A8]"
              width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Izlash" value={search} onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-[5px] rounded-xl text-[13px] outline-none  w-[200px]
                bg-[#F1F3F9] border border-[#E2E6F2] text-[#8F95A8] placeholder-[#8F95A8] focus:border-[#526ED3]
                dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#C2C8E0]" />
          </div>
          {/* Filter */}
          <button onClick={() => setShowFilter(true)}
            className="relative flex items-center gap-1.5 px-3 py-[5px] rounded-xl text-[13px] font-semibold border  cursor-pointer
              bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078] dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
            <LuFilter size={13} /> Filtrlash
            {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
          </button>
        </div>
      )
      registerSidebarClick(switchToTable)
    } else {
      clearNavbarExtra()
      clearSidebarClick()
    }

    return () => { clearAction(); clearNavbarExtra(); clearSidebarClick() }
  }, [viewMode, search, hasFilter])

  const filtered = data

  /* ── KANBAN VIEW ── */
  if (viewMode === 'kanban') {
    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col bg-[#F8F9FC] dark:bg-[#191A1A]" style={{ height: 'calc(100vh - 57px)' }}>
          <div className="flex gap-2 px-3 pt-3 pb-3 overflow-x-auto h-full items-start">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.id}
                col={col}
                cards={cards.filter(c => c.columnId === col.id)}
              />
            ))}
          </div>
        </div>

        {showFilter && (
          <TaskFilterModal initial={filters} onClose={() => setShowFilter(false)}
            onApply={handleApplyFilter} />
        )}
        {showAdd && (
          <AddTaskModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />
        )}
      </DragDropContext>
    )
  }

  /* ── TABLE VIEW ── */
  return (
    <div className="flex flex-col h-full gap-4">

      <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-white">Vazifalar</h1>

      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#C2C8E0]"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Izlash" value={search}
            onChange={e => handleSearch(e.target.value)}
            className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none  w-[200px]
              bg-[#F1F3F9] border border-[#E2E6F2] text-[#1A1D2E] placeholder-[#5B6078] focus:border-[#526ED3]
              dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#5B6078]" />
        </div>
        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border  cursor-pointer
            bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078] dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
          <LuFilter size={13} /> Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
        </button>
        <div className="ml-auto flex items-center gap-1 p-1 rounded-xl border border-[#E2E6F2] bg-[#F1F3F9] dark:bg-[#222323] dark:border-[#474848]">
          <button className="p-1.5 rounded-lg bg-white dark:bg-[#2A2B2B] text-[#3F57B3] dark:text-[#7F95E6] shadow-sm cursor-pointer">
            <LuLayoutList size={16} />
          </button>
          <button onClick={switchToKanban}
            className="p-1.5 rounded-lg  cursor-pointer text-[#8F95A8] dark:text-[#C2C8E0] hover:text-[#3F57B3]">
            <LuLayoutGrid size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto">
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
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#EEF1F7] dark:border-[#292A2A]">
                  {[1,2,3,4,5,6,7,8,9,10].map(j => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded-lg bg-[#EEF1F7] dark:bg-[#292A2A] animate-pulse" style={{ width: j === 1 ? 32 : '80%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              data.map((t, idx) => (
                <tr key={t.id}
                  onClick={() => loadTaskDetail(t.id)}
                  className="border-b border-[#EEF1F7] dark:border-[#292A2A] last:border-0 hover:bg-black/2 dark:hover:bg-white/2  cursor-pointer">
                  <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0] text-xs font-medium">{t.uid || idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{t.title || t.name}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{typeof t.project_info === 'object' ? t.project_info?.title : (t.project_info || t.project || '—')}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.created_by_info?.username || t.creator || '—'}</td>
                  <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.assignee_info?.username || t.assignee || '—'}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{TYPE_LABEL[t.type] || t.type || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#1A1D2E] dark:text-white">{PRIORITY_LABEL[t.priority] || t.level || '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-[#1A1D2E] dark:text-white">{TASK_STATUS_LABEL[t.status] || t.status || '—'}</td>
                  <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{fmtTaskDt(t.deadline)}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    {!isAuditor && canEdit && (
                      <TaskRowMenu
                        onEdit={() => loadTaskDetail(t.id)}
                        onDelete={() => handleDelete(t.id)}
                      />
                    )}
                    {!isAuditor && !canEdit && (
                      <TaskRowMenu
                        onDelete={() => handleDelete(t.id)}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && data.length === 0 && (
          <EmptyState
            icon="/imgs/vazifalarIcon.svg"
            title="Vazifalar topilmadi"
            description="Yangi vazifa yarating yoki filtrlarni tekshiring"
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

      {showFilter && (
        <TaskFilterModal initial={filters} onClose={() => setShowFilter(false)}
          onApply={handleApplyFilter} />
      )}
      {showAdd && (
        <AddTaskModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />
      )}
      {editTask && (
        <EditTaskModal
          task={editTask}
          canEdit={canEdit}
          onClose={() => setEditTask(null)}
          onSave={(id, body) => handleEdit(id, body)}
        />
      )}

      {taskLoading && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30">
          <svg className="animate-spin w-8 h-8 text-white" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>
      )}

    </div>
  )
}
