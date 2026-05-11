import { useState, useEffect } from 'react'
import { usePageAction } from '../../context/PageActionContext'
import { FaRegBookmark } from 'react-icons/fa6'
import { MdCheckCircle, MdCheck } from 'react-icons/md'
import AddTaskModal from './AddTaskModal'
import { axiosAPI } from '../../service/axiosAPI'
import { toast } from '../../Toast/ToastProvider'
import EmptyState from '../../components/EmptyState'

/* Rang → CSS qiymatlari */
const COLOR_MAP = {
  yellow: { bg: '#FFD200', text: 'var(--text-strong)' },
  blue:   { bg: '#005FF9', text: '#ffffff' },
  green:  { bg: '#15B036', text: '#ffffff' },
  red:    { bg: '#FF2E2E', text: '#ffffff' },
}

/* Sana formatlash — "Dushanbi, 6-May 2026" */
const fmtDate = (iso) => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const days = ['Yakshanba', 'Dushanbi', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']
    const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
    return `${days[d.getDay()]}, ${d.getDate()}-${months[d.getMonth()]} ${d.getFullYear()}`
  } catch { return iso }
}

/* ── Bitta karta ── */
function TaskCard({ task, onToggleItem, onToggleDone, onDelete, onEdit, onDeleteItem, onAddItem }) {
  const col = COLOR_MAP[task.color] || COLOR_MAP.blue
  const [newItemTitle, setNewItemTitle] = useState('')
  const [addingItem, setAddingItem] = useState(false)

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return
    setAddingItem(true)
    try {
      await onAddItem(task.id, newItemTitle.trim())
      setNewItemTitle('')
    } finally {
      setAddingItem(false)
    }
  }

  return (
    <div className="relative w-[320px] rounded-[24px] overflow-hidden shadow-sm bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)]">
      {/* Rangli header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ backgroundColor: col.bg }}
      >
        <span className="text-xs font-bold" style={{ color: col.text }}>
          {task.deadline ? fmtDate(task.deadline) : fmtDate(task.created_at)}
        </span>
        <div className="flex items-center gap-2">
          {/* Tahrirlash */}
          <button
            onClick={() => onEdit(task)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
            title="Tahrirlash"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          {/* O'chirish */}
          <button
            onClick={() => onDelete(task.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 hover:bg-red-500/60 transition-colors cursor-pointer"
            title="O'chirish"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </button>
          {/* Holat badge */}
          <button
            onClick={() => onToggleDone(task)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 cursor-pointer transition-colors
              ${task.is_done ? 'bg-[#4A65D8]' : 'bg-black/20 hover:bg-[#4A65D8]'}`}
          >
            <MdCheckCircle className="text-white" size={14} />
            <span className="text-white text-[11px] font-bold">
              {task.is_done ? 'Bajarildi' : 'Bajarilmadi'}
            </span>
          </button>
        </div>
      </div>

      {/* Karta tanasi */}
      <div className="bg-[#F4F6FD] dark:bg-[var(--bg-elevation-1)] rounded-[24px] px-6 pt-5 pb-7 -mt-3 relative z-10">
        <h3 className="text-[15px] font-bold text-[#1A1D2E] dark:text-[#E6EDF3] mb-5">
          {task.title}
        </h3>

        <div className="flex flex-col gap-0">
          {/* Scroll qilinadigan subtask ro'yxati — max 4 ta ko'rinadi, har doim 144px */}
          <div className="flex flex-col gap-3 overflow-y-auto min-h-36 max-h-36 custom-scrollbar pr-1">
            {(task.items || []).map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 group"
              >
                <div
                  onClick={() => onToggleItem(task.id, item)}
                  className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer
                    ${item.is_done
                      ? 'bg-[#4A65D8] text-white'
                      : 'bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)] text-transparent group-hover:bg-[var(--stroke-strong)] dark:group-hover:bg-[#4A4B4B]'
                    }`}
                >
                  {item.is_done && <MdCheck size={14} />}
                </div>
                <span
                  className={`flex-1 text-[13px] font-medium transition-colors
                    ${item.is_done
                      ? 'text-[#1A1D2E]/50 dark:text-[#E6EDF3]/50 line-through'
                      : 'text-[#1A1D2E] dark:text-[#E6EDF3]'
                    }`}
                >
                  {item.title}
                </span>
                {/* O'chirish tugmasi */}
                <button
                  onClick={() => onDeleteItem(task.id, item.id)}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-md hover:bg-red-500/10 transition-all cursor-pointer"
                  title="O'chirish"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            ))}

            {(!task.items || task.items.length === 0) && !newItemTitle && (
              <p className="text-[12px] text-[var(--text-disabled)] dark:text-[#474848] italic">
                Subtasklar yo'q
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

/* ── Skeleton loader ── */
function SkeletonCard() {
  return (
    <div className="w-[320px] rounded-[24px] overflow-hidden shadow-sm bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] animate-pulse">
      <div className="h-[56px] bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)]" />
      <div className="bg-[#F4F6FD] dark:bg-[var(--bg-elevation-1)] rounded-[24px] px-6 pt-5 pb-7 -mt-3">
        <div className="h-4 w-2/3 bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)] rounded-lg mb-5" />
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3 mb-3">
            <div className="w-[22px] h-[22px] rounded-full bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)] shrink-0" />
            <div className="h-3 flex-1 bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)] rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Asosiy sahifa ── */
export default function MyTasks() {
  const { registerAction, clearAction } = usePageAction()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTask, setEditTask] = useState(null)   // tahrirlash uchun
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  /* ── Ma'lumotlarni yuklash ── */
  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await axiosAPI.get('/todos/')
      const payload = res.data?.results ?? res.data?.data?.results ?? res.data
      setTasks(Array.isArray(payload) ? payload : (payload?.results ?? []))
    } catch {
      toast.error('Xatolik', "Vazifalarni yuklashda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTasks()
  }, [])

  useEffect(() => {
    registerAction({
      label: "Vazifa qo'shish",
      icon: <FaRegBookmark size={14} />,
      onClick: () => setModalOpen(true),
    })
    return () => clearAction()
  }, [registerAction, clearAction])

  /* ── Yangi vazifa qo'shish ── */
  const handleAddTask = async (body) => {
    try {
      const { items: itemList, ...todoBody } = body

      // 1. Avval todo yaratiladi — response kelishini kutamiz
      const res = await axiosAPI.post('/todos/', todoBody)
      const created = res.data?.data ?? res.data

      // 2. Todo ID si kelgandan keyin, itemlarni ketma-ket yuboramiz
      // itemList — [{ title, is_done }] yoki undefined
      const createdItems = []
      if (itemList && itemList.length > 0) {
        for (const item of itemList) {
          try {
            const itemRes = await axiosAPI.post('/todo-items/', {
              todo: created.id,
              title: typeof item === 'string' ? item : item.title,
              is_done: false,
            })
            createdItems.push(itemRes.data?.data ?? itemRes.data)
          } catch {
            // bitta item xato bo'lsa davom etamiz
          }
        }
      }

      created.items = createdItems.length > 0 ? createdItems : (created.items || [])
      setTasks(prev => [created, ...prev])
      toast.success("Vazifa qo'shildi", "Yangi vazifa muvaffaqiyatli yaratildi")
    } catch (err) {
      const msg = err?.response?.data?.error?.errorMsg || err?.response?.data?.detail || "Vazifa yaratishda xatolik"
      toast.error('Xatolik', msg)
      throw err
    }
  }

  /* ── Vazifani yangilash (PUT) ── */
  const handleUpdateTask = async (id, body) => {
    try {
      const res = await axiosAPI.put(`/todos/${id}/`, body)
      const updated = res.data?.data ?? res.data
      setTasks(prev => prev.map(t => t.id === id ? updated : t))
      toast.success("Yangilandi", "Vazifa muvaffaqiyatli yangilandi")
    } catch (err) {
      const msg = err?.response?.data?.error?.errorMsg || err?.response?.data?.detail || "Yangilashda xatolik"
      toast.error('Xatolik', msg)
      throw err
    }
  }

  /* ── Vazifani o'chirish ── */
  const handleDelete = async (id) => {
    try {
      await axiosAPI.delete(`/todos/${id}/`)
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.delete("O'chirildi", "Vazifa o'chirildi")
    } catch (err) {
      const msg = err?.response?.data?.error?.errorMsg || err?.response?.data?.detail || "O'chirishda xatolik"
      toast.error('Xatolik', msg)
    }
  }

  /* ── Vazifa is_done holatini toggle ── */
  const handleToggleDone = async (task) => {
    const updated = { ...task, is_done: !task.is_done }
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
    try {
      const res = await axiosAPI.put(`/todos/${task.id}/`, {
        title: task.title,
        color: task.color,
        deadline: task.deadline,
        is_done: !task.is_done,
      })
      const saved = res.data?.data ?? res.data
      setTasks(prev => prev.map(t => t.id === task.id ? saved : t))
    } catch {
      // Rollback
      setTasks(prev => prev.map(t => t.id === task.id ? task : t))
      toast.error('Xatolik', "Holat yangilashda xatolik")
    }
  }

  /* ── Item (subtask) is_done toggle ── */
  const handleToggleItem = async (todoId, item) => {
    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === todoId
        ? { ...t, items: t.items.map(i => i.id === item.id ? { ...i, is_done: !i.is_done } : i) }
        : t
    ))
    try {
      await axiosAPI.patch(`/todo-items/${item.id}/`, { is_done: !item.is_done })
    } catch {
      // Rollback
      setTasks(prev => prev.map(t =>
        t.id === todoId
          ? { ...t, items: t.items.map(i => i.id === item.id ? item : i) }
          : t
      ))
      toast.error('Xatolik', "Subtask yangilashda xatolik")
    }
  }

  /* ── Subtask qo'shish ── */
  const handleAddItem = async (todoId, title) => {
    try {
      const res = await axiosAPI.post('/todo-items/', {
        todo: todoId,
        title,
        is_done: false,
      })
      const created = res.data?.data ?? res.data
      setTasks(prev => prev.map(t =>
        t.id === todoId
          ? { ...t, items: [...(t.items || []), created] }
          : t
      ))
      toast.success("Qo'shildi", "Subtask muvaffaqiyatli qo'shildi")
    } catch (err) {
      const msg = err?.response?.data?.error?.errorMsg || err?.response?.data?.detail || "Subtask qo'shishda xatolik"
      toast.error('Xatolik', msg)
      throw err
    }
  }

  /* ── Subtask o'chirish ── */
  const handleDeleteItem = async (todoId, itemId) => {
    try {
      await axiosAPI.delete(`/todo-items/${itemId}/`)
      setTasks(prev => prev.map(t =>
        t.id === todoId
          ? { ...t, items: (t.items || []).filter(i => i.id !== itemId) }
          : t
      ))
      toast.delete("O'chirildi", "Subtask o'chirildi")
    } catch (err) {
      const msg = err?.response?.data?.error?.errorMsg || err?.response?.data?.detail || "Subtask o'chirishda xatolik"
      toast.error('Xatolik', msg)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[28px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">
        Kundalik rejalar
      </h1>

      {loading ? (
        <div className="flex flex-wrap gap-6">
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon="/imgs/vazifalarIcon.svg"
          title="Vazifalar topilmadi"
          description="Yangi vazifa yarating"
        />
      ) : (
        <div className="flex flex-wrap gap-6">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleItem={handleToggleItem}
              onToggleDone={handleToggleDone}
              onDelete={handleDelete}
              onEdit={(t) => setEditTask(t)}
              onDeleteItem={handleDeleteItem}
              onAddItem={handleAddItem}
            />
          ))}
        </div>
      )}

      {/* Yangi vazifa qo'shish modali */}
      {modalOpen && (
        <AddTaskModal
          onClose={() => setModalOpen(false)}
          onSave={handleAddTask}
        />
      )}

      {/* Tahrirlash modali */}
      {editTask && (
        <AddTaskModal
          task={editTask}
          onClose={() => setEditTask(null)}
          onSave={async (body) => {
            await handleUpdateTask(editTask.id, body)
            setEditTask(null)
          }}
        />
      )}
    </div>
  )
}
