import { useState, useRef, useEffect } from 'react'
import { FaXmark, FaPaperPlane } from 'react-icons/fa6'
import { RiInformationLine } from 'react-icons/ri'
import { TbMessageCircle } from 'react-icons/tb'

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

  const getAvatarGradient = (name = '') => {
    const gradients = [
      'bg-[#1a73e8]',
      'bg-[#1e8e3e]',
      'bg-[#9334e6]',
      'bg-[#007b83]',
      'bg-[#e37400]',
      'bg-[#d93025]',
      'bg-[#d01884]',
      'bg-[#3949ab]',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return gradients[Math.abs(hash) % gradients.length]
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-30 sm:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed sm:relative top-0 right-0 bottom-0 h-full flex flex-col bg-[#202124] shadow-2xl z-40 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] ${
          isOpen
            ? 'w-full sm:w-[380px] translate-x-0 opacity-100 pointer-events-auto border-l border-[#3c4043]'
            : 'w-0 translate-x-full sm:translate-x-0 sm:w-0 opacity-0 pointer-events-none border-l-0'
        }`}
      >
        <div className="w-full sm:w-[380px] h-full flex flex-col shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#3c4043] bg-[#202124] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-500/10 text-[#8ab4f8] flex items-center justify-center border border-blue-500/20 shadow-sm">
                <TbMessageCircle size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white leading-tight">Yig'ilish Chati</h3>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 text-[10px] font-bold border border-blue-500/25">
                    Jonli
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Barcha qatnashchilar ko'ra oladi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer transition-all active:scale-90"
              title="Yopish"
            >
              <FaXmark size={14} />
            </button>
          </div>

          {/* Google Meet Style Informational Callout */}
          <div className="px-4 py-2.5 bg-[#18191c] border-b border-[#3c4043]/60 flex items-start gap-2.5 text-[11px] text-slate-400 shrink-0">
            <RiInformationLine size={16} className="text-[#8ab4f8] shrink-0 mt-0.5" />
            <p className="leading-snug">
              Xabarlar faqat qo'ng'iroqdagi qatnashuvchilarga ko'rinadi va yig'ilish yakunlangach o'chib ketadi.
            </p>
          </div>

          {/* Messages list */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#18191c]/50"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#3c4043 transparent' }}
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 my-auto">
                <div className="w-16 h-16 rounded-3xl bg-[#282a2d] border border-white/5 flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                  <FaPaperPlane size={22} className="text-[#8ab4f8]" />
                </div>
                <p className="text-sm font-bold text-white">Hozircha xabarlar yo'q</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[220px] leading-relaxed">
                  Barcha ishtirokchilarga ko'rinadigan birinchi xabarni yozing
                </p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isMe = m.sender === currentUserName
                const initials = m.sender
                  ? m.sender.trim().split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
                  : 'U'

                return (
                  <div
                    key={idx}
                    className={`flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                      isMe ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      {!isMe && (
                        <div
                          className={`w-4 h-4 rounded-full overflow-hidden ${getAvatarGradient(
                            m.sender
                          )} text-[9px] font-bold text-white flex items-center justify-center shrink-0`}
                        >
                          {m.avatar ? (
                            <img
                              src={m.avatar}
                              alt={m.sender || ''}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                          ) : (
                            initials
                          )}
                        </div>
                      )}
                      <span className="text-[11px] font-semibold text-slate-300">
                        {isMe ? 'Siz' : m.sender}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{m.time}</span>
                    </div>

                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm break-words leading-relaxed shadow-md transition-all ${
                        isMe
                          ? 'bg-gradient-to-r from-[#1a73e8] to-[#1557b0] text-white rounded-tr-xs shadow-blue-600/20'
                          : 'bg-[#303134] text-slate-100 rounded-tl-xs border border-[#3c4043]'
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
          <form onSubmit={handleSend} className="p-3.5 border-t border-[#3c4043] bg-[#202124] shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[#303134] border border-[#5f6368]/40 focus-within:border-[#8ab4f8] focus-within:ring-2 focus-within:ring-[#8ab4f8]/20 transition-all">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Xabar yozing..."
                className="flex-1 py-1.5 bg-transparent text-white placeholder-slate-400 text-sm outline-none"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-90 shadow-sm shrink-0 font-bold"
                title="Yuborish"
              >
                <FaPaperPlane size={12} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
