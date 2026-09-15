import { useState, useRef, useEffect } from 'react'
import { FaXmark } from 'react-icons/fa6'
import { Comment01Icon, Message01Icon, SentIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const formatMessageTime = (timeStr) => {
  if (!timeStr) return ''
  const str = String(timeStr).trim()
  if (/^\d{2}:\d{2}$/.test(str)) {
    return str
  }
  if (/^\d{1}:\d{2}$/.test(str)) {
    return `0${str}`
  }
  try {
    const isAmPm = /am|pm/i.test(str)
    const baseDateStr = isAmPm ? `1970-01-01 ${str}` : (str.includes('T') ? str : `1970-01-01T${str}`)
    const parsed = new Date(baseDateStr)
    if (!isNaN(parsed.getTime())) {
      const hh = String(parsed.getHours()).padStart(2, '0')
      const mm = String(parsed.getMinutes()).padStart(2, '0')
      return `${hh}:${mm}`
    }
  } catch {}
  return str
}

export default function ChatDrawer({
  isOpen,
  onClose,
  messages = [],
  onSendMessage,
  currentUserName = '',
  typingUsers = [],
  onTyping = null,
}) {
  const [text, setText] = useState('')
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, typingUsers])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  const handleInputChange = (e) => {
    const val = e.target.value
    setText(val)

    if (onTyping) {
      if (val.trim()) {
        onTyping(true)
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false)
        }, 2500)
      } else {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        onTyping(false)
      }
    }
  }

  const handleSend = (e) => {
    e?.preventDefault()
    if (!text.trim()) return
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    onTyping?.(false)
    onSendMessage(text.trim())
    setText('')
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/50 backdrop-blur-xs z-30 sm:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Chat Drawer Panel matching Figma screenshots */}
      <div
        className={`fixed sm:relative top-0 right-0 bottom-0 sm:top-auto sm:right-auto sm:bottom-auto h-full rounded-none sm:rounded-3xl bg-white dark:bg-[#0B0D11] shadow-[0_10px_35px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)] flex flex-col shrink-0 z-40 sm:z-auto overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] ${
          isOpen
            ? 'w-full sm:w-[340px] md:w-[360px] opacity-100 pointer-events-auto sm:ml-3 md:ml-4 p-4 sm:p-5 translate-x-0 border-l sm:border border-slate-200/90 dark:border-white/10'
            : 'w-0 opacity-0 pointer-events-none sm:ml-0 p-0 translate-x-full sm:translate-x-0 border-0'
        }`}
      >
        <div className="w-full sm:w-[308px] md:w-[320px] h-full flex flex-col shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 pb-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white select-none">
              Chat
            </h3>
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <HugeiconsIcon icon={Message01Icon} size={20} strokeWidth={2} />
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition-colors sm:hidden"
                title="Yopish"
              >
                <FaXmark size={14} />
              </button>
            </div>
          </div>

          {/* Informational Callout matching Figma */}
          <div className="mt-3.5 mb-3 p-3 sm:p-3.5 rounded-2xl bg-[#F0F3F7] dark:bg-[#181C24] shrink-0 select-none">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Xabarlar uchrashuv tugagach o'chiriladi. Keyin qo'shilganlar eski xabarlarni ko'rmaydi.
            </p>
          </div>

          {/* Messages List or Empty State */}
          <div
            className="flex-1 overflow-y-auto min-h-0 flex flex-col pr-1 select-text"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#94A3B8 transparent' }}
          >
            {messages.length === 0 ? (
              /* Empty State matching Figma */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto select-none">
                <div className="text-slate-400 dark:text-slate-500 mb-2">
                  <HugeiconsIcon icon={Message01Icon} size={36} strokeWidth={1.8} />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Hali xabar yo'q
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Uchrashuv davomida yozishingiz mumkin
                </p>
              </div>
            ) : (
              /* Messages List matching Figma */
              <div className="space-y-3.5 py-1">
                {messages.map((m, idx) => {
                  const isMe = m.sender === currentUserName || m.isMe
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {/* Name + Time */}
                      <div className="flex items-center gap-1.5 px-1 mb-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {isMe ? 'Siz' : (m.sender || 'Ishtirokchi')}
                        </span>
                        {m.time && (
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-normal tabular-nums">
                            {formatMessageTime(m.time)}
                          </span>
                        )}
                      </div>

                      {/* Bubble */}
                      <div
                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm break-words leading-relaxed ${
                          isMe
                            ? 'bg-[#3E5CBA] dark:bg-[#2D3958] text-white rounded-tr-xs shadow-xs'
                            : 'bg-[#F0F3F7] dark:bg-[#181C24] text-slate-900 dark:text-white rounded-tl-xs'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Typing Indicator (Google Meet style) */}
          {typingUsers && typingUsers.length > 0 && (
            <div className="flex items-center gap-2 px-2 pt-2 text-xs text-slate-500 dark:text-slate-400 animate-in fade-in slide-in-from-bottom-1 duration-200 select-none shrink-0">
              <div className="flex items-center gap-1 bg-[#F0F3F7] dark:bg-[#1C212D] px-2.5 py-1 rounded-full border border-slate-200/80 dark:border-white/10 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3E5CBA] dark:bg-[#5B7BF0] animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#3E5CBA] dark:bg-[#5B7BF0] animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#3E5CBA] dark:bg-[#5B7BF0] animate-bounce" />
              </div>
              <span className="truncate font-medium italic">
                {typingUsers.length === 1
                  ? `${typingUsers[0]} yozmoqda...`
                  : typingUsers.length === 2
                  ? `${typingUsers[0]} va ${typingUsers[1]} yozmoqdalar...`
                  : `${typingUsers.length} kishi yozmoqda...`}
              </span>
            </div>
          )}

          {/* Message Input matching Figma capsule */}
          <form onSubmit={handleSend} className="pt-2 mt-auto shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-transparent focus-within:border-blue-500/50 dark:focus-within:border-blue-500/50 transition-all">
              <input
                type="text"
                value={text}
                onChange={handleInputChange}
                onBlur={() => {
                  if (onTyping) onTyping(false)
                }}
                placeholder="Xabar yozing"
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="flex items-center justify-center text-[#4C6EF5] hover:text-blue-600 dark:text-[#5B7BF0] dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-90 shrink-0"
                title="Yuborish"
              >
                <HugeiconsIcon icon={SentIcon} size={20} strokeWidth={2} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
