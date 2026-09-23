import { useState, useRef, useEffect } from 'react'
import { FaXmark, FaMagnifyingGlass } from 'react-icons/fa6'
import { ALL_EMOJIS, getAppleEmojiUrl } from '../data/stickerData'

export default function StickerPicker({
  isOpen,
  onClose,
  onSelectEmoji,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const pickerRef = useRef(null)

  // Close on outside click or Escape
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose?.()
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const query = searchQuery.toLowerCase().trim()

  const filteredEmojis = query
    ? ALL_EMOJIS.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.char.includes(query)
      )
    : ALL_EMOJIS

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-16 right-0 left-0 mx-2 sm:mx-0 z-50 bg-white dark:bg-[#121620] border border-slate-200/90 dark:border-white/10 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col h-[320px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 select-none"
    >
      {/* Search Header */}
      <div className="p-3 pb-2 border-b border-slate-100 dark:border-white/5 shrink-0 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#181C24] border border-slate-200/60 dark:border-white/5 text-xs">
          <FaMagnifyingGlass className="text-slate-400 dark:text-slate-500 text-[11px] shrink-0" />
          <input
            type="text"
            placeholder="Emojilarni qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none w-full text-xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <FaXmark size={11} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer transition-colors shrink-0"
          title="Yopish"
        >
          <FaXmark size={13} />
        </button>
      </div>

      {/* Emojis Grid */}
      <div
        className="flex-1 overflow-y-auto p-3"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#94A3B8 transparent' }}
      >
        <div className="grid grid-cols-7 sm:grid-cols-8 gap-2">
          {filteredEmojis.length > 0 ? (
            filteredEmojis.map((item) => (
              <button
                key={`${item.code}-${item.char}`}
                type="button"
                onClick={() => onSelectEmoji?.(item)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center p-1 hover:bg-blue-50 dark:hover:bg-white/10 hover:scale-125 active:scale-95 cursor-pointer transition-all duration-150 text-xl"
                title={item.name}
              >
                <img
                  src={getAppleEmojiUrl(item.code)}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-contain pointer-events-none drop-shadow-xs"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    if (e.currentTarget.nextElementSibling) {
                      e.currentTarget.nextElementSibling.style.display = 'inline-block'
                    }
                  }}
                />
                <span style={{ display: 'none' }} className="select-none pointer-events-none text-xl leading-none">
                  {item.char}
                </span>
              </button>
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              Emoji topilmadi
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
