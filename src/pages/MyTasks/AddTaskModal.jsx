import { useEffect, useState, useRef } from 'react'
import { FaArrowLeft, FaXmark, FaRegBookmark, FaTrash, FaStar } from 'react-icons/fa6'
import { MdCheck } from 'react-icons/md'
import DiscardModal from '../../components/DiscardModal'
import { DateTimeBox } from '../admin/Components/DateTimeBox'

const COLORS = [
  { id: 'red', hex: '#FF2E2E' },
  { id: 'yellow', hex: '#FFD200' },
  { id: 'green', hex: '#15B036' },
  { id: 'blue', hex: '#005FF9' },
]

/* task.deadline (ISO yoki datetime) → "YYYY-MM-DD" */
const toDateInput = (iso) => {
  if (!iso) return ''
  return String(iso).split('T')[0]
}

let _rowSeq = 0
const newRow = (data = {}) => ({
  key: `row-${++_rowSeq}`,
  id: data.id ?? null,
  title: data.title ?? '',
  is_done: data.is_done ?? false,
  deleted: false,
})

/* task prop berilsa — tahrirlash rejimi, aks holda — yaratish */
export default function AddTaskModal({ onClose, onSave, task = null }) {
  const isEdit = !!task

  const [title, setTitle] = useState(task?.title || '')
  // Tahrirlashda eski sana turadi — kartadagidek deadline, bo'lmasa created_at
  const [deadline, setDeadline] = useState(toDateInput(task?.deadline || task?.created_at))
  const [selectedColor, setSelectedColor] = useState(task?.color || 'blue')
  const [showColors, setShowColors] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const colorRef = useRef(null)

  /* Subtasklar — create va edit'da bir xil tahrirlanadigan ro'yxat.
     Oxirida har doim bitta bo'sh qator (qo'shish uchun). */
  const [subtasks, setSubtasks] = useState(() => {
    const base = isEdit ? (task.items || []).map(i => newRow(i)) : []
    return [...base, newRow()]
  })

  const markDirty = () => setIsDirty(true)
  const handleClose = () => { if (isDirty) setShowDiscard(true); else onClose() }

  /* Subtask matnini yangilash; oxirgi qator to'ldirilsa yangi bo'sh qator qo'shiladi */
  const handleSubtaskChange = (key, value) => {
    setSubtasks(prev => {
      const updated = prev.map(r => r.key === key ? { ...r, title: value } : r)
      const last = updated[updated.length - 1]
      if (last && last.key === key && value.trim() !== '') {
        updated.push(newRow())
      }
      return updated
    })
    markDirty()
  }

  const toggleSubtaskDone = (key) => {
    setSubtasks(prev => prev.map(r => r.key === key ? { ...r, is_done: !r.is_done } : r))
    markDirty()
  }

  const removeSubtask = (key) => {
    setSubtasks(prev => {
      const row = prev.find(r => r.key === key)
      // Mavjud (id li) qatorni — deleted deb belgilaymiz; yangisini butunlay olib tashlaymiz
      let next = row?.id
        ? prev.map(r => r.key === key ? { ...r, deleted: true } : r)
        : prev.filter(r => r.key !== key)
      // Doimo bitta bo'sh qator qolishini ta'minlaymiz
      const visible = next.filter(r => !r.deleted)
      const last = visible[visible.length - 1]
      if (!last || last.title.trim() !== '' || last.id) {
        next = [...next, newRow()]
      }
      return next
    })
    markDirty()
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      const body = {
        title: title.trim(),
        color: selectedColor,
        deadline: deadline || null,
        is_done: task?.is_done ?? false,
      }

      if (isEdit) {
        // Edit: subtasklarni operatsiyalar ko'rinishida yuboramiz
        const ops = []
        for (const r of subtasks) {
          if (r.id && r.deleted) {
            ops.push({ id: r.id, deleted: true })
          } else if (r.id && !r.deleted) {
            ops.push({ id: r.id, title: r.title.trim(), is_done: r.is_done })
          } else if (!r.id && !r.deleted && r.title.trim() !== '') {
            ops.push({ title: r.title.trim(), is_done: r.is_done })
          }
        }
        body.items = ops
      } else {
        // Create: faqat to'ldirilgan nomlar (string title) — MyTasks.jsx POST qiladi
        const items = subtasks
          .filter(r => !r.deleted && r.title.trim() !== '')
          .map(r => r.title.trim())
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
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty])

  // Rang palitrasi — tashqariga bosilganda yopish
  useEffect(() => {
    if (!showColors) return
    const h = (e) => {
      if (colorRef.current && !colorRef.current.contains(e.target)) setShowColors(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showColors])

  const currentHex = COLORS.find(c => c.id === selectedColor)?.hex || '#005FF9'
  const visibleSubtasks = subtasks.filter(r => !r.deleted)

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

        {/* X tugmasi */}
        <button
          onClick={handleClose}
          className="absolute top-8 right-6 w-8 h-8 flex items-center justify-center rounded-full
            bg-[#F1F3F9] dark:bg-[var(--bg-elevation-2)] text-[var(--text-sub)] dark:text-[var(--text-sub)]
            hover:bg-[var(--stroke-sub)] dark:hover:bg-[var(--bg-elevation-2)] transition-colors cursor-pointer"
        >
          <FaXmark size={13} />
        </button>

        {/* Modal */}
        <div className="relative w-full max-w-[560px] max-h-[85vh] bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-1)] rounded-[28px] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

          {/* ── Header ── */}
          <div className="flex items-start justify-between px-7 pt-7 pb-5 shrink-0">
            <div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-elevation-1)] dark:hover:bg-[var(--bg-elevation-2)] transition-colors cursor-pointer"
                >
                  <FaArrowLeft className="text-[var(--text-strong)] dark:text-[var(--text-strong)]" size={16} />
                </button>
                <h2 className="text-[20px] font-bold text-[var(--text-strong)] dark:text-[var(--text-strong)]">
                  {isEdit ? 'Vazifani tahrirlash' : "Vazifa qo'shish"}
                </h2>
              </div>
              <p className="text-[13px] text-[var(--text-soft)] dark:text-[var(--text-soft)] mt-1 ml-9">
                O'zingiz uchun vazifa yarating.
              </p>
            </div>

            {/* Rang tanlash tugmasi — tanlangan rangni ko'rsatadi */}
            <div ref={colorRef} className="relative">
              <button
                type="button"
                onClick={() => setShowColors(s => !s)}
                title="Rang tanlash"
                className="w-9 h-9 flex items-center justify-center rounded-xl cursor-pointer
                  bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-elevation-2)]
                  border border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]
                  hover:opacity-80 transition-opacity"
              >
                <FaStar size={16} style={{ color: currentHex }} />
              </button>

              {showColors && (
                <div className="absolute top-full right-0 mt-2 z-50 px-3 py-3 rounded-2xl bg-[var(--bg-base)] dark:bg-[var(--bg-elevation-2)] shadow-2xl border border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)] flex items-center gap-3">
                  {COLORS.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setSelectedColor(c.id); setShowColors(false); markDirty() }}
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
                      style={{
                        backgroundColor: c.hex,
                        boxShadow: selectedColor === c.id
                          ? `0 0 0 2px var(--bg-base), 0 0 0 4px ${c.hex}`
                          : '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                    >
                      {selectedColor === c.id && <MdCheck className="text-white" size={16} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Form tanasi (scroll) ── */}
          <div className="flex-1 overflow-y-auto px-7 pb-2 flex flex-col gap-4 min-h-0">
            {/* Vazifa nomi + subtasklar */}
            <div className="w-full bg-[var(--bg-elevation-1)] dark:bg-[var(--bg-elevation-1)] rounded-[20px] p-5 flex flex-col gap-4 border border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
              {/* Vazifa nomi */}
              <input
                type="text"
                placeholder="Vazifa nomi"
                value={title}
                onChange={e => { setTitle(e.target.value); markDirty() }}
                className="bg-transparent outline-none text-[15px] font-bold
                  text-[var(--text-strong)] dark:text-[var(--text-strong)]
                  placeholder:text-[var(--text-disabled)] dark:placeholder:text-[#474848]"
              />

              {/* Subtasklar — tahrirlanadigan ro'yxat */}
              <div className="flex flex-col gap-3 mt-1">
                {visibleSubtasks.map((row, i) => {
                  const isLast = i === visibleSubtasks.length - 1
                  const isEmptyAdd = isLast && !row.id && row.title.trim() === ''
                  return (
                    <div key={row.key} className="flex items-center gap-3 group">
                      {/* Toggle done */}
                      <button
                        type="button"
                        onClick={() => !isEmptyAdd && toggleSubtaskDone(row.key)}
                        disabled={isEmptyAdd}
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors
                          ${row.is_done
                            ? 'bg-[#4A65D8] text-white'
                            : 'bg-[var(--stroke-sub)] dark:bg-[var(--bg-elevation-2)] text-transparent'}
                          ${isEmptyAdd ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {row.is_done && <MdCheck size={13} />}
                      </button>

                      <input
                        type="text"
                        value={row.title}
                        onChange={e => handleSubtaskChange(row.key, e.target.value)}
                        placeholder={isEmptyAdd ? "Subtask qo'shing..." : ''}
                        className={`flex-1 bg-transparent outline-none text-[13px]
                          placeholder:text-[var(--stroke-strong)] dark:placeholder:text-[#4A4B4B]
                          ${row.is_done
                            ? 'text-[var(--text-sub)] line-through dark:text-[var(--text-sub)]'
                            : 'text-[var(--text-sub)] dark:text-[var(--text-sub)]'}`}
                      />

                      {/* O'chirish — bo'sh add qatorida ko'rsatilmaydi */}
                      {!isEmptyAdd && (
                        <button
                          type="button"
                          onClick={() => removeSubtask(row.key)}
                          className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-500/10 transition-all cursor-pointer shrink-0"
                          title="O'chirish"
                        >
                          <FaTrash className="text-red-500" size={11} />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Muddat — scroll tashqarisida, yuqoriga ochiladi (klip bo'lmaydi, scroll chiqmaydi) */}
          <div className="px-7 pt-3 pb-1 shrink-0">
            <label className="block text-[12px] font-semibold text-[var(--text-sub)] dark:text-[var(--text-sub)] mb-1.5 ml-1">
              Muddat
            </label>
            <DateTimeBox
              type="date"
              placeholder="Sana tanlash"
              value={deadline}
              onChange={v => { setDeadline(v); markDirty() }}
              dropUp
            />
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-end gap-3 px-7 py-5 shrink-0 border-t border-[var(--stroke-soft)] dark:border-[var(--stroke-soft)]">
            <button
              onClick={handleClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer
                text-[var(--text-sub)] hover:bg-[var(--bg-elevation-1)] dark:text-[var(--text-soft)] dark:hover:bg-[var(--bg-elevation-2)] transition-colors"
            >
              <FaXmark size={13} />
              Bekor qilish
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !title.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer
                bg-[var(--accent-strong)] text-white hover:bg-[#4A65D8] transition-colors
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              ) : (
                <FaRegBookmark size={13} />
              )}
              {isEdit ? 'Saqlash' : "Vazifa qo'shish"}
            </button>
          </div>
        </div>
      </div>
      {showDiscard && (
        <DiscardModal onCancel={() => setShowDiscard(false)} onConfirm={onClose} />
      )}
    </>
  )
}
