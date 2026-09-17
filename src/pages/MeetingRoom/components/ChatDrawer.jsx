import { useState, useRef, useEffect } from 'react'
import { FaRegFaceSmile, FaXmark } from 'react-icons/fa6'
import { Message01Icon, SentIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import StickerPicker from './StickerPicker'

import { ALL_EMOJIS, getAppleEmojiUrl } from '../data/stickerData'

const EMOJI_MAP = new Map()
ALL_EMOJIS.forEach((item) => {
  if (item.char && item.code) {
    EMOJI_MAP.set(item.char, item.code)
    const cleanChar = item.char.replace(/\uFE0F/g, '')
    if (cleanChar !== item.char) {
      EMOJI_MAP.set(cleanChar, item.code)
    }
  }
})

const IS_EMOJI_REGEX = /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u

const getAppleCodeFromChar = (char) => {
  if (EMOJI_MAP.has(char)) return EMOJI_MAP.get(char)
  const clean = char.replace(/\uFE0F/g, '')
  if (EMOJI_MAP.has(clean)) return EMOJI_MAP.get(clean)

  const points = []
  for (let i = 0; i < char.length; i++) {
    const cp = char.codePointAt(i)
    if (cp) {
      if (cp > 0xffff) i++
      if (cp !== 0xfe0f && cp !== 0xfe0e) {
        points.push(cp.toString(16))
      }
    }
  }
  return points.join('-')
}

export const renderMessageContent = (text) => {
  if (!text || typeof text !== 'string') return text

  let segments = []
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
    segments = Array.from(segmenter.segment(text), (s) => s.segment)
  } else {
    segments = Array.from(text)
  }

  const result = []
  let buffer = ''

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (IS_EMOJI_REGEX.test(seg) || EMOJI_MAP.has(seg)) {
      if (buffer) {
        result.push(buffer)
        buffer = ''
      }
      const code = getAppleCodeFromChar(seg)
      result.push(
        <img
          key={`emoji-${i}`}
          src={getAppleEmojiUrl(code)}
          alt={seg}
          loading="lazy"
          className="inline-block w-[1.3em] h-[1.3em] align-[-0.22em] mx-0.5 object-contain select-none"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      )
    } else {
      buffer += seg
    }
  }

  if (buffer) {
    result.push(buffer)
  }

  return result
}



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
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false)
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

  const editorRef = useRef(null)

  const getEditorText = () => {
    const el = editorRef.current
    if (!el) return ''
    let result = ''
    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.tagName === 'IMG' && node.dataset?.emoji) {
          result += node.dataset.emoji
        } else if (node.tagName === 'BR') {
          result += '\n'
        } else if (node.tagName === 'DIV' || node.tagName === 'P') {
          if (result.length > 0 && !result.endsWith('\n')) result += '\n'
          node.childNodes.forEach(walk)
        } else {
          node.childNodes.forEach(walk)
        }
      }
    }
    walk(el)
    return result
  }

  const handleEditorInput = () => {
    const currentText = getEditorText()
    setText(currentText)

    if (onTyping) {
      if (currentText.trim()) {
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

  const handleEditorKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = (e) => {
    e?.preventDefault()
    const msgText = getEditorText().trim()
    if (!msgText) return
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    onTyping?.(false)
    onSendMessage(msgText)
    if (editorRef.current) editorRef.current.innerHTML = ''
    setText('')
    setIsStickerPickerOpen(false)
  }

  const handleSelectEmoji = (item) => {
    const el = editorRef.current
    if (!el) return

    el.focus()
    const sel = window.getSelection()
    let range
    if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
      range = sel.getRangeAt(0)
    } else {
      range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
    }

    const emojiChar = typeof item === 'object' ? item.char : item
    const emojiCode =
      typeof item === 'object'
        ? item.code
        : EMOJI_MAP.get(item) || (item?.codePointAt(0) ? item.codePointAt(0).toString(16) : '1f600')

    const img = document.createElement('img')
    img.src = getAppleEmojiUrl(emojiCode)
    img.alt = emojiChar
    img.dataset.emoji = emojiChar
    img.className = 'inline-block w-5 h-5 align-[-3px] mx-0.5 select-none pointer-events-none drop-shadow-xs'

    range.deleteContents()
    range.insertNode(img)

    // Position caret immediately after the inserted image
    range.setStartAfter(img)
    range.setEndAfter(img)
    sel.removeAllRanges()
    sel.addRange(range)

    handleEditorInput()
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
        <div className="w-full sm:w-[308px] md:w-[320px] h-full flex flex-col shrink-0 relative">
          {/* Header */}
          <div className="flex items-center justify-between shrink-0 pb-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white select-none">
                Chat
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-[#3E5CBA] dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/30">
                Jonli
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer transition-colors"
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
            {messages.length === 0 && (!typingUsers || typingUsers.length === 0) ? (
              /* Empty State matching Figma */
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto select-none">
                <div className="text-slate-400 dark:text-slate-500 mb-2">
                  <HugeiconsIcon icon={Message01Icon} size={36} strokeWidth={1.8} />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Hali xabar yo'q
                </h4>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Uchrashuv davomida stiker va xabarlar yozishingiz mumkin
                </p>
              </div>
            ) : (
              /* Messages List matching Figma */
              <div className="space-y-3.5 py-1">
                {messages.map((m, idx) => {
                  const isMe = m.sender === currentUserName || m.isMe
                  const isStickerMsg = m.isSticker || !!m.sticker
                  const stickerData = typeof m.sticker === 'object' ? m.sticker : { url: m.sticker, name: 'Stiker' }

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

                      {/* Message Content: Sticker or Text Bubble */}
                      {isStickerMsg ? (
                        <div className="p-1 flex flex-col items-center">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl flex items-center justify-center">
                            <img
                              src={stickerData.url}
                              alt={stickerData.name || 'Stiker'}
                              loading="lazy"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                if (e.currentTarget.nextElementSibling) {
                                  e.currentTarget.nextElementSibling.style.display = 'flex'
                                }
                              }}
                            />
                            <span
                              style={{ display: 'none' }}
                              className="text-4xl items-center justify-center"
                            >
                              {stickerData.fallback || '✨'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Standard Text Bubble — for all text including single emojis */
                        <div
                          className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm break-words leading-relaxed ${
                            isMe
                              ? 'bg-[#3E5CBA] dark:bg-[#2D3958] text-white rounded-tr-xs shadow-xs'
                              : 'bg-[#F0F3F7] dark:bg-[#181C24] text-slate-900 dark:text-white rounded-tl-xs'
                          }`}
                        >
                          {renderMessageContent(m.text)}
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Instagram Direct Style Typing Bubble */}
                {typingUsers && typingUsers.length > 0 && (
                  <div className="flex flex-col items-start space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-1.5 px-1">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {typingUsers.length === 1
                          ? typingUsers[0]
                          : typingUsers.length === 2
                          ? `${typingUsers[0]}, ${typingUsers[1]}`
                          : `${typingUsers.length} ishtirokchi`}
                      </span>
                    </div>

                    {/* Instagram-style 3 bouncing dots message bubble */}
                    <div className="inline-flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-xs bg-[#F0F3F7] dark:bg-[#181C24] border border-slate-200/50 dark:border-white/5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-300 animate-[bounce_1.2s_infinite_ease-in-out_0s]" />
                      <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-300 animate-[bounce_1.2s_infinite_ease-in-out_0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-300 animate-[bounce_1.2s_infinite_ease-in-out_0.4s]" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Emoji Picker Popup */}
          <StickerPicker
            isOpen={isStickerPickerOpen}
            onClose={() => setIsStickerPickerOpen(false)}
            onSelectEmoji={handleSelectEmoji}
          />

          {/* Message Input matching Figma capsule */}
          <form onSubmit={handleSend} className="pt-2 mt-auto shrink-0 relative">
            <div className="flex items-center gap-2 px-3 py-2 sm:py-2.5 rounded-2xl border border-slate-200/90 dark:border-white/10 bg-transparent focus-within:border-blue-500/50 dark:focus-within:border-blue-500/50 transition-all">
              {/* iPhone Sticker / Emoji Toggle Button */}
              <button
                type="button"
                onClick={() => setIsStickerPickerOpen((prev) => !prev)}
                className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isStickerPickerOpen
                    ? 'bg-blue-100 dark:bg-[#2D3958] scale-110 shadow-xs ring-2 ring-blue-500/30'
                    : 'hover:bg-slate-100 dark:hover:bg-white/10 opacity-80 hover:opacity-100 hover:scale-105'
                }`}
              >
                <FaRegFaceSmile />
              </button>

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onKeyDown={handleEditorKeyDown}
                onBlur={() => {
                  if (onTyping) onTyping(false)
                }}
                data-placeholder="Xabar yozing..."
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white outline-none min-w-0 max-h-24 overflow-y-auto leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:dark:text-slate-500 empty:before:pointer-events-none"
              />

              <button
                type="submit"
                disabled={!text.trim()}
                className="flex items-center justify-center text-[#4C6EF5] hover:text-blue-600 dark:text-[#5B7BF0] dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all active:scale-90 shrink-0 p-1"
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

