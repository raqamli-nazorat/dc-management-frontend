import { useState } from 'react'
import { FaArrowLeft, FaRegStar, FaStar, FaXmark } from 'react-icons/fa6'
import { FaRegBookmark } from 'react-icons/fa6'

const COLORS = [
  { id: 'red',    hex: '#FF2E2E' },
  { id: 'yellow', hex: '#FFD200' },
  { id: 'green',  hex: '#15B036' },
  { id: 'blue',   hex: '#005FF9' },
]

export default function AddTaskModal({ onClose, onAdd }) {
  const [title, setTitle] = useState('')
  const [subtasks, setSubtasks] = useState(['', '', '', '', ''])
  const [selectedColor, setSelectedColor] = useState('blue')
  const [isStarred, setIsStarred] = useState(false)

  /* Subtask matnini yangilash; oxirgi bo'sh bo'lmasa yangi qator qo'shish */
  const handleSubtaskChange = (value, index) => {
    const updated = [...subtasks]
    updated[index] = value
    if (index === updated.length - 1 && value.trim() !== '') {
      updated.push('')
    }
    setSubtasks(updated)
  }

  const handleSubmit = () => {
    const filteredSubs = subtasks.filter(s => s.trim() !== '')
    const newTask = {
      id: Date.now(),
      date: new Date().toLocaleDateString('uz-UZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      color: selectedColor,
      title: title.trim() || 'Yangi vazifa',
      status: 'Bajarildi',
      subtasks: filteredSubs.map((s, i) => ({ id: i + 1, text: s, done: false })),
    }
    onAdd(newTask)
    onClose()
  }

  return (
    /* Overlay */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-[640px] bg-white dark:bg-[#1C1D1D] rounded-[32px] shadow-2xl flex flex-col p-8 animate-in zoom-in-95 duration-200">

        {/* ── Header ── */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A] transition-colors cursor-pointer"
              >
                <FaArrowLeft className="text-[#1A1D2E] dark:text-white" size={18} />
              </button>
              <h2 className="text-[22px] font-bold text-[#1A1D2E] dark:text-white">
                Vazifa qo'shish
              </h2>
            </div>
            <p className="text-[14px] text-[#8F95A8] dark:text-[#8E95B5] mt-1 ml-10">
              O'zingiz uchun vazifa yarating.
            </p>
          </div>

          {/* Yulduz tugmasi */}
          <button
            onClick={() => setIsStarred(s => !s)}
            className="w-11 h-11 flex items-center justify-center rounded-2xl
              bg-[#F8F9FC] dark:bg-[#222323]
              border border-[#F1F3F9] dark:border-[#292A2A]
              text-[#3F57B3] hover:opacity-80 transition-opacity cursor-pointer"
          >
            {isStarred ? <FaStar size={20} /> : <FaRegStar size={20} />}
          </button>
        </div>

        {/* ── Form tanasi ── */}
        <div className="flex gap-5 mb-10">
          {/* Vazifa nomi + subtasklar */}
          <div className="flex-1 bg-[#F8F9FC] dark:bg-[#222323] rounded-[24px] p-6 flex flex-col gap-4 border border-[#F1F3F9] dark:border-[#2A2B2B]">
            <input
              type="text"
              placeholder="Vazifa nomi"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-transparent outline-none text-[15px] font-bold
                text-[#1A1D2E] dark:text-white
                placeholder:text-[#B6BCCB] dark:placeholder:text-[#474848]"
            />

            <div className="flex flex-col gap-4 mt-1">
              {subtasks.map((sub, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-[22px] h-[22px] rounded-full bg-[#E2E6F2] dark:bg-[#3A3B3B] shrink-0" />
                  <input
                    type="text"
                    value={sub}
                    onChange={e => handleSubtaskChange(e.target.value, i)}
                    placeholder=""
                    className="flex-1 bg-transparent outline-none text-[13px]
                      text-[#5B6078] dark:text-[#C2C8E0]
                      placeholder:text-[#D0D5E2] dark:placeholder:text-[#4A4B4B]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Rang tanlash */}
          <div className="flex flex-col gap-4 items-center pt-1 shrink-0">
            {COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedColor(c.id)}
                className="w-11 h-11 rounded-full flex items-center justify-center
                  transition-transform hover:scale-110 cursor-pointer shadow-sm"
                style={{
                  backgroundColor: c.hex,
                  outline: selectedColor === c.id
                    ? `3px solid ${c.hex}`
                    : 'none',
                  outlineOffset: selectedColor === c.id ? '3px' : '0',
                  boxShadow: selectedColor === c.id
                    ? `0 0 0 2px white, 0 0 0 4px ${c.hex}`
                    : '0 2px 6px rgba(0,0,0,0.15)',
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-3.5 rounded-[16px] font-bold cursor-pointer
              text-[#1A1D2E] dark:text-white
              hover:bg-[#F1F3F9] dark:hover:bg-[#292A2A] transition-colors"
          >
            <FaXmark size={14} />
            Bekor qilish
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-8 py-3.5 rounded-[16px] font-bold cursor-pointer
              bg-[#3F57B3] text-white hover:bg-[#4A65D8] transition-colors
              shadow-lg shadow-[#3F57B3]/20"
          >
            <FaRegBookmark size={14} />
            Vazifa qo'shish
          </button>
        </div>
      </div>
    </div>
  )
}
