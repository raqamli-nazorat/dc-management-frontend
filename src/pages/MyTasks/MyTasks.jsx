import { useState, useEffect } from 'react'
import { usePageAction } from '../../context/PageActionContext'
import { FaRegBookmark } from 'react-icons/fa6'
import { MdCheckCircle, MdCheck } from 'react-icons/md'
import AddTaskModal from './AddTaskModal'

const initialTasks = [
  {
    id: 1,
    date: 'Dushanbi 2-Yanvar 2026',
    color: 'yellow',
    title: 'Dashbord chizish',
    status: 'Bajarildi',
    subtasks: [
      { id: 1, text: 'Research', done: false },
      { id: 2, text: 'Reference topish', done: true },
      { id: 3, text: 'Frame chizish', done: false },
      { id: 4, text: 'CJM qilish', done: true },
    ],
  },
  {
    id: 2,
    date: 'Dushanbi 2-Yanvar 2026',
    color: 'blue',
    title: 'Dashbord chizish',
    status: 'Bajarildi',
    subtasks: [
      { id: 1, text: 'Research', done: false },
      { id: 2, text: 'Reference topish', done: true },
      { id: 3, text: 'Frame chizish', done: false },
      { id: 4, text: 'CJM qilish', done: true },
    ],
  },
  {
    id: 3,
    date: 'Dushanbi 2-Yanvar 2026',
    color: 'green',
    title: 'Dashbord chizish',
    status: 'Bajarildi',
    subtasks: [
      { id: 1, text: 'Research', done: false },
      { id: 2, text: 'Reference topish', done: true },
      { id: 3, text: 'Frame chizish', done: false },
      { id: 4, text: 'CJM qilish', done: true },
    ],
  },
]

/* Rang → CSS qiymatlari */
const COLOR_MAP = {
  yellow: { bg: '#FFD200', text: '#1A1D2E' },
  blue:   { bg: '#005FF9', text: '#ffffff' },
  green:  { bg: '#15B036', text: '#ffffff' },
  red:    { bg: '#FF2E2E', text: '#ffffff' },
}

/* ── Bitta karta ── */
function TaskCard({ task, onToggle }) {
  const col = COLOR_MAP[task.color] || COLOR_MAP.blue

  return (
    <div className="relative w-[320px] rounded-[24px] overflow-hidden shadow-sm bg-white dark:bg-[#1C1D1D]">
      {/* Rangli header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ backgroundColor: col.bg }}
      >
        <span
          className="text-xs font-bold"
          style={{ color: col.text }}
        >
          {task.date}
        </span>
        <div className="flex items-center gap-1.5 bg-[#4A65D8] px-3 py-1.5 rounded-xl border border-white/20">
          <MdCheckCircle className="text-white" size={14} />
          <span className="text-white text-[11px] font-bold">{task.status}</span>
        </div>
      </div>

      {/* Karta tanasi */}
      <div className="bg-[#F4F6FD] dark:bg-[#222323] rounded-[24px] px-6 pt-5 pb-7 -mt-3 relative z-10">
        <h3 className="text-[15px] font-bold text-[#1A1D2E] dark:text-white mb-5">
          {task.title}
        </h3>

        <div className="flex flex-col gap-3">
          {task.subtasks.map(sub => (
            <div
              key={sub.id}
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onToggle(task.id, sub.id)}
            >
              <div
                className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 transition-colors
                  ${sub.done
                    ? 'bg-[#4A65D8] text-white'
                    : 'bg-[#E2E6F2] dark:bg-[#3A3B3B] text-transparent group-hover:bg-[#D0D5E2] dark:group-hover:bg-[#4A4B4B]'
                  }`}
              >
                {sub.done && <MdCheck size={14} />}
              </div>
              <span
                className={`text-[13px] font-medium transition-colors
                  ${sub.done
                    ? 'text-[#5B6078] dark:text-[#C2C8E0]'
                    : 'text-[#8F95A8] dark:text-[#8E95B5]'
                  }`}
              >
                {sub.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Asosiy sahifa ── */
export default function MyTasks() {
  const { registerAction, clearAction } = usePageAction()
  const [modalOpen, setModalOpen] = useState(false)
  const [tasks, setTasks] = useState(initialTasks)

  useEffect(() => {
    registerAction({
      label: "Vazifa qo'shish",
      icon: <FaRegBookmark size={14} />,
      onClick: () => setModalOpen(true),
    })
    return () => clearAction()
  }, [registerAction, clearAction])

  const toggleSubtask = (taskId, subtaskId) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map(s =>
                s.id === subtaskId ? { ...s, done: !s.done } : s
              ),
            }
          : t
      )
    )
  }

  const handleAddTask = (newTask) => {
    setTasks(prev => [...prev, newTask])
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-[28px] font-bold text-[#1A1D2E] dark:text-white">
        Mening vazifalarim
      </h1>

      <div className="flex flex-wrap gap-6">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onToggle={toggleSubtask} />
        ))}
      </div>

      {modalOpen && (
        <AddTaskModal
          onClose={() => setModalOpen(false)}
          onAdd={handleAddTask}
        />
      )}
    </div>
  )
}
