import { useState, useEffect } from 'react'
import { FaXmark } from 'react-icons/fa6'
import { LuFilter, LuLayoutList, LuLayoutGrid } from 'react-icons/lu'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { usePageAction } from '../../../context/PageActionContext'
import { TASKS_DATA } from './components/constants'
import TaskRowMenu     from './components/TaskRowMenu'
import TaskFilterModal, { TASK_EMPTY_FILTER } from './modals/TaskFilterModal'
import AddTaskModal    from './modals/AddTaskModal'
import EditTaskModal   from './modals/EditTaskModal'

/* ── Columns ── */
const COLUMNS = [
  { id: 'Qilinishi kerak',   color: '#6366F1' },
  { id: 'Jarayonda',         color: '#3B82F6' },
  { id: 'Bajarilgan',        color: '#8B5CF6' },
  { id: 'Ishga tushirilgan', color: '#10B981' },
  { id: 'Tekshirilgan',      color: '#F59E0B' },
  { id: 'Rad etilgan',       color: '#EF4444' },
  { id: "Muddati o'tgan",    color: '#6B7280' },
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
function KanbanCard({ card, index, colColor }) {
  const bgAlpha = colColor + '18' // ~10% opacity hex
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.88 : 1,
            transform: snapshot.isDragging
              ? `${provided.draggableProps.style?.transform} scale(1.02)`
              : provided.draggableProps.style?.transform,
            boxShadow: snapshot.isDragging ? '0 8px 24px rgba(0,0,0,0.14)' : undefined,
            backgroundColor: snapshot.isDragging ? '#fff' : bgAlpha,
          }}
          className={`rounded-2xl bg-red-500 border p-3 flex flex-col gap-2 cursor-grab active:cursor-grabbing select-none
            ${snapshot.isDragging
              ? 'border-[#526ED3] ring-2 ring-[#526ED3]/20'
              : 'border-transparent'}`}
        >
          {/* Title */}
          <p className="text-[12px] font-bold text-[#1A1D2E] dark:text-white leading-snug">{card.title}</p>

          {/* Code */}
          <div className="flex items-center gap-1 text-[10px] text-[#8F95A8]">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{card.code}</span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 text-[10px] text-[#8F95A8]">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <span>{card.date}</span>
          </div>

          {/* Duration + overdue */}
          <div className="flex items-center gap-3 text-[10px]">
            <div className="flex items-center gap-1 text-[#8F95A8]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              <span>{card.duration}</span>
            </div>
            {card.overdue && (
              <div className="flex items-center gap-1 text-[#EF4444] font-semibold">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <span>{card.overdue}</span>
              </div>
            )}
          </div>

          {/* Assignee */}
          <div className="flex  items-center gap-1.5 pt-1.5 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div className="w-5 h-5 rounded-full bg-[#526ED3]/20 flex items-center justify-center text-[9px] font-bold text-[#526ED3] shrink-0">
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
    <div className="flex flex-col shrink-0 w-[200px] ">
      {/* Header: Nom + badge yonma-yon, chapda */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[13px] font-bold text-[#1A1D2E] dark:text-white truncate">{col.id}</span>
        <span
          className="shrink-0 min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center text-white"
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
            className={`flex flex-col gap-[10px] rounded-2xl p-1.5 transition-all duration-150
              ${snapshot.isDraggingOver
                ? 'ring-2 ring-dashed ring-[#526ED3] bg-[#526ED3]/5'
                : ''}`}
            style={{ minHeight: 60 }}
          >
            {cards.map((card, index) => (
              <KanbanCard key={card.id} card={card} index={index} colColor={col.color} />
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

  const [viewMode, setViewMode]     = useState('table')
  const [search, setSearch]         = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [showAdd, setShowAdd]       = useState(false)
  const [filters, setFilters]       = useState(TASK_EMPTY_FILTER)
  const [data, setData]             = useState(TASKS_DATA)
  const [toast, setToast]           = useState(null)
  const [editTask, setEditTask]     = useState(null)
  const [cards, setCards]           = useState(INITIAL_CARDS)

  const showToast = (title, msg) => { setToast({ title, msg }); setTimeout(() => setToast(null), 3000) }
  const hasFilter = filters.projects.length > 0 || filters.authors.length > 0 ||
    !!filters.holat || !!filters.daraja || !!filters.turi ||
    !!filters.deadFromD || !!filters.deadToD || filters.myTasks
  const switchToKanban = () => setViewMode('kanban')
  const switchToTable  = () => setViewMode('table')

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
    registerAction({
      label: "Vazifa qo'shish",
      icon: <img src="/imgs/addProjectIcon.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowAdd(true),
    })

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
              className="pl-8 pr-3 py-[5px] rounded-xl text-[13px] outline-none transition-colors w-[200px]
                bg-[#F1F3F9] border border-[#E2E6F2] text-[#8F95A8] placeholder-[#8F95A8] focus:border-[#526ED3]
                dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#C2C8E0]" />
          </div>
          {/* Filter */}
          <button onClick={() => setShowFilter(true)}
            className="relative flex items-center gap-1.5 px-3 py-[5px] rounded-xl text-[13px] font-semibold border transition-colors cursor-pointer
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

  const filtered = data.filter(t => {
    const q = search.toLowerCase()
    if (q && !t.name.toLowerCase().includes(q) && !t.assignee.toLowerCase().includes(q)) return false
    if (filters.projects.length > 0 && !filters.projects.find(p => p.name === t.project)) return false
    if (filters.authors.length > 0  && !filters.authors.find(a => a.name === t.creator))  return false
    if (filters.holat  && t.status !== filters.holat)  return false
    if (filters.daraja && t.level  !== filters.daraja)  return false
    if (filters.turi   && t.type   !== filters.turi)    return false
    return true
  })

  /* ── KANBAN VIEW ── */
  if (viewMode === 'kanban') {
    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col bg-[#F8F9FC] dark:bg-[#191A1A]" style={{ height: 'calc(100vh - 57px)' }}>
          <div className="flex gap-[10px] px-4 pt-4 pb-4 overflow-x-auto h-full items-start">
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
            onApply={f => { setFilters(f); setShowFilter(false) }} />
        )}
        {showAdd && (
          <AddTaskModal onClose={() => setShowAdd(false)}
            onAdd={t => { setData(prev => [...prev, t]); showToast("Vazifa yaratildi", "Yangi vazifa muvaffaqiyatli qo'shildi") }} />
        )}
      </DragDropContext>
    )
  }

  /* ── TABLE VIEW ── */
  return (
    <div className="flex flex-col gap-4">

      {toast && (
        <div className="fixed top-5 right-5 z-[100] flex items-start gap-3 p-4 rounded-2xl shadow-xl w-[340px]
          bg-white border border-[#E2E6F2] dark:bg-[#222323] dark:border-[#292A2A]">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" stroke="#22c55e" strokeWidth="2"/>
            <path d="M8 12l3 3 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-[#1A1D2E] dark:text-white">{toast.title}</p>
            <p className="text-[13px] text-[#8F95A8] dark:text-[#8E95B5] mt-0.5 leading-snug">{toast.msg}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-[#B6BCCB] hover:text-[#5B6078] cursor-pointer shrink-0">
            <FaXmark size={14} />
          </button>
        </div>
      )}

      <h1 className="text-2xl font-bold text-[#1A1D2E] dark:text-white">Vazifalar</h1>

      <div className="flex items-center gap-2">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8F95A8] dark:text-[#C2C8E0]"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Izlash" value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4 py-[4px] rounded-xl text-[13px] font-medium outline-none transition-colors w-[200px]
              bg-[#F1F3F9] border border-[#E2E6F2] text-[#8F95A8] placeholder-[#8F95A8] focus:border-[#526ED3]
              dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0] dark:placeholder-[#C2C8E0]" />
        </div>
        <button onClick={() => setShowFilter(true)}
          className="relative flex items-center gap-2 px-3 py-[4px] rounded-xl text-[13px] font-extrabold border transition-colors cursor-pointer
            bg-[#F1F3F9] border-[#E2E6F2] text-[#5B6078] dark:bg-[#222323] dark:border-[#474848] dark:text-[#C2C8E0]">
          <LuFilter size={13} /> Filtrlash
          {hasFilter && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#3F57B3]" />}
        </button>
        <div className="ml-auto flex items-center gap-1 p-1 rounded-xl border border-[#E2E6F2] bg-[#F1F3F9] dark:bg-[#222323] dark:border-[#474848]">
          <button className="p-1.5 rounded-lg bg-white dark:bg-[#2A2B2B] text-[#3F57B3] dark:text-[#7F95E6] shadow-sm cursor-pointer">
            <LuLayoutList size={16} />
          </button>
          <button onClick={switchToKanban}
            className="p-1.5 rounded-lg transition-colors cursor-pointer text-[#8F95A8] dark:text-[#C2C8E0] hover:text-[#3F57B3]">
            <LuLayoutGrid size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
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
            {filtered.map(t => (
              <tr key={t.id}
                className="border-b border-[#EEF1F7] dark:border-[#292A2A] last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer">
                <td className="px-4 py-3 text-[#8F95A8] dark:text-[#C2C8E0] text-xs font-medium">{t.code}</td>
                <td className="px-4 py-3 font-medium text-[#1A1D2E] dark:text-white">{t.name}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.project}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.creator}</td>
                <td className="px-4 py-3 text-[#1A1D2E] dark:text-white">{t.assignee}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{t.type}</td>
                <td className="px-4 py-3 text-right font-medium text-[#1A1D2E] dark:text-white">{t.level}</td>
                <td className="px-4 py-3 text-right font-medium text-[#1A1D2E] dark:text-white">{t.status}</td>
                <td className="px-4 py-3 text-right text-[#1A1D2E] dark:text-white">{t.deadline}</td>
                <td className="px-4 py-3">
                  <TaskRowMenu
                    onEdit={() => setEditTask(t)}
                    onDelete={() => setData(prev => prev.filter(x => x.id !== t.id))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center text-sm text-[#B6BCCB] dark:text-[#8E95B5]"
            style={{ minHeight: 'calc(100vh - 280px)' }}>
            Ma'lumot topilmadi
          </div>
        )}
      </div>

      {showFilter && (
        <TaskFilterModal initial={filters} onClose={() => setShowFilter(false)}
          onApply={f => { setFilters(f); setShowFilter(false) }} />
      )}
      {showAdd && (
        <AddTaskModal onClose={() => setShowAdd(false)}
          onAdd={t => { setData(prev => [...prev, t]); showToast("Vazifa yaratildi", "Yangi vazifa muvaffaqiyatli qo'shildi") }} />
      )}
      {editTask && (
        <EditTaskModal task={editTask} onClose={() => setEditTask(null)}
          onSave={updated => { setData(prev => prev.map(t => t.id === updated.id ? updated : t)); showToast("Vazifa yangilandi", "O'zgarishlar muvaffaqiyatli saqlandi") }} />
      )}

    </div>
  )
}
