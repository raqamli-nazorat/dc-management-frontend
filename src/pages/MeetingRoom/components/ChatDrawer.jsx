import { useState, useRef, useEffect } from 'react'
import { FaXmark, FaPaperPlane } from 'react-icons/fa6'

export default function ChatDrawer({ isOpen, onClose, messages = [], onSendMessage, currentUserName = '' }) {
  const [text, setText] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSend = (e) => {
    e?.preventDefault()
    if (!text.trim()) return
    onSendMessage(text.trim())
    setText('')
  }

  if (!isOpen) return null

  return (
    <div className="w-full sm:w-[360px] h-full flex flex-col bg-[#1A1D24] border-l border-white/10 shadow-2xl z-30 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div>
          <h3 className="text-base font-bold text-white">Yig'ilish Chati</h3>
          <p className="text-xs text-slate-400">Xabarlar faqat joriy yig'ilish davomida ko'rinadi</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition-colors"
        >
          <FaXmark size={14} />
        </button>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-500 mb-3">
              <FaPaperPlane size={18} />
            </div>
            <p className="text-sm font-medium">Hozircha xabarlar yo'q</p>
            <p className="text-xs text-slate-500 mt-1">Yig'ilishdagi birinchi xabarni yozing!</p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.sender === currentUserName
            return (
              <div
                key={idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-baseline gap-2 mb-1 px-1">
                  <span className="text-xs font-semibold text-slate-300">
                    {isMe ? 'Siz' : m.sender}
                  </span>
                  <span className="text-[10px] text-slate-500">{m.time}</span>
                </div>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm break-words leading-relaxed
                    ${isMe
                      ? 'bg-blue-600 text-white rounded-br-xs shadow-md shadow-blue-600/20'
                      : 'bg-[#282C35] text-slate-100 rounded-bl-xs border border-white/5'
                    }`}
                >
                  {m.text}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-[#16181E]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Xabar yozing..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#232730] border border-white/10 text-white placeholder-slate-400 text-sm outline-none focus:border-blue-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer transition-all shadow-md shadow-blue-600/25 shrink-0"
          >
            <FaPaperPlane size={14} />
          </button>
        </div>
      </form>
    </div>
  )
}
