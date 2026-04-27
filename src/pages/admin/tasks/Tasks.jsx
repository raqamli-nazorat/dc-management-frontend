import { useState, useEffect } from 'react'
import { FaXmark } from 'react-icons/fa6'
import { LuFilter, LuLayoutList, LuLayoutGrid } from 'react-icons/lu'
import { usePageAction } from '../../../context/PageActionContext'

import { TASKS_DATA, EMPTY_FILTER } from './components/constants'
import TaskRowMenu   from './components/TaskRowMenu'
import TaskFilterModal from './modals/TaskFilterModal'
import AddTaskModal    from './modals/AddTaskModal'
import EditTaskModal   from './modals/EditTaskModal'

export default function TasksPage() {
  const { registerAction, clearAction } = usePageAction()
  const [search, setSearch]         = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [showAdd, setShowAdd]       = useState(false)
  const [filters, setFilters]       = useState(EMPTY_FILTER)
  const [data, setData]             = useState(TASKS_DATA)
  const [toast, setToast]           = useState(null)
  const [editTask, setEditTask]     = useState(null)

  const showToast = (title, msg) => { setToast({ title, msg }); setTimeout(() => setToast(null), 3000) }

  useEffect(() => {
    registerAction({
      label: "Vazifa qo'shish",
      icon: <img src="/imgs/addProjectIcon.svg" alt="" className="w-4 h-4 brightness-0 invert" />,
      onClick: () => setShowAdd(true),
    })
    return () => clearAction()
  }, [])

  const hasFilter = Object.values(filters).some(v => v)

  const filtered = data.filter(t => {
    const q = search.toLowerCase()
    if (q && !t.name.toLowerCase().includes(q) && !t.assignee.toLowerCase().includes(q)) return false
    if (filters.project  && t.project  !== filters.project)  return false
    if (filters.status   && t.status   !== filters.status)   return false
    if (filters.level    && t.level    !== filters.level)     return false
    if (filters.type     && t.type     !== filters.type)      return false
    if (filters.assignee && t.assignee !== filters.assignee)  return false
    return true
  })

  return (
    <div className="flex flex-col gap-4">

      {/* Toast */}
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

      {/* Toolbar */}
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
          <button className="p-1.5 rounded-lg transition-colors cursor-pointer text-[#8F95A8] dark:text-[#C2C8E0] hover:text-[#3F57B3]">
            <LuLayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Table */}
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
