import { useEffect, useState } from 'react'
import { FaArrowLeft, FaRegStar, FaStar, FaXmark, FaRegBookmark } from 'react-icons/fa6'

const COLORS = [
  { id: 'red', hex: '#FF2E2E' },
  { id: 'yellow', hex: '#FFD200' },
  { id: 'green', hex: '#15B036' },
  { id: 'blue', hex: '#005FF9' },
]

/* task prop berilsa — tahrirlash rejimi, aks holda — yaratish */
export default function AddTaskModal({ onClose, onSave, task = null }) {
  const isEdit = !!task

  const [title, setTitle] = useState(task?.title || '')
  const [deadline] = useState(task?.deadline || null)
  const [selectedColor, setSelectedColor] = useState(task?.color || 'blue')
  const [isStarred, setIsStarred] = useState(false)
  const [loading, setLoading] = useState(false)

  /* Subtasklar: tahrirlashda mavjud items, yaratishda 5 ta bo'sh qator */
  const [subtasks, setSubtasks] = useState(
    isEdit
      ? (task.items || []).map(i => i.title)
      : ['', '', '', '', '']
  )

  /* Subtask matnini yangilash; oxirgi to'ldirilsa yangi qator qo'shish */
  const handleSubtaskChange = (value, index) => {
    const updated = [...subtasks]
    updated[index] = value
    if (index === updated.length - 1 && value.trim() !== '') {
      updated.push('')
    }
    setSubtasks(updated)
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      const body = {
        title: title.trim(),
        color: selectedColor,
        is_done: task?.is_done ?? false,
      }

      /* Subtask nomlarini items sifatida yuborish (faqat yaratishda) */
      if (!isEdit) {
        const items = subtasks
          .filter(s => s.trim() !== '')
          .map(s => s.trim())          // faqat string title — MyTasks.jsx da todo.id bilan POST qilinadi
        if (items.length > 0) body.items = items
      }

      await onSave(body)
      onClose()
    } catch {
      /* xato toast MyTasks.jsx da ko'rsatiladi */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    /* Overlay */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* X tugmasi */}
      <button
        onClick={onClose}
        className="absolute top-8 right-6 w-8 h-8 flex items-center justify-center rounded-full
            bg-[#F1F3F9] dark:bg-[var(--bg-elevation-2)] text-[var(--text-sub)] dark:text-[var(--text-sub)]
            hover:bg-[var(--stroke-sub)] dark:hover:bg-[var(--bg-elevation-2)] transition-colors cursor-pointer"
      >
        <FaXmark size={13} />
      </button>

      {/* Modal */}
      <div className="relative w-full max-w-[640px] h-[80vh]! bg-[var(--bg-elevation-1-alt)] dark:bg-[var(--bg-elevation-1)] rounded-[32px] shadow-2xl flex flex-col p-8 animate-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-elevation-1-alt)] dark:hover:bg-[var(--bg-elevation-2)] transition-colors cursor-pointer"
              >
                <FaArrowLeft className="text-[var(--text-strong)] dark:text-[var(--text-strong)]" size={18} />
              </button>
              <h2 className="text-[22px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                {isEdit ? "Vazifani tahrirlash" : "Vazifa qo'shish"}
              </h2>
            </div>
            <p className="text-[14px] text-[var(--text-soft)] dark:text-[var(--text-soft)] mt-1 ml-10">
              O'zingiz uchun vazifa yarating.
            </p>
          </div>

          {/* Yulduz tugmasi */}
          <button
            onClick={() => setIsStarred(s => !s)}
            className="w-11 h-11 flex items-center justify-center rounded-2xl
              bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-elevation-1)]
              border border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]
              text-[var(--accent-strong)] hover:opacity-80 transition-opacity cursor-pointer"
          >
            {isStarred ? <FaStar size={20} /> : <FaRegStar size={20} />}
          </button>
        </div>

        {/* ── Form tanasi ── */}
        <div className="flex relative gap-5 mb-8">
          {/* Vazifa nomi + subtasklar */}
          <div className="w-full max-h-[350px] overflow-y-auto bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-elevation-1)] rounded-[24px] p-6 pr-20! flex flex-col gap-4 border border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
            {/* Vazifa nomi */}
            <input
              type="text"
              placeholder="Vazifa nomi"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-transparent outline-none text-[15px] font-bold
                text-[var(--text-strong)] dark:text-[var(--text-strong)]
                placeholder:text-[var(--text-disabled)] dark:placeholder:text-[#474848]"
            />

            {/* Subtasklar (faqat yaratishda) */}
            {!isEdit && (
              <div className="flex flex-col gap-4 mt-1">
                {subtasks.map((sub, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-[22px] h-[22px] rounded-full bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)] shrink-0" />
                    <input
                      type="text"
                      value={sub}
                      onChange={e => handleSubtaskChange(e.target.value, i)}
                      placeholder={i === 0 ? "Subtask qo'shing..." : ''}
                      className="flex-1 bg-transparent outline-none text-[13px]
                        text-[var(--text-sub)] dark:text-[var(--text-sub)]
                        placeholder:text-[var(--stroke-strong)] dark:placeholder:text-[#4A4B4B]"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Tahrirlashda items ro'yxati (faqat ko'rish) */}
            {isEdit && task?.items?.length > 0 && (
              <div className="flex flex-col gap-3 mt-1">
                <p className="text-[11px] text-[var(--text-disabled)] dark:text-[#474848] font-medium uppercase tracking-wide">
                  Subtasklar (tahrirlash uchun kartadan bosing)
                </p>
                {task.items.map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0
                      ${item.is_done ? 'bg-[#4A65D8]' : 'bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)]'}`}>
                      {item.is_done && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-[13px] font-medium ${item.is_done ? 'text-[var(--text-sub)] line-through' : 'text-[var(--text-soft)] dark:text-[var(--text-soft)]'}`}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rang tanlash */}
          <div className="absolute -top-8 right-0 px-3 py-4 rounded-full dark:bg-[var(--bg-elevation-1)] shadow-2xl border border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] flex flex-col gap-4 items-center justify-center shrink-0">
            {COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedColor(c.id)}
                className="w-11 h-11 rounded-full flex items-center justify-center
                  transition-transform hover:scale-110 cursor-pointer"
                style={{
                  backgroundColor: c.hex,
                  boxShadow: selectedColor === c.id
                    ? `0 0 0 2px white, 0 0 0 4px ${c.hex}`
                    : '0 2px 6px rgba(0,0,0,0.15)',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-center gap-6 mt-auto ml-auto">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-3.5 rounded-[16px] font-bold cursor-pointer
              text-[var(--text-strong)] dark:text-[var(--text-strong)]
              hover:bg-[var(--bg-elevation-1-alt)] dark:hover:bg-[var(--bg-elevation-2)] transition-colors"
          >
            <FaXmark size={14} />
            Bekor qilish
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="flex items-center gap-2 px-8 py-3.5 rounded-[16px] font-bold cursor-pointer
              bg-[var(--accent-strong)] text-white hover:bg-[#4A65D8] transition-colors
              shadow-lg shadow-[var(--accent-strong)]/20 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <FaRegBookmark size={14} />
            )}
            {isEdit ? "Saqlash" : "Vazifa qo'shish"}
          </button>
        </div>
      </div>
    </div>
  )
}
